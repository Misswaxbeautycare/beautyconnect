import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/subscription-plans";

export async function GET() {
  const salonsRaw = await prisma.salon.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true, country: true, subscriptionPlan: true, subscriptionStatus: true },
    orderBy: { name: "asc" },
  });

  const salons = salonsRaw.map((s: (typeof salonsRaw)[number]) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    country: s.country,
    onlinePayment: getEffectivePlan(s).onlinePayment,
  }));

  return NextResponse.json({ salons });
}
