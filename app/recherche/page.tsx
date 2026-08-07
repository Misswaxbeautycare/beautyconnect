import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Grid3x3 } from "lucide-react";
import { LocationPicker } from "@/components/search/LocationPicker";
import { categories } from "@/lib/categories";
import { FeaturedSalonCard, type SalonCardData } from "@/components/salon/FeaturedSalonCard";
import { SalonListRow } from "@/components/salon/SalonListRow";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { getCurrentDbUser } from "@/lib/auth";

interface RecherchePageProps {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    ville?: string;
    prixMax?: string;
    disponible?: string;
    tri?: string;
  }>;
}

export default async function RecherchePage({ searchParams }: RecherchePageProps) {
  const { q, categorie, ville, prixMax, disponible, tri } = await searchParams;
  const prixMaxNum = prixMax ? Number(prixMax) : null;

  let salons: SalonCardData[] = [];
  let errorMessage: string | null = null;

  try {
    const [salonsRaw, dbUser] = await Promise.all([
      prisma.salon.findMany({
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
            prixMaxNum
              ? { services: { some: { isActive: true, price: { lte: prixMaxNum } } } }
              : {},
          ],
        },
        include: {
          categories: { include: { category: true } },
          reviews: { select: { rating: true } },
          services: { where: { isActive: true }, select: { price: true } },
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "PENDING"] },
              date: { gte: new Date(), lt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
            },
            select: { id: true },
          },
        },
        take: 30,
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

    salons = salonsRaw
      .map((salon) => {
        const noteMoyenne =
          salon.reviews.length > 0
            ? salon.reviews.reduce((sum, r) => sum + r.rating, 0) / salon.reviews.length
            : null;
        const plan = getEffectivePlan(salon);
        const prixMin =
          salon.services.length > 0 ? Math.min(...salon.services.map((s) => Number(s.price))) : null;
        // Approximation : un salon avec peu de rendez-vous déjà pris dans
        // les 48h a de bonnes chances d'avoir un créneau proche disponible.
        const disponibiliteImmediate = salon.bookings.length < 20;
        return {
          id: salon.id,
          name: salon.name,
          city: salon.city,
          coverUrl: salon.coverUrl,
          categorieLabel: salon.categories[0]?.category.name ?? "",
          note: noteMoyenne,
          nombreAvis: salon.reviews.length,
          priority: plan.priorityPlacement ? 1 : 0,
          disponibiliteImmediate,
          prixMin,
          isFavorited: favoriteIds.has(salon.id),
        };
      })
      .filter((s) => (disponible === "1" ? s.disponibiliteImmediate : true))
      .sort((a, b) => {
        if (tri === "prix_asc") return (a.prixMin ?? Infinity) - (b.prixMin ?? Infinity);
        if (tri === "prix_desc") return (b.prixMin ?? -Infinity) - (a.prixMin ?? -Infinity);
        if (tri === "note") return (b.note ?? 0) - (a.note ?? 0);
        // Tri par défaut : mise en avant prioritaire, puis meilleure note
        if (b.priority !== a.priority) return b.priority - a.priority;
        return (b.note ?? 0) - (a.note ?? 0);
      })
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
    console.error("[/recherche] Erreur Prisma:", err);
    errorMessage =
      err instanceof Error ? err.message : "Erreur inconnue lors de la récupération des salons.";
  }

  const recommandes = salons.slice(0, 6);
  const aProximite = salons.slice(6);

  return (
    <main className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <LocationPicker initialVille={ville} />
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-or text-noir transition hover:bg-or-dark hover:text-white"
        >
          <Grid3x3 size={18} />
        </Link>
      </div>

      <div className="px-6 pb-4">
        <form className="flex items-center gap-3 rounded-full border border-beige-dark bg-white pl-5 pr-1.5 py-1.5 shadow-sm">
          {ville && <input type="hidden" name="ville" value={ville} />}
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
            className="shrink-0 rounded-full bg-or px-6 py-3 text-sm font-semibold text-noir transition hover:bg-or-dark hover:text-white"
          >
            Rechercher
          </button>
        </form>
      </div>

      <form className="flex flex-wrap items-center gap-3 px-6 pb-6">
        {q && <input type="hidden" name="q" value={q} />}
        {categorie && <input type="hidden" name="categorie" value={categorie} />}
        {ville && <input type="hidden" name="ville" value={ville} />}
        <select
          name="tri"
          defaultValue={tri ?? ""}
          className="rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-noir/70 outline-none focus:border-or"
        >
          <option value="">Trier : recommandés</option>
          <option value="note">Mieux notés</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
        <select
          name="prixMax"
          defaultValue={prixMax ?? ""}
          className="rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-noir/70 outline-none focus:border-or"
        >
          <option value="">Tous les prix</option>
          <option value="20">Jusqu'à 20€</option>
          <option value="40">Jusqu'à 40€</option>
          <option value="60">Jusqu'à 60€</option>
          <option value="100">Jusqu'à 100€</option>
        </select>
        <label className="flex items-center gap-2 rounded-full border border-beige-dark bg-white px-4 py-2 text-sm text-noir/70">
          <input type="checkbox" name="disponible" value="1" defaultChecked={disponible === "1"} />
          Disponible bientôt
        </label>
        <button
          type="submit"
          className="rounded-full bg-noir px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition"
        >
          Filtrer
        </button>
      </form>

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
        active ? "bg-or text-noir" : "bg-beige text-noir/70 hover:bg-beige-dark"
      }`}
    >
      {Icon ? <Icon size={20} /> : <Grid3x3 size={20} />}
      <span className="whitespace-nowrap text-xs leading-tight">{label}</span>
    </Link>
  );
}
