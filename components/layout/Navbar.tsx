import Link from "next/link";
import { ReserverButton } from "@/components/layout/ReserverButton";

const links = [
  { href: "/recherche", label: "Trouver un pro" },
  { href: "/boutique", label: "Boutique" },
  { href: "/pro/dashboard", label: "Espace pro" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-beige-dark bg-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-noir">
          Beauty<span className="text-or">Connect</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-noir/70 transition-colors hover:text-or"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-noir/70 hover:text-or md:block">
            Connexion
          </Link>
          <ReserverButton />
        </div>
      </div>
    </header>
  );
}
