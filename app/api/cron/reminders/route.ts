import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { startOfDay, endOfDay, addDays } from "date-fns";

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

  await getResend().emails.send({
    from: "BeautyConnect <rappels@beautyconnect.be>",
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

  let envoyes = 0;

  for (const booking of bookingsDemain) {
    await envoyerRappel(booking, "BOOKING_REMINDER_24H", "demain");
    envoyes++;
  }

  for (const booking of bookingsAujourdhui) {
    await envoyerRappel(booking, "BOOKING_REMINDER_2H", "aujourd'hui");
    envoyes++;
  }

  return NextResponse.json({ success: true, rappelsEnvoyes: envoyes });
}
