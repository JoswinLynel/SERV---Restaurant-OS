"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface CustomerHeaderIndicatorProps {
  restaurantId: string;
  tableId: string;
  tableNumber: string;
}

export function CustomerHeaderIndicator({ restaurantId, tableId, tableNumber }: CustomerHeaderIndicatorProps) {
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storageKey = `serve_customer_name_${restaurantId}_${tableId}`;
    const name = sessionStorage.getItem(storageKey);
    if (name) {
      setCustomerName(name);
    }
  }, [restaurantId, tableId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
        // Restore focus to the trigger button when closed
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    
    if (isModalOpen) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleSwitchCustomer = () => {
    setIsModalOpen(true);
  };

  const confirmSwitchCustomer = () => {
    // Clear customer name
    const nameStorageKey = `serve_customer_name_${restaurantId}_${tableId}`;
    sessionStorage.removeItem(nameStorageKey);

    // Clear unsubmitted basket
    const basketStorageKey = `serve_basket_${restaurantId}_${tableId}`;
    localStorage.removeItem(basketStorageKey);

    // Redirect to the same table (will prompt for a new name)
    window.location.reload();
  };

  if (!customerName) {
    return null; // Don't show anything if no name (e.g., initial hydration)
  }

  return (
    <>
      <div className="flex flex-col items-start text-left group">
        <span className="text-[13px] text-[var(--color-brand-ivory)] font-medium uppercase tracking-widest px-3 py-1 rounded bg-[var(--color-brand-bg-elevated)] border border-white/10">
          {customerName} &middot; Table {tableNumber}
        </span>
        <button 
          ref={buttonRef}
          onClick={handleSwitchCustomer}
          className="text-[10px] text-[var(--color-brand-grey)] hover:text-white mt-1.5 uppercase tracking-widest ml-1 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100 text-left focus:outline-none focus:underline"
        >
          Not {customerName}?
        </button>
      </div>

      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => {
            setIsModalOpen(false);
            buttonRef.current?.focus();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="switch-customer-title"
        >
          <div 
            ref={modalRef}
            className="relative bg-[#111] border border-[var(--color-brand-gold)]/20 rounded-lg shadow-2xl p-6 md:p-10 w-full max-w-[480px] flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 zoom-in-[0.98] duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { setIsModalOpen(false); buttonRef.current?.focus(); }}
              className="absolute top-4 right-4 text-[var(--color-brand-grey)] hover:text-white transition-colors focus:outline-none"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 id="switch-customer-title" className="text-2xl font-serif text-[var(--color-brand-ivory)] mb-6 uppercase tracking-widest">
              Switch customer?
            </h2>
            <p className="text-base text-[var(--color-brand-ivory)] font-medium mb-4">
              You're about to start a new customer session for this table.
            </p>
            <p className="text-sm text-[var(--color-brand-grey)] leading-relaxed mb-10">
              Your current basket will be cleared, but any orders you've already placed will remain unchanged.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  buttonRef.current?.focus();
                }}
                className="flex-1 px-6 py-4 text-xs tracking-[0.15em] uppercase font-medium rounded border border-white/20 text-[var(--color-brand-ivory)] hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSwitchCustomer}
                className="flex-1 px-6 py-4 text-xs tracking-[0.15em] uppercase font-medium rounded bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] hover:bg-[var(--color-brand-gold-light)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-gold)] shadow-[0_0_20px_rgba(201,164,92,0.15)] active:scale-[0.98]"
                autoFocus
              >
                Switch Customer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
