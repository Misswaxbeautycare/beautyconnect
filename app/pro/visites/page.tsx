import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { subDays } from "date-fns";
import { User } from "lucide-react";

export default async function VisitesPage() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const depuis7j = subDays(new Date(), 7);
  const depuis30j = subDays(new Date(), 30);

  const [total7j, total30j, visitesRaw] = await Promise.all([
    prisma.salonVisit.count({ where: { salonId: salon.id, createdAt: { gte: depuis7j } } }),
    prisma.salonVisit.count({ where: { salonId: salon.id, createdAt: { gte: depuis30j } } }),
    prisma.salonVisit.findMany({
      where: { salonId: salon.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const visites = visitesRaw.map((v: (typeof visitesRaw)[number]) => ({
    id: v.id,
    createdAt: v.createdAt,
    clientName: v.client ? `${v.client.firstName} ${v.client.lastName.charAt(0)}.` : null,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Visites de ma fiche</h1>
      <p className="mt-1 text-noir/60">
        Les clientes connectées apparaissent nominativement ; les visiteurs non connectés
        restent anonymes, comptabilisés seulement dans le total.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-beige-dark p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">7 derniers jours</p>
          <p className="mt-2 font-display text-2xl text-noir">{total7j}</p>
        </div>
        <div className="rounded-2xl border border-beige-dark p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">30 derniers jours</p>
          <p className="mt-2 font-display text-2xl text-noir">{total30j}</p>
        </div>
      </div>

      <h2 className="mt-10 mb-3 font-display text-lg text-noir">Dernières visites</h2>
      {visites.length === 0 ? (
        <p className="text-sm text-noir/40">Pas encore de visite enregistrée.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {visites.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-beige-dark px-4 py-2.5 text-sm"
            >
              <span className="flex items-center gap-2 text-noir">
                <User size={14} className="text-noir/30" />
                {v.clientName ?? <span className="text-noir/40">Visiteur anonyme</span>}
              </span>
              <span className="text-xs text-noir/40">
                {v.createdAt.toLocaleDateString("fr-BE", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Brussels",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
