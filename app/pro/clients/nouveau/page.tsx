import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ManualBookingForm } from "@/components/pro/ManualBookingForm";

export default async function NouveauRendezVousPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const servicesRaw = await prisma.service.findMany({
    where: { salonId: salon.id, isActive: true },
    orderBy: { name: "asc" },
  });

  // Le prix vient de la base sous un type "Decimal" (Prisma), qu'il faut
  // convertir en nombre simple avant de le transmettre à un composant client.
  const services = servicesRaw.map((s: { id: string; name: string; price: unknown; durationMin: number }) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    durationMin: s.durationMin,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir">Ajouter un rendez-vous</h1>
      <p className="mt-2 text-sm text-noir/60">
        Pour une cliente reçue par téléphone ou en personne, sans passer par la réservation en ligne.
      </p>
      {services.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-noir/50">
            Vous devez d&apos;abord ajouter au moins une prestation à votre salon avant de pouvoir créer un rendez-vous.
          </p>
          <Link
            href="/pro/services/nouveau"
            className="mt-4 inline-block rounded-full bg-noir text-white px-6 py-3 text-sm font-semibold hover:bg-neutral-800 transition"
          >
            Ajouter une prestation
          </Link>
        </div>
      ) : (
        <ManualBookingForm services={services} />
      )}
    </div>
  );
}
