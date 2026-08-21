"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function EnablePushButton() {
  const [status, setStatus] = useState<"idle" | "unsupported" | "denied" | "enabling" | "enabled">("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "enabled" : "idle"))
      .catch(() => {});
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("unsupported");
      return;
    }
    setStatus("enabling");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "idle");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("enabled");
    } catch (err) {
      console.error("[push] Échec de l'activation", err);
      setStatus("idle");
    }
  }

  if (status === "unsupported" || status === "enabled") return null;

  return (
    <div className="border-t border-beige-dark px-4 py-3">
      <button
        type="button"
        onClick={enable}
        disabled={status === "enabling" || status === "denied"}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-beige px-4 py-2 text-xs font-medium text-noir transition hover:bg-beige-dark disabled:opacity-50"
      >
        <BellRing size={13} />
        {status === "enabling" && "Activation..."}
        {status === "denied" && "Notifications bloquées par le navigateur"}
        {status === "idle" && "Activer les notifications, même app fermée"}
      </button>
    </div>
  );
}
