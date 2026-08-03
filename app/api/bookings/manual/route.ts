import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const manualBookingSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string(),
  guestName: z.string().min(2, "Nom du client requis"),
  guestPhone: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  notes: z.string().optional(),
  paymentStatus: z.enum(["NONE", "DEPOSIT_PAID", "FULL_PAID"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const body = await req.json();
  const parsed = manualBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { serviceId, date, guestName, guestPhone, notes, paymentStatus } = parsed.data;
  const guestEmail = parsed.data.guestEmail || undefined;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.salonId !== salon.id) {
    return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
  }

  // Si l'email correspond à une cliente déjà inscrite, on relie le rendez-vous
  // à son compte plutôt que de le traiter comme une simple visite anonyme —
  // utile pour le suivi des clientes fidèles.
  const matchedClient = guestEmail
    ? await prisma.user.findUnique({ where: { email: guestEmail } })
    : null;

  const conflict = await prisma.booking.findFirst({
    where: {
      salonId: salon.id,
      date: new Date(date),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Ce créneau est déjà occupé." }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      salonId: salon.id,
      serviceId,
      date: new Date(date),
      durationMin: service.durationMin,
      notes,
      status: "CONFIRMED",
      clientId: matchedClient?.id,
      guestName: matchedClient ? undefined : guestName,
      guestPhone: matchedClient ? undefined : guestPhone,
      guestEmail: matchedClient ? undefined : guestEmail,
    },
  });

  if (paymentStatus !== "NONE") {
    const price = Number(service.price);
    const amount =
      paymentStatus === "DEPOSIT_PAID" ? (price * service.depositPct) / 100 : price;
    const commissionAmount = (amount * salon.commissionRate) / 100;

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        type: paymentStatus === "DEPOSIT_PAID" ? "DEPOSIT" : "FULL",
        status: "PAID",
        amount,
        commissionAmount,
      },
    });
  }

  return NextResponse.json({ booking });
}
