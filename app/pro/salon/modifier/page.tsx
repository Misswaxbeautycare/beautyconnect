import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SalonEditForm } from "@/components/pro/SalonEditForm";
import { getEffectivePlan } from "@/lib/subscription-plans";

export default async function ModifierSalonPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({
    where: { ownerId: dbUser.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      categories: true,
    },
  });

  if (!salon) redirect("/pro/salon/creer");

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const plan = getEffectivePlan(salon);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Modifier mon salon</h1>
      <p className="mt-2 text-sm text-noir/60">
        Mettez à jour les informations et les photos de votre salon.
      </p>
      <SalonEditForm
        categories={categories}
        salon={{
          ...salon,
          deplacementBaseFee: salon.deplacementBaseFee ? Number(salon.deplacementBaseFee) : null,
          deplacementFeePerKm: salon.deplacementFeePerKm ? Number(salon.deplacementFeePerKm) : null,
        }}
        maxPhotos={plan.maxPhotos}
      />
    </div>
  );
}
