import Link from "next/link";
import { Star } from "lucide-react";

const categories = [
  { name: "Coiffeur", icon: "💇" },
  { name: "Esthéticienne", icon: "✨" },
  { name: "Barbier", icon: "🪒" },
  { name: "Maquilleur", icon: "💄" },
  { name: "Onglerie", icon: "💅" },
  { name: "Massage", icon: "💆" },
  { name: "Spa", icon: "🧖" },
  { name: "Extension de cils", icon: "👁️" },
  { name: "Épilation", icon: "✨" },
  { name: "Soins visage", icon: "🧴" },
  { name: "Soins corps", icon: "🛁" },
  { name: "Beauté afro", icon: "🌀" },
  { name: "Maquillage permanent", icon: "💉" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <header className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
        <span className="text-2xl font-serif">
          Beauty<span className="text-amber-500">Connect</span>
        </span>
        <Link
          href="/recherche"
          className="rounded-full bg-black text-white px-6 py-2.5 font-medium hover:bg-neutral-800 transition"
        >
          Réserver
        </Link>
      </header>

      <section className="px-6 py-14 text-center">
        <h1 className="text-3xl font-serif mb-3">Trouvez. Réservez. Rayonnez.</h1>
        <p className="text-neutral-500 mb-8">
          Les meilleurs professionnels beauté, près de chez vous.
        </p>
        <Link
          href="/recherche"
          className="inline-block rounded-full bg-black text-white px-10 py-4 font-semibold hover:bg-neutral-800 transition"
        >
          Rechercher un professionnel
        </Link>
      </section>

      <section className="px-6 pb-10">
        <h2 className="text-xl font-serif mb-5">Catégories</h2>
        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/recherche?categorie=${encodeURIComponent(cat.name)}`}
              className="flex flex-col items-center gap-2 rounded-2xl bg-[#F5EFE6] py-6 hover:bg-[#EFE4D3] transition"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm text-center px-1">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pb-14">
        <h2 className="text-xl font-serif mb-5">Recommandés</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <RecommandedCardPlaceholder
            name="Salon Élégance Noire"
            ville="Ixelles, Bruxelles"
            type="Esthéticienne · 128 avis"
            note="4.9"
          />
          <RecommandedCardPlaceholder
            name="Juju Beauty"
            ville="Geraardsbergen"
            type="Salon de beauté"
            note="4.9"
          />
        </div>
      </section>

      <footer className="bg-black text-neutral-300 px-6 py-10">
        <h3 className="text-white text-xl font-serif mb-1">Beauty Connect</h3>
        <p className="text-neutral-500 text-sm mb-1">Powered by Misswaxbeautycare</p>
        <p className="mb-6">Trouvez. Réservez. Rayonnez.</p>

        <div className="grid grid-cols-1 gap-6 text-sm">
          <div>
            <p className="text-amber-500 font-semibold mb-2">Clientes</p>
            <p className="mb-1">Trouver un professionnel</p>
            <p>Créer un compte</p>
          </div>
          <div>
            <p className="text-amber-500 font-semibold mb-2">Professionnels</p>
            <p className="mb-1">Gérer mon salon</p>
            <p>Rejoindre la plateforme</p>
          </div>
          <div>
            <p className="text-amber-500 font-semibold mb-2">Misswaxbeautycare</p>
            <p className="mb-1">À propos</p>
            <p>Contact</p>
          </div>
        </div>

        <p className="text-neutral-600 text-xs mt-10">
          © 2026 Beauty Connect — Tous droits réservés
        </p>
      </footer>
    </main>
  );
}

function RecommandedCardPlaceholder({
  name,
  ville,
  type,
  note,
}: {
  name: string;
  ville: string;
  type: string;
  note: string;
}) {
  return (
    <div className="min-w-[220px] rounded-2xl overflow-hidden border border-neutral-200">
      <div className="h-32 bg-neutral-800" />
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{name}</span>
          <span className="flex items-center gap-1 text-amber-500 text-sm">
            <Star size={14} fill="currentColor" /> {note}
          </span>
        </div>
        <p className="text-sm text-neutral-500">{ville}</p>
        <p className="text-xs text-neutral-400">{type}</p>
      </div>
    </div>
  );
}
