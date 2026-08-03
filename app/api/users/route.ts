import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
