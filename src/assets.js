import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Extracts inline base64 (data:) images into real file buffers. Elementor's
// template importer cannot sideload data URIs and replaces them with a
// placeholder, so converting to hosted files is required for images to render
// after import.
//
// `collectDataUriAssets` is pure (no disk I/O): it returns the decoded buffers
// and, when `baseUrl` is provided, rewrites each image URL in `template` to
// `${baseUrl}/${file}`. Callers persist the buffers themselves (CLI writes to
// disk, the web server streams them into a zip).

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

function walkImageSettings(node, cb) {
  if (Array.isArray(node)) {
    node.forEach((n) => walkImageSettings(n, cb));
    return;
  }
  if (node && typeof node === 'object') {
    const s = node.settings;
    if (node.widgetType === 'image' && s && s.image && typeof s.image.url === 'string') {
      cb(s.image);
    }
    if (s && s.background_image && typeof s.background_image.url === 'string') {
      cb(s.background_image);
    }
    if (Array.isArray(node.elements)) walkImageSettings(node.elements, cb);
  }
}

// Returns [{ file, buffer, bytes, mime, rewritten }], de-duplicated by content
// hash. Mutates `template` image URLs only when `baseUrl` is set.
export function collectDataUriAssets(template, { baseUrl = '' } = {}) {
  const assets = [];
  const seen = new Set();

  walkImageSettings(template.content, (image) => {
    const m = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(image.url);
    if (!m) return;
    const mime = (m[1] || 'image/png').toLowerCase();
    const isB64 = !!m[2];
    const payload = m[3];
    const buffer = isB64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
    const ext = MIME_EXT[mime] || 'bin';
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 12);
    const file = `${hash}.${ext}`;

    if (baseUrl) {
      image.url = `${baseUrl.replace(/\/$/, '')}/${file}`;
    }
    if (!seen.has(file)) {
      seen.add(file);
      assets.push({ file, buffer, bytes: buffer.length, mime, rewritten: !!baseUrl });
    }
  });

  return assets;
}

// Persists collected asset buffers into `<outDir>/assets/`.
export function writeAssets(assets, outDir) {
  if (!assets.length) return null;
  const assetsDir = path.join(outDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const a of assets) {
    fs.writeFileSync(path.join(assetsDir, a.file), a.buffer);
  }
  return assetsDir;
}
