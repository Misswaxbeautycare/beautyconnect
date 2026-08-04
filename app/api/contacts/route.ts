import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  notes: z.string().optional(),
});

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

  const contacts = await prisma.contact.findMany({
    where: { salonId: result.salon.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const result = await getOwnSalon();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const contact = await prisma.contact.create({
    data: {
      salonId: result.salon.id,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({ contact });
}
