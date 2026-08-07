import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { formatDate } from "@/lib/utils";
import { getCurrentDbUser } from "@/lib/auth";
import { SalonProfileClient } from "@/components/salon/SalonProfileClient";

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [salon, dbUser] = await Promise.all([
    prisma.salon.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true }, include: { category: true } },
        categories: { include: { category: true } },
        photos: { orderBy: { order: "asc" } },
        openingHours: true,
        teamMembers: { orderBy: { order: "asc" } },
        reviews: { include: { client: true }, orderBy: { createdAt: "desc" }, take: 20 },
        products: { where: { isActive: true } },
        bookings: {
          where: { status: { in: ["CONFIRMED", "PENDING"] }, date: { gte: new Date() } },
          select: { date: true },
        },
      },
    }),
    getCurrentDbUser(),
  ]);

  if (!salon) notFound();

  const isFavorited = dbUser
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { clientId_salonId: { clientId: dbUser.id, salonId: salon.id } },
        })
      )
    : false;

  const plan = getEffectivePlan(salon);
  const averageRating =
    salon.reviews.length > 0
      ? salon.reviews.reduce((sum: number, r: (typeof salon.reviews)[number]) => sum + r.rating, 0) /
        salon.reviews.length
      : null;
  const gallery = [
    ...(salon.coverUrl ? [salon.coverUrl] : []),
    ...salon.photos.map((p: (typeof salon.photos)[number]) => p.url),
  ];

  return (
    <SalonProfileClient
      salon={{
        id: salon.id,
        name: salon.name,
        description: salon.description,
        city: salon.city,
        address: salon.address,
        postalCode: salon.postalCode,
        latitude: salon.latitude,
        longitude: salon.longitude,
        isApproved: salon.isApproved,
        categoryLabels: salon.categories.map((c: (typeof salon.categories)[number]) => c.category.name),
        gallery,
        averageRating,
        reviewCount: salon.reviews.length,
        services: salon.services.map((s: (typeof salon.services)[number]) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          categoryName: s.category.name,
          durationMin: s.durationMin,
          price: Number(s.price),
          depositPct: s.depositPct,
        })),
        products: salon.products.map((p: (typeof salon.products)[number]) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          imageUrl: p.imageUrl,
        })),
        reviews: salon.reviews.map((r: (typeof salon.reviews)[number]) => ({
          id: r.id,
          authorName: `${r.client.firstName} ${r.client.lastName.charAt(0)}.`,
          rating: r.rating,
          comment: r.comment,
          createdAt: formatDate(r.createdAt),
          replyText: r.replyText,
        })),
        openingHours: salon.openingHours.map((h: (typeof salon.openingHours)[number]) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
        teamMembers: salon.teamMembers.map((m: (typeof salon.teamMembers)[number]) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          photoUrl: m.photoUrl,
        })),
        bookedSlots: salon.bookings.map((b: (typeof salon.bookings)[number]) => b.date.toISOString()),
        onlinePayment: plan.onlinePayment,
        isFavorited,
      }}
    />
  );
}
