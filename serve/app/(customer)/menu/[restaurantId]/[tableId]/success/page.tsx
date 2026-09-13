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

  if (!order) return <div className="min-h-screen bg-background flex items-center justify-center font-serif text-xl animate-pulse">SERVÉ</div>;

  const statuses = ['pending', 'preparing', 'ready', 'completed'];
  const currentStep = statuses.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-[var(--color-brand-charcoal)]/5 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[var(--color-brand-gold)]" />
          </div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight">Order Confirmed</h1>
          <p className="text-foreground/70">Thank you. Your order has been sent to the kitchen.</p>
        </div>

        {/* Status Tracker */}
        <div className="relative border-l-2 border-[var(--color-brand-charcoal)]/10 ml-6 space-y-8 py-4">
          {[
            { id: 'pending', label: 'Received', icon: ShoppingBag },
            { id: 'preparing', label: 'Preparing', icon: ChefHat },
            { id: 'ready', label: 'Ready', icon: Check },
            { id: 'completed', label: 'Completed', icon: CheckCircle2 },
          ].map((step, idx) => {
            const isActive = currentStep >= idx;
            const isCurrent = currentStep === idx;
            const Icon = step.icon;
            return (
              <div key={step.id} className={`relative flex items-center pl-8 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`absolute -left-[17px] w-8 h-8 rounded-full border-4 border-background flex items-center justify-center ${isActive ? 'bg-[var(--color-brand-gold)] text-[var(--color-brand-nearblack)]' : 'bg-[var(--color-brand-charcoal)]/10 text-foreground/40'}`}>
                  {isActive && !isCurrent ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-lg ${isActive ? 'font-medium text-foreground' : 'text-foreground/60'}`}>{step.label}</span>
                {isCurrent && (
                  <span className="ml-3 relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-brand-gold)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-brand-gold)]"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-8">
          <p className="text-sm text-foreground/50">Order #{order.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
