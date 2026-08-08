"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { X, ShoppingBasket, Plus, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Salon = { id: string; name: string; city: string };
type Service = { id: string; name: string; price: number; durationMin: number; depositPct: number };

interface QuickBookingModalProps {
  open: boolean;
  onClose: () => void;
  // Si le salon est déjà connu (ex: lien direct partagé par un salon),
  // on saute le choix du salon.
  fixedSalonId?: string;
  fixedSalonName?: string;
  // Si la personne est déjà connectée, on saute les champs d'inscription.
  isLoggedIn?: boolean;
}

export function QuickBookingModal({
  open,
  onClose,
  fixedSalonId,
  fixedSalonName,
  isLoggedIn = false,
}: QuickBookingModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [salonId, setSalonId] = useState(fixedSalonId ?? "");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));

  async function checkEmail() {
    if (!email.trim() || !email.includes("@")) {
      setEmailExists(false);
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      setEmailExists(Boolean(data.exists));
    } catch {
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  }
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // Liste de créneaux fixes toutes les 30 minutes, comme sur la page du salon.
  const timeSlots: string[] = [];
  for (let h = 9; h < 18; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    timeSlots.push(`${String(h).padStart(2, "0")}:30`);
  }

  useEffect(() => {
    if (!open || fixedSalonId) return;
    fetch("/api/public/salons")
      .then((r) => r.json())
      .then((d) => setSalons(d.salons ?? []));
  }, [open, fixedSalonId]);

  useEffect(() => {
    if (!salonId) {
      setServices([]);
      setServiceIds([]);
      return;
    }
    fetch(`/api/public/salons/${salonId}/services`)
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []));
  }, [salonId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!salonId || serviceIds.length === 0 || !date || !time) {
      setError("Merci de compléter au moins une prestation, le jour et l'heure.");
      return;
    }
    if (!isLoggedIn && emailExists) {
      setError("Ce compte existe déjà — connectez-vous pour continuer votre réservation.");
      return;
    }
    if (!isLoggedIn && (!firstName || !lastName || !email || !password)) {
      setError("Merci de compléter vos coordonnées.");
      return;
    }

    setSubmitting(true);
    try {
      if (!isLoggedIn) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes("already registered")) {
            setError(
              "Un compte existe déjà avec cet email. Connectez-vous, puis réservez depuis votre espace."
            );
          } else {
            setError("Impossible de créer le compte. Réessayez.");
          }
          setSubmitting(false);
          return;
        }
        if (!authData.user) {
          setError("Impossible de créer le compte. Réessayez.");
          setSubmitting(false);
          return;
        }

        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authId: authData.user.id,
            email,
            firstName,
            lastName,
            phone,
            role: "CLIENT",
          }),
        });

        // Le compte vient d'être créé — on se connecte immédiatement avec
        // les identifiants fournis pour pouvoir finaliser la réservation.
        await supabase.auth.signInWithPassword({ email, password });
      }

      const [primaryServiceId, ...additionalServiceIds] = serviceIds;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          serviceId: primaryServiceId,
          additionalServiceIds,
          date: new Date(`${date}T${time}`).toISOString(),
          paymentType: "ON_SITE",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Impossible de réserver ce créneau.");
        setSubmitting(false);
        return;
      }

      onClose();
      router.push("/client/dashboard?booking=success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-noir/50 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl text-noir">Prendre rendez-vous</h2>
            <p className="mt-1.5 text-sm text-noir/60">
              {fixedSalonName ? `Chez ${fixedSalonName}` : "Choisis ton salon et ton créneau"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-noir/40 hover:text-noir">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!fixedSalonId && (
            <div>
              <label className="text-sm text-noir/70">Salon</label>
              <select
                value={salonId}
                onChange={(e) => setSalonId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
              >
                <option value="">Choisir un salon</option>
                {salons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-noir/70">
                Prestation(s) <span className="font-normal text-noir/40">(plusieurs possibles)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCart((v) => !v)}
                aria-label="Voir le panier"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-beige-dark text-noir/70 hover:border-or hover:text-noir"
              >
                <ShoppingBasket size={15} />
                {selectedServices.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-or text-[10px] font-bold text-noir">
                    {selectedServices.length}
                  </span>
                )}
              </button>
            </div>

            {showCart && selectedServices.length > 0 && (
              <div className="mt-2 rounded-2xl border border-beige-dark bg-beige/50 p-3">
                <div className="flex flex-col gap-1.5">
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
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`mt-2 flex flex-col gap-2 ${!salonId ? "opacity-50" : ""}`}>
              {services.map((s) => {
                const active = serviceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!salonId}
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                      active ? "border-or bg-beige" : "border-beige-dark text-noir/70 hover:border-or"
                    }`}
                  >
                    <span className="text-noir">
                      {s.name} <span className="text-noir/50">— {formatPrice(s.price)}</span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        active ? "border-or bg-or text-noir" : "border-beige-dark text-noir/40"
                      }`}
                    >
                      {active ? <Check size={13} /> : <Plus size={13} />}
                    </span>
                  </button>
                );
              })}
              {salonId && services.length === 0 && (
                <p className="text-xs text-noir/40">Ce salon n&apos;a pas encore de prestations.</p>
              )}
            </div>
            {selectedServices.length > 0 && (
              <p className="mt-2 text-sm text-or-dark">
                Total : {formatPrice(totalPrice)} ({totalDuration} min)
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-noir/70">Jour</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => { setDate(e.target.value); setTime(""); }}
              required
              className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
            />
          </div>

          <div>
            <label className="text-sm text-noir/70">Heure</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    time === slot
                      ? "border-or bg-or text-noir"
                      : "border-beige-dark text-noir/70 hover:border-or"
                  }`}
                >
                  {slot.replace(":", "h")}
                </button>
              ))}
            </div>
          </div>

          {!isLoggedIn && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-noir/70">Prénom</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
                  />
                </div>
                <div>
                  <label className="text-sm text-noir/70">Nom</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-noir/70">Téléphone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
                />
              </div>
              <div>
                <label className="text-sm text-noir/70">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailExists(false); }}
                  onBlur={checkEmail}
                  required
                  className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
                />
                {checkingEmail && <p className="mt-1 text-xs text-noir/40">Vérification...</p>}
                {emailExists && !checkingEmail && (
                  <p className="mt-1.5 rounded-lg bg-beige px-3 py-2 text-xs text-noir/70">
                    Un compte existe déjà avec cet email.{" "}
                    <a
                      href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
                      className="font-medium text-or-dark underline"
                    >
                      Connectez-vous
                    </a>{" "}
                    pour continuer votre réservation.
                  </p>
                )}
              </div>
              {!emailExists && (
                <div>
                  <label className="text-sm text-noir/70">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1 w-full rounded-lg border border-beige-dark px-4 py-3 outline-none focus:border-or"
                  />
                  <p className="mt-1 text-xs text-noir/40">
                    Déjà un compte ?{" "}
                    <a href="/login" className="text-or-dark underline">Connectez-vous plutôt</a>
                  </p>
                </div>
              )}
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting || (!isLoggedIn && emailExists)} className="w-full">
            {submitting ? "Réservation..." : "Réserver ce créneau"}
          </Button>
          <p className="text-center text-xs text-noir/40">
            Réservation confirmée, réglée sur place. Pour payer en ligne, passez par la page du salon.
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
}
