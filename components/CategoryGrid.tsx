import Link from "next/link";

const categories = [
  { name: "Coiffeur", slug: "coiffeur" },
  { name: "Esthéticienne", slug: "estheticienne" },
  { name: "Barbier", slug: "barbier" },
  { name: "Maquilleur", slug: "maquilleur" },
  { name: "Onglerie", slug: "onglerie" },
  { name: "Massage", slug: "massage" },
  { name: "Spa", slug: "spa" },
  { name: "Extension de cils", slug: "extension-de-cils" },
  { name: "Épilation", slug: "epilation" },
  { name: "Soins visage", slug: "soins-visage" },
  { name: "Soins corps", slug: "soins-corps" },
  { name: "Beauté afro", slug: "beaute-afro" },
  { name: "Maquillage permanent", slug: "maquillage-permanent" },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {categories.map((c, i) => (
        <Link
          key={c.slug}
          href={`/recherche?categorie=${c.slug}`}
          style={{ animationDelay: `${i * 40}ms` }}
          className="animate-slide-up opacity-0 group rounded-2xl border border-beige-dark bg-beige px-5 py-6 text-center transition-all hover:border-or hover:bg-white hover:shadow-lg"
        >
          <span className="text-sm font-medium text-noir group-hover:text-or-dark">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
