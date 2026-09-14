import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { BlockedSlotsManager } from "@/components/pro/BlockedSlotsManager";

export default async function IndisponibilitesPage() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const blockedSlotsRaw = await prisma.blockedSlot.findMany({
    where: { salonId: salon.id, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  const blockedSlots = blockedSlotsRaw.map((b: (typeof blockedSlotsRaw)[number]) => ({
    id: b.id,
    date: b.date.toISOString(),
    durationMin: b.durationMin,
    reason: b.reason,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Mes indisponibilités</h1>
      <p className="mt-1 text-noir/60">
        Bloquez des créneaux quand vous n&apos;êtes pas disponible (pause, absence, congés) — ils
        apparaîtront comme pris pour vos clientes, sans qu&apos;il n&apos;y ait de vrai rendez-vous.
      </p>

      <BlockedSlotsManager initial={blockedSlots} />
    </div>
  );
}
