import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  Users,
  Store,
  Star,
  Bell,
  Image as ImageIcon,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Agenda et réservation en ligne",
    description:
      "Vos clientes réservent directement sur votre fiche, 24h/24 — vous gardez le contrôle sur vos disponibilités.",
  },
  {
    icon: CreditCard,
    title: "Paiement flexible",
    description:
      "Acompte en ligne, paiement intégral en ligne ou règlement sur place : à vous de choisir ce qui convient à votre salon.",
  },
  {
    icon: Users,
    title: "Clientes et carnet de contacts",
    description:
      "Ajoutez vos clientes fidèles même hors plateforme, et gardez un historique clair de vos rendez-vous.",
  },
  {
    icon: Bell,
    title: "Rappels automatiques",
    description:
      "Vos clientes reçoivent un rappel par email avant leur rendez-vous — moins de rendez-vous manqués.",
  },
  {
    icon: ImageIcon,
    title: "Équipe et galerie",
    description:
      "Présentez votre équipe et vos réalisations avec des photos, pour donner confiance avant la réservation.",
  },
  {
    icon: Star,
    title: "Avis vérifiés",
    description: "Les avis ne sont publiés qu'après un rendez-vous réel, pour rester crédibles.",
  },
  {
    icon: Store,
    title: "Boutique en ligne",
    description:
      "Vendez vos produits directement depuis votre fiche salon, avec photos (formule Prestige).",
  },
];

export default function ProFonctionnalitesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-noir sm:text-4xl">Fonctionnalités</h1>
      <p className="mt-3 text-noir/60">
        Tout ce dont votre salon a besoin pour gérer son activité, dans une seule plateforme.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-beige-dark p-5">
            <f.icon size={20} className="text-or-dark" />
            <h2 className="mt-3 font-display text-lg text-noir">{f.title}</h2>
            <p className="mt-1.5 text-sm text-noir/60">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <Link
          href="/pro/inscription"
          className="rounded-full bg-noir px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-or hover:text-noir"
        >
          Créer mon espace pro
        </Link>
        <Link
          href="/pro/abonnement"
          className="rounded-full border border-beige-dark px-8 py-3.5 text-sm font-semibold text-noir transition hover:border-or"
        >
          Voir les tarifs
        </Link>
      </div>
    </div>
  );
}
