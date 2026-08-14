export interface ServiceTemplate {
  name: string;
  durationMin: number;
  price: number;
  description: string;
}

// Catalogue de prestations courantes, groupées par slug de catégorie
// (voir lib/categories.ts). Prix et durées sont des valeurs de départ
// raisonnables — la personne peut les ajuster avant ou après l'ajout.
// Les descriptions sont volontairement courtes (une phrase) et concrètes :
// elles doivent donner envie de réserver, pas décrire une technique.
export const serviceTemplates: Record<string, ServiceTemplate[]> = {
  coiffeur: [
    { name: "Coupe femme", durationMin: 45, price: 35, description: "Coupe personnalisée selon votre morphologie, terminée au brushing." },
    { name: "Coupe homme", durationMin: 30, price: 20, description: "Coupe nette et rapide, dégradé ou ciseaux selon votre style." },
    { name: "Coupe + brushing", durationMin: 60, price: 45, description: "L'essentiel pour repartir avec une coiffure impeccable, prête pour la journée." },
    { name: "Brushing", durationMin: 30, price: 25, description: "Volume et brillance en un éclair, idéal avant une sortie." },
    { name: "Coloration", durationMin: 90, price: 60, description: "Couleur uniforme et éclatante, formulée selon votre carnation." },
    { name: "Mèches / balayage", durationMin: 120, price: 80, description: "Effet soleil naturel qui illumine le visage, sans démarcation à la repousse." },
    { name: "Lissage brésilien", durationMin: 150, price: 120, description: "Cheveux lisses et disciplinés pendant plusieurs mois, fini brillance miroir." },
    { name: "Coiffure mariée", durationMin: 90, price: 130, description: "Coiffure sur-mesure pour le plus beau jour, tenue garantie toute la cérémonie." },
    { name: "Coiffure cérémonie / invitée", durationMin: 45, price: 60, description: "Un chignon ou une coiffure sophistiquée pour briller lors d'un événement." },
  ],
  barbier: [
    { name: "Taille de barbe", durationMin: 20, price: 15, description: "Barbe redessinée et affinée pour un rendu net et structuré." },
    { name: "Coupe + barbe", durationMin: 45, price: 30, description: "Le combo complet pour un look soigné de la tête au menton." },
    { name: "Rasage traditionnel", durationMin: 30, price: 20, description: "Rasage au coupe-chou à l'ancienne, serviette chaude et finitions précises." },
  ],
  estheticienne: [
    { name: "Soin visage classique", durationMin: 60, price: 45, description: "Nettoyage, gommage et masque pour une peau nette et reposée." },
    { name: "Nettoyage de peau", durationMin: 45, price: 35, description: "Peau purifiée en profondeur, pores resserrés, teint frais immédiat." },
    { name: "Épilation sourcils", durationMin: 15, price: 12, description: "Regard redessiné en quelques minutes, sourcils parfaitement structurés." },
    { name: "Manucure", durationMin: 45, price: 30, description: "Mains soignées et ongles impeccables, prêtes à être montrées." },
    { name: "Pédicure", durationMin: 60, price: 40, description: "Pieds soignés et détendus, parfait avant l'été ou une occasion spéciale." },
  ],
  onglerie: [
    { name: "Pose gel", durationMin: 60, price: 40, description: "Ongles renforcés et brillants pendant plusieurs semaines." },
    { name: "Pose vernis semi-permanent", durationMin: 45, price: 30, description: "Couleur intense qui tient jusqu'à 3 semaines sans s'écailler." },
    { name: "Remplissage gel", durationMin: 45, price: 30, description: "Entretien de votre pose existante pour un résultat toujours net." },
    { name: "Nail art (par ongle)", durationMin: 10, price: 3, description: "Une touche créative et personnalisée sur chaque ongle." },
    { name: "Dépose", durationMin: 20, price: 10, description: "Retrait en douceur, sans abîmer l'ongle naturel." },
  ],
  massage: [
    { name: "Massage relaxant 30min", durationMin: 30, price: 35, description: "Une vraie pause détente entre midi et deux, tensions relâchées." },
    { name: "Massage relaxant 1h", durationMin: 60, price: 60, description: "Corps entier détendu, l'antidote parfait à une semaine chargée." },
    { name: "Massage aux pierres chaudes", durationMin: 60, price: 70, description: "La chaleur des pierres dénoue les tensions profondes, moment cocooning garanti." },
    { name: "Massage sportif", durationMin: 45, price: 50, description: "Muscles soulagés en profondeur, idéal après un effort intense." },
  ],
  spa: [
    { name: "Gommage corporel", durationMin: 45, price: 45, description: "Peau douce et lumineuse, débarrassée des cellules mortes." },
    { name: "Enveloppement corporel", durationMin: 60, price: 55, description: "Une parenthèse enveloppante pour une peau nourrie et repulpée." },
    { name: "Rituel spa complet", durationMin: 120, price: 100, description: "L'expérience bien-être ultime : gommage, massage et soin, tout en un." },
  ],
  "extension-de-cils": [
    { name: "Extension cil à cil", durationMin: 90, price: 65, description: "Regard intensifié naturellement, sans mascara au quotidien." },
    { name: "Extension volume russe", durationMin: 120, price: 85, description: "Effet regard glamour et spectaculaire, parfait pour les grandes occasions." },
    { name: "Rehaussement de cils", durationMin: 60, price: 45, description: "Cils naturels recourbés et mis en valeur, sans extension." },
    { name: "Remplissage cils", durationMin: 60, price: 40, description: "Un regard toujours impeccable entre deux poses complètes." },
  ],
  epilation: [
    { name: "Épilation demi-jambes", durationMin: 20, price: 18, description: "Jambes douces pendant plusieurs semaines, rapide et efficace." },
    { name: "Épilation jambes complètes", durationMin: 40, price: 30, description: "Peau lisse de la cuisse à la cheville, prête pour la jupe ou le short." },
    { name: "Épilation maillot", durationMin: 20, price: 20, description: "Précision et discrétion garanties, dans le respect de votre confort." },
    { name: "Épilation aisselles", durationMin: 10, price: 12, description: "Un geste rapide pour une peau nette au quotidien." },
  ],
  "soins-visage": [
    { name: "Soin hydratant", durationMin: 45, price: 40, description: "Peau repulpée et confortable, effet bonne mine immédiat." },
    { name: "Soin anti-âge", durationMin: 60, price: 55, description: "Traits reposés et peau plus ferme, un vrai coup d'éclat." },
    { name: "Soin purifiant peau grasse", durationMin: 45, price: 40, description: "Teint matifié et pores resserrés, peau assainie en profondeur." },
  ],
  "soins-corps": [
    { name: "Drainage lymphatique", durationMin: 45, price: 50, description: "Jambes légères et silhouette affinée, sensation de bien-être immédiate." },
    { name: "Soin minceur", durationMin: 60, price: 55, description: "Un vrai coup de pouce pour affiner et raffermir la silhouette." },
  ],
  "beaute-afro": [
    { name: "Tissage fermé", durationMin: 150, price: 80, description: "Look impeccable et naturel, protection optimale des cheveux naturels." },
    { name: "Tissage ouvert", durationMin: 180, price: 100, description: "Style personnalisable avec raie visible, effet ultra naturel." },
    { name: "Tissage invisible", durationMin: 210, price: 130, description: "Le rendu le plus naturel qui soit, indétectable et raffiné." },
    { name: "Pose perruque", durationMin: 60, price: 40, description: "Changement de style instantané, pose nette et confortable." },
    { name: "Perruque Lace Front", durationMin: 90, price: 70, description: "Racine invisible pour un effet naissance naturelle bluffant." },
    { name: "Perruque Full Lace", durationMin: 120, price: 90, description: "Liberté totale de coiffage, effet cuir chevelu indétectable." },
    { name: "Closure Wig", durationMin: 90, price: 65, description: "Finition soignée sur toute la raie, look net et polyvalent." },
    { name: "Frontal Wig", durationMin: 120, price: 85, description: "Ligne frontale entièrement naturelle, idéale pour les coiffures relevées." },
    { name: "Soin cheveux afro", durationMin: 60, price: 35, description: "Cheveux nourris et hydratés en profondeur, boucles revitalisées." },
    { name: "Réparation capillaire", durationMin: 60, price: 40, description: "Cheveux fragilisés réparés et renforcés, retour de la brillance." },
    { name: "Nattes simples", durationMin: 120, price: 50, description: "Style pratique et élégant, tenue longue durée sans effort quotidien." },
    { name: "Nattes avec perles", durationMin: 150, price: 65, description: "Un look unique et personnalisé, parfait pour se démarquer." },
    { name: "Vanilles enfants", durationMin: 90, price: 35, description: "Coiffure douce et adaptée, spécialement pensée pour les petites têtes." },
    { name: "Ponytail tissage", durationMin: 60, price: 45, description: "Queue de cheval glamour et volumineuse, prête en une heure." },
  ],
  maquilleur: [
    { name: "Maquillage jour", durationMin: 45, price: 40, description: "Teint frais et naturel, parfait pour une occasion en journée." },
    { name: "Maquillage soirée", durationMin: 60, price: 55, description: "Regard intense et tenue longue durée, prêt à briller toute la soirée." },
    { name: "Maquillage mariée", durationMin: 90, price: 90, description: "Maquillage sur-mesure et longue tenue pour être sublime toute la journée." },
  ],
  "maquillage-permanent": [
    { name: "Sourcils poudrés", durationMin: 120, price: 150, description: "Sourcils parfaitement dessinés au réveil, effet naturel garanti pendant 1 à 2 ans." },
    { name: "Eyeliner permanent", durationMin: 90, price: 120, description: "Regard intensifié chaque jour, sans avoir à retracer sa ligne." },
    { name: "Contour des lèvres", durationMin: 90, price: 130, description: "Lèvres redessinées et repulpées visuellement, effet naturel au quotidien." },
  ],
};
