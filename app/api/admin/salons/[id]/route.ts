import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { subscriptionPlans } from "@/lib/subscription-plans";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  return dbUser?.role === "ADMIN" ? dbUser : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const planId = body.plan === "none" ? null : body.plan;

  if (planId && !subscriptionPlans.some((p) => p.id === planId)) {
    return NextResponse.json({ error: "Formule invalide" }, { status: 400 });
  }

  const salon = await prisma.salon.update({
    where: { id },
    data: {
      subscriptionPlan: planId,
      // "active" simule un abonnement payé à jour, indépendamment de Stripe —
      // pratique pour offrir un accès (ex: compte du fondateur, partenariat)
      // sans passer par un vrai paiement.
      subscriptionStatus: planId ? "active" : null,
    },
  });

  return NextResponse.json({ salon });
}
