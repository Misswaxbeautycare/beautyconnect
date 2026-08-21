"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";

interface MenuLink {
  href: string;
  label: string;
}

interface MenuSection {
  title: string;
  links: MenuLink[];
}

const sections: MenuSection[] = [
  {
    title: "Mon salon",
    links: [
      { href: "/pro/salon/modifier", label: "Modifier mon salon" },
      { href: "/pro/horaires", label: "Horaires d'ouverture" },
    ],
  },
  {
    title: "Vente",
    links: [
      { href: "/pro/services", label: "Mes prestations" },
      { href: "/pro/produits", label: "Ma boutique" },
    ],
  },
  {
    title: "Relation client",
    links: [
      { href: "/pro/equipe", label: "Mon équipe" },
      { href: "/pro/avis", label: "Mes avis" },
      { href: "/pro/visites", label: "Visites de ma fiche" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/pro/abonnement", label: "Mon abonnement" },
      { href: "/pro/parametres", label: "Paramètres" },
    ],
  },
];

export function DashboardMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu de gestion"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-beige-dark text-noir transition hover:bg-beige"
      >
        <Menu size={19} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-noir">Gestion du salon</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-noir/60 hover:bg-beige"
            >
              <X size={18} />
            </button>
          </div>

            <div className="mt-6 flex flex-col gap-6">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-noir/40">
                    {section.title}
                  </p>
                  <div className="divide-y divide-beige-dark rounded-2xl border border-beige-dark">
                    {section.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-4 py-3.5 text-sm text-noir hover:bg-beige"
                      >
                        {l.label}
                        <ChevronRight size={15} className="text-noir/30" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-2xl bg-or px-4 py-3.5 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white"
                >
                  Administration
                  <ChevronRight size={15} />
                </Link>
              )}
            </div>
        </div>
      )}
    </>
  );
}
