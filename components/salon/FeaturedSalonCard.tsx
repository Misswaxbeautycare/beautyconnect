import Link from "next/link";
import { Star } from "lucide-react";
import { FavoriteButton } from "@/components/salon/FavoriteButton";

export interface SalonCardData {
  id: string;
  name: string;
  city: string;
  coverUrl: string | null;
  categorieLabel: string;
  note: number | null;
  nombreAvis: number;
  isFavorited?: boolean;
}

// Carte "à la une" utilisée dans les rangées de recommandations,
// sur la page d'accueil et la page recherche.
export function FeaturedSalonCard({ salon }: { salon: SalonCardData }) {
  return (
    <Link
      href={`/salon/${salon.id}`}
      className="group block w-64 shrink-0 snap-start"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-beige-dark bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
        style={salon.coverUrl ? { backgroundImage: `url(${salon.coverUrl})` } : undefined}
      >
        {!salon.coverUrl && (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-or to-noir">
            <span className="font-display text-2xl text-white/30">
              {salon.name.charAt(0)}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-noir shadow-sm">
          À la une
        </span>
        <FavoriteButton
          salonId={salon.id}
          initialFavorited={salon.isFavorited}
          className="absolute right-3 top-3"
        />
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-noir">{salon.name}</p>
          <p className="truncate text-sm text-noir/50">{salon.city}</p>
          {salon.categorieLabel && (
            <p className="truncate text-xs text-noir/40">
              {salon.categorieLabel}
              {salon.nombreAvis > 0 && ` · ${salon.nombreAvis} avis`}
            </p>
          )}
        </div>
        {salon.note != null && (
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-or-dark">
            <Star size={13} fill="currentColor" />
            {salon.note.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}
