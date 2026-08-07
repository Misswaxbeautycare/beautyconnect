import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

interface CartItemInput {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = await req.json();

  // Compatible avec l'ancien format ({ productId, quantity }) et le nouveau
  // panier multi-produits ({ items: [{ productId, quantity }, ...] }).
  const rawItems: CartItemInput[] = Array.isArray(body.items)
    ? body.items
    : body.productId
      ? [{ productId: body.productId, quantity: Number(body.quantity) || 1 }]
      : [];

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: rawItems.map((i) => i.productId) } },
  });

  const lineItems: { productId: string; quantity: number; unitPrice: number; name: string }[] = [];

  for (const item of rawItems) {
    const product = products.find((p: (typeof products)[number]) => p.id === item.productId);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    if (!product || !product.isActive) {
      return NextResponse.json({ error: `Produit introuvable dans le panier.` }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: `Stock insuffisant pour "${product.name}".` }, { status: 400 });
    }
    lineItems.push({
      productId: product.id,
      quantity,
      unitPrice: Number(product.price),
      name: product.name,
    });
  }

  const totalAmount = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      clientId: dbUser.id,
      status: "PENDING",
      totalAmount,
      items: {
        create: lineItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems.map((i) => ({
        price_data: {
          currency: "eur",
          product_data: { name: i.name },
          unit_amount: Math.round(i.unitPrice * 100),
        },
        quantity: i.quantity,
      })),
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
