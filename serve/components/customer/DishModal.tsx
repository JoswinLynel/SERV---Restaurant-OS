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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        
        {/* Header Image */}
        <div className="relative h-64 w-full bg-[var(--color-brand-charcoal)]/5 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
          
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-brand-charcoal)]/20 font-serif italic">
              SERVÉ
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h2 className="text-3xl font-serif text-foreground leading-tight mb-2">{item.name}</h2>
            <p className="text-foreground/70">{item.description}</p>
          </div>

          {modifiers.map((mod) => (
            <div key={mod.id} className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="font-semibold text-lg">{mod.name}</h3>
                {mod.is_required && <span className="text-xs uppercase tracking-widest text-[var(--color-brand-gold)] font-bold">Required</span>}
              </div>
              <div className="space-y-2">
                {mod.modifier_options.map((opt: any) => (
                  <label key={opt.id} className="flex items-center justify-between p-4 border border-[var(--color-brand-charcoal)]/10 rounded-xl cursor-pointer hover:bg-[var(--color-brand-charcoal)]/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name={mod.id} 
                        className="w-4 h-4 text-[var(--color-brand-gold)] focus:ring-[var(--color-brand-gold)]"
                        onChange={() => handleModifierChange(mod.id, opt)}
                      />
                      <span>{opt.name}</span>
                    </div>
                    {opt.price_adjustment > 0 && (
                      <span className="text-sm text-foreground/60">+${Number(opt.price_adjustment).toFixed(2)}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center justify-center gap-6 py-4">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 rounded-full bg-[var(--color-brand-charcoal)]/5 hover:bg-[var(--color-brand-charcoal)]/10 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-2xl font-serif min-w-[2rem] text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="p-3 rounded-full bg-[var(--color-brand-charcoal)]/5 hover:bg-[var(--color-brand-charcoal)]/10 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-brand-charcoal)]/10 bg-background/80 backdrop-blur-lg shrink-0">
          <button 
            onClick={handleAddToOrder}
            className="w-full bg-[var(--color-brand-nearblack)] dark:bg-[var(--color-brand-ivory)] dark:text-[var(--color-brand-nearblack)] text-white py-4 rounded-xl font-medium tracking-wide flex justify-between items-center px-6 hover:opacity-90 transition-opacity shadow-lg"
          >
            <span>Add to Order</span>
            <span className="font-serif font-bold text-lg">${total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
