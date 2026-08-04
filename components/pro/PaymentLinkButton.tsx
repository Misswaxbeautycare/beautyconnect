"use client";

import { useState } from "react";

export function PaymentLinkButton({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setState("error");
        setTimeout(() => setState("idle"), 2500);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      className="rounded-full bg-or px-3 py-1 text-xs font-medium text-noir hover:bg-or-dark hover:text-white transition disabled:opacity-50"
    >
      {state === "loading" && "Génération..."}
      {state === "copied" && "Lien copié !"}
      {state === "error" && "Erreur"}
      {state === "idle" && "Relancer le paiement"}
    </button>
  );
}
