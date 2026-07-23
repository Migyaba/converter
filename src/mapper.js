import { generateId } from './id.js';
import {
  headingSettings,
  textEditorSettings,
  imageSettings,
  buttonSettings,
  iconListSettings,
  resolveImageSrc,
} from './widgets.js';
import { parseBackgroundImageUrl, parseGap, backgroundColor, parseBorder } from './css/values.js';
import { styleSettingsFor, isResponsiveKey, overlayFromGradient } from './style-map.js';

// A no-op style context: Phase 1 behaviour (structure only) when no
// stylesheet/validator is provided.
const NULL_CTX = {
  styleFor: () => ({}),
  backgroundImageUrl: () => '',
  tabletDecls: () => ({}),
  computeStyle: () => ({}),
  fallback: null,
};

// Ensures the typography group enabler is present whenever any typography
// sub-field (incl. responsive variants) was emitted, so responsive font sizes
// still apply when the desktop rule only set, say, letter-spacing.
function ensureTypographyEnablers(settings) {
  for (const prefix of ['typography', 'icon_typography']) {
    const enabler = `${prefix}_typography`;
    if (settings[enabler]) continue;
    if (Object.keys(settings).some((k) => k.startsWith(`${prefix}_`) && k !== enabler)) {
      settings[enabler] = 'custom';
    }
  }
}

// Builds the style context threaded through the mapper. `stylesheet` exposes
// computeStyle/computeResponsive; `validator` comes from the knowledge base.
export function createStyleContext(stylesheet, validator, fallback = null) {
  const { computeStyle, computeResponsive, resolveStackedBackground } = stylesheet;
  const warnings = [];
  let appliedCount = 0;
  return {
    warnings,
    fallback,
    get appliedCount() {
      return appliedCount;
    },
    computeStyle,
    styleFor(type, el) {
      let decls = computeStyle(el);
      if (type === 'container' && resolveStackedBackground) {
        decls = { ...decls, ...resolveStackedBackground(el) };
      }
      const settings = styleSettingsFor(type, decls);

      const responsive = computeResponsive(el);
      const isGridContainer = settings.container_type === 'grid';
      const isFlexContainer = !!(
        settings.flex_direction || settings.flex_justify_content || settings.flex_align_items || settings.flex_wrap || settings.flex_gap
      );
      for (const bp of ['tablet', 'mobile']) {
        const bpDecls = responsive[bp];
        if (!bpDecls || Object.keys(bpDecls).length === 0) continue;
        const bpSettings = styleSettingsFor(type, bpDecls, {
          // Media queries rarely repeat display:flex/grid — allow partial overrides.
          requireDisplay: false,
          partialGrid: type === 'container' && (isGridContainer || isFlexContainer),
        });
        // Don't re-emit container_type on breakpoints.
        delete bpSettings.container_type;
        for (const [key, value] of Object.entries(bpSettings)) {
          if (isResponsiveKey(key)) settings[`${key}_${bp}`] = value;
        }
      }

      ensureTypographyEnablers(settings);

      const { clean, warnings: w } = validator.validate(type, settings);
      if (w.length) warnings.push(...w);
      if (Object.keys(clean).length) appliedCount++;
      return clean;
    },
    backgroundImageUrl(el) {
      const d = computeStyle(el);
      return (
        parseBackgroundImageUrl(d['background-image'])
        || parseBackgroundImageUrl(d.background)
        || ''
      );
    },
    tabletDecls(el) {
      return computeResponsive(el).tablet || {};
    },
  };
}

function hasClass(el, name) {
  const cls = el.attribs?.class;
  if (!cls) return false;
  return cls.split(/\s+/).includes(name);
}

function classIncludes(el, fragment) {
  const cls = el.attribs?.class || '';
  return cls.toLowerCase().includes(fragment);
}

// `.embleme.reverse` uses CSS `order` on the photo column; Elementor grid
// cannot set order on image widgets, so use flex row-reverse on desktop and
// column on tablet when the source CSS stacks to one column.
function applyReverseGridLayout(settings, tabletDecls = {}) {
  if (settings.container_type !== 'grid' || settings.grid_columns_grid?.size !== 2) {
    return settings;
  }
  const out = { ...settings };
  const gap = out.grid_gaps;
  const gapTablet = out.grid_gaps_tablet;

  for (const key of Object.keys(out)) {
    if (key === 'container_type' || key.startsWith('grid_')) delete out[key];
  }

  out.flex_direction = 'row-reverse';
  out.flex_align_items = 'center';
  out.flex_wrap = 'nowrap';
  if (gap) out.flex_gap = gap;

  if (tabletDecls['grid-template-columns']) {
    out.flex_direction_tablet = 'column';
    out.flex_wrap_tablet = 'wrap';
    if (gapTablet) out.flex_gap_tablet = gapTablet;
    else {
      const tg = parseGap(tabletDecls.gap);
      if (tg) out.flex_gap_tablet = tg;
    }
  }

  return out;
}

