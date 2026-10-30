import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

// L'admin choisit quels produits apparaissent dans le carrousel de la page d'accueil
export async function PATCH(req: NextRequest) {
  const u = await getCurrentDbUser();
  if (!u || u.role !== "ADMIN") return NextResponse.json({ error: "Réservé à l’administratrice" }, { status: 403 });
  const { id, isFeatured, salonId } = await req.json();
  if (typeof isFeatured !== "boolean") return NextResponse.json({ error: "Valeur invalide" }, { status: 400 });
  if (salonId) await prisma.product.updateMany({ where: { salonId: String(salonId) }, data: { isFeatured } });
  else await prisma.product.update({ where: { id: String(id) }, data: { isFeatured } });
  return NextResponse.json({ ok: true });
}
