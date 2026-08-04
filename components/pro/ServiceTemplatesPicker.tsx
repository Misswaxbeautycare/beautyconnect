"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { serviceTemplates } from "@/lib/service-templates";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function ServiceTemplatesPicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function key(categorySlug: string, name: string) {
    return `${categorySlug}::${name}`;
  }

  function toggle(categorySlug: string, name: string) {
    const k = key(categorySlug, name);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function toggleAllInCategory(categorySlug: string) {
    const items = serviceTemplates[categorySlug] ?? [];
    const allSelected = items.every((it) => selected.has(key(categorySlug, it.name)));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const it of items) {
        const k = key(categorySlug, it.name);
        if (allSelected) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setError(null);
    setResult(null);
    setSubmitting(true);

    const items = Array.from(selected).map((k) => {
      const [categorySlug, name] = k.split("::");
      const template = serviceTemplates[categorySlug]?.find((t) => t.name === name);
      return {
        categorySlug,
        name,
        durationMin: template?.durationMin ?? 30,
        price: template?.price ?? 0,
      };
    });

    try {
      const res = await fetch("/api/services/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setSubmitting(false);
        return;
      }

      setResult(
        `${data.created} prestation(s) ajoutée(s)${data.skipped > 0 ? `, ${data.skipped} déjà existante(s) ignorée(s)` : ""}.`
      );
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-beige-dark p-5">
      <p className="font-medium text-noir">Ajouter rapidement des prestations courantes</p>
      <p className="mt-1 text-xs text-noir/50">
        Cochez celles qui correspondent à votre salon — prix et durée pré-remplis, modifiables ensuite.
      </p>

      <div className="mt-4 space-y-2">
        {categories.map((cat) => {
          const items = serviceTemplates[cat.slug];
          if (!items || items.length === 0) return null;
          const isOpen = openCategory === cat.slug;
          const selectedCount = items.filter((it) => selected.has(key(cat.slug, it.name))).length;

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
                  {selectedCount > 0 && (
                    <span className="rounded-full bg-or/30 px-2 py-0.5 text-xs text-noir">
                      {selectedCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-noir/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-beige-dark px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleAllInCategory(cat.slug)}
                    className="mb-2 text-xs text-or-dark underline"
                  >
                    Tout sélectionner / désélectionner
                  </button>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label
                        key={item.name}
                        className="flex cursor-pointer items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected.has(key(cat.slug, item.name))}
                            onChange={() => toggle(cat.slug, item.name)}
                            className="h-4 w-4 accent-or"
                          />
                          {item.name}
                        </span>
                        <span className="shrink-0 text-noir/50">
                          {item.durationMin} min · {formatPrice(item.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && <p className="mt-3 text-sm text-green-700">{result}</p>}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={selected.size === 0 || submitting}
        className="mt-4 w-full"
      >
        {submitting ? "Ajout..." : `Ajouter la sélection (${selected.size})`}
      </Button>
    </div>
  );
}
