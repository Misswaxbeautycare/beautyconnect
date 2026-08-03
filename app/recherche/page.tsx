import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Grid3x3 } from "lucide-react";
import { LocationPicker } from "@/components/search/LocationPicker";
import { categories } from "@/lib/categories";
import { FeaturedSalonCard, type SalonCardData } from "@/components/salon/FeaturedSalonCard";
import { SalonListRow } from "@/components/salon/SalonListRow";

interface RecherchePageProps {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    ville?: string;
  }>;
}

export default async function RecherchePage({ searchParams }: RecherchePageProps) {
  const { q, categorie, ville } = await searchParams;

  let salons: SalonCardData[] = [];
  let errorMessage: string | null = null;

  try {
    const salonsRaw = await prisma.salon.findMany({
      where: {
        isActive: true,
        AND: [
          q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { city: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          categorie
            ? { categories: { some: { category: { slug: categorie } } } }
            : {},
          ville ? { city: { contains: ville, mode: "insensitive" } } : {},
        ],
      },
      include: {
        categories: { include: { category: true } },
        reviews: { select: { rating: true } },
      },
      take: 30,
    });

    salons = salonsRaw
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
      .sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
  } catch (err) {
    console.error("[/recherche] Erreur Prisma:", err);
    errorMessage =
      err instanceof Error ? err.message : "Erreur inconnue lors de la récupération des salons.";
  }

  const recommandes = salons.slice(0, 6);
  const aProximite = salons.slice(6);

  return (
    <main className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <LocationPicker />
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-noir text-white transition hover:bg-or hover:text-noir"
        >
          <Grid3x3 size={18} />
        </Link>
      </div>

      <div className="px-6 pb-6">
        <form className="flex items-center gap-3 rounded-full border border-beige-dark bg-white pl-5 pr-1.5 py-1.5 shadow-sm">
          <Search size={18} className="shrink-0 text-noir/40" />
          <input
            type="text"
            name="q"
            defaultValue={q}
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
      </div>

      <section className="pb-8">
        <div className="flex gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill label="Tous" active={!categorie} href="/recherche" />
          {categories.map((cat) => (
            <CategoryPill
              key={cat.slug}
              label={cat.label}
              Icon={cat.icon}
              active={categorie === cat.slug}
              href={`/recherche?categorie=${cat.slug}`}
            />
          ))}
        </div>
      </section>

      {errorMessage && (
        <section className="px-6 pb-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="mb-1 font-semibold">Erreur lors du chargement des salons</p>
            <p className="break-words">{errorMessage}</p>
          </div>
        </section>
      )}

      {!errorMessage && recommandes.length > 0 && (
        <section className="px-6 pb-10">
          <h2 className="mb-4 font-display text-2xl text-noir">Recommandés</h2>
          <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recommandes.map((salon) => (
              <FeaturedSalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </section>
      )}

      {!errorMessage && (
        <section className="px-6 pb-14">
          <h2 className="mb-4 font-display text-xl text-noir">Établissements à proximité</h2>
          {aProximite.length === 0 && recommandes.length === 0 ? (
            <p className="text-sm text-noir/50">Aucun salon trouvé pour cette recherche.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {(aProximite.length > 0 ? aProximite : recommandes).map((salon) => (
                <SalonListRow key={salon.id} salon={salon} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function CategoryPill({
  label,
  Icon,
  active,
  href,
}: {
  label: string;
  Icon?: React.ComponentType<{ size?: number }>;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`flex shrink-0 flex-col items-center gap-2 rounded-2xl px-4 py-3 text-center transition ${
        active ? "bg-noir text-white" : "bg-beige text-noir/70 hover:bg-beige-dark"
      }`}
    >
      {Icon ? <Icon size={20} /> : <Grid3x3 size={20} />}
      <span className="whitespace-nowrap text-xs leading-tight">{label}</span>
    </Link>
  );
}
