"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { Clock, Trash2, Pencil, X, ArrowUp, ArrowDown } from "lucide-react";

type ServiceMode = "SALON" | "DOMICILE" | "DEPLACEMENT";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  depositPct: number;
  modes: ServiceMode[];
  isActive: boolean;
  order: number;
  category: { name: string };
};

const MODE_OPTIONS: { value: ServiceMode; label: string }[] = [
  { value: "SALON", label: "En salon" },
  { value: "DOMICILE", label: "À domicile" },
  { value: "DEPLACEMENT", label: "Je me déplace" },
];

export function ServicesList({
  services,
  allowMultiMode,
}: {
  services: Service[];
  allowMultiMode: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(services);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; description: string; price: string; durationMin: string; depositPct: string; modes: ServiceMode[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [reorderLoading, setReorderLoading] = useState<string | null>(null);

  async function swapOrder(serviceIdA: string, serviceIdB: string) {
    setReorderLoading(serviceIdA);
    // Mise à jour optimiste pour un retour immédiat à l'écran
    setItems((prev) => {
      const a = prev.find((s) => s.id === serviceIdA);
      const b = prev.find((s) => s.id === serviceIdB);
      if (!a || !b) return prev;
      return prev.map((s) => {
        if (s.id === serviceIdA) return { ...s, order: b.order };
        if (s.id === serviceIdB) return { ...s, order: a.order };
        return s;
      });
    });

    const res = await fetch("/api/services/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceIdA, serviceIdB }),
    });
    setReorderLoading(null);
    if (!res.ok) {
      setError("Impossible de réordonner les prestations.");
      router.refresh();
    }
  }

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

  function startEdit(s: Service) {
    setEditingId(s.id);
    setDraft({
      name: s.name,
      description: s.description ?? "",
      price: String(s.price),
      durationMin: String(s.durationMin),
      depositPct: String(s.depositPct),
      modes: s.modes.length > 0 ? s.modes : ["SALON"],
    });
    setError(null);
  }

  function toggleDraftMode(value: ServiceMode) {
    if (!draft) return;
    if (value !== "SALON" && !allowMultiMode) return;
    setDraft({
      ...draft,
      modes: draft.modes.includes(value)
        ? draft.modes.filter((m) => m !== value)
        : [...draft.modes, value],
    });
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    const price = Number(draft.price);
    const durationMin = Number(draft.durationMin);
    const depositPct = Number(draft.depositPct);

    if (draft.name.trim().length < 2 || !price || price <= 0 || !durationMin || durationMin < 5) {
      setError("Vérifiez le nom, le prix et la durée.");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        price,
        durationMin,
        depositPct,
        modes: draft.modes,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Impossible d'enregistrer les modifications.");
      return;
    }

    setItems((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, name: draft.name.trim(), description: draft.description.trim() || null, price, durationMin, depositPct, modes: draft.modes }
          : s
      )
    );
    setEditingId(null);
    setDraft(null);
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
            {servicesDeCat.map((s, index) => {
              const isEditing = editingId === s.id;

              if (isEditing && draft) {
                return (
                  <Card key={s.id} className="p-4 sm:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-noir/70">Modifier la prestation</p>
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setDraft(null); setError(null); }}
                        className="text-noir/40 hover:text-noir"
                        aria-label="Annuler"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-noir/60">Nom</label>
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-noir/60">
                          Description <span className="font-normal text-noir/40">(donne envie de réserver)</span>
                        </label>
                        <textarea
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          rows={2}
                          placeholder="Ex : Un chignon élégant qui tient toute la soirée."
                          className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-noir/60">Prix (€)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={draft.price}
                          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-noir/60">Durée (min)</label>
                        <input
                          type="number"
                          min={5}
                          value={draft.durationMin}
                          onChange={(e) => setDraft({ ...draft, durationMin: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-noir/60">Acompte demandé (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.depositPct}
                          onChange={(e) => setDraft({ ...draft, depositPct: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-xs text-noir/60">Où est proposée cette prestation ?</label>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {MODE_OPTIONS.map((opt) => {
                          const locked = opt.value !== "SALON" && !allowMultiMode;
                          const active = draft.modes.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={locked}
                              onClick={() => toggleDraftMode(opt.value)}
                              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                locked
                                  ? "border-beige-dark text-noir/30"
                                  : active
                                    ? "border-or bg-or text-noir"
                                    : "border-beige-dark text-noir/70 hover:border-or"
                              }`}
                            >
                              {opt.label}{locked ? " (Signature+)" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button onClick={() => saveEdit(s.id)} disabled={saving} className="mt-4 w-full sm:w-auto">
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </Card>
                );
              }

              return (
                <Card
                  key={s.id}
                  className={`relative flex flex-col justify-between p-4 transition ${
                    s.isActive ? "" : "opacity-50"
                  }`}
                >
                  <div className="absolute left-3 top-3 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => index > 0 && swapOrder(s.id, servicesDeCat[index - 1].id)}
                      disabled={index === 0 || reorderLoading !== null}
                      aria-label="Monter"
                      className="flex h-5 w-5 items-center justify-center text-noir/25 hover:text-or-dark disabled:opacity-20"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => index < servicesDeCat.length - 1 && swapOrder(s.id, servicesDeCat[index + 1].id)}
                      disabled={index === servicesDeCat.length - 1 || reorderLoading !== null}
                      aria-label="Descendre"
                      className="flex h-5 w-5 items-center justify-center text-noir/25 hover:text-or-dark disabled:opacity-20"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      aria-label="Modifier"
                      className="text-noir/30 hover:text-or-dark"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      aria-label="Supprimer"
                      className="text-noir/30 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div>
                    <p className="pl-6 pr-12 font-medium text-noir">{s.name}</p>
                    {s.description && (
                      <p className="mt-1 pl-6 line-clamp-2 text-xs text-noir/50">{s.description}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1 pl-6 text-xs text-noir/50">
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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
