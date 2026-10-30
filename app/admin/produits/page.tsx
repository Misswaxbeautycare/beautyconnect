import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import FeaturedProducts, { type AdminProduct } from "./FeaturedProducts";

export const dynamic = "force-dynamic";

export default async function AdminProduitsPage() {
  const u = await getCurrentDbUser();
  if (!u || u.role !== "ADMIN") redirect("/login");
  const rows = await prisma.product.findMany({ include: { salon: { select: { id: true, name: true } } }, orderBy: [{ salonId: "asc" }, { createdAt: "desc" }] });
  const products: AdminProduct[] = rows.map((p: { id: string; name: string; price: unknown; imageUrl: string | null; isActive: boolean; isFeatured: boolean; salon: { id: string; name: string } }) => ({
    id: p.id, name: p.name, price: Number(p.price), imageUrl: p.imageUrl, isActive: p.isActive, isFeatured: p.isFeatured, salonId: p.salon.id, salonName: p.salon.name,
  }));
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/admin/dashboard" className="text-sm text-noir/60 hover:underline">← Tableau de bord admin</Link>
      <h1 className="mt-3 font-display text-3xl font-bold text-noir">Produits à la une</h1>
      <p className="mt-1 text-noir/60">Choisis quels produits défilent sur la page d’accueil. Un clic sur un produit mène directement au salon et à sa boutique.</p>
      <FeaturedProducts initial={products} />
    </div>
  );
}
