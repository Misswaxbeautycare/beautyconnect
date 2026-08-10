"use client";

import { useState } from "react";

export function PaymentLinkButton({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleClick() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setState("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setTimeout(() => setState("idle"), 4000);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setErrorMsg("Connexion impossible.");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
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
      {state === "error" && errorMsg && <p className="text-[11px] text-red-600">{errorMsg}</p>}
    </div>
  );
}