// Elementor grid containers require an explicit row count. CSS usually only
// sets columns and auto-flows rows; without grid_rows_grid Elementor defaults
// to 1 row and clips / misplaces children. Derive rows from child count.
function ensureGridRows(settings, childCount) {
  if (settings.container_type !== 'grid' || childCount < 1) return settings;
  const out = { ...settings };

  function fill(suffix = '') {
    const colKey = `grid_columns_grid${suffix}`;
    const rowKey = `grid_rows_grid${suffix}`;
    const cols = out[colKey]?.size;
    if (!cols || cols < 1) return;
    const needed = Math.max(1, Math.ceil(childCount / cols));
    const existing = out[rowKey]?.size;
    if (!existing || existing < needed) {
      out[rowKey] = { unit: 'fr', size: needed, sizes: [] };
    }
  }

  fill('');
  fill('_tablet');
  fill('_mobile');
  return out;
}

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'meta', 'link', 'head']);
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
// Tags that never break a "text leaf" (pure inline formatting).
// `a` is included so a block that only wraps text + links can become one
// text-editor (nav, e-lien wrappers) instead of exploding into buttons.
const INLINE_TAGS = new Set(['br', 'em', 'strong', 'b', 'i', 'span', 'sub', 'sup', 'small', 'u', 'mark', 'a']);

function hasBlockDescendant($, el) {
  let found = false;
  $(el)
    .find('*')
    .each((_, child) => {
      if (!INLINE_TAGS.has(child.tagName.toLowerCase())) found = true;
    });
  return found;
}

function isTextLeaf($, el) {
  return !hasBlockDescendant($, el) && $(el).text().trim().length > 0;
}

function widgetNode(widgetType, settings) {
  return {
    id: generateId(),
    elType: 'widget',
    widgetType,
    settings,
    elements: [],
    isInner: false,
  };
}

function containerNode(settings, children) {
  return {
    id: generateId(),
    elType: 'container',
    settings,
    elements: children,
    isInner: false,
  };
}

function styledWidget(ctx, $, el, widgetType, contentSettings) {
  return widgetNode(widgetType, { ...contentSettings, ...ctx.styleFor(widgetType, el) });
}

// CTA / outlined button vs plain text link.
function looksLikeButton(ctx, el) {
  if (hasClass(el, 'cta') || hasClass(el, 'button') || hasClass(el, 'btn')) return true;
  if (hasClass(el, 'e-lien')) return false;
  const d = ctx.computeStyle?.(el) || {};
  const border = parseBorder(d.border);
  if (border && border.style && border.style !== 'none' && border.width && border.width.size > 0) return true;
  const bg = backgroundColor(d.background || d['background-color']);
  if (bg && bg !== 'transparent' && bg !== 'rgba(0,0,0,0)') return true;
  return false;
}

function linkAsTextEditor(ctx, $, el) {
  const href = $(el).attr('href') || '#';
  const inner = ($(el).html() || $(el).text() || '').trim();
  return styledWidget(ctx, $, el, 'text-editor', {
    editor: `<a href="${href}">${inner}</a>`,
  });
}

function extractVeilOverlay($, el, ctx) {
  const veil = $(el)
    .children()
    .toArray()
    .find((c) => classIncludes(c, 'veil'));
  if (!veil) return {};
  const d = ctx.computeStyle?.(veil) || {};
  const raw = d.background || d['background-image'] || '';
  return overlayFromGradient(raw);
}

function isVeilEl(el) {
  return classIncludes(el, 'veil');
}

function decorativeDivider(ctx, $, el) {
  const d = ctx.computeStyle?.(el) || {};
  const color =
    backgroundColor(d.background || d['background-color'])
    || '#c9a84c';
  const width = styleSettingsFor('container', d).width;
  return widgetNode('divider', {
    style: 'solid',
    color,
    weight: { unit: 'px', size: 1, sizes: [] },
    width: width || { unit: 'px', size: 120, sizes: [] },
    align: 'center',
    gap: { unit: 'px', size: 0, sizes: [] },
  });
}

