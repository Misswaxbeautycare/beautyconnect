// Bandeau défilant en haut de toutes les pages. Pour changer le message, modifie MESSAGE.
const MESSAGE = "🎁 Bientôt des promos ! Soyez prêtes pour des réductions exclusives sur toutes nos prestations";

export default function PromoBanner() {
  const items = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="mx-8 inline-flex items-center gap-8">{MESSAGE}<span aria-hidden className="text-noir/40">✦</span></span>
  ));
  return (
    <div className="promo-banner overflow-hidden bg-or py-2 text-sm font-semibold text-noir" role="region" aria-label="Annonce">
      <p className="sr-only">{MESSAGE}</p>
      <div aria-hidden className="promo-track flex w-max whitespace-nowrap">
        <div className="flex">{items}</div>
        <div className="flex">{items}</div>
      </div>
    </div>
  );
}
