import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { OpeningHoursForm } from "@/components/pro/OpeningHoursForm";

export default async function HorairesPage() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({
    where: { ownerId: dbUser.id },
    include: { openingHours: true },
  });
  if (!salon) redirect("/pro/salon/creer");

  const jours = salon.openingHours.map((h: (typeof salon.openingHours)[number]) => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
    isClosed: h.isClosed,
  }));

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Horaires d&apos;ouverture</h1>
      <p className="mt-1 text-noir/60">
        Affichés sur votre fiche salon, et utilisés pour indiquer si vous êtes actuellement
        ouvert ou fermé.
      </p>
      <OpeningHoursForm initialJours={jours} />
    </div>
  );
}
