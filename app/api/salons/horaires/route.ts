import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

interface JourInput {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export async function PATCH(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const body = await req.json();
  const jours: JourInput[] = Array.isArray(body.jours) ? body.jours : [];

  const valides = jours.filter(
    (j) =>
      typeof j.dayOfWeek === "number" &&
      j.dayOfWeek >= 0 &&
      j.dayOfWeek <= 6 &&
      typeof j.openTime === "string" &&
      typeof j.closeTime === "string"
  );

  if (valides.length !== 7) {
    return NextResponse.json({ error: "Les 7 jours de la semaine sont requis." }, { status: 400 });
  }

  // Remplace toute la semaine en une fois — plus simple et plus sûr qu'un
  // upsert jour par jour, vu qu'on reçoit toujours les 7 jours ensemble.
  await prisma.$transaction([
    prisma.openingHour.deleteMany({ where: { salonId: salon.id } }),
    prisma.openingHour.createMany({
      data: valides.map((j) => ({
        salonId: salon.id,
        dayOfWeek: j.dayOfWeek,
        openTime: j.openTime,
        closeTime: j.closeTime,
        isClosed: j.isClosed,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
