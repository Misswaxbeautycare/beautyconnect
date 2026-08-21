import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend, isResendConfigured } from "@/lib/resend";
import { getCurrentDbUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "L'envoi d'email n'est pas encore configuré (clé Resend manquante côté serveur)." },
      { status: 503 }
    );
  }

  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { salon: true, service: true, client: true },
  });

  if (!booking || booking.salon.ownerId !== dbUser.id) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  const email = booking.client?.email ?? booking.guestEmail;
  const nom = booking.client?.firstName ?? booking.guestName ?? "";
  if (!email) {
    return NextResponse.json({ error: "Aucune adresse email enregistrée pour cette cliente." }, { status: 400 });
  }

  const heureRdv = new Date(booking.date).toLocaleString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });

  try {
    await getResend().emails.send({
      from: "BeautyConnect <rappels@beautyconnect.be>",
      to: email,
      subject: `Rappel : votre rendez-vous chez ${booking.salon.name}`,
      html: `
        <p>Bonjour ${nom},</p>
        <p>Petit rappel de votre rendez-vous chez <strong>${booking.salon.name}</strong> pour <strong>${booking.service.name}</strong>.</p>
        <p>📅 ${heureRdv}</p>
        <p>À bientôt !</p>
        <p style="color:#999;font-size:12px;">BeautyConnect — Trouvez. Réservez. Rayonnez.</p>
      `,
    });
  } catch (err) {
    console.error("[reminder manuel] Échec d'envoi", err);
    return NextResponse.json({ error: "L'envoi a échoué. Vérifiez la configuration Resend." }, { status: 502 });
  }

  if (booking.clientId) {
    await prisma.notification.create({
      data: {
        userId: booking.clientId,
        bookingId: booking.id,
        type: "BOOKING_REMINDER_24H",
        title: "Rappel de rendez-vous",
        message: `Rappel envoyé par ${booking.salon.name}.`,
      },
    });
    sendPushToUser(booking.clientId, {
      title: "Rappel de rendez-vous",
      body: `${booking.salon.name} vous rappelle votre rendez-vous du ${heureRdv}.`,
      url: "/client/dashboard",
    });
  }

  return NextResponse.json({ ok: true });
}
