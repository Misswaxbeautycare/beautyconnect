"use client";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";

export type AdminProduct = { id: string; name: string; price: number; imageUrl: string | null; isActive: boolean; isFeatured: boolean; salonId: string; salonName: string };

export default function FeaturedProducts({ initial }: { initial: AdminProduct[] }) {
  const [items, setItems] = useState(initial);
  const save = async (body: object) => fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const toggle = async (id: string, v: boolean) => { setItems((l) => l.map((p) => (p.id === id ? { ...p, isFeatured: v } : p))); await save({ id, isFeatured: v }); };
  const toggleSalon = async (salonId: string, v: boolean) => { setItems((l) => l.map((p) => (p.salonId === salonId ? { ...p, isFeatured: v } : p))); await save({ salonId, isFeatured: v }); };
  const salons = [...new Map(items.map((p) => [p.salonId, p.salonName])).entries()];
  if (!items.length) return <p className="mt-8 text-noir/50">Aucun produit dans les boutiques pour l’instant.</p>;
  return (
    <div className="mt-8 space-y-8">
      {salons.map(([sid, sname]) => {
        const list = items.filter((p) => p.salonId === sid);
        return (
          <section key={sid} className="rounded-3xl border border-beige-dark bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-noir">{sname}</h2>
              <div className="flex gap-2 text-sm">
                <button onClick={() => toggleSalon(sid, true)} className="rounded-full bg-or px-4 py-2 font-semibold text-noir">Tout afficher</button>
                <button onClick={() => toggleSalon(sid, false)} className="rounded-full border-2 border-or px-4 py-2 font-semibold text-or-dark">Tout masquer</button>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-beige p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-noir/60">{formatPrice(p.price)}{!p.isActive && " · masqué par le salon"}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input type="checkbox" checked={p.isFeatured} onChange={(e) => toggle(p.id, e.target.checked)} className="h-5 w-5 accent-[#D4A24A]" />
                    À la une
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
