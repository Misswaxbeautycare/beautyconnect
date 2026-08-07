"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { User, Trash2, X } from "lucide-react";
import { validateImageFile, cropToSquare, MAX_IMAGE_SIZE_MB } from "@/lib/uploads";

interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
}

export function TeamMembersManager({ teamMembers }: { teamMembers: TeamMember[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [members, setMembers] = useState(teamMembers);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setRole("");
    setPhoto(null);
    setPhotoPreview(null);
    setError(null);
    setShowForm(false);
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

    try {
      const cropped = await cropToSquare(file);
      setPhoto(cropped);
      setPhotoPreview(URL.createObjectURL(cropped));
    } catch {
      setError("Impossible de traiter cette image, réessayez avec une autre.");
    }
  }

  async function handleAdd() {
    if (name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      let photoUrl: string | undefined;
      if (photo) {
        const ext = photo.name.split(".").pop() ?? "jpg";
        const path = `team/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("salon-photos")
          .upload(path, photo, { upsert: false });
        if (uploadError) {
          throw new Error(`Échec de l'envoi de la photo : ${uploadError.message}.`);
        }
        const { data } = supabase.storage.from("salon-photos").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }

      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role: role.trim() || undefined, photoUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Impossible d'ajouter ce membre.");
        setSaving(false);
        return;
      }

      const { teamMember } = await res.json();
      setMembers((prev) => [...prev, teamMember]);
      setSaving(false);
      resetForm();
      router.refresh();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Retirer ce membre de votre équipe ?")) return;
    const res = await fetch(`/api/team-members/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Impossible de retirer ce membre.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  }

  return (
    <div className="mt-8">
      {members.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="relative flex items-center gap-3 rounded-2xl border border-beige-dark p-4"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-beige">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className="text-noir/30" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-noir">{m.name}</p>
                {m.role && <p className="truncate text-sm text-noir/50">{m.role}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label="Retirer"
                className="absolute right-3 top-3 text-noir/30 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {members.length === 0 && !showForm && (
        <p className="text-noir/40">Aucun membre ajouté pour le moment.</p>
      )}

      {showForm ? (
        <div className="mt-5 rounded-2xl border border-beige-dark p-5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-noir">Nouveau membre</p>
            <button type="button" onClick={resetForm} className="text-noir/40 hover:text-noir">
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-beige-dark bg-beige">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={22} className="text-noir/30" />
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelected}
              className="block flex-1 text-sm text-noir/70 file:mr-4 file:rounded-full file:border-0 file:bg-beige file:px-4 file:py-2 file:text-sm file:font-medium file:text-noir hover:file:bg-beige-dark"
            />
          </div>
          <p className="mt-1 text-xs text-noir/40">JPG/PNG/WebP, {MAX_IMAGE_SIZE_MB} Mo max.</p>

          <div className="mt-4">
            <label className="text-sm text-noir/70">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom"
              className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
            />
          </div>
          <div className="mt-4">
            <label className="text-sm text-noir/70">Spécialité (optionnel)</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex. Onglerie, Coiffure, Soins visage..."
              className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <Button onClick={handleAdd} disabled={saving} className="mt-5 w-full">
            {saving ? "Ajout..." : "Ajouter au trombinoscope"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-5 rounded-full bg-noir px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          + Ajouter un membre
        </button>
      )}
    </div>
  );
}
