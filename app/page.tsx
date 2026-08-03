import Link from "next/link";
import { CalendarCheck, ShieldCheck, MessageSquareText, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { categories } from "@/lib/categories";
import { FeaturedSalonCard, type SalonCardData } from "@/components/salon/FeaturedSalonCard";

async function getRecommandes(): Promise<SalonCardData[]> {
  try {
    const salonsRaw = await prisma.salon.findMany({
      where: { isActive: true, isApproved: true },
      include: {
        categories: { include: { category: true } },
        reviews: { select: { rating: true } },
      },
      take: 20,
    });

    return salonsRaw
      .map((salon) => {
        const noteMoyenne =
          salon.reviews.length > 0
            ? salon.reviews.reduce((sum, r) => sum + r.rating, 0) / salon.reviews.length
            : null;
        return {
          id: salon.id,
          name: salon.name,
          city: salon.city,
          coverUrl: salon.coverUrl,
          categorieLabel: salon.categories[0]?.category.name ?? "",
          note: noteMoyenne,
          nombreAvis: salon.reviews.length,
        };
      })
      .sort((a, b) => (b.note ?? 0) - (a.note ?? 0))
      .slice(0, 6);
  } catch (err) {
    // Dégradation silencieuse : la page d'accueil reste utilisable même si
    // la base est momentanément indisponible, on masque juste cette section.
    console.error("[/] Erreur lors du chargement des salons recommandés:", err);
    return [];
  }
}

export default async function HomePage() {
  const recommandes = await getRecommandes();

  return (
    <>
      <section className="bg-beige px-6 py-16 text-center">
        <p className="mb-4 text-xs font-semibold tracking-widest text-or-dark">
          BEAUTÉ · BIEN-ÊTRE · STYLE
        </p>
        <h1 className="mb-4 font-display text-3xl leading-tight text-noir md:text-4xl">
          Réservez. Connectez.
          <br />
          <span className="text-or-dark">Rayonnez.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-md text-noir/60">
          Coiffure, esthétique, onglerie, spa, massage... Trouvez et réservez
          votre professionnel beauté préféré, où que vous soyez.
        </p>

        <form
          action="/recherche"
          className="mx-auto mb-8 flex max-w-lg items-center gap-3 rounded-full border border-beige-dark bg-white py-1.5 pl-5 pr-1.5 shadow-sm"
        >
          <Search size={18} className="shrink-0 text-noir/40" />
          <input
            type="text"
            name="q"
            placeholder="Recherchez tous les soins"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-noir/40"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-noir px-6 py-3 text-sm font-semibold text-white transition hover:bg-or hover:text-noir"
          >
            Rechercher
          </button>
        </form>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/recherche"
            className="rounded-full bg-noir px-8 py-3.5 font-semibold text-white transition hover:bg-or hover:text-noir"
          >
            Trouver un professionnel
          </Link>
          <Link
            href="/pro/inscription"
            className="rounded-full border border-noir/20 px-8 py-3.5 font-semibold text-noir transition hover:bg-white"
          >
            Je suis un professionnel
          </Link>
        </div>
      </section>

      {/* Catégories — rangée compacte plutôt qu'une grille dense */}
      <section className="px-6 py-12">
        <h2 className="mb-6 text-center font-display text-xl text-noir">
          Un professionnel pour chaque besoin
        </h2>
        <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/recherche?categorie=${cat.slug}`}
              className="flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-beige px-5 py-4 text-center transition hover:bg-beige-dark"
            >
              <cat.icon size={20} />
              <span className="whitespace-nowrap text-xs text-noir/80">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommandés — données réelles */}
      {recommandes.length > 0 && (
        <section className="px-6 py-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-xl text-noir">Recommandés</h2>
            <Link href="/recherche" className="text-xs font-medium text-or-dark">
              Tout voir
            </Link>
          </div>
          <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recommandes.map((salon) => (
              <FeaturedSalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </section>
      )}

      {/* Pourquoi BeautyConnect — bandeau compact, une seule rangée */}
      <section className="bg-beige px-6 py-12">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          <FeatureItem
            icon={<CalendarCheck size={20} />}
            title="Réservation instantanée"
            description="Un créneau, confirmé en 2 minutes."
          />
          <FeatureItem
            icon={<ShieldCheck size={20} />}
            title="Paiement sécurisé"
            description="Acompte ou paiement complet via Stripe."
          />
          <FeatureItem
            icon={<MessageSquareText size={20} />}
            title="Avis vérifiés"
            description="Uniquement après un rendez-vous réel."
          />
        </div>
      </section>

      {/* CTA Pro */}
      <section className="mx-6 my-12 rounded-3xl bg-noir px-6 py-16 text-center">
        <h2 className="mb-3 font-display text-2xl text-white">
          Vous êtes un professionnel de la beauté ?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-white/60">
          Développez votre activité, gérez votre agenda et vos paiements sur
          Misswaxbeautycare.
        </p>
        <Link
          href="/pro/inscription"
          className="inline-block rounded-full bg-or px-10 py-3.5 font-semibold text-noir transition hover:bg-or-light"
        >
          Créer mon salon
        </Link>
      </section>
    </>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
        <span className="text-or-dark">{icon}</span>
        <h3 className="font-display text-base text-noir">{title}</h3>
      </div>
      <p className="text-sm text-noir/50">{description}</p>
    </div>
  );
}
