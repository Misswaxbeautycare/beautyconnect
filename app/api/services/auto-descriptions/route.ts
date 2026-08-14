import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { serviceTemplates } from "@/lib/service-templates";

// Construit un index nom (en minuscules) -> description à partir de TOUT le
// catalogue de modèles, toutes catégories confondues — une prestation
// "Tissage fermé" doit matcher même si le pro l'a rangée dans une autre
// catégorie que celle du modèle d'origine.
function buildDescriptionIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const items of Object.values(serviceTemplates)) {
    for (const item of items) {
      index.set(item.name.trim().toLowerCase(), item.description);
    }
  }
  return index;
}

export async function POST() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) return NextResponse.json({ error: "Aucun salon configuré" }, { status: 404 });

  const services = await prisma.service.findMany({
    where: { salonId: salon.id, OR: [{ description: null }, { description: "" }] },
  });

  const index = buildDescriptionIndex();
  let filled = 0;

  for (const service of services) {
    const description = index.get(service.name.trim().toLowerCase());
    if (description) {
      await prisma.service.update({ where: { id: service.id }, data: { description } });
      filled += 1;
    }
  }

  return NextResponse.json({ filled, remaining: services.length - filled });
}
