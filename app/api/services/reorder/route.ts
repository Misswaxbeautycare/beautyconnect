import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

// Échange la position de deux prestations du même salon — utilisé pour les
// flèches "monter / descendre" de la liste, plus fiable qu'un glisser-déposer
// sur mobile.
export async function PATCH(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const body = await req.json();
  const serviceIdA = typeof body.serviceIdA === "string" ? body.serviceIdA : null;
  const serviceIdB = typeof body.serviceIdB === "string" ? body.serviceIdB : null;
  if (!serviceIdA || !serviceIdB) {
    return NextResponse.json({ error: "Deux prestations sont requises." }, { status: 400 });
  }

  const [serviceA, serviceB] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceIdA } }),
    prisma.service.findUnique({ where: { id: serviceIdB } }),
  ]);

  if (
    !serviceA ||
    !serviceB ||
    serviceA.salonId !== salon.id ||
    serviceB.salonId !== salon.id
  ) {
    return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.service.update({ where: { id: serviceA.id }, data: { order: serviceB.order } }),
    prisma.service.update({ where: { id: serviceB.id }, data: { order: serviceA.order } }),
  ]);

  return NextResponse.json({ ok: true });
}
