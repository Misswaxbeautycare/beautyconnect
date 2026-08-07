export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  content: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "remplir-agenda-periode-creuse",
    title: "5 façons de remplir votre agenda en période creuse",
    excerpt:
      "Les créneaux du mardi matin ou du mercredi après-midi restent vides ? Quelques ajustements simples suffisent souvent à les remplir.",
    publishedAt: "2026-07-15",
    readingMinutes: 4,
    content: [
      "Chaque salon a ses créneaux difficiles à remplir — souvent en début de semaine ou tôt le matin. Plutôt que de les laisser vides, quelques ajustements simples peuvent faire la différence.",
      "Proposez un tarif réduit sur vos heures creuses. Une remise de 10 à 15% sur un créneau du mardi matin coûte moins cher qu'un rendez-vous qui n'a jamais lieu. Vos clientes flexibles sur leurs horaires en profiteront volontiers.",
      "Activez les rappels automatiques. Une cliente qui reçoit un rappel 24h avant son rendez-vous annule beaucoup moins souvent — et un créneau libéré à la dernière minute est difficile à recaser.",
      "Relancez vos anciennes clientes. Si une cliente n'est pas revenue depuis plusieurs mois, un message simple — \"ça fait un moment, on vous garde un créneau ?\" — fonctionne souvent mieux qu'une promotion générique.",
      "Mettez en avant vos disponibilités immédiates. Sur votre fiche, les créneaux les plus proches sont ceux qui convainquent le plus vite une cliente hésitante.",
      "Groupez les prestations courtes. Une pose de vernis de 20 minutes isolée est difficile à caser entre deux rendez-vous plus longs — proposez-la en complément d'une autre prestation plutôt que seule.",
    ],
  },
  {
    slug: "fideliser-une-cliente-occasionnelle",
    title: "Comment transformer une cliente occasionnelle en cliente fidèle",
    excerpt:
      "La première visite est rarement le plus dur. C'est la deuxième réservation qui fait vraiment la différence sur le long terme.",
    publishedAt: "2026-07-22",
    readingMinutes: 3,
    content: [
      "Une cliente qui vient une fois n'est pas encore une cliente fidèle. Ce qui fait la différence, c'est ce qui se passe entre la première et la deuxième visite.",
      "Proposez le prochain rendez-vous avant qu'elle ne parte. Si une prestation se refait dans 4 à 6 semaines, suggérez-le sur place plutôt que d'attendre qu'elle y pense elle-même.",
      "Gardez une trace de ses préférences. Une teinte, une allergie, une habitude — les noter (même simplement dans votre carnet de contacts) montre que chaque visite est personnalisée, pas générique.",
      "Ne sous-estimez pas un message de suivi. Un court message deux ou trois jours après un soin important (coloration, extension, épilation) pour s'assurer que tout va bien est rarement mal reçu.",
      "Un avis vérifié après chaque rendez-vous rassure les futures clientes — mais il rappelle aussi discrètement à celle qui vient de passer qu'elle est la bienvenue pour revenir.",
    ],
  },
  {
    slug: "photos-salon-qui-donnent-envie-de-reserver",
    title: "Photos de salon : ce qui donne vraiment envie de réserver",
    excerpt:
      "Avant de choisir un professionnel, la plupart des clientes regardent d'abord les photos. Voici ce qui fait la différence.",
    publishedAt: "2026-08-01",
    readingMinutes: 3,
    content: [
      "Sur une fiche salon, les photos sont souvent ce qui décide une cliente hésitante à réserver — avant même les avis ou le prix.",
      "Privilégiez la lumière naturelle. Une photo prise près d'une fenêtre en journée rend presque toujours mieux qu'un flash en soirée, qui écrase les couleurs et les détails.",
      "Montrez le résultat, pas seulement le geste. Une photo de coiffure terminée, nette et bien cadrée, convertit mieux qu'une photo de vous en train de travailler.",
      "Variez les angles et les prestations. Une galerie qui montre plusieurs types de réalisations (et pas seulement votre spécialité préférée) donne une image plus complète de ce que vous proposez.",
      "Une photo de votre espace de travail rassure aussi — propreté, ambiance, matériel. Ce n'est pas seulement le résultat qui compte, mais l'endroit où il a été obtenu.",
      "Enfin, actualisez régulièrement votre galerie. Des photos qui datent de plusieurs années peuvent donner l'impression, à tort, que votre salon n'évolue plus.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
