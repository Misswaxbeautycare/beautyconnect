import { prisma } from "@/lib/prisma";
import { SalonCard } from "@/components/salon/SalonCard";

interface SearchParams {
  categorie?: string;
  ville?: string;
}

const CATEGORIES = [
  { slug: "coiffeur", label: "Coiffeur", icon: "💇" },
  { slug: "estheticienne", label: "Esthétique", icon: "✨" },
  { slug: "barbier", label: "Barbier", icon: "🪒" },
  { slug: "onglerie", label: "Onglerie", icon: "💅" },
  { slug: "massage", label: "Massages", icon: "💆" },
  { slug: "spa", label: "Spa et sauna", icon: "🧖" },
  { slug: "extension-cils", label: "Sourcils et cils", icon: "👁" },
  { slug: "epilation", label: "Épilations", icon: "🪞" },
  { slug: "beaute-afro", label: "Beauté afro", icon: "🌀" },
  { slug: "maquillage", label: "Maquillage", icon: "💄" },
  { slug: "maquillage-permanent", label: "Maquillage permanent", icon: "🖊" },
  { slug: "soins-corps", label: "Soins corps", icon: "🧴" },
];

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

  const [featured, ...rest] = salons;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center gap-1.5 text-sm text-[#5a5142] mb-3">
        <span className="text-[#a8792e]">📍</span> Position actuelle
      </div>
      <h1 className="font-display text-3xl text-noir">Trouvez votre expert beauté</h1>
      <p className="mt-2 text-noir/60">
        Coiffure, esthétique, onglerie, spa, massage... Réservez votre professionnel beauté préféré, où que vous soyez.
      </p>

      <form className="mt-6 flex flex-wrap items-center gap-2 bg-[#f7efe0] rounded-full px-4 py-2 max-w-xl" method="get">
        <span className="text-gray-400">🔍</span>
        <input
          name="ville"
          defaultValue={params.ville}
          placeholder="Recherchez tous les soins ou une ville"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
        <button className="rounded-full bg-[#c8a24a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#a8792e]">
          Rechercher
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {["Aujourd'hui", "Prix", "Distance", "Note 4.5+", "À domicile"].map((f) => (
          <button
            key={f}
            type="button"
            className="text-xs font-medium text-[#5a5142] border border-gray-200 rounded-full px-3.5 py-1.5"
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl text-noir mb-4">Catégories</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`?categorie=${cat.slug}`}
              className={`flex flex-col items-center gap-2 ${
                params.categorie === cat.slug ? "opacity-100" : "opacity-90"
              }`}
            >
              <span
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  params.categorie === cat.slug ? "bg-[#c8a24a]" : "bg-[#f7efe0]"
                }`}
              >
                {cat.icon}
              </span>
              <span className="text-[11px] text-center text-gray-700 leading-tight">{cat.label}</span>
            </a>
          ))}
        </div>
      </div>

      <p className="mt-8 text-noir/60 text-sm">
        {salons.length} professionnel{salons.length > 1 ? "s" : ""} disponible
        {salons.length > 1 ? "s" : ""}
        {params.categorie ? ` en ${params.categorie.replace("-", " ")}` : ""}
      </p>

      {featured && (
        <div className="mt-6">
          <h2 className="font-display text-xl text-noir mb-4">Recommandés</h2>
          <div className="max-w-sm">
            <SalonCardWithRating salon={featured} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-display text-xl text-noir">Établissements à proximité</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((s) => (
            <SalonCardWithRating key={s.id} salon={s} />
          ))}
          {salons.length === 0 && (
            <p className="col-span-full text-center text-noir/50 py-16">
              Aucun professionnel trouvé pour cette recherche.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SalonCardWithRating({ salon: s }: { salon: any }) {
  const ratingAvg =
    s.reviews.length > 0
      ? s.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / s.reviews.length
      : undefined;

  return (
    <SalonCard
      id={s.id}
      name={s.name}
      city={s.city}
      coverUrl={s.coverUrl}
      categories={s.categories.map((c: { category: { name: string } }) => c.category.name)}
      ratingAvg={ratingAvg}
      reviewCount={s.reviews.length}
      fromPrice={s.services[0] ? Number(s.services[0].price) : undefined}
    />
  );
}
