"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SubscriptionActions({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  async function manage() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {hasSubscription ? (
        <Button onClick={manage} disabled={loading}>
          {loading ? "Ouverture..." : "Gérer mon abonnement"}
        </Button>
      ) : (
        <Button onClick={start} disabled={loading}>
          {loading ? "Chargement..." : "Démarrer l'essai gratuit de 7 jours"}
        </Button>
      )}
    </div>
  );
}
