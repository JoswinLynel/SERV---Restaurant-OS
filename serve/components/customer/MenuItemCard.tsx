"use client";

import Image from "next/image";
import { useState } from "react";
import { DishModal } from "./DishModal";

export function MenuItemCard({ item, restaurantId }: { item: any, restaurantId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => item.is_available && setIsModalOpen(true)}
        className={`group flex gap-4 p-4 rounded-sm transition-colors border border-transparent 
          ${item.is_available 
            ? 'hover:bg-[var(--color-brand-bg-surface)] cursor-pointer hover:border-white/5' 
            : 'opacity-50 cursor-not-allowed'
          }`}
      >
        <div className={`relative w-24 h-24 sm:w-28 sm:h-28 bg-[var(--color-brand-bg-elevated)] rounded overflow-hidden shrink-0 flex items-center justify-center ${!item.is_available && 'grayscale'}`}>
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${item.is_available && 'group-hover:scale-105'}`}
            />
          ) : (
            <span className="text-[var(--color-brand-grey)]/30 font-serif italic text-xs">SERVÉ</span>
          )}
        </div>
        
        <div className="flex flex-col flex-1 py-1">
          <div className="flex flex-col mb-1">
            <h3 className="font-serif font-medium text-[var(--color-brand-ivory)] text-lg leading-tight mb-1">
              {item.name}
            </h3>
            <p className="text-xs font-sans text-[var(--color-brand-grey)] line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
          
          <div className="mt-auto pt-2 flex justify-between items-end">
            <span className="font-sans font-medium text-[var(--color-brand-ivory)] text-sm tracking-wide">
              £{Number(item.price).toFixed(2)}
            </span>
            {!item.is_available && (
              <span className="text-[10px] text-red-500 tracking-widest font-bold uppercase">
                [ Unavailable ]
              </span>
            )}
          </div>
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
