import { LEGAL, missingLegalFields, val } from '../legal.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function legalLayout({ title, user = null, body }) {
  const missing = missingLegalFields();
  const warn = missing.length
    ? `<div class="legal-warn">Certaines informations légales sont encore à renseigner (${escapeHtml(missing.join(', '))}).</div>`
    : '';

  const nav = user
    ? `<nav class="lnav"><a href="/app">Espace</a><a href="/">Accueil</a></nav>`
    : `<nav class="lnav"><a href="/">Accueil</a><a href="/login">Connexion</a></nav>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — Convert</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --ink: #0b1219; --soft: #44505c; --muted: #6b7785; --line: #d9e0e8;
    --paper: #eef2f6; --white: #fff; --accent: #0f5f8a;
    --font-brand: "Syne", sans-serif; --font-ui: "IBM Plex Sans", sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: var(--font-ui); color: var(--ink); background: var(--paper); line-height: 1.55; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .wrap { width: min(760px, calc(100% - 40px)); margin: 0 auto; }
  .top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 0; border-bottom: 1px solid var(--line);
  }
  .logo {
    font-family: var(--font-brand); font-weight: 800; font-size: 18px;
    letter-spacing: -0.04em; color: var(--ink); text-decoration: none;
  }
  .logo span { color: var(--accent); }
  .lnav { display: flex; gap: 16px; font-size: 13px; }
  .lnav a { color: var(--soft); text-decoration: none; }
  main { padding: 40px 0 72px; }
  h1 {
    font-family: var(--font-brand); font-size: clamp(28px, 4vw, 36px);
    letter-spacing: -0.04em; margin: 0 0 8px;
  }
  .meta { color: var(--muted); font-size: 13px; margin: 0 0 28px; }
  .legal-warn {
    background: #fff6e8; border: 1px solid #ecd4a8; color: #7a5310;
    padding: 12px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 24px;
  }
  .card {
    background: var(--white); border: 1px solid var(--line);
    border-radius: 10px; padding: 28px 26px;
  }
  h2 {
    font-family: var(--font-brand); font-size: 18px; letter-spacing: -0.03em;
    margin: 28px 0 10px;
  }
  h2:first-child { margin-top: 0; }
  p, li { color: var(--soft); font-size: 14.5px; }
  ul { padding-left: 18px; }
  .todo { color: #a15c12; font-style: italic; }
  footer {
    border-top: 1px solid var(--line); padding: 20px 0 28px; font-size: 13px; color: var(--muted);
  }
  footer .wrap { display: flex; flex-wrap: wrap; gap: 12px 20px; justify-content: space-between; }
  footer nav { display: flex; flex-wrap: wrap; gap: 14px; }
  footer a { color: var(--muted); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a class="logo" href="/">Convert<span>.</span></a>
      ${nav}
    </div>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">Dernière mise à jour : ${escapeHtml(LEGAL.lastUpdated)}</p>
      ${warn}
      <div class="card">${body}</div>
    </main>
  </div>
  ${siteFooter()}
</body>
</html>`;
}

export function siteFooter() {
  return `<footer>
    <div class="wrap">
      <a class="logo" href="/" style="font-family:Syne,sans-serif;font-weight:800;color:#0b1219;text-decoration:none">Convert<span style="color:#0f5f8a">.</span></a>
      <nav aria-label="Liens légaux">
        <a href="/mentions-legales">Mentions légales</a>
        <a href="/confidentialite">Confidentialité</a>
        <a href="/cgu">CGU</a>
        <a href="/cgv">CGV</a>
      </nav>
    </div>
  </footer>`;
}

function incomplete(label) {
  return `<span class="todo">${escapeHtml(label)}</span>`;
}

