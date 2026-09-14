import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [servicesRaw, bookingsRaw, blockedSlotsRaw] = await Promise.all([
    prisma.service.findMany({
      where: { salonId: id, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: { salonId: id, status: { in: ["CONFIRMED", "PENDING"] }, date: { gte: new Date() } },
      select: { date: true, durationMin: true },
    }),
    prisma.blockedSlot.findMany({
      where: { salonId: id, date: { gte: new Date() } },
      select: { date: true, durationMin: true },
    }),
  ]);

  const services = servicesRaw.map((s: { id: string; name: string; price: unknown; durationMin: number; depositPct: number }) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    durationMin: s.durationMin,
    depositPct: s.depositPct,
  }));

  const bookedSlots = [
    ...bookingsRaw.map((b: { date: Date; durationMin: number }) => ({
      start: b.date.toISOString(),
      durationMin: b.durationMin,
    })),
    ...blockedSlotsRaw.map((b: { date: Date; durationMin: number }) => ({
      start: b.date.toISOString(),
      durationMin: b.durationMin,
    })),
  ];

  return NextResponse.json({ services, bookedSlots });
}
