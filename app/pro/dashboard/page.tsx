import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CopySalonLink } from "@/components/pro/CopySalonLink";
import { ShareAppButton } from "@/components/ShareAppButton";
import { formatPrice, formatDate } from "@/lib/utils";
import { startOfMonth, startOfDay, endOfDay } from "date-fns";

export default async function ProDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Certains comptes ont pu être créés côté Supabase Auth sans que le profil
  // applicatif (table users) ne soit créé (ancien bug d'inscription).
  // On répare automatiquement ici plutôt que de renvoyer silencieusement vers /login.
  // Important : on ne force PAS le rôle sur PROFESSIONAL si la personne est
  // déjà ADMIN, pour ne pas écraser cet accès à chaque visite du tableau de bord.
  const existing = await prisma.user.findUnique({ where: { authId: user.id } });
  const dbUser = await prisma.user.upsert({
    where: { authId: user.id },
    update: existing?.role === "ADMIN" ? {} : { role: "PROFESSIONAL" },
    create: {
      authId: user.id,
      email: user.email ?? "",
      firstName: (user.user_metadata?.first_name as string) ?? "",
      lastName: (user.user_metadata?.last_name as string) ?? "",
      phone: (user.user_metadata?.phone as string) ?? null,
      role: "PROFESSIONAL",
    },
  });

  const salon = await prisma.salon.findUnique({
    where: { ownerId: dbUser.id },
    include: {
      bookings: {
        where: { date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) } },
        include: { client: true, service: true },
      },
    },
  });

  if (!salon) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-noir">Créez votre salon</h1>
        <p className="mt-2 text-noir/60">
          Vous n&apos;avez pas encore configuré votre espace professionnel.
        </p>
        <Link
          href="/pro/salon/creer"
          className="mt-6 inline-block rounded-full bg-noir text-white px-8 py-3 text-sm font-semibold hover:bg-neutral-800 transition"
        >
          Configurer mon salon
        </Link>
      </div>
    );
  }

  const monthPayments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      booking: { salonId: salon.id, date: { gte: startOfMonth(new Date()) } },
    },
  });
  const monthlyRevenue = monthPayments.reduce((sum: number, p: (typeof monthPayments)[number]) => sum + Number(p.amount), 0);

  const newClientsCount = await prisma.booking.groupBy({
    by: ["clientId"],
    where: { salonId: salon.id, createdAt: { gte: startOfMonth(new Date()) } },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-noir">{salon.name}</h1>
          <p className="mt-1 text-noir/60">Tableau de bord professionnel</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pro/salon/modifier"
            className="rounded-full bg-beige border border-beige-dark text-noir px-6 py-3 text-sm font-semibold hover:bg-beige-dark transition"
          >
            Modifier mon salon
          </Link>
          <Link
            href="/pro/services"
            className="rounded-full bg-beige border border-beige-dark text-noir px-6 py-3 text-sm font-semibold hover:bg-beige-dark transition"
          >
            Mes prestations
          </Link>
          <Link
            href="/pro/abonnement"
            className="rounded-full bg-beige border border-beige-dark text-noir px-6 py-3 text-sm font-semibold hover:bg-beige-dark transition"
          >
            Mon abonnement
          </Link>
          <Link
            href="/pro/agenda"
            className="rounded-full bg-noir text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800 transition"
          >
            Voir l&apos;agenda complet
          </Link>
          {dbUser.role === "ADMIN" && (
            <Link
              href="/admin/dashboard"
              className="rounded-full bg-or px-6 py-3 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white transition"
            >
              Administration
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CopySalonLink salonId={salon.id} />
        <ShareAppButton />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">RDV aujourd&apos;hui</p>
          <p className="mt-2 font-display text-2xl text-noir">{salon.bookings.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">CA du mois</p>
          <p className="mt-2 font-display text-2xl text-noir">{formatPrice(monthlyRevenue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">Nouvelles clientes</p>
          <p className="mt-2 font-display text-2xl text-noir">{newClientsCount.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">Commission</p>
          <p className="mt-2 font-display text-2xl text-noir">{salon.commissionRate}%</p>
        </Card>
      </div>

      <h2 className="mt-10 font-display text-xl text-noir">Rendez-vous du jour</h2>
      <div className="mt-4 space-y-3">
        {salon.bookings.map((b: (typeof salon.bookings)[number]) => {
          const nomClient = b.client
            ? `${b.client.firstName} ${b.client.lastName}`
            : b.guestName ?? "Client sans nom";
          return (
            <Card key={b.id} className="flex items-center justify-between p-5">
              <div>
                <p className="font-medium text-noir">{nomClient}</p>
                <p className="text-sm text-noir/60">{b.service.name} — {formatDate(b.date)}</p>
              </div>
              <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">{b.status}</span>
            </Card>
          );
        })}
        {salon.bookings.length === 0 && <p className="text-noir/40">Aucun rendez-vous aujourd&apos;hui.</p>}
      </div>
    </div>
  );
}
