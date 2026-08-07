import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  const review = await prisma.review.findUnique({ where: { id } });
  if (!salon || !review || review.salonId !== salon.id) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const replyText = typeof body.replyText === "string" ? body.replyText.trim() : "";
  if (!replyText) {
    return NextResponse.json({ error: "Réponse vide" }, { status: 400 });
  }

  const updated = await prisma.review.update({
    where: { id },
    data: { replyText, repliedAt: new Date() },
  });

  return NextResponse.json({ review: updated });
}
