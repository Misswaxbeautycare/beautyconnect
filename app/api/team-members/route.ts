import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { teamMemberSchema } from "@/lib/validations";
import { getEffectivePlan } from "@/lib/subscription-plans";

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

  const teamMembers = await prisma.teamMember.findMany({
    where: { salonId: result.salon.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ teamMembers });
}

export async function POST(req: NextRequest) {
  const result = await getOwnSalon();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await req.json();
  const parsed = teamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const plan = getEffectivePlan(result.salon);
  const count = await prisma.teamMember.count({ where: { salonId: result.salon.id } });

  if (count >= plan.maxTeamMembers) {
    return NextResponse.json(
      {
        error:
          plan.maxTeamMembers === 0
            ? `L'affichage de l'équipe est réservé aux formules Signature et Prestige.`
            : `Votre formule "${plan.name}" est limitée à ${plan.maxTeamMembers} membres. Passez à une formule supérieure pour en ajouter davantage.`,
      },
      { status: 403 }
    );
  }

  const teamMember = await prisma.teamMember.create({
    data: { ...parsed.data, salonId: result.salon.id, order: count },
  });

  return NextResponse.json({ teamMember });
}
