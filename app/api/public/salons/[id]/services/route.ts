import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const servicesRaw = await prisma.service.findMany({
    where: { salonId: id, isActive: true },
    orderBy: { name: "asc" },
  });

  const services = servicesRaw.map((s: { id: string; name: string; price: unknown; durationMin: number; depositPct: number }) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    durationMin: s.durationMin,
    depositPct: s.depositPct,
  }));

  return NextResponse.json({ services });
}
