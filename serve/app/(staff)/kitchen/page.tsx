"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClient();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: staffData } = await supabase
          .from("staff")
          .select("restaurant_id")
          .eq("id", user.id)
          .single();
        if (staffData) {
          setRestaurantId(staffData.restaurant_id);
          return;
        }
      }
      // Demo fallback: default to Madras Table if not logged in
      setRestaurantId("20000000-0000-0000-0000-000000000002");
    };
    initAuth();
  }, [supabase]);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        tables ( table_number ),
        order_items (
          id, name, quantity, notes,
          order_item_modifiers ( name )
        )
      `)
      .neq("status", "completed")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setOrders(data);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId, supabase]);

  useRealtimeSync(restaurantId, fetchOrders);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const columns = [
    { id: "pending", title: "NEW ORDERS", color: "text-blue-400 border-blue-400/20 bg-blue-400/5", btnClass: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30", btnText: "START PREPARING" },
    { id: "preparing", title: "PREPARING", color: "text-[var(--color-status-amber)] border-[var(--color-status-amber)]/20 bg-[var(--color-status-amber)]/5", btnClass: "bg-[var(--color-status-amber)] text-[var(--color-brand-bg-dark)] hover:bg-[var(--color-status-amber)]/90 shadow-[0_0_15px_rgba(245,166,35,0.2)]", btnText: "MARK READY" },
    { id: "ready", title: "READY", color: "text-[var(--color-status-green)] border-[var(--color-status-green)]/20 bg-[var(--color-status-green)]/5", btnClass: "bg-transparent border border-[var(--color-status-green)] text-[var(--color-status-green)] hover:bg-[var(--color-status-green)]/10", btnText: "COMPLETE" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-dark)] flex flex-col font-sans text-[var(--color-brand-ivory)]">
      <header className="bg-[var(--color-brand-bg-surface)] border-b border-white/5 px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-serif tracking-widest uppercase">Kitchen Display</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mt-1">Live Order Stream</p>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-8 min-w-max h-full">
          {columns.map(col => {
            const colOrders = orders.filter(o => o.status === col.id);
            return (
              <div key={col.id} className="w-[420px] flex flex-col max-h-full">
                <div className={`px-5 py-4 rounded mb-6 font-sans font-medium tracking-[0.2em] text-xs border ${col.color} flex justify-between items-center`}>
                  <span>{col.title}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-white">{colOrders.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                  {colOrders.map(order => {
                    const waitTimeMins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
                    
                    return (
                      <div key={order.id} className="bg-[var(--color-brand-bg-surface)] rounded-xl p-6 shadow-xl border border-white/5 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Red flash if waiting too long */}
                        {waitTimeMins > 20 && (
                          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-status-red)] shadow-[0_0_10px_rgba(255,59,48,0.8)]" />
                        )}
                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                          <div>
                            <span className="text-3xl font-serif text-[var(--color-brand-ivory)]">
                              {order.customer_name ? `${order.customer_name} · ` : ''}{order.tables ? `Table ${order.tables.table_number}` : 'Takeaway'}
                            </span>
                            <p className="text-[10px] text-[var(--color-brand-grey)] mt-2 uppercase tracking-widest">Order #{order.id.split('-')[0]}</p>
                          </div>
                          <div className={`px-4 py-1.5 rounded text-xs tracking-widest font-medium border ${waitTimeMins > 15 ? 'bg-[var(--color-status-red)]/10 text-[var(--color-status-red)] border-[var(--color-status-red)]/20' : 'bg-white/5 text-[var(--color-brand-grey)] border-white/10'}`}>
                            {waitTimeMins}M
                          </div>
                        </div>

                        <div className="space-y-5 mb-8">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="text-[var(--color-brand-ivory)]">
                              <div className="flex gap-4 text-base font-medium">
                                <span className="text-[var(--color-brand-gold)] bg-[var(--color-brand-gold)]/10 px-2 py-0.5 rounded text-sm">{item.quantity}x</span>
                                <span>{item.name}</span>
                              </div>
                              {item.order_item_modifiers?.length > 0 && (
                                <ul className="pl-12 mt-2 space-y-1">
                                  {item.order_item_modifiers.map((mod: any, idx: number) => (
                                    <li key={idx} className="text-[11px] text-[var(--color-brand-grey)] flex items-center uppercase tracking-wider before:content-['-'] before:mr-2">
                                      {mod.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.notes && (
                                <p className="pl-12 mt-3 text-xs tracking-wide text-[var(--color-brand-bg-dark)] font-medium bg-[var(--color-status-amber)] p-2.5 rounded">
                                  <span className="font-bold uppercase tracking-widest mr-2">Note:</span>{item.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex mt-auto pt-4 border-t border-white/5">
                          <button 
                            onClick={() => {
                              if (col.id === 'pending') updateOrderStatus(order.id, 'preparing');
                              if (col.id === 'preparing') updateOrderStatus(order.id, 'ready');
                              if (col.id === 'ready') updateOrderStatus(order.id, 'completed');
                            }}
                            className={`w-full py-4 rounded text-xs tracking-[0.1em] font-bold uppercase transition-all ${col.btnClass}`}
                          >
                            {col.btnText}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
