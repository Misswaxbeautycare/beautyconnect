import Link from "next/link";
import Image from "next/image";
import { Briefcase } from "lucide-react";
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Beauty Connect" width={32} height={38} className="h-8 w-auto shrink-0 sm:h-9" priority />
          <span className="truncate font-display text-lg tracking-tight text-noir sm:text-xl">
            Beauty<span className="text-or">Connect</span>
          </span>
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {isPro && (
            <Link
              href="/pro/dashboard"
              aria-label="Espace professionnel"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-noir/70 hover:bg-beige hover:text-noir md:hidden"
            >
              <Briefcase size={18} />
            </Link>
          )}
          {dbUser ? (
            <NotificationBell destinationHref={isPro ? "/pro/dashboard" : "/client/dashboard"} />
          ) : (
            <Link href="/login" className="hidden text-sm text-noir/70 hover:text-or md:block">
              Connexion
            </Link>
          )}
          <ReserverButton isLoggedIn={Boolean(dbUser)} />
        </div>
      </div>
    </header>
  );
}
