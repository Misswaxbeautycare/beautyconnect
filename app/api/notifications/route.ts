import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";

export async function GET() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId: dbUser.id, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// Marque une notification précise comme lue ({ id }), ou toutes ({ all: true }).
export async function PATCH(req: NextRequest) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: dbUser.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== dbUser.id) {
    return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
