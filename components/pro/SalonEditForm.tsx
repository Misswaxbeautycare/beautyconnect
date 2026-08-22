"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salonSchema, type SalonInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, User } from "lucide-react";
import { countries } from "@/lib/countries";
import {
  MAX_IMAGE_SIZE_MB,
  validateImageFile,
  cropToSquare,
} from "@/lib/uploads";

type Category = { id: string; name: string };
type ExistingPhoto = { id: string; url: string };

interface NewPhoto {
  file: File;
  previewUrl: string;
}

interface SalonEditFormProps {
  categories: Category[];
  maxPhotos: number;
  salon: {
    name: string;
    description: string | null;
    address: string | null;
    city: string;
    country: string;
    postalCode: string | null;
    phone: string | null;
    logoUrl: string | null;
    domicileZone: string | null;
    deplacementZone: string | null;
    deplacementBaseFee: number | null;
    deplacementFeePerKm: number | null;
    photos: ExistingPhoto[];
    categories: { categoryId: string }[];
  };
}

export function SalonEditForm({ categories, maxPhotos, salon }: SalonEditFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(salon.photos);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [logo, setLogo] = useState<NewPhoto | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(salon.logoUrl);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SalonInput>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: salon.name,
      description: salon.description ?? "",
      address: salon.address ?? "",
      city: salon.city,
      country: salon.country,
      postalCode: salon.postalCode ?? "",
      phone: salon.phone ?? "",
      categoryIds: salon.categories.map((c) => c.categoryId),
      domicileZone: salon.domicileZone ?? "",
      deplacementZone: salon.deplacementZone ?? "",
      deplacementBaseFee: salon.deplacementBaseFee ?? undefined,
      deplacementFeePerKm: salon.deplacementFeePerKm ?? undefined,
    } as unknown as SalonInput,
  });

  const selectedCategoryIds = watch("categoryIds") ?? [];
  const totalPhotoCount = existingPhotos.length + newPhotos.length;

  function toggleCategory(id: string) {
    const current = selectedCategoryIds;
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setValue("categoryIds", next, { shouldValidate: true });
  }

  function removeExistingPhoto(id: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    const remainingSlots = maxPhotos - totalPhotoCount;
    if (remainingSlots <= 0) {
      setError(`Vous avez déjà ${maxPhotos} photos, le maximum autorisé.`);
      return;
    }

    const toAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Seulement ${remainingSlots} photo(s) supplémentaire(s) ajoutée(s) — maximum ${maxPhotos} au total.`);
    }

    for (const file of toAdd) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setNewPhotos((prev) => [
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
      const previewUrl = URL.createObjectURL(cropped);
      setLogo({ file: cropped, previewUrl });
      setLogoPreview(previewUrl);
    } catch {
      setError("Impossible de traiter cette image, réessayez avec une autre.");
    }
  }

  async function uploadOne(photo: NewPhoto): Promise<string> {
    const ext = photo.file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("salon-photos")
      .upload(path, photo.file, { upsert: false });

    if (uploadError) {
      throw new Error(`Échec de l'envoi d'une photo : ${uploadError.message}.`);
    }

    const { data: publicUrlData } = supabase.storage.from("salon-photos").getPublicUrl(path);
    return publicUrlData.publicUrl;
  }

  async function onSubmit(data: SalonInput) {
    setError(null);
    setUploading(true);
    try {
      const newPhotoUrls: string[] = [];
      for (const photo of newPhotos) {
        newPhotoUrls.push(await uploadOne(photo));
      }
      const logoUrl = logo ? await uploadOne(logo) : salon.logoUrl;
      setUploading(false);

      const res = await fetch("/api/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          keepPhotoIds: existingPhotos.map((p) => p.id),
          newPhotoUrls,
          logoUrl,
        }),
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
          <label className="text-sm text-noir/70">Pays</label>
          <select
            {...register("country")}
            className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.label}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-noir/70">Téléphone</label>
        <input
          {...register("phone")}
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
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
        <label className="text-sm text-noir/70">Zone d&apos;intervention à domicile (optionnel)</label>
        <input
          {...register("domicileZone")}
          placeholder="Ex: Ixelles et environs — adresse exacte donnée après réservation"
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
        <p className="mt-1 text-xs text-noir/40">
          Affiché à la place de votre adresse si vous proposez des prestations à domicile.
        </p>
      </div>

      <div>
        <label className="text-sm text-noir/70">Zone de déplacement chez la cliente (optionnel)</label>
        <input
          {...register("deplacementZone")}
          placeholder="Ex: Bruxelles et 15km alentour"
          className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
        />
        <p className="mt-1 text-xs text-noir/40">
          Affiché si vous proposez des prestations où vous vous déplacez chez la cliente.
        </p>
      </div>

      <div>
        <label className="text-sm text-noir/70">Frais de déplacement (optionnel)</label>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.5"
              min="0"
              max="200"
              {...register("deplacementBaseFee", { valueAsNumber: true })}
              placeholder="Ex: 20"
              className="w-24 rounded-lg border border-beige-dark px-3 py-3 outline-none focus:border-or"
            />
            <span className="text-sm text-noir/50">€ forfait</span>
          </div>
          <span className="text-noir/40">+</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              {...register("deplacementFeePerKm", { valueAsNumber: true })}
              placeholder="Ex: 1"
              className="w-24 rounded-lg border border-beige-dark px-3 py-3 outline-none focus:border-or"
            />
            <span className="text-sm text-noir/50">€ / km</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-noir/40">
          Le forfait couvre le déplacement même pour un trajet très court ; le tarif au km
          s&apos;ajoute ensuite selon la distance réelle jusqu&apos;à la cliente. Ces frais
          s&apos;ajoutent automatiquement au prix de la prestation lors de la réservation.
          Laissez vide si le déplacement est déjà inclus dans vos tarifs.
        </p>
      </div>

      <div>
        <label className="text-sm text-noir/70">Photo de profil du salon</label>
        <p className="mt-1 text-xs text-noir/40">
          Recadrée automatiquement en carré, JPG/PNG/WebP, {MAX_IMAGE_SIZE_MB} Mo max.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-beige-dark bg-beige">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="h-full w-full object-cover" />
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
          <span className="text-xs text-noir/40">{totalPhotoCount}/{maxPhotos}</span>
        </div>
        <p className="mt-1 text-xs text-noir/40">
          {maxPhotos} photos maximum, JPG/PNG/WebP, {MAX_IMAGE_SIZE_MB} Mo max chacune.
        </p>

        {(existingPhotos.length > 0 || newPhotos.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-beige-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(photo.id)}
                  className="absolute right-1 top-1 rounded-full bg-noir/70 p-0.5 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {newPhotos.map((photo, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-or">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-noir/70 p-0.5 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={totalPhotoCount >= maxPhotos}
          onChange={handleFilesSelected}
          className="mt-3 block w-full text-sm text-noir/70 file:mr-4 file:rounded-full file:border-0 file:bg-beige file:px-4 file:py-2 file:text-sm file:font-medium file:text-noir hover:file:bg-beige-dark disabled:opacity-40"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isSubmitting || uploading} className="w-full">
        {uploading ? "Envoi des photos..." : isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
