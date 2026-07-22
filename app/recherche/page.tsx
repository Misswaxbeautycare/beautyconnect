import { prisma } from "@/lib/prisma";
import { SalonCard } from "@/components/salon/SalonCard";

interface SearchParams {
  categorie?: string;
  ville?: string;
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const salons = await prisma.salon.findMany({
    where: {
      isActive: true,
      isApproved: true,
      ...(params.ville ? { city: { contains: params.ville, mode: "insensitive" } } : {}),
      ...(params.categorie
        ? { categories: { some: { category: { slug: params.categorie } } } }
        : {}),
    },
    include: {
      categories: { include: { category: true } },
      services: { orderBy: { price: "asc" }, take: 1 },
      reviews: true,
    },
    take: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Trouver un professionnel</h1>
      <p className="mt-2 text-noir/60">
        {salons.length} professionnel{salons.length > 1 ? "s" : ""} disponible
        {salons.length > 1 ? "s" : ""}
        {params.categorie ? ` en ${params.categorie.replace("-", " ")}` : ""}
      </p>

      {/* Filtres — ville, catégorie, prix, note, disponibilité (formulaire GET) */}
      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <input
          name="ville"
          defaultValue={params.ville}
          placeholder="Ville"
          className="rounded-full border border-beige-dark px-4 py-2 text-sm outline-none focus:border-or"
        />
        <button className="rounded-full bg-noir px-5 py-2 text-sm text-white hover:bg-or hover:text-noir">
          Filtrer
        </button>
      </form>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {salons.map((s) => {
          const ratingAvg =
            s.reviews.length > 0
              ? s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length
              : undefined;
          return (
            <SalonCard
              key={s.id}
              id={s.id}
              name={s.name}
              city={s.city}
              coverUrl={s.coverUrl}
              categories={s.categories.map((c) => c.category.name)}
              ratingAvg={ratingAvg}
              reviewCount={s.reviews.length}
              fromPrice={s.services[0] ? Number(s.services[0].price) : undefined}
            />
          );
        })}
        {salons.length === 0 && (
          <p className="col-span-full text-center text-noir/50 py-16">
            Aucun professionnel trouvé pour cette recherche.
          </p>
        )}
      </div>
    </div>
  );
}
