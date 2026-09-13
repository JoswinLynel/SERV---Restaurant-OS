"use client";

import { useBasket } from "./BasketContext";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingBasket() {
  const { itemCount } = useBasket();
  const pathname = usePathname(); // e.g. /menu/123/table-1

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-bottom-10 duration-300">
      <Link href={`${pathname}/basket`}>
        <button className="flex items-center gap-3 bg-[var(--color-brand-bg-elevated)] border border-white/10 text-[var(--color-brand-ivory)] px-6 py-3.5 rounded shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all cursor-pointer">
          <ShoppingBag className="w-4 h-4 text-[var(--color-brand-gold)]" />
          <span className="font-sans font-medium tracking-[0.1em] uppercase text-xs">View Order</span>
          <span className="bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] text-xs font-bold px-2 py-0.5 rounded-sm ml-2">
            {itemCount}
          </span>
        </button>
      </Link>
    </div>
  );
}
