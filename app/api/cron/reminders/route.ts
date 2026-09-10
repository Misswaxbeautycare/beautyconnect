import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { sendPushToUser } from "@/lib/push";

// Sécurise cette route : seul Vercel Cron (avec le bon secret) peut la déclencher
function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

async function envoyerRappel(
  booking: {
    id: string;
    date: Date;
    guestEmail: string | null;
    guestName: string | null;
    client: { id: string; email: string; firstName: string; lastName: string } | null;
    service: { name: string };
    salon: { name: string };
  },
  type: "BOOKING_REMINDER_24H" | "BOOKING_REMINDER_2H",
  delaiTexte: string
) {
  const email = booking.client?.email ?? booking.guestEmail;
  const nom = booking.client?.firstName ?? booking.guestName ?? "";

  if (!email) return;

  const heureRdv = new Date(booking.date).toLocaleString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });

  await getResend().emails.send({
    from: "BeautyConnect <rappels@mail.misswaxbeautycare.com>",
    to: email,
    subject: `Rappel : votre rendez-vous ${delaiTexte}`,
    html: `
      <p>Bonjour ${nom},</p>
      <p>Petit rappel : vous avez rendez-vous <strong>${delaiTexte}</strong> chez <strong>${booking.salon.name}</strong> pour <strong>${booking.service.name}</strong>.</p>
      <p>📅 ${heureRdv}</p>
      <p>À bientôt !</p>
      <p style="color:#999;font-size:12px;">BeautyConnect — Trouvez. Réservez. Rayonnez.</p>
    `,
  });

  if (booking.client) {
    await prisma.notification.create({
      data: {
        userId: booking.client.id,
        bookingId: booking.id,
        type,
        title: "Rappel de rendez-vous",
        message: `Votre rendez-vous est ${delaiTexte}.`,
      },
    });
    sendPushToUser(booking.client.id, {
      title: "Rappel de rendez-vous",
      body: `Votre rendez-vous chez ${booking.salon.name} est ${delaiTexte}.`,
      url: "/client/dashboard",
    });
  }
}

async function envoyerDemandeAvis(booking: {
  id: string;
  salonId: string;
  guestEmail: string | null;
  guestName: string | null;
  client: { id: string; email: string; firstName: string; lastName: string } | null;
  service: { name: string };
  salon: { name: string };
}) {
  const email = booking.client?.email ?? booking.guestEmail;
  const nom = booking.client?.firstName ?? booking.guestName ?? "";
  if (!email) return;

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://beautyconnect-nine.vercel.app"}/client/dashboard`;

  await getResend().emails.send({
    from: "BeautyConnect <avis@mail.misswaxbeautycare.com>",
    to: email,
    subject: `Comment s'est passée votre visite chez ${booking.salon.name} ?`,
    html: `
      <p>Bonjour ${nom},</p>
      <p>Merci d'avoir choisi <strong>${booking.salon.name}</strong> pour votre prestation "${booking.service.name}".</p>
      <p>Votre avis compte beaucoup — pourriez-vous prendre une minute pour le partager ?</p>
      <p><a href="${reviewUrl}" style="display:inline-block;padding:10px 20px;background:#D4A24A;color:#0A0A0A;text-decoration:none;border-radius:999px;font-weight:600;">Laisser mon avis</a></p>
      <p>Et si vous avez aimé votre expérience, ${booking.salon.name} sera ravi de vous revoir bientôt !</p>
      <p style="color:#999;font-size:12px;">BeautyConnect — Trouvez. Réservez. Rayonnez.</p>
    `,
  });

  if (booking.client) {
    await prisma.notification.create({
      data: {
        userId: booking.client.id,
        bookingId: booking.id,
        type: "REVIEW_REQUEST",
        title: "Votre avis compte",
        message: `Comment s'est passée votre visite chez ${booking.salon.name} ?`,
      },
    });
    sendPushToUser(booking.client.id, {
      title: "Votre avis compte",
      body: `Comment s'est passée votre visite chez ${booking.salon.name} ?`,
      url: "/client/dashboard",
    });
  }
}

// Ce cron ne tourne qu'une fois par jour (contrainte du plan Vercel actuel :
// impossible de viser une fenêtre précise du type "exactement 2h avant").
// On envoie donc deux rappels fiables à chaque exécution quotidienne :
// - la veille, pour tout rendez-vous prévu le lendemain
// - le matin même, pour tout rendez-vous prévu plus tard dans la journée
// Le filtre "notifications: none" évite d'envoyer deux fois le même rappel
// si le cron tourne à nouveau le même jour.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const maintenant = new Date();
  const demain = addDays(maintenant, 1);

  const bookingsDemain = await prisma.booking.findMany({
    where: {
      date: { gte: startOfDay(demain), lte: endOfDay(demain) },
      status: "CONFIRMED",
      notifications: { none: { type: "BOOKING_REMINDER_24H" } },
    },
    include: { client: true, service: true, salon: true },
  });

  const bookingsAujourdhui = await prisma.booking.findMany({
    where: {
      date: { gte: maintenant, lte: endOfDay(maintenant) },
      status: "CONFIRMED",
      notifications: { none: { type: "BOOKING_REMINDER_2H" } },
    },
    include: { client: true, service: true, salon: true },
  });

  // Demande d'avis automatique : rendez-vous d'hier, sans avis, jamais relancés
  const hier = addDays(maintenant, -1);
  const bookingsPourAvis = await prisma.booking.findMany({
    where: {
      date: { gte: startOfDay(hier), lte: endOfDay(hier) },
      status: "CONFIRMED",
      review: null,
      notifications: { none: { type: "REVIEW_REQUEST" } },
    },
    include: { client: true, service: true, salon: true },
  });

  let envoyes = 0;

  for (const booking of bookingsDemain) {
    await envoyerRappel(booking, "BOOKING_REMINDER_24H", "demain");
    envoyes++;
  }

  for (const booking of bookingsAujourdhui) {
    await envoyerRappel(booking, "BOOKING_REMINDER_2H", "aujourd'hui");
    envoyes++;
  }

  for (const booking of bookingsPourAvis) {
    await envoyerDemandeAvis(booking);
    envoyes++;
  }

  return NextResponse.json({ success: true, rappelsEnvoyes: envoyes });
}
