import Stripe from "stripe";

// Valeur de secours pour permettre au build de passer avant que Stripe soit configuré.
// Les vrais paiements nécessiteront la variable STRIPE_SECRET_KEY sur Vercel.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  typescript: true,
});

// Permet aux routes de paiement de distinguer "Stripe n'est pas configuré du
// tout" d'une vraie erreur Stripe — un message clair au lieu d'un "Erreur"
// générique qui ne dit pas où chercher.
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY) && process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder";
}
