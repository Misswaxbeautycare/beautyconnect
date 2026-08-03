"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export function CopySalonLink({ salonId }: { salonId: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/salon/${salonId}`);
  }, [salonId]);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-beige-dark bg-beige px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-noir/60">Lien à partager à vos clientes</p>
        <p className="truncate text-sm text-noir">{url || "…"}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-noir px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copié !" : "Copier"}
      </button>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-noir/15 px-4 py-2 text-xs font-semibold text-noir hover:bg-white transition"
        >
          <ExternalLink size={14} />
          Voir ma page
        </a>
      )}
    </div>
  );
}
