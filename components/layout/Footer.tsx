import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-noir/10 bg-terracotta-dark text-noir">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <p className="font-display text-lg text-noir">Beauty Connect</p>
          <p className="mt-1 text-xs text-noir/50">Powered by Misswaxbeautycare</p>
          <p className="mt-2 text-sm text-noir/70">
            Réservez. Connectez. Rayonnez.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-noir">Clientes</p>
          <ul className="space-y-2 text-sm text-noir/70">
            <li><Link href="/recherche">Trouver un professionnel</Link></li>
            <li><Link href="/register">Créer un compte</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-noir">Professionnels</p>
          <ul className="space-y-2 text-sm text-noir/70">
            <li><Link href="/pro/dashboard">Gérer mon salon</Link></li>
            <li><Link href="/register">Rejoindre la plateforme</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-noir">Misswaxbeautycare</p>
          <ul className="space-y-2 text-sm text-noir/70">
            <li>À propos</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-noir/10 py-6 text-center text-xs text-noir/50">
        © {new Date().getFullYear()} Beauty Connect — Tous droits réservés
      </div>
    </footer>
  );
}
