import {
  parseColor,
  backgroundColor,
  parseBackgroundImageUrl,
  parseBackgroundSize,
  parseBackgroundPosition,
  parseLength,
  toSlider,
  parseBox,
  parseGap,
  parseBorder,
  fontFamily,
  fontWeight,
  splitTopLevel,
} from './css/values.js';

// Phase 2 — translate computed CSS declarations into Elementor style controls.
// Each widget type declares where its color goes, which typography group
// prefix it uses, etc. Control IDs verified against the knowledge base and
// the Elementor source (button/container come from PHP traits/elements not
// captured by the static analyzer — see plan.md).

const TEXT_TRANSFORMS = new Set(['uppercase', 'lowercase', 'capitalize', 'none']);
const FONT_STYLES = new Set(['normal', 'italic', 'oblique']);
const TEXT_DECORATIONS = new Set(['underline', 'overline', 'line-through', 'none']);
const ALIGNS = new Set(['left', 'center', 'right', 'justify']);
const FLEX_DIRECTIONS = new Set(['row', 'column', 'row-reverse', 'column-reverse']);
const JUSTIFY = new Set(['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']);
const ALIGN_ITEMS = new Set(['flex-start', 'center', 'flex-end', 'stretch', 'baseline']);

// Build the typography group sub-settings for a given prefix (e.g. "typography").
function typographySettings(prefix, d) {
  const out = {};
  const set = (k, v) => {
    if (v !== null && v !== undefined) out[`${prefix}_${k}`] = v;
  };

  set('font_family', fontFamily(d['font-family']));
  set('font_size', toSlider(parseLength(d['font-size'])));
  set('font_weight', fontWeight(d['font-weight']));

  const style = (d['font-style'] || '').trim().toLowerCase();
  if (FONT_STYLES.has(style)) set('font_style', style);

  const transform = (d['text-transform'] || '').trim().toLowerCase();
  if (TEXT_TRANSFORMS.has(transform)) set('text_transform', transform);

  const decoration = (splitTopLevel((d['text-decoration'] || '').trim(), ' ')[0] || '').toLowerCase();
  if (TEXT_DECORATIONS.has(decoration)) set('text_decoration', decoration);

  set('line_height', toSlider(parseLength(d['line-height'], { unitlessAs: 'em' })));
  set('letter_spacing', toSlider(parseLength(d['letter-spacing'])));

  if (Object.keys(out).length > 0) out[`${prefix}_typography`] = 'custom';
  return out;
}

function textAlign(d) {
  const v = (d['text-align'] || '').trim().toLowerCase();
  return ALIGNS.has(v) ? v : null;
}

function backgroundSettings(d) {
  const color = backgroundColor(d.background || d['background-color']);
  if (!color) return {};
  return { background_background: 'classic', background_color: color };
}

function backgroundImageSettings(d) {
  const url =
    parseBackgroundImageUrl(d['background-image'])
    || parseBackgroundImageUrl(d.background);
  if (!url) return {};

  const out = {
    background_background: 'classic',
    background_image: { url, id: '' },
  };

  const size = parseBackgroundSize(d['background-size']);
  if (size) out.background_size = size;

  const position = parseBackgroundPosition(d['background-position']);
  if (position) out.background_position = position;

  const color = backgroundColor(d.background || d['background-color']);
  if (color) out.background_color = color;

  return out;
}

function containerBackgroundSettings(d) {
  const image = backgroundImageSettings(d);
  if (Object.keys(image).length > 0) return image;
  return backgroundSettings(d);
}

