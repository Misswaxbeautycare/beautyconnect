"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface Ligne {
  salonId: string;
  salonName: string;
  phone: string | null;
  totalCollecte: number;
  totalCommission: number;
  netAVerser: number;
  nbPaiements: number;
}

export function VersementsList({ lignes: initialLignes }: { lignes: Ligne[] }) {
  const router = useRouter();
  const [lignes, setLignes] = useState(initialLignes);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function marquerVerse(salonId: string) {
    if (!confirm("Confirmer que le virement a bien été envoyé à ce salon ?")) return;
    setLoadingId(salonId);
    const res = await fetch(`/api/admin/versements/${salonId}`, { method: "PATCH" });
    setLoadingId(null);
    if (!res.ok) {
      alert("Impossible de mettre à jour ce versement.");
      return;
    }
    setLignes((prev) => prev.filter((l) => l.salonId !== salonId));
    router.refresh();
  }

  if (lignes.length === 0) {
    return <p className="mt-10 text-noir/40">Aucun versement en attente — tout est à jour.</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {lignes.map((l) => (
        <div key={l.salonId} className="rounded-2xl border border-beige-dark p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-noir">{l.salonName}</p>
              {l.phone && <p className="text-xs text-noir/40">{l.phone}</p>}
              <p className="mt-1 text-xs text-noir/50">
                {l.nbPaiements} paiement{l.nbPaiements > 1 ? "s" : ""} en attente
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-noir/40">
                Collecté {formatPrice(l.totalCollecte)} — commission {formatPrice(l.totalCommission)}
              </p>
              <p className="font-display text-xl text-noir">{formatPrice(l.netAVerser)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => marquerVerse(l.salonId)}
            disabled={loadingId === l.salonId}
            className="mt-3 rounded-full bg-noir px-5 py-2 text-xs font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-50"
          >
            {loadingId === l.salonId ? "..." : "Marquer comme versé"}
          </button>
        </div>
      ))}
    </div>
  );
}
