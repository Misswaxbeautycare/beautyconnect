import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/login");

  const [userCount, salonCount, pendingSalons, totalPayments] = await Promise.all([
    prisma.user.count(),
    prisma.salon.count(),
    prisma.salon.count({ where: { isApproved: false } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true, commissionAmount: true } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Administration</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">Utilisateurs</p>
          <p className="mt-2 font-display text-2xl text-noir">{userCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">Salons</p>
          <p className="mt-2 font-display text-2xl text-noir">{salonCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">En attente d'approbation</p>
          <p className="mt-2 font-display text-2xl text-noir">{pendingSalons}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-noir/50">Commissions perçues</p>
          <p className="mt-2 font-display text-2xl text-noir">
            {formatPrice(Number(totalPayments._sum.commissionAmount ?? 0))}
          </p>
        </Card>
      </div>

      <p className="mt-10 text-sm text-noir/50">
        Modules à venir dans cet espace : gestion des utilisateurs, validation des salons,
        gestion des catégories, gestion des commissions par salon, historique des paiements.
      </p>
    </div>
  );
}
