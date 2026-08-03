"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salonSchema, type SalonInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, User } from "lucide-react";
import {
  MAX_SALON_PHOTOS,
  MAX_IMAGE_SIZE_MB,
  validateImageFile,
  cropToSquare,
} from "@/lib/uploads";

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
  const [logoFile, setLogoFile] = useState<Photo | null>(null);
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
    e.target.value = "";

    const remainingSlots = MAX_SALON_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setError(`Vous avez déjà ${MAX_SALON_PHOTOS} photos, le maximum autorisé.`);
      return;
    }

    const toAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Seulement ${remainingSlots} photo(s) supplémentaire(s) ajoutée(s) — maximum ${MAX_SALON_PHOTOS} au total.`);
    }

    for (const file of toAdd) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setPhotos((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  }

  async function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const cropped = await cropToSquare(file);
      setLogoFile({ file: cropped, previewUrl: URL.createObjectURL(cropped) });
    } catch {
      setError("Impossible de traiter cette image, réessayez avec une autre.");
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadOne(photo: Photo): Promise<string> {
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
    return publicUrlData.publicUrl;
  }

  async function onSubmit(data: SalonInput) {
    setError(null);
    setUploading(true);
    try {
      const photoUrls: string[] = [];
      for (const photo of photos) {
        photoUrls.push(await uploadOne(photo));
      }
      const logoUrl = logoFile ? await uploadOne(logoFile) : null;
      setUploading(false);

      const res = await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photoUrls, logoUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Une erreur est survenue.");
        return;
      }

      router.push("/pro/dashboard");
      router.refresh();
    } catch (err) {
      setUploading(false);
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
        <label className="text-sm text-noir/70">Photo de profil du salon</label>
        <p className="mt-1 text-xs text-noir/40">
          Recadrée automatiquement en carré, JPG/PNG/WebP, {MAX_IMAGE_SIZE_MB} Mo max.
          Utilisée comme photo d&apos;identité de votre salon partout sur le site.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-beige-dark bg-beige">
            {logoFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoFile.previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User size={22} className="text-noir/30" />
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoSelected}
            className="block flex-1 text-sm text-noir/70 file:mr-4 file:rounded-full file:border-0 file:bg-beige file:px-4 file:py-2 file:text-sm file:font-medium file:text-noir hover:file:bg-beige-dark"
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label className="text-sm text-noir/70">Photos du salon</label>
          <span className="text-xs text-noir/40">{photos.length}/{MAX_SALON_PHOTOS}</span>
        </div>
        <p className="mt-1 text-xs text-noir/40">
          {MAX_SALON_PHOTOS} photos maximum, JPG/PNG/WebP, {MAX_IMAGE_SIZE_MB} Mo max chacune.
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={photos.length >= MAX_SALON_PHOTOS}
          onChange={handleFilesSelected}
          className="mt-2 block w-full text-sm text-noir/70 file:mr-4 file:rounded-full file:border-0 file:bg-beige file:px-4 file:py-2 file:text-sm file:font-medium file:text-noir hover:file:bg-beige-dark disabled:opacity-40"
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
