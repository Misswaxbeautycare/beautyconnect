import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  if (!isStripeConfigured()) {
    return NextResponse.json({
      ok: false,
      message: "Aucune clé Stripe n'est configurée sur le serveur (STRIPE_SECRET_KEY absente ou toujours sur la valeur de secours).",
    });
  }

  try {
    const account = await stripe.accounts.retrieve();
    return NextResponse.json({
      ok: true,
      message: "La clé Stripe fonctionne et le compte a répondu correctement.",
      mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live (vrais paiements)" : "test",
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      accountEmail: account.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({
      ok: false,
      message: `La clé Stripe est présente mais Stripe a refusé la requête : ${message}`,
    });
  }
}
