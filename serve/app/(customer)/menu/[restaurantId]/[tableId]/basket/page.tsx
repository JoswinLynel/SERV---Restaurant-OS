"use client";

import { useBasket } from "@/components/customer/BasketContext";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BasketPage() {
  const { items, total, itemCount, updateQuantity, removeItem, clearBasket } = useBasket();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backUrl = pathname.replace('/basket', '');

  const submitOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const restaurantId = params.restaurantId as string;
      const tableId = params.tableId as string;

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          subtotal: total,
          tax: total * 0.1, // Mock 10% tax for now
          total: total * 1.1,
          status: 'pending',
          payment_status: 'unpaid'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      for (const item of items) {
        const modifierTotal = item.modifiers.reduce((acc, m) => acc + Number(m.price_adjustment), 0);
        const unitPrice = Number(item.price) + modifierTotal;
        const { data: orderItem, error: oiError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            name: item.name,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: unitPrice * item.quantity,
            notes: item.notes || ""
          })
          .select()
          .single();

        if (oiError) throw oiError;

        // 3. Insert modifiers
        if (item.modifiers.length > 0) {
          const modifiersToInsert = item.modifiers.map(m => ({
            order_item_id: orderItem.id,
            name: m.name,
            price_adjustment: m.price_adjustment
          }));
          await supabase.from("order_item_modifiers").insert(modifiersToInsert);
        }
      }

      clearBasket();
      router.push(`${backUrl}/success?order=${order.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-brand-bg-dark)] flex flex-col items-center justify-center p-6 text-center text-[var(--color-brand-ivory)]">
        <h2 className="text-2xl font-serif mb-4 tracking-wide">Your order is empty</h2>
        <Link href={backUrl} className="text-[var(--color-brand-gold)] font-sans font-medium uppercase tracking-widest text-xs border-b border-[var(--color-brand-gold)] pb-1 hover:text-[var(--color-brand-gold-light)] transition-colors">
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] flex flex-col font-sans">
      <header className="sticky top-0 z-10 bg-[var(--color-brand-bg-dark)]/90 backdrop-blur-md px-6 py-6 flex items-center justify-between border-b border-white/5">
        <Link href={backUrl} className="text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <button className="text-[var(--color-brand-gold)] text-xs uppercase tracking-widest font-medium">Edit</button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-lg mx-auto w-full">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-brand-ivory)] mb-2">Your Order</h1>
          <p className="text-xs uppercase tracking-widest text-[var(--color-brand-grey)]">Table {params.tableId}</p>
        </div>

        <div className="space-y-6">
          {items.map(item => {
            const modTotal = item.modifiers.reduce((acc, m) => acc + Number(m.price_adjustment), 0);
            const itemPrice = Number(item.price) + modTotal;
            
            return (
              <div key={item.id} className="flex gap-4 border-b border-white/5 pb-6">
                <div className="w-16 h-16 bg-[var(--color-brand-bg-elevated)] rounded shrink-0 flex items-center justify-center">
                   {/* In a real app we'd have the image_url here too, for now placeholder */}
                   <span className="text-[var(--color-brand-grey)]/30 font-serif italic text-[10px]">SERVÉ</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-[var(--color-brand-ivory)] text-lg leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-6">
                      <span className="text-[var(--color-brand-grey)] text-sm">{item.quantity}</span>
                      <span className="font-sans font-medium text-sm">£{(itemPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-[var(--color-brand-grey)] mt-1">
                      {item.modifiers.map(m => m.name).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button className="flex items-center gap-2 text-xs font-medium text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Add a note (optional)
        </button>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between text-[var(--color-brand-ivory)] text-sm">
            <span>Subtotal</span>
            <span className="font-medium">£{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-white/5">
          <button 
            onClick={submitOrder}
            disabled={isSubmitting}
            className="w-full bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase shadow-[0_0_15px_rgba(201,164,92,0.1)] hover:bg-[var(--color-brand-gold-light)] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Proceed to Payment"}
          </button>
          
          <button className="w-full bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm flex justify-center items-center gap-2 border border-white/10 hover:bg-white/5 transition-colors">
            Buy with <span className="font-bold">Apple Pay</span>
          </button>

          <button className="w-full bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm flex justify-center items-center gap-2 border border-white/10 hover:bg-white/5 transition-colors">
            Pay with <span className="font-bold">G Pay</span>
          </button>
          
          <button className="w-full bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm flex justify-center items-center gap-2 border border-white/10 hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Pay with Card
          </button>
        </div>
      </main>
    </div>
  );
}
