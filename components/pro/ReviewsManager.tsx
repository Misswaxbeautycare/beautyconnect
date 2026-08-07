"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  replyText: string | null;
  createdAt: string;
}

export function ReviewsManager({ reviews: initialReviews }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReply(id: string) {
    if (draft.trim().length < 2) {
      setError("Écrivez une réponse avant d'envoyer.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyText: draft.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Impossible d'enregistrer la réponse. Réessayez.");
      return;
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, replyText: draft.trim() } : r)));
    setOpenId(null);
    setDraft("");
  }

  if (reviews.length === 0) {
    return <p className="mt-10 text-noir/40">Pas encore d&apos;avis pour le moment.</p>;
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-beige-dark p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-noir">{r.authorName}</p>
            <span className="text-or-dark text-sm">{"★".repeat(r.rating)}</span>
          </div>
          {r.comment && <p className="mt-1.5 text-sm text-noir/60">{r.comment}</p>}
          <p className="mt-1.5 text-xs text-noir/40">{r.createdAt}</p>

          {r.replyText ? (
            <div className="mt-3 rounded-xl bg-beige p-3">
              <p className="text-xs font-semibold text-noir/70">Votre réponse</p>
              <p className="mt-1 text-sm text-noir/70">{r.replyText}</p>
            </div>
          ) : openId === r.id ? (
            <div className="mt-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="Merci pour votre retour..."
                className="w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              <div className="mt-2 flex gap-2">
                <Button size="sm" disabled={saving} onClick={() => submitReply(r.id)}>
                  {saving ? "Envoi..." : "Publier la réponse"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpenId(null);
                    setDraft("");
                    setError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpenId(r.id)}
              className="mt-3 text-sm font-medium text-or-dark hover:underline"
            >
              Répondre
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
