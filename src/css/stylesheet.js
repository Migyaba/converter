import { splitTopLevel, backgroundColor } from './values.js';

// Parses every <style> block into rules, resolves :root custom properties,
// and computes the effective declarations for any DOM element following a
// pragmatic subset of the CSS cascade (specificity + source order + inline).
//
// Phase 3 additions:
//  - @media (max-width) AND @media (min-width) are handled. Elementor is
//    desktop-first (*_tablet / *_mobile = smaller screens), while many HTML
//    pages are mobile-first (min-width upgrades). We resolve both by sampling
//    declarations at representative viewports and emitting diffs.
//  - CSS inheritance: inheritable properties (color, font-*, line-height,
//    letter-spacing, text-align, text-transform) not set on an element are
//    filled from the nearest ancestor that defines them.
//  - Stacked background: containers without an own solid background receive
//    the nearest ancestor's background-color (HTML shows body bg through
//    transparent sections; Elementor pages default to white without this).
//
// Still-simplified: compound queries (min AND max), orientation, and
// !important are ignored; pseudo-class/element selectors are skipped.

// Elementor default breakpoints: mobile <= 767px, tablet <= 1024px.
// Sampling widths used to resolve mobile-first + desktop-first CSS into those.
const VIEWPORT = {
  desktop: 1400,
  tablet: 800, // below common 900px max/min queries, within Elementor tablet
  mobile: 375,
};

const INHERITABLE = new Set([
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-align',
  'text-transform',
]);

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseDeclChunk(chunk, decls) {
  const idx = chunk.indexOf(':');
  if (idx === -1) return;
  const prop = chunk.slice(0, idx).trim().toLowerCase();
  const value = chunk.slice(idx + 1).trim();
  if (prop && value) decls[prop] = value;
}

function parseDeclarations(body) {
  const decls = {};
  let depth = 0;
  let start = 0;
  for (let i = 0; i <= body.length; i++) {
    const c = body[i];
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) {
      parseDeclChunk(body.slice(start, i), decls);
      start = i + 1;
    }
  }
  if (start < body.length) parseDeclChunk(body.slice(start), decls);
  return decls;
}

function specificity(selector) {
  let a = 0;
  let b = 0;
  let c = 0;
  let s = selector;
  a += (s.match(/#[\w-]+/g) || []).length;
  s = s.replace(/#[\w-]+/g, ' ');
  b += (s.match(/\.[\w-]+/g) || []).length;
  b += (s.match(/\[[^\]]*\]/g) || []).length;
  s = s.replace(/\.[\w-]+/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  c += (s.match(/\b[a-z][\w-]*/gi) || []).length;
  return a * 10000 + b * 100 + c;
}

// Classify a media query for Elementor breakpoint sampling.
// Returns null for unsupported queries (orientation, prefers-*, etc.).
function parseMediaQuery(query) {
  // Prefer simple single-feature queries; ignore compounds for now.
  const max = query.match(/max-width\s*:\s*(\d+)\s*px/i);
  const min = query.match(/min-width\s*:\s*(\d+)\s*px/i);
  if (max && min) return null;
  if (max) {
    const width = Number(max[1]);
    if (width <= 767) return { kind: 'max', bucket: 'mobile', width };
    if (width <= 1200) return { kind: 'max', bucket: 'tablet', width };
    return null;
  }
  if (min) {
    return { kind: 'min', width: Number(min[1]) };
  }
  return null;
}

// Brace-aware tokenizer: returns top-level style rules and @media blocks.
// Nested at-rules other than @media are skipped.
function tokenize(css) {
  const rules = [];
  const medias = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '@') {
      const atStart = i;
      while (i < n && css[i] !== '{' && css[i] !== ';') i++;
      const prelude = css.slice(atStart, i).trim();
      if (css[i] === ';') { i++; continue; }
      if (css[i] === '{') {
        i++; // consume '{'
        const bodyStart = i;
        let depth = 1;
        while (i < n && depth > 0) {
          if (css[i] === '{') depth++;
          else if (css[i] === '}') { depth--; if (depth === 0) break; }
          i++;
        }
        const body = css.slice(bodyStart, i);
        i++; // consume '}'
        if (/^@media/i.test(prelude)) medias.push({ query: prelude, body });
      }
      continue;
    }
    const selStart = i;
    while (i < n && css[i] !== '{' && css[i] !== '}') i++;
    if (css[i] !== '{') { i++; continue; }
    const selectorList = css.slice(selStart, i).trim();
    i++;
    const bodyStart = i;
    let depth = 1;
    while (i < n && depth > 0) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') { depth--; if (depth === 0) break; }
      i++;
    }
    const body = css.slice(bodyStart, i);
    i++;
    if (selectorList) rules.push({ selectorList, body });
  }
  return { rules, medias };
}

