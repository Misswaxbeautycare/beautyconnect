"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ShoppingBasket, Plus, Minus, X, Trash2, Share2, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  imageUrls: string[];
}

export function ProductCart({
  products,
  salonId,
  highlightedProductId,
}: {
  products: ProductData[];
  salonId: string;
  highlightedProductId?: string | null;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxProduct, setLightboxProduct] = useState<ProductData | null>(null);

  async function shareProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    const url = `${window.location.origin}/salon/${salonId}?produit=${productId}`;
    const shareData = { title: product ? product.name : "Boutique", url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedId(productId);
      setTimeout(() => setCopiedId((v) => (v === productId ? null : v)), 2000);
    }
  }

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
    setDrawerOpen(true);
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
          onClick={() => setDrawerOpen(true)}
          aria-label="Voir le panier"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-beige-dark text-noir/70 hover:border-or hover:text-noir"
        >
          <ShoppingBasket size={17} />
          {totalItems > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-or text-[10px] font-bold text-noir">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const qty = quantities[p.id] ?? 0;
          return (
            <div
              key={p.id}
              id={`produit-${p.id}`}
              className={`scroll-mt-24 flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                highlightedProductId === p.id ? "border-or bg-beige" : "border-beige-dark"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => p.imageUrl && setLightboxProduct(p)}
                  disabled={!p.imageUrl}
                  aria-label={`Voir la photo de ${p.name} en grand`}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-beige"
                >
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
                </button>
                <div className="min-w-0">
                  <p className="truncate font-medium text-noir">{p.name}</p>
                  <p className="text-sm text-noir/60">{formatPrice(p.price)}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => shareProduct(p.id)}
                  aria-label={`Partager ${p.name}`}
                  className="text-noir/30 hover:text-or-dark"
                >
                  {copiedId === p.id ? <Check size={14} /> : <Share2 size={13} />}
                </button>
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => addToCart(p.id)}
                    className="shrink-0 rounded-full bg-or px-4 py-2 text-xs font-semibold text-noir transition hover:bg-or-dark hover:text-white"
                  >
                    Ajouter
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-2 rounded-full border border-or bg-beige px-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => changeQty(p.id, -1)}
                      aria-label="Diminuer"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-noir/60 hover:text-noir"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-4 text-center text-sm font-medium text-noir">{qty}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(p.id, 1)}
                      aria-label="Augmenter"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-noir/60 hover:text-noir"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div
              className="absolute inset-0 bg-noir/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-beige-dark px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShoppingBasket size={18} className="text-or-dark" />
                  <h3 className="font-display text-lg text-noir">Votre panier</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fermer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-noir/50 hover:bg-beige hover:text-noir"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingBasket size={32} className="mb-3 text-noir/20" />
                    <p className="text-sm text-noir/40">Votre panier est vide.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {cartItems.map(({ product, quantity }) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-beige">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-noir">{product.name}</p>
                          <p className="text-xs text-noir/50">{formatPrice(product.price)} / unité</p>
                          <div className="mt-1.5 flex items-center gap-2 rounded-full border border-beige-dark px-1 py-0.5 w-fit">
                            <button
                              type="button"
                              onClick={() => changeQty(product.id, -1)}
                              aria-label="Diminuer"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-noir/60 hover:text-noir"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-4 text-center text-xs font-medium text-noir">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => changeQty(product.id, 1)}
                              aria-label="Augmenter"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-noir/60 hover:text-noir"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-sm font-semibold text-noir">
                            {formatPrice(product.price * quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantities((prev) => ({ ...prev, [product.id]: 0 }))}
                            aria-label={`Retirer ${product.name}`}
                            className="text-noir/30 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-beige-dark px-5 py-4">
                  <div className="mb-3 flex items-center justify-between text-base">
                    <span className="font-medium text-noir">Total</span>
                    <span className="font-display text-xl text-noir">{formatPrice(totalPrice)}</span>
                  </div>
                  {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full rounded-full bg-noir py-3.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-50"
                  >
                    {loading ? "Redirection vers le paiement..." : "Commander et payer"}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {lightboxProduct &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-noir/80 p-4"
            onClick={() => setLightboxProduct(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxProduct(null)}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <div className="max-h-[85vh] max-w-lg overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const allPhotos = [
                  ...(lightboxProduct.imageUrl ? [lightboxProduct.imageUrl] : []),
                  ...lightboxProduct.imageUrls,
                ];
                if (allPhotos.length === 0) return null;
                return (
                  <div className="flex max-h-[70vh] snap-x snap-mandatory gap-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                    {allPhotos.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${lightboxProduct.name} ${i + 1}`}
                        className="h-[70vh] w-full shrink-0 snap-center object-contain"
                      />
                    ))}
                  </div>
                );
              })()}
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-noir">{lightboxProduct.name}</p>
                  <p className="text-sm text-noir/60">{formatPrice(lightboxProduct.price)}</p>
                  {(lightboxProduct.imageUrls.length > 0) && (
                    <p className="mt-0.5 text-xs text-noir/40">
                      Faites glisser pour voir les {1 + lightboxProduct.imageUrls.length} photos
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(lightboxProduct.id);
                    setLightboxProduct(null);
                  }}
                  className="shrink-0 rounded-full bg-or px-4 py-2 text-xs font-semibold text-noir transition hover:bg-or-dark hover:text-white"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
