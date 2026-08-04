import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SalonPlanSelector } from "@/components/admin/SalonPlanSelector";

export default async function AdminSalonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/login");

  const salons = await prisma.salon.findMany({
    include: { owner: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Salons — formules d&apos;abonnement</h1>
      <p className="mt-1 text-noir/60">
        Attribution manuelle d&apos;une formule, indépendamment de Stripe (utile pour un compte
        interne ou un partenariat).
      </p>

      <div className="mt-8 space-y-3">
        {salons.map((salon) => (
          <Card key={salon.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium text-noir">{salon.name}</p>
              <p className="text-xs text-noir/50">
                {salon.owner.email} · {salon.city}
              </p>
              <p className="text-xs text-noir/40">
                Statut actuel : {salon.subscriptionStatus ?? "aucun"}
                {salon.stripeSubscriptionId ? " (géré par Stripe)" : ""}
              </p>
            </div>
            <SalonPlanSelector salonId={salon.id} currentPlan={salon.subscriptionPlan} />
          </Card>
        ))}
        {salons.length === 0 && <p className="text-noir/40">Aucun salon pour le moment.</p>}
      </div>
    </div>
  );
}
