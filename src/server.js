#!/usr/bin/env node
import http from 'node:http';
import { convertHtml } from './convert.js';
import { createZip } from './zip.js';
import { initDb } from './db.js';
import {
  bootstrapAdmin,
  checkQuota,
  clearSessionCookie,
  createSession,
  createUser,
  destroySession,
  findUserByEmail,
  getSessionToken,
  getUserBySession,
  listUsers,
  adminStats,
  recentConversions,
  recordConversion,
  sessionCookie,
  setUserActive,
  setUserQuota,
  setUserRole,
  verifyPassword,
} from './auth.js';
import { loginPage, registerPage, convertPage, adminPage } from './web/ui.js';
import { landingPage } from './web/landing.js';
import { resolvePlan } from './plans.js';
import {
  mentionsLegalesPage,
  confidentialitePage,
  cguPage,
  cgvPage,
} from './web/legal.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4599;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY = (process.env.MAX_BODY_MB ? Number(process.env.MAX_BODY_MB) : 200) * 1024 * 1024;
const REGISTRATION_OPEN = process.env.REGISTRATION_OPEN !== '0';

class BodyTooLargeError extends Error {}

/** Only allow relative in-app redirects (open-redirect safe). */
function safeNext(value, fallback = '/app') {
  const v = String(value || '').trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return fallback;
  return v;
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : String(body);
  res.writeHead(status, headers);
  res.end(payload);
}

function sendHtml(res, status, html, extraHeaders = {}) {
  send(res, status, html, { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders });
}

function redirect(res, location, extraHeaders = {}) {
  send(res, 302, '', { Location: location, ...extraHeaders });
}

function readBody(req, { max = MAX_BODY, asText = true } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (c) => {
      size += c.length;
      if (size > max) {
        tooLarge = true;
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new BodyTooLargeError(`Fichier trop volumineux (max ${Math.round(max / 1024 / 1024)} Mo)`));
        return;
      }
      const buf = Buffer.concat(chunks);
      resolve(asText ? buf.toString('utf8') : buf);
    });
    req.on('error', reject);
  });
}

