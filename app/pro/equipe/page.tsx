import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeamMembersManager } from "@/components/pro/TeamMembersManager";

export default async function EquipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

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
      </p>
      <TeamMembersManager teamMembers={teamMembers} />
    </div>
  );
}
