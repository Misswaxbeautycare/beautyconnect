"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface BlockedSlot {
  id: string;
  date: string;
  durationMin: number;
  reason: string | null;
}

export function BlockedSlotsManager({ initial }: { initial: BlockedSlot[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initial);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setError(null);
    if (!date || !startTime || !endTime) {
      setError("Merci de renseigner la date et les heures de début et de fin.");
      return;
    }
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMin <= 0) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: start.toISOString(), durationMin, reason: reason || undefined }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Impossible de bloquer ce créneau.");
      return;
    }
    const data = await res.json();
    setSlots((prev) => [...prev, data.blockedSlot].sort((a, b) => a.date.localeCompare(b.date)));
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-beige-dark p-5">
        <p className="font-medium text-noir">Bloquer un créneau</p>
        <p className="mt-1 text-xs text-noir/50">
          Empêche toute réservation en ligne sur cette plage horaire, sans créer de vrai rendez-vous.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-noir/60">Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2.5 text-sm outline-none focus:border-or"
            />
          </div>
          <div>
            <label className="text-xs text-noir/60">De</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2.5 text-sm outline-none focus:border-or"
            />
          </div>
          <div>
            <label className="text-xs text-noir/60">À</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2.5 text-sm outline-none focus:border-or"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs text-noir/60">Raison (optionnel, visible uniquement par vous)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Rendez-vous personnel, congés..."
            className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2.5 text-sm outline-none focus:border-or"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={loading}
          className="mt-4 rounded-full bg-noir px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-50"
        >
          {loading ? "Ajout..." : "Bloquer ce créneau"}
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-sm font-medium text-noir/70">Créneaux bloqués à venir</p>
        {slots.length === 0 && <p className="text-sm text-noir/40">Aucune indisponibilité programmée.</p>}
        {slots.map((s) => {
          const start = new Date(s.date);
          const end = new Date(start.getTime() + s.durationMin * 60000);
          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-beige-dark px-4 py-3"
            >
              <div>
                <p className="text-sm text-noir">
                  {start.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" })}
                  {" — "}
                  {start.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                  {" à "}
                  {end.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {s.reason && <p className="text-xs text-noir/50">{s.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                aria-label="Supprimer cette indisponibilité"
                className="text-noir/30 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
