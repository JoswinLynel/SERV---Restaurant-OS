"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  restaurantName: string;
  tableNumber: string;
  onContinue: (name: string) => void;
}

export function WelcomeScreen({ restaurantName, tableNumber, onContinue }: WelcomeScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onContinue(trimmed.substring(0, 50)); // limit length
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] font-sans flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
      
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
        <div className="flex justify-center mb-8">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="var(--color-brand-gold)"/>
          </svg>
        </div>
        
        <div className="text-center space-y-3 mb-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-gold)] font-medium">Welcome to</p>
          <h1 className="text-3xl font-serif tracking-wide mb-2">{restaurantName}</h1>
          <div className="inline-block px-3 py-1 mt-4 border border-white/10 bg-white/5 rounded text-xs uppercase tracking-widest text-[var(--color-brand-ivory)]">
            Table {tableNumber}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label htmlFor="customerName" className="block text-xs uppercase tracking-widest text-[var(--color-brand-grey)] text-center">
              Please enter your name to begin
            </label>
            <input
              id="customerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              autoComplete="off"
              className="w-full bg-transparent border-b-2 border-white/10 px-4 py-4 text-center text-xl text-[var(--color-brand-ivory)] placeholder:text-white/20 focus:outline-none focus:border-[var(--color-brand-gold)] transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={name.trim().length === 0}
            className="w-full bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase shadow-[0_0_15px_rgba(201,164,92,0.1)] hover:bg-[var(--color-brand-gold-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            Continue
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </form>
      </div>
    </div>
  );
}
