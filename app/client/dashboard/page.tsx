import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { clientId: dbUser.id },
    include: { salon: true, service: true, payment: true },
    orderBy: { date: "desc" },
  });

  const favorites = await prisma.favorite.findMany({
    where: { clientId: dbUser.id },
    include: { salon: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Bonjour {dbUser.firstName} 👋</h1>
      <p className="mt-1 text-noir/60">Voici vos rendez-vous et vos favoris.</p>

      <h2 className="mt-10 font-display text-xl text-noir">Mes rendez-vous</h2>
      <div className="mt-4 space-y-3">
        {bookings.map((b: (typeof bookings)[number]) => (
          <Card key={b.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium text-noir">{b.service.name}</p>
              <p className="text-sm text-noir/60">{b.salon.name} — {formatDate(b.date)}</p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70">{b.status}</span>
              {b.payment && <p className="mt-1 text-sm text-noir/60">{formatPrice(Number(b.payment.amount))}</p>}
            </div>
          </Card>
        ))}
        {bookings.length === 0 && <p className="text-noir/40">Aucun rendez-vous pour le moment.</p>}
      </div>

      <h2 className="mt-10 font-display text-xl text-noir">Mes professionnels favoris</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {favorites.map((f: (typeof favorites)[number]) => (
          <Card key={f.salonId} className="p-5">
            <p className="font-medium text-noir">{f.salon.name}</p>
            <p className="text-sm text-noir/60">{f.salon.city}</p>
          </Card>
        ))}
        {favorites.length === 0 && <p className="text-noir/40">Aucun favori enregistré.</p>}
      </div>
    </div>
  );
}
