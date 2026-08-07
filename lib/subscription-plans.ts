export interface SubscriptionPlan {
  id: "essentiel" | "signature" | "prestige";
  name: string;
  price: number;
  envVar: string;
  features: string[];
  highlighted?: boolean;
  // Capacités réellement appliquées dans le produit (pas juste du texte) :
  maxPhotos: number;
  onlinePayment: boolean;
  priorityPlacement: boolean;
  prioritySupport: boolean;
  hasBoutique: boolean;
  // Modes de prestation "à domicile" / "le pro se déplace" — Essentiel reste
  // limité au mode "en salon" uniquement.
  multiModePrestations: boolean;
  // Nombre maximum de membres d'équipe affichables sur la fiche salon.
  maxTeamMembers: number;
  // Relance automatique par email des clientes inactives (~30 jours).
  reEngagementEmails: boolean;
}

// Source unique des 3 formules. Chaque prix correspond à un Price récurrent
// créé dans le tableau de bord Stripe — son identifiant (price_...) doit être
// renseigné dans la variable d'environnement Vercel correspondante.
//
// Important : ces champs sont utilisés directement par le code (formulaires
// salon/service, tri des résultats, cron de relance...) — ce ne sont pas de
// simples mentions marketing.
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: 19,
    envVar: "STRIPE_PRICE_ESSENTIEL",
    maxPhotos: 5,
    onlinePayment: false,
    priorityPlacement: false,
    prioritySupport: false,
    hasBoutique: false,
    multiModePrestations: false,
    maxTeamMembers: 0,
    reEngagementEmails: false,
    features: [
      "Agenda et prise de rendez-vous en ligne",
      "Jusqu'à 5 photos de salon",
      "Réservations réglées sur place",
      "Clientes fidèles et carnet de contacts",
      "Rappels automatiques par email",
      "Réponse publique aux avis",
      "Prestations en salon uniquement",
    ],
  },
  {
    id: "signature",
    name: "Signature",
    price: 29,
    envVar: "STRIPE_PRICE_SIGNATURE",
    highlighted: true,
    maxPhotos: 10,
    onlinePayment: true,
    priorityPlacement: false,
    prioritySupport: false,
    hasBoutique: false,
    multiModePrestations: true,
    maxTeamMembers: 3,
    reEngagementEmails: true,
    features: [
      "Tout Essentiel",
      "Jusqu'à 10 photos de salon",
      "Paiement en ligne (acompte ou intégral) en plus du paiement sur place",
      "Prestations à domicile et déplacement chez la cliente",
      "Équipe affichée sur la fiche (jusqu'à 3 membres)",
      "Relance automatique des clientes inactives",
    ],
  },
  {
    id: "prestige",
    name: "Prestige",
    price: 39,
    envVar: "STRIPE_PRICE_PRESTIGE",
    maxPhotos: 20,
    onlinePayment: true,
    priorityPlacement: true,
    prioritySupport: true,
    hasBoutique: true,
    multiModePrestations: true,
    maxTeamMembers: Infinity,
    reEngagementEmails: true,
    features: [
      "Tout Signature",
      "Jusqu'à 20 photos de salon",
      "Mise en avant prioritaire dans les résultats",
      "Support prioritaire",
      "Boutique en ligne (vente de produits)",
      "Équipe illimitée sur la fiche",
    ],
  },
];

// Formule appliquée par défaut à un salon sans abonnement actif — la limite
// la plus basse, pour inciter à s'abonner sans pour autant bloquer totalement
// un salon qui vient d'être créé.
export const defaultPlan = subscriptionPlans[0];

export function getPlan(planId: string | null | undefined): SubscriptionPlan {
  return subscriptionPlans.find((p) => p.id === planId) ?? defaultPlan;
}

// Un abonnement compte comme actif seulement s'il est en essai ou payé à
// jour — pas s'il est annulé, impayé ou en retard de paiement, auquel cas
// le salon retombe sur les limites de la formule de base.
export function getEffectivePlan(salon: {
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
}): SubscriptionPlan {
  const activeStatuses = ["trialing", "active"];
  if (!salon.subscriptionStatus || !activeStatuses.includes(salon.subscriptionStatus)) {
    return defaultPlan;
  }
  return getPlan(salon.subscriptionPlan);
}
