import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Store,
  Scissors,
  Users,
  Star,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Eye,
  Clock,
} from "lucide-react";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/subscription-plans";

const sections = [
  {
    href: "/pro/salon/modifier",
    icon: Store,
    title: "Informations du salon",
    description: "Nom, description, adresse, téléphone, photos, logo, zones de déplacement.",
  },
  {
    href: "/pro/horaires",
    icon: Clock,
    title: "Horaires d'ouverture",
    description: "Jour par jour, avec les jours fermés.",
  },
  {
    href: "/pro/services",
    icon: Scissors,
    title: "Prestations & tarifs",
    description: "Ajouter, modifier le prix, la durée ou masquer une prestation.",
  },
  {
    href: "/pro/equipe",
    icon: Users,
    title: "Équipe",
    description: "Photos et spécialités des membres affichés sur votre fiche.",
  },
  {
    href: "/pro/produits",
    icon: ShoppingBag,
    title: "Boutique",
    description: "Produits en vente, photos, prix, stock.",
  },
  {
    href: "/pro/avis",
    icon: Star,
    title: "Avis clients",
    description: "Répondre publiquement aux avis laissés sur votre fiche.",
  },
  {
    href: "/pro/visites",
    icon: Eye,
    title: "Visites de ma fiche",
    description: "Qui a consulté votre fiche salon, et quand.",
  },
  {
    href: "/pro/abonnement",
    icon: CreditCard,
    title: "Abonnement",
    description: "Votre formule actuelle et les fonctionnalités incluses.",
  },
];

export default async function ParametresPage() {
  const dbUser = await getCurrentDbUser();
  if (!dbUser) redirect("/login");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const plan = getEffectivePlan(salon);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Paramètres</h1>
      <p className="mt-1 text-noir/60">
        Gérez tout ce qui concerne {salon.name} — formule actuelle :{" "}
        <span className="font-medium text-or-dark">{plan.name}</span>.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 rounded-2xl border border-beige-dark p-4 transition hover:border-or"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-beige text-or-dark">
              <s.icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-noir">{s.title}</p>
              <p className="text-sm text-noir/50">{s.description}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-noir/30" />
          </Link>
        ))}
      </div>
    </div>
  );
}
