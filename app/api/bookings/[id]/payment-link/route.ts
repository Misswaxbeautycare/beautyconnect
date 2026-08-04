import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const salon = dbUser ? await prisma.salon.findUnique({ where: { ownerId: dbUser.id } }) : null;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { service: true, payment: true },
  });

  if (!salon || !booking || booking.salonId !== salon.id) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }
  if (booking.payment?.status === "PAID") {
    return NextResponse.json({ error: "Ce rendez-vous est déjà payé." }, { status: 400 });
  }

  const amount = booking.payment ? Number(booking.payment.amount) : Number(booking.service.price);
  const appUrl = `${_req.nextUrl.protocol}//${_req.nextUrl.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `${booking.service.name} — ${salon.name}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: `${appUrl}/client/dashboard?booking=success`,
      cancel_url: `${appUrl}/client/dashboard?booking=cancelled`,
    });

    if (booking.payment) {
      await prisma.payment.update({
        where: { bookingId: booking.id },
        data: { status: "PENDING" },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          type: "FULL",
          amount,
          commissionAmount: (amount * salon.commissionRate) / 100,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Erreur Stripe (lien de paiement):", err);
    return NextResponse.json({ error: "Impossible de générer le lien de paiement." }, { status: 502 });
  }
}
