import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export type MarqueeProduct = { id: string; name: string; price: number; imageUrl: string | null; salonId: string; salonName: string };

// Carrousel défilant des produits mis en avant dans les boutiques des salons.
// Un clic ouvre la fiche du salon, directement sur le produit (?produit=…).
export default function ProductMarquee({ products }: { products: MarqueeProduct[] }) {
  if (!products.length) return null;
  const list = products.length < 6 ? [...products, ...products, ...products] : products;
  const cards = (suffix: string) =>
    list.map((p, i) => (
      <Link
        key={`${p.id}-${suffix}-${i}`}
        href={`/salon/${p.salonId}?produit=${p.id}`}
        className="mx-2 w-44 shrink-0 overflow-hidden rounded-2xl border border-beige-dark bg-white transition hover:-translate-y-1 hover:border-or hover:shadow-lg sm:w-52"
      >
        <div className="aspect-square bg-beige">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-3xl text-or-dark">✦</div>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-semibold text-noir">{p.name}</p>
          <p className="mt-1 text-sm font-bold text-or-dark">{formatPrice(p.price)}</p>
          <p className="mt-1 truncate text-xs text-noir/50">{p.salonName}</p>
        </div>
      </Link>
    ));
  return (
    <section className="py-12">
      <div className="mx-auto mb-6 max-w-5xl px-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-or-dark">LA BOUTIQUE BEAUTÉ</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-noir sm:text-4xl">Les produits de nos salons</h2>
        <p className="mt-2 text-noir/60">Touchez un produit pour le découvrir dans la boutique du salon.</p>
      </div>
      <div className="promo-banner overflow-hidden">
        <div className="product-track flex w-max py-2">
          <div className="flex">{cards("a")}</div>
          <div className="flex" aria-hidden>{cards("b")}</div>
        </div>
      </div>
    </section>
  );
}
