"use client";

import { useBasket } from "@/components/customer/BasketContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BasketPage() {
  const { items, total, itemCount, clearBasket } = useBasket();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  const backUrl = pathname.replace("/basket", "");
  const restaurantId = params.restaurantId as string;
  const tableId = params.tableId as string;

  // Fetch the actual table_number from the database
  useEffect(() => {
    const fetchTableNumber = async () => {
      const { data } = await supabase
        .from("tables")
        .select("table_number")
        .eq("id", tableId)
        .single();
      if (data) setTableNumber(data.table_number);
    };
    fetchTableNumber();
  }, [tableId, supabase]);

  const submitOrder = async (paymentMethod: "apple_pay" | "card") => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          subtotal: total,
          tax: 0,
          total: total,
          status: "pending",
          payment_status: "unpaid",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      for (const item of items) {
        const modifierTotal = item.modifiers.reduce(
          (acc, m) => acc + Number(m.price_adjustment),
          0
        );
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
            notes: item.notes || "",
          })
          .select()
          .single();

        if (oiError) throw oiError;

        // 3. Insert modifiers
        if (item.modifiers.length > 0) {
          const modifiersToInsert = item.modifiers.map((m) => ({
            order_item_id: orderItem.id,
            name: m.name,
            price_adjustment: m.price_adjustment,
          }));
          await supabase
            .from("order_item_modifiers")
            .insert(modifiersToInsert);
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
        <h2 className="text-2xl font-serif mb-4 tracking-wide">
          Your order is empty
        </h2>
        <Link
          href={backUrl}
          className="text-[var(--color-brand-gold)] font-sans font-medium uppercase tracking-widest text-xs border-b border-[var(--color-brand-gold)] pb-1 hover:text-[var(--color-brand-gold-light)] transition-colors"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--color-brand-bg-dark)]/90 backdrop-blur-md px-6 py-6 flex items-center justify-between border-b border-white/5">
        <Link
          href={backUrl}
          className="text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link
          href={backUrl}
          className="text-[var(--color-brand-gold)] text-xs uppercase tracking-widest font-medium hover:text-[var(--color-brand-gold-light)] transition-colors"
        >
          Edit
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-lg mx-auto w-full">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-brand-ivory)] mb-2">
            Your Order
          </h1>
          <p className="text-xs uppercase tracking-widest text-[var(--color-brand-grey)]">
            Table {tableNumber ?? "..."}
          </p>
        </div>

        {/* Order Items */}
        <div className="space-y-6">
          {items.map((item) => {
            const modTotal = item.modifiers.reduce(
              (acc, m) => acc + Number(m.price_adjustment),
              0
            );
            const itemPrice = Number(item.price) + modTotal;

            return (
              <div
                key={item.id}
                className="flex gap-4 border-b border-white/5 pb-6"
              >
                <div className="w-16 h-16 bg-[var(--color-brand-bg-elevated)] rounded shrink-0 flex items-center justify-center">
                  <span className="text-[var(--color-brand-grey)]/30 font-serif italic text-[10px]">
                    SERVÉ
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-[var(--color-brand-ivory)] text-lg leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-6">
                      <span className="text-[var(--color-brand-grey)] text-sm">
                        {item.quantity}
                      </span>
                      <span className="font-sans font-medium text-sm">
                        £{(itemPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-[var(--color-brand-grey)] mt-1">
                      {item.modifiers.map((m) => m.name).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtotal */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between text-[var(--color-brand-ivory)] text-sm">
            <span>Subtotal</span>
            <span className="font-medium">£{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-3 pt-6 border-t border-white/5">
          {!showPaymentOptions ? (
            /* Step 1: Proceed to Pay */
            <button
              onClick={() => setShowPaymentOptions(true)}
              className="w-full bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase shadow-[0_0_15px_rgba(201,164,92,0.1)] hover:bg-[var(--color-brand-gold-light)] transition-colors cursor-pointer"
            >
              Proceed to Pay
            </button>
          ) : (
            /* Step 2: Payment method options */
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <p className="text-xs uppercase tracking-widest text-[var(--color-brand-grey)] text-center mb-4">
                Choose payment method
              </p>

              {/* Apple Pay */}
              <button
                onClick={() => submitOrder("apple_pay")}
                disabled={isSubmitting}
                className="w-full bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm flex justify-center items-center gap-2 border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Pay with <span className="font-bold">Apple Pay</span>
              </button>

              {/* Pay by Card */}
              <button
                onClick={() => submitOrder("card")}
                disabled={isSubmitting}
                className="w-full bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm flex justify-center items-center gap-2 border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Pay with <span className="font-bold">Card</span>
              </button>

              {/* Cancel — go back to Proceed to Pay */}
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="w-full text-[var(--color-brand-grey)] py-3 font-sans text-xs uppercase tracking-widest hover:text-[var(--color-brand-ivory)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
