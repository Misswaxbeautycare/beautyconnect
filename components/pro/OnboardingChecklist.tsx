import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
}

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;

  // Une fois tout complété, la checklist n'a plus d'utilité — elle
  // s'efface d'elle-même plutôt que d'encombrer le tableau de bord.
  if (doneCount === total) return null;

  const percent = Math.round((doneCount / total) * 100);

  return (
    <div className="mt-8 rounded-2xl border border-beige-dark bg-beige/40 p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-noir">Complétez votre profil</p>
        <span className="text-sm font-medium text-or-dark">{percent}%</span>
      </div>
      <p className="mt-1 text-sm text-noir/60">
        Un profil complet inspire bien plus confiance et se réserve plus facilement.
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-or transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
              item.done ? "text-noir/40" : "text-noir hover:bg-white"
            }`}
          >
            {item.done ? (
              <CheckCircle2 size={16} className="shrink-0 text-green-600" />
            ) : (
              <Circle size={16} className="shrink-0 text-noir/30" />
            )}
            <span className={item.done ? "line-through" : ""}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
