"use client";

import React, { useState, useEffect } from "react";
import { WelcomeScreen } from "./WelcomeScreen";

interface CustomerNameGuardProps {
  restaurantId: string;
  tableId: string;
  restaurantName: string;
  tableNumber: string;
  children: React.ReactNode;
}

export function CustomerNameGuard({
  restaurantId,
  tableId,
  restaurantName,
  tableNumber,
  children,
}: CustomerNameGuardProps) {
  const [hasName, setHasName] = useState<boolean | null>(null);
  
  const storageKey = `serve_customer_name_${restaurantId}_${tableId}`;

  useEffect(() => {
    // Check if name exists in sessionStorage
    const savedName = sessionStorage.getItem(storageKey);
    if (savedName && savedName.trim().length > 0) {
      setHasName(true);
    } else {
      setHasName(false);
    }
  }, [storageKey]);

  const handleContinue = (name: string) => {
    sessionStorage.setItem(storageKey, name.trim());
    setHasName(true);
  };

  // Prevent hydration mismatch by returning null until mounted
  if (hasName === null) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-bg-dark)] flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 animate-pulse">
          <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="var(--color-brand-gold)"/>
        </svg>
      </div>
    );
  }

  if (!hasName) {
    return (
      <WelcomeScreen
        restaurantName={restaurantName}
        tableNumber={tableNumber}
        onContinue={handleContinue}
      />
    );
  }

  return <>{children}</>;
}
