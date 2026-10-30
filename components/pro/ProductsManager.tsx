"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { Trash2, ImagePlus, X, Plus, Pencil } from "lucide-react";
import { validateImageFile, cropToSquare, MAX_IMAGE_SIZE_MB } from "@/lib/uploads";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  imageUrls: string[];
};

const MAX_PHOTOS_PER_PRODUCT = 9;

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const supabase = createClient();
  const [products, setProducts] = useState(initialProducts);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", price: "", stock: "", description: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  function startEdit(p: Product) {
    setEditId(p.id);
    setEdit({ name: p.name, price: String(p.price), stock: String(p.stock), description: p.description ?? "" });
  }
  async function saveEdit(id: string) {
    const price = parseFloat(edit.price.replace(",", "."));
    if (!edit.name.trim() || isNaN(price) || price < 0) return alert("Vérifie le nom et le prix.");
    setSavingEdit(true);
    const body = { name: edit.name.trim(), price, stock: Math.max(0, parseInt(edit.stock) || 0), description: edit.description.trim() };
    const res = await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSavingEdit(false);
    if (!res.ok) return alert("Enregistrement impossible, réessaie.");
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...body, description: body.description || null } : p)));
    setEditId(null);
  }
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
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

  function handlePhotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS_PER_PRODUCT - photos.length;
    const toAdd = files.slice(0, remaining);
    for (const file of toAdd) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setPhotos((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }

  function removeNewPhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
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
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        uploadedUrls.push(await uploadPhoto(file));
      }
      const [imageUrl, ...imageUrls] = uploadedUrls;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: priceNum, stock: Number(stock) || 0, imageUrl, imageUrls }),
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
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function addPhotosToProduct(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const product = products.find((p) => p.id === id);
    if (!product) return;
    const currentCount = (product.imageUrl ? 1 : 0) + product.imageUrls.length;
    const remaining = MAX_PHOTOS_PER_PRODUCT - currentCount;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS_PER_PRODUCT} photos par produit.`);
      return;
    }
    const toAdd = files.slice(0, remaining);
    for (const file of toAdd) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploadingFor(id);
    try {
      const uploaded: string[] = [];
      for (const file of toAdd) {
        uploaded.push(await uploadPhoto(file));
      }

      const newImageUrl = product.imageUrl ?? uploaded[0];
      const newImageUrls = product.imageUrl
        ? [...product.imageUrls, ...uploaded]
        : [...product.imageUrls, ...uploaded.slice(1)];

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, imageUrl: newImageUrl, imageUrls: newImageUrls } : p))
      );
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: newImageUrl, imageUrls: newImageUrls }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter cette photo.");
    } finally {
      setUploadingFor(null);
    }
  }

  async function removeProductPhoto(id: string, allPhotos: string[], index: number) {
    const remaining = allPhotos.filter((_, i) => i !== index);
    const [newImageUrl, ...newImageUrls] = remaining;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imageUrl: newImageUrl ?? null, imageUrls: newImageUrls } : p))
    );
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: newImageUrl ?? null, imageUrls: newImageUrls }),
    });
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
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photoPreviews.map((url, i) => (
            <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-beige-dark bg-beige">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewPhoto(i)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-noir/70 text-white"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <label className="flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-beige-dark text-noir/40 hover:border-or hover:text-or-dark">
            <ImagePlus size={18} />
            <span className="text-[10px]">Photos</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotosSelected}
              className="sr-only"
            />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-noir/40">
          Plusieurs photos possibles ({MAX_PHOTOS_PER_PRODUCT} max), {MAX_IMAGE_SIZE_MB} Mo max chacune.
        </p>

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
        {products.map((p) => {
          const allPhotos = [...(p.imageUrl ? [p.imageUrl] : []), ...p.imageUrls];
          return (
            <Card key={p.id} className={`overflow-hidden p-0 ${p.isActive ? "" : "opacity-50"}`}>
              <div className="flex gap-1.5 overflow-x-auto bg-beige p-1.5">
                {allPhotos.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={p.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeProductPhoto(p.id, allPhotos, i)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-noir/70 text-white"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-beige-dark text-noir/40 hover:border-or hover:text-or-dark">
                  {uploadingFor === p.id ? <span className="text-[10px]">Envoi...</span> : <Plus size={18} />}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => addPhotosToProduct(p.id, e)}
                    className="sr-only"
                    disabled={uploadingFor === p.id}
                  />
                </label>
              </div>
              <div className="p-4">
                {editId === p.id ? (
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-noir/60">Nom
                      <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or" /></label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-medium text-noir/60">Prix (€)
                        <input type="number" step="0.01" min="0" inputMode="decimal" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or" /></label>
                      <label className="text-xs font-medium text-noir/60">Stock
                        <input type="number" min="0" value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: e.target.value })} className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or" /></label>
                    </div>
                    <label className="text-xs font-medium text-noir/60">Description
                      <textarea rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="mt-1 w-full rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or" /></label>
                    <div className="flex gap-2">
                      <button type="button" disabled={savingEdit} onClick={() => saveEdit(p.id)} className="flex-1 rounded-full bg-or px-4 py-2 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white">{savingEdit ? "…" : "Enregistrer"}</button>
                      <button type="button" onClick={() => setEditId(null)} className="rounded-full border-2 border-or px-4 py-2 text-sm font-semibold text-or-dark">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-noir">{p.name}</p>
                    <p className="mt-1 text-sm text-noir/60">{formatPrice(p.price)} · Stock : {p.stock}</p>
                    {p.description && <p className="mt-1 line-clamp-2 text-xs text-noir/50">{p.description}</p>}
                    <button type="button" onClick={() => startEdit(p)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-or-dark hover:underline"><Pencil size={14} />Modifier le nom, le prix, le stock</button>
                  </>
                )}
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
          );
        })}
        {products.length === 0 && <p className="text-noir/40">Aucun produit pour le moment.</p>}
      </div>
    </div>
  );
}
