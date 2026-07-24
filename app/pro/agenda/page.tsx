import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { startOfDay } from "date-fns";

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
    include: { client: true, service: true },
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
        <Link
          href="/pro/clients/nouveau"
          className="rounded-full bg-noir text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800 transition"
        >
          + Ajouter un rendez-vous
        </Link>
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
                return (
                  <Card key={b.id} className="flex items-center justify-between p-5">
                    <div>
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
                    <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">
                      {b.status}
                    </span>
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
