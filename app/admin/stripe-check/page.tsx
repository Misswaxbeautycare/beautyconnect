import { stripe, isStripeConfigured } from "@/lib/stripe";

export default async function StripeCheckPage() {
  let result: {
    ok: boolean;
    message: string;
    mode?: string;
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
    accountEmail?: string | null;
  };

  if (!isStripeConfigured()) {
    result = {
      ok: false,
      message:
        "Aucune clé Stripe n'est configurée sur le serveur (STRIPE_SECRET_KEY absente ou toujours sur la valeur de secours).",
    };
  } else {
    try {
      const account = await stripe.accounts.retrieve();
      result = {
        ok: true,
        message: "La clé Stripe fonctionne et le compte a répondu correctement.",
        mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live (vrais paiements)" : "test",
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        accountEmail: account.email,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      result = { ok: false, message: `La clé Stripe est présente mais Stripe a refusé la requête : ${message}` };
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-2xl text-noir">Vérification Stripe</h1>
      <p className="mt-1 text-sm text-noir/50">Page temporaire de diagnostic — à retirer une fois le problème résolu.</p>

      <div
        className={`mt-6 rounded-2xl border p-5 ${
          result.ok ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
        }`}
      >
        <p className={`font-semibold ${result.ok ? "text-green-800" : "text-red-800"}`}>
          {result.ok ? "✅ Ça fonctionne" : "❌ Ça ne fonctionne pas"}
        </p>
        <p className="mt-2 text-sm text-noir/70">{result.message}</p>

        {result.ok && (
          <div className="mt-4 space-y-1 text-sm text-noir/70">
            <p>Mode : <strong>{result.mode}</strong></p>
            <p>Compte prêt à recevoir des paiements : <strong>{result.chargesEnabled ? "Oui" : "Non — informations manquantes sur Stripe"}</strong></p>
            <p>Informations du compte complétées : <strong>{result.detailsSubmitted ? "Oui" : "Non"}</strong></p>
            {result.accountEmail && <p>Email du compte Stripe : <strong>{result.accountEmail}</strong></p>}
          </div>
        )}
      </div>

      {result.ok && !result.chargesEnabled && (
        <p className="mt-4 text-sm text-amber-700">
          La clé fonctionne, mais Stripe indique que ton compte n&apos;est pas encore prêt à recevoir de
          vrais paiements — il manque probablement des informations (identité, compte bancaire) à
          compléter sur ton tableau de bord Stripe.
        </p>
      )}
    </div>
  );
}
