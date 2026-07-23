import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPrice, formatDate } from "@/lib/utils";
import { startOfMonth, startOfDay, endOfDay } from "date-fns";

export default async function ProDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser || dbUser.role !== "PROFESSIONAL") redirect("/login");

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
          Vous n'avez pas encore configuré votre espace professionnel.
        </p>
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
      <h1 className="font-display text-3xl text-noir">{salon.name}</h1>
      <p className="mt-1 text-noir/60">Tableau de bord professionnel</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">RDV aujourd'hui</p>
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
        {salon.bookings.map((b: (typeof salon.bookings)[number]) => (
          <Card key={b.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium text-noir">{b.client.firstName} {b.client.lastName}</p>
              <p className="text-sm text-noir/60">{b.service.name} — {formatDate(b.date)}</p>
            </div>
            <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">{b.status}</span>
          </Card>
        ))}
        {salon.bookings.length === 0 && <p className="text-noir/40">Aucun rendez-vous aujourd'hui.</p>}
      </div>
    </div>
  );
}
