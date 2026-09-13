"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock } from "lucide-react";

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClient();

  const fetchOrders = async () => {
    // For demo purposes, we fetch all non-completed orders.
    // In a real app, this would be filtered by restaurant_id from the user session.
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
      .order("created_at", { ascending: true });
    
    if (data) {
      setOrders(data);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrders(); // Re-fetch to get nested relations easily, or selectively update state
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const columns = [
    { id: "pending", title: "NEW", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { id: "preparing", title: "PREPARING", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    { id: "ready", title: "READY", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="bg-[var(--color-brand-nearblack)] text-white px-6 py-4 flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-serif tracking-widest uppercase">Kitchen Display</h1>
        <div className="flex items-center gap-2 text-white/60">
          <Clock className="w-5 h-5" />
          <span className="font-medium tracking-wider">{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 min-w-max h-full">
          {columns.map(col => {
            const colOrders = orders.filter(o => o.status === col.id);
            return (
              <div key={col.id} className="w-[400px] flex flex-col max-h-full">
                <div className={`px-4 py-3 rounded-lg mb-4 font-bold tracking-widest text-sm border ${col.color}`}>
                  {col.title} ({colOrders.length})
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {colOrders.map(order => {
                    const waitTimeMins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
                    
                    return (
                      <div key={order.id} className="bg-white dark:bg-[var(--color-brand-charcoal)] rounded-xl p-5 shadow-sm border border-[var(--color-brand-charcoal)]/10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4 border-b border-[var(--color-brand-charcoal)]/10 pb-4">
                          <div>
                            <span className="text-2xl font-serif text-foreground font-bold">
                              {order.tables ? `T${order.tables.table_number}` : 'Takeaway'}
                            </span>
                            <p className="text-xs text-foreground/50 mt-1 uppercase tracking-wider">#{order.id.split('-')[0]}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${waitTimeMins > 15 ? 'bg-red-500/10 text-red-600' : 'bg-[var(--color-brand-charcoal)]/5'}`}>
                            {waitTimeMins}m
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="text-foreground">
                              <div className="flex gap-3 text-lg font-medium">
                                <span className="text-[var(--color-brand-gold)]">{item.quantity}x</span>
                                <span>{item.name}</span>
                              </div>
                              {item.order_item_modifiers?.length > 0 && (
                                <ul className="pl-8 mt-1 space-y-1">
                                  {item.order_item_modifiers.map((mod: any, idx: number) => (
                                    <li key={idx} className="text-sm text-foreground/60 flex items-center before:content-['-'] before:mr-2">
                                      {mod.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.notes && (
                                <p className="pl-8 mt-2 text-sm font-medium text-red-500/80 bg-red-500/5 p-2 rounded">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          {col.id === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold tracking-widest transition-colors"
                            >
                              START
                            </button>
                          )}
                          {col.id === 'preparing' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold tracking-widest transition-colors"
                            >
                              MARK READY
                            </button>
                          )}
                          {col.id === 'ready' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="flex-1 bg-[var(--color-brand-nearblack)] dark:bg-[var(--color-brand-ivory)] dark:text-[var(--color-brand-nearblack)] text-white py-3 rounded-lg font-bold tracking-widest transition-colors"
                            >
                              COMPLETE
                            </button>
                          )}
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
