import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const salons = await prisma.salon.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ salons });
}
