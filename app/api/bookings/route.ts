import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validations";

// Crée une réservation (statut PENDING) puis une session de paiement Stripe
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { salonId, serviceId, date, notes, paymentType } = parsed.data;

  const client = await prisma.user.findUnique({ where: { authId: user.id } });
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!client || !service) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  // Empêche le double-booking sur le même créneau
  const conflict = await prisma.booking.findFirst({
    where: { salonId, date: new Date(date), status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (conflict) {
    return NextResponse.json({ error: "Ce créneau vient d'être réservé." }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      clientId: client.id,
      salonId,
      serviceId,
      date: new Date(date),
      durationMin: service.durationMin,
      notes,
      status: "PENDING",
    },
  });

  const price = Number(service.price);
  const amount = paymentType === "DEPOSIT" ? (price * service.depositPct) / 100 : price;
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: `${service.name} (${paymentType === "DEPOSIT" ? "Acompte" : "Paiement complet"})` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard?booking=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/salon/${salonId}?booking=cancelled`,
  });

  return NextResponse.json({ bookingId: booking.id, checkoutUrl: session.url });
}
