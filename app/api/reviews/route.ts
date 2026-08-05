import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { review: true },
  });

  if (!booking || booking.clientId !== dbUser.id) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }
  if (booking.date > new Date()) {
    return NextResponse.json(
      { error: "Vous pourrez laisser un avis une fois le rendez-vous passé." },
      { status: 400 }
    );
  }
  if (booking.review) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce rendez-vous." }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      clientId: dbUser.id,
      salonId: booking.salonId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json({ review });
}
