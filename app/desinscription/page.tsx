import { prisma } from "@/lib/prisma";
import { optOutToken } from "@/lib/promo";

export const metadata = { title: "Désinscription – Beauty Connect" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string; e?: string; t?: string }> }) {
  const { s, e, t } = await searchParams;
  const email = (e || "").toLowerCase();
  let ok = false;
  if (s && email && t && t === optOutToken(s, email)) {
    await prisma.promoOptOut.upsert({ where: { salonId_email: { salonId: s, email } }, update: {}, create: { salonId: s, email } });
    ok = true;
  }
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-noir">{ok ? "C’est noté" : "Lien invalide"}</h1>
      <p className="mt-4 text-noir/70">{ok ? "Vous ne recevrez plus les offres promotionnelles de ce salon. Vos rappels de rendez-vous continuent normalement." : "Ce lien de désinscription n’est pas valide. Contactez le salon directement."}</p>
    </main>
  );
}
