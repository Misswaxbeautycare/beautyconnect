import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { addHours, addMinutes } from "date-fns";

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
  });

  await resend.emails.send({
    from: "BeautyConnect <rappels@beautyconnect.be>",
    to: email,
    subject: `Rappel : votre rendez-vous ${delaiTexte}`,
    html: `
      <p>Bonjour ${nom},</p>
      <p>Petit rappel : vous avez rendez-vous <strong>${delaiTexte}</strong> chez <strong>${booking.salon.name}</strong> pour <strong>${booking.service.name}</strong>.</p>
      <p>📅 ${heureRdv}</p>
      <p>À bientôt !</p>
      <p style="color:#999;font-size:12px;">BeautyConnect — Réservez. Connectez. Rayonnez.</p>
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
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const maintenant = new Date();

  const debut24h = addMinutes(addHours(maintenant, 24), -30);
  const fin24h = addMinutes(addHours(maintenant, 24), 30);

  const debut2h = addMinutes(addHours(maintenant, 2), -15);
  const fin2h = addMinutes(addHours(maintenant, 2), 15);

  const bookings24h = await prisma.booking.findMany({
    where: {
      date: { gte: debut24h, lte: fin24h },
      status: "CONFIRMED",
      notifications: { none: { type: "BOOKING_REMINDER_24H" } },
    },
    include: { client: true, service: true, salon: true },
  });

  const bookings2h = await prisma.booking.findMany({
    where: {
      date: { gte: debut2h, lte: fin2h },
      status: "CONFIRMED",
      notifications: { none: { type: "BOOKING_REMINDER_2H" } },
    },
    include: { client: true, service: true, salon: true },
  });

  let envoyes = 0;

  for (const booking of bookings24h) {
    await envoyerRappel(booking, "BOOKING_REMINDER_24H", "demain");
    envoyes++;
  }

  for (const booking of bookings2h) {
    await envoyerRappel(booking, "BOOKING_REMINDER_2H", "dans 2 heures");
    envoyes++;
  }

  return NextResponse.json({ success: true, rappelsEnvoyes: envoyes });
}
