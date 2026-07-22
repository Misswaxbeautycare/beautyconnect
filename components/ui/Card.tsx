import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-beige-dark bg-white shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}
      {...props}
    />
  );
}
