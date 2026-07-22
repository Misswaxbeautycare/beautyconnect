import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-beige-dark bg-noir text-beige">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <p className="font-display text-lg text-white">Beauty Connect</p>
          <p className="mt-1 text-xs text-beige/40">Powered by Misswaxbeautycare</p>
          <p className="mt-2 text-sm text-beige/60">
            Réservez. Connectez. Rayonnez.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-or">Clientes</p>
          <ul className="space-y-2 text-sm text-beige/70">
            <li><Link href="/recherche">Trouver un professionnel</Link></li>
            <li><Link href="/register">Créer un compte</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-or">Professionnels</p>
          <ul className="space-y-2 text-sm text-beige/70">
            <li><Link href="/pro/dashboard">Gérer mon salon</Link></li>
            <li><Link href="/register">Rejoindre la plateforme</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-or">Misswaxbeautycare</p>
          <ul className="space-y-2 text-sm text-beige/70">
            <li>À propos</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-beige/40">
        © {new Date().getFullYear()} Beauty Connect — Tous droits réservés
      </div>
    </footer>
  );
}
