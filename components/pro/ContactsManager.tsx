"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function ContactsManager({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone") || undefined,
          email: form.get("email") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
        setSubmitting(false);
        return;
      }
      setContacts((prev) => [...prev, data.contact].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce contact ?")) return;
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-noir">Mon carnet de contacts</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-noir px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
        >
          <Plus size={14} />
          Ajouter un contact
        </button>
      </div>
      <p className="mt-1 text-xs text-noir/50">
        Pour garder les coordonnées d&apos;une cliente sans forcément créer un rendez-vous tout de suite.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-beige-dark p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="name"
              required
              placeholder="Nom"
              className="rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
            />
            <input
              name="phone"
              placeholder="Téléphone"
              className="rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="rounded-lg border border-beige-dark px-3 py-2 text-sm outline-none focus:border-or"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Ajout..." : "Enregistrer"}
          </Button>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="mt-6 text-sm text-noir/40">Aucun contact ajouté pour le moment.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {contacts.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-noir">{c.name}</p>
                <p className="text-xs text-noir/50">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "Aucune coordonnée"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-noir/30 hover:text-red-600"
              >
                <X size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
