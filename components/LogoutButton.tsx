"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ className }: { className?: string }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Rechargement complet (pas router.push) : garantit que le serveur
    // oublie bien la session, comme pour la connexion.
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ??
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
      }
    >
      <LogOut size={16} className="shrink-0" />
      Déconnexion
    </button>
  );
}
