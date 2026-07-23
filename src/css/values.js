// CSS value parsers — turn raw CSS declaration values into the shapes
// Elementor's controls expect. Every parser returns `null` when the value
// can't be safely/deterministically mapped, so callers can skip it.

const LENGTH_UNITS = ['px', 'em', 'rem', '%', 'vh', 'vw', 'vmin', 'vmax'];

// A single length token: "18px", "1.65", "-.5em", "clamp(36px,4.4vw,60px)".
// For clamp()/min()/max() we take the largest px value found (desktop-ish
// upper bound), falling back to the first numeric token.
export function parseLength(raw, { unitlessAs = null } = {}) {
  if (raw == null) return null;
  let value = String(raw).trim().toLowerCase();
  if (!value || value === 'auto' || value === 'inherit' || value === 'initial' || value === 'normal') {
    return null;
  }

  const fnMatch = value.match(/^(clamp|min|max)\s*\((.*)\)$/);
  if (fnMatch) {
    const parts = splitTopLevel(fnMatch[2], ',');
    const pxCandidates = parts
      .map((p) => parseLength(p, { unitlessAs }))
      .filter((v) => v && v.unit === 'px');
    if (pxCandidates.length) {
      return pxCandidates.reduce((a, b) => (b.size > a.size ? b : a));
    }
    const first = parts.map((p) => parseLength(p, { unitlessAs })).find(Boolean);
    return first || null;
  }

  const m = value.match(/^(-?\d*\.?\d+)\s*(px|em|rem|%|vh|vw|vmin|vmax)?$/);
  if (!m) return null;
  const size = Number(m[1]);
  if (Number.isNaN(size)) return null;
  let unit = m[2];
  if (!unit) {
    if (unitlessAs) unit = unitlessAs; // e.g. line-height: 1.65 -> em
    else return null;
  }
  return { unit, size };
}

// Elementor SLIDER control value: { unit, size, sizes: [] }
export function toSlider(len) {
  if (!len) return null;
  return { unit: len.unit, size: len.size, sizes: [] };
}

// Shorthand box (padding/margin) -> Elementor DIMENSIONS control value.
// Elementor allows only one unit for the whole control. When tokens mix
// units (e.g. `110px 5%`), percentages are converted to px against a
// reference content width so spacing is not dropped entirely.
const BOX_PCT_REF = 1200;

export function parseBox(raw) {
  if (raw == null) return null;
  const tokens = splitTopLevel(String(raw).trim(), ' ').filter(Boolean);
  if (tokens.length === 0 || tokens.length > 4) return null;

  const lens = tokens.map((t) => parseLength(t));
  if (lens.some((l) => l === null)) return null;

  let top;
  let right;
  let bottom;
  let left;
  if (lens.length === 1) [top, right, bottom, left] = [lens[0], lens[0], lens[0], lens[0]];
  else if (lens.length === 2) [top, right, bottom, left] = [lens[0], lens[1], lens[0], lens[1]];
  else if (lens.length === 3) [top, right, bottom, left] = [lens[0], lens[1], lens[2], lens[1]];
  else [top, right, bottom, left] = lens;

  const units = new Set([top, right, bottom, left].map((l) => l.unit));
  let unit = top.unit;
  if (units.size > 1) {
    // Prefer px when present; convert other units to px.
    unit = units.has('px') ? 'px' : [...units][0];
    const toUnit = (l) => {
      if (l.unit === unit) return l.size;
      if (unit === 'px' && l.unit === '%') return Math.round((l.size / 100) * BOX_PCT_REF);
      if (unit === '%' && l.unit === 'px') return Math.round((l.size / BOX_PCT_REF) * 1000) / 10;
      return l.size;
    };
    top = { unit, size: toUnit(top) };
    right = { unit, size: toUnit(right) };
    bottom = { unit, size: toUnit(bottom) };
    left = { unit, size: toUnit(left) };
  }

  const isLinked = [top, right, bottom, left].every((l) => l.size === top.size);
  return {
    unit,
    top: String(top.size),
    right: String(right.size),
    bottom: String(bottom.size),
    left: String(left.size),
    isLinked,
  };
}

