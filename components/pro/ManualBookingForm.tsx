"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Service = { id: string; name: string; price: number; durationMin: number };

export function ManualBookingForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"NONE" | "DEPOSIT_PAID" | "FULL_PAID">("NONE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const date = form.get("date") as string;
    const time = form.get("time") as string;

    try {
      const res = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: form.get("serviceId"),
          date: new Date(`${date}T${time}`).toISOString(),
          guestName: form.get("guestName"),
          guestPhone: form.get("guestPhone") || undefined,
          guestEmail: form.get("guestEmail") || undefined,
          notes: form.get("notes") || undefined,
          paymentStatus,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          typeof body.error === "string" ? body.error : "Une erreur est survenue."
        );
        setSubmitting(false);
        return;
      }

      router.push("/pro/agenda");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label className="text-sm text-noir/70">Prestation</label>
        <select
          name="serviceId"
          required
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        >
          <option value="">Choisir une prestation</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {Number(s.price).toFixed(2)} € ({s.durationMin} min)
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-noir/70">Date</label>
          <input
            type="date"
            name="date"
            required
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
        <div>
          <label className="text-sm text-noir/70">Heure</label>
          <input
            type="time"
            name="time"
            required
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-noir/70">Nom de la cliente / du client</label>
        <input
          name="guestName"
          required
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-noir/70">Téléphone</label>
          <input
            name="guestPhone"
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
        <div>
          <label className="text-sm text-noir/70">Email (optionnel)</label>
          <input
            name="guestEmail"
            type="email"
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
          <p className="mt-1 text-xs text-noir/40">
            Si cette personne a déjà un compte, le rendez-vous sera relié à son historique.
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm text-noir/70">Notes (optionnel)</label>
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
      </div>

      <div>
        <label className="text-sm text-noir/70">Paiement</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: "NONE", label: "Paiement sur place" },
            { value: "DEPOSIT_PAID", label: "Acompte payé" },
            { value: "FULL_PAID", label: "Payé intégralement" },
          ].map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setPaymentStatus(opt.value as typeof paymentStatus)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                paymentStatus === opt.value
                  ? "border-noir bg-noir text-white"
                  : "border-beige-dark text-noir/70 hover:border-or"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Ajout..." : "Ajouter le rendez-vous"}
      </Button>
    </form>
  );
}
