"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuyProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/products/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        setError(typeof data.error === "string" ? data.error : "Impossible d'acheter ce produit.");
        setLoading(false);
        return;
      }
      router.push(data.checkoutUrl);
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-or px-4 py-2 text-xs font-semibold text-noir hover:bg-or-dark hover:text-white transition disabled:opacity-50"
      >
        {loading ? "..." : "Acheter"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
