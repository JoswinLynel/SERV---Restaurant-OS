"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreditCard, Receipt } from "lucide-react";

export default function POSPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClient();

  // In a real app, restaurant_id would come from context/auth
  const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

  const fetchTables = async () => {
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("table_number", { ascending: true });
    
    if (data) setTables(data);
  };

  const fetchTableOrders = async (tableId: string) => {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id, name, quantity, unit_price, total_price,
          order_item_modifiers ( name, price_adjustment )
        )
      `)
      .eq("table_id", tableId)
      .eq("payment_status", "unpaid");
    
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchTables();
    
    const channel = supabase
      .channel('pos-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTables())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (selectedTable) {
          fetchTableOrders(selectedTable.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedTable]);

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    fetchTableOrders(table.id);
  };

  const processPayment = async (orderId: string) => {
    // Mock Stripe Integration
    alert(`Initiating Stripe payment for Order ${orderId.split('-')[0]}...`);
    await supabase.from("orders").update({ payment_status: 'paid', status: 'completed' }).eq("id", orderId);
    await supabase.from("tables").update({ status: 'available' }).eq("id", selectedTable.id);
    fetchTableOrders(selectedTable.id);
  };

  return (
    <div className="flex h-full text-[var(--color-brand-ivory)] font-sans">
      {/* Tables Grid */}
      <div className="flex-1 p-8 overflow-y-auto bg-[var(--color-brand-bg-surface)] relative">
        <div className="flex justify-between items-end mb-10">
          <h1 className="text-3xl font-serif">Tables</h1>
          <div className="flex items-center gap-8">
            <div className="flex bg-[#1A1A1A] rounded p-1">
              <button className="px-4 py-1.5 text-xs tracking-wider bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] rounded shadow">Floor Plan</button>
              <button className="px-4 py-1.5 text-xs tracking-wider text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]">List View</button>
            </div>
            <div className="flex gap-4 text-xs tracking-widest uppercase text-[var(--color-brand-grey)]">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--color-status-green)]" /> Available</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--color-status-red)]" /> Occupied</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--color-status-amber)]" /> Ordered</span>
            </div>
          </div>
        </div>

        {/* Mock Floorplan background */}
        <div className="relative w-full max-w-4xl mx-auto bg-[#1A1A1A]/30 border border-white/5 rounded-2xl p-12 min-h-[600px]">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-x-12 gap-y-16 justify-items-center">
            {tables.map(table => {
              const statusColors: any = {
                available: 'bg-[var(--color-brand-bg-elevated)] border-[var(--color-status-green)] text-[var(--color-brand-ivory)]',
                occupied: 'bg-[var(--color-status-red)] border-transparent text-white',
                ordering: 'bg-[var(--color-status-amber)] border-transparent text-white',
                payment_required: 'bg-[var(--color-status-amber)] border-transparent text-white',
              };
              const colorClass = statusColors[table.status] || statusColors.available;

              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all ${colorClass} ${selectedTable?.id === table.id ? 'ring-4 ring-[var(--color-brand-gold)]/30 ring-offset-4 ring-offset-[var(--color-brand-bg-surface)] scale-110' : 'hover:scale-105'} shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}
                >
                  <span className="text-xl font-serif font-bold">{table.table_number}</span>
                  {/* Chairs mock */}
                  <div className="absolute -top-3 w-6 h-2 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-3 w-6 h-2 bg-white/10 rounded-full" />
                  <div className="absolute -left-3 w-2 h-6 bg-white/10 rounded-full" />
                  <div className="absolute -right-3 w-2 h-6 bg-white/10 rounded-full" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* POS Sidebar */}
      <div className="w-[400px] bg-[var(--color-brand-bg-dark)] border-l border-white/5 flex flex-col shadow-2xl z-10 shrink-0">
        {selectedTable ? (
          <>
            <div className="p-8 border-b border-white/5">
              <h2 className="text-2xl font-serif">Table {selectedTable.table_number}</h2>
              <p className="text-xs text-[var(--color-brand-grey)] uppercase tracking-[0.2em] mt-1">{selectedTable.status.replace('_', ' ')}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-brand-grey)] border-b border-white/5 pb-2">Current Order</h3>
              {orders.length === 0 ? (
                <div className="text-[var(--color-brand-grey)] py-8 text-sm italic font-serif">No open orders for this table.</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="space-y-4">
                    <div className="flex justify-between text-xs tracking-widest text-[var(--color-brand-grey)] uppercase">
                      <span>#{order.id.split('-')[0]}</span>
                      <span className="text-[var(--color-brand-gold)]">{order.status}</span>
                    </div>
                    <div className="space-y-4">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div className="flex gap-4">
                            <span className="text-[var(--color-brand-grey)]">{item.quantity}</span>
                            <span>{item.name}</span>
                          </div>
                          <span>£{Number(item.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between font-serif text-xl">
                        <span>Total</span>
                        <span>£{Number(order.total).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button className="bg-transparent border border-white/10 text-[var(--color-brand-ivory)] py-3 rounded text-xs tracking-widest uppercase hover:bg-white/5 transition-colors">
                            View Order
                          </button>
                          <button className="bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] py-3 rounded text-xs tracking-widest uppercase hover:bg-white/5 transition-colors">
                            Add Item
                          </button>
                        </div>
                        <button 
                          onClick={() => processPayment(order.id)}
                          className="w-full bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)] py-4 rounded font-sans font-medium text-sm tracking-[0.1em] uppercase hover:bg-[var(--color-brand-gold-light)] transition-colors shadow-[0_0_15px_rgba(201,164,92,0.1)]"
                        >
                          Take Payment
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-brand-grey)] p-8 text-center">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6">
              <Receipt className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-lg font-serif">Select a table to manage</p>
          </div>
        )}
      </div>
    </div>
  );
}
