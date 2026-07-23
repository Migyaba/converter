#!/usr/bin/env node
import http from 'node:http';
import { convertHtml } from './convert.js';
import { createZip } from './zip.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4599;
// Écoute locale par défaut ; pour un reverse-proxy : HOST=0.0.0.0
const HOST = process.env.HOST || '127.0.0.1';
// Les pages autoportées embarquent souvent des images en base64 (+33 % de poids),
// donc on prévoit large. Réglable via MAX_BODY_MB.
const MAX_BODY = (process.env.MAX_BODY_MB ? Number(process.env.MAX_BODY_MB) : 200) * 1024 * 1024;

const PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Convert — HTML → Elementor</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --ink: #12161c;
    --ink-soft: #3a4450;
    --muted: #6b7684;
    --line: #d8dde5;
    --line-strong: #b8c0cc;
    --surface: #f7f5f1;
    --surface-2: #ffffff;
    --accent: #1f4b6e;
    --accent-deep: #163650;
    --ok: #1f6b4a;
    --warn: #8a5a12;
    --err: #8b2e2e;
    --radius: 6px;
    --font-brand: "Syne", sans-serif;
    --font-display: "Source Serif 4", Georgia, serif;
    --font-ui: "IBM Plex Sans", sans-serif;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    font-family: var(--font-ui);
    color: var(--ink);
    background:
      radial-gradient(900px 480px at 12% -8%, rgba(31,75,110,.10), transparent 55%),
      radial-gradient(700px 420px at 100% 0%, rgba(18,22,28,.05), transparent 50%),
      linear-gradient(180deg, #f3f1ec 0%, var(--surface) 42%, #efece6 100%);
    line-height: 1.5;
  }

  .shell {
    width: min(1080px, calc(100% - 40px));
    margin: 0 auto;
    padding: 48px 0 64px;
    display: grid;
    grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.2fr);
    gap: 48px;
    align-items: start;
  }

  .brand { position: sticky; top: 48px; padding-top: 8px; }
  .brand-mark {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: clamp(42px, 5.4vw, 64px);
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: var(--ink);
    margin: 0 0 18px;
  }
  .brand-mark span { color: var(--accent); }
  .brand-lead {
    font-family: var(--font-display);
    font-size: clamp(18px, 2vw, 22px);
    font-weight: 400;
    color: var(--ink-soft);
    margin: 0 0 28px;
    max-width: 28ch;
    line-height: 1.35;
  }
  .path {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
  }
  .path li {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
    color: var(--ink-soft);
  }
  .path strong {
    display: block;
    color: var(--ink);
    font-weight: 600;
    margin-bottom: 2px;
  }
  .path .n {
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: 13px;
    color: var(--accent);
    padding-top: 2px;
  }

  .work {
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 28px;
    animation: rise .55s ease both;
  }
  @keyframes rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }

  .step { margin: 0 0 28px; }
  .step:last-of-type { margin-bottom: 0; }
  .step-label {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 10px;
  }
  .step-label .idx {
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .step-label h2 {
    margin: 0;
    font-family: var(--font-ui);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }
  .hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--muted);
  }

  .drop {
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius);
    padding: 36px 20px;
    text-align: center;
    cursor: pointer;
    background:
      linear-gradient(180deg, #fbfaf8, #f4f2ed);
    transition: border-color .2s ease, background .2s ease, transform .2s ease;
  }
  .drop:hover { border-color: var(--accent); }
  .drop.drag {
    border-color: var(--accent);
    border-style: solid;
    background: #eef4f8;
    transform: scale(1.01);
  }
  .drop.has-file {
    border-style: solid;
    border-color: var(--accent);
    background: #f3f7fa;
    text-align: left;
    padding: 18px 20px;
  }
  .drop-title {
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: 16px;
    color: var(--ink);
    margin: 0 0 4px;
  }
  .drop-sub { margin: 0; font-size: 13px; color: var(--muted); }
  .file-meta {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .drop.has-file .drop-idle { display: none; }
  .drop.has-file .file-meta { display: flex; }
  .file-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    word-break: break-all;
  }
  .file-size { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .change {
    border: 0;
    background: transparent;
    color: var(--accent);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  label.field-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 8px;
  }
  .field-note {
    margin: 8px 0 0;
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.45;
  }
  .field-note code {
    font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 11.5px;
    background: #eef1f5;
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--ink-soft);
  }
  input[type=url], input[type=text] {
    width: 100%;
    padding: 12px 14px;
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background: #fff;
    color: var(--ink);
    font: inherit;
    font-size: 14px;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(31,75,110,.12);
  }
  input::placeholder { color: #9aa3ae; }

  .actions {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  #go {
    appearance: none;
    border: 0;
    border-radius: var(--radius);
    padding: 14px 18px;
    background: var(--accent);
    color: #fff;
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: background .15s ease, transform .15s ease, opacity .15s ease;
  }
  #go:hover:not(:disabled) { background: var(--accent-deep); }
  #go:active:not(:disabled) { transform: translateY(1px); }
  #go:disabled { opacity: .38; cursor: not-allowed; }

  .status {
    min-height: 1.4em;
    font-size: 13px;
    color: var(--muted);
  }
  .status.busy { color: var(--ink-soft); }
  .status.ok { color: var(--ok); }
  .status.err { color: var(--err); }
  .status.warn { color: var(--warn); }

  .result {
    display: none;
    margin-top: 8px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: #f8faf8;
    animation: rise .4s ease both;
  }
  .result.show { display: block; }
  .result h3 {
    margin: 0 0 10px;
    font-family: var(--font-brand);
    font-size: 14px;
    font-weight: 700;
    color: var(--ok);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
  }
  .stats li {
    font-size: 13px;
    color: var(--ink-soft);
  }
  .stats strong {
    display: block;
    font-size: 18px;
    font-family: var(--font-brand);
    font-weight: 700;
    color: var(--ink);
    line-height: 1.1;
  }
  .next {
    margin: 0;
    padding-top: 12px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    color: var(--ink-soft);
    line-height: 1.5;
  }
  .next ol {
    margin: 8px 0 0;
    padding-left: 18px;
  }
  .next li { margin: 4px 0; }

  @media (max-width: 860px) {
    .shell {
      grid-template-columns: 1fr;
      gap: 28px;
      padding: 28px 0 48px;
      width: min(100% - 28px, 640px);
    }
    .brand { position: static; }
    .brand-mark { font-size: 40px; }
    .work { padding: 22px; }
    .stats { grid-template-columns: 1fr 1fr; }
  }
</style>
</head>
<body>
  <div class="shell">
    <aside class="brand">
      <h1 class="brand-mark">Convert<span>.</span></h1>
      <p class="brand-lead">Transformez une page HTML en modèle Elementor prêt à importer.</p>
      <ol class="path">
        <li>
          <span class="n">01</span>
          <div><strong>Charger le HTML</strong>Page autoportée (.html)</div>
        </li>
        <li>
          <span class="n">02</span>
          <div><strong>Indiquer le dossier images</strong>URL publique sur WordPress</div>
        </li>
        <li>
          <span class="n">03</span>
          <div><strong>Télécharger le ZIP</strong>Modèle JSON + dossier assets/</div>
        </li>
      </ol>
    </aside>

    <main class="work">
      <section class="step">
        <div class="step-label">
          <span class="idx">Étape 1</span>
          <h2>Fichier HTML</h2>
        </div>
        <div class="drop" id="drop" role="button" tabindex="0" aria-label="Charger un fichier HTML">
          <div class="drop-idle">
            <p class="drop-title">Déposez votre fichier .html</p>
            <p class="drop-sub">ou cliquez pour parcourir</p>
          </div>
          <div class="file-meta">
            <div>
              <div class="file-name" id="fileName"></div>
              <div class="file-size" id="fileSize"></div>
            </div>
            <button type="button" class="change" id="change">Changer</button>
          </div>
        </div>
        <input type="file" id="input" accept=".html,.htm,text/html" hidden />
      </section>

      <section class="step">
        <div class="step-label">
          <span class="idx">Étape 2</span>
          <h2>Dossier public des images</h2>
        </div>
        <p class="hint">URL du dossier WordPress où vous déposerez les images du ZIP — sans le nom du fichier.</p>
        <label class="field-label" for="base">URL du dossier</label>
        <input type="url" id="base" placeholder="https://monsite.com/wp-content/uploads/2026/07" autocomplete="url" />
        <p class="field-note">
          Exemple : si une image est
          <code>…/uploads/2026/07/photo.jpg</code>,
          le dossier est
          <code>https://…/uploads/2026/07</code>.
          Laisser vide seulement pour un test sans images.
        </p>
      </section>

      <div class="actions">
        <button id="go" disabled>Convertir et télécharger le ZIP</button>
        <div class="status" id="status" aria-live="polite"></div>
        <div class="result" id="result">
          <h3>Conversion terminée</h3>
          <ul class="stats">
            <li><strong id="statStyled">—</strong>éléments stylés</li>
            <li><strong id="statAssets">—</strong>images extraites</li>
            <li><strong id="statRejected">—</strong>valeurs rejetées</li>
            <li><strong id="statHoles">—</strong>trous non convertis</li>
          </ul>
          <div class="next" id="next"></div>
        </div>
      </div>
    </main>
  </div>

<script>
  const drop = document.getElementById('drop');
  const input = document.getElementById('input');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const change = document.getElementById('change');
  const go = document.getElementById('go');
  const status = document.getElementById('status');
  const result = document.getElementById('result');
  const base = document.getElementById('base');
  const next = document.getElementById('next');
  let current = null;

  function setFile(f) {
    if (!f) return;
    current = f;
    fileName.textContent = f.name;
    fileSize.textContent = Math.round(f.size / 1024) + ' Ko';
    drop.classList.add('has-file');
    go.disabled = false;
    status.textContent = '';
    status.className = 'status';
    result.classList.remove('show');
  }

  function openPicker(e) {
    if (e && e.target && e.target.id === 'change') return;
    input.click();
  }

  drop.addEventListener('click', openPicker);
  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  });
  change.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
  input.addEventListener('change', () => setFile(input.files[0]));

  ['dragover', 'dragenter'].forEach((ev) => {
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); });
  });
  drop.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  });

  go.addEventListener('click', async () => {
    if (!current) return;
    const assetsBase = base.value.trim().replace(/\\/$/, '');
    go.disabled = true;
    result.classList.remove('show');
    status.className = 'status busy';
    status.textContent = 'Conversion en cours…';
    try {
      const html = await current.text();
      const q = new URLSearchParams({
        name: current.name.replace(/\\.[^.]+$/, ''),
        base: assetsBase,
      });
      const res = await fetch('/convert?' + q.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/html' },
        body: html,
      });
      if (!res.ok) throw new Error(await res.text());
      const stats = JSON.parse(res.headers.get('X-Convert-Stats') || '{}');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (stats.name || 'elementor') + '.zip';
      a.click();
      URL.revokeObjectURL(url);

      document.getElementById('statStyled').textContent = stats.styledElements ?? '—';
      document.getElementById('statAssets').textContent = stats.assetCount ?? '—';
      document.getElementById('statRejected').textContent = stats.rejected ?? '—';
      document.getElementById('statHoles').textContent = stats.holes ?? '—';

      if (stats.assetCount > 0 && stats.assetsRewritten) {
        status.className = 'status ok';
        status.textContent = 'ZIP téléchargé. Les URLs images pointent vers votre dossier.';
        next.innerHTML =
          '<strong>Prochaines étapes</strong>' +
          '<ol>' +
          '<li>Uploadez le contenu de <code>assets/</code> vers <code>' + assetsBase.replace(/</g, '') + '</code></li>' +
          '<li>Importez le fichier <code>.elementor.json</code> dans Elementor → Modèles</li>' +
          '<li>Insérez le modèle dans une page (Containers / Flexbox actifs)</li>' +
          '</ol>';
      } else if (stats.assetCount > 0) {
        status.className = 'status warn';
        status.textContent = 'ZIP téléchargé — sans URL dossier, Elementor affichera des placeholders.';
        next.innerHTML =
          '<strong>Pour afficher les images</strong>' +
          '<ol>' +
          '<li>Uploadez <code>assets/</code> sur WordPress</li>' +
          '<li>Revenez ici, renseignez l’URL du dossier, reconvertissez le même HTML</li>' +
          '<li>Importez le nouveau JSON</li>' +
          '</ol>';
      } else {
        status.className = 'status ok';
        status.textContent = 'ZIP téléchargé.';
        next.innerHTML =
          '<strong>Prochaine étape</strong>' +
          '<ol><li>Importez le fichier <code>.elementor.json</code> dans Elementor → Modèles</li></ol>';
      }
      result.classList.add('show');
    } catch (e) {
      status.className = 'status err';
      status.textContent = 'Erreur : ' + e.message;
    } finally {
      go.disabled = !current;
    }
  });
