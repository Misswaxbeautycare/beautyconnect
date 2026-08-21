"use client";

import { useState } from "react";

export function SendReminderButton({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleClick() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reminder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setTimeout(() => setState("idle"), 4000);
        return;
      }
      setState("sent");
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
        className="rounded-full border border-beige-dark px-3 py-1 text-xs font-medium text-noir/70 transition hover:border-or hover:text-noir disabled:opacity-50"
      >
        {state === "loading" && "Envoi..."}
        {state === "sent" && "Rappel envoyé !"}
        {state === "error" && "Erreur"}
        {state === "idle" && "Envoyer un rappel"}
      </button>
      {state === "error" && errorMsg && <p className="text-[11px] text-red-600">{errorMsg}</p>}
    </div>
  );
}
