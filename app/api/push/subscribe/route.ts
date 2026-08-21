import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: dbUser.id, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: dbUser.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: dbUser.id } });
  return NextResponse.json({ ok: true });
}
