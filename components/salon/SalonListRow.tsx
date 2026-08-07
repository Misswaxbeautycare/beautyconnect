import Link from "next/link";
import { Star } from "lucide-react";
import type { SalonCardData } from "./FeaturedSalonCard";

// Rangée compacte utilisée pour les listes "Établissements à proximité".
export function SalonListRow({ salon }: { salon: SalonCardData }) {
  return (
    <Link
      href={`/salon/${salon.id}`}
      className="flex items-center gap-4 rounded-2xl border border-beige-dark bg-white p-3 transition hover:border-or hover:shadow-md"
    >
      <div
        className="h-20 w-20 shrink-0 rounded-xl bg-beige-dark bg-cover bg-center"
        style={salon.coverUrl ? { backgroundImage: `url(${salon.coverUrl})` } : undefined}
      >
        {!salon.coverUrl && (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-or to-noir">
            <span className="font-display text-lg text-white/30">
              {salon.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-noir">{salon.name}</span>
          {salon.note != null && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-or-dark">
              <Star size={13} fill="currentColor" />
              {salon.note.toFixed(1)}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-noir/50">{salon.city}</p>
        <p className="truncate text-xs text-noir/40">
          {salon.categorieLabel}
          {salon.nombreAvis > 0 && ` · ${salon.nombreAvis} avis`}
        </p>
      </div>
    </Link>
  );
}
