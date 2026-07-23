// Validates generated style settings against the Elementor knowledge base
// (analysis/elementor-widgets-knowledge-base.json). Every setting we emit
// must (a) correspond to a real control or group field on that widget, and
// (b) have a value shape matching the control type. Non-conforming values
// are reported (and dropped by the caller), keeping the pipeline honest.

// button + container aren't captured by the static analyzer (PHP trait /
// element). Their control IDs are verified by hand against Elementor source
// (button-trait.php, includes/elements/container.php).
const STATIC_SCHEMA = {
  button: {
    controls: ['button_text_color', 'text_padding', 'border_radius', 'align'],
    groups: ['typography', 'background', 'border'],
  },
  container: {
    controls: [
      'padding', 'margin', 'min_height', 'width', 'content_width',
      'background_background', 'background_color',
      'background_image', 'background_size', 'background_position',
      'background_overlay_background', 'background_overlay_color', 'background_overlay_color_b',
      'background_overlay_gradient_angle', 'background_overlay_opacity',
      'container_type',
    ],
    groups: ['background', 'background_overlay', 'flex', 'grid'],
  },
  divider: {
    controls: ['style', 'width', 'align', 'color', 'weight', 'gap'],
    groups: [],
  },
};

// Responsive control variants share the base control's schema.
const BP_SUFFIX = /_(?:tablet|mobile|tablet_extra|mobile_extra|widescreen|laptop)$/;

// Expected value shape per control-key pattern (checked on the de-suffixed key).
const SLIDER_KEYS = /(_font_size|_line_height|_letter_spacing|_word_spacing|_columns_grid|_rows_grid|^min_height|^width|^height)$/;
const DIMENSION_KEYS = /(^padding|^margin|^text_padding|^border_radius|^border_width|_border_width)$/;
const GAPS_KEYS = /(_gaps?|^gap)$/;
const STRING_KEYS = /(_color$|^align$|_typography$|_font_family$|_font_weight$|_font_style$|_text_transform$|_text_decoration$|^flex_direction$|^flex_justify_content$|^flex_align_items$|^flex_wrap$|^background_background$|^background_size$|^background_position$|^background_overlay_background$|^container_type$|^content_width$|^style$|_border$)/;

function isSlider(v) {
  return v && typeof v === 'object' && typeof v.unit === 'string' && typeof v.size === 'number';
}
function isDimensions(v) {
  return v && typeof v === 'object' && 'top' in v && 'right' in v && 'bottom' in v && 'left' in v && typeof v.unit === 'string';
}
function isGaps(v) {
  return v && typeof v === 'object' && 'column' in v && 'row' in v && typeof v.unit === 'string';
}
function isMedia(v) {
  return v && typeof v === 'object' && typeof v.url === 'string';
}

export function buildValidator(kb) {
  const byName = new Map();
  for (const w of kb.widgets) {
    if (w.name) byName.set(w.name, w);
  }

  function knownFor(type) {
    const controls = new Set();
    const groups = new Set();
    const w = byName.get(type);
    if (w) {
      for (const c of w.controls) {
        if (c.call === 'add_group_control') {
          if (c.name) groups.add(c.name);
        } else if (c.id && typeof c.id === 'string') {
          controls.add(c.id);
        }
      }
    }
    const st = STATIC_SCHEMA[type];
    if (st) {
      st.controls.forEach((c) => controls.add(c));
      st.groups.forEach((g) => groups.add(g));
    }
    return { controls, groups, known: !!w || !!st };
  }

  function keyIsKnown(key, controls, groups) {
    if (controls.has(key)) return true;
    for (const g of groups) {
      if (key === g || key.startsWith(`${g}_`)) return true;
    }
    return false;
  }

  function shapeOk(key, value) {
    if (key === 'background_image' || key === 'image') return isMedia(value);
    if (SLIDER_KEYS.test(key)) return isSlider(value);
    if (DIMENSION_KEYS.test(key)) return isDimensions(value);
    if (GAPS_KEYS.test(key)) return isGaps(value);
    if (STRING_KEYS.test(key)) return typeof value === 'string' && value.length > 0;
    // Unknown pattern: accept (structure-only keys handled elsewhere).
    return true;
  }

  // Validates `settings`, returns { clean, warnings }. `clean` is the subset
  // of settings that passed validation (safe to emit).
  function validate(type, settings) {
    const { controls, groups, known } = knownFor(type);
    const warnings = [];
    const clean = {};

    for (const [key, value] of Object.entries(settings)) {
      const baseKey = key.replace(BP_SUFFIX, '');
      if (known && !keyIsKnown(baseKey, controls, groups)) {
        warnings.push({ type, key, value, reason: 'unknown-control' });
        continue;
      }
      if (!shapeOk(baseKey, value)) {
        warnings.push({ type, key, value, reason: 'bad-shape' });
        continue;
      }
      clean[key] = value;
    }
    return { clean, warnings };
  }

  return { validate };
}
