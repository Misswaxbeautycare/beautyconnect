"use client";

import { useState } from "react";

export function RequestReviewButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/client/dashboard`;
    await navigator.clipboard.writeText(
      `Merci pour votre visite ! Vous pouvez laisser votre avis ici : ${url}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full bg-or px-3 py-1 text-xs font-medium text-noir hover:bg-or-dark hover:text-white transition"
    >
      {copied ? "Message copié !" : "Demander un avis"}
    </button>
  );
}
