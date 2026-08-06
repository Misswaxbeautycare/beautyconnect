import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().optional(),
});

async function requireBoutiqueSalon() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié", status: 401 } as const;

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const salon = dbUser ? await prisma.salon.findUnique({ where: { ownerId: dbUser.id } }) : null;
  if (!salon) return { error: "Aucun salon configuré", status: 404 } as const;

  const plan = getEffectivePlan(salon);
  if (!plan.hasBoutique) {
    return {
      error: "La boutique en ligne est réservée à la formule Prestige.",
      status: 403,
    } as const;
  }

  return { salon } as const;
}

export async function GET() {
  const result = await requireBoutiqueSalon();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const products = await prisma.product.findMany({
    where: { salonId: result.salon.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    products: products.map((p: (typeof products)[number]) => ({ ...p, price: Number(p.price) })),
  });
}

export async function POST(req: NextRequest) {
  const result = await requireBoutiqueSalon();
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, salonId: result.salon.id },
  });

  return NextResponse.json({ product: { ...product, price: Number(product.price) } });
}
