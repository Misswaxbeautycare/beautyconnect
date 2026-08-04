export interface ServiceTemplate {
  name: string;
  durationMin: number;
  price: number;
}

// Catalogue de prestations courantes, groupées par slug de catégorie
// (voir lib/categories.ts). Prix et durées sont des valeurs de départ
// raisonnables — la personne peut les ajuster avant ou après l'ajout.
export const serviceTemplates: Record<string, ServiceTemplate[]> = {
  coiffeur: [
    { name: "Coupe femme", durationMin: 45, price: 35 },
    { name: "Coupe homme", durationMin: 30, price: 20 },
    { name: "Coupe + brushing", durationMin: 60, price: 45 },
    { name: "Brushing", durationMin: 30, price: 25 },
    { name: "Coloration", durationMin: 90, price: 60 },
    { name: "Mèches / balayage", durationMin: 120, price: 80 },
    { name: "Lissage brésilien", durationMin: 150, price: 120 },
  ],
  barbier: [
    { name: "Taille de barbe", durationMin: 20, price: 15 },
    { name: "Coupe + barbe", durationMin: 45, price: 30 },
    { name: "Rasage traditionnel", durationMin: 30, price: 20 },
  ],
  estheticienne: [
    { name: "Soin visage classique", durationMin: 60, price: 45 },
    { name: "Nettoyage de peau", durationMin: 45, price: 35 },
    { name: "Épilation sourcils", durationMin: 15, price: 12 },
    { name: "Manucure", durationMin: 45, price: 30 },
    { name: "Pédicure", durationMin: 60, price: 40 },
  ],
  onglerie: [
    { name: "Pose gel", durationMin: 60, price: 40 },
    { name: "Pose vernis semi-permanent", durationMin: 45, price: 30 },
    { name: "Remplissage gel", durationMin: 45, price: 30 },
    { name: "Nail art (par ongle)", durationMin: 10, price: 3 },
    { name: "Dépose", durationMin: 20, price: 10 },
  ],
  massage: [
    { name: "Massage relaxant 30min", durationMin: 30, price: 35 },
    { name: "Massage relaxant 1h", durationMin: 60, price: 60 },
    { name: "Massage aux pierres chaudes", durationMin: 60, price: 70 },
    { name: "Massage sportif", durationMin: 45, price: 50 },
  ],
  spa: [
    { name: "Gommage corporel", durationMin: 45, price: 45 },
    { name: "Enveloppement corporel", durationMin: 60, price: 55 },
    { name: "Rituel spa complet", durationMin: 120, price: 100 },
  ],
  "extension-de-cils": [
    { name: "Extension cil à cil", durationMin: 90, price: 65 },
    { name: "Extension volume russe", durationMin: 120, price: 85 },
    { name: "Rehaussement de cils", durationMin: 60, price: 45 },
    { name: "Remplissage cils", durationMin: 60, price: 40 },
  ],
  epilation: [
    { name: "Épilation demi-jambes", durationMin: 20, price: 18 },
    { name: "Épilation jambes complètes", durationMin: 40, price: 30 },
    { name: "Épilation maillot", durationMin: 20, price: 20 },
    { name: "Épilation aisselles", durationMin: 10, price: 12 },
  ],
  "soins-visage": [
    { name: "Soin hydratant", durationMin: 45, price: 40 },
    { name: "Soin anti-âge", durationMin: 60, price: 55 },
    { name: "Soin purifiant peau grasse", durationMin: 45, price: 40 },
  ],
  "soins-corps": [
    { name: "Drainage lymphatique", durationMin: 45, price: 50 },
    { name: "Soin minceur", durationMin: 60, price: 55 },
  ],
  "beaute-afro": [
    { name: "Tissage fermé", durationMin: 150, price: 80 },
    { name: "Tissage ouvert", durationMin: 180, price: 100 },
    { name: "Tissage invisible", durationMin: 210, price: 130 },
    { name: "Pose perruque", durationMin: 60, price: 40 },
    { name: "Perruque Lace Front", durationMin: 90, price: 70 },
    { name: "Perruque Full Lace", durationMin: 120, price: 90 },
    { name: "Closure Wig", durationMin: 90, price: 65 },
    { name: "Frontal Wig", durationMin: 120, price: 85 },
    { name: "Soin cheveux afro", durationMin: 60, price: 35 },
    { name: "Réparation capillaire", durationMin: 60, price: 40 },
    { name: "Nattes simples", durationMin: 120, price: 50 },
    { name: "Nattes avec perles", durationMin: 150, price: 65 },
    { name: "Vanilles enfants", durationMin: 90, price: 35 },
    { name: "Ponytail tissage", durationMin: 60, price: 45 },
  ],
  maquilleur: [
    { name: "Maquillage jour", durationMin: 45, price: 40 },
    { name: "Maquillage soirée", durationMin: 60, price: 55 },
    { name: "Maquillage mariée", durationMin: 90, price: 90 },
  ],
  "maquillage-permanent": [
    { name: "Sourcils poudrés", durationMin: 120, price: 150 },
    { name: "Eyeliner permanent", durationMin: 90, price: 120 },
    { name: "Contour des lèvres", durationMin: 90, price: 130 },
  ],
};
