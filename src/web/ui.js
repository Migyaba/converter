/** Shared UI chrome for Convert SaaS pages. */

export const CSS = `
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
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 16px 0; margin-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .topbar .logo {
    font-family: var(--font-brand); font-weight: 800; font-size: 22px;
    letter-spacing: -0.04em; color: var(--ink); text-decoration: none;
  }
  .topbar .logo span { color: var(--accent); }
  .nav { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--ink-soft); }
  .nav form { margin: 0; }
  .shell {
    width: min(1080px, calc(100% - 40px));
    margin: 0 auto; padding: 24px 0 64px;
  }
  .shell.narrow { width: min(440px, calc(100% - 40px)); padding-top: 64px; }
  .card {
    background: var(--surface-2); border: 1px solid var(--line);
    border-radius: var(--radius); padding: 28px;
  }
  .brand-mark {
    font-family: var(--font-brand); font-weight: 800;
    font-size: clamp(36px, 5vw, 52px); letter-spacing: -0.04em;
    line-height: 0.95; margin: 0 0 12px;
  }
  .brand-mark span { color: var(--accent); }
  .lead {
    font-family: var(--font-display); font-size: 18px; color: var(--ink-soft);
    margin: 0 0 24px; line-height: 1.35;
  }
  label.field-label {
    display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px;
  }
  input[type=email], input[type=password], input[type=text], input[type=url], input[type=number] {
    width: 100%; padding: 12px 14px; border-radius: var(--radius);
    border: 1px solid var(--line-strong); background: #fff; color: var(--ink);
    font: inherit; font-size: 14px;
  }
  input:focus {
    outline: none; border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(31,75,110,.12);
  }
  .field { margin-bottom: 16px; }
  .btn {
    appearance: none; border: 0; border-radius: var(--radius);
    padding: 12px 16px; background: var(--accent); color: #fff;
    font-family: var(--font-brand); font-weight: 700; font-size: 14px;
    cursor: pointer;
  }
  .btn:hover { background: var(--accent-deep); }
  .btn:disabled { opacity: .4; cursor: not-allowed; }
  .btn.ghost {
    background: transparent; color: var(--accent);
    border: 1px solid var(--line-strong); font-family: var(--font-ui); font-weight: 600;
  }
  .btn.danger { background: var(--err); }
  .btn.small { padding: 7px 10px; font-size: 12px; font-family: var(--font-ui); font-weight: 600; }
  .alert {
    padding: 12px 14px; border-radius: var(--radius); font-size: 13px; margin-bottom: 16px;
  }
  .alert.err { background: #f8ecec; color: var(--err); border: 1px solid #e8c8c8; }
  .alert.ok { background: #eaf5ef; color: var(--ok); border: 1px solid #c5e0d0; }
  .muted { color: var(--muted); font-size: 13px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1.3fr; gap: 40px; align-items: start; }
  @media (max-width: 860px) {
    .grid-2 { grid-template-columns: 1fr; gap: 24px; }
    .shell { width: min(100% - 28px, 640px); }
  }
  table.data {
    width: 100%; border-collapse: collapse; font-size: 13px;
  }
  table.data th, table.data td {
    text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line);
    vertical-align: middle;
  }
  table.data th { color: var(--muted); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 600; background: #eef1f5; color: var(--ink-soft);
  }
  .badge.admin { background: #e8eef5; color: var(--accent); }
  .badge.off { background: #f3e8e8; color: var(--err); }
  .stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;
  }
  @media (max-width: 720px) { .stats-row { grid-template-columns: 1fr 1fr; } }
  .stat {
    background: var(--surface-2); border: 1px solid var(--line);
    border-radius: var(--radius); padding: 16px;
  }
  .stat strong {
    display: block; font-family: var(--font-brand); font-size: 28px; font-weight: 800;
    letter-spacing: -0.03em; line-height: 1.1;
  }
  .stat span { font-size: 12px; color: var(--muted); }
  .quota {
    font-size: 13px; color: var(--ink-soft);
    padding: 10px 12px; background: #f3f6f9; border-radius: var(--radius); margin-bottom: 18px;
  }
  .inline-form { display: inline-flex; gap: 6px; align-items: center; }
  .inline-form input[type=number] { width: 72px; padding: 6px 8px; }
`;

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout({ title, body, user = null, wide = true }) {
  const nav = user
    ? `<nav class="nav">
         <span>${escapeHtml(user.email)}</span>
         ${user.role === 'admin' ? '<a href="/admin">Admin</a>' : ''}
         <a href="/app">Convertir</a>
         <a href="/">Accueil</a>
         <form method="post" action="/logout"><button class="btn ghost small" type="submit">Déconnexion</button></form>
       </nav>`
    : `<nav class="nav"><a href="/">Accueil</a><a href="/login">Connexion</a><a href="/register">Créer un compte</a></nav>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — Convert</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
<style>${CSS}</style>
</head>
<body>
  <div class="shell${wide ? '' : ' narrow'}">
    <div class="topbar">
      <a class="logo" href="${user ? '/app' : '/'}">Convert<span>.</span></a>
      ${nav}
    </div>
    ${body}
  </div>
</body>
</html>`;
}

