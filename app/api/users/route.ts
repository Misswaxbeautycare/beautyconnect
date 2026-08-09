import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Utilisé après connexion pour savoir vers quel tableau de bord rediriger
// (professionnel vs client). On se base sur la possession réelle d'un
// salon plutôt que sur le seul champ "role" — certains comptes ont pu
// être créés avant que ce champ ne soit mis à jour de façon fiable.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ role: null }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { role: true, salon: { select: { id: true } } },
  });

  const isPro = dbUser?.role === "PROFESSIONAL" || dbUser?.role === "ADMIN" || Boolean(dbUser?.salon);

  return NextResponse.json({ role: dbUser?.role ?? null, isPro });
}

// Crée (ou met à jour) le profil applicatif (table users) juste après l'inscription Supabase Auth.
// Utilise un upsert : si un compte a été créé côté Supabase Auth sans que cette route ait été
// appelée (ancien bug), la prochaine visite le répare au lieu d'échouer sur une contrainte unique.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authId, email, firstName, lastName, phone, role } = body;

    if (!authId || !email) {
      return NextResponse.json({ error: "authId et email requis" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { authId },
      update: {
        email,
        firstName,
        lastName,
        phone,
        ...(role ? { role } : {}),
      },
      create: {
        authId,
        email,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        phone,
        role: role ?? "CLIENT",
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("POST /api/users error", err);
    return NextResponse.json({ error: "Erreur lors de la création du profil" }, { status: 500 });
  }
}
