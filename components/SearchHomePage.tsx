"use client";

import { useState } from "react";

/* ============================================================
   TYPES
   ============================================================ */

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface SalonCard {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
}

/* ============================================================
   DONNÉES D'EXEMPLE
   ============================================================ */

const categories: Category[] = [
  { id: "coiffeur", label: "Coiffeur", icon: "💇" },
  { id: "esthetique", label: "Esthétique", icon: "✨" },
  { id: "barbier", label: "Barbier", icon: "🪒" },
  { id: "onglerie", label: "Onglerie", icon: "💅" },
  { id: "massage", label: "Massages", icon: "💆" },
  { id: "spa", label: "Spa et sauna", icon: "🧖" },
  { id: "cils", label: "Sourcils et cils", icon: "👁️" },
  { id: "epilation", label: "Épilations", icon: "🪞" },
  { id: "afro", label: "Beauté afro", icon: "🌀" },
  { id: "maquillage", label: "Maquillage", icon: "💄" },
  { id: "permanent", label: "Maquillage permanent", icon: "🖊️" },
  { id: "corps", label: "Soins corps", icon: "🧴" },
];

const recommended: SalonCard[] = [
  { id: "1", name: "Salon Élégance Noire", category: "Esthéticienne", city: "Ixelles, Bruxelles", rating: 4.9, reviewCount: 128, featured: true },
  { id: "2", name: "Juju Beauty", category: "Salon de beauté", city: "Geraardsbergen", rating: 5.0, reviewCount: 264 },
  { id: "3", name: "14Cutz", category: "Barbier", city: "Grammont", rating: 4.8, reviewCount: 76 },
  { id: "4", name: "Diamond Nails", category: "Onglerie", city: "Brakel", rating: 4.9, reviewCount: 15 },
];

/* ============================================================
   COMPOSANT
   ============================================================ */

export default function SearchHomePage() {
  const [query, setQuery] = useState("");

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen font-sans">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="font-serif font-semibold text-lg text-gray-900">
          Beauty<span className="text-[#a8792e]">Connect</span>
        </div>
        <button className="bg-[#c8a24a] text-white text-xs font-semibold px-4 py-2 rounded-full">
          Réserver
        </button>
      </div>

      <div className="pb-3">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <span className="text-[#a8792e]">📍</span>
            Position actuelle
            <span className="text-xs">▾</span>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2">
          <h1 className="font-serif font-semibold text-xl text-gray-900 mb-1.5">
            Trouvez votre expert beauté
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Coiffure, esthétique, onglerie, spa, massage... Réservez votre professionnel beauté préféré, où que vous soyez.
          </p>
        </div>

        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-[#f7efe0] rounded-full pl-4 pr-1.5 py-1.5">
            <span className="text-gray-400">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recherchez tous les soins"
              className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
            />
            <button className="bg-[#c8a24a] text-white text-sm font-semibold px-5 py-2.5 rounded-full flex-shrink-0">
              Rechercher
            </button>
          </div>
        </div>

        <div className="px-5 pb-1">
          <div className="flex gap-2 overflow-x-auto">
            {["Aujourd'hui", "Prix", "Distance", "Note 4.5+", "À domicile"].map((f) => (
              <button
                key={f}
                className="flex-shrink-0 text-xs font-medium text-gray-700 border border-gray-200 rounded-full px-3.5 py-1.5"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="grid grid-cols-4 gap-3.5">
          {categories.map((cat) => (
            <button key={cat.id} className="flex flex-col items-center gap-2">
              <span className="w-16 h-16 rounded-2xl bg-[#f7efe0] flex items-center justify-center text-2xl">
                {cat.icon}
              </span>
              <span className="text-[11px] text-gray-700 text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-8 pb-2">
        <h2 className="font-serif font-semibold text-lg text-gray-900 mb-4">Recommandés</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {recommended
            .filter((s) => s.featured)
            .map((s) => (
              <div key={s.id} className="flex-shrink-0 w-64">
                <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#2a2015] to-[#453421] mb-2.5 overflow-hidden">
                  <span className="absolute top-2.5 left-2.5 bg-white/90 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    À la une
                  </span>
                  <button className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-sm">
                    ♥
                  </button>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.city}</div>
                    <div className="text-xs text-gray-500">{s.category} · {s.reviewCount} avis</div>
                  </div>
                  <span className="text-xs font-semibold text-[#a8792e] flex items-center gap-1 flex-shrink-0">
                    ★ {s.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="px-5 pt-6 pb-8">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-serif font-semibold text-lg text-gray-900">Établissements à proximité</h2>
          <span className="text-xs font-medium text-[#a8792e]">Tout voir</span>
        </div>
        <div className="flex flex-col gap-3">
          {recommended.map((s) => (
            <div key={s.id} className="flex gap-3 border border-gray-100 rounded-2xl p-2.5">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#e9dcc0] to-[#f7f0e4] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{s.name}</div>
                <div className="text-xs text-gray-500 truncate">{s.city}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-semibold text-[#a8792e]">★ {s.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">{s.reviewCount} avis</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="bg-[#f7efe0] text-[#5a5142] px-6 pt-10 pb-8 mt-4">
        <div className="font-serif font-semibold text-xl text-[#a8792e] mb-1.5">Beauty Connect</div>
        <div className="text-xs text-[#8a7f6c] mb-3">Powered by Misswaxbeautycare</div>
        <div className="text-sm text-[#5a5142] mb-8">Trouvez. Réservez. Rayonnez.</div>

        <div className="mb-7">
          <div className="text-[#a8792e] text-xs font-semibold uppercase tracking-wide mb-3">Clientes</div>
          <div className="flex flex-col gap-2 text-sm text-[#5a5142]">
            <span>Trouver un professionnel</span>
            <span>Créer un compte</span>
          </div>
        </div>

        <div className="mb-7">
          <div className="text-[#a8792e] text-xs font-semibold uppercase tracking-wide mb-3">Professionnels</div>
          <div className="flex flex-col gap-2 text-sm text-[#5a5142]">
            <span>Gérer mon salon</span>
            <span>Rejoindre la plateforme</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-[#a8792e] text-xs font-semibold uppercase tracking-wide mb-3">Misswaxbeautycare</div>
          <div className="flex flex-col gap-2 text-sm text-[#5a5142]">
            <span>À propos</span>
            <span>Contact</span>
          </div>
        </div>

        <div className="text-[11px] text-[#a89e8c] border-t border-[#e3d8bf] pt-5">
          © 2026 Beauty Connect — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
