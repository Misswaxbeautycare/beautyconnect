import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { SubscriptionActions } from "@/components/pro/SubscriptionActions";
import { formatDate } from "@/lib/utils";

const statusLabels: Record<string, { label: string; className: string }> = {
  trialing: { label: "Essai gratuit en cours", className: "bg-or/20 text-or-dark" },
  active: { label: "Abonnement actif", className: "bg-green-50 text-green-700" },
  past_due: { label: "Paiement en retard", className: "bg-amber-50 text-amber-700" },
  canceled: { label: "Annulé", className: "bg-neutral-100 text-neutral-500" },
  unpaid: { label: "Impayé", className: "bg-red-50 text-red-700" },
  incomplete: { label: "Incomplet", className: "bg-neutral-100 text-neutral-500" },
};

export default async function AbonnementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const status = salon.subscriptionStatus ? statusLabels[salon.subscriptionStatus] : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Mon abonnement</h1>
      <p className="mt-1 text-noir/60">
        Accès à l&apos;espace professionnel Misswaxbeautycare.
      </p>

      <Card className="mt-6 p-6">
        {status ? (
          <>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
            {salon.subscriptionStatus === "trialing" && salon.trialEndsAt && (
              <p className="mt-3 text-sm text-noir/60">
                Votre essai gratuit se termine le {formatDate(salon.trialEndsAt)}. Votre carte sera
                débitée automatiquement ensuite, sauf annulation avant cette date.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-noir/60">
            Vous n&apos;avez pas encore d&apos;abonnement actif. Démarrez votre essai gratuit de 7
            jours — sans engagement, annulable à tout moment avant la fin de l&apos;essai.
          </p>
        )}

        <SubscriptionActions hasSubscription={Boolean(salon.stripeCustomerId)} />
      </Card>
    </div>
  );
}
