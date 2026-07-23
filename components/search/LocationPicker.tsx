"use client";

import { useState } from "react";
import { ArrowLeft, Search, Navigation, MapPin } from "lucide-react";

export function LocationPicker() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("Position actuelle");
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            "Position actuelle";
          setLabel(ville);
        } catch {
          setLabel("Position actuelle");
        } finally {
          setLoadingGeo(false);
          setOpen(false);
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
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-800"
      >
        <MapPin size={18} className="text-violet-600" />
        {label}
        <span className="text-neutral-400">▾</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-100">
            <button onClick={() => setOpen(false)} aria-label="Retour">
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-xl font-bold">Adresse</h2>
          </div>

          <div className="px-6 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-violet-500 px-4 py-3.5">
              <Search size={18} className="text-neutral-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un établissement"
                className="flex-1 outline-none text-sm bg-transparent placeholder:text-neutral-400"
              />
            </div>
          </div>

          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-4 px-6 py-4 mt-2 text-left hover:bg-neutral-50"
          >
            <span className="h-9 w-9 flex items-center justify-center rounded-full bg-violet-100">
              <Navigation size={16} className="text-violet-600" />
            </span>
            <span className="text-base">
              {loadingGeo ? "Localisation en cours..." : "Position actuelle"}
            </span>
          </button>

          {error && (
            <p className="px-6 text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>
      )}
    </>
  );
}