// display:flex + related properties -> Elementor flex group fields.
// options.requireDisplay: when false (responsive overrides), map flex-* /
// justify/align/gap even if `display:flex` is not repeated in the media query.
function flexSettings(d, { requireDisplay = true } = {}) {
  const display = (d.display || '').trim().toLowerCase();
  const hasFlexDisplay = display === 'flex' || display === 'inline-flex';
  const hasFlexProps = !!(
    d['flex-direction'] || d['justify-content'] || d['align-items'] || d['flex-wrap'] || d.gap
  );
  if (requireDisplay && !hasFlexDisplay) return {};
  if (!requireDisplay && !hasFlexDisplay && !hasFlexProps) return {};

  const out = {};

  const dir = (d['flex-direction'] || '').trim().toLowerCase();
  if (FLEX_DIRECTIONS.has(dir)) out.flex_direction = dir;

  const justify = (d['justify-content'] || '').trim().toLowerCase();
  if (JUSTIFY.has(justify)) out.flex_justify_content = justify;

  const align = (d['align-items'] || '').trim().toLowerCase();
  if (ALIGN_ITEMS.has(align)) out.flex_align_items = align;

  const wrap = (d['flex-wrap'] || '').trim().toLowerCase();
  if (wrap === 'wrap' || wrap === 'nowrap' || wrap === 'wrap-reverse') out.flex_wrap = wrap;

  const gap = parseGap(d.gap);
  if (gap) out.flex_gap = gap;

  return out;
}

function headingStyle(d) {
  const out = { ...typographySettings('typography', d) };
  const color = parseColor(d.color);
  if (color) out.title_color = color;
  const align = textAlign(d);
  if (align) out.align = align;
  return out;
}

function textEditorStyle(d) {
  const out = { ...typographySettings('typography', d) };
  const color = parseColor(d.color);
  if (color) out.text_color = color;
  const align = textAlign(d);
  if (align) out.align = align;
  return out;
}

// Group_Control_Border fields (prefix `border`): border_border (style),
// border_width (dimensions), border_color.
function borderSettings(d) {
  const b = parseBorder(d.border);
  if (!b) return {};
  const out = { border_border: b.style };
  if (b.width) {
    const w = String(b.width.size);
    out.border_width = { unit: b.width.unit, top: w, right: w, bottom: w, left: w, isLinked: true };
  }
  if (b.color) out.border_color = b.color;
  return out;
}

function buttonStyle(d) {
  const out = { ...typographySettings('typography', d) };
  const color = parseColor(d.color);
  if (color) out.button_text_color = color;
  // Always set an explicit background so the button doesn't fall back to
  // Elementor's default (green) global accent color. Transparent when the
  // source link has no background (e.g. nav links).
  const bg = backgroundColor(d.background || d['background-color']);
  out.background_background = 'classic';
  out.background_color = bg || 'rgba(0,0,0,0)';
  Object.assign(out, borderSettings(d));
  const padding = parseBox(d.padding);
  if (padding) out.text_padding = padding;
  const radius = parseBox(d['border-radius']);
  if (radius) out.border_radius = radius;
  // Elementor's button `align` centers the whole widget (like a parent
  // text-align:center wrapping an inline-block CTA in CSS).
  const align = textAlign(d);
  if (align) out.align = align;
  return out;
}

function iconListStyle(d) {
  const out = { ...typographySettings('icon_typography', d) };
  const color = parseColor(d.color);
  if (color) out.text_color = color;
  return out;
}

function imageStyle(d) {
  const out = {};
  const align = textAlign(d);
  if (align) out.align = align;
  return out;
}

