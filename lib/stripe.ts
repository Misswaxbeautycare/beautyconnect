import Stripe from "stripe";

// Valeur de secours pour permettre au build de passer avant que Stripe soit configuré.
// Les vrais paiements nécessiteront la variable STRIPE_SECRET_KEY sur Vercel.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  typescript: true,
});
