import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatDate, formatPrice } from "@/lib/utils";
import { startOfDay } from "date-fns";

function paymentBadge(payment: { type: string; status: string; amount: unknown } | null) {
  if (!payment) {
    return { label: "Aucun paiement", className: "bg-neutral-100 text-neutral-500" };
  }
  if (payment.status === "PAID") {
    const label = payment.type === "DEPOSIT" ? "Acompte payé" : "Payé intégralement";
    return { label: `${label} · ${formatPrice(Number(payment.amount))}`, className: "bg-green-50 text-green-700" };
  }
  if (payment.status === "PENDING") {
    return { label: "Paiement en attente", className: "bg-amber-50 text-amber-700" };
  }
  if (payment.status === "REFUNDED") {
    return { label: "Remboursé", className: "bg-neutral-100 text-neutral-500" };
  }
  return { label: "Paiement échoué", className: "bg-red-50 text-red-700" };
}

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser || dbUser.role !== "PROFESSIONAL") redirect("/login");

  const salon = await prisma.salon.findUnique({
    where: { ownerId: dbUser.id },
  });

  if (!salon) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-noir">Créez votre salon</h1>
        <p className="mt-2 text-noir/60">
          Vous n&apos;avez pas encore configuré votre espace professionnel.
        </p>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: {
      salonId: salon.id,
      date: { gte: startOfDay(new Date()) },
      status: { notIn: ["CANCELLED", "REFUSED"] },
    },
    include: { client: true, service: true, payment: true },
    orderBy: { date: "asc" },
  });

  const groupes = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    const jour = new Date(b.date).toLocaleDateString("fr-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[jour]) acc[jour] = [];
    acc[jour].push(b);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-noir">Agenda</h1>
          <p className="mt-1 text-noir/60">Tous vos prochains rendez-vous</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/pro/clients"
            className="rounded-full border border-noir/15 text-noir px-6 py-3 text-sm font-semibold hover:bg-beige transition"
          >
            Clientes fidèles
          </Link>
          <Link
            href="/pro/clients/nouveau"
            className="rounded-full bg-noir text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800 transition"
          >
            + Ajouter un rendez-vous
          </Link>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {Object.entries(groupes).map(([jour, bookingsDuJour]) => (
          <div key={jour}>
            <h2 className="font-display text-lg text-noir capitalize mb-3">
              {jour}
            </h2>
            <div className="space-y-3">
              {bookingsDuJour.map((b) => {
                const nomClient = b.client
                  ? `${b.client.firstName} ${b.client.lastName}`
                  : b.guestName ?? "Client sans nom";
                const badge = paymentBadge(b.payment);
                return (
                  <Card key={b.id} className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <p className="font-medium text-noir">{nomClient}</p>
                      <p className="text-sm text-noir/60">
                        {b.service.name} · {formatDate(b.date)}
                        {!b.client && (
                          <span className="ml-2 text-xs text-noir/40">
                            (ajouté manuellement)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">
                        {b.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <p className="text-noir/40">Aucun rendez-vous à venir.</p>
        )}
      </div>
    </div>
  );
}