// grid-template-columns/rows -> a fixed track count, or null if it can't be
// determined statically (auto-fit/auto-fill/minmax without a fixed repeat).
function gridTrackCount(raw) {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (!v || v === 'none') return null;
  const rep = v.match(/^repeat\(\s*(\d+)\s*,/);
  if (rep) return Number(rep[1]);
  if (/auto-fit|auto-fill|minmax|repeat/.test(v)) return null;
  const tracks = splitTopLevel(v, ' ').filter(Boolean);
  if (tracks.length >= 1 && tracks.length <= 12) return tracks.length;
  return null;
}

function gridSettings(d, { requireDisplay = true } = {}) {
  const display = (d.display || '').trim().toLowerCase();
  const hasGridDisplay = display === 'grid' || display === 'inline-grid';
  const hasGridProps = !!(d['grid-template-columns'] || d['grid-template-rows'] || d.gap);
  if (requireDisplay && !hasGridDisplay) return null;
  if (!requireDisplay && !hasGridDisplay && !hasGridProps) return null;

  const out = hasGridDisplay || !requireDisplay ? { container_type: 'grid' } : {};
  if (hasGridDisplay) out.container_type = 'grid';

  const cols = gridTrackCount(d['grid-template-columns']);
  if (cols) out.grid_columns_grid = { unit: 'fr', size: cols, sizes: [] };
  const rows = gridTrackCount(d['grid-template-rows']);
  if (rows) out.grid_rows_grid = { unit: 'fr', size: rows, sizes: [] };
  const gaps = parseGap(d.gap);
  if (gaps) out.grid_gaps = gaps;

  // Nothing useful mapped.
  if (!out.grid_columns_grid && !out.grid_rows_grid && !out.grid_gaps && !out.container_type) {
    return null;
  }
  return out;
}

function containerStyle(d, options = {}) {
  const out = {};
  Object.assign(out, containerBackgroundSettings(d));

  const padding = parseBox(d.padding);
  if (padding) out.padding = padding;
  const margin = parseBox(d.margin);
  if (margin) out.margin = margin;

  const minHeight = toSlider(parseLength(d['min-height']));
  if (minHeight) out.min_height = minHeight;

  const height = toSlider(parseLength(d.height));
  if (height && !minHeight) out.min_height = height;

  const width = toSlider(parseLength(d.width));
  if (width) {
    out.content_width = 'full';
    out.width = width;
  }

  const grid = gridSettings(d, options);
  if (grid) Object.assign(out, grid);
  else Object.assign(out, flexSettings(d, options));
  return out;
}

/** Apply a CSS linear-gradient veil as Elementor background overlay (approx). */
export function overlayFromGradient(raw) {
  if (!raw || !/gradient/i.test(raw)) return {};
  const colors = [...String(raw).matchAll(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]);
  if (!colors.length) return {};
  const angle = (String(raw).match(/(\d+)deg/) || [])[1];
  if (colors.length >= 2) {
    return {
      background_overlay_background: 'gradient',
      background_overlay_color: colors[0],
      background_overlay_color_b: colors[colors.length - 1],
      background_overlay_gradient_angle: { unit: 'deg', size: Number(angle) || 180, sizes: [] },
    };
  }
  return {
    background_overlay_background: 'classic',
    background_overlay_color: colors[0],
    background_overlay_opacity: { unit: 'px', size: 0.55, sizes: [] },
  };
}

// Controls that accept per-breakpoint (_tablet/_mobile) variants. Colors,
// font-family/weight/style/transform/decoration and the typography enabler
// are NOT responsive in Elementor and must stay desktop-only.
export function isResponsiveKey(key) {
  return (
    key === 'align'
    || /^(padding|margin|text_padding|border_radius|min_height|width|height)$/.test(key)
    || /(_font_size|_line_height|_letter_spacing|_word_spacing)$/.test(key)
    || /^flex_/.test(key)
    || /^grid_/.test(key)
    || /^(background_position|background_size)$/.test(key)
  );
}

const BUILDERS = {
  heading: headingStyle,
  'text-editor': textEditorStyle,
  button: buttonStyle,
  'icon-list': iconListStyle,
  image: imageStyle,
  container: containerStyle,
};

// Returns the Elementor style settings derived from CSS declarations `d`
// for the given element type ("container" or a widgetType).
// options.requireDisplay / options.partialGrid: when mapping responsive
// overrides, allow flex/grid props without a repeated `display` declaration.
export function styleSettingsFor(type, d, options = {}) {
  const builder = BUILDERS[type];
  if (!builder || !d) return {};
  if (type === 'container' && (options.requireDisplay === false || options.partialGrid)) {
    return containerStyle(d, { requireDisplay: false });
  }
  return builder(d);
}
