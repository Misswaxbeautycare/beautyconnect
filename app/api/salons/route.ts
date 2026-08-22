import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { salonSchema } from "@/lib/validations";
import { defaultPlan, getEffectivePlan } from "@/lib/subscription-plans";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) {
    return NextResponse.json({ salon: null });
  }

  const salon = await prisma.salon.findUnique({
    where: { ownerId: dbUser.id },
    include: {
      categories: { include: { category: true } },
      photos: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ salon });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const salon = await prisma.salon.findUnique({
    where: { ownerId: dbUser.id },
    include: { photos: true },
  });
  if (!salon) {
    return NextResponse.json({ error: "Aucun salon à modifier" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = salonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, address, city, postalCode, country, phone, categoryIds, domicileZone, deplacementZone, deplacementBaseFee, deplacementFeePerKm } = parsed.data;
  const keepPhotoIds: string[] = Array.isArray(body.keepPhotoIds) ? body.keepPhotoIds : [];
  const newPhotoUrls: string[] = Array.isArray(body.newPhotoUrls) ? body.newPhotoUrls : [];
  const logoUrl: string | null = typeof body.logoUrl === "string" ? body.logoUrl : salon.logoUrl;

  const totalPhotos = keepPhotoIds.length + newPhotoUrls.length;
  const plan = getEffectivePlan(salon);
  if (totalPhotos > plan.maxPhotos) {
    return NextResponse.json(
      {
        error: `Votre formule "${plan.name}" est limitée à ${plan.maxPhotos} photos. Passez à une formule supérieure pour en ajouter davantage.`,
      },
      { status: 400 }
    );
  }

  const keptPhotos = salon.photos.filter((p: { id: string }) => keepPhotoIds.includes(p.id));
  const firstRemainingUrl = keptPhotos[0]?.url ?? newPhotoUrls[0] ?? null;

  try {
    await prisma.$transaction([
      prisma.salonCategory.deleteMany({ where: { salonId: salon.id } }),
      prisma.salonPhoto.deleteMany({
        where: { salonId: salon.id, id: { notIn: keepPhotoIds } },
      }),
      prisma.salon.update({
        where: { id: salon.id },
        data: {
          name,
          description,
          address,
          city,
          postalCode,
          country: country || undefined,
          phone,
          domicileZone,
          deplacementZone,
          deplacementBaseFee,
          deplacementFeePerKm,
          logoUrl,
          coverUrl: firstRemainingUrl,
          categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
          photos: {
            create: newPhotoUrls.map((url, i) => ({
              url,
              order: keptPhotos.length + i,
            })),
          },
        },
      }),
    ]);

    const updated = await prisma.salon.findUnique({
      where: { id: salon.id },
      include: { photos: { orderBy: { order: "asc" } }, categories: { include: { category: true } } },
    });

    return NextResponse.json({ salon: updated });
  } catch (err) {
    console.error("PATCH /api/salons error", err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du salon" }, { status: 500 });
  }
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

  const { name, description, address, city, postalCode, country, phone, categoryIds } = parsed.data;
  const photoUrls: string[] = Array.isArray(body.photoUrls) ? body.photoUrls : [];
  if (photoUrls.length > defaultPlan.maxPhotos) {
    return NextResponse.json(
      { error: `Vous ne pouvez pas dépasser ${defaultPlan.maxPhotos} photos au total.` },
      { status: 400 }
    );
  }

  // Assure l'existence du profil applicatif avec le rôle PROFESSIONAL —
  // sans écraser un rôle ADMIN existant.
  const existingUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const dbUser = await prisma.user.upsert({
    where: { authId: user.id },
    update: existingUser?.role === "ADMIN" ? {} : { role: "PROFESSIONAL" },
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
        country: country || "Belgique",
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
