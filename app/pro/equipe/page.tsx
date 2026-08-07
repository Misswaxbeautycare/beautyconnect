import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentDbUser } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { TeamMembersManager } from "@/components/pro/TeamMembersManager";

export default async function EquipePage() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const plan = getEffectivePlan(salon);

  if (plan.maxTeamMembers === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-noir">Mon équipe</h1>
        <p className="mt-3 text-noir/60">
          L&apos;affichage de votre équipe sur votre fiche salon est réservé aux formules
          Signature et Prestige.
        </p>
        <Link
          href="/pro/abonnement"
          className="mt-6 inline-block rounded-full bg-or px-6 py-3 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white transition"
        >
          Voir les formules
        </Link>
      </div>
    );
  }

  const teamMembersRaw = await prisma.teamMember.findMany({
    where: { salonId: salon.id },
    orderBy: { order: "asc" },
  });

  const teamMembers = teamMembersRaw.map((m: (typeof teamMembersRaw)[number]) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    photoUrl: m.photoUrl,
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Mon équipe</h1>
      <p className="mt-1 text-noir/60">
        Présentez les membres de votre salon sur votre fiche — chaque membre apparaît avec sa
        photo et sa spécialité.
        {Number.isFinite(plan.maxTeamMembers) && (
          <> Votre formule &laquo;&nbsp;{plan.name}&nbsp;&raquo; permet jusqu&apos;à {plan.maxTeamMembers} membres.</>
        )}
      </p>
      <TeamMembersManager teamMembers={teamMembers} />
    </div>
  );
}
