import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServicesList } from "@/components/pro/ServicesList";

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

  const services = servicesRaw.map((s: { id: string; name: string; price: unknown; durationMin: number; isActive: boolean; category: { name: string } }) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    durationMin: s.durationMin,
    isActive: s.isActive,
    category: s.category,
  }));

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
      <ServicesList services={services} />
    </div>
  );
}
