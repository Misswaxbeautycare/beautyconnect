import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEffectivePlan } from "@/lib/subscription-plans";
import { ProductsManager } from "@/components/pro/ProductsManager";

export default async function ProduitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) redirect("/pro/dashboard");

  const salon = await prisma.salon.findUnique({ where: { ownerId: dbUser.id } });
  if (!salon) redirect("/pro/salon/creer");

  const plan = getEffectivePlan(salon);

  if (!plan.hasBoutique) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-noir">Boutique en ligne</h1>
        <p className="mt-3 text-noir/60">
          La vente de produits en ligne est réservée à la formule Prestige (39€/mois).
        </p>
        <Link
          href="/pro/abonnement"
          className="mt-6 inline-block rounded-full bg-or px-6 py-3 text-sm font-semibold text-noir hover:bg-or-dark hover:text-white transition"
        >
          Passer à Prestige
        </Link>
      </div>
    );
  }

  const productsRaw = await prisma.product.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: "desc" },
  });
  const products = productsRaw.map((p: (typeof productsRaw)[number]) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    stock: p.stock,
    isActive: p.isActive,
    imageUrl: p.imageUrl,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-noir">Ma boutique</h1>
      <p className="mt-1 text-noir/60">
        Vendez vos produits directement à vos clientes, en ligne.
      </p>
      <ProductsManager initialProducts={products} />
    </div>
  );
}
