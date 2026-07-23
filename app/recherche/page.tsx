import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Search,
  Grid3x3,
  Scissors,
  Sparkles,
  Hand,
  Eye,
  Palette,
  Waves,
  Flower2,
  Gem,
  Star,
} from "lucide-react";
import { LocationPicker } from "@/components/search/LocationPicker";

const categories = [
  { slug: null, label: "Tous", icon: Grid3x3 },
  { slug: "coiffeur", label: "Coiffeur", icon: Scissors },
  { slug: "estheticienne", label: "Esthéticienne", icon: Sparkles },
  { slug: "onglerie", label: "Onglerie", icon: Hand },
  { slug: "extension-cils", label: "Sourcils et cils", icon: Eye },
  { slug: "maquillage-permanent", label: "Maquillage", icon: Palette },
  { slug: "spa", label: "Spa", icon: Waves },
  { slug: "beaute-afro", label: "Beauté afro", icon: Flower2 },
  { slug: "soins-visage", label: "Soins visage", icon: Gem },
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
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <LocationPicker />
        <Link
          href="/"
          className="h-11 w-11 flex items-center justify-center rounded-full bg-neutral-900 text-white"
        >
          <Grid3x3 size={18} />
        </Link>
      </div>

      <div className="px-6 pb-6">
        <form className="flex items-center gap-3 rounded-full border border-neutral-200 pl-5 pr-1.5 py-1.5 shadow-sm">
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            name="q"
            defaultValue={q}
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
      </div>

      <section className="px-6 pb-8">
        <div className="grid grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = categorie === cat.slug || (!categorie && !cat.slug);
            return (
              <Link
                key={cat.label}
                href={cat.slug ? `/recherche?categorie=${cat.slug}` : "/recherche"}
                className={`flex flex-col items-center gap-2 rounded-2xl py-5 px-2 text-center transition ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                }`}
              >
                <Icon size={22} />
                <span className="text-xs leading-tight">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {recommandes.length > 0 && (
        <section className="px-6 pb-10">
          <h2 className="text-2xl font-bold mb-4">Recommandés</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x">
            {recommandes.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </section>
      )}

      <section className="px-6 pb-14">
        <h2 className="text-xl font-bold mb-4">Établissements à proximité</h2>
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
      className="min-w-[280px] max-w-[280px] rounded-2xl overflow-hidden snap-start relative"
    >
      <div
        className="h-56 bg-neutral-800 bg-cover bg-center relative"
        style={{
          backgroundImage: salon.coverUrl ? `url(${salon.coverUrl})` : undefined,
        }}
      >
        <span className="absolute top-3 left-3 bg-white/95 text-xs font-semibold px-3 py-1.5 rounded-full">
          À la une
        </span>
      </div>
      <div className="pt-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{salon.name}</span>
          {salon.note != null && (
            <span className="flex items-center gap-1 text-sm shrink-0">
              <Star size={14} className="text-amber-500" fill="currentColor" />{" "}
              {salon.note.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500">{salon.city}</p>
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
