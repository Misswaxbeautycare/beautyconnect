import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { serviceSchema } from "@/lib/validations";

async function getOwnSalon() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" as const, status: 401 as const };

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return { error: "Profil introuvable" as const, status: 404 as const };

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return { error: "Aucun salon configuré" as const, status: 404 as const };

  return { salon };
}

export async function GET() {
  const result = await getOwnSalon();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const services = await prisma.service.findMany({
    where: { salonId: result.salon.id },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const result = await getOwnSalon();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const service = await prisma.service.create({
    data: { ...parsed.data, salonId: result.salon.id },
  });

  return NextResponse.json({ service });
}
