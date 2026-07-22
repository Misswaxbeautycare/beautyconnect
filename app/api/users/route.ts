import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Crée le profil applicatif (table users) juste après l'inscription Supabase Auth
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { authId, email, firstName, lastName, phone, role } = body;

  const user = await prisma.user.create({
    data: { authId, email, firstName, lastName, phone, role },
  });

  return NextResponse.json({ user });
}
