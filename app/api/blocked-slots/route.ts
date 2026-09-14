import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { z } from "zod";

const blockedSlotSchema = z.object({
  date: z.string(),
  durationMin: z.number().int().min(15).max(1440),
  reason: z.string().max(200).optional(),
});

export async function GET() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { salonId: salon.id, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ blockedSlots });
}

export async function POST(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const body = await req.json();
  const parsed = blockedSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { date, durationMin, reason } = parsed.data;

  // On refuse de bloquer un créneau qui chevauche un rendez-vous déjà pris
  // par une cliente — il faudrait d'abord gérer ce rendez-vous autrement.
  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + durationMin * 60000);
  const conflict = await prisma.booking.findFirst({
    where: {
      salonId: salon.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { lt: endDate },
    },
  });
  if (conflict) {
    const conflictEnd = new Date(conflict.date.getTime() + conflict.durationMin * 60000);
    if (conflictEnd > startDate) {
      return NextResponse.json(
        { error: "Un rendez-vous est déjà pris sur ce créneau — impossible de le bloquer." },
        { status: 409 }
      );
    }
  }

  const blockedSlot = await prisma.blockedSlot.create({
    data: { salonId: salon.id, date: startDate, durationMin, reason },
  });

  return NextResponse.json({ blockedSlot });
}
