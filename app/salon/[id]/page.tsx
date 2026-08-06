import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { formatDate } from "@/lib/utils";
import { getEffectivePlan } from "@/lib/subscription-plans";

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const salon = await prisma.salon.findUnique({
    where: { id },
    include: {
      services: { where: { isActive: true } },
      categories: { include: { category: true } },
      photos: { orderBy: { order: "asc" } },
      reviews: { include: { client: true }, orderBy: { createdAt: "desc" }, take: 10 },
      bookings: {
        where: { status: { in: ["CONFIRMED", "PENDING"] }, date: { gte: new Date() } },
        select: { date: true },
      },
    },
  });

  if (!salon) notFound();

  const bookedSlots = salon.bookings.map((b: (typeof salon.bookings)[number]) => b.date.toISOString());
  const plan = getEffectivePlan(salon);
  const noteMoyenne =
    salon.reviews.length > 0
      ? salon.reviews.reduce((sum: number, r: (typeof salon.reviews)[number]) => sum + r.rating, 0) / salon.reviews.length
      : null;
  const galerie = [
    ...(salon.coverUrl ? [salon.coverUrl] : []),
    ...salon.photos.map((p: (typeof salon.photos)[number]) => p.url),
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {galerie.length > 0 && (
        <div className="mb-8 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-beige sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            <img src={galerie[0]} alt={salon.name} className="h-full w-full object-cover" />
          </div>
          {galerie.slice(1, 5).map((url: string, i: number) => (
            <div key={i} className="relative hidden aspect-square overflow-hidden rounded-2xl bg-beige sm:block">
              <img src={url} alt={`${salon.name} ${i + 2}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-noir">{salon.name}</h1>
            {noteMoyenne !== null && (
              <span className="flex items-center gap-1 rounded-full bg-beige px-3 py-1 text-sm font-medium text-noir">
                <span className="text-or-dark">★</span> {noteMoyenne.toFixed(1)}
                <span className="text-noir/50">({salon.reviews.length} avis)</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-noir/60">{salon.city}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {salon.categories.map((c: (typeof salon.categories)[number]) => (
              <span key={c.categoryId} className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">
                {c.category.name}
              </span>
            ))}
          </div>
          {salon.description && <p className="mt-6 text-noir/70">{salon.description}</p>}

          <h2 className="mt-12 font-display text-xl text-noir">Avis</h2>
          <div className="mt-4 space-y-4">
            {salon.reviews.map((r: (typeof salon.reviews)[number]) => (
              <div key={r.id} className="border-b border-beige-dark pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-noir">
                    {r.client.firstName} {r.client.lastName.charAt(0)}.
                  </p>
                  <span className="text-or-dark text-sm">{"★".repeat(r.rating)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-noir/60">{r.comment}</p>}
                <p className="mt-1 text-xs text-noir/40">{formatDate(r.createdAt)}</p>
              </div>
            ))}
            {salon.reviews.length === 0 && <p className="text-sm text-noir/40">Pas encore d'avis.</p>}
          </div>
        </div>

        <div>
          <BookingCalendar
            salonId={salon.id}
            services={salon.services.map((s: (typeof salon.services)[number]) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price),
              durationMin: s.durationMin,
              depositPct: s.depositPct,
            }))}
            bookedSlots={bookedSlots}
            onlinePayment={plan.onlinePayment}
          />
        </div>
      </div>
    </div>
  );
}
