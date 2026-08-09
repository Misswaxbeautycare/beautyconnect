"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Jour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const NOMS_JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function joursParDefaut(existants: Jour[]): Jour[] {
  return Array.from({ length: 7 }, (_, i) => {
    const trouve = existants.find((j) => j.dayOfWeek === i);
    return (
      trouve ?? {
        dayOfWeek: i,
        openTime: "09:00",
        closeTime: "18:00",
        isClosed: i === 0, // dimanche fermé par défaut
      }
    );
  });
}

export function OpeningHoursForm({ initialJours }: { initialJours: Jour[] }) {
  const router = useRouter();
  const [jours, setJours] = useState<Jour[]>(() => joursParDefaut(initialJours));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(dayOfWeek: number, patch: Partial<Jour>) {
    setJours((prev) => prev.map((j) => (j.dayOfWeek === dayOfWeek ? { ...j, ...patch } : j)));
    setSaved(false);
  }

  function appliquerATous(source: Jour) {
    setJours((prev) =>
      prev.map((j) => ({ ...j, openTime: source.openTime, closeTime: source.closeTime }))
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/salons/horaires", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jours }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Impossible d'enregistrer les horaires.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-2.5">
        {jours.map((j) => (
          <div
            key={j.dayOfWeek}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-beige-dark p-3.5"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-noir">{NOMS_JOURS[j.dayOfWeek]}</span>

            <label className="flex items-center gap-1.5 text-xs text-noir/60">
              <input
                type="checkbox"
                checked={!j.isClosed}
                onChange={(e) => update(j.dayOfWeek, { isClosed: !e.target.checked })}
              />
              Ouvert
            </label>

            {!j.isClosed && (
              <>
                <input
                  type="time"
                  value={j.openTime}
                  onChange={(e) => update(j.dayOfWeek, { openTime: e.target.value })}
                  className="rounded-lg border border-beige-dark px-2.5 py-1.5 text-sm outline-none focus:border-or"
                />
                <span className="text-noir/40">—</span>
                <input
                  type="time"
                  value={j.closeTime}
                  onChange={(e) => update(j.dayOfWeek, { closeTime: e.target.value })}
                  className="rounded-lg border border-beige-dark px-2.5 py-1.5 text-sm outline-none focus:border-or"
                />
                <button
                  type="button"
                  onClick={() => appliquerATous(j)}
                  className="ml-auto text-xs text-or-dark hover:underline"
                >
                  Appliquer à tous les jours
                </button>
              </>
            )}
            {j.isClosed && <span className="text-xs text-noir/40">Fermé</span>}
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-700">Horaires enregistrés.</p>}

      <Button onClick={handleSave} disabled={saving} className="mt-5 w-full sm:w-auto">
        {saving ? "Enregistrement..." : "Enregistrer les horaires"}
      </Button>
    </div>
  );
}
