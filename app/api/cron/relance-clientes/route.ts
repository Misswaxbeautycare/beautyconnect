import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { subDays } from "date-fns";

// Sécurise cette route : seul Vercel Cron (avec le bon secret) peut la déclencher
function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// Repère les clientes dont le dernier rendez-vous chez un salon donné date
// d'il y a environ 60 jours, et leur envoie une relance. La fenêtre de 7
// jours correspond à la fréquence hebdomadaire du cron : chaque cliente ne
// tombe donc dans cette fenêtre qu'une seule fois par rendez-vous, ce qui
// évite les relances envoyées en double semaine après semaine.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const maintenant = new Date();
  const fenetreDebut = subDays(maintenant, 67);
  const fenetreFin = subDays(maintenant, 60);

  const groupes = await prisma.booking.groupBy({
    by: ["clientId", "salonId"],
    where: {
      clientId: { not: null },
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    _max: { date: true },
  });

  const aRelancer = groupes.filter(
    (g: { _max: { date: Date | null } }) =>
      g._max.date && g._max.date >= fenetreDebut && g._max.date <= fenetreFin
  );

  let envoyes = 0;

  for (const g of aRelancer) {
    if (!g.clientId) continue;

    const [client, salon] = await Promise.all([
      prisma.user.findUnique({ where: { id: g.clientId } }),
      prisma.salon.findUnique({ where: { id: g.salonId } }),
    ]);
    if (!client || !salon || !salon.isActive) continue;

    try {
      await getResend().emails.send({
        from: "BeautyConnect <rappels@beautyconnect.be>",
        to: client.email,
        subject: `Ça fait un moment, ${client.firstName} — on vous garde un créneau ?`,
        html: `
          <p>Bonjour ${client.firstName},</p>
          <p>Cela fait quelques semaines que vous n'êtes pas passée chez <strong>${salon.name}</strong>.</p>
          <p>Envie de reprendre rendez-vous ? Vos disponibilités préférées vous attendent.</p>
          <p><a href="https://beautyconnect-nine.vercel.app/salon/${salon.id}">Réserver un nouveau rendez-vous</a></p>
          <p style="color:#999;font-size:12px;">BeautyConnect — Trouvez. Réservez. Rayonnez.</p>
        `,
      });

      await prisma.notification.create({
        data: {
          userId: client.id,
          type: "PROMOTION",
          title: `On vous garde un créneau chez ${salon.name} ?`,
          message: "Ça fait un moment — reprenez rendez-vous en quelques secondes.",
        },
      });

      envoyes += 1;
    } catch (err) {
      console.error("[cron/relance-clientes] Échec d'envoi", client.email, err);
    }
  }

  return NextResponse.json({ ok: true, candidats: aRelancer.length, envoyes });
}
