"use client";

import { useState } from "react";

/* ============================================================
   TYPES
   ============================================================ */

type PrestationMode = "salon" | "domicile" | "deplacement";
type Tab = "profil" | "prestations" | "portfolio" | "avis" | "etablissements";

interface Service {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: string;
  availableModes: PrestationMode[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

interface Review {
  id: string;
  author: string;
  verified: boolean;
  date: string;
  text: string;
}

interface SalonProfileData {
  name: string;
  category: string;
  city: string;
  rating: number;
  reviewCount: number;
  clientsServed: number;
  logoUrl?: string;
  salonAddress: string;
  domicileZone: string;
  deplacementZone: string;
  hours: string;
  about: string;
  interests: string[];
  languages: string[];
  services: Service[];
  team: TeamMember[];
  reviews: Review[];
}

/* ============================================================
   DONNÉES D'EXEMPLE
   ============================================================ */

const exampleData: SalonProfileData = {
  name: "Salon Élégance Noire",
  category: "Esthéticienne",
  city: "Ixelles, Bruxelles",
  rating: 4.9,
  reviewCount: 128,
  clientsServed: 526,
  salonAddress: "Rue de la Beauté 12, 1050 Ixelles",
  domicileZone: "Zone Ixelles — adresse donnée après réservation",
  deplacementZone: "Bruxelles et 15km alentour",
  hours: "Mar–Sam · 9h–18h30",
  about:
    "Depuis 2019, Salon Élégance Noire accompagne ses clientes avec des soins d'onglerie et d'esthétique haut de gamme — en salon, à domicile ou directement chez vous.",
  interests: ["Beauté afro", "Onglerie", "Bien-être"],
  languages: ["Français", "Anglais", "Néerlandais"],
  services: [
    { id: "s1", name: "Manucure semi-permanent", category: "Onglerie", duration: "45 min", price: "35 €", availableModes: ["salon", "domicile"] },
    { id: "s2", name: "Pose gel complète", category: "Onglerie", duration: "1h15", price: "dès 55 €", availableModes: ["salon"] },
    { id: "s3", name: "Nettoyage de peau profond", category: "Soins du visage", duration: "50 min", price: "60 €", availableModes: ["salon", "domicile"] },
    { id: "s4", name: "Tissage", category: "Beauté afro & Extensions", duration: "2h", price: "dès 70 €", availableModes: ["salon", "domicile"] },
    { id: "s5", name: "Pose perruque", category: "Beauté afro & Extensions", duration: "1h", price: "dès 45 €", availableModes: ["salon"] },
    { id: "s6", name: "Soin cheveux afro", category: "Beauté afro & Extensions", duration: "1h", price: "40 €", availableModes: ["salon", "domicile"] },
    { id: "s7", name: "Réparation capillaire", category: "Beauté afro & Extensions", duration: "50 min", price: "45 €", availableModes: ["salon"] },
    { id: "s8", name: "Nattes simples", category: "Beauté afro & Extensions", duration: "2h30", price: "dès 60 €", availableModes: ["salon", "domicile"] },
    { id: "s9", name: "Nattes avec perles", category: "Beauté afro & Extensions", duration: "3h", price: "dès 75 €", availableModes: ["salon"] },
    { id: "s10", name: "Vanilles enfants", category: "Beauté afro & Extensions", duration: "1h30", price: "dès 35 €", availableModes: ["salon"] },
    { id: "s11", name: "Tissage fermé", category: "Beauté afro & Extensions", duration: "2h", price: "dès 70 €", availableModes: ["salon"] },
    { id: "s12", name: "Tissage ouvert", category: "Beauté afro & Extensions", duration: "2h15", price: "dès 75 €", availableModes: ["salon"] },
    { id: "s13", name: "Tissage invisible", category: "Beauté afro & Extensions", duration: "2h30", price: "dès 85 €", availableModes: ["salon"] },
    { id: "s14", name: "Perruque Lace Front", category: "Beauté afro & Extensions", duration: "1h", price: "dès 50 €", availableModes: ["salon"] },
    { id: "s15", name: "Perruque Full Lace", category: "Beauté afro & Extensions", duration: "1h15", price: "dès 65 €", availableModes: ["salon"] },
    { id: "s16", name: "Closure Wig", category: "Beauté afro & Extensions", duration: "1h30", price: "dès 55 €", availableModes: ["salon"] },
    { id: "s17", name: "Frontal Wig", category: "Beauté afro & Extensions", duration: "1h45", price: "dès 70 €", availableModes: ["salon"] },
    { id: "s18", name: "Ponytail Tissage", category: "Beauté afro & Extensions", duration: "45 min", price: "dès 30 €", availableModes: ["salon"] },
  ],
  team: [
    { id: "t1", name: "Sarah", role: "Onglerie", initials: "S" },
    { id: "t2", name: "Myriam", role: "Esthétique", initials: "M" },
    { id: "t3", name: "Léa", role: "Soins visage", initials: "L" },
  ],
  reviews: [
    { id: "r1", author: "Nadia B.", verified: true, date: "Il y a 3 jours", text: "Accueil impeccable et résultat au top, je repars toujours avec le sourire." },
    { id: "r2", author: "Fatou K.", verified: false, date: "Cliente depuis 2023", text: "Toujours un travail soigné et minutieux, je recommande vivement." },
  ],
};

const TABS: { key: Tab; label: string }[] = [
  { key: "profil", label: "Profil" },
  { key: "prestations", label: "Prestations" },
  { key: "portfolio", label: "Portfolio" },
  { key: "avis", label: "Avis" },
  { key: "etablissements", label: "Établissements" },
];

/* ============================================================
   COMPOSANT
   ============================================================ */

export default function SalonProfilePage({ data = exampleData }: { data?: SalonProfileData }) {
  const [tab, setTab] = useState<Tab>("profil");
  const [mode, setMode] = useState<PrestationMode>("salon");

  const categories = Array.from(new Set(data.services.map((s) => s.category)));

  const modeInfo: Record<PrestationMode, { icon: string; title: string; sub: string }> = {
    salon: { icon: "🏠", title: "Salon professionnel", sub: data.salonAddress },
    domicile: { icon: "🔑", title: "Salon à domicile", sub: data.domicileZone },
    deplacement: { icon: "🚗", title: "Le pro se déplace", sub: `Chez vous · ${data.deplacementZone}` },
  };

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen font-sans flex flex-col">
      {/* Barre du haut */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="text-xl">←</button>
        <h1 className="font-semibold text-lg text-gray-900">{data.name}</h1>
        <button className="text-xl">⤴</button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full ${
              tab === t.key ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600"
            }`}
          >
            {t.label}
            {t.key === "avis" && <span className="ml-1 text-xs opacity-70">{data.reviewCount}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* ===== PROFIL ===== */}
        {tab === "profil" && (
          <div className="px-5 py-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2a2015] to-[#171310] flex items-center justify-center text-[#d9ac5a] font-serif font-semibold text-xl flex-shrink-0">
                {data.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{data.category} · {data.city}</div>
                <span className="inline-block mt-1 bg-[#f7efe0] text-[#a8792e] text-xs font-semibold px-2.5 py-1 rounded-full">
                  ★ {data.rating.toFixed(1)} <span className="font-normal text-gray-500">({data.reviewCount})</span>
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500">Clients servis</span>
              <span className="text-gray-900 font-medium">{data.clientsServed}</span>
            </div>

            <h2 className="font-serif font-semibold text-base mt-5 mb-2">À propos</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{data.about}</p>

            {data.interests.length > 0 && (
              <>
                <h2 className="font-serif font-semibold text-base mt-6 mb-3">Centres d'intérêt</h2>
                <div className="flex flex-wrap gap-2">
                  {data.interests.map((it) => (
                    <span key={it} className="bg-[#f7efe0] text-gray-700 text-sm px-3.5 py-1.5 rounded-full">
                      {it}
                    </span>
                  ))}
                </div>
              </>
            )}

            {data.languages.length > 0 && (
              <>
                <h2 className="font-serif font-semibold text-base mt-6 mb-3">Langues</h2>
                <div className="flex flex-wrap gap-2">
                  {data.languages.map((l) => (
                    <span key={l} className="bg-[#f7efe0] text-gray-700 text-sm px-3.5 py-1.5 rounded-full">
                      {l}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== PRESTATIONS ===== */}
        {tab === "prestations" && (
          <div className="px-5 py-5">
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 mb-2">Où se déroule la prestation</div>
              <div className="flex gap-2">
                {(Object.keys(modeInfo) as PrestationMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${
                      mode === m ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600"
                    }`}
                  >
                    {modeInfo[m].icon} {modeInfo[m].title}
                  </button>
                ))}
              </div>
            </div>

            {categories.map((cat) => {
              const visible = data.services.filter((s) => s.category === cat && s.availableModes.includes(mode));
              if (visible.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#a8792e] mt-5 mb-2.5 first:mt-0">
                    {cat}
                  </div>
                  {visible.map((s) => (
                    <div key={s.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 mb-2.5">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="text-base text-gray-900 mb-1">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.duration}</div>
                        </div>
                        <span className="text-xs font-semibold text-white bg-gray-900 px-3.5 py-1.5 rounded-full flex-shrink-0">
                          Réserver
                        </span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-2">{s.price}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== PORTFOLIO ===== */}
        {tab === "portfolio" && (
          <div className="px-5 py-5">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-gradient-to-br from-[#e9dcc0] to-[#f7f0e4]"
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== AVIS ===== */}
        {tab === "avis" && (
          <div className="px-5 py-5">
            <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 mb-4">
              <div className="font-serif font-bold text-4xl text-gray-900">{data.rating.toFixed(1)}</div>
              <div>
                <div className="text-[#c8a24a] text-sm">{"★".repeat(5)}</div>
                <div className="text-xs text-gray-500 mt-0.5">{data.reviewCount} avis</div>
              </div>
            </div>
            {data.reviews.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 mb-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    {r.author}
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        r.verified ? "bg-[#fdf3de] text-[#a8792e]" : "bg-[#f7efe0] text-gray-500"
                      }`}
                    >
                      {r.verified ? "Vérifié" : "Importé"}
                    </span>
                  </span>
                  <span className="text-[10.5px] text-gray-500">{r.date}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* ===== ÉTABLISSEMENTS / ÉQUIPE ===== */}
        {tab === "etablissements" && (
          <div className="px-5 py-5">
            <h2 className="font-serif font-semibold text-base mb-3">Équipe</h2>
            <div className="flex gap-3 overflow-x-auto mb-6">
              {data.team.map((m) => (
                <div key={m.id} className="flex-shrink-0 w-28 bg-white border border-gray-100 rounded-2xl p-3.5 text-center">
                  <div className="w-14 h-14 rounded-full mx-auto mb-2.5 bg-gradient-to-br from-[#2a2015] to-[#453421] flex items-center justify-center text-[#d9ac5a] font-serif font-semibold text-lg">
                    {m.initials}
                  </div>
                  <div className="text-xs font-semibold text-gray-900">{m.name}</div>
                  <div className="text-[10.5px] text-gray-500">{m.role}</div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5">
              <div className="text-xs text-gray-600 py-1.5">
                <strong className="text-gray-900 font-semibold">Salon </strong>{data.salonAddress}
              </div>
              <div className="text-xs text-gray-600 py-1.5">
                <strong className="text-gray-900 font-semibold">Horaires </strong>{data.hours}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA fixe */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
        <button className="w-full bg-gray-900 text-white text-base font-semibold py-4 rounded-full">
          Réserver
        </button>
      </div>
    </div>
  );
}
