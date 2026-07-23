/** Plan catalog — quotas & pricing for the SaaS. */

export const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    priceLabel: '0 €',
    priceSuffix: '/ mois',
    monthlyQuota: Number(process.env.FREE_MONTHLY_QUOTA || process.env.DEFAULT_MONTHLY_QUOTA || 3),
    features: ['Export ZIP complet', 'Historique des conversions'],
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    priceLabel: '15 €',
    priceSuffix: '/ mois',
    monthlyQuota: Number(process.env.STANDARD_MONTHLY_QUOTA || 50),
    features: ['Export ZIP complet', 'Historique des conversions', 'Fichiers plus volumineux'],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    priceLabel: '29 €',
    priceSuffix: '/ mois',
    monthlyQuota: Number(process.env.PRO_MONTHLY_QUOTA || 500),
    features: ['Fichiers lourds prioritaires', 'Support prioritaire', 'Accès multi-utilisateurs'],
  },
};

export function resolvePlan(raw) {
  const id = String(raw || 'free').toLowerCase().trim();
  if (id === 'standard' || id === 'pro') return PLANS[id];
  return PLANS.free;
}
