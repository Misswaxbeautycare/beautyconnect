"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, Search, Navigation, MapPin } from "lucide-react";

export function LocationPicker({ initialVille }: { initialVille?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialVille ?? "");
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = initialVille || "Toute la Belgique";

  function goToVille(ville: string, coords?: { lat: number; lng: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (ville) {
      params.set("ville", ville);
    } else {
      params.delete("ville");
    }
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      params.set("tri", "proximite");
    } else {
      params.delete("lat");
      params.delete("lng");
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLoadingGeo(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "fr" } }
          );
          const data = await res.json();
          const ville =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            "";
          setLoadingGeo(false);
          if (ville) {
            goToVille(ville, { lat: latitude, lng: longitude });
          } else {
            setError("Impossible de déterminer votre ville. Essayez de la saisir directement.");
          }
        } catch {
          setLoadingGeo(false);
          setError("Impossible de déterminer votre ville. Essayez de la saisir directement.");
        }
      },
      () => {
        setError("Impossible d'accéder à ta position. Vérifie les autorisations.");
        setLoadingGeo(false);
      }
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-noir"
      >
        <MapPin size={18} className="text-or-dark" />
        {label}
        <span className="text-noir/40">▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-4 border-b border-beige-dark px-6 py-5">
            <button onClick={() => setOpen(false)} aria-label="Retour">
              <ArrowLeft size={22} className="text-noir" />
            </button>
            <h2 className="font-display text-xl text-noir">Adresse</h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              goToVille(query.trim());
            }}
            className="px-6 pt-5"
          >
            <div className="flex items-center gap-3 rounded-xl border border-or px-4 py-3.5">
              <Search size={18} className="shrink-0 text-noir/40" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une ville"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-noir/40"
              />
            </div>
          </form>

          <button
            onClick={handleUseCurrentLocation}
            className="mt-2 flex items-center gap-4 px-6 py-4 text-left hover:bg-beige"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-beige">
              <Navigation size={16} className="text-or-dark" />
            </span>
            <span className="text-base text-noir">
              {loadingGeo ? "Localisation en cours..." : "Utiliser ma position actuelle"}
            </span>
          </button>

          {initialVille && (
            <button
              onClick={() => goToVille("")}
              className="mx-6 mt-2 text-left text-sm text-noir/50 underline"
            >
              Réinitialiser (toute la Belgique)
            </button>
          )}

          {error && <p className="mt-2 px-6 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </>
  );
}
