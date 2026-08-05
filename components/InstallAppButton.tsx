"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    // Détecte si l'app est déjà installée / lancée en mode standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    // Pas d'événement disponible (souvent iOS Safari, qui n'a pas
    // beforeinstallprompt) — on explique la marche à suivre.
    setShowIosHint(true);
  }

  if (installed) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-full bg-or px-5 py-2.5 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white transition"
      >
        <Download size={15} />
        Installer l&apos;application
      </button>
      {showIosHint && (
        <p className="mt-2 text-xs text-noir/50">
          Sur iPhone (Safari) : appuyez sur l&apos;icône de partage, puis
          &laquo; Sur l&apos;écran d&apos;accueil &raquo;.
        </p>
      )}
    </div>
  );
}
