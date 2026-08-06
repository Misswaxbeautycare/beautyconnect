import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireOwnedProduct(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié", status: 401 } as const;

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const salon = dbUser ? await prisma.salon.findUnique({ where: { ownerId: dbUser.id } }) : null;
  const product = salon ? await prisma.product.findUnique({ where: { id: productId } }) : null;

  if (!salon || !product || product.salonId !== salon.id) {
    return { error: "Produit introuvable", status: 404 } as const;
  }

  return { product } as const;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireOwnedProduct(id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.stock === "number") data.stock = body.stock;
  if (typeof body.price === "number") data.price = body.price;
  if (typeof body.name === "string") data.name = body.name;

  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ product: { ...product, price: Number(product.price) } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await requireOwnedProduct(id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
