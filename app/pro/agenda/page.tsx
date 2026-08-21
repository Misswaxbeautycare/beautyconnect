import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PaymentLinkButton } from "@/components/pro/PaymentLinkButton";
import { RequestReviewButton } from "@/components/pro/RequestReviewButton";
import { formatDate, formatPrice } from "@/lib/utils";
import { startOfDay } from "date-fns";
import { Phone, Mail } from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";

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
  // Comme pour les autres pages pro (équipe, prestations, horaires...), on
  // vérifie la propriété réelle du salon plutôt qu'un champ "role" qui peut
  // ne pas avoir été mis à jour selon le parcours suivi par la personne —
  // ça évitait un renvoi silencieux vers /login pour certains comptes.
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

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
    include: { client: true, service: true, payment: true, additionalServices: { include: { service: true } } },
    orderBy: { date: "asc" },
  });

  // Rendez-vous passés récents (30 derniers jours) n'ayant pas encore d'avis,
  // pour permettre au professionnel d'en demander un facilement.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const pastBookingsNeedingReview = await prisma.booking.findMany({
    where: {
      salonId: salon.id,
      date: { gte: thirtyDaysAgo, lt: new Date() },
      status: "CONFIRMED",
      review: null,
    },
    include: { client: true, service: true },
    orderBy: { date: "desc" },
    take: 10,
  });

  const groupes = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    const jour = new Date(b.date).toLocaleDateString("fr-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Brussels",
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

      <p className="mt-6 rounded-xl bg-beige px-4 py-3 text-xs text-noir/60">
        Rappel envoyé automatiquement à chaque cliente : merci de bien respecter vos rendez-vous
        (prévenez le salon en cas d&apos;empêchement).
      </p>

      {pastBookingsNeedingReview.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-noir">Demander un avis</h2>
          <p className="mt-1 text-xs text-noir/50">
            Rendez-vous récents sans avis — copiez un message à envoyer à la cliente.
          </p>
          <div className="mt-3 space-y-2">
            {pastBookingsNeedingReview.map((b: (typeof pastBookingsNeedingReview)[number]) => (
              <Card key={b.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-noir">
                    {b.client ? `${b.client.firstName} ${b.client.lastName}` : b.guestName ?? "Cliente"}
                  </p>
                  <p className="text-xs text-noir/50">{b.service.name} · {formatDate(b.date)}</p>
                </div>
                <RequestReviewButton />
              </Card>
            ))}
          </div>
        </div>
      )}

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
                const email = b.client?.email ?? b.guestEmail ?? null;
                const phone = b.client?.phone ?? b.guestPhone ?? null;
                const badge = paymentBadge(b.payment);
                const needsPaymentNudge = !b.payment || b.payment.status !== "PAID";

                const tousLesServices = [
                  b.service.name,
                  ...(b.additionalServices ?? []).map((it: { service: { name: string } }) => it.service.name),
                ].join(" + ");
                return (
                  <Card key={b.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-noir">{nomClient}</p>
                      <p className="text-sm text-noir/60">
                        {tousLesServices} · {formatDate(b.date)}
                        {!b.client && (
                          <span className="ml-2 text-xs text-noir/40">
                            (ajouté manuellement)
                          </span>
                        )}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-3">
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-1 text-xs text-noir/60 hover:text-or-dark"
                          >
                            <Phone size={12} /> {phone}
                          </a>
                        )}
                        {email && (
                          <a
                            href={`mailto:${email}`}
                            className="flex items-center gap-1 text-xs text-noir/60 hover:text-or-dark"
                          >
                            <Mail size={12} /> {email}
                          </a>
                        )}
                        {!phone && !email && (
                          <span className="text-xs text-noir/30">Aucune coordonnée enregistrée</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                      <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">
                        {b.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs ${badge.className}`}>
                        {badge.label}
                      </span>
                      {needsPaymentNudge && <PaymentLinkButton bookingId={b.id} />}
                      {b.client && <RequestReviewButton />}
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
