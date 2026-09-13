"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Filter, Clock, Receipt, MoreHorizontal } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, pending, preparing, ready, completed, cancelled
  const [tableFilter, setTableFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  
  const supabase = createClient();

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

  const fetchData = async () => {
    if (!restaurantId) return;
    
    // Fetch Tables for filter
    const { data: tableData } = await supabase
      .from("tables")
      .select("id, table_number")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });
    if (tableData) setTables(tableData);

    // Fetch Orders
    const { data: orderData } = await supabase
      .from("orders")
      .select(`
        *,
        tables ( table_number ),
        order_items (
          id, name, quantity, unit_price, total_price,
          order_item_modifiers ( name, price_adjustment )
        )
      `)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    
    if (orderData) setOrders(orderData);
  };

  useEffect(() => {
    fetchData();
  }, [supabase, restaurantId]);

  useRealtimeSync(restaurantId, fetchData);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (tableFilter !== "ALL" && o.table_id !== tableFilter) return false;
      if (paymentFilter !== "ALL" && o.payment_status !== paymentFilter) return false;
      return true;
    });
  }, [orders, statusFilter, tableFilter, paymentFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'preparing': return 'bg-[var(--color-status-amber)]/20 text-[var(--color-status-amber)] border-[var(--color-status-amber)]/30';
      case 'ready': return 'bg-[var(--color-status-green)]/20 text-[var(--color-status-green)] border-[var(--color-status-green)]/30';
      case 'completed': return 'bg-white/10 text-white/60 border-white/10';
      case 'cancelled': return 'bg-[var(--color-status-red)]/20 text-[var(--color-status-red)] border-[var(--color-status-red)]/30';
      default: return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans">
      <div className="p-8 border-b border-white/5 shrink-0">
        <h1 className="text-3xl font-serif mb-6">Orders</h1>
        
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex bg-[#1A1A1A] p-1 rounded border border-white/5 overflow-x-auto">
            {['ALL', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-xs font-medium tracking-widest uppercase rounded transition-colors ${
                  statusFilter === status 
                    ? 'bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] shadow' 
                    : 'text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]'
                }`}
              >
                {status === 'pending' ? 'NEW' : status}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 text-[var(--color-brand-ivory)] text-sm rounded px-4 py-2 focus:outline-none focus:border-[var(--color-brand-gold)]/50"
            >
              <option value="ALL">All Tables</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Table {t.table_number}</option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-white/10 text-[var(--color-brand-ivory)] text-sm rounded px-4 py-2 focus:outline-none focus:border-[var(--color-brand-gold)]/50"
            >
              <option value="ALL">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Receipt className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-[var(--color-brand-ivory)]">No Orders Found</h3>
              <p className="text-[var(--color-brand-grey)] mt-2">There are no orders matching your current filters.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="font-serif text-xl text-[var(--color-brand-ivory)]">Order #{order.id.split('-')[0].toUpperCase()}</span>
                    <span className="px-3 py-1 rounded text-xs tracking-wider uppercase font-medium bg-[var(--color-brand-bg-elevated)] border border-white/10 text-[var(--color-brand-ivory)]">
                      {order.customer_name || 'Anonymous'}
                    </span>
                    <span className="px-3 py-1 rounded text-xs tracking-wider uppercase font-medium bg-[var(--color-brand-bg-elevated)] border border-white/10 text-[var(--color-brand-gold)]">
                      Table {order.tables?.table_number || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-brand-grey)] tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-xs tracking-wider uppercase font-bold rounded border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-3 py-1 text-xs tracking-wider uppercase font-bold rounded border ${
                      order.payment_status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/50 border-white/10'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <span className="font-medium text-[var(--color-brand-ivory)]">{item.quantity}×</span>
                          <div>
                            <p className="text-[var(--color-brand-ivory)]">{item.name}</p>
                            {item.order_item_modifiers?.map((mod: any, i: number) => (
                              <p key={i} className="text-xs text-[var(--color-brand-grey)]">+ {mod.name}</p>
                            ))}
                          </div>
                        </div>
                        <span className="text-[var(--color-brand-ivory)]">£{Number(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full lg:w-72 shrink-0 space-y-6">
                    <div className="bg-[var(--color-brand-bg-surface)] rounded-lg p-5 border border-white/5">
                      <div className="flex justify-between text-sm text-[var(--color-brand-grey)] mb-2">
                        <span>Subtotal</span>
                        <span>£{Number(order.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-serif text-[var(--color-brand-ivory)] pt-2 border-t border-white/10">
                        <span>Total</span>
                        <span>£{Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full py-3 bg-[var(--color-status-amber)] text-white rounded text-sm uppercase tracking-wider font-medium hover:brightness-110 shadow-lg">
                          Accept & Prepare
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full py-3 bg-[var(--color-status-green)] text-white rounded text-sm uppercase tracking-wider font-medium hover:brightness-110 shadow-lg">
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full py-3 bg-[var(--color-brand-bg-elevated)] border border-white/10 text-white rounded text-sm uppercase tracking-wider font-medium hover:bg-white/10 shadow-lg">
                          Complete Order
                        </button>
                      )}
                      
                      {['pending', 'preparing'].includes(order.status) && (
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full py-2 text-xs text-[var(--color-status-red)] hover:bg-[var(--color-status-red)]/10 rounded uppercase tracking-wider mt-2 transition-colors">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
