"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useBasket } from "./BasketContext";
import { createClient } from "@/lib/supabase/client";

export function DishModal({ isOpen, onClose, item, restaurantId }: { isOpen: boolean, onClose: () => void, item: any, restaurantId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, any>>({});
  const { addItem } = useBasket();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Fetch modifiers
      const fetchModifiers = async () => {
        const { data } = await supabase
          .from("modifiers")
          .select(`*, modifier_options(*)`)
          .eq("menu_item_id", item.id);
        if (data) {
          setModifiers(data);
        }
      };
      fetchModifiers();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, item.id, supabase]);

  if (!isOpen) return null;

  const handleModifierChange = (modifierId: string, option: any) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [modifierId]: option
    }));
  };

  const handleAddToOrder = () => {
    const selectedModOptions = Object.values(selectedModifiers).map(opt => ({
      id: opt.id,
      name: opt.name,
      price_adjustment: opt.price_adjustment
    }));

    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      modifiers: selectedModOptions,
      notes: ""
    });
    setQuantity(1);
    setSelectedModifiers({});
    onClose();
  };

  const priceAdjustment = Object.values(selectedModifiers).reduce((acc, opt) => acc + Number(opt.price_adjustment), 0);
  const total = (Number(item.price) + priceAdjustment) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--color-brand-bg-dark)] w-full sm:max-w-lg rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border border-white/10">
        
        {/* Header Image */}
        <div className="relative h-72 w-full bg-[var(--color-brand-bg-elevated)] shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
          
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-brand-grey)]/20 font-serif italic">
              SERVÉ
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-sans">
          <div>
            <h2 className="text-3xl font-serif text-[var(--color-brand-ivory)] leading-tight mb-3">{item.name}</h2>
            <p className="text-[var(--color-brand-grey)] leading-relaxed text-sm">{item.description}</p>
          </div>

          {modifiers.map((mod) => (
            <div key={mod.id} className="space-y-4">
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                <h3 className="font-serif text-xl text-[var(--color-brand-ivory)]">{mod.name}</h3>
                {mod.is_required && <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-gold)]">Required</span>}
              </div>
              <div className="space-y-2">
                {mod.modifier_options.map((opt: any) => {
                  const isSelected = selectedModifiers[mod.id]?.id === opt.id;
                  return (
                    <label key={opt.id} className={`flex items-center justify-between p-4 border rounded cursor-pointer transition-colors ${isSelected ? 'border-[var(--color-brand-gold)] bg-[var(--color-brand-gold)]/5' : 'border-white/10 hover:bg-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[var(--color-brand-gold)]' : 'border-white/20'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-brand-gold)]" />}
                        </div>
                        <span className="text-[var(--color-brand-ivory)] text-sm tracking-wide">{opt.name}</span>
                      </div>
                      {opt.price_adjustment > 0 && (
                        <span className="text-sm text-[var(--color-brand-grey)]">+£{Number(opt.price_adjustment).toFixed(2)}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center justify-center gap-8 py-4">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 rounded-full border border-white/10 text-[var(--color-brand-ivory)] hover:bg-white/5 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-serif text-[var(--color-brand-ivory)] min-w-[2rem] text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="p-3 rounded-full border border-white/10 text-[var(--color-brand-ivory)] hover:bg-white/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[var(--color-brand-bg-dark)] shrink-0">
          <button 
            onClick={handleAddToOrder}
            className="w-full bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase flex justify-between items-center px-6 hover:bg-[var(--color-brand-gold-light)] transition-colors shadow-[0_0_15px_rgba(201,164,92,0.1)]"
          >
            <span>Add to Order</span>
            <span className="font-serif font-bold text-lg tracking-normal">£{total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
