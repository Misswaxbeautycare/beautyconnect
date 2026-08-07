"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ChevronRight } from "lucide-react";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/pro/fonctionnalites", label: "Fonctionnalités" },
  { href: "/pro/temoignages", label: "Témoignages" },
  { href: "/pro/abonnement", label: "Tarifs" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Aide et assistance" },
];

export function ProMenuDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-noir hover:bg-beige"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-noir/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg text-noir">Pour les professionnels</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-noir/60 hover:bg-beige"
              >
                <X size={18} />
              </button>
            </div>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-6 flex items-center justify-between rounded-2xl border border-beige-dark px-4 py-4 font-medium text-or-dark"
            >
              Connectez-vous ou inscrivez-vous
              <ArrowRight size={16} />
            </Link>

            <div className="mt-4 divide-y divide-beige-dark rounded-2xl border border-beige-dark">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-4 text-noir hover:bg-beige"
                >
                  {l.label}
                  <ChevronRight size={16} className="text-noir/30" />
                </Link>
              ))}
            </div>

            <Link
              href="/recherche"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-between rounded-2xl border border-beige-dark px-4 py-4 font-medium text-noir"
            >
              Pour les clients
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
