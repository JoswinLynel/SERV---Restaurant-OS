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

  const handleSwitchCustomer = () => {
    if (window.confirm("Switch customer?\nThis will start a new customer session for this table.")) {
      // Clear customer name
      const nameStorageKey = `serve_customer_name_${restaurantId}_${tableId}`;
      sessionStorage.removeItem(nameStorageKey);

      // Clear unsubmitted basket
      const basketStorageKey = `serve_basket_${restaurantId}_${tableId}`;
      localStorage.removeItem(basketStorageKey);

      // Redirect to the same table (will prompt for a new name)
      window.location.reload();
    }
  };

  if (!customerName) {
    return null; // Don't show anything if no name (e.g., initial hydration)
  }

  return (
    <div className="flex flex-col items-start text-left group">
      <span className="text-[13px] text-[var(--color-brand-ivory)] font-medium uppercase tracking-widest px-3 py-1 rounded bg-[var(--color-brand-bg-elevated)] border border-white/10">
        {customerName} &middot; Table {tableNumber}
      </span>
      <button 
        onClick={handleSwitchCustomer}
        className="text-[10px] text-[var(--color-brand-grey)] hover:text-white mt-1.5 uppercase tracking-widest ml-1 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100 text-left"
      >
        Not {customerName}?
      </button>
    </div>
  );
}
