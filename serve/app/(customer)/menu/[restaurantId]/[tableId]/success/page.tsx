"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ChefHat, Check, ShoppingBag } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
      setOrder(data);
    };

    fetchOrder();

    // Subscribe to realtime updates for this specific order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  if (!order) return <div className="min-h-screen bg-[var(--color-brand-bg-dark)] flex items-center justify-center font-serif text-[var(--color-brand-ivory)] text-xl animate-pulse tracking-widest">SERVÉ</div>;

  const statuses = ['pending', 'preparing', 'ready'];
  const currentStep = statuses.indexOf(order.status) > -1 ? statuses.indexOf(order.status) : 2; // if completed, show ready

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-sm space-y-16 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Branding */}
        <div className="flex flex-col items-center">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="var(--color-brand-gold)"/>
          </svg>
          <h2 className="text-xl font-serif tracking-widest uppercase mb-1">{order.restaurants?.name || 'SERVÉ'}</h2>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-brand-grey)]">RESTAURANT</p>
        </div>

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
        <div className="w-full px-4 mt-8">
          <div className="relative flex justify-between items-center mb-4">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 z-0" />
            {/* Active Line (progress) */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-[var(--color-brand-gold)] z-0 transition-all duration-1000" 
              style={{ width: `${(currentStep / (statuses.length - 1)) * 100}%` }}
            />
            
            {statuses.map((step, idx) => {
              const isActive = currentStep >= idx;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-3 ${isActive ? 'bg-[var(--color-brand-gold)] shadow-[0_0_10px_rgba(201,164,92,0.5)]' : 'bg-[#1A1A1A] border border-white/20'}`} />
                  <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-[var(--color-brand-ivory)]' : 'text-[var(--color-brand-grey)]'}`}>
                    {step === 'pending' ? 'Received' : step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-8 space-y-6">
          <button className="w-full bg-transparent border border-white/20 text-[var(--color-brand-ivory)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase hover:bg-white/5 transition-colors">
            View Order Status
          </button>
          <p className="text-[10px] text-[var(--color-brand-grey)] font-serif italic tracking-wide">
            Enjoy your experience
          </p>
        </div>
      </div>
    </div>
  );
}
