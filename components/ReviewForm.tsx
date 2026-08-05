"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Choisissez une note.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="text-xs text-green-700">Merci pour votre avis !</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-or px-3 py-1.5 text-xs font-semibold text-noir hover:bg-or-dark hover:text-white transition"
      >
        Laisser un avis
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 w-full rounded-xl border border-beige-dark p-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            className="text-or-dark"
          >
            <Star size={20} fill={(hovered || rating) >= n ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Votre avis (optionnel)"
        rows={2}
        className="mt-2 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button type="submit" disabled={submitting} className="text-xs">
          {submitting ? "Envoi..." : "Envoyer"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-noir/50 hover:underline"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
