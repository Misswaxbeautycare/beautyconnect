"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { subscriptionPlans } from "@/lib/subscription-plans";

export function SalonPlanSelector({
  salonId,
  currentPlan,
}: {
  salonId: string;
  currentPlan: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentPlan ?? "none");
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const plan = e.target.value;
    setValue(plan);
    setSaving(true);
    await fetch(`/api/admin/salons/${salonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={saving}
      className="rounded-lg border border-beige-dark px-3 py-1.5 text-sm outline-none focus:border-or"
    >
      <option value="none">Aucun abonnement</option>
      {subscriptionPlans.map((p) => (
        <option key={p.id} value={p.id}>{p.name} ({p.price}€)</option>
      ))}
    </select>
  );
}
