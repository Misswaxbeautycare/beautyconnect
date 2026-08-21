import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { getPlan } from "@/lib/subscription-plans";
import { sendPushToUser } from "@/lib/push";
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

    if (session.metadata?.type === "product_order") {
      const orderId = session.metadata.orderId;
      if (orderId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            stripePaymentIntentId: session.payment_intent as string,
          },
          include: { items: true },
        });
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
      return NextResponse.json({ received: true });
    }

    if (session.mode === "subscription" && session.metadata?.type === "subscription") {
      const salonId = session.metadata.salonId;
      const subscriptionId = session.subscription as string;
      if (salonId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await prisma.salon.update({
          where: { id: salonId },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: subscription.status,
            subscriptionPlan: session.metadata.plan ?? null,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          },
        });
      }
      return NextResponse.json({ received: true });
    }

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

      const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { salon: true, service: true } });
      if (booking && booking.clientId) {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            bookingId: booking.id,
            type: "BOOKING_CONFIRMATION",
            title: "Réservation confirmée",
            message: "Votre rendez-vous a bien été confirmé et payé. Merci de bien respecter votre horaire — prévenez le salon en cas d'empêchement.",
          },
        });
        sendPushToUser(booking.clientId, {
          title: "Réservation confirmée",
          body: `${booking.service.name} — paiement reçu.`,
          url: "/client/dashboard",
        });
        await prisma.notification.create({
          data: {
            userId: booking.salon.ownerId,
            bookingId: booking.id,
            type: "PAYMENT_RECEIVED",
            title: "Nouveau rendez-vous payé",
            message: `${booking.service.name} réservé et payé en ligne le ${booking.date.toLocaleDateString("fr-BE", { timeZone: "Europe/Brussels" })} à ${booking.date.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" })}.`,
          },
        });
        sendPushToUser(booking.salon.ownerId, {
          title: "Nouveau rendez-vous payé",
          body: `${booking.service.name} — paiement reçu en ligne.`,
          url: "/pro/agenda",
        });
        // TODO : déclencher l'envoi d'email (Resend) + programmer les rappels 24h/2h
        // via une tâche planifiée (Vercel Cron) qui scanne les bookings à venir.
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const salonId = subscription.metadata?.salonId;
    if (salonId) {
      await prisma.salon.update({
        where: { id: salonId },
        data: {
          subscriptionStatus: subscription.status,
          subscriptionPlan: subscription.metadata?.plan ?? undefined,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        },
      });

      // Uniquement à la toute première souscription (pas à chaque
      // renouvellement/mise à jour) — pour prévenir l'équipe Misswaxbeautycare
      // sans la noyer sous des emails répétés.
      if (event.type === "customer.subscription.created") {
        const salon = await prisma.salon.findUnique({ where: { id: salonId } });
        const planName = getPlan(subscription.metadata?.plan).name;
        const adminEmail = process.env.ADMIN_EMAIL ?? "contact@misswaxbeautycare.com";
        try {
          await getResend().emails.send({
            from: "BeautyConnect <notifications@mail.misswaxbeautycare.com>",
            to: adminEmail,
            subject: `Nouvel abonnement : ${salon?.name ?? salonId} — formule ${planName}`,
            html: `
              <p>Un salon vient de souscrire à un abonnement payant.</p>
              <p><strong>Salon :</strong> ${salon?.name ?? salonId}</p>
              <p><strong>Formule :</strong> ${planName}</p>
              <p><strong>Statut :</strong> ${subscription.status}</p>
            `,
          });
        } catch (err) {
          console.error("[stripe/webhook] Échec de l'email admin nouvel abonnement", err);
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const salonId = subscription.metadata?.salonId;
    if (salonId) {
      await prisma.salon.update({
        where: { id: salonId },
        data: { subscriptionStatus: "canceled" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
