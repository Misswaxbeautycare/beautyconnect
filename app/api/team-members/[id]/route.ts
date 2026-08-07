import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { teamMemberSchema } from "@/lib/validations";

async function assertOwnership(teamMemberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" as const, status: 401 as const };

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  const salon = dbUser ? await prisma.salon.findUnique({ where: { ownerId: dbUser.id } }) : null;
  const teamMember = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });

  if (!salon || !teamMember || teamMember.salonId !== salon.id) {
    return { error: "Membre introuvable" as const, status: 404 as const };
  }
  return { teamMember };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await assertOwnership(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const body = await req.json();
  const parsed = teamMemberSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.teamMember.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ teamMember: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await assertOwnership(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
