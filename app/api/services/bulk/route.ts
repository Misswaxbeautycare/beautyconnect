import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const bulkSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        categorySlug: z.string().min(1),
        durationMin: z.number().int().positive(),
        price: z.number().nonnegative(),
        description: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const categories = await prisma.category.findMany();
  const categoryBySlug = new Map(categories.map((c: { slug: string; id: string }) => [c.slug, c.id]));

  const existing = await prisma.service.findMany({
    where: { salonId: salon.id },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((s: { name: string }) => s.name.toLowerCase()));

  const toCreate = parsed.data.items
    .filter((item) => !existingNames.has(item.name.toLowerCase()))
    .map((item) => {
      const categoryId = categoryBySlug.get(item.categorySlug);
      if (!categoryId) return null;
      return {
        salonId: salon.id,
        categoryId,
        name: item.name,
        durationMin: item.durationMin,
        price: item.price,
        description: item.description,
        depositPct: 30,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (toCreate.length > 0) {
    await prisma.service.createMany({ data: toCreate });
  }

  return NextResponse.json({ created: toCreate.length, skipped: parsed.data.items.length - toCreate.length });
}
