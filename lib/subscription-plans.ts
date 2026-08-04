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
}

// Source unique des 3 formules. Chaque prix correspond à un Price récurrent
// créé dans le tableau de bord Stripe — son identifiant (price_...) doit être
// renseigné dans la variable d'environnement Vercel correspondante.
//
// Important : les champs maxPhotos / onlinePayment / priorityPlacement sont
// utilisés directement par le code (formulaires salon, réservation, tri des
// résultats) — ce ne sont pas de simples mentions marketing.
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
    features: [
      "Agenda et prise de rendez-vous en ligne",
      "Jusqu'à 5 photos de salon",
      "Réservations réglées sur place",
      "Clientes fidèles et carnet de contacts",
      "Rappels automatiques par email",
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
    features: [
      "Tout Essentiel",
      "Jusqu'à 10 photos de salon",
      "Paiement en ligne (acompte ou intégral) en plus du paiement sur place",
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
    features: [
      "Tout Signature",
      "Jusqu'à 20 photos de salon",
      "Mise en avant prioritaire dans les résultats",
      "Support prioritaire",
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
