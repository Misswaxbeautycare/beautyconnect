"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  BadgeCheck,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Zap,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { ProductCart } from "@/components/salon/ProductCart";
import { FavoriteButton } from "@/components/salon/FavoriteButton";

/* ============================================================
   TYPES — tout provient de app/salon/[id]/page.tsx (données réelles)
   ============================================================ */

interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  categoryName: string;
  durationMin: number;
  price: number;
  depositPct: number;
  modes: ("SALON" | "DOMICILE" | "DEPLACEMENT")[];
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

interface ReviewData {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  replyText: string | null;
}

interface OpeningHourData {
  dayOfWeek: number; // 0 = dimanche ... 6 = samedi
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface TeamMemberData {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
}

export interface SalonProfileData {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string | null;
  postalCode: string | null;
  domicileZone: string | null;
  deplacementZone: string | null;
  latitude: number | null;
  longitude: number | null;
  isApproved: boolean;
  categoryLabels: string[];
  gallery: string[];
  averageRating: number | null;
  reviewCount: number;
  services: ServiceData[];
  products: ProductData[];
  reviews: ReviewData[];
  openingHours: OpeningHourData[];
  teamMembers: TeamMemberData[];
  bookedSlots: string[];
  onlinePayment: boolean;
  isFavorited: boolean;
}

const TABS = [
  { key: "apropos", label: "À propos" },
  { key: "prestations", label: "Prestations" },
  { key: "equipe", label: "Équipe" },
  { key: "avis", label: "Avis" },
  { key: "infos", label: "Infos" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const MODE_LABELS: Record<"SALON" | "DOMICILE" | "DEPLACEMENT", string> = {
  SALON: "En salon",
  DOMICILE: "À domicile",
  DEPLACEMENT: "Le pro se déplace",
};

/* ============================================================
   COMPOSANT
   ============================================================ */

export function SalonProfileClient({ salon }: { salon: SalonProfileData }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("apropos");
  const [preselectServiceId, setPreselectServiceId] = useState<string | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"SALON" | "DOMICILE" | "DEPLACEMENT">(() => {
    if (salon.services.some((s) => s.modes.includes("SALON"))) return "SALON";
    if (salon.services.some((s) => s.modes.includes("DOMICILE"))) return "DOMICILE";
    if (salon.services.some((s) => s.modes.includes("DEPLACEMENT"))) return "DEPLACEMENT";
    return "SALON";
  });
  const sectionRefs = {
    apropos: useRef<HTMLDivElement>(null),
    prestations: useRef<HTMLDivElement>(null),
    equipe: useRef<HTMLDivElement>(null),
    avis: useRef<HTMLDivElement>(null),
    infos: useRef<HTMLDivElement>(null),
  };
  const reserverRef = useRef<HTMLDivElement>(null);

  const visibleTabs = useMemo(
    () => TABS.filter((t) => t.key !== "equipe" || salon.teamMembers.length > 0),
    [salon.teamMembers.length]
  );

  const availableModes = useMemo(() => {
    const set = new Set<string>();
    salon.services.forEach((s) => s.modes.forEach((m) => set.add(m)));
    return (["SALON", "DOMICILE", "DEPLACEMENT"] as const).filter((m) => set.has(m));
  }, [salon.services]);

  const servicesForMode = useMemo(
    () => salon.services.filter((s) => s.modes.includes(activeMode)),
    [salon.services, activeMode]
  );

  const categories = useMemo(
    () => Array.from(new Set(servicesForMode.map((s) => s.categoryName))),
    [servicesForMode]
  );

  // BookingCalendar présélectionne toujours son premier élément : on remonte
  // la prestation cliquée en tête de liste pour qu'elle soit bien celle
  // sélectionnée par défaut quand on arrive sur le calendrier.
  const orderedServices = useMemo(() => {
    if (!preselectServiceId) return servicesForMode;
    const chosen = servicesForMode.find((s) => s.id === preselectServiceId);
    if (!chosen) return servicesForMode;
    return [chosen, ...servicesForMode.filter((s) => s.id !== preselectServiceId)];
  }, [servicesForMode, preselectServiceId]);

  function goToTab(key: TabKey) {
    setActiveTab(key);
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reserverService(serviceId: string) {
    setPreselectServiceId(serviceId);
    reserverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleShare() {
    const shareData = { title: salon.name, url: typeof window !== "undefined" ? window.location.href : "" };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // partage annulé par la personne — rien à faire
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
    }
  }

  async function shareService(serviceId: string) {
    const service = salon.services.find((s) => s.id === serviceId);
    const url = `${window.location.origin}/salon/${salon.id}?service=${serviceId}`;
    const shareData = { title: service ? `${service.name} — ${salon.name}` : salon.name, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setHighlightedServiceId(serviceId);
      setTimeout(() => setHighlightedServiceId((v) => (v === serviceId ? null : v)), 2000);
    }
  }

  // Lien direct vers une prestation précise (?service=xxx) — ouvre
  // directement l'onglet Prestations, défile jusqu'à la fiche et la
  // met en évidence quelques secondes.
  useEffect(() => {
    const serviceId = searchParams.get("service");
    if (!serviceId || !salon.services.some((s) => s.id === serviceId)) return;

    setActiveTab("prestations");
    setHighlightedServiceId(serviceId);

    const timeout = setTimeout(() => {
      document.getElementById(`prestation-${serviceId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    const clearHighlight = setTimeout(() => setHighlightedServiceId(null), 4000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(clearHighlight);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isOpenNow, todayLabel } = useMemo(() => computeOpenStatus(salon.openingHours), [salon.openingHours]);

  const directionsUrl =
    salon.latitude && salon.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`
      : salon.address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${salon.address}, ${salon.city}`)}`
        : null;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      {/* Barre du haut — flotte au-dessus de la galerie */}
      <div className="pointer-events-none sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:relative lg:px-6 lg:pt-6">
        <Link
          href="/recherche"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-noir shadow-md backdrop-blur transition hover:bg-beige lg:hidden"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-noir shadow-md backdrop-blur transition hover:bg-beige"
            aria-label="Partager"
          >
            <Share2 size={16} />
          </button>
          <FavoriteButton
            salonId={salon.id}
            initialFavorited={salon.isFavorited}
            className="pointer-events-auto bg-white/95 shadow-md backdrop-blur"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-0 lg:px-6">
        {/* Galerie */}
        {salon.gallery.length > 0 && (
          <div className="-mt-12 grid gap-1 sm:grid-cols-4 sm:grid-rows-2 lg:mt-0 lg:gap-2 lg:rounded-3xl lg:overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-beige sm:col-span-2 sm:row-span-2 sm:aspect-auto">
              <img src={salon.gallery[0]} alt={salon.name} className="h-full w-full object-cover" />
            </div>
            {salon.gallery.slice(1, 5).map((url, i) => (
              <div key={i} className="relative hidden aspect-square overflow-hidden bg-beige sm:block">
                <img src={url} alt={`${salon.name} ${i + 2}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-10 px-6 pt-6 lg:grid-cols-3 lg:px-0 lg:pt-10">
          <div className="lg:col-span-2">
            {/* En-tête */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl text-noir sm:text-3xl">{salon.name}</h1>
              {salon.isApproved && (
                <BadgeCheck size={22} className="text-or-dark" aria-label="Établissement vérifié" />
              )}
            </div>
            <p className="mt-1 text-sm text-noir/50">{salon.categoryLabels.join(" · ")}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {salon.averageRating !== null && (
                <span className="flex items-center gap-1 rounded-full bg-beige px-3 py-1 font-medium text-noir">
                  <span className="text-or-dark">★</span> {salon.averageRating.toFixed(1)}
                  <span className="text-noir/50">({salon.reviewCount} avis)</span>
                </span>
              )}
              <span className={cn("flex items-center gap-1.5", isOpenNow ? "text-emerald-600" : "text-noir/50")}>
                <Clock size={14} />
                {todayLabel}
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-noir/60">
              <MapPin size={14} className="shrink-0" />
              {salon.services.some((s) => s.modes.includes("SALON")) && salon.address
                ? `${salon.address}, ${salon.city}`
                : salon.domicileZone || salon.deplacementZone || salon.city}
            </p>

            {/* Onglets */}
            <div className="sticky top-0 z-20 -mx-6 mt-6 border-b border-beige-dark bg-white/95 px-6 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
              <div className="flex gap-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleTabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => goToTab(t.key)}
                    className={cn(
                      "shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                      activeTab === t.key
                        ? "border-noir text-noir"
                        : "border-transparent text-noir/50 hover:text-noir"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* À propos */}
            <div ref={sectionRefs.apropos} className="scroll-mt-24 py-8">
              <h2 className="mb-3 font-display text-xl text-noir">À propos</h2>
              {salon.description ? (
                <p className="text-noir/70">{salon.description}</p>
              ) : (
                <p className="text-sm text-noir/40">Ce professionnel n&apos;a pas encore ajouté de présentation.</p>
              )}

              {salon.categoryLabels.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {salon.categoryLabels.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => goToTab("prestations")}
                      className="rounded-full bg-beige px-3 py-1 text-xs text-noir/70 transition hover:bg-beige-dark hover:text-noir"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prestations */}
            <div ref={sectionRefs.prestations} className="scroll-mt-24 border-t border-beige-dark py-8">
              <h2 className="mb-4 font-display text-xl text-noir">Prestations</h2>

              {availableModes.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {availableModes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setActiveMode(m)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-medium transition",
                        activeMode === m
                          ? "border-noir bg-noir text-white"
                          : "border-beige-dark text-noir/70 hover:border-or"
                      )}
                    >
                      {MODE_LABELS[m]}
                    </button>
                  ))}
                </div>
              )}
              {activeMode === "DOMICILE" && salon.domicileZone && (
                <p className="mb-4 text-sm text-noir/50">
                  Zone d&apos;intervention : {salon.domicileZone} — adresse exacte communiquée après réservation.
                </p>
              )}
              {activeMode === "DEPLACEMENT" && salon.deplacementZone && (
                <p className="mb-4 text-sm text-noir/50">Le professionnel se déplace : {salon.deplacementZone}.</p>
              )}
              {categories.length === 0 && (
                <p className="text-sm text-noir/40">Aucune prestation disponible pour le moment.</p>
              )}
              {categories.map((cat) => (
                <div key={cat} className="mb-6 last:mb-0">
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-or-dark">{cat}</p>
                  <div className="flex flex-col gap-2.5">
                    {servicesForMode
                      .filter((s) => s.categoryName === cat)
                      .map((s) => (
                        <div
                          key={s.id}
                          id={`prestation-${s.id}`}
                          className={cn(
                            "scroll-mt-24 flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors",
                            highlightedServiceId === s.id
                              ? "border-or bg-beige"
                              : "border-beige-dark"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-noir">{s.name}</p>
                            {s.description && (
                              <p className="mt-1 text-sm text-noir/60">{s.description}</p>
                            )}
                            <p className="mt-1.5 text-xs text-noir/50">
                              {s.durationMin >= 60
                                ? `${Math.floor(s.durationMin / 60)}h${s.durationMin % 60 ? String(s.durationMin % 60).padStart(2, "0") : ""}`
                                : `${s.durationMin} min`}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-noir">{formatPrice(s.price)}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <button
                              onClick={() => reserverService(s.id)}
                              className="rounded-full bg-noir px-4 py-2 text-xs font-semibold text-white transition hover:bg-or hover:text-noir"
                            >
                              Réserver
                            </button>
                            <button
                              onClick={() => shareService(s.id)}
                              aria-label={`Partager le lien vers ${s.name}`}
                              className="text-noir/30 hover:text-or-dark"
                            >
                              <Share2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              {salon.products.length > 0 && <ProductCart products={salon.products} />}
            </div>

            {/* Équipe */}
            {salon.teamMembers.length > 0 && (
              <div ref={sectionRefs.equipe} className="scroll-mt-24 border-t border-beige-dark py-8">
                <h2 className="mb-4 font-display text-xl text-noir">Équipe</h2>
                <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {salon.teamMembers.map((m) => (
                    <div
                      key={m.id}
                      className="w-28 shrink-0 rounded-2xl border border-beige-dark p-3.5 text-center"
                    >
                      <div className="mx-auto mb-2.5 h-14 w-14 overflow-hidden rounded-full bg-beige">
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-display text-lg text-or-dark">
                            {m.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="truncate text-xs font-semibold text-noir">{m.name}</p>
                      {m.role && <p className="truncate text-[10.5px] text-noir/50">{m.role}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avis */}
            <div ref={sectionRefs.avis} className="scroll-mt-24 border-t border-beige-dark py-8">
              <h2 className="mb-4 font-display text-xl text-noir">Avis</h2>
              {salon.averageRating !== null && (
                <div className="mb-5 flex items-center gap-4 rounded-2xl border border-beige-dark p-4">
                  <p className="font-display text-4xl text-noir">{salon.averageRating.toFixed(1)}</p>
                  <div>
                    <p className="text-sm text-or-dark">{"★".repeat(Math.round(salon.averageRating))}</p>
                    <p className="mt-0.5 text-xs text-noir/50">{salon.reviewCount} avis</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {salon.reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-beige-dark p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-noir">{r.authorName}</p>
                      <span className="text-or-dark text-sm">{"★".repeat(r.rating)}</span>
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm text-noir/60">{r.comment}</p>}
                    <p className="mt-1.5 text-xs text-noir/40">{r.createdAt}</p>
                    {r.replyText && (
                      <div className="mt-3 rounded-xl bg-beige p-3">
                        <p className="text-xs font-semibold text-noir/70">Réponse du professionnel</p>
                        <p className="mt-1 text-sm text-noir/70">{r.replyText}</p>
                      </div>
                    )}
                  </div>
                ))}
                {salon.reviews.length === 0 && (
                  <p className="text-sm text-noir/40">Pas encore d&apos;avis pour ce salon.</p>
                )}
              </div>
            </div>

            {/* Infos */}
            <div ref={sectionRefs.infos} className="scroll-mt-24 border-t border-beige-dark py-8">
              <h2 className="mb-4 font-display text-xl text-noir">Renseignements</h2>

              {salon.openingHours.length > 0 && (
                <>
                  <p className="mb-2 text-sm font-medium text-noir/70">Horaires d&apos;ouverture</p>
                  <div className="mb-6 flex flex-col gap-1.5">
                    {salon.openingHours
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((h) => {
                        const isToday = h.dayOfWeek === new Date().getDay();
                        return (
                          <div
                            key={h.dayOfWeek}
                            className={cn(
                              "flex items-center justify-between text-sm",
                              isToday ? "font-semibold text-noir" : "text-noir/70"
                            )}
                          >
                            <span className="flex items-center gap-2 capitalize">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  h.isClosed ? "bg-noir/20" : "bg-emerald-500"
                                )}
                              />
                              {JOURS[h.dayOfWeek]}
                            </span>
                            <span>{h.isClosed ? "Fermé" : `${h.openTime} – ${h.closeTime}`}</span>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              <p className="mb-2 text-sm font-medium text-noir/70">Informations complémentaires</p>
              <div className="flex flex-col gap-2.5 text-sm text-noir/70">
                {salon.isApproved && (
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-or-dark" /> Établissement vérifié
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Zap size={16} className="text-or-dark" /> Confirmation instantanée
                </span>
                {salon.onlinePayment && (
                  <span className="flex items-center gap-2">
                    <CreditCard size={16} className="text-or-dark" /> Paiement en ligne disponible
                  </span>
                )}
              </div>

              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-or-dark hover:underline"
                >
                  <MapPin size={14} /> Afficher l&apos;itinéraire
                </a>
              )}
            </div>
          </div>

          {/* Réservation — barre latérale fixe en desktop */}
          <div ref={reserverRef} className="scroll-mt-24 lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <BookingCalendar
                salonId={salon.id}
                services={orderedServices.map((s) => ({
                  id: s.id,
                  name: s.name,
                  price: s.price,
                  durationMin: s.durationMin,
                  depositPct: s.depositPct,
                }))}
                bookedSlots={salon.bookedSlots}
                onlinePayment={salon.onlinePayment}
                key={preselectServiceId ?? "default"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA fixe — mobile uniquement */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-beige-dark bg-white px-5 py-3 lg:hidden">
        <div className="text-sm text-noir/60">
          {salon.services.length} prestation{salon.services.length > 1 ? "s" : ""} disponible
          {salon.services.length > 1 ? "s" : ""}
        </div>
        <button
          onClick={() => reserverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="shrink-0 rounded-full bg-noir px-6 py-3 text-sm font-semibold text-white transition hover:bg-or hover:text-noir"
        >
          Réserver
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

function computeOpenStatus(hours: OpeningHourData[]): { isOpenNow: boolean; todayLabel: string } {
  if (hours.length === 0) return { isOpenNow: false, todayLabel: "Horaires non renseignés" };

  const now = new Date();
  const today = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!today || today.isClosed) return { isOpenNow: false, todayLabel: "Fermé aujourd'hui" };

  const [openH, openM] = today.openTime.split(":").map(Number);
  const [closeH, closeM] = today.closeTime.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  if (nowMin >= openMin && nowMin < closeMin) {
    return { isOpenNow: true, todayLabel: `Ouvert · ferme à ${today.closeTime}` };
  }
  if (nowMin < openMin) {
    return { isOpenNow: false, todayLabel: `Fermé · ouvre à ${today.openTime}` };
  }
  return { isOpenNow: false, todayLabel: "Fermé aujourd'hui" };
}