export function buildStylesheet($) {
  const cssText = $('style')
    .map((_, el) => $(el).text())
    .get()
    .join('\n');
  const css = stripComments(cssText);

  const vars = {};
  const orderRef = { value: 0 };

  // Turn tokenized {selectorList, body} pairs into flat rule records,
  // extracting :root variables along the way.
  function toRules(tokens) {
    const out = [];
    for (const { selectorList, body } of tokens) {
      const decls = parseDeclarations(body);
      if (selectorList === ':root' || selectorList.split(',').some((s) => s.trim() === ':root')) {
        for (const [k, v] of Object.entries(decls)) {
          if (k.startsWith('--')) vars[k] = v;
        }
        continue;
      }
      for (const sel of splitTopLevel(selectorList, ',')) {
        const selector = sel.trim();
        if (!selector || selector === '*' || selector.includes(':')) continue;
        out.push({ selector, decls, spec: specificity(selector), order: orderRef.value++ });
      }
    }
    return out;
  }

  const { rules: baseTokens, medias } = tokenize(css);
  const baseRules = toRules(baseTokens);

  const bpRules = { tablet: [], mobile: [] };
  const minWidthLayers = []; // [{ width, rules }], sorted ascending later
  for (const { query, body } of medias) {
    const info = parseMediaQuery(query);
    if (!info) continue;
    const { rules: innerTokens } = tokenize(body);
    const rules = toRules(innerTokens);
    if (info.kind === 'max') bpRules[info.bucket].push(...rules);
    else if (info.kind === 'min') minWidthLayers.push({ width: info.width, rules });
  }
  minWidthLayers.sort((a, b) => a.width - b.width);

  function resolveVars(value, depth = 0) {
    if (depth > 10 || !value.includes('var(')) return value;
    const replaced = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, name, fallback) => {
      if (vars[name] != null) return vars[name];
      return fallback != null ? fallback.trim() : '';
    });
    return resolveVars(replaced, depth + 1);
  }

  // node -> matching rules, per bucket.
  function indexRules(rules) {
    const map = new Map();
    for (const rule of rules) {
      let matched;
      try {
        matched = $(rule.selector).toArray();
      } catch {
        continue;
      }
      for (const node of matched) {
        if (!map.has(node)) map.set(node, []);
        map.get(node).push(rule);
      }
    }
    return map;
  }

  const nodeRules = {
    base: indexRules(baseRules),
    tablet: indexRules(bpRules.tablet),
    mobile: indexRules(bpRules.mobile),
  };
  const minWidthIndexed = minWidthLayers.map((layer) => ({
    width: layer.width,
    index: indexRules(layer.rules),
  }));

  function declsFromIndex(index, el) {
    const out = {};
    const matched = index.get(el) || [];
    const sorted = [...matched].sort((x, y) => x.spec - y.spec || x.order - y.order);
    for (const rule of sorted) {
      for (const [prop, value] of Object.entries(rule.decls)) {
        out[prop] = resolveVars(value);
      }
    }
    return out;
  }

  // Effective own declarations at a sampled viewport width.
  // Order: base → min-width layers (ascending, if width ≤ viewport) →
  //        max-width tablet bucket (if viewport ≤ 1200) →
  //        max-width mobile bucket (if viewport ≤ 767) →
  //        inline style (always, highest among author styles for base path).
  function declsAtViewport(el, viewportWidth, { includeInline = true } = {}) {
    const out = declsFromIndex(nodeRules.base, el);
    for (const layer of minWidthIndexed) {
      if (layer.width <= viewportWidth) {
        Object.assign(out, declsFromIndex(layer.index, el));
      }
    }
    if (viewportWidth <= 1200) {
      Object.assign(out, declsFromIndex(nodeRules.tablet, el));
    }
    if (viewportWidth <= 767) {
      Object.assign(out, declsFromIndex(nodeRules.mobile, el));
    }
    if (includeInline) {
      const inline = $(el).attr('style');
      if (inline) {
        for (const [prop, value] of Object.entries(parseDeclarations(inline))) {
          out[prop] = resolveVars(value);
        }
      }
    }
    return out;
  }

  // Own declarations for an element in a given bucket (legacy helper used by
  // stacked-background: desktop/base paint only).
  function ownDecls(el, bucket = 'base') {
    if (bucket === 'base') return declsAtViewport(el, VIEWPORT.desktop);
    if (bucket === 'tablet') return declsAtViewport(el, VIEWPORT.tablet, { includeInline: false });
    if (bucket === 'mobile') return declsAtViewport(el, VIEWPORT.mobile, { includeInline: false });
    return {};
  }

  function solidBackgroundColor(decls) {
    const fromProp = backgroundColor(decls['background-color']);
    if (fromProp && fromProp !== 'transparent') return fromProp;
    const fromShorthand = backgroundColor(decls.background);
    if (fromShorthand && fromShorthand !== 'transparent') return fromShorthand;
    return null;
  }

  // True when the element declares a background layer we should not override
  // by stacking (image, gradient, or an explicit solid/transparent color).
  function hasOwnBackground(decls) {
    const bg = decls.background || '';
    const bgColor = decls['background-color'] || '';
    const bgImage = decls['background-image'] || '';
    if (/url\s*\(|gradient/i.test(bg) || /url\s*\(|gradient/i.test(bgImage)) return true;
    if (bgColor && backgroundColor(bgColor)) return true;
    if (bg && backgroundColor(bg)) return true;
    return false;
  }

  function hasBackgroundImage(decls) {
    const bg = decls.background || '';
    const bgImage = decls['background-image'] || '';
    return /url\s*\(/i.test(bg) || /url\s*\(/i.test(bgImage);
  }

  // Nearest solid background-color visible through transparency (body, section…).
  // Used for containers only — widgets must not inherit a page background.
  // Skip when an ancestor already paints a background-image: stacking a solid
  // color on nested containers (e.g. .hp-inner) would cover the photo.
  function resolveStackedBackground(el) {
    const own = ownDecls(el, 'base');
    if (hasOwnBackground(own)) {
      const color = solidBackgroundColor(own);
      return color ? { 'background-color': color } : {};
    }
    for (const anc of $(el).parents().toArray()) {
      const ancDecls = ownDecls(anc, 'base');
      if (hasBackgroundImage(ancDecls)) return {};
      const color = solidBackgroundColor(ancDecls);
      if (color) return { 'background-color': color };
    }
    return {};
  }

  function withInheritance(el, own) {
    const out = { ...own };
    const ancestors = $(el).parents().toArray();
    for (const prop of INHERITABLE) {
      if (out[prop] !== undefined) continue;
      for (const anc of ancestors) {
        const av = declsAtViewport(anc, VIEWPORT.desktop)[prop];
        if (av !== undefined) {
          out[prop] = av;
          break;
        }
      }
    }
    return out;
  }

  // Desktop declarations (+ inherited fill for inheritable props).
  function computeStyle(el) {
    return withInheritance(el, declsAtViewport(el, VIEWPORT.desktop));
  }

  function diffDecls(desktop, other) {
    const out = {};
    for (const [prop, value] of Object.entries(other)) {
      if (desktop[prop] !== value) out[prop] = value;
    }
    // Props present on desktop (e.g. from min-width) but absent on smaller
    // viewports must be overridden by the smaller-viewport value when that
    // value comes from base — already in `other` via declsAtViewport.
    // Props only on desktop with no smaller value: Elementor keeps desktop
    // unless we demote. For mobile-first, base value is in `other` already.
    return out;
  }

  // Responsive overrides: sample tablet/mobile viewports and keep only diffs
  // vs desktop (so mobile-first min-width AND desktop-first max-width both work).
  function computeResponsive(el) {
    const desktop = declsAtViewport(el, VIEWPORT.desktop);
    const tablet = declsAtViewport(el, VIEWPORT.tablet, { includeInline: false });
    const mobile = declsAtViewport(el, VIEWPORT.mobile, { includeInline: false });
    return {
      tablet: diffDecls(desktop, tablet),
      mobile: diffDecls(desktop, mobile),
    };
  }

  return {
    vars,
    computeStyle,
    computeResponsive,
    resolveStackedBackground,
    resolveVars,
    ruleCount: baseRules.length,
    breakpointRuleCount: {
      tablet: bpRules.tablet.length,
      mobile: bpRules.mobile.length,
      minWidth: minWidthLayers.length,
    },
  };
}
