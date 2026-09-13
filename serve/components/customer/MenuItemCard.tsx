"use client";

import Image from "next/image";
import { useState } from "react";
import { DishModal } from "./DishModal";

export function MenuItemCard({ item, restaurantId }: { item: any, restaurantId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-[var(--color-brand-charcoal)]/5 transition-colors cursor-pointer border border-transparent hover:border-[var(--color-brand-charcoal)]/10"
      >
        <div className="relative w-full sm:w-28 h-48 sm:h-28 bg-[var(--color-brand-charcoal)]/5 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-[var(--color-brand-charcoal)]/20 font-serif italic text-sm">SERVÉ</span>
          )}
        </div>
        
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-sans font-medium text-foreground text-lg leading-tight pr-4">
                {item.name}
              </h3>
              <span className="font-serif text-[var(--color-brand-gold)]">
                ${Number(item.price).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-foreground/70 line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>
          
          {item.dietary_labels && item.dietary_labels.length > 0 && (
            <div className="flex gap-2 mt-3">
              {item.dietary_labels.map((label: string) => (
                <span
                  key={label}
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--color-brand-charcoal)]/20 text-foreground/60"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <DishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        item={item} 
        restaurantId={restaurantId}
      />
    </>
  );
}
