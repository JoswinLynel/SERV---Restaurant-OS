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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif text-foreground mb-4">Your basket is empty</h2>
        <Link href={backUrl} className="text-[var(--color-brand-gold)] font-medium underline underline-offset-4">
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-[var(--color-brand-charcoal)]/10 px-6 py-4 flex items-center gap-4">
        <Link href={backUrl} className="p-2 -ml-2 rounded-full hover:bg-[var(--color-brand-charcoal)]/5">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-serif tracking-tight text-foreground">Your Basket</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {items.map(item => {
          const modTotal = item.modifiers.reduce((acc, m) => acc + Number(m.price_adjustment), 0);
          const itemPrice = Number(item.price) + modTotal;
          
          return (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-[var(--color-brand-charcoal)]/10">
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium text-lg">{item.name}</h3>
                  <span className="font-serif">${(itemPrice * item.quantity).toFixed(2)}</span>
                </div>
                {item.modifiers.length > 0 && (
                  <div className="text-sm text-foreground/60 mt-1">
                    {item.modifiers.map(m => m.name).join(", ")}
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-4 bg-[var(--color-brand-charcoal)]/5 rounded-full px-3 py-1.5">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-500/80 p-2 hover:bg-red-500/10 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <div className="p-6 border-t border-[var(--color-brand-charcoal)]/10 bg-background shrink-0">
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-foreground/70">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-foreground/70">
            <span>Tax (10%)</span>
            <span>${(total * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-serif pt-4 border-t border-[var(--color-brand-charcoal)]/10">
            <span>Total</span>
            <span>${(total * 1.1).toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={submitOrder}
          disabled={isSubmitting}
          className="w-full bg-[var(--color-brand-nearblack)] dark:bg-[var(--color-brand-ivory)] dark:text-[var(--color-brand-nearblack)] text-white py-4 rounded-xl font-medium tracking-wide hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isSubmitting ? "Sending to Kitchen..." : "Submit Order"}
        </button>
      </div>
    </div>
  );
}
