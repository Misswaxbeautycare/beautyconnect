import Link from "next/link";
import { Star, CalendarCheck, ShieldCheck, MessageSquareText } from "lucide-react";

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

      <section className="px-6 py-16 text-center bg-gradient-to-b from-neutral-950 to-neutral-800 text-white">
        <p className="tracking-widest text-amber-400 text-xs font-semibold mb-4">
          BEAUTÉ · BIEN-ÊTRE · STYLE
        </p>
        <h1 className="text-3xl md:text-4xl font-serif mb-4 leading-tight">
          Réservez. Connectez.
          <br />
          <span className="text-amber-300">Rayonnez.</span>
        </h1>
        <p className="text-neutral-300 mb-8 max-w-md mx-auto">
          Coiffure, esthétique, onglerie, spa, massage... Trouvez et réservez
          votre professionnel beauté préféré, où que vous soyez.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/recherche"
            className="rounded-full bg-amber-400 text-neutral-900 px-8 py-3.5 font-semibold hover:bg-amber-300 transition"
          >
            Trouver un professionnel
          </Link>
          <Link
            href="/pro/inscription"
            className="rounded-full border border-white/40 text-white px-8 py-3.5 font-semibold hover:bg-white/10 transition"
          >
            Je suis un professionnel
          </Link>
        </div>
      </section>

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

      <footer className="bg-neutral-950 text-neutral-300">
        <div className="px-6 py-16 text-center border-b border-white/10">
          <h2 className="text-2xl font-serif mb-3 text-white">
            Vous êtes un professionnel de la beauté ?
          </h2>
          <p className="text-neutral-300 mb-8 max-w-md mx-auto">
            Développez votre activité, gérez votre agenda et vos paiements sur
            Misswaxbeautycare.
          </p>
          <Link
            href="/pro/inscription"
            className="inline-block rounded-full bg-amber-400 text-neutral-900 px-10 py-3.5 font-semibold hover:bg-amber-300 transition"
          >
            Créer mon salon
          </Link>
        </div>

        <div className="px-6 py-10">
          <h3 className="text-white text-xl font-serif mb-1">Beauty Connect</h3>
          <p className="text-neutral-500 text-sm mb-1">Powered by Misswaxbeautycare</p>
          <p className="mb-6">Réservez. Connectez. Rayonnez.</p>

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
        </div>
      </footer>
    </main>
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
