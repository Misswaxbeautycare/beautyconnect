import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { VersementsList } from "@/components/admin/VersementsList";

export default async function VersementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { status: "PAID", payoutStatus: "PENDING" },
    include: { booking: { include: { salon: true } } },
    orderBy: { createdAt: "asc" },
  });

  const parSalon = new Map<
    string,
    { salonId: string; salonName: string; phone: string | null; totalCollecte: number; totalCommission: number; nbPaiements: number }
  >();

  for (const p of payments) {
    const salon = p.booking.salon;
    const entry = parSalon.get(salon.id) ?? {
      salonId: salon.id,
      salonName: salon.name,
      phone: salon.phone,
      totalCollecte: 0,
      totalCommission: 0,
      nbPaiements: 0,
    };
    entry.totalCollecte += Number(p.amount);
    entry.totalCommission += Number(p.commissionAmount);
    entry.nbPaiements += 1;
    parSalon.set(salon.id, entry);
  }

  const lignes = Array.from(parSalon.values())
    .map((l) => ({ ...l, netAVerser: l.totalCollecte - l.totalCommission }))
    .sort((a, b) => b.netAVerser - a.netAVerser);

  const totalNetGlobal = lignes.reduce((sum, l) => sum + l.netAVerser, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Versements aux salons</h1>
      <p className="mt-1 text-noir/60">
        Comme les paiements en ligne arrivent tous sur ton compte Stripe, voici ce qu&apos;il
        reste à reverser manuellement à chaque salon (virement bancaire, en dehors de l&apos;app),
        ta commission déjà déduite.
      </p>

      <div className="mt-6 rounded-2xl border border-beige-dark bg-beige/50 p-4">
        <p className="text-sm text-noir/60">Total net à verser (tous salons)</p>
        <p className="font-display text-2xl text-noir">{formatPrice(totalNetGlobal)}</p>
      </div>

      <VersementsList lignes={lignes} />
    </div>
  );
}
