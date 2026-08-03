import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { salonSchema } from "@/lib/validations";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = salonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, address, city, postalCode, phone, categoryIds } = parsed.data;
  const photoUrls: string[] = Array.isArray(body.photoUrls) ? body.photoUrls : [];

  // Assure l'existence du profil applicatif avec le rôle PROFESSIONAL
  const dbUser = await prisma.user.upsert({
    where: { authId: user.id },
    update: { role: "PROFESSIONAL" },
    create: {
      authId: user.id,
      email: user.email ?? "",
      firstName: (user.user_metadata?.first_name as string) ?? "",
      lastName: (user.user_metadata?.last_name as string) ?? "",
      phone: (user.user_metadata?.phone as string) ?? null,
      role: "PROFESSIONAL",
    },
  });

  const existing = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà un salon configuré" }, { status: 409 });
  }

  // Génère un slug unique à partir du nom
  const baseSlug = slugify(name) || "salon";
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.salon.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  try {
    const salon = await prisma.salon.create({
      data: {
        ownerId: dbUser.id,
        name,
        slug,
        description,
        address,
        city,
        postalCode,
        phone,
        coverUrl: photoUrls[0] ?? null,
        categories: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
        photos: {
          create: photoUrls.map((url, order) => ({ url, order })),
        },
      },
    });

    return NextResponse.json({ salon });
  } catch (err) {
    console.error("POST /api/salons error", err);
    return NextResponse.json({ error: "Erreur lors de la création du salon" }, { status: 500 });
  }
}
