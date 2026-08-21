"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EnablePushButton } from "@/components/EnablePushButton";

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

  async function dismiss(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
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
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-or-dark px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-beige-dark px-5 py-4">
            <p className="font-display text-lg text-noir">Notifications</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-noir/60 hover:bg-beige"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loaded && notifications.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-noir/40">Aucune notification pour le moment.</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  router.push(destinationHref);
                }}
                className={cn(
                  "group flex w-full cursor-pointer items-start gap-2 border-b border-beige-dark px-5 py-4 text-left hover:bg-beige",
                  !n.isRead && "bg-beige/60"
                )}
              >
                <div className="min-w-0 flex-1">
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
                </div>
                <button
                  onClick={(e) => dismiss(n.id, e)}
                  aria-label="Supprimer cette notification"
                  className="shrink-0 rounded-full p-1 text-noir/30 hover:bg-white hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <EnablePushButton />
        </div>
      )}
    </div>
  );
}
