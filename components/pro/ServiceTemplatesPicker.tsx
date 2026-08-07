"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { serviceTemplates } from "@/lib/service-templates";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/utils";
import { ChevronDown, Plus, Check } from "lucide-react";

export function ServiceTemplatesPicker() {
  const router = useRouter();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function key(categorySlug: string, name: string) {
    return `${categorySlug}::${name}`;
  }

  async function addOne(categorySlug: string, item: { name: string; durationMin: number; price: number }) {
    const k = key(categorySlug, item.name);
    setError(null);
    setLoading(k);

    try {
      const res = await fetch("/api/services/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ categorySlug, name: item.name, durationMin: item.durationMin, price: item.price }],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setLoading(null);
        return;
      }

      setAdded((prev) => new Set(prev).add(k));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-beige-dark p-5">
      <p className="font-medium text-noir">Ajouter rapidement des prestations courantes</p>
      <p className="mt-1 text-xs text-noir/50">
        Comme dans une boutique : cliquez sur le + pour ajouter instantanément une prestation à votre
        catalogue (prix et durée pré-remplis, modifiables ensuite).
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-2">
        {categories.map((cat) => {
          const items = serviceTemplates[cat.slug];
          if (!items || items.length === 0) return null;
          const isOpen = openCategory === cat.slug;
          const addedCount = items.filter((it) => added.has(key(cat.slug, it.name))).length;

          return (
            <div key={cat.slug} className="rounded-xl border border-beige-dark">
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : cat.slug)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-noir">
                  <cat.icon size={16} />
                  {cat.label}
                  {addedCount > 0 && (
                    <span className="rounded-full bg-or/30 px-2 py-0.5 text-xs text-noir">
                      {addedCount} ajoutée{addedCount > 1 ? "s" : ""}
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-noir/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="divide-y divide-beige-dark border-t border-beige-dark">
                  {items.map((item) => {
                    const k = key(cat.slug, item.name);
                    const isAdded = added.has(k);
                    const isLoading = loading === k;
                    return (
                      <div key={item.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div>
                          <p className="text-noir">{item.name}</p>
                          <p className="text-xs text-noir/50">
                            {item.durationMin} min · {formatPrice(item.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => !isAdded && addOne(cat.slug, item)}
                          disabled={isAdded || isLoading}
                          aria-label={isAdded ? "Déjà ajoutée" : "Ajouter cette prestation"}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                            isAdded
                              ? "bg-green-50 text-green-700"
                              : "bg-or text-noir hover:bg-or-dark hover:text-white"
                          }`}
                        >
                          {isAdded ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
