"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salonSchema, type SalonInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

type Category = { id: string; name: string };

interface Photo {
  file: File;
  previewUrl: string;
}

export function SalonCreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SalonInput>({
    resolver: zodResolver(salonSchema),
    defaultValues: { categoryIds: [], country: "Belgique" } as unknown as SalonInput,
  });

  const selectedCategoryIds = watch("categoryIds") ?? [];

  function toggleCategory(id: string) {
    const current = selectedCategoryIds;
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setValue("categoryIds", next, { shouldValidate: true });
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPhotos = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos(): Promise<string[]> {
    if (photos.length === 0) return [];
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("salon-photos")
          .upload(path, photo.file, { upsert: false });

        if (uploadError) {
          throw new Error(
            `Échec de l'envoi d'une photo : ${uploadError.message}. Vérifiez que le bucket "salon-photos" existe et est public dans Supabase (Storage).`
          );
        }

        const { data: publicUrlData } = supabase.storage.from("salon-photos").getPublicUrl(path);
        urls.push(publicUrlData.publicUrl);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: SalonInput) {
    setError(null);
    try {
      const photoUrls = await uploadPhotos();

      const res = await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photoUrls }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Une erreur est survenue.");
        return;
      }

      router.push("/pro/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      <div>
        <label className="text-sm text-noir/70">Nom du salon</label>
        <input
          {...register("name")}
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm text-noir/70">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-noir/70">Adresse</label>
          <input
            {...register("address")}
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
        <div>
          <label className="text-sm text-noir/70">Code postal</label>
          <input
            {...register("postalCode")}
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm text-noir/70">Ville</label>
          <input
            {...register("city")}
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
        </div>
        <div>
          <label className="text-sm text-noir/70">Téléphone</label>
          <input
            {...register("phone")}
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-noir/70">Catégories proposées</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategoryIds.includes(cat.id);
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-noir bg-noir text-white"
                    : "border-beige-dark text-noir/70 hover:border-or"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
        {errors.categoryIds && (
          <p className="mt-1 text-xs text-red-600">{errors.categoryIds.message as string}</p>
        )}
      </div>

      <div>
        <label className="text-sm text-noir/70">Photos du salon</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          className="mt-2 block w-full text-sm text-noir/70 file:mr-4 file:rounded-full file:border-0 file:bg-beige file:px-4 file:py-2 file:text-sm file:font-medium file:text-noir hover:file:bg-beige-dark"
        />
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-beige-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-noir/70 p-0.5 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting || uploading} className="w-full">
        {uploading ? "Envoi des photos..." : isSubmitting ? "Création..." : "Créer mon salon"}
      </Button>
    </form>
  );
}
