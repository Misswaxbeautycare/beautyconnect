import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 rounded-full disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-noir text-white hover:bg-or hover:text-noir",
          variant === "secondary" &&
            "bg-or text-noir hover:bg-or-dark",
          variant === "outline" &&
            "border border-noir text-noir hover:bg-noir hover:text-white",
          variant === "ghost" && "text-noir hover:bg-beige",
          size === "sm" && "px-4 py-2 text-sm",
          size === "md" && "px-6 py-3 text-sm",
          size === "lg" && "px-8 py-4 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
