import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SalonCreateForm } from "@/components/pro/SalonCreateForm";

export default async function CreerSalonPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Configurer mon salon</h1>
      <p className="mt-2 text-sm text-noir/60">
        Ces informations seront visibles par vos futures clientes.
      </p>
      <SalonCreateForm categories={categories} />
    </div>
  );
}
