import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";

interface SalonCardProps {
  id: string;
  name: string;
  city: string;
  coverUrl?: string | null;
  categories: string[];
  ratingAvg?: number;
  reviewCount?: number;
  fromPrice?: number;
}

export function SalonCard({
  id, name, city, coverUrl, categories, ratingAvg, reviewCount, fromPrice,
}: SalonCardProps) {
  return (
    <Link href={`/salon/${id}`}>
      <Card className="overflow-hidden">
        <div className="relative h-44 w-full bg-beige">
          {coverUrl && (
            <Image src={coverUrl} alt={name} fill className="object-cover" />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-display text-lg text-noir">{name}</h3>
            {ratingAvg !== undefined && (
              <span className="flex items-center gap-1 text-sm text-or-dark">
                ★ {ratingAvg.toFixed(1)}
                <span className="text-noir/40">({reviewCount ?? 0})</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-noir/60">{city}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full bg-beige px-2.5 py-1 text-xs text-noir/70">
                {c}
              </span>
            ))}
          </div>
          {fromPrice !== undefined && (
            <p className="mt-3 text-sm text-noir/70">
              Dès <span className="font-medium text-noir">{fromPrice} €</span>
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
