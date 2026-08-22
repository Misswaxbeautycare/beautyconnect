import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CopySalonLink } from "@/components/pro/CopySalonLink";
import { DashboardMenu } from "@/components/pro/DashboardMenu";
import { ShareAppButton } from "@/components/ShareAppButton";
import { InstallAppButton } from "@/components/InstallAppButton";
import { formatPrice, formatDate } from "@/lib/utils";
import { startOfMonth, startOfDay, endOfDay } from "date-fns";
import { Phone, Mail } from "lucide-react";
import { PaymentLinkButton } from "@/components/pro/PaymentLinkButton";
import { paymentBadge } from "@/lib/payment-badge";
import { OnboardingChecklist } from "@/components/pro/OnboardingChecklist";

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
        include: { client: true, service: true, payment: true },
      },
      photos: { select: { id: true }, take: 1 },
      openingHours: { select: { id: true }, take: 1 },
      services: { where: { isActive: true }, select: { id: true }, take: 1 },
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
        <div className="flex items-center gap-3">
          <Link
            href="/pro/agenda"
            className="rounded-full bg-or text-noir px-6 py-3 text-sm font-semibold hover:bg-or-dark hover:text-white transition"
          >
            Voir l&apos;agenda
          </Link>
          <DashboardMenu isAdmin={dbUser.role === "ADMIN"} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CopySalonLink salonId={salon.id} />
        <ShareAppButton />
        <InstallAppButton />
      </div>

      <OnboardingChecklist
        items={[
          { label: "Renseigner la description et l'adresse du salon", done: Boolean(salon.description && salon.address), href: "/pro/salon/modifier" },
          { label: "Ajouter au moins une photo", done: salon.photos.length > 0, href: "/pro/salon/modifier" },
          { label: "Renseigner les horaires d'ouverture", done: salon.openingHours.length > 0, href: "/pro/horaires" },
          { label: "Ajouter au moins une prestation", done: salon.services.length > 0, href: "/pro/services" },
          { label: "Renseigner un numéro de téléphone", done: Boolean(salon.phone), href: "/pro/salon/modifier" },
        ]}
      />

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
          const email = b.client?.email ?? b.guestEmail ?? null;
          const phone = b.client?.phone ?? b.guestPhone ?? null;
          const badge = paymentBadge(b.payment);
          const needsPaymentNudge = !b.payment || b.payment.status !== "PAID";
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
                {needsPaymentNudge && <PaymentLinkButton bookingId={b.id} />}
              </div>
            </Card>
          );
        })}
        {salon.bookings.length === 0 && <p className="text-noir/40">Aucun rendez-vous aujourd&apos;hui.</p>}
      </div>
    </div>
  );
}