</script>
</body>
</html>`;

class BodyTooLargeError extends Error {}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        tooLarge = true; // on continue de drainer le flux pour pouvoir répondre proprement
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new BodyTooLargeError(`Fichier trop volumineux (max ${Math.round(MAX_BODY / 1024 / 1024)} Mo)`));
        return;
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function buildReadme(stats, name) {
  return `Conversion HTML → Elementor
============================

Fichier : ${name}.elementor.json  (format d'import de modèle Elementor)

Import dans WordPress
---------------------
1. Elementor doit avoir la fonctionnalité "Flexbox Container" ACTIVE.
2. Admin WP → Modèles → Modèles enregistrés → "Importer des modèles" → ${name}.elementor.json
3. Insérez le modèle dans une page.

Images
------
${stats.assetCount} image(s) extraite(s) dans le dossier assets/.
${stats.assetsRewritten
    ? 'Les URLs du JSON pointent déjà vers l\'URL publique que vous avez indiquée :\n  uploadez le contenu de assets/ à cette adresse.'
    : 'Les images sont restées en base64 dans le JSON (Elementor peut les remplacer par un\n  placeholder à l\'import). Pour un rendu fiable : hébergez le dossier assets/ puis\n  reconvertissez en renseignant l\'URL publique des images.'}

Polices
-------
Les polices (Google Fonts) sont référencées par leur nom dans le JSON. Pour qu'elles
s'affichent : Elementor → Réglages → activez "Google Fonts", puis Elementor → Outils →
"Régénérer le CSS & les données".

Diagnostic
----------
Éléments stylés : ${stats.styledElements}
Valeurs rejetées à la validation : ${stats.rejected}
Trous non convertis : ${stats.holes}
`;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGE);
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/convert')) {
    try {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const name = (url.searchParams.get('name') || 'page').replace(/[^\w.-]/g, '_') || 'page';
      const assetsBase = url.searchParams.get('base') || '';
      const html = await readBody(req);
      if (!html.trim()) throw new Error('Corps HTML vide');

      const { template, report, assets, stats } = convertHtml(html, { assetsBase, title: name });

      const entries = [
        { name: `${name}.elementor.json`, data: JSON.stringify(template, null, 2) },
        { name: `${name}.style-report.json`, data: JSON.stringify(report, null, 2) },
        { name: 'README.txt', data: buildReadme(stats, name) },
        ...assets.map((a) => ({ name: `assets/${a.file}`, data: a.buffer })),
      ];
      const zip = createZip(entries);

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}.zip"`,
        'Content-Length': zip.length,
        'X-Convert-Stats': JSON.stringify({ ...stats, name }),
      });
      res.end(zip);
    } catch (e) {
      const status = e instanceof BodyTooLargeError ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String(e && e.message ? e.message : e));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Le port ${PORT} est déjà utilisé (un serveur tourne peut-être déjà).`);
    console.error(`  → Ouvrez http://${HOST}:${PORT} , ou lancez sur un autre port : PORT=4600 npm run serve`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Plateforme HTML → Elementor : http://${displayHost}:${PORT}`);
  console.log('Arrêt : Ctrl+C');
});
