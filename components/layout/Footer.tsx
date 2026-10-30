import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export async function Footer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <footer className="border-t border-or-dark bg-or text-noir">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white"><Image src="/logo.png" alt="Beauty Connect" width={28} height={33} className="h-7 w-auto" /></span>
            <p className="font-display text-xl font-bold text-noir">Beauty Connect</p>
          </div>
          <p className="mt-2 text-sm text-noir/75">
            Trouvez. Réservez. Rayonnez.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-noir">Clientes</p>
          <ul className="space-y-2 text-sm text-noir/80">
            <li><Link href="/recherche" className="hover:text-white hover:underline">Trouver un professionnel</Link></li>
            <li><Link href="/register" className="hover:text-white hover:underline">Créer un compte</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-noir">Professionnels</p>
          <ul className="space-y-2 text-sm text-noir/80">
            <li><Link href="/pro/dashboard" className="hover:text-white hover:underline">Gérer mon salon</Link></li>
            <li><Link href="/register" className="hover:text-white hover:underline">Rejoindre la plateforme</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-noir">Contact</p>
          <ul className="space-y-2 text-sm text-noir/80">
            <li><Link href="/a-propos" className="hover:text-white hover:underline">À propos</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline">Contact</Link></li>
            {user && (
              <li>
                <LogoutButton className="text-noir/80 hover:text-white hover:underline" />
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-noir/15 py-6 text-center text-xs text-noir/60">
        © {new Date().getFullYear()} Beauty Connect — Tous droits réservés
      </div>
    </footer>
  );
}