function decorativeBar(ctx, $, el) {
  // Vertical rule / thin bar: empty container with bg + size.
  const settings = ctx.styleFor('container', el);
  if (!settings.background_color && !settings.background_image) {
    const d = ctx.computeStyle?.(el) || {};
    const raw = d.background || d['background-color'] || '';
    const color = backgroundColor(raw);
    if (color) {
      settings.background_background = 'classic';
      settings.background_color = color;
    } else if (/gradient/i.test(raw)) {
      // Approximate gradient rules with the brand gold midpoint.
      const gold = (raw.match(/#[0-9a-fA-F]{3,8}/) || [])[0] || '#c9a84c';
      settings.background_background = 'classic';
      settings.background_color = gold;
    }
  }
  if (!settings.min_height && !settings.width) return null;
  return containerNode(settings, []);
}

// Maps one DOM element to an Elementor element node, or null if it carries
// no content worth converting (decorative empty divs, script/style, etc.).
export function mapElement($, el, ctx = NULL_CTX) {
  const tag = el.tagName.toLowerCase();

  if (SKIP_TAGS.has(tag)) return null;
  if (isVeilEl(el)) return null; // folded into parent overlay

  if (HEADING_TAGS.has(tag)) {
    return styledWidget(ctx, $, el, 'heading', headingSettings($, el));
  }

  if (tag === 'img') {
    return styledWidget(ctx, $, el, 'image', imageSettings($, el));
  }

  if (tag === 'ul' || tag === 'ol') {
    return styledWidget(ctx, $, el, 'icon-list', iconListSettings($, el));
  }

  // Whole nav → one text-editor (keeps diamonds + horizontal flow).
  if (tag === 'nav') {
    return styledWidget(ctx, $, el, 'text-editor', {
      editor: ($(el).html() || '').trim(),
    });
  }

  if (tag === 'a') {
    if (looksLikeButton(ctx, el)) {
      return styledWidget(ctx, $, el, 'button', buttonSettings($, el));
    }
    return linkAsTextEditor(ctx, $, el);
  }

  if (tag === 'p') {
    return styledWidget(ctx, $, el, 'text-editor', textEditorSettings($, el));
  }

  const bgImage = resolveImageSrc($, el) || ctx.backgroundImageUrl(el);
  const hasElementChildren = $(el).children().length > 0;
  if (bgImage && !hasElementChildren) {
    return styledWidget(ctx, $, el, 'image', { image: { url: bgImage, id: '' } });
  }

  if (isTextLeaf($, el)) {
    return styledWidget(ctx, $, el, 'text-editor', textEditorSettings($, el));
  }

  if (!hasElementChildren) {
    // Decorative separators / rules.
    if (hasClass(el, 'sep') || classIncludes(el, 'separator')) {
      return decorativeDivider(ctx, $, el);
    }
    if (hasClass(el, 'rule') || classIncludes(el, 'divider')) {
      return decorativeBar(ctx, $, el) || decorativeDivider(ctx, $, el);
    }
    const bar = decorativeBar(ctx, $, el);
    if (bar) return bar;
    return null;
  }

  const children = $(el)
    .children()
    .toArray()
    .map((child) => mapElement($, child, ctx))
    .filter(Boolean);

  if (children.length === 0) {
    const text = $(el).text().trim();
    if (text && ctx.fallback) {
      const suggestion = ctx.fallback.resolve({ tag, text, html: $(el).html() || '', attrs: el.attribs || {} });
      if (suggestion) {
        return widgetNode(suggestion.widgetType, { ...suggestion.settings, ...ctx.styleFor(suggestion.widgetType, el) });
      }
    }
    return null;
  }

  let settings = ctx.styleFor('container', el);
  Object.assign(settings, extractVeilOverlay($, el, ctx));
  if (hasClass(el, 'reverse')) {
    settings = applyReverseGridLayout(settings, ctx.tabletDecls?.(el) || {});
  } else {
    settings = ensureGridRows(settings, children.length);
  }
  return containerNode(settings, children);
}

// Converts the <body> of a parsed document into the top-level `content`
// array expected by Elementor's template import format.
export function mapBodyToContent($, ctx = NULL_CTX) {
  return $('body')
    .children()
    .toArray()
    .map((el) => mapElement($, el, ctx))
    .filter(Boolean);
}