// Elementor GAPS control value (flex gap): { unit, size, column, row, isLinked }
export function parseGap(raw) {
  if (raw == null) return null;
  const tokens = splitTopLevel(String(raw).trim(), ' ').filter(Boolean);
  if (tokens.length === 0 || tokens.length > 2) return null;
  const lens = tokens.map((t) => parseLength(t));
  if (lens.some((l) => l === null)) return null;
  const row = lens[0];
  const column = lens[1] || lens[0];
  if (row.unit !== column.unit) return null;
  return {
    unit: row.unit,
    size: row.size,
    column: String(column.size),
    row: String(row.size),
    isLinked: row.size === column.size,
  };
}

// Color: accept hex, rgb/rgba, hsl/hsla, and CSS named colors. Reject
// gradients, url(), and anything with a function we don't recognise.
const NAMED_COLORS = new Set([
  'transparent', 'currentcolor', 'black', 'white', 'red', 'green', 'blue',
  'gray', 'grey', 'silver', 'gold', 'navy', 'teal', 'olive', 'maroon',
  'purple', 'orange', 'yellow', 'pink', 'brown', 'beige', 'ivory', 'coral',
]);
export function parseColor(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return value;
  if (/^rgba?\(/i.test(value) || /^hsla?\(/i.test(value)) {
    // must be a single, self-contained color function (no extra tokens)
    if (splitTopLevel(value, ' ').filter(Boolean).length === 1) return value;
    return null;
  }
  if (NAMED_COLORS.has(value.toLowerCase())) return value.toLowerCase();
  return null;
}

// `background` shorthand -> a plain color, or null if it carries a
// gradient/image/other layers we can't represent as a simple color.
export function backgroundColor(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (/gradient|url\s*\(|image/i.test(value)) return null;
  return parseColor(value);
}

// Extract the first url(...) from background-image or background shorthand.
export function parseBackgroundImageUrl(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value || value === 'none') return null;
  const m = value.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
  return m ? m[2].trim() : null;
}

const BG_SIZES = new Set(['cover', 'contain', 'auto']);
const BG_POS_KEYWORDS = new Set(['center', 'top', 'bottom', 'left', 'right']);

export function parseBackgroundSize(raw) {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  return BG_SIZES.has(v) ? v : null;
}

export function parseBackgroundPosition(raw) {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (!v) return null;
  if (BG_POS_KEYWORDS.has(v)) {
    return v === 'center' ? 'center center' : `${v} center`;
  }
  return v;
}

const BORDER_STYLES = new Set(['none', 'solid', 'double', 'dotted', 'dashed', 'groove', 'ridge', 'inset', 'outset']);
// `border` shorthand -> { style, width:{unit,size}, color }. Order-agnostic.
export function parseBorder(raw) {
  if (raw == null) return null;
  const tokens = splitTopLevel(String(raw).trim(), ' ').filter(Boolean);
  if (!tokens.length) return null;
  let style = null;
  let width = null;
  let color = null;
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (BORDER_STYLES.has(lower)) { style = lower; continue; }
    const len = parseLength(t);
    if (len && width === null) { width = len; continue; }
    const c = parseColor(t);
    if (c && color === null) { color = c; continue; }
  }
  if (!style && !width && !color) return null;
  return { style: style || 'solid', width, color };
}

export function fontFamily(raw) {
  if (raw == null) return null;
  const first = splitTopLevel(String(raw).trim(), ',')[0];
  if (!first) return null;
  const cleaned = first.trim().replace(/^['"]|['"]$/g, '').trim();
  return cleaned || null;
}

const FONT_WEIGHTS = new Set(['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold']);
export function fontWeight(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().toLowerCase();
  if (FONT_WEIGHTS.has(value)) return value;
  return null;
}

// Split a CSS value on a separator, ignoring separators nested inside
// parentheses (so `clamp(36px, 4.4vw, 60px)` stays intact) and quotes.
export function splitTopLevel(input, sep) {
  const out = [];
  let depth = 0;
  let cur = '';
  let quote = null;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (depth === 0 && ((sep === ' ' && /\s/.test(c)) || c === sep)) {
      if (sep === ' ') {
        if (cur.trim()) out.push(cur.trim());
        cur = '';
      } else {
        out.push(cur);
        cur = '';
      }
      continue;
    }
    cur += c;
  }
  if (cur.trim() || (sep !== ' ' && cur !== '')) out.push(sep === ' ' ? cur.trim() : cur);
  return out;
}

export { LENGTH_UNITS };
