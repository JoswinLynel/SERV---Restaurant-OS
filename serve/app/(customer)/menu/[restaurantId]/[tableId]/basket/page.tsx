"use client";

import { useBasket } from "@/components/customer/BasketContext";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BasketPage() {
  const { items, total, itemCount, updateQuantity, removeItem, clearBasket } =
    useBasket();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);

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

  // Check availability of items in basket
  useEffect(() => {
    const checkAvailability = async () => {
      if (items.length === 0) {
        setUnavailableItems([]);
        return;
      }
      const ids = items.map(i => i.menu_item_id);
      const { data } = await supabase
        .from("menu_items")
        .select("id, is_available")
        .in("id", ids);
        
      if (data) {
        const unavailable = data.filter(d => !d.is_available).map(d => d.id);
        setUnavailableItems(unavailable);
      }
    };
    checkAvailability();
  }, [items, supabase]);

  const hasUnavailableItems = items.some(item => unavailableItems.includes(item.menu_item_id));

  const submitOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      // Create a simplified item array for the server action
      const actionItems = items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        modifiers: item.modifiers.map(m => ({ id: m.id, name: m.name })),
        notes: item.notes
      }));

      const storageKey = `serve_customer_name_${restaurantId}_${tableId}`;
      const customerName = sessionStorage.getItem(storageKey) || undefined;

      const { createCheckoutSession } = await import("@/actions/checkout");
      const { url } = await createCheckoutSession(restaurantId, tableId, actionItems, customerName);
      
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to initiate checkout. Please try again.");
      setIsSubmitting(false); // only stop submitting if it fails, otherwise it's redirecting
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
      {/* Header — back arrow only, no Edit button */}
      <header className="sticky top-0 z-10 bg-[var(--color-brand-bg-dark)]/90 backdrop-blur-md px-6 py-6 flex items-center border-b border-white/5">
        <Link
          href={backUrl}
          className="text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
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
            const isUnavailable = unavailableItems.includes(item.menu_item_id);

            return (
              <div
                key={item.id}
                className={`flex gap-4 border-b border-white/5 pb-6 ${isUnavailable ? 'opacity-70' : ''}`}
              >
                {/* Dish Image */}
                <div className={`relative w-16 h-16 bg-[var(--color-brand-bg-elevated)] rounded shrink-0 overflow-hidden ${isUnavailable ? 'grayscale' : ''}`}>
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[var(--color-brand-grey)]/30 font-serif italic text-[10px]">
                        SERVÉ
                      </span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className={`font-serif text-[var(--color-brand-ivory)] text-base leading-tight truncate ${isUnavailable ? 'line-through decoration-red-500/50' : ''}`}>
                    {item.name}
                  </h3>
                  {item.modifiers.length > 0 && (
                    <div className="text-xs text-[var(--color-brand-grey)] mt-0.5 truncate">
                      {item.modifiers.map((m) => m.name).join(", ")}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-[var(--color-brand-ivory)]">
                      £{(itemPrice * item.quantity).toFixed(2)}
                    </span>
                    {isUnavailable && (
                      <span className="text-[10px] text-red-500 tracking-widest font-bold uppercase">
                        [ Unavailable ]
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        removeItem(item.id);
                      } else {
                        updateQuantity(item.id, item.quantity - 1);
                      }
                    }}
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] hover:border-white/20 transition-colors cursor-pointer"
                  >
                    {item.quantity <= 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-[var(--color-status-red)]" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-sm font-medium min-w-[1.5rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                      isUnavailable 
                        ? 'border-white/5 text-white/20 cursor-not-allowed' 
                        : 'border-white/10 text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] hover:border-white/20 cursor-pointer'
                    }`}
                    disabled={isUnavailable}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
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
            <button
              disabled={hasUnavailableItems}
              onClick={() => setShowPaymentOptions(true)}
              className={`w-full py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase transition-colors ${
                hasUnavailableItems 
                  ? 'bg-red-900/30 text-red-500 border border-red-500/20 cursor-not-allowed' 
                  : 'bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] shadow-[0_0_15px_rgba(201,164,92,0.1)] hover:bg-[var(--color-brand-gold-light)] cursor-pointer'
              }`}
            >
              {hasUnavailableItems ? 'Remove unavailable items' : 'Proceed to Pay'}
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <p className="text-xs uppercase tracking-widest text-[var(--color-brand-grey)] text-center mb-4">
                Choose payment method
              </p>

              <button
                onClick={() => submitOrder()}
                disabled={isSubmitting || hasUnavailableItems}
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

              <button
                onClick={() => submitOrder()}
                disabled={isSubmitting || hasUnavailableItems}
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
