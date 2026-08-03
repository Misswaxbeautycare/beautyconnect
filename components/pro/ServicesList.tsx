"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

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

  return (
    <div className="mt-8 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {items.map((s) => (
        <Card key={s.id} className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="font-medium text-noir">{s.name}</p>
            <p className="text-sm text-noir/60">
              {s.category.name} · {s.durationMin} min · {formatPrice(s.price)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => toggleActive(s.id, !s.isActive)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                s.isActive
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {s.isActive ? "Active" : "Désactivée"}
            </button>
            <button
              type="button"
              onClick={() => remove(s.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Supprimer
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