export function mentionsLegalesPage({ user = null } = {}) {
  const body = `
    <h2>1. Éditeur du site</h2>
    <p>Le site <strong>${escapeHtml(LEGAL.siteName)}</strong> (${escapeHtml(LEGAL.siteUrl)}) est édité par :</p>
    <ul>
      <li>Nom / raison sociale : <strong>${escapeHtml(val('companyName'))}</strong></li>
      <li>Statut : ${escapeHtml(val('legalForm'))}</li>
      <li>Capital social : ${escapeHtml(val('shareCapital', 'Non applicable'))}</li>
      <li>IFU / identifiant fiscal : ${escapeHtml(val('siren', 'À compléter si disponible'))}</li>
      <li>RCCM / registre : ${escapeHtml(val('siret', 'À compléter si disponible'))} ${LEGAL.rcsCity ? `(${escapeHtml(LEGAL.rcsCity)})` : ''}</li>
      <li>N° TVA : ${escapeHtml(val('vatNumber', 'Non applicable'))}</li>
      <li>Siège / adresse : ${escapeHtml(val('address'))}</li>
      <li>E-mail de contact : ${LEGAL.contactEmail ? `<a href="mailto:${escapeHtml(LEGAL.contactEmail)}">${escapeHtml(LEGAL.contactEmail)}</a>` : incomplete('À compléter')}</li>
    </ul>

    <h2>2. Directeur de la publication</h2>
    <p>${escapeHtml(val('publicationDirector'))}</p>

    <h2>3. Hébergement</h2>
    <ul>
      <li>Hébergeur : ${escapeHtml(val('hostName'))}</li>
      <li>Adresse : ${escapeHtml(val('hostAddress'))}</li>
      <li>Site : ${LEGAL.hostWebsite ? `<a href="${escapeHtml(LEGAL.hostWebsite)}" rel="noopener noreferrer">${escapeHtml(LEGAL.hostWebsite)}</a>` : incomplete('À compléter')}</li>
    </ul>

    <h2>4. Propriété intellectuelle</h2>
    <p>L’ensemble des éléments du site ${escapeHtml(LEGAL.siteName)} (textes, interfaces, logos, marques, code) est protégé. Toute reproduction non autorisée est interdite.</p>

    <h2>5. Contact</h2>
    <p>Pour toute question relative aux présentes mentions : ${LEGAL.contactEmail ? `<a href="mailto:${escapeHtml(LEGAL.contactEmail)}">${escapeHtml(LEGAL.contactEmail)}</a>` : incomplete('e-mail à compléter')}.</p>
  `;
  return legalLayout({ title: 'Mentions légales', user, body });
}

export function confidentialitePage({ user = null } = {}) {
  const body = `
    <h2>1. Responsable du traitement</h2>
    <p>${escapeHtml(val('companyName'))}, ${escapeHtml(val('address'))}. Contact : ${LEGAL.contactEmail ? `<a href="mailto:${escapeHtml(LEGAL.contactEmail)}">${escapeHtml(LEGAL.contactEmail)}</a>` : incomplete('e-mail à compléter')}.</p>

    <h2>2. Données collectées</h2>
    <p>Dans le cadre du service ${escapeHtml(LEGAL.siteName)}, nous pouvons collecter :</p>
    <ul>
      <li>Données de compte : nom, adresse e-mail, mot de passe (stocké de façon sécurisée / hashé)</li>
      <li>Données d’usage : historique des conversions, quotas, journaux techniques</li>
      <li>Fichiers HTML que vous uploadez pour conversion (traités pour fournir le service)</li>
    </ul>

    <h2>3. Finalités</h2>
    <ul>
      <li>Création et gestion du compte utilisateur</li>
      <li>Fourniture du service de conversion HTML → Elementor</li>
      <li>Suivi des quotas et de la sécurité</li>
      <li>Support et communication liés au service</li>
    </ul>

    <h2>4. Base légale</h2>
    <p>Exécution du contrat (fourniture du service), intérêt légitime (sécurité, amélioration) et, le cas échéant, consentement.</p>

    <h2>5. Durée de conservation</h2>
    <p>Les données de compte sont conservées tant que le compte est actif, puis pendant une durée limitée nécessaire aux obligations légales. Les fichiers uploadés sont traités pour la conversion ; leur conservation longue n’est pas l’objet du service.</p>

    <h2>6. Destinataires</h2>
    <p>Accès limité à l’éditeur du service et, le cas échéant, à ses sous-traitants techniques (hébergement). Pas de revente de données personnelles.</p>

    <h2>7. Vos droits (RGPD)</h2>
    <p>Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Pour les exercer : ${LEGAL.contactEmail ? `<a href="mailto:${escapeHtml(LEGAL.contactEmail)}">${escapeHtml(LEGAL.contactEmail)}</a>` : incomplete('e-mail à compléter')}. Vous pouvez aussi saisir la CNIL.</p>

    <h2>8. Cookies</h2>
    <p>Le site utilise un cookie de session technique (authentification) nécessaire au fonctionnement du service. Pas de cookies publicitaires tiers à ce jour.</p>
  `;
  return legalLayout({ title: 'Politique de confidentialité', user, body });
}

