import Link from "next/link";
import { CalendarCheck, ShieldCheck, MessageSquareText, Search, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { categories } from "@/lib/categories";
import { FeaturedSalonCard, type SalonCardData } from "@/components/salon/FeaturedSalonCard";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { InstallAppButton } from "@/components/InstallAppButton";
import { getCurrentDbUser } from "@/lib/auth";

const heroServices = ["Coiffure", "Esthétique", "Onglerie", "Spa", "Massage"];

async function getRecommandes(): Promise<SalonCardData[]> {
  try {
    const [salonsRaw, dbUser] = await Promise.all([
      prisma.salon.findMany({
        where: { isActive: true },
        include: {
          categories: { include: { category: true } },
          reviews: { select: { rating: true } },
        },
        take: 20,
      }),
      getCurrentDbUser(),
    ]);

    const favoriteIds = dbUser
      ? new Set(
          (
            await prisma.favorite.findMany({
              where: { clientId: dbUser.id },
              select: { salonId: true },
            })
          ).map((f: { salonId: string }) => f.salonId)
        )
      : new Set<string>();

    return salonsRaw
      .map((salon) => {
        const noteMoyenne =
          salon.reviews.length > 0
            ? salon.reviews.reduce((sum, r) => sum + r.rating, 0) / salon.reviews.length
            : null;
        const plan = getEffectivePlan(salon);
        return {
          id: salon.id,
          name: salon.name,
          city: salon.city,
          coverUrl: salon.coverUrl,
          categorieLabel: salon.categories[0]?.category.name ?? "",
          note: noteMoyenne,
          nombreAvis: salon.reviews.length,
          priority: plan.priorityPlacement ? 1 : 0,
          isFavorited: favoriteIds.has(salon.id),
        };
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return (b.note ?? 0) - (a.note ?? 0);
      })
      .slice(0, 6)
      .map((salon) => ({
        id: salon.id,
        name: salon.name,
        city: salon.city,
        coverUrl: salon.coverUrl,
        categorieLabel: salon.categorieLabel,
        note: salon.note,
        nombreAvis: salon.nombreAvis,
        isFavorited: salon.isFavorited,
      }));
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
      <section className="relative overflow-hidden bg-white px-6 py-20">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-noir/40">
            BEAUTÉ · BIEN-ÊTRE · STYLE
          </p>
          <h1 className="mb-5 font-display text-3xl leading-[1.1] text-noir sm:text-4xl md:text-5xl">
            Trouvez. Réservez.{" "}
            <span className="bg-gradient-to-r from-or-dark to-or bg-clip-text text-transparent">
              Rayonnez.
            </span>
          </h1>
          <p className="mx-auto mb-6 max-w-md text-noir/60">
            Trouvez et réservez votre professionnel beauté préféré, où que vous soyez.
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {heroServices.map((s) => (
              <span
                key={s}
                className="rounded-full border border-beige-dark bg-beige px-3.5 py-1.5 text-xs font-medium text-noir/70"
              >
                {s}
              </span>
            ))}
          </div>

          <form
            action="/recherche"
            className="mx-auto mb-8 flex max-w-lg items-center gap-2 rounded-full border border-beige-dark bg-white py-1.5 pl-5 pr-1.5 shadow-lg shadow-noir/5"
          >
            <Search size={18} className="shrink-0 text-noir/40" />
            <input
              type="text"
              name="q"
              placeholder="Recherchez tous les soins"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-noir/40"
            />
            <button
              type="submit"
              aria-label="Rechercher"
              className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-or px-4 py-3 text-sm font-semibold text-noir transition hover:bg-or-dark hover:text-white sm:px-6"
            >
              <Search size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </form>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-noir px-8 py-3.5 font-semibold text-white transition hover:bg-or hover:text-noir"
            >
              Trouver un professionnel
            </Link>
            <Link
              href="/pro/inscription"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-noir px-8 py-3.5 font-semibold text-noir transition hover:bg-noir hover:text-white"
            >
              Je suis un professionnel
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="mt-4 flex justify-center">
            <InstallAppButton />
          </div>
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

      {/* Pourquoi BeautyConnect */}
      <section className="mx-6 my-12 rounded-3xl bg-beige px-6 py-12">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          <FeatureItem
            href="/recherche"
            icon={<CalendarCheck size={20} />}
            title="Réservation instantanée"
            description="Un créneau, confirmé en 2 minutes."
          />
          <FeatureItem
            href="/client/dashboard"
            icon={<ShieldCheck size={20} />}
            title="Paiement sécurisé"
            description="Acompte ou paiement complet via Stripe."
          />
          <FeatureItem
            href="/recherche"
            icon={<MessageSquareText size={20} />}
            title="Avis vérifiés"
            description="Uniquement après un rendez-vous réel."
          />
        </div>
      </section>

      {/* CTA Pro */}
      <section className="relative mx-6 my-12 overflow-hidden rounded-3xl bg-noir px-6 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-or/10 blur-3xl"
        />
        <h2 className="relative mb-3 font-display text-2xl text-white">
          Vous êtes un professionnel de la beauté ?
        </h2>
        <p className="relative mx-auto mb-8 max-w-md text-white/60">
          Développez votre activité, gérez votre agenda et vos paiements sur
          Beauty Connect.
        </p>
        <Link
          href="/pro/inscription"
          className="relative inline-block rounded-full bg-white px-10 py-3.5 font-semibold text-noir shadow-lg transition hover:bg-or"
        >
          Créer mon salon
        </Link>
      </section>
    </>
  );
}

function FeatureItem({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block text-center sm:text-left">
      <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
        <span className="text-or-dark">{icon}</span>
        <h3 className="font-display text-base text-noir group-hover:underline">{title}</h3>
      </div>
      <p className="text-sm text-noir/50">{description}</p>
    </Link>
  );
}
