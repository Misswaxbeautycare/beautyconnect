import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Mail, Phone } from "lucide-react";

interface CompletionItem {
  label: string;
  done: boolean;
}

function computeCompletion(salon: {
  description: string | null;
  address: string | null;
  phone: string | null;
  photos: unknown[];
  openingHours: unknown[];
  services: unknown[];
}): { items: CompletionItem[]; percent: number } {
  const items: CompletionItem[] = [
    { label: "Description + adresse", done: Boolean(salon.description && salon.address) },
    { label: "Photo", done: salon.photos.length > 0 },
    { label: "Horaires", done: salon.openingHours.length > 0 },
    { label: "Prestations", done: salon.services.length > 0 },
    { label: "Téléphone", done: Boolean(salon.phone) },
  ];
  const percent = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { items, percent };
}

export default async function SalonsIncompletsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") redirect("/login");

  const salonsRaw = await prisma.salon.findMany({
    include: {
      owner: true,
      photos: { select: { id: true }, take: 1 },
      openingHours: { select: { id: true }, take: 1 },
      services: { where: { isActive: true }, select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const salons = salonsRaw
    .map((s: (typeof salonsRaw)[number]) => ({
      id: s.id,
      name: s.name,
      ownerEmail: s.owner.email,
      ownerPhone: s.owner.phone,
      createdAt: s.createdAt,
      ...computeCompletion(s),
    }))
    .filter((s) => s.percent < 100)
    .sort((a, b) => a.percent - b.percent);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Salons au profil incomplet</h1>
      <p className="mt-1 text-noir/60">
        {salons.length} salon{salons.length > 1 ? "s" : ""} à relancer — triés du moins
        complet au plus avancé.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {salons.map((s) => (
          <div key={s.id} className="rounded-2xl border border-beige-dark p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-noir">{s.name}</p>
                <p className="text-xs text-noir/40">
                  Inscrit le {s.createdAt.toLocaleDateString("fr-BE")}
                </p>
              </div>
              <span className="font-display text-xl text-or-dark">{s.percent}%</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {s.items
                .filter((i) => !i.done)
                .map((i) => (
                  <span key={i.label} className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                    Manque : {i.label}
                  </span>
                ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              {s.ownerEmail && (
                <a
                  href={`mailto:${s.ownerEmail}`}
                  className="flex items-center gap-1.5 text-sm text-noir/60 hover:text-or-dark"
                >
                  <Mail size={14} /> {s.ownerEmail}
                </a>
              )}
              {s.ownerPhone && (
                <a
                  href={`tel:${s.ownerPhone}`}
                  className="flex items-center gap-1.5 text-sm text-noir/60 hover:text-or-dark"
                >
                  <Phone size={14} /> {s.ownerPhone}
                </a>
              )}
            </div>
          </div>
        ))}
        {salons.length === 0 && (
          <p className="text-noir/40">Tous les salons ont un profil complet — rien à signaler.</p>
        )}
      </div>
    </div>
  );
}
