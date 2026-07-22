import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CategoryGrid } from "@/components/CategoryGrid";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-noir">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,75,0.15),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center md:py-32">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-or animate-fade-in">
            Beauté · Bien-être · Style
          </p>
          <h1 className="font-display text-4xl leading-tight text-white md:text-6xl animate-slide-up">
            Réservez. Connectez.
            <br />
            <span className="text-or">Rayonnez.</span>
          </h1>
          <p className="mt-6 max-w-xl text-beige/70 animate-slide-up" style={{ animationDelay: "150ms" }}>
            Coiffure, esthétique, onglerie, spa, massage... Trouvez et réservez
            votre professionnel beauté préféré, où que vous soyez.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Link href="/recherche">
              <Button size="lg" variant="secondary">Trouver un professionnel</Button>
            </Link>
            <Link href="/register?type=pro">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-noir">
                Je suis un professionnel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl text-noir">Toutes les catégories beauté</h2>
          <p className="mt-2 text-noir/60">Un professionnel pour chaque besoin</p>
        </div>
        <CategoryGrid />
      </section>

      {/* Pourquoi nous */}
      <section className="bg-beige py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-3">
          {[
            { title: "Réservation instantanée", desc: "Choisissez un créneau disponible et confirmez en 2 minutes." },
            { title: "Paiement sécurisé", desc: "Acompte ou paiement complet via Stripe, en toute confiance." },
            { title: "Avis vérifiés", desc: "Des avis authentiques laissés uniquement après un rendez-vous réel." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="font-display text-xl text-noir">{f.title}</h3>
              <p className="mt-3 text-sm text-noir/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Pro */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl text-noir">Vous êtes un professionnel de la beauté ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-noir/60">
          Développez votre activité, gérez votre agenda et vos paiements sur
          Misswaxbeautycare.
        </p>
        <Link href="/register?type=pro">
          <Button size="lg" className="mt-8">Créer mon salon</Button>
        </Link>
      </section>
    </div>
  );
}
