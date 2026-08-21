import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validations";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { sendPushToUser } from "@/lib/push";

// Crée une réservation. Si le salon a le paiement en ligne (formule Signature
// ou Prestige), le client peut choisir acompte, paiement intégral, ou sur
// place. Sinon (formule Essentiel), seul le paiement sur place est proposé.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { salonId, serviceId, additionalServiceIds = [], date, notes, paymentType } = parsed.data;

  // Vérification immédiate plutôt que d'attendre l'appel réel à Stripe —
  // évite un délai avant d'afficher l'erreur quand la clé n'est pas encore
  // configurée sur Vercel.
  if (paymentType !== "ON_SITE" && !isStripeConfigured()) {
    return NextResponse.json(
      { error: "Le paiement en ligne n'est pas encore configuré (clé Stripe manquante côté serveur)." },
      { status: 503 }
    );
  }

  const client = await prisma.user.findUnique({ where: { authId: user.id } });
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!client || !service || !salon) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  const additionalServices = additionalServiceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: additionalServiceIds }, salonId },
      })
    : [];

  const totalDuration =
    service.durationMin + additionalServices.reduce((sum: number, s: typeof service) => sum + s.durationMin, 0);
  const totalPrice =
    Number(service.price) +
    additionalServices.reduce((sum: number, s: typeof service) => sum + Number(s.price), 0);

  const plan = getEffectivePlan(salon);
  if (paymentType !== "ON_SITE" && !plan.onlinePayment) {
    return NextResponse.json(
      { error: "Ce salon ne propose pas encore le paiement en ligne." },
      { status: 400 }
    );
  }

  // Empêche le double-booking sur le créneau (en tenant compte de la durée
  // totale de toutes les prestations combinées)
  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + totalDuration * 60000);
  const conflict = await prisma.booking.findFirst({
    where: {
      salonId,
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { lt: endDate },
      // Une réservation existante empiète si elle commence avant la fin de
      // celle-ci ET se termine après son début — on approx. avec sa propre
      // durée stockée.
    },
  });
  if (conflict) {
    const conflictEnd = new Date(conflict.date.getTime() + conflict.durationMin * 60000);
    if (conflictEnd > startDate) {
      return NextResponse.json({ error: "Ce créneau vient d'être réservé." }, { status: 409 });
    }
  }

  const additionalServicesData = additionalServices.map((s: typeof service) => ({
    serviceId: s.id,
    price: s.price,
    durationMin: s.durationMin,
  }));

  if (paymentType === "ON_SITE") {
    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        salonId,
        serviceId,
        date: startDate,
        durationMin: totalDuration,
        notes,
        status: "CONFIRMED",
        additionalServices: { create: additionalServicesData },
      },
    });

    await prisma.notification.create({
      data: {
        userId: client.id,
        bookingId: booking.id,
        type: "BOOKING_CONFIRMATION",
        title: "Réservation confirmée",
        message: "Votre rendez-vous a bien été confirmé. Réglez directement sur place. Merci de bien respecter votre horaire — prévenez le salon en cas d'empêchement.",
      },
    });
    sendPushToUser(client.id, {
      title: "Réservation confirmée",
      body: `${service.name} le ${startDate.toLocaleDateString("fr-BE", { timeZone: "Europe/Brussels" })}.`,
      url: "/client/dashboard",
    });

    // Le professionnel doit aussi être averti qu'un nouveau rendez-vous
    // vient d'être pris sur son agenda.
    await prisma.notification.create({
      data: {
        userId: salon.ownerId,
        bookingId: booking.id,
        type: "BOOKING_CONFIRMATION",
        title: "Nouveau rendez-vous",
        message: `${client.firstName} a réservé ${service.name} le ${startDate.toLocaleDateString("fr-BE", { timeZone: "Europe/Brussels" })} à ${startDate.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" })}.`,
      },
    });
    sendPushToUser(salon.ownerId, {
      title: "Nouveau rendez-vous",
      body: `${client.firstName} a réservé ${service.name}.`,
      url: "/pro/agenda",
    });

    return NextResponse.json({ bookingId: booking.id, confirmed: true });
  }

  const booking = await prisma.booking.create({
    data: {
      clientId: client.id,
      salonId,
      serviceId,
      date: startDate,
      durationMin: totalDuration,
      notes,
      status: "PENDING",
      additionalServices: { create: additionalServicesData },
    },
  });

  const amount = paymentType === "DEPOSIT" ? (totalPrice * service.depositPct) / 100 : totalPrice;
  const commissionAmount = (amount * 15) / 100; // commission plateforme par défaut

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      type: paymentType,
      amount,
      commissionAmount,
      status: "PENDING",
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const allNames = [service.name, ...additionalServices.map((s: typeof service) => s.name)].join(" + ");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `${allNames} (${paymentType === "DEPOSIT" ? "Acompte" : "Paiement complet"})` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: `${appUrl}/client/dashboard?booking=success`,
      cancel_url: `${appUrl}/salon/${salonId}?booking=cancelled`,
    });

    return NextResponse.json({ bookingId: booking.id, checkoutUrl: session.url });
  } catch (err) {
    console.error("Erreur Stripe lors de la création du paiement:", err);
    // Le rendez-vous et le paiement PENDING restent en base pour trace,
    // mais on renvoie une erreur claire au lieu de laisser planter la requête
    // (ce qui provoquait une page d'erreur HTML illisible côté client).
    return NextResponse.json(
      {
        error:
          "Le paiement n'a pas pu être initialisé. Le compte Stripe du salon n'est peut-être pas encore configuré. Contactez le salon ou réessayez plus tard.",
      },
      { status: 502 }
    );
  }
}
