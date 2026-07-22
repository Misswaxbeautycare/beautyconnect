import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Webhook Stripe : confirme la réservation + le paiement quand le paiement réussit
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });
      await prisma.payment.update({
        where: { bookingId },
        data: { status: "PAID", stripePaymentIntentId: session.payment_intent as string },
      });

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            bookingId: booking.id,
            type: "BOOKING_CONFIRMATION",
            title: "Réservation confirmée",
            message: "Votre rendez-vous a bien été confirmé et payé.",
          },
        });
        // TODO : déclencher l'envoi d'email (Resend) + programmer les rappels 24h/2h
        // via une tâche planifiée (Vercel Cron) qui scanne les bookings à venir.
      }
    }
  }

  return NextResponse.json({ received: true });
}
