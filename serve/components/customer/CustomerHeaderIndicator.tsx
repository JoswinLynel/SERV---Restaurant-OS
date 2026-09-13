"use client";

import React, { useEffect, useState } from "react";

interface CustomerHeaderIndicatorProps {
  restaurantId: string;
  tableId: string;
  tableNumber: string;
}

export function CustomerHeaderIndicator({ restaurantId, tableId, tableNumber }: CustomerHeaderIndicatorProps) {
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `serve_customer_name_${restaurantId}_${tableId}`;
    const name = sessionStorage.getItem(storageKey);
    if (name) {
      setCustomerName(name);
    }
  }, [restaurantId, tableId]);

  if (!customerName) {
    return null; // Don't show anything if no name (e.g., initial hydration)
  }

  return (
    <div className="flex flex-col items-start text-left">
      <span className="text-[13px] text-[var(--color-brand-ivory)] font-medium uppercase tracking-widest px-3 py-1 rounded bg-[var(--color-brand-bg-elevated)] border border-white/10">
        {customerName}
      </span>
      <span className="text-[10px] text-[var(--color-brand-grey)] mt-1.5 uppercase tracking-widest ml-1">
        Table {tableNumber}
      </span>
    </div>
  );
}
