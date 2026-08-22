import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { formatDate } from "@/lib/utils";
import { getCurrentDbUser } from "@/lib/auth";
import { SalonProfileClient } from "@/components/salon/SalonProfileClient";
import type { Metadata } from "next";

// Requête commune à generateMetadata et au rendu de la page — évite
// d'interroger deux fois la base pour le même salon.
async function getSalonForMetadata(id: string) {
  return prisma.salon.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      city: true,
      coverUrl: true,
      categories: { include: { category: true } },
      reviews: { select: { rating: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const salon = await getSalonForMetadata(id);
  if (!salon) return {};

  const categorie = salon.categories[0]?.category.name;
  const title = `${salon.name}${categorie ? ` — ${categorie}` : ""} à ${salon.city} | Beauty Connect`;
  const description =
    salon.description?.slice(0, 155) ||
    `Réservez en ligne chez ${salon.name}, ${categorie ?? "professionnel beauté"} à ${salon.city}. Confirmation instantanée sur Beauty Connect.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: salon.coverUrl ? [salon.coverUrl] : undefined,
    },
  };
}

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [salon, dbUser] = await Promise.all([
    prisma.salon.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true }, include: { category: true }, orderBy: [{ order: "asc" }, { name: "asc" }] },
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

  // Journal de visite — en tâche de fond, ne doit jamais ralentir ni faire
  // échouer l'affichage de la page si ça tombe en erreur.
  prisma.salonVisit
    .create({ data: { salonId: salon.id, clientId: dbUser?.id } })
    .catch((err: unknown) => console.error("[salon visit log]", err));

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

  // Données structurées schema.org — aide Google à afficher une fiche
  // enrichie (note, avis, adresse, horaires) directement dans les résultats
  // de recherche, sans que ça n'apparaisse nulle part côté utilisateur.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: salon.name,
    description: salon.description ?? undefined,
    image: gallery[0] ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address ?? undefined,
      addressLocality: salon.city,
      postalCode: salon.postalCode ?? undefined,
      addressCountry: "BE",
    },
    ...(salon.latitude && salon.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: salon.latitude, longitude: salon.longitude } }
      : {}),
    telephone: salon.phone ?? undefined,
    ...(averageRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: salon.reviews.length,
          },
        }
      : {}),
    openingHoursSpecification: salon.openingHours
      .filter((h: (typeof salon.openingHours)[number]) => !h.isClosed)
      .map((h: (typeof salon.openingHours)[number]) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.dayOfWeek],
        opens: h.openTime,
        closes: h.closeTime,
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SalonProfileClient
      salon={{
        id: salon.id,
        name: salon.name,
        description: salon.description,
        city: salon.city,
        address: salon.address,
        postalCode: salon.postalCode,
        domicileZone: salon.domicileZone,
        deplacementZone: salon.deplacementZone,
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
          modes: s.modes,
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
    </>
  );
}
