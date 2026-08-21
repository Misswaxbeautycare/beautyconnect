export function paymentBadge(payment: { type: string; status: string; amount: unknown } | null) {
  if (!payment) {
    return { label: "Paiement sur place", className: "bg-neutral-100 text-neutral-500" };
  }
  if (payment.status === "PAID") {
    const label = payment.type === "DEPOSIT" ? "Acompte payé" : "Payé intégralement";
    return { label: `${label} · ${formatPriceLocal(Number(payment.amount))}`, className: "bg-green-50 text-green-700" };
  }
  if (payment.status === "PENDING") {
    return { label: "Paiement en attente", className: "bg-amber-50 text-amber-700" };
  }
  if (payment.status === "REFUNDED") {
    return { label: "Remboursé", className: "bg-neutral-100 text-neutral-500" };
  }
  return { label: "Paiement échoué", className: "bg-red-50 text-red-700" };
}

function formatPriceLocal(amount: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(amount);
}
