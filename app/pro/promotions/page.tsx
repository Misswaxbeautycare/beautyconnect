import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { getPromoRecipients } from "@/lib/promo";
import PromoManager from "./PromoManager";

export const metadata = { title: "Promotions – Beauty Connect" };
export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const u = await getCurrentDbUser();
  if (!u) redirect("/login");
  const salon = await prisma.salon.findUnique({ where: { ownerId: u.id } });
  if (!salon) redirect("/pro/salon/creer");
  const [campaigns, recipients] = await Promise.all([
    prisma.promoCampaign.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: "desc" } }),
    getPromoRecipients(salon.id),
  ]);
  const monthly = campaigns.find((c: { kind: string }) => c.kind === "MENSUELLE") || null;
  const scheduled = campaigns.filter((c: { kind: string }) => c.kind === "PROGRAMMEE");
  const ser = (c: (typeof campaigns)[number]) => ({ id: c.id, discountPct: c.discountPct, service: c.service, code: c.code, dayOfMonth: c.dayOfMonth, validDays: c.validDays,
    isActive: c.isActive, sendDate: c.sendDate?.toISOString() || null, endDate: c.endDate?.toISOString() || null, lastSentAt: c.lastSentAt?.toISOString() || null, sentCount: c.sentCount });
  return <PromoManager ownerEmail={u.email} recipients={recipients.length} monthly={monthly ? ser(monthly) : null} scheduled={scheduled.map(ser)} />;
}
