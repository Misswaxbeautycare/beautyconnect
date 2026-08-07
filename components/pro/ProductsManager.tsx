"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { Trash2, ImagePlus } from "lucide-react";
import { validateImageFile, cropToSquare, MAX_IMAGE_SIZE_MB } from "@/lib/uploads";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
};

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const supabase = createClient();
  const [products, setProducts] = useState(initialProducts);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  async function uploadPhoto(file: File): Promise<string> {
    const cropped = await cropToSquare(file);
    const ext = cropped.name.split(".").pop() ?? "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("salon-photos")
      .upload(path, cropped, { upsert: false });
    if (uploadError) throw new Error(`Échec de l'envoi de la photo : ${uploadError.message}.`);
    const { data } = supabase.storage.from("salon-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = Number(price);
    if (!name || !priceNum || priceNum <= 0) {
      setError("Nom et prix valides requis.");
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = photo ? await uploadPhoto(photo) : undefined;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: priceNum, stock: Number(stock) || 0, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erreur lors de l'ajout.");
        return;
      }
      setProducts((prev) => [data.product, ...prev]);
      setName("");
      setPrice("");
      setStock("");
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExistingPhotoSelected(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploadingFor(id);
    try {
      const imageUrl = await uploadPhoto(file);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl } : p)));
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter cette photo.");
    } finally {
      setUploadingFor(null);
    }
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
      <form onSubmit={handleAdd} className="mt-6 rounded-2xl border border-beige-dark p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-beige-dark bg-beige">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={20} className="text-noir/30" />
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelected}
              className="block w-full text-sm text-noir/70 file:mr-4 file:rounded-full file:border-0 file:bg-beige file:px-4 file:py-2 file:text-sm file:font-medium file:text-noir hover:file:bg-beige-dark"
            />
            <p className="mt-1 text-xs text-noir/40">Photo optionnelle, {MAX_IMAGE_SIZE_MB} Mo max.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
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
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-4 w-full">
          {submitting ? "Ajout..." : "+ Ajouter le produit"}
        </Button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id} className={`overflow-hidden p-0 ${p.isActive ? "" : "opacity-50"}`}>
            <label className="relative block aspect-square w-full cursor-pointer bg-beige">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-noir/30">
                  <ImagePlus size={22} />
                  <span className="text-xs">{uploadingFor === p.id ? "Envoi..." : "Ajouter une photo"}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleExistingPhotoSelected(p.id, e)}
                className="sr-only"
              />
            </label>
            <div className="p-4">
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
            </div>
          </Card>
        ))}
        {products.length === 0 && <p className="text-noir/40">Aucun produit pour le moment.</p>}
      </div>
    </div>
  );
}
