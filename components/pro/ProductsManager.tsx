"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
};

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = Number(price);
    if (!name || !priceNum || priceNum <= 0) {
      setError("Nom et prix valides requis.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: priceNum, stock: Number(stock) || 0 }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erreur lors de l'ajout.");
      return;
    }
    setProducts((prev) => [data.product, ...prev]);
    setName("");
    setPrice("");
    setStock("");
  }

  async function toggleActive(id: string, isActive: boolean) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)));
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mt-6 grid gap-3 rounded-2xl border border-beige-dark p-5 sm:grid-cols-4">
        <input
          placeholder="Nom du produit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or sm:col-span-2"
        />
        <input
          placeholder="Prix (€)"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
        />
        <input
          placeholder="Stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
        />
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
        <Button type="submit" disabled={submitting} className="sm:col-span-4">
          {submitting ? "Ajout..." : "+ Ajouter le produit"}
        </Button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className={`p-4 ${p.isActive ? "" : "opacity-50"}`}>
            <p className="font-medium text-noir">{p.name}</p>
            <p className="mt-1 text-sm text-noir/60">{formatPrice(p.price)} · Stock : {p.stock}</p>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleActive(p.id, !p.isActive)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  p.isActive ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {p.isActive ? "En vente" : "Masqué"}
              </button>
              <button type="button" onClick={() => remove(p.id)} className="text-noir/30 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
        {products.length === 0 && <p className="text-noir/40">Aucun produit pour le moment.</p>}
      </div>
    </div>
  );
}
