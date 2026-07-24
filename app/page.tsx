import Link from "next/link";
import { Star, CalendarCheck, ShieldCheck, MessageSquareText, Search } from "lucide-react";

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
    <>
      {/* Hero — fond clair, plus de noir */}
      <section className="px-6 py-16 text-center bg-[#F9F6F0]">
        <p className="tracking-widest text-amber-600 text-xs font-semibold mb-4">
          BEAUTÉ · BIEN-ÊTRE · STYLE
        </p>
        <h1 className="text-3xl md:text-4xl font-serif mb-4 leading-tight text-neutral-900">
          Réservez. Connectez.
          <br />
          <span className="text-amber-600">Rayonnez.</span>
        </h1>
        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
          Coiffure, esthétique, onglerie, spa, massage... Trouvez et réservez
          votre professionnel beauté préféré, où que vous soyez.
        </p>

        {/* Barre de recherche pilule */}
        <form
          action="/recherche"
          className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white pl-5 pr-1.5 py-1.5 shadow-sm max-w-lg mx-auto mb-8"
        >
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            name="q"
            placeholder="Recherchez tous les soins"
            className="flex-1 outline-none text-sm bg-transparent placeholder:text-neutral-400"
          />
          <button
            type="submit"
            className="rounded-full bg-neutral-900 text-white px-6 py-3 text-sm font-semibold shrink-0"
          >
            Rechercher
          </button>
        </form>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/recherche"
            className="rounded-full bg-neutral-900 text-white px-8 py-3.5 font-semibold hover:bg-neutral-800 transition"
          >
            Trouver un professionnel
          </Link>
          <Link
            href="/pro/inscription"
            className="rounded-full border border-neutral-300 text-neutral-800 px-8 py-3.5 font-semibold hover:bg-neutral-100 transition"
          >
            Je suis un professionnel
          </Link>
        </div>
      </section>

      {/* Catégories */}
      <section className="px-6 py-14">
        <h2 className="text-2xl font-serif text-center mb-1">
          Toutes les catégories beauté
        </h2>
        <p className="text-neutral-500 text-center text-sm mb-8">
          Un professionnel pour chaque besoin
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
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

      {/* Pourquoi BeautyConnect */}
      <section className="px-6 py-14 bg-[#F9F6F0]">
        <div className="grid gap-6 max-w-2xl mx-auto">
          <FeatureCard
            icon={<CalendarCheck size={22} />}
            title="Réservation instantanée"
            description="Choisissez un créneau disponible et confirmez en 2 minutes."
          />
          <FeatureCard
            icon={<ShieldCheck size={22} />}
            title="Paiement sécurisé"
            description="Acompte ou paiement complet via Stripe, en toute confiance."
          />
          <FeatureCard
            icon={<MessageSquareText size={22} />}
            title="Avis vérifiés"
            description="Des avis authentiques laissés uniquement après un rendez-vous réel."
          />
        </div>
      </section>

      {/* Recommandés */}
      <section className="px-6 py-14">
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

      {/* CTA Pro — fond clair, séparé du footer par de l'espace */}
      <section className="px-6 py-16 mb-8 text-center bg-[#F5EFE6] mx-6 rounded-3xl">
        <h2 className="text-2xl font-serif mb-3 text-neutral-900">
          Vous êtes un professionnel de la beauté ?
        </h2>
        <p className="text-neutral-600 mb-8 max-w-md mx-auto">
          Développez votre activité, gérez votre agenda et vos paiements sur
          Misswaxbeautycare.
        </p>
        <Link
          href="/pro/inscription"
          className="inline-block rounded-full bg-neutral-900 text-white px-10 py-3.5 font-semibold hover:bg-neutral-800 transition"
        >
          Créer mon salon
        </Link>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-amber-500">{icon}</span>
        <h3 className="font-serif text-lg">{title}</h3>
      </div>
      <p className="text-neutral-500 text-sm">{description}</p>
    </div>
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
