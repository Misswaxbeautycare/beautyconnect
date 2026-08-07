import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function TemoignagesPage() {
  const reviewsRaw = await prisma.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: null } },
    include: { client: true, salon: true },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 12,
  });

  const reviews = reviewsRaw.map((r: (typeof reviewsRaw)[number]) => ({
    id: r.id,
    authorName: `${r.client.firstName} ${r.client.lastName.charAt(0)}.`,
    salonName: r.salon.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: formatDate(r.createdAt),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir sm:text-4xl">Témoignages</h1>
      <p className="mt-3 text-noir/60">
        Les avis affichés ici sont réels, laissés par des clientes après un rendez-vous confirmé
        sur la plateforme.
      </p>

      {reviews.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-beige-dark p-5">
              <p className="text-or-dark text-sm">{"★".repeat(r.rating)}</p>
              <p className="mt-2 text-sm text-noir/70">{r.comment}</p>
              <p className="mt-3 text-xs font-medium text-noir">
                {r.authorName} <span className="font-normal text-noir/40">— {r.salonName}</span>
              </p>
              <p className="text-[11px] text-noir/30">{r.createdAt}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-noir/40">
          Pas encore assez d&apos;avis à afficher — revenez bientôt.
        </p>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Link
          href="/pro/inscription"
          className="rounded-full bg-noir px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir"
        >
          Créer mon espace pro
        </Link>
        <Link
          href="/recherche"
          className="rounded-full border border-beige-dark px-8 py-3.5 text-sm font-semibold text-noir transition hover:border-or"
        >
          Voir les salons
        </Link>
      </div>
    </div>
  );
}
