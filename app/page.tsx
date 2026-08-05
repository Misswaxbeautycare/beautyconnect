import Link from "next/link";
import { CalendarCheck, ShieldCheck, MessageSquareText, Search, ArrowUpRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { categories } from "@/lib/categories";
import { FeaturedSalonCard, type SalonCardData } from "@/components/salon/FeaturedSalonCard";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { InstallAppButton } from "@/components/InstallAppButton";

const heroServices = ["Coiffure", "Esthétique", "Onglerie", "Spa", "Massage"];

async function getRecommandes(): Promise<SalonCardData[]> {
  try {
    const salonsRaw = await prisma.salon.findMany({
      where: { isActive: true },
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
      <section className="relative overflow-hidden bg-terracotta px-6 py-20">
        {/* Halo décoratif — pas de photo nécessaire, juste de la profondeur */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-noir/5 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="text-center lg:text-left">
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#5C3A1E]">
              BEAUTÉ · BIEN-ÊTRE · STYLE
            </p>
            <h1 className="mb-5 font-display text-3xl leading-[1.1] text-noir sm:text-4xl md:text-5xl">
              Réservez. Connectez. <span className="text-[#5C3A1E]">Rayonnez.</span>
            </h1>
            <p className="mx-auto mb-6 max-w-md text-noir/60 lg:mx-0">
              Trouvez et réservez votre professionnel beauté préféré, où que vous soyez.
            </p>

            <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {heroServices.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-noir/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-noir/70"
                >
                  {s}
                </span>
              ))}
            </div>

            <form
              action="/recherche"
              className="mx-auto mb-8 flex max-w-lg items-center gap-2 rounded-full border border-white bg-white py-1.5 pl-5 pr-1.5 shadow-lg shadow-noir/5 lg:mx-0"
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

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/recherche"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-or bg-or px-8 py-3.5 font-semibold text-noir transition hover:bg-or-dark hover:border-or-dark hover:text-white"
              >
                Trouver un professionnel
              </Link>
              <Link
                href="/pro/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-noir bg-white px-8 py-3.5 font-semibold text-noir transition hover:bg-noir hover:text-white"
              >
                Je suis un professionnel
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="mt-4 flex justify-center lg:justify-start">
              <InstallAppButton />
            </div>
          </div>

          {/* Panneau signature — dégradé doré chaleureux, pas de noir */}
          <div className="relative hidden aspect-[4/5] lg:block">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-or-dark via-[#8A5A28] to-[#4A2F14]" />
            <div className="absolute inset-6 rounded-[2rem] border border-white/15" />
            <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-or-light/40 blur-2xl" />
            <div className="absolute bottom-16 right-10 h-32 w-32 rounded-full bg-or-light/30 blur-3xl" />

            <div className="absolute left-8 top-8 flex items-center gap-2 text-white/70">
              <Sparkles size={16} className="text-or" />
              <span className="font-display text-lg text-white">BeautyConnect</span>
            </div>

            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white p-5 shadow-xl">
              <p className="font-display text-sm text-noir">Réservation en 2 minutes</p>
              <p className="mt-1 text-xs text-noir/50">
                Choisissez un créneau, confirmez, c&apos;est prêt.
              </p>
            </div>
            <div className="absolute right-8 top-24 rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold text-noir">Avis 100% vérifiés</p>
              <p className="text-[11px] text-noir/50">Uniquement après visite</p>
            </div>
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

      {/* Pourquoi BeautyConnect — même cadrage que la section CTA juste en dessous */}
      <section className="mx-6 my-12 rounded-3xl bg-terracotta px-6 py-12">
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
      <section className="relative mx-6 my-12 overflow-hidden rounded-3xl bg-terracotta-dark px-6 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/15 blur-3xl"
        />
        <h2 className="relative mb-3 font-display text-2xl text-noir">
          Vous êtes un professionnel de la beauté ?
        </h2>
        <p className="relative mx-auto mb-8 max-w-md text-noir/60">
          Développez votre activité, gérez votre agenda et vos paiements sur
          Misswaxbeautycare.
        </p>
        <Link
          href="/pro/inscription"
          className="relative inline-block rounded-full bg-white px-10 py-3.5 font-semibold text-noir shadow-lg transition hover:bg-or hover:text-white"
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
        <span className="text-[#5C3A1E]">{icon}</span>
        <h3 className="font-display text-base text-noir group-hover:underline">{title}</h3>
      </div>
      <p className="text-sm text-noir/50">{description}</p>
    </Link>
  );
}
