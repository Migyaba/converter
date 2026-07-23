import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { mapBodyToContent, createStyleContext } from './mapper.js';
import { buildStylesheet } from './css/stylesheet.js';
import { buildValidator } from './validate.js';
import { createFallback } from './fallback.js';
import { collectDataUriAssets } from './assets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prefer the packaged KB so the converter is self-contained; fall back to the
// monorepo analysis path when developing inside Elementor-programme.
const KB_CANDIDATES = [
  path.resolve(__dirname, '../data/elementor-widgets-knowledge-base.json'),
  path.resolve(__dirname, '../../analysis/elementor-widgets-knowledge-base.json'),
];

function resolveKbPath() {
  for (const p of KB_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Knowledge base introuvable. Attendu :\n  - ${KB_CANDIDATES.join('\n  - ')}`,
  );
}

let kbCache = null;
function loadKb() {
  if (!kbCache) kbCache = JSON.parse(fs.readFileSync(resolveKbPath(), 'utf-8'));
  return kbCache;
}

// Elementor template import format, confirmed against
// elementor/tests/playwright/templates/rating-flex-wrap.json
export function buildTemplate(content, title) {
  return {
    content,
    page_settings: [],
    version: '0.4',
    title,
    type: 'container',
  };
}

function summarizeWarnings(warnings) {
  const byReason = {};
  const byKey = {};
  for (const w of warnings) {
    byReason[w.reason] = (byReason[w.reason] || 0) + 1;
    const k = `${w.type}.${w.key}`;
    byKey[k] = (byKey[k] || 0) + 1;
  }
  return { total: warnings.length, byReason, byKey };
}

// Core conversion: HTML string -> Elementor template + diagnostics + assets.
// Pure and in-memory (no disk I/O); shared by the CLI and the web server.
//
// options.assetsBase: when set, base64 image URLs are rewritten to
//   `${assetsBase}/${file}`; the decoded buffers are always returned so the
//   caller can persist/zip them.
// options.title: overrides the <title>-derived template title.
// options.fallbackProvider: Phase 4 provider (inert when omitted).
export function convertHtml(html, { assetsBase = '', title = '', fallbackProvider = null } = {}) {
  const $ = cheerio.load(html);
  const kb = loadKb();
  const validator = buildValidator(kb);
  const stylesheet = buildStylesheet($);
  const fallback = createFallback({ provider: fallbackProvider, validator, kb });
  const ctx = createStyleContext(stylesheet, validator, fallback);

  const content = mapBodyToContent($, ctx);
  const templateTitle = title || $('title').text().trim() || 'Untitled';
  const template = buildTemplate(content, templateTitle);

  const assets = collectDataUriAssets(template, { baseUrl: assetsBase });

  const report = summarizeWarnings(ctx.warnings);
  report.holes = {
    total: fallback.holes.length,
    resolved: fallback.holes.filter((h) => h.resolved).length,
    samples: fallback.holes.slice(0, 10),
  };

  return {
    template,
    report,
    assets,
    stats: {
      ruleCount: stylesheet.ruleCount,
      breakpointRuleCount: stylesheet.breakpointRuleCount,
      styledElements: ctx.appliedCount,
      rejected: report.total,
      holes: report.holes.total,
      fallbackEnabled: fallback.enabled,
      assetCount: assets.length,
      assetsRewritten: !!assetsBase,
    },
  };
}
