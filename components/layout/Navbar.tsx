import Link from "next/link";
import { ReserverButton } from "@/components/layout/ReserverButton";
import { NotificationBell } from "@/components/NotificationBell";
import { getCurrentDbUser } from "@/lib/auth";

const links = [
  { href: "/recherche", label: "Trouver un pro" },
  { href: "/pro/dashboard", label: "Espace pro" },
];

export async function Navbar() {
  const dbUser = await getCurrentDbUser();
  const isPro = dbUser?.role === "PROFESSIONAL" || dbUser?.role === "ADMIN";

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
          {dbUser ? (
            <NotificationBell destinationHref={isPro ? "/pro/dashboard" : "/client/dashboard"} />
          ) : (
            <Link href="/login" className="hidden text-sm text-noir/70 hover:text-or md:block">
              Connexion
            </Link>
          )}
          <ReserverButton />
        </div>
      </div>
    </header>
  );
}
