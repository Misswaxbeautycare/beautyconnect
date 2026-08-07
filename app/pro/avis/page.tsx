import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { ReviewsManager } from "@/components/pro/ReviewsManager";

export default async function ProAvisPage() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const reviewsRaw = await prisma.review.findMany({
    where: { salonId: salon.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const reviews = reviewsRaw.map((r: (typeof reviewsRaw)[number]) => ({
    id: r.id,
    authorName: `${r.client.firstName} ${r.client.lastName.charAt(0)}.`,
    rating: r.rating,
    comment: r.comment,
    replyText: r.replyText,
    createdAt: formatDate(r.createdAt),
  }));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Mes avis</h1>
      <p className="mt-1 text-noir/60">
        Répondez publiquement aux avis de vos clientes — votre réponse s&apos;affiche directement
        sous l&apos;avis sur votre fiche.
      </p>
      <ReviewsManager reviews={reviews} />
    </div>
  );
}
