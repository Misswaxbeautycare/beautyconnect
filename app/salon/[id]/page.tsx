import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { formatDate } from "@/lib/utils";

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const salon = await prisma.salon.findUnique({
    where: { id },
    include: {
      services: { where: { isActive: true } },
      categories: { include: { category: true } },
      reviews: { include: { client: true }, orderBy: { createdAt: "desc" }, take: 10 },
      bookings: {
        where: { status: { in: ["CONFIRMED", "PENDING"] }, date: { gte: new Date() } },
        select: { date: true },
      },
    },
  });

  if (!salon) notFound();

  const bookedSlots = salon.bookings.map((b: (typeof salon.bookings)[number]) => b.date.toISOString());

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl text-noir">{salon.name}</h1>
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
          />
        </div>
      </div>
    </div>
  );
}