export function loginPage({ error = '', email = '', next = '/app' } = {}) {
  return layout({
    title: 'Connexion',
    user: null,
    wide: false,
    body: `
      <h1 class="brand-mark">Convert<span>.</span></h1>
      <p class="lead">Connectez-vous pour convertir vos pages HTML.</p>
      <div class="card">
        ${error ? `<div class="alert err">${escapeHtml(error)}</div>` : ''}
        <form method="post" action="/login">
          <input type="hidden" name="next" value="${escapeHtml(next)}" />
          <div class="field">
            <label class="field-label" for="email">E-mail</label>
            <input id="email" name="email" type="email" required autocomplete="username" value="${escapeHtml(email)}" />
          </div>
          <div class="field">
            <label class="field-label" for="password">Mot de passe</label>
            <input id="password" name="password" type="password" required autocomplete="current-password" />
          </div>
          <button class="btn" type="submit" style="width:100%">Se connecter</button>
        </form>
        <p class="muted" style="margin:16px 0 0">Pas de compte ? <a href="/register">Créer un compte</a></p>
      </div>`,
  });
}

export function registerPage({ error = '', email = '', name = '', plan = '', open = true } = {}) {
  const planId = ['free', 'standard', 'pro'].includes(plan) ? plan : 'free';
  const planHint = {
    free: 'Plan Free — 3 conversions / mois.',
    standard: 'Plan Standard — 50 conversions / mois.',
    pro: 'Plan Pro — quota élevé dès l’ouverture du compte.',
  }[planId];
  const btnLabel = {
    free: 'Créer mon compte',
    standard: 'Créer mon compte Standard',
    pro: 'Créer mon compte Pro',
  }[planId];
  const body = !open
    ? `<h1 class="brand-mark">Inscriptions fermées</h1>
       <p class="lead">Contactez un administrateur pour obtenir un accès.</p>
       <p class="muted"><a href="/login">Retour à la connexion</a></p>`
    : `<h1 class="brand-mark">Créer un compte</h1>
       <p class="lead">${planHint}</p>
       <div class="card">
         ${error ? `<div class="alert err">${escapeHtml(error)}</div>` : ''}
         <form method="post" action="/register">
           <input type="hidden" name="plan" value="${escapeHtml(planId)}" />
           <div class="field">
             <label class="field-label" for="name">Nom</label>
             <input id="name" name="name" type="text" autocomplete="name" value="${escapeHtml(name)}" />
           </div>
           <div class="field">
             <label class="field-label" for="email">E-mail</label>
             <input id="email" name="email" type="email" required autocomplete="username" value="${escapeHtml(email)}" />
           </div>
           <div class="field">
             <label class="field-label" for="password">Mot de passe</label>
             <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" />
           </div>
           <button class="btn" type="submit" style="width:100%">${btnLabel}</button>
         </form>
         <p class="muted" style="margin:16px 0 0">Déjà inscrit ? <a href="/login">Se connecter</a></p>
       </div>`;
  return layout({ title: 'Inscription', user: null, wide: false, body });
}

