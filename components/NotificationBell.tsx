"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  bookingId: string | null;
  createdAt: string;
}

export function NotificationBell({ destinationHref }: { destinationHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoaded(true);
  }

  useEffect(() => {
    load();
    // On revérifie périodiquement pour refléter les nouveaux rendez-vous
    // sans que la personne doive recharger la page manuellement.
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-noir/70 hover:bg-beige hover:text-noir"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-or-dark" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="fixed inset-x-4 top-16 z-50 mx-auto max-h-96 w-auto max-w-sm overflow-y-auto rounded-2xl border border-beige-dark bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
            <div className="flex items-center justify-between border-b border-beige-dark px-4 py-3">
              <p className="text-sm font-semibold text-noir">Notifications</p>
            </div>
            {loaded && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-noir/40">Aucune notification pour le moment.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  router.push(destinationHref);
                }}
                className={cn(
                  "block w-full border-b border-beige-dark px-4 py-3 text-left last:border-b-0 hover:bg-beige",
                  !n.isRead && "bg-beige/60"
                )}
              >
                <p className="text-sm font-medium text-noir">{n.title}</p>
                <p className="mt-0.5 text-xs text-noir/60">{n.message}</p>
                <p className="mt-1 text-[11px] text-noir/30">
                  {new Date(n.createdAt).toLocaleDateString("fr-BE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
