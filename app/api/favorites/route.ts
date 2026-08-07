import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function GET() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ salonIds: [] });

  const favorites = await prisma.favorite.findMany({
    where: { clientId: dbUser.id },
    select: { salonId: true },
  });

  return NextResponse.json({ salonIds: favorites.map((f: { salonId: string }) => f.salonId) });
}

export async function POST(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const salonId = typeof body.salonId === "string" ? body.salonId : null;
  if (!salonId) return NextResponse.json({ error: "salonId requis" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { clientId_salonId: { clientId: dbUser.id, salonId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { clientId_salonId: { clientId: dbUser.id, salonId } },
    });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { clientId: dbUser.id, salonId } });
  return NextResponse.json({ favorited: true });
}
