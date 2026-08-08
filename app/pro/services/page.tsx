import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServicesList } from "@/components/pro/ServicesList";
import { ServiceTemplatesPicker } from "@/components/pro/ServiceTemplatesPicker";
import { getEffectivePlan } from "@/lib/subscription-plans";

export default async function PrestationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const servicesRaw = await prisma.service.findMany({
    where: { salonId: salon.id },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const services = servicesRaw.map((s: (typeof servicesRaw)[number]) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    durationMin: s.durationMin,
    depositPct: s.depositPct,
    modes: s.modes,
    isActive: s.isActive,
    category: s.category,
  }));

  const plan = getEffectivePlan(salon);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-noir">Mes prestations</h1>
          <p className="mt-1 text-noir/60">Gérez les soins proposés dans votre salon.</p>
        </div>
        <Link
          href="/pro/services/nouveau"
          className="rounded-full bg-noir text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800 transition"
        >
          + Ajouter
        </Link>
      </div>

      <div className="mt-8">
        <ServiceTemplatesPicker />
      </div>

      <ServicesList services={services} allowMultiMode={plan.multiModePrestations} />
    </div>
  );
}
