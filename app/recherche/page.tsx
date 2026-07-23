import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star, Search } from "lucide-react";

const categories = [
  { slug: "coiffeur", label: "Coiffeur", icon: "💇" },
  { slug: "estheticienne", label: "Esthéticienne", icon: "✨" },
  { slug: "barbier", label: "Barbier", icon: "🪒" },
  { slug: "maquilleur", label: "Maquilleur", icon: "💄" },
  { slug: "onglerie", label: "Onglerie", icon: "💅" },
  { slug: "massage", label: "Massage", icon: "💆" },
  { slug: "spa", label: "Spa", icon: "🧖" },
  { slug: "extension-cils", label: "Extension de cils", icon: "👁️" },
  { slug: "epilation", label: "Épilation", icon: "✨" },
  { slug: "soins-visage", label: "Soins visage", icon: "🧴" },
  { slug: "soins-corps", label: "Soins corps", icon: "🛁" },
  { slug: "beaute-afro", label: "Beauté afro", icon: "🌀" },
  { slug: "maquillage-permanent", label: "Maquillage permanent", icon: "💉" },
];

interface RecherchePageProps {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    ville?: string;
  }>;
}

export default async function RecherchePage({ searchParams }: RecherchePageProps) {
  const { q, categorie, ville } = await searchParams;

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

  const salons = salonsRaw
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

  const recommandes = salons.slice(0, 6);
  const aProximite = salons.slice(6);

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
        <Link href="/" className="text-2xl font-serif">
          Beauty<span className="text-amber-500">Connect</span>
        </Link>
        <Link
          href="/recherche"
          className="rounded-full bg-black text-white px-6 py-2.5 font-medium hover:bg-neutral-800 transition"
        >
          Réserver
        </Link>
      </header>

      <section className="px-6 py-6">
        <form className="flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3">
          <Search size={18} className="text-neutral-400" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un salon, une prestation..."
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </form>
      </section>

      <section className="px-6 pb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/recherche?categorie=${cat.slug}`}
              className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-3 min-w-[90px] text-center transition ${
                categorie === cat.slug
                  ? "bg-black text-white"
                  : "bg-[#F5EFE6] hover:bg-[#EFE4D3]"
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {recommandes.length > 0 && (
        <section className="px-6 pb-10">
          <h2 className="text-xl font-serif mb-4">Recommandés</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recommandes.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </section>
      )}

      <section className="px-6 pb-14">
        <h2 className="text-xl font-serif mb-4">Établissements à proximité</h2>
        {aProximite.length === 0 && recommandes.length === 0 ? (
          <p className="text-neutral-500 text-sm">
            Aucun salon trouvé pour cette recherche.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {(aProximite.length > 0 ? aProximite : recommandes).map((salon) => (
              <SalonRow key={salon.id} salon={salon} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

type SalonLite = {
  id: string;
  name: string;
  city: string;
  coverUrl: string | null;
  categorieLabel: string;
  note: number | null;
  nombreAvis: number;
};

function SalonCard({ salon }: { salon: SalonLite }) {
  return (
    <Link
      href={`/salon/${salon.id}`}
      className="min-w-[220px] rounded-2xl overflow-hidden border border-neutral-200 hover:shadow-md transition"
    >
      <div
        className="h-32 bg-neutral-800 bg-cover bg-center"
        style={{
          backgroundImage: salon.coverUrl ? `url(${salon.coverUrl})` : undefined,
        }}
      />
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{salon.name}</span>
          {salon.note != null && (
            <span className="flex items-center gap-1 text-amber-500 text-sm shrink-0">
              <Star size={14} fill="currentColor" /> {salon.note.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500">{salon.city}</p>
        <p className="text-xs text-neutral-400">
          {salon.categorieLabel} · {salon.nombreAvis} avis
        </p>
      </div>
    </Link>
  );
}

function SalonRow({ salon }: { salon: SalonLite }) {
  return (
    <Link
      href={`/salon/${salon.id}`}
      className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-3 hover:shadow-md transition"
    >
      <div
        className="h-20 w-20 rounded-xl bg-neutral-800 bg-cover bg-center shrink-0"
        style={{
          backgroundImage: salon.coverUrl ? `url(${salon.coverUrl})` : undefined,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{salon.name}</span>
          {salon.note != null && (
            <span className="flex items-center gap-1 text-amber-500 text-sm shrink-0">
              <Star size={14} fill="currentColor" /> {salon.note.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500">{salon.city}</p>
        <p className="text-xs text-neutral-400">
          {salon.categorieLabel} · {salon.nombreAvis} avis
        </p>
      </div>
    </Link>
  );
}
