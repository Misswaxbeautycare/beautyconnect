"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { subscriptionPlans } from "@/lib/subscription-plans";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";

export function SubscriptionActions({
  hasSubscription,
  currentPlan,
}: {
  hasSubscription: boolean;
  currentPlan: string | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(planId: string) {
    setError(null);
    setLoading(planId);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setLoading(null);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(null);
    }
  }

  async function manage() {
    setError(null);
    setLoading("manage");
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(null);
    }
  }

  if (hasSubscription) {
    return (
      <div className="mt-6">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <Button onClick={manage} disabled={loading === "manage"}>
          {loading === "manage" ? "Ouverture..." : "Gérer mon abonnement"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-5 ${
              plan.highlighted ? "border-or bg-or/5" : "border-beige-dark"
            }`}
          >
            {plan.highlighted && (
              <span className="mb-2 inline-block rounded-full bg-or px-2.5 py-0.5 text-[11px] font-semibold text-noir">
                Populaire
              </span>
            )}
            <p className="font-display text-lg text-noir">{plan.name}</p>
            <p className="mt-1">
              <span className="text-2xl font-semibold text-noir">{formatPrice(plan.price)}</span>
              <span className="text-sm text-noir/50">/mois</span>
            </p>
            <p className="mt-1 text-xs text-noir/40">après 7 jours d&apos;essai gratuit</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-noir/70">
                  <Check size={14} className="mt-0.5 shrink-0 text-or-dark" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => start(plan.id)}
              disabled={loading !== null}
              className="mt-5 w-full"
              variant={plan.highlighted ? "primary" : "outline"}
            >
              {loading === plan.id ? "Chargement..." : "Choisir"}
            </Button>
          </div>
        ))}
      </div>
      {currentPlan && (
        <p className="mt-3 text-xs text-noir/40">Formule précédente : {currentPlan}</p>
      )}
    </div>
  );
}
