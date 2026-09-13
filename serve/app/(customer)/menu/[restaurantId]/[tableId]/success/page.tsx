"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useBasket } from "@/components/customer/BasketContext";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<any>(null);
  const [showOrder, setShowOrder] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { clearBasket } = useBasket();

  const menuUrl = pathname.replace("/success", "");

  useEffect(() => {
    clearBasket();
  }, [clearBasket]);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, order_item_modifiers(*))")
        .eq("id", orderId)
        .single();
      setOrder(data);
    };

    fetchOrder();

    // Subscribe to realtime updates for this specific order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  if (!order)
    return (
      <div className="min-h-screen bg-[var(--color-brand-bg-dark)] flex items-center justify-center font-serif text-[var(--color-brand-ivory)] text-xl animate-pulse tracking-widest">
        SERVÉ
      </div>
    );

  const statuses = ["pending", "preparing", "ready"];
  const currentStep =
    statuses.indexOf(order.status) > -1 ? statuses.indexOf(order.status) : 2; // if completed, show ready

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-sm space-y-12 animate-in fade-in zoom-in-95 duration-500 py-12">
        {/* Confirmation Message */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6">
            <Check className="w-6 h-6 text-[var(--color-brand-gold)]" />
          </div>
          <h1 className="text-2xl font-serif tracking-wide">Order Confirmed</h1>
          <div className="space-y-1 text-sm text-[var(--color-brand-grey)]">
            <p>Thank you.</p>
            <p>Your order has been sent to the kitchen.</p>
            <p>We'll notify you when it's ready.</p>
          </div>
        </div>

        {/* Horizontal Tracker */}
        <div className="w-full px-4">
          <div className="relative flex justify-between items-center mb-4">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 z-0" />
            {/* Active Line (progress) */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-[var(--color-brand-gold)] z-0 transition-all duration-1000"
              style={{
                width: `${(currentStep / (statuses.length - 1)) * 100}%`,
              }}
            />

            {statuses.map((step, idx) => {
              const isActive = currentStep >= idx;
              return (
                <div
                  key={step}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`w-3 h-3 rounded-full mb-3 transition-colors duration-500 ${
                      isActive
                        ? "bg-[var(--color-brand-gold)] shadow-[0_0_10px_rgba(201,164,92,0.5)]"
                        : "bg-[#1A1A1A] border border-white/20"
                    }`}
                  />
                  <span
                    className={`text-[10px] uppercase tracking-wider transition-colors duration-500 ${
                      isActive
                        ? "text-[var(--color-brand-ivory)]"
                        : "text-[var(--color-brand-grey)]"
                    }`}
                  >
                    {step === "pending" ? "Received" : step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => setShowOrder(!showOrder)}
            className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase hover:bg-white/10 transition-colors"
          >
            {showOrder ? "Hide Order Details" : "View Order Details"}
            {showOrder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showOrder && order.order_items && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-sm flex gap-2">
                      <span className="text-[var(--color-brand-grey)]">{item.quantity}x</span>
                      {item.name}
                    </div>
                    {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                      <div className="text-xs text-[var(--color-brand-grey)] mt-1 ml-6">
                        {item.order_item_modifiers.map((m: any) => m.name).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-sm">£{Number(item.total_price).toFixed(2)}</div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-medium">
                <span>Total</span>
                <span>£{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          )}

          <Link
            href={menuUrl}
            className="w-full block bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase shadow-[0_0_15px_rgba(201,164,92,0.1)] hover:bg-[var(--color-brand-gold-light)] transition-colors"
          >
            Back to Menu
          </Link>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-[var(--color-brand-grey)] font-serif italic tracking-wide">
            Enjoy your experience
          </p>
        </div>
      </div>
    </div>
  );
}
