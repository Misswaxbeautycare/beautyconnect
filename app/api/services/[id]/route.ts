import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { serviceSchema } from "@/lib/validations";
import { getEffectivePlan } from "@/lib/subscription-plans";

async function assertOwnership(serviceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" as const, status: 401 as const };

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const salon = dbUser ? await prisma.salon.findUnique({ where: { ownerId: dbUser.id } }) : null;
  const service = await prisma.service.findUnique({ where: { id: serviceId } });

  if (!salon || !service || service.salonId !== salon.id) {
    return { error: "Prestation introuvable" as const, status: 404 as const };
  }
  return { service, salon };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await assertOwnership(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await req.json();

  // Bascule rapide "en vente / masquée" depuis la liste — ne passe pas par
  // la validation complète du formulaire d'édition.
  if (Object.keys(body).length === 1 && "isActive" in body) {
    const updated = await prisma.service.update({
      where: { id },
      data: { isActive: Boolean(body.isActive) },
    });
    return NextResponse.json({ service: updated });
  }

  const parsed = serviceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.modes) {
    const plan = getEffectivePlan(result.salon);
    if (!plan.multiModePrestations && parsed.data.modes.some((m) => m !== "SALON")) {
      return NextResponse.json(
        { error: "Les prestations à domicile ou en déplacement nécessitent la formule Signature ou Prestige." },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.service.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ service: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await assertOwnership(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
