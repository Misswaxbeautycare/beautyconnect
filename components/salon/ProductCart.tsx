"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBasket, Plus, Minus, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export function ProductCart({ products }: { products: ProductData[] }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartItems = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => ({
          product: products.find((p) => p.id === productId)!,
          quantity: qty,
        }))
        .filter((i) => i.product),
    [quantities, products]
  );

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  function addToCart(productId: string) {
    setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
    setShowCart(true);
  }

  function changeQty(productId: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      return { ...prev, [productId]: next };
    });
  }

  async function handleCheckout() {
    if (cartItems.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(typeof data.error === "string" ? data.error : "Impossible de démarrer le paiement.");
        setLoading(false);
        return;
      }
      router.push(data.checkoutUrl);
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg text-noir">Boutique</h3>
        <button
          type="button"
          onClick={() => setShowCart((v) => !v)}
          aria-label="Voir le panier"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-beige-dark text-noir/70 hover:border-or hover:text-noir"
        >
          <ShoppingBasket size={17} />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-or text-[10px] font-bold text-noir">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {showCart && (
        <div className="mb-4 rounded-2xl border border-beige-dark bg-beige/50 p-4">
          {cartItems.length === 0 ? (
            <p className="text-sm text-noir/40">Votre panier est vide pour l&apos;instant.</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-noir">{product.name}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, -1)}
                        aria-label="Diminuer"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-beige-dark text-noir/60 hover:border-or"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-4 text-center text-noir">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(product.id, 1)}
                        aria-label="Augmenter"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-beige-dark text-noir/60 hover:border-or"
                      >
                        <Plus size={11} />
                      </button>
                      <span className="w-14 shrink-0 text-right font-medium text-noir">
                        {formatPrice(product.price * quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantities((prev) => ({ ...prev, [product.id]: 0 }))}
                        aria-label={`Retirer ${product.name}`}
                        className="text-noir/40 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-beige-dark pt-3 text-sm font-semibold text-noir">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-3 w-full rounded-full bg-noir py-2.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-50"
              >
                {loading ? "Redirection..." : "Commander et payer"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-beige-dark p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-beige">
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
              </div>
              <div>
                <p className="font-medium text-noir">{p.name}</p>
                <p className="text-sm text-noir/60">{formatPrice(p.price)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => addToCart(p.id)}
              className="shrink-0 rounded-full bg-or px-4 py-2 text-xs font-semibold text-noir transition hover:bg-or-dark hover:text-white"
            >
              Ajouter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
