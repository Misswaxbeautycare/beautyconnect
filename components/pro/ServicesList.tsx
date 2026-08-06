"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { Clock, Trash2 } from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  isActive: boolean;
  category: { name: string };
};

export function ServicesList({ services }: { services: Service[] }) {
  const router = useRouter();
  const [items, setItems] = useState(services);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    setError(null);
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      setError("Impossible de mettre à jour cette prestation.");
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cette prestation ?")) return;
    setError(null);
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Impossible de supprimer cette prestation.");
      return;
    }
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  if (items.length === 0) {
    return <p className="mt-10 text-noir/40">Aucune prestation pour le moment.</p>;
  }

  // Regroupées par catégorie, comme un rayon de boutique
  const parCategorie = items.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category.name] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mt-8 space-y-10">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {Object.entries(parCategorie).map(([categorie, servicesDeCat]) => (
        <div key={categorie}>
          <h2 className="mb-3 font-display text-lg text-noir">{categorie}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {servicesDeCat.map((s) => (
              <Card
                key={s.id}
                className={`relative flex flex-col justify-between p-4 transition ${
                  s.isActive ? "" : "opacity-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label="Supprimer"
                  className="absolute right-3 top-3 text-noir/30 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>

                <div>
                  <p className="pr-6 font-medium text-noir">{s.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-noir/50">
                    <Clock size={12} /> {s.durationMin} min
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-lg text-or-dark">{formatPrice(s.price)}</span>
                  <button
                    type="button"
                    onClick={() => toggleActive(s.id, !s.isActive)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      s.isActive
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                  >
                    {s.isActive ? "En vente" : "Masquée"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