export function cguPage({ user = null } = {}) {
  const body = `
    <h2>1. Objet</h2>
    <p>Les présentes Conditions Générales d’Utilisation (CGU) régissent l’accès et l’usage de ${escapeHtml(LEGAL.siteName)}, service de conversion de pages HTML vers des modèles Elementor.</p>

    <h2>2. Compte utilisateur</h2>
    <p>Vous êtes responsable de la confidentialité de vos identifiants et des contenus que vous soumettez. Les comptes inactifs ou abusifs peuvent être suspendus.</p>

    <h2>3. Usage acceptable</h2>
    <ul>
      <li>Ne pas tenter de compromettre la sécurité du service</li>
      <li>Ne pas uploader de contenus illicites ou portant atteinte aux droits de tiers</li>
      <li>Respecter les quotas associés à votre offre</li>
    </ul>

    <h2>4. Propriété des contenus</h2>
    <p>Vous conservez vos droits sur les fichiers HTML transmis. Vous accordez à ${escapeHtml(LEGAL.siteName)} une licence limitée pour les traiter aux seules fins de conversion.</p>

    <h2>5. Disponibilité</h2>
    <p>Le service est fourni « en l’état ». Des interruptions (maintenance, incidents) peuvent survenir sans que cela engage automatiquement la responsabilité de l’éditeur.</p>

    <h2>6. Responsabilité</h2>
    <p>L’éditeur ne garantit pas que le résultat Elementor reproduira parfaitement chaque détail du HTML source. Une vérification après import reste de votre responsabilité.</p>

    <h2>7. Droit applicable</h2>
    <p>Les présentes CGU sont soumises au ${escapeHtml(LEGAL.governingLaw)}. ${LEGAL.jurisdiction ? `Litiges : ${escapeHtml(LEGAL.jurisdiction)}.` : incomplete('Juridiction à compléter.')}</p>
  `;
  return legalLayout({ title: 'Conditions générales d’utilisation', user, body });
}

export function cgvPage({ user = null } = {}) {
  const body = `
    <h2>1. Prestataire</h2>
    <p>${escapeHtml(val('companyName'))} — ${escapeHtml(val('address'))}. Contact : ${LEGAL.contactEmail ? `<a href="mailto:${escapeHtml(LEGAL.contactEmail)}">${escapeHtml(LEGAL.contactEmail)}</a>` : incomplete('e-mail à compléter')}.</p>

    <h2>2. Offres</h2>
    <p>${escapeHtml(LEGAL.siteName)} propose des formules Free, Standard et Pro, décrites sur la page Tarifs. Les quotas mensuels s’appliquent par compte.</p>

    <h2>3. Prix et paiement</h2>
    <p>Les prix sont indiqués en euros. Le paiement en ligne (Stripe) sera mis en place prochainement. En attendant, l’activation Standard / Pro peut être effectuée manuellement par un administrateur.</p>

    <h2>4. Souscription et renouvellement</h2>
    <p>Les offres payantes sont souscrites pour une période mensuelle, renouvelable selon les modalités qui seront précisées lors de l’activation du paiement.</p>

    <h2>5. Rétractation / remboursement</h2>
    <p>${incomplete('À préciser selon votre statut (B2B / B2C) et votre politique commerciale.')}</p>

    <h2>6. Suspension</h2>
    <p>En cas de non-paiement ou d’usage abusif, l’accès aux fonctionnalités payantes peut être suspendu.</p>

    <h2>7. Droit applicable</h2>
    <p>${escapeHtml(LEGAL.governingLaw)}. ${LEGAL.jurisdiction ? `Litiges : ${escapeHtml(LEGAL.jurisdiction)}.` : incomplete('Juridiction à compléter.')}</p>
  `;
  return legalLayout({ title: 'Conditions générales de vente', user, body });
}
