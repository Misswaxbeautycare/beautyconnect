import crypto from "crypto";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { getResend, isResendConfigured } from "@/lib/resend";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "https://beautyconnect.misswaxbeautycare.com";

export function optOutToken(salonId: string, email: string) {
  return crypto.createHmac("sha256", process.env.CRON_SECRET || "beautyconnect").update(`${salonId}:${email.toLowerCase()}`).digest("hex").slice(0, 32);
}

// Toutes les anciennes clientes d'un salon (réservations confirmées/terminées + carnet de contacts), sans les désinscrites
export async function getPromoRecipients(salonId: string) {
  const [bookings, contacts, optOuts] = await Promise.all([
    prisma.booking.findMany({
      where: { salonId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      select: { guestEmail: true, guestName: true, client: { select: { email: true, firstName: true } } },
    }),
    prisma.contact.findMany({ where: { salonId, email: { not: null } }, select: { email: true, name: true } }),
    prisma.promoOptOut.findMany({ where: { salonId }, select: { email: true } }),
  ]);
  const blocked = new Set(optOuts.map((o: { email: string }) => o.email.toLowerCase()));
  const map = new Map<string, string>();
  const add = (email: string | null | undefined, name: string | null | undefined) => {
    const e = (email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e) || blocked.has(e) || map.has(e)) return;
    map.set(e, (name || "").trim().split(/\s+/)[0] || "");
  };
  bookings.forEach((b: { guestEmail: string | null; guestName: string | null; client: { email: string; firstName: string } | null }) => add(b.client?.email || b.guestEmail, b.client?.firstName || b.guestName));
  contacts.forEach((c: { email: string | null; name: string }) => add(c.email, c.name));
  return [...map.entries()].map(([email, firstName]) => ({ email, firstName }));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

function promoHtml(o: { salonName: string; salonId: string; firstName: string; pct: number; service: string; code: string; endDate: Date; unsubscribe: string }) {
  const fin = format(o.endDate, "d MMMM yyyy", { locale: fr });
  const link = `${APP_URL()}/salon/${o.salonId}`;
  return `<!doctype html><html><body style="margin:0;background:#F9F1E4;font-family:Arial,Helvetica,sans-serif;color:#0A0A0A">
  <div style="max-width:520px;margin:0 auto;padding:28px 18px">
    <div style="background:#ffffff;border-radius:20px;padding:30px 24px;text-align:center">
      <p style="margin:0 0 6px;font-size:13px;letter-spacing:2px;color:#B8763A;font-weight:bold">${esc(o.salonName.toUpperCase())}</p>
      <h1 style="margin:0 0 14px;font-size:34px;line-height:1.1;color:#0A0A0A">🎁 -${o.pct} %<br><span style="font-size:22px">sur ${esc(o.service)}</span></h1>
      <p style="font-size:16px;line-height:1.6;margin:0 0 18px">Bonjour${o.firstName ? " " + esc(o.firstName) : ""} ✨<br>Vous êtes déjà venue chez nous, et nous vous en remercions ! Pour vous faire plaisir, nous vous offrons une <b>réduction de ${o.pct} %</b> sur ${esc(o.service)}.</p>
      <div style="border:2px dashed #D4A24A;border-radius:14px;padding:14px;margin:0 0 18px;background:#FFFBF3">
        <p style="margin:0;font-size:13px;color:#555">Votre code</p>
        <p style="margin:4px 0 0;font-size:26px;font-weight:bold;letter-spacing:3px;color:#B8763A">${esc(o.code)}</p>
      </div>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;text-align:left"><b>Comment en profiter ?</b><br>1. Réservez votre rendez-vous avec le bouton ci-dessous.<br>2. Donnez le code <b>${esc(o.code)}</b> au moment du rendez-vous.</p>
      <a href="${link}" style="display:inline-block;background:#D4A24A;color:#0A0A0A;text-decoration:none;font-weight:bold;padding:15px 30px;border-radius:999px;font-size:16px">Je réserve mon rendez-vous</a>
      <p style="font-size:14px;margin:20px 0 0;color:#B8763A"><b>📅 Offre valable jusqu’au ${fin}.</b></p>
    </div>
    <p style="font-size:11px;color:#777;text-align:center;line-height:1.5;margin:16px 0 0">Vous recevez cet email car vous êtes cliente de ${esc(o.salonName)}.<br><a href="${o.unsubscribe}" style="color:#777">Ne plus recevoir les offres de ce salon</a></p>
  </div></body></html>`;
}

export async function sendCampaign(campaignId: string, onlyTo?: string) {
  const c = await prisma.promoCampaign.findUnique({ where: { id: campaignId }, include: { salon: true } });
  if (!c) return { sent: 0, error: "Campagne introuvable" };
  if (!isResendConfigured()) return { sent: 0, error: "L’envoi d’emails n’est pas configuré (RESEND_API_KEY)." };
  const endDate = c.kind === "MENSUELLE" ? addDays(new Date(), c.validDays) : c.endDate || addDays(new Date(), 14);
  const list = onlyTo ? [{ email: onlyTo, firstName: "" }] : await getPromoRecipients(c.salonId);
  const emails = list.map((r) => {
    const unsubscribe = `${APP_URL()}/desinscription?s=${c.salonId}&e=${encodeURIComponent(r.email)}&t=${optOutToken(c.salonId, r.email)}`;
    return {
      from: `${c.salon.name} via BeautyConnect <offres@mail.misswaxbeautycare.com>`,
      to: r.email,
      subject: `🎁 -${c.discountPct} % sur ${c.service}, rien que pour vous`,
      html: promoHtml({ salonName: c.salon.name, salonId: c.salonId, firstName: r.firstName, pct: c.discountPct, service: c.service, code: c.code, endDate, unsubscribe }),
      headers: { "List-Unsubscribe": `<${unsubscribe}>` },
    };
  });
  let sent = 0;
  let lastError = "";
  // Envoi groupé par paquets de 100 (limite de Resend), avec une petite pause entre les paquets
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const { error } = await getResend().batch.send(chunk);
      if (error) { console.error("[promo] envoi groupé refusé", error); lastError = error.message || String(error); } else sent += chunk.length;
    } catch (e) {
      console.error("[promo] envoi impossible", e); lastError = (e as Error).message || "Erreur inconnue";
    }
    if (i + 100 < emails.length) await new Promise((res) => setTimeout(res, 600));
  }
  if (!onlyTo) await prisma.promoCampaign.update({ where: { id: c.id }, data: { lastSentAt: new Date(), sentCount: { increment: sent }, ...(c.kind === "PROGRAMMEE" ? { isActive: false } : {}) } });
  if (onlyTo && sent === 0) return { sent, error: `Resend a refusé l’envoi : ${lastError || "raison inconnue"}` };
  return { sent, error: sent === 0 && lastError ? lastError : undefined };
}

// Appelée chaque jour par le cron : envoie les campagnes dont c'est le moment
export async function sendDuePromos() {
  const now = new Date();
  const campaigns = await prisma.promoCampaign.findMany({ where: { isActive: true } });
  let total = 0;
  for (const c of campaigns) {
    const due = c.kind === "PROGRAMMEE"
      ? !!c.sendDate && c.sendDate <= now && !c.lastSentAt
      : now.getDate() >= c.dayOfMonth && (!c.lastSentAt || c.lastSentAt.getMonth() !== now.getMonth() || c.lastSentAt.getFullYear() !== now.getFullYear());
    if (due) total += (await sendCampaign(c.id)).sent;
  }
  return total;
}
