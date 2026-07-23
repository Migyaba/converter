import { generateId } from './id.js';

// Settings builders — Phase 1: structure only, no CSS-derived style controls.
// Control IDs verified against analysis/elementor-widgets-knowledge-base.json
// (button widget's `text`/`link` controls come from Button_Trait, not captured
// by the static analyzer — confirmed by reading includes/widgets/traits/button-trait.php).

export function headingSettings($, el) {
  const tag = el.tagName.toLowerCase();
  return {
    title: $(el).text().trim(),
    header_size: /^h[1-6]$/.test(tag) ? tag : 'h2',
  };
}

export function textEditorSettings($, el) {
  return {
    editor: ($(el).html() || '').trim(),
  };
}

export function imageSettings($, el) {
  const src = resolveImageSrc($, el);
  return {
    image: { url: src || '', id: '' },
  };
}

export function buttonSettings($, el) {
  const href = $(el).attr('href') || '';
  return {
    text: $(el).text().trim(),
    link: { url: href, is_external: '', nofollow: '', custom_attributes: '' },
  };
}

export function iconListSettings($, el) {
  const items = [];
  $(el)
    .children('li')
    .each((_, li) => {
      items.push({
        _id: generateId(),
        text: $(li).text().trim(),
        selected_icon: { value: 'fas fa-circle', library: 'fa-solid' },
      });
    });
  return { icon_list: items };
}

// Resolve the visible image source for an <img> tag or a leaf element
// styled with a CSS background-image (common in hand-built HTML that
// doesn't use <img>, e.g. exemple-html/maison-victor-vorko-accueil-V2-15.html).
export function resolveImageSrc($, el) {
  const tag = el.tagName.toLowerCase();
  if (tag === 'img') {
    return $(el).attr('src') || '';
  }
  const style = $(el).attr('style') || '';
  const match = style.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i);
  return match ? match[2] : '';
}
