"use client";

import { useState } from "react";
import { QuickBookingModal } from "@/components/booking/QuickBookingModal";

export function ReserverButton({ className = "", isLoggedIn = false }: { className?: string; isLoggedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full bg-or px-5 py-2.5 text-sm font-semibold text-noir shadow-lg shadow-or/30 transition hover:bg-or-dark hover:text-white active:scale-95 ${className}`}
      >
        Réserver
      </button>
      <QuickBookingModal open={open} onClose={() => setOpen(false)} isLoggedIn={isLoggedIn} />
    </>
  );
}
