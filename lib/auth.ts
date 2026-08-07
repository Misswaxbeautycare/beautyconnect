import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Récupère le profil applicatif (table users) de la personne connectée,
// ou null si personne n'est connectée. Centralisé ici pour éviter de
// dupliquer cette logique dans chaque page serveur qui en a besoin.
export async function getCurrentDbUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { authId: user.id } });
}
