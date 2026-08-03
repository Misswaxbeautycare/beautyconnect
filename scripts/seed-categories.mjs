// Insère (ou met à jour) les 13 catégories de base. Idempotent — s'exécute
// sans risque à chaque déploiement, y compris si les catégories existent déjà.
// Corrige le bug où le formulaire "Créer mon salon" exigeait de choisir une
// catégorie sans jamais en afficher aucune (table vide en production).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Coiffeur", slug: "coiffeur", icon: "scissors" },
  { name: "Esthéticienne", slug: "estheticienne", icon: "sparkles" },
  { name: "Barbier", slug: "barbier", icon: "razor" },
  { name: "Maquilleur", slug: "maquilleur", icon: "palette" },
  { name: "Onglerie", slug: "onglerie", icon: "hand" },
  { name: "Massage", slug: "massage", icon: "heart-hand" },
  { name: "Spa", slug: "spa", icon: "flower" },
  { name: "Extension de cils", slug: "extension-de-cils", icon: "eye" },
  { name: "Épilation", slug: "epilation", icon: "zap" },
  { name: "Soins visage", slug: "soins-visage", icon: "smile" },
  { name: "Soins corps", slug: "soins-corps", icon: "user" },
  { name: "Beauté afro", slug: "beaute-afro", icon: "star" },
  { name: "Maquillage permanent", slug: "maquillage-permanent", icon: "pen-tool" },
];

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: cat,
    });
  }
  console.log(`Catégories synchronisées : ${categories.length}`);
}

main()
  .catch((err) => {
    console.error("Erreur lors du seed des catégories :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
