import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  return dbUser?.role === "ADMIN" ? dbUser : null;
}

// Marque tous les paiements en attente de versement d'un salon comme
// "reversés" — à utiliser une fois le virement manuel effectué en dehors
// de l'application (pas d'automatisation Stripe Connect pour l'instant).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ salonId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { salonId } = await params;

  const result = await prisma.payment.updateMany({
    where: {
      payoutStatus: "PENDING",
      status: "PAID",
      booking: { salonId },
    },
    data: { payoutStatus: "PAID", paidOutAt: new Date() },
  });

  return NextResponse.json({ ok: true, count: result.count });
}
