"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareAppButton({
  className = "",
  label = "Partager l'application",
}: {
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const shareData = {
      title: "Beauty Connect",
      text: "Réservez. Connectez. Rayonnez. Découvrez Beauty Connect, la plateforme de réservation beauté.",
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // annulé par la personne — rien à faire
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex items-center gap-1.5 rounded-full border border-noir/15 px-5 py-2.5 text-sm font-semibold text-noir hover:bg-beige transition ${className}`}
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "Lien copié !" : label}
    </button>
  );
}
