import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const salon = dbUser ? await prisma.salon.findUnique({ where: { ownerId: dbUser.id } }) : null;

  if (!salon?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement à gérer." }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: salon.stripeCustomerId,
      return_url: `${appUrl}/pro/abonnement`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Erreur Stripe (portail):", err);
    return NextResponse.json({ error: "Impossible d'ouvrir l'espace de gestion." }, { status: 502 });
  }
}
