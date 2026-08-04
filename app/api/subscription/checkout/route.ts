import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { subscriptionPlans } from "@/lib/subscription-plans";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const plan = subscriptionPlans.find((p) => p.id === body.plan);
  if (!plan) {
    return NextResponse.json({ error: "Formule invalide." }, { status: 400 });
  }

  const priceId = process.env[plan.envVar];
  if (!priceId) {
    return NextResponse.json(
      { error: `L'abonnement '${plan.name}' n'est pas encore configuré (${plan.envVar} manquant).` },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  try {
    let customerId = salon.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: salon.name,
        metadata: { salonId: salon.id },
      });
      customerId = customer.id;
      await prisma.salon.update({
        where: { id: salon.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { salonId: salon.id, plan: plan.id },
      },
      metadata: { type: "subscription", salonId: salon.id, plan: plan.id },
      success_url: `${appUrl}/pro/abonnement?success=1`,
      cancel_url: `${appUrl}/pro/abonnement?cancelled=1`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Erreur Stripe (abonnement):", err);
    return NextResponse.json(
      { error: "Impossible de démarrer l'abonnement. Vérifiez la configuration Stripe." },
      { status: 502 }
    );
  }
}
