import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star, Search } from "lucide-react";

const categories = [
  "Coiffeur",
  "Esthéticienne",
  "Barbier",
  "Maquilleur",
  "Onglerie",
  "Massage",
  "Spa",
  "Extension de cils",
  "Épilation",
  "Soins visage",
  "Soins corps",
  "Beauté afro",
  "Maquillage permanent",
];

const categoryIcons: Record<string, string> = {
  Coiffeur: "💇",
  Esthéticienne: "✨",
  Barbier: "🪒",
  Maquilleur: "💄",
  Onglerie: "💅",
  Massage: "💆",
  Spa: "🧖",
  "Extension de cils": "👁️",
  Épilation: "✨",
  "Soins visage": "🧴",
  "Soins corps": "🛁",
  "Beauté afro": "🌀",
  "Maquillage permanent": "💉",
};

interface RecherchePageProps {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    ville?: string;
  }>;
}

export default async function RecherchePage({ searchParams }: RecherchePageProps) {
  const { q, categorie, ville } = await searchParams;

  const salons = await prisma.salon.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { nom: { contains: q, mode: "insensitive" } },
                { ville: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        categorie ? { categorie: { equals: categorie } } : {},
        ville ? { ville: { contains: ville, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { note: "desc" },
    take: 30,
  });

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
              key={cat}
              href={`/recherche?categorie=${encodeURIComponent(cat)}`}
              className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-3 min-w-[90px] text-center transition ${
                categorie === cat
                  ? "bg-black text-white"
                  : "bg-[#F5EFE6] hover:bg-[#EFE4D3]"
              }`}
            >
              <span className="text-xl">{categoryIcons[cat]}</span>
              <span className="text-xs">{cat}</span>
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
  nom: string;
  ville: string | null;
  categorie: string | null;
  note: number | null;
  nombreAvis: number | null;
  photoCouverture: string | null;
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
          backgroundImage: salon.photoCouverture
            ? `url(${salon.photoCouverture})`
            : undefined,
        }}
      />
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{salon.nom}</span>
          {salon.note != null && (
            <span className="flex items-center gap-1 text-amber-500 text-sm shrink-0">
              <Star size={14} fill="currentColor" /> {salon.note.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500">{salon.ville}</p>
        <p className="text-xs text-neutral-400">
          {salon.categorie} · {salon.nombreAvis ?? 0} avis
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
          backgroundImage: salon.photoCouverture
            ? `url(${salon.photoCouverture})`
            : undefined,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold truncate">{salon.nom}</span>
          {salon.note != null && (
            <span className="flex items-center gap-1 text-amber-500 text-sm shrink-0">
              <Star size={14} fill="currentColor" /> {salon.note.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500">{salon.ville}</p>
        <p className="text-xs text-neutral-400">
          {salon.categorie} · {salon.nombreAvis ?? 0} avis
        </p>
      </div>
    </Link>
  );
}
