import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManualBookingForm } from "@/components/pro/ManualBookingForm";

export default async function NouveauRendezVousPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const services = await prisma.service.findMany({
    where: { salonId: salon.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Ajouter un rendez-vous</h1>
      <p className="mt-2 text-sm text-noir/60">
        Pour une cliente reçue par téléphone ou en personne, sans passer par la réservation en ligne.
      </p>
      {services.length === 0 ? (
        <p className="mt-8 text-sm text-noir/50">
          Vous devez d&apos;abord ajouter au moins une prestation à votre salon avant de pouvoir créer un rendez-vous.
        </p>
      ) : (
        <ManualBookingForm services={services} />
      )}
    </div>
  );
}
