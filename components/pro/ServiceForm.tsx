"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Category = { id: string; name: string };

export function ServiceForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description") || undefined,
          categoryId: form.get("categoryId"),
          durationMin: Number(form.get("durationMin")),
          price: Number(form.get("price")),
          depositPct: Number(form.get("depositPct") || 30),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Une erreur est survenue.");
        setSubmitting(false);
        return;
      }

      router.push("/pro/services");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label className="text-sm text-noir/70">Nom de la prestation</label>
        <input
          name="name"
          required
          placeholder="Ex: Coupe + brushing"
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
      </div>

      <div>
        <label className="text-sm text-noir/70">Description (optionnel)</label>
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
      </div>

      <div>
        <label className="text-sm text-noir/70">Catégorie</label>
        <select
          name="categoryId"
          required
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        >
          <option value="">Choisir une catégorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-noir/70">Durée (minutes)</label>
          <input
            type="number"
            name="durationMin"
            min={5}
            max={600}
            required
            defaultValue={30}
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
        <div>
          <label className="text-sm text-noir/70">Prix (€)</label>
          <input
            type="number"
            name="price"
            min={0}
            step="0.01"
            required
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-noir/70">Acompte demandé (%)</label>
        <input
          type="number"
          name="depositPct"
          min={0}
          max={100}
          defaultValue={30}
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
        <p className="mt-1 text-xs text-noir/40">
          Pourcentage du prix demandé à l&apos;avance lors d&apos;une réservation en ligne.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Ajout..." : "Ajouter la prestation"}
      </Button>
    </form>
  );
}