function parseForm(body) {
  const params = new URLSearchParams(body);
  const out = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function currentUser(req) {
  return getUserBySession(getSessionToken(req));
}

function requireUser(req, res, next = '/app') {
  const user = currentUser(req);
  if (!user) {
    redirect(res, `/login?next=${encodeURIComponent(next)}`);
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    sendHtml(res, 403, '<h1>403</h1><p>Accès admin requis. <a href="/">Retour</a></p>');
    return null;
  }
  return user;
}

function buildZipReadme(stats, name) {
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

initDb();
const bootstrapped = bootstrapAdmin();
if (bootstrapped) {
  console.log(`Admin bootstrap créé : ${bootstrapped.email}`);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const pathName = url.pathname;

    if (req.method === 'GET' && pathName === '/health') {
      send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': 'application/json; charset=utf-8' });
      return;
    }

    // —— Landing (public sales funnel) ——
    if (req.method === 'GET' && (pathName === '/' || pathName === '/index.html')) {
      sendHtml(res, 200, landingPage({ user: currentUser(req) }));
      return;
    }

    // —— Legal pages ——
    if (req.method === 'GET' && pathName === '/mentions-legales') {
      sendHtml(res, 200, mentionsLegalesPage({ user: currentUser(req) }));
      return;
    }
    if (req.method === 'GET' && pathName === '/confidentialite') {
      sendHtml(res, 200, confidentialitePage({ user: currentUser(req) }));
      return;
    }
    if (req.method === 'GET' && pathName === '/cgu') {
      sendHtml(res, 200, cguPage({ user: currentUser(req) }));
      return;
    }
    if (req.method === 'GET' && pathName === '/cgv') {
      sendHtml(res, 200, cgvPage({ user: currentUser(req) }));
      return;
    }

    // —— Auth pages ——
    if (req.method === 'GET' && pathName === '/login') {
      if (currentUser(req)) return redirect(res, safeNext(url.searchParams.get('next')));
      sendHtml(res, 200, loginPage({ next: url.searchParams.get('next') || '/app' }));
      return;
    }

    if (req.method === 'POST' && pathName === '/login') {
      const form = parseForm(await readBody(req, { max: 64 * 1024 }));
      const email = (form.email || '').trim();
      const next = safeNext(form.next || '/app');
      const user = findUserByEmail(email);
      if (!user || !user.active || !verifyPassword(form.password || '', user.password_hash)) {
        sendHtml(res, 401, loginPage({ error: 'E-mail ou mot de passe incorrect', email, next }));
        return;
      }
      const { token, expires } = createSession(user.id);
      redirect(res, next, { 'Set-Cookie': sessionCookie(token, expires) });
      return;
    }

    if (req.method === 'GET' && pathName === '/register') {
      if (currentUser(req)) return redirect(res, '/app');
      sendHtml(res, 200, registerPage({ open: REGISTRATION_OPEN, plan: url.searchParams.get('plan') || '' }));
      return;
    }

    if (req.method === 'POST' && pathName === '/register') {
      if (!REGISTRATION_OPEN) {
        sendHtml(res, 403, registerPage({ open: false }));
        return;
      }
      const form = parseForm(await readBody(req, { max: 64 * 1024 }));
      try {
        if (findUserByEmail(form.email)) throw new Error('Un compte existe déjà avec cet e-mail');
        const selected = resolvePlan(form.plan);
        const user = createUser({
          email: form.email,
          password: form.password,
          name: form.name,
          plan: selected.id,
          monthlyQuota: selected.monthlyQuota,
        });
        const { token, expires } = createSession(user.id);
        redirect(res, '/app', { 'Set-Cookie': sessionCookie(token, expires) });
      } catch (e) {
        sendHtml(
          res,
          400,
          registerPage({
            error: e.message || 'Inscription impossible',
            email: form.email,
            name: form.name,
            plan: form.plan || '',
            open: true,
          }),
        );
      }
      return;
    }

    if (req.method === 'POST' && pathName === '/logout') {
      destroySession(getSessionToken(req));
      redirect(res, '/', { 'Set-Cookie': clearSessionCookie() });
      return;
    }

    // —— App (authenticated) ——
    if (req.method === 'GET' && pathName === '/app') {
      const user = requireUser(req, res, '/app');
      if (!user) return;
      const quota = checkQuota(user);
      const history = recentConversions(user.id, 12);
      sendHtml(res, 200, convertPage({ user, quota, history }));
      return;
    }

    // —— Admin ——
    if (req.method === 'GET' && pathName === '/admin') {
      const user = requireAdmin(req, res);
      if (!user) return;
      sendHtml(
        res,
        200,
        adminPage({
          user,
          stats: adminStats(),
          users: listUsers(),
          flash: url.searchParams.get('ok') || '',
        }),
      );
      return;
    }

    const adminUserMatch = pathName.match(/^\/admin\/users\/(\d+)\/(toggle|quota|role)$/);
    if (req.method === 'POST' && adminUserMatch) {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const targetId = Number(adminUserMatch[1]);
      const action = adminUserMatch[2];
      const form = parseForm(await readBody(req, { max: 16 * 1024 }));

      if (action === 'toggle') {
        const users = listUsers();
        const target = users.find((u) => u.id === targetId);
        if (!target) return redirect(res, '/admin');
        if (target.id === admin.id && target.active) {
          return redirect(res, '/admin?ok=' + encodeURIComponent('Vous ne pouvez pas vous désactiver'));
        }
        setUserActive(targetId, !target.active);
        return redirect(res, '/admin?ok=' + encodeURIComponent('Compte mis à jour'));
      }

      if (action === 'quota') {
        setUserQuota(targetId, form.monthly_quota);
        return redirect(res, '/admin?ok=' + encodeURIComponent('Quota mis à jour'));
      }

      if (action === 'role') {
        if (targetId === admin.id) {
          return redirect(res, '/admin?ok=' + encodeURIComponent('Vous ne pouvez pas modifier votre propre rôle'));
        }
        setUserRole(targetId, form.role === 'admin' ? 'admin' : 'user');
        return redirect(res, '/admin?ok=' + encodeURIComponent('Rôle mis à jour'));
      }
    }

    // —— Convert API (auth + quota) ——
    if (req.method === 'POST' && pathName === '/convert') {
      const user = getUserBySession(getSessionToken(req));
      if (!user) {
        send(res, 401, 'Authentification requise');
        return;
      }
      const quota = checkQuota(user);
      if (!quota.ok) {
        send(res, 402, `Quota mensuel atteint (${quota.used}/${quota.limit})`);
        return;
      }

      const name = (url.searchParams.get('name') || 'page').replace(/[^\w.-]/g, '_') || 'page';
      const assetsBase = url.searchParams.get('base') || '';
      const html = await readBody(req);
      if (!html.trim()) throw new Error('Corps HTML vide');

      const { template, report, assets, stats } = convertHtml(html, { assetsBase, title: name });
      const fullStats = { ...stats, name };
      recordConversion(user.id, fullStats, Buffer.byteLength(html, 'utf8'));

      const entries = [
        { name: `${name}.elementor.json`, data: JSON.stringify(template, null, 2) },
        { name: `${name}.style-report.json`, data: JSON.stringify(report, null, 2) },
        { name: 'README.txt', data: buildZipReadme(fullStats, name) },
        ...assets.map((a) => ({ name: `assets/${a.file}`, data: a.buffer })),
      ];
      const zip = createZip(entries);

      send(res, 200, zip, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}.zip"`,
        'Content-Length': zip.length,
        'X-Convert-Stats': JSON.stringify(fullStats),
      });
      return;
    }

    send(res, 404, 'Not found');
  } catch (e) {
    const status = e instanceof BodyTooLargeError ? 413 : 400;
    send(res, status, String(e && e.message ? e.message : e), { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Le port ${PORT} est déjà utilisé (un serveur tourne peut-être déjà).`);
    console.error(`  → Ouvrez http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} , ou : PORT=4600 npm run serve`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Convert SaaS : http://${displayHost}:${PORT}`);
  if (!process.env.BOOTSTRAP_ADMIN_EMAIL) {
    console.log('Astuce : définissez BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD pour créer le 1er admin.');
  }
  console.log('Arrêt : Ctrl+C');
});
