"use client";

import { useMemo, useState } from "react";
import { addDays, format, isSameDay, setHours, setMinutes, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Check, Plus, ShoppingBasket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPriceForCountry } from "@/lib/countries";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { distanceKm } from "@/lib/geo";

interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  depositPct: number;
  modes: string[];
}

interface BookingCalendarProps {
  salonId: string;
  services: Service[];
  // créneaux déjà réservés — récupérés côté serveur, format ISO
  bookedSlots: string[];
  onlinePayment: boolean;
  openHour?: number;
  closeHour?: number;
  salonLatitude?: number | null;
  salonLongitude?: number | null;
  deplacementBaseFee?: number | null;
  deplacementFeePerKm?: number | null;
  country?: string;
}

type Step = "prestations" | "creneau" | "paiement" | "confirme";

export function BookingCalendar({
  salonId,
  services,
  bookedSlots,
  onlinePayment,
  openHour = 9,
  closeHour = 18,
  salonLatitude,
  salonLongitude,
  deplacementBaseFee,
  deplacementFeePerKm,
  country,
}: BookingCalendarProps) {
  const router = useRouter();
  // Prix affichés dans la devise du pays du salon (€ Belgique, $ + FC RDC...).
  const formatPrice = (amount: number) => formatPriceForCountry(amount, country);
  const [step, setStep] = useState<Step>("prestations");
  const [showCart, setShowCart] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(services[0] ? [services[0].id] : []);
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Déplacement (le pro se déplace chez la cliente) — adresse et frais
  // calculés à la volée via géocodage + distance réelle jusqu'au salon.
  const [deplacementAddress, setDeplacementAddress] = useState("");
  const [deplacementFee, setDeplacementFee] = useState<number | null>(null);
  const [deplacementDistance, setDeplacementDistance] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds]
  );
  const hasDeplacementService = selectedServices.some((s) => s.modes.includes("DEPLACEMENT"));
  const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalPrice = servicesPrice + (hasDeplacementService && deplacementFee ? deplacementFee : 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);
  // Pour l'acompte, on applique le % de la première prestation choisie
  const depositPct = selectedServices[0]?.depositPct ?? 30;

  async function calculerFraisDeplacement() {
    if (!deplacementAddress.trim() || salonLatitude == null || salonLongitude == null) return;
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(deplacementAddress)}`);
      const data = await res.json();
      if (!res.ok) {
        setGeocodeError(typeof data.error === "string" ? data.error : "Adresse introuvable.");
        setDeplacementFee(null);
        return;
      }
      const distance = distanceKm(salonLatitude, salonLongitude, data.lat, data.lng);
      const fee = (deplacementBaseFee ?? 0) + (deplacementFeePerKm ?? 0) * distance;
      setDeplacementDistance(distance);
      setDeplacementFee(Math.round(fee * 100) / 100);
    } catch {
      setGeocodeError("Impossible de localiser cette adresse pour le moment.");
      setDeplacementFee(null);
    } finally {
      setGeocoding(false);
    }
  }

  function toggleService(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSelectedSlot(null);
  }

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i)), []);

  const bookedSet = useMemo(() => new Set(bookedSlots), [bookedSlots]);

  // Le calendrier se met à jour automatiquement selon le jour et la durée totale choisie
  const slots = useMemo(() => {
    if (selectedServices.length === 0) return [];
    const result: Date[] = [];
    const stepMin = 30;
    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += stepMin) {
        const slot = setMinutes(setHours(selectedDay, h), m);
        if (!bookedSet.has(slot.toISOString())) result.push(slot);
      }
    }
    return result;
  }, [selectedDay, selectedServices.length, bookedSet, openHour, closeHour]);

  async function confirmBooking(paymentType: "DEPOSIT" | "FULL" | "ON_SITE") {
    if (selectedServices.length === 0 || !selectedSlot) return;
    if (hasDeplacementService && !deplacementFee) {
      setError("Merci de renseigner votre adresse et de calculer les frais de déplacement.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const [primary, ...rest] = selectedServices;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          serviceId: primary.id,
          additionalServiceIds: rest.map((s) => s.id),
          date: selectedSlot.toISOString(),
          paymentType,
          ...(hasDeplacementService
            ? { deplacementAddress, deplacementFeeAmount: deplacementFee }
            : {}),
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
        setStep("confirme");
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

  if (confirmed || step === "confirme") {
    return (
      <div className="rounded-2xl border border-beige-dark bg-white p-6">
        <p className="text-sm font-medium text-green-700">
          Rendez-vous confirmé ! Vous réglerez directement sur place.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-beige-dark bg-white">
      {/* ===== ÉTAPE 1 — PRESTATIONS (façon panier) ===== */}
      {step === "prestations" && (
        <>
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <p className="text-sm font-medium text-noir/70">Choisissez vos prestations</p>
              <p className="mt-0.5 text-xs text-noir/40">Sélection multiple possible.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCart((v) => !v)}
              aria-label="Voir le panier"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-beige-dark text-noir/70 hover:border-or hover:text-noir"
            >
              <ShoppingBasket size={17} />
              {selectedServices.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-or text-[10px] font-bold text-noir">
                  {selectedServices.length}
                </span>
              )}
            </button>
          </div>

          {showCart && (
            <div className="mx-5 mt-3 rounded-2xl border border-beige-dark bg-beige/50 p-4">
              {selectedServices.length === 0 ? (
                <p className="text-sm text-noir/40">Votre panier est vide pour l&apos;instant.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-noir">{s.name}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-noir">{formatPrice(s.price)}</span>
                        <button
                          type="button"
                          onClick={() => toggleService(s.id)}
                          aria-label={`Retirer ${s.name}`}
                          className="text-noir/40 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2.5 p-5">
            {services.map((s) => {
              const active = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors",
                    active ? "border-or bg-beige" : "border-beige-dark hover:border-or"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-noir">{s.name}</p>
                    <p className="mt-0.5 text-xs text-noir/50">
                      {s.durationMin >= 60
                        ? `${Math.floor(s.durationMin / 60)}h${s.durationMin % 60 ? String(s.durationMin % 60).padStart(2, "0") : ""}`
                        : `${s.durationMin} min`}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-noir">{formatPrice(s.price)}</p>
                  </div>
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                      active ? "border-or bg-or text-noir" : "border-beige-dark text-noir/40"
                    )}
                  >
                    {active ? <Check size={16} /> : <Plus size={16} />}
                  </span>
                </button>
              );
            })}
            {services.length === 0 && (
              <p className="text-sm text-noir/40">Aucune prestation disponible pour le moment.</p>
            )}
          </div>

          {/* Barre panier flottante */}
          <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-beige-dark bg-white px-5 py-4">
            <div className="text-sm text-noir/70">
              {selectedServices.length === 0 ? (
                <span className="text-noir/40">Aucune prestation sélectionnée</span>
              ) : (
                <>
                  <span className="font-semibold text-noir">{totalPrice > 0 ? formatPrice(totalPrice) : "Gratuit"}</span>
                  <span className="text-noir/40">
                    {" · "}
                    {selectedServices.length} prestation{selectedServices.length > 1 ? "s" : ""} · {totalDuration} min
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              disabled={selectedServices.length === 0}
              onClick={() => setStep("creneau")}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-noir px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-30"
            >
              Continuer <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}

      {/* ===== ÉTAPE 2 — CRÉNEAU ===== */}
      {step === "creneau" && (
        <>
          <div className="flex items-center gap-2 p-5 pb-0">
            <button
              type="button"
              onClick={() => setStep("prestations")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-noir/50 hover:bg-beige hover:text-noir"
              aria-label="Retour"
            >
              <ArrowLeft size={16} />
            </button>
            <p className="text-sm font-medium text-noir/70">Choisissez un créneau</p>
          </div>

          <div className="p-5">
            <p className="text-sm font-medium text-noir/70">Jour</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] touch-pan-x">
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
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-beige-dark bg-white px-5 py-4">
            <div className="text-sm text-noir/70">
              {selectedSlot ? (
                <span className="font-semibold text-noir">
                  {format(selectedDay, "EEEE d MMMM", { locale: fr })} à {format(selectedSlot, "HH:mm")}
                </span>
              ) : (
                <span className="text-noir/40">Choisissez une heure</span>
              )}
            </div>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep("paiement")}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-noir px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-30"
            >
              Continuer <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}

      {/* ===== ÉTAPE 3 — PAIEMENT ===== */}
      {step === "paiement" && (
        <>
          <div className="flex items-center gap-2 p-5 pb-0">
            <button
              type="button"
              onClick={() => setStep("creneau")}
              className="flex h-8 w-8 items-center justify-center rounded-full text-noir/50 hover:bg-beige hover:text-noir"
              aria-label="Retour"
            >
              <ArrowLeft size={16} />
            </button>
            <p className="text-sm font-medium text-noir/70">Récapitulatif</p>
          </div>

          <div className="p-5">
            {hasDeplacementService && (
              <div className="mb-5 rounded-2xl border border-beige-dark p-4">
                <p className="text-sm font-medium text-noir">Adresse du rendez-vous</p>
                <p className="mt-0.5 text-xs text-noir/50">
                  Le professionnel se déplace chez vous — les frais de déplacement sont calculés
                  selon la distance réelle.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={deplacementAddress}
                    onChange={(e) => { setDeplacementAddress(e.target.value); setDeplacementFee(null); }}
                    placeholder="Rue, numéro, ville..."
                    className="flex-1 rounded-lg border border-beige-dark px-3 py-2.5 text-sm outline-none focus:border-or"
                  />
                  <button
                    type="button"
                    onClick={calculerFraisDeplacement}
                    disabled={geocoding || !deplacementAddress.trim()}
                    className="shrink-0 rounded-lg bg-noir px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir disabled:opacity-40"
                  >
                    {geocoding ? "Calcul..." : "Calculer les frais"}
                  </button>
                </div>
                {geocodeError && <p className="mt-2 text-xs text-red-600">{geocodeError}</p>}
                {deplacementFee !== null && deplacementDistance !== null && (
                  <p className="mt-2 text-sm text-or-dark">
                    ≈ {deplacementDistance.toFixed(1)} km → {formatPrice(deplacementFee)} de frais de
                    déplacement
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-beige p-4">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-noir/70">{s.name}</span>
                  <span className="text-noir">{formatPrice(s.price)}</span>
                </div>
              ))}
              {hasDeplacementService && deplacementFee !== null && (
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-noir/70">Frais de déplacement</span>
                  <span className="text-noir">{formatPrice(deplacementFee)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-beige-dark pt-2 text-sm font-semibold text-noir">
                <span>Total</span>
                <span>{totalPrice > 0 ? formatPrice(totalPrice) : "Gratuit"}</span>
              </div>
              {selectedSlot && (
                <p className="mt-2 text-xs text-noir/50">
                  {format(selectedDay, "EEEE d MMMM", { locale: fr })} à {format(selectedSlot, "HH:mm")}
                </p>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {onlinePayment ? (
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-noir/70">Comment souhaitez-vous régler ?</p>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" disabled={loading || (hasDeplacementService && !deplacementFee)} onClick={() => confirmBooking("DEPOSIT")}>
                    Acompte en ligne ({depositPct}%)
                  </Button>
                  <Button variant="outline" disabled={loading || (hasDeplacementService && !deplacementFee)} onClick={() => confirmBooking("FULL")}>
                    Payer en ligne (totalité)
                  </Button>
                  <Button disabled={loading || (hasDeplacementService && !deplacementFee)} onClick={() => confirmBooking("ON_SITE")}>
                    Payer sur place
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <p className="mb-3 text-xs text-noir/50">
                  Réservation à régler directement sur place, en espèces ou par carte.
                </p>
                <Button className="w-full" disabled={loading || (hasDeplacementService && !deplacementFee)} onClick={() => confirmBooking("ON_SITE")}>
                  {loading ? "Confirmation..." : "Confirmer le rendez-vous"}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
