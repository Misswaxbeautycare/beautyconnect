"use client";

import { useMemo, useState } from "react";
import { addDays, format, isSameDay, setHours, setMinutes, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  depositPct: number;
}

interface BookingCalendarProps {
  salonId: string;
  services: Service[];
  // créneaux déjà réservés — récupérés côté serveur, format ISO
  bookedSlots: string[];
  openHour?: number;
  closeHour?: number;
}

export function BookingCalendar({
  salonId,
  services,
  bookedSlots,
  openHour = 9,
  closeHour = 18,
}: BookingCalendarProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(services[0] ?? null);
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i)), []);

  const bookedSet = useMemo(() => new Set(bookedSlots), [bookedSlots]);

  // Le calendrier se met à jour automatiquement selon le jour et la durée du service choisi
  const slots = useMemo(() => {
    if (!selectedService) return [];
    const result: Date[] = [];
    const stepMin = 30;
    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += stepMin) {
        const slot = setMinutes(setHours(selectedDay, h), m);
        if (!bookedSet.has(slot.toISOString())) result.push(slot);
      }
    }
    return result;
  }, [selectedDay, selectedService, bookedSet, openHour, closeHour]);

  async function confirmBooking(paymentType: "DEPOSIT" | "FULL" | "ON_SITE") {
    if (!selectedService || !selectedSlot) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          serviceId: selectedService.id,
          date: selectedSlot.toISOString(),
          paymentType,
        }),
      });

      if (res.status === 401) {
        // Client non connecté : on l'envoie se connecter, puis on le
        // ramène directement ici pour finaliser sa réservation.
        router.push(`/login?redirect=${encodeURIComponent(`/salon/${salonId}`)}`);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Impossible de finaliser la réservation. Réessayez."
        );
        setLoading(false);
        return;
      }

      if (data.confirmed) {
        setConfirmed(true);
        setLoading(false);
        return;
      }

      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        setError("Impossible de démarrer le paiement. Réessayez.");
        setLoading(false);
      }
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-beige-dark p-6">
      {/* Choix de la prestation */}
      <p className="text-sm font-medium text-noir/70">Prestation</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedService(s); setSelectedSlot(null); }}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              selectedService?.id === s.id
                ? "border-or bg-or text-noir"
                : "border-beige-dark text-noir/70 hover:border-or"
            )}
          >
            {s.name} — {formatPrice(s.price)}
          </button>
        ))}
      </div>

      {/* Choix du jour */}
      <p className="mt-6 text-sm font-medium text-noir/70">Jour</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d.toISOString()}
            onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}
            className={cn(
              "flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 text-xs",
              isSameDay(d, selectedDay)
                ? "border-or bg-or text-noir"
                : "border-beige-dark text-noir/70 hover:border-or"
            )}
          >
            <span className="capitalize">{format(d, "EEE", { locale: fr })}</span>
            <span className="text-base font-medium">{format(d, "d")}</span>
          </button>
        ))}
      </div>

      {/* Créneaux horaires disponibles — mis à jour automatiquement */}
      <p className="mt-6 text-sm font-medium text-noir/70">Heure disponible</p>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {slots.map((slot) => (
          <button
            key={slot.toISOString()}
            onClick={() => setSelectedSlot(slot)}
            className={cn(
              "rounded-lg border px-2 py-2 text-xs",
              selectedSlot?.getTime() === slot.getTime()
                ? "border-or bg-or text-noir"
                : "border-beige-dark text-noir/70 hover:border-or"
            )}
          >
            {format(slot, "HH:mm")}
          </button>
        ))}
        {slots.length === 0 && (
          <p className="col-span-full text-sm text-noir/40">Aucun créneau disponible ce jour.</p>
        )}
      </div>

      {selectedService && selectedSlot && !confirmed && (
        <div className="mt-6 border-t border-beige-dark pt-6">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <p className="mb-3 text-sm font-medium text-noir/70">Comment souhaitez-vous régler ?</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={() => confirmBooking("DEPOSIT")}
            >
              Acompte en ligne ({selectedService.depositPct}%)
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={() => confirmBooking("FULL")}
            >
              Payer en ligne (totalité)
            </Button>
            <Button className="flex-1" disabled={loading} onClick={() => confirmBooking("ON_SITE")}>
              Payer sur place
            </Button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="mt-6 border-t border-beige-dark pt-6">
          <p className="text-sm font-medium text-green-700">
            Rendez-vous confirmé ! Vous réglerez directement sur place.
          </p>
        </div>
      )}
    </div>
  );
}
