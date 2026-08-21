"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  salonId,
  initialFavorited = false,
  className,
}: {
  salonId: string;
  initialFavorited?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    // Optimiste : le cœur réagit immédiatement, avant même la réponse du
    // serveur — on annule seulement si la requête échoue vraiment.
    const previous = favorited;
    setFavorited(!previous);

    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId }),
    });

    if (res.status === 401) {
      setFavorited(previous);
      setLoading(false);
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!res.ok) {
      setFavorited(previous);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setFavorited(Boolean(data.favorited));
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition",
        favorited ? "text-red-500" : "text-noir/70 hover:text-or-dark",
        className
      )}
    >
      <Heart size={15} fill={favorited ? "currentColor" : "none"} />
    </button>
  );
}
