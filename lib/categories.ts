import {
  Scissors,
  Sparkles,
  Hand,
  Eye,
  Palette,
  Waves,
  Flower2,
  Gem,
  Droplet,
  Wind,
  Zap,
  Star,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDef {
  slug: string;
  label: string;
  icon: LucideIcon;
}

// Source unique des catégories : les slugs correspondent exactement à ceux
// insérés par supabase/seed-categories.sql. Utilisé à la fois par la page
// d'accueil et la page recherche pour garantir des liens de filtrage qui
// fonctionnent réellement, et une présentation visuelle cohérente entre les deux.
export const categories: CategoryDef[] = [
  { slug: "coiffeur", label: "Coiffeur", icon: Scissors },
  { slug: "estheticienne", label: "Esthéticienne", icon: Sparkles },
  { slug: "barbier", label: "Barbier", icon: Wind },
  { slug: "maquilleur", label: "Maquilleur", icon: Palette },
  { slug: "onglerie", label: "Onglerie", icon: Hand },
  { slug: "massage", label: "Massage", icon: Droplet },
  { slug: "spa", label: "Spa", icon: Waves },
  { slug: "extension-de-cils", label: "Extension de cils", icon: Eye },
  { slug: "epilation", label: "Épilation", icon: Zap },
  { slug: "soins-visage", label: "Soins visage", icon: Gem },
  { slug: "soins-corps", label: "Soins corps", icon: Flower2 },
  { slug: "beaute-afro", label: "Beauté afro", icon: Star },
  { slug: "maquillage-permanent", label: "Maquillage permanent", icon: Sparkles },
];
