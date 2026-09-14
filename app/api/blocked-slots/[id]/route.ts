import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const blockedSlot = await prisma.blockedSlot.findUnique({ where: { id }, include: { salon: true } });
  if (!blockedSlot || blockedSlot.salon.ownerId !== dbUser.id) {
    return NextResponse.json({ error: "Indisponibilité introuvable" }, { status: 404 });
  }

  await prisma.blockedSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
