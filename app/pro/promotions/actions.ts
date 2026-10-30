"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { sendCampaign } from "@/lib/promo";

async function mySalon() {
  const u = await getCurrentDbUser();
  if (!u) return null;
  return prisma.salon.findUnique({ where: { ownerId: u.id }, include: { owner: true } });
}
const clampPct = (n: number) => Math.min(90, Math.max(1, Math.round(n || 0)));
const cleanService = (s: string) => (s || "").trim().slice(0, 60) || "votre prochaine prestation";

export async function saveMonthly(form: FormData) {
  const salon = await mySalon(); if (!salon) return { error: "Session expirée." };
  const pct = clampPct(Number(form.get("pct")));
  const data = {
    discountPct: pct, code: `MERCI${pct}`, service: cleanService(String(form.get("service"))),
    dayOfMonth: Math.min(28, Math.max(1, Number(form.get("day")) || 1)),
    validDays: Math.min(60, Math.max(3, Number(form.get("valid")) || 14)),
    isActive: form.get("active") === "on",
  };
  const existing = await prisma.promoCampaign.findFirst({ where: { salonId: salon.id, kind: "MENSUELLE" } });
  if (existing) await prisma.promoCampaign.update({ where: { id: existing.id }, data });
  else await prisma.promoCampaign.create({ data: { ...data, salonId: salon.id, kind: "MENSUELLE" } });
  revalidatePath("/pro/promotions"); return { ok: data.isActive ? "Promo mensuelle enregistrée et activée." : "Promo mensuelle enregistrée (désactivée)." };
}

export async function schedulePromo(form: FormData) {
  const salon = await mySalon(); if (!salon) return { error: "Session expirée." };
  const pct = clampPct(Number(form.get("pct")));
  const send = new Date(`${form.get("sendDate")}T09:00:00`);
  const end = new Date(`${form.get("endDate")}T23:59:00`);
  if (isNaN(send.getTime()) || isNaN(end.getTime())) return { error: "Choisis la date d’envoi et la date limite." };
  if (end <= send) return { error: "La date limite doit être après la date d’envoi." };
  await prisma.promoCampaign.create({ data: { salonId: salon.id, kind: "PROGRAMMEE", discountPct: pct, code: `PROMO${pct}`, service: cleanService(String(form.get("service"))), sendDate: send, endDate: end } });
  revalidatePath("/pro/promotions"); return { ok: "Promo programmée !" };
}

export async function deletePromo(id: string) {
  const salon = await mySalon(); if (!salon) return { error: "Session expirée." };
  await prisma.promoCampaign.deleteMany({ where: { id, salonId: salon.id } });
  revalidatePath("/pro/promotions"); return { ok: "Promo supprimée." };
}

export async function sendTest(id: string) {
  const salon = await mySalon(); if (!salon) return { error: "Session expirée." };
  const c = await prisma.promoCampaign.findFirst({ where: { id, salonId: salon.id } });
  if (!c) return { error: "Enregistre d’abord la promo." };
  const r = await sendCampaign(c.id, salon.owner.email);
  return r.error ? { error: r.error } : { ok: `Email de test envoyé à ${salon.owner.email}. Regarde aussi dans tes spams.` };
}
