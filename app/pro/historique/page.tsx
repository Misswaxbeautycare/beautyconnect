import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { Phone, Mail } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { paymentBadge } from "@/lib/payment-badge";

const PAGE_SIZE = 30;

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: {
        salonId: salon.id,
        date: { lt: new Date() },
        status: { notIn: ["CANCELLED", "REFUSED"] },
      },
      include: { client: true, service: true, payment: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({
      where: {
        salonId: salon.id,
        date: { lt: new Date() },
        status: { notIn: ["CANCELLED", "REFUSED"] },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Historique des rendez-vous</h1>
      <p className="mt-1 text-noir/60">
        {total} rendez-vous passé{total > 1 ? "s" : ""} au total — coordonnées et paiement
        conservés, même une fois la date dépassée.
      </p>

      <div className="mt-6 space-y-3">
        {bookings.map((b: (typeof bookings)[number]) => {
          const nomClient = b.client
            ? `${b.client.firstName} ${b.client.lastName}`
            : b.guestName ?? "Client sans nom";
          const email = b.client?.email ?? b.guestEmail ?? null;
          const phone = b.client?.phone ?? b.guestPhone ?? null;
          const badge = paymentBadge(b.payment);
          return (
            <Card key={b.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-noir">{nomClient}</p>
                <p className="text-sm text-noir/60">{b.service.name} — {formatDate(b.date)}</p>
                <div className="mt-1.5 flex flex-wrap gap-3">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs text-noir/60 hover:text-or-dark">
                      <Phone size={12} /> {phone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-1 text-xs text-noir/60 hover:text-or-dark">
                      <Mail size={12} /> {email}
                    </a>
                  )}
                  {!phone && !email && (
                    <span className="text-xs text-noir/30">Aucune coordonnée enregistrée</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">{b.status}</span>
                <span className={`rounded-full px-3 py-1 text-xs ${badge.className}`}>{badge.label}</span>
              </div>
            </Card>
          );
        })}
        {bookings.length === 0 && (
          <p className="text-noir/40">Aucun rendez-vous passé pour le moment.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/pro/historique?page=${page - 1}`}
              className="rounded-full border border-beige-dark px-4 py-2 text-sm text-noir hover:border-or"
            >
              ← Précédent
            </Link>
          )}
          <span className="text-sm text-noir/50">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/pro/historique?page=${page + 1}`}
              className="rounded-full border border-beige-dark px-4 py-2 text-sm text-noir hover:border-or"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
