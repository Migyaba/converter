/**
 * Infos légales Convert.
 * Surcharge possible via variables d’environnement (voir .env.example).
 */

export const LEGAL = {
  siteName: 'Convert.',
  siteUrl: process.env.SITE_URL || 'http://127.0.0.1:4599',
  contactEmail: process.env.LEGAL_CONTACT_EMAIL || 'm.missetcho@gmail.com',

  // Éditeur / responsable du site
  companyName: process.env.LEGAL_COMPANY_NAME || 'Miguel Missetcho',
  legalForm: process.env.LEGAL_FORM || 'Auto-entrepreneur',
  shareCapital: process.env.LEGAL_SHARE_CAPITAL || 'Non applicable',
  /** Identifiant fiscal / registre local (IFU, RCCM, etc.) */
  siren: process.env.LEGAL_SIREN || '',
  siret: process.env.LEGAL_SIRET || '',
  rcsCity: process.env.LEGAL_RCS_CITY || 'Abomey-Calavi',
  vatNumber: process.env.LEGAL_VAT || 'Non applicable',
  address:
    process.env.LEGAL_ADDRESS || 'Abomey-Calavi, Zogbadjè, République du Bénin',
  publicationDirector:
    process.env.LEGAL_PUBLICATION_DIRECTOR || 'Miguel Missetcho',

  // Hébergeur
  hostName: process.env.LEGAL_HOST_NAME || 'Contabo GmbH',
  hostAddress:
    process.env.LEGAL_HOST_ADDRESS || 'Welfenstrasse 22, 81541 Munich, Germany',
  hostWebsite: process.env.LEGAL_HOST_WEBSITE || 'https://contabo.com',

  // Droit applicable
  governingLaw: process.env.LEGAL_GOVERNING_LAW || 'droit béninois',
  jurisdiction:
    process.env.LEGAL_JURISDICTION || 'tribunaux compétents d’Abomey-Calavi',

  lastUpdated: process.env.LEGAL_LAST_UPDATED || '23 juillet 2026',
};

export function missingLegalFields() {
  const required = [
    'companyName',
    'legalForm',
    'address',
    'contactEmail',
    'publicationDirector',
    'hostName',
    'hostAddress',
  ];
  return required.filter((k) => !String(LEGAL[k] || '').trim());
}

export function val(key, fallback = 'À compléter') {
  const v = String(LEGAL[key] || '').trim();
  return v || fallback;
}
