import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = await req.json();
  const productId = body.productId as string;
  const quantity = Math.max(1, Number(body.quantity) || 1);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }
  if (product.stock < quantity) {
    return NextResponse.json({ error: "Stock insuffisant" }, { status: 400 });
  }

  const unitPrice = Number(product.price);
  const order = await prisma.order.create({
    data: {
      clientId: dbUser.id,
      status: "PENDING",
      totalAmount: unitPrice * quantity,
      items: {
        create: [{ productId: product.id, quantity, unitPrice }],
      },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: product.name },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity,
        },
      ],
      metadata: { type: "product_order", orderId: order.id },
      success_url: `${appUrl}/client/dashboard?order=success`,
      cancel_url: `${appUrl}/client/dashboard?order=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Erreur Stripe (achat produit):", err);
    return NextResponse.json({ error: "Impossible de démarrer le paiement." }, { status: 502 });
  }
}