export function convertPage({ user, quota, history = [] }) {
  const histRows = history.length
    ? history
        .map(
          (c) => `<tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${c.styled_elements}</td>
            <td>${c.asset_count}</td>
            <td>${escapeHtml(c.created_at)}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td colspan="4" class="muted">Aucune conversion pour l’instant.</td></tr>`;

  return layout({
    title: 'Convertir',
    user,
    body: `
    <div class="grid-2">
      <aside>
        <h1 class="brand-mark" style="font-size:40px">Convert<span>.</span></h1>
        <p class="lead">Transformez une page HTML en modèle Elementor prêt à importer.</p>
        <div class="quota">
          Quota ce mois : <strong>${quota.used}</strong> / ${quota.limit}
          (${quota.remaining} restante${quota.remaining > 1 ? 's' : ''})
        </div>
        <div class="card" style="padding:18px">
          <h2 style="margin:0 0 10px;font-size:14px">Historique récent</h2>
          <table class="data">
            <thead><tr><th>Fichier</th><th>Styles</th><th>Images</th><th>Date</th></tr></thead>
            <tbody>${histRows}</tbody>
          </table>
        </div>
      </aside>
      <main class="card" id="app">
        ${!quota.ok ? `<div class="alert err">Quota mensuel atteint. Contactez un admin pour l’augmenter.</div>` : ''}
        <section style="margin-bottom:24px">
          <label class="field-label">Fichier HTML</label>
          <div id="drop" style="border:1px dashed var(--line-strong);border-radius:var(--radius);padding:28px 16px;text-align:center;cursor:pointer;background:linear-gradient(180deg,#fbfaf8,#f4f2ed)">
            <div id="dropIdle">
              <p style="margin:0 0 4px;font-family:var(--font-brand);font-weight:700">Déposez votre fichier .html</p>
              <p class="muted" style="margin:0">ou cliquez pour parcourir</p>
            </div>
            <div id="fileMeta" style="display:none;text-align:left">
              <strong id="fileName"></strong>
              <div class="muted" id="fileSize"></div>
            </div>
          </div>
          <input type="file" id="input" accept=".html,.htm,text/html" hidden />
        </section>
        <section style="margin-bottom:24px">
          <label class="field-label" for="base">URL du dossier images (optionnel)</label>
          <input type="url" id="base" placeholder="https://monsite.com/wp-content/uploads/2026/07" />
          <p class="muted" style="margin:8px 0 0">URL publique où vous hébergerez le dossier <code>assets/</code> du ZIP.</p>
        </section>
        <button class="btn" id="go" disabled style="width:100%">Convertir et télécharger le ZIP</button>
        <div id="status" class="muted" style="margin-top:12px;min-height:1.4em" aria-live="polite"></div>
        <div id="result" style="display:none;margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:var(--radius)">
          <strong style="color:var(--ok)">Conversion terminée</strong>
          <ul id="stats" style="margin:10px 0 0;padding-left:18px;font-size:13px;color:var(--ink-soft)"></ul>
        </div>
      </main>
    </div>
    <script>
      const drop = document.getElementById('drop');
      const input = document.getElementById('input');
      const go = document.getElementById('go');
      const status = document.getElementById('status');
      const result = document.getElementById('result');
      const base = document.getElementById('base');
      const quotaOk = ${quota.ok ? 'true' : 'false'};
      let current = null;

      function setFile(f) {
        if (!f) return;
        current = f;
        document.getElementById('fileName').textContent = f.name;
        document.getElementById('fileSize').textContent = Math.round(f.size / 1024) + ' Ko';
        document.getElementById('dropIdle').style.display = 'none';
        document.getElementById('fileMeta').style.display = 'block';
        go.disabled = !quotaOk;
        status.textContent = '';
        result.style.display = 'none';
      }
      drop.addEventListener('click', () => input.click());
      input.addEventListener('change', () => setFile(input.files[0]));
      ['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; }));
      ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = ''; }));
      drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) setFile(f); });

      go.addEventListener('click', async () => {
        if (!current || !quotaOk) return;
        go.disabled = true;
        status.textContent = 'Conversion en cours…';
        status.style.color = 'var(--ink-soft)';
        result.style.display = 'none';
        try {
          const html = await current.text();
          const q = new URLSearchParams({
            name: current.name.replace(/\\.[^.]+$/, ''),
            base: base.value.trim().replace(/\\/$/, ''),
          });
          const res = await fetch('/convert?' + q.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/html' },
            body: html,
            credentials: 'same-origin',
          });
          if (res.status === 401) { location.href = '/login'; return; }
          if (res.status === 402) throw new Error(await res.text() || 'Quota dépassé');
          if (!res.ok) throw new Error(await res.text());
          const stats = JSON.parse(res.headers.get('X-Convert-Stats') || '{}');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (stats.name || 'elementor') + '.zip';
          a.click();
          URL.revokeObjectURL(url);
          status.textContent = 'ZIP téléchargé.';
          status.style.color = 'var(--ok)';
          document.getElementById('stats').innerHTML =
            '<li>Éléments stylés : ' + (stats.styledElements ?? '—') + '</li>' +
            '<li>Images : ' + (stats.assetCount ?? '—') + '</li>' +
            '<li>Rejetés : ' + (stats.rejected ?? '—') + '</li>' +
            '<li>Trous : ' + (stats.holes ?? '—') + '</li>';
          result.style.display = 'block';
          setTimeout(() => location.reload(), 1200);
        } catch (e) {
          status.textContent = 'Erreur : ' + e.message;
          status.style.color = 'var(--err)';
        } finally {
          go.disabled = !current || !quotaOk;
        }
      });
    </script>`,
  });
}

export function adminPage({ user, stats, users, flash = '' }) {
  const rows = users
    .map((u) => {
      const active = !!u.active;
      return `<tr>
        <td>
          <strong>${escapeHtml(u.email)}</strong>
          ${u.name ? `<div class="muted">${escapeHtml(u.name)}</div>` : ''}
        </td>
        <td><span class="badge ${u.role === 'admin' ? 'admin' : ''}">${escapeHtml(u.role)}</span>
            ${!active ? ' <span class="badge off">inactif</span>' : ''}</td>
        <td>${u.conversions_this_month} / ${u.monthly_quota}</td>
        <td>${u.conversion_count}</td>
        <td>
          <form class="inline-form" method="post" action="/admin/users/${u.id}/quota">
            <input type="number" name="monthly_quota" min="0" value="${u.monthly_quota}" />
            <button class="btn small ghost" type="submit">Quota</button>
          </form>
        </td>
        <td>
          <form method="post" action="/admin/users/${u.id}/toggle" style="display:inline">
            <button class="btn small ${active ? 'danger' : ''}" type="submit">${active ? 'Désactiver' : 'Activer'}</button>
          </form>
          ${
            u.role !== 'admin'
              ? `<form method="post" action="/admin/users/${u.id}/role" style="display:inline;margin-left:4px">
                   <input type="hidden" name="role" value="admin" />
                   <button class="btn small ghost" type="submit">Promouvoir</button>
                 </form>`
              : u.id !== user.id
                ? `<form method="post" action="/admin/users/${u.id}/role" style="display:inline;margin-left:4px">
                     <input type="hidden" name="role" value="user" />
                     <button class="btn small ghost" type="submit">Rétrograder</button>
                   </form>`
                : ''
          }
        </td>
      </tr>`;
    })
    .join('');

  return layout({
    title: 'Admin',
    user,
    body: `
      <h1 style="font-family:var(--font-brand);font-size:28px;margin:8px 0 20px">Espace admin</h1>
      ${flash ? `<div class="alert ok">${escapeHtml(flash)}</div>` : ''}
      <div class="stats-row">
        <div class="stat"><strong>${stats.users}</strong><span>Utilisateurs</span></div>
        <div class="stat"><strong>${stats.activeUsers}</strong><span>Actifs</span></div>
        <div class="stat"><strong>${stats.conversionsThisMonth}</strong><span>Conversions ce mois</span></div>
        <div class="stat"><strong>${stats.conversions}</strong><span>Total conversions</span></div>
      </div>
      <div class="card">
        <h2 style="margin:0 0 14px;font-size:15px">Utilisateurs</h2>
        <div style="overflow-x:auto">
          <table class="data">
            <thead>
              <tr>
                <th>Compte</th><th>Rôle</th><th>Mois</th><th>Total</th><th>Quota</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`,
  });
}
