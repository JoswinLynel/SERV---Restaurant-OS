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
        <button className="flex items-center gap-3 bg-[var(--color-brand-nearblack)] dark:bg-[var(--color-brand-ivory)] dark:text-[var(--color-brand-nearblack)] text-white px-6 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-transform cursor-pointer">
          <ShoppingBag className="w-5 h-5" />
          <span className="font-medium tracking-wide text-sm">View Basket</span>
          <span className="bg-[var(--color-brand-gold)] text-[var(--color-brand-nearblack)] text-xs font-bold px-2 py-0.5 rounded-full ml-1">
            {itemCount}
          </span>
        </button>
      </Link>
    </div>
  );
}
