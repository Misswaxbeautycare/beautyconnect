"use client";

import { useState } from "react";
import { MessageCircle, Copy, Check } from "lucide-react";

export function RequestReviewButton({ phone }: { phone?: string | null }) {
  const [copied, setCopied] = useState(false);

  function buildMessage() {
    const url = `${window.location.origin}/client/dashboard`;
    return `Merci pour votre visite ! Vous pouvez laisser votre avis ici : ${url}`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    // Numéro nettoyé (garde uniquement les chiffres, wa.me n'accepte pas
    // les espaces/tirets/le signe +)
    const cleanPhone = (phone ?? "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  }

  if (phone) {
    return (
      <button
        type="button"
        onClick={handleWhatsApp}
        className="flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition"
      >
        <MessageCircle size={13} />
        Demander un avis (WhatsApp)
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-full bg-or px-3 py-1 text-xs font-medium text-noir hover:bg-or-dark hover:text-white transition"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Message copié !" : "Demander un avis"}
    </button>
  );
}
