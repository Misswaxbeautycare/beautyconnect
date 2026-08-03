import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ServiceForm } from "@/components/pro/ServiceForm";

export default async function NouvellePrestationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Ajouter une prestation</h1>
      <p className="mt-2 text-sm text-noir/60">
        Ex: coupe, soin, tissage... Chaque prestation pourra être choisie lors d&apos;un rendez-vous.
      </p>
      <ServiceForm categories={categories} />
    </div>
  );
}
