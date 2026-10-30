"use client";
import { useState } from "react";
import Link from "next/link";
import { deletePromo, saveMonthly, schedulePromo, sendTest } from "./actions";

type C = { id: string; discountPct: number; service: string; code: string; dayOfMonth: number; validDays: number; isActive: boolean; sendDate: string | null; endDate: string | null; lastSentAt: string | null; sentCount: number };
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" }) : "");
const input = "w-full rounded-xl border border-beige-dark bg-white px-4 py-3 text-base outline-none focus:border-or";
const btn = "rounded-full bg-or px-6 py-3 font-semibold text-noir transition hover:bg-or-dark hover:text-white active:bg-or-dark active:text-white disabled:opacity-50";
const btn2 = "rounded-full border-2 border-or bg-white px-6 py-3 font-semibold text-or-dark transition hover:bg-or hover:text-noir active:bg-or active:text-noir";

export default function PromoManager({ recipients, monthly, scheduled }: { recipients: number; monthly: C | null; scheduled: C[] }) {
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (p: Promise<{ ok?: string; error?: string }>) => { setBusy(true); const r = await p; setBusy(false); setMsg(r.error ? { t: r.error, err: true } : { t: r.ok || "C’est fait." }); };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/pro/dashboard" className="text-sm text-noir/60 hover:underline">← Tableau de bord</Link>
      <h1 className="mt-3 font-display text-4xl font-bold text-noir">Promotions</h1>
      <p className="mt-2 text-noir/70">Envoyez une réduction par email à vos anciennes clientes. Vous choisissez seulement le pourcentage et la date.</p>
      <p className="mt-4 inline-block rounded-full bg-beige px-4 py-2 text-sm font-medium text-noir/80">📬 {recipients} cliente{recipients > 1 ? "s" : ""} recevr{recipients > 1 ? "ont" : "a"} vos offres</p>

      {msg && <p className={`mt-5 rounded-xl px-4 py-3 text-sm ${msg.err ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{msg.t}</p>}

      {/* PROMO MENSUELLE */}
      <section className="mt-8 rounded-3xl border border-beige-dark bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-noir">🔁 Promo automatique chaque mois</h2>
        <p className="mt-1 text-sm text-noir/60">Envoyée toute seule une fois par mois, le jour que vous choisissez.</p>
        <form action={(f) => run(saveMonthly(f))} className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm font-medium">Réduction (%)<input name="pct" type="number" min={1} max={90} required defaultValue={monthly?.discountPct ?? 15} className={input} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Envoi le … du mois<input name="day" type="number" min={1} max={28} required defaultValue={monthly?.dayOfMonth ?? 1} className={input} /></label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm font-medium">Valable pendant (jours)<input name="valid" type="number" min={3} max={60} required defaultValue={monthly?.validDays ?? 14} className={input} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Sur<input name="service" maxLength={60} defaultValue={monthly?.service ?? "votre prochaine coiffure"} className={input} /></label>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="active" defaultChecked={monthly?.isActive ?? true} className="h-5 w-5 accent-[#D4A24A]" />Promo mensuelle activée</label>
          <div className="flex flex-wrap gap-3">
            <button className={btn} disabled={busy}>Enregistrer</button>
            {monthly && <button type="button" className={btn2} disabled={busy} onClick={() => run(sendTest(monthly.id))}>M’envoyer un test</button>}
          </div>
          {monthly && <p className="text-xs text-noir/50">Code envoyé : <b>{monthly.code}</b>{monthly.lastSentAt ? ` · Dernier envoi le ${d(monthly.lastSentAt)} · ${monthly.sentCount} emails envoyés au total` : " · Pas encore envoyée"}</p>}
        </form>
      </section>

      {/* PROMO PROGRAMMEE */}
      <section className="mt-6 rounded-3xl border border-beige-dark bg-beige p-6">
        <h2 className="font-display text-2xl font-bold text-noir">📅 Programmer une promo</h2>
        <p className="mt-1 text-sm text-noir/60">Envoyée une seule fois, à la date choisie (fêtes, rentrée, anniversaire du salon…).</p>
        <form action={(f) => run(schedulePromo(f))} className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm font-medium">Réduction (%)<input name="pct" type="number" min={1} max={90} required defaultValue={20} className={input} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Sur<input name="service" maxLength={60} defaultValue="votre prochaine coiffure" className={input} /></label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1.5 text-sm font-medium">Date d’envoi<input name="sendDate" type="date" min={today} required className={input} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Date limite<input name="endDate" type="date" min={today} required className={input} /></label>
          </div>
          <button className={btn} disabled={busy}>Programmer la promo</button>
        </form>
        {scheduled.length > 0 && <ul className="mt-6 grid gap-3">
          {scheduled.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div><p className="font-semibold">-{c.discountPct} % sur {c.service} <span className="text-noir/50">· code {c.code}</span></p>
                <p className="text-sm text-noir/60">{c.lastSentAt ? `✅ Envoyée le ${d(c.lastSentAt)} à ${c.sentCount} clientes` : `⏳ Envoi le ${d(c.sendDate)}`} · valable jusqu’au {d(c.endDate)}</p></div>
              <div className="flex gap-2">
                <button className="text-sm font-semibold text-or-dark hover:underline" disabled={busy} onClick={() => run(sendTest(c.id))}>Test</button>
                {!c.lastSentAt && <button className="text-sm font-semibold text-red-700 hover:underline" disabled={busy} onClick={() => run(deletePromo(c.id))}>Supprimer</button>}
              </div>
            </li>))}
        </ul>}
      </section>
      <p className="mt-6 text-xs text-noir/50">Chaque email contient un lien « Ne plus recevoir les offres » (obligatoire par la loi). Les clientes désinscrites ne reçoivent plus vos promotions. Les emails partent vers 9 h le jour prévu.</p>
    </main>
  );
}
