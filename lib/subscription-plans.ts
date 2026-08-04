export interface SubscriptionPlan {
  id: "essentiel" | "signature" | "prestige";
  name: string;
  price: number;
  envVar: string;
  features: string[];
  highlighted?: boolean;
}

// Source unique des 3 formules. Chaque prix correspond à un Price récurrent
// créé dans le tableau de bord Stripe — son identifiant (price_...) doit être
// renseigné dans la variable d'environnement Vercel correspondante.
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: 19,
    envVar: "STRIPE_PRICE_ESSENTIEL",
    features: [
      "Agenda et prise de rendez-vous en ligne",
      "Jusqu'à 5 photos de salon",
      "Rappels automatiques par email",
    ],
  },
  {
    id: "signature",
    name: "Signature",
    price: 29,
    envVar: "STRIPE_PRICE_SIGNATURE",
    highlighted: true,
    features: [
      "Tout Essentiel",
      "Clientes fidèles et carnet de contacts",
      "Paiement en ligne (acompte ou intégral)",
    ],
  },
  {
    id: "prestige",
    name: "Prestige",
    price: 39,
    envVar: "STRIPE_PRICE_PRESTIGE",
    features: [
      "Tout Signature",
      "Mise en avant prioritaire dans les résultats",
      "Support prioritaire",
    ],
  },
];
