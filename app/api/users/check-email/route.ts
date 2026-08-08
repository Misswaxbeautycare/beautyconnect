import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Utilisé par le formulaire de réservation rapide pour détecter, dès que la
// personne tape son email, si elle a déjà un compte — afin de lui proposer
// de se connecter plutôt que de retenter une inscription qui échouerait.
// Ne renvoie qu'un booléen, jamais d'autre information sur le compte.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ exists: false });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  return NextResponse.json({ exists: Boolean(user) });
}
