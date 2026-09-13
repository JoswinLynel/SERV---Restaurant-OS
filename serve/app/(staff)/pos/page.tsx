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
    <div className="flex h-full">
      {/* Tables Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-serif mb-8 text-foreground">Floor Plan</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map(table => {
            const isOccupied = table.status !== 'available';
            const statusColors: any = {
              available: 'bg-green-500/10 text-green-700 border-green-500/20',
              occupied: 'bg-[var(--color-brand-charcoal)]/5 text-foreground border-[var(--color-brand-charcoal)]/10',
              ordering: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
              payment_required: 'bg-red-500/10 text-red-700 border-red-500/20',
            };
            const colorClass = statusColors[table.status] || statusColors.available;

            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-2 aspect-square hover:scale-105 transition-transform ${colorClass} ${selectedTable?.id === table.id ? 'ring-2 ring-[var(--color-brand-gold)] shadow-lg' : 'shadow-sm'}`}
              >
                <span className="text-3xl font-serif font-bold">T{table.table_number}</span>
                <span className="text-xs uppercase tracking-widest font-medium">{table.status.replace('_', ' ')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* POS Sidebar */}
      <div className="w-96 bg-white dark:bg-[var(--color-brand-nearblack)] border-l border-[var(--color-brand-charcoal)]/10 flex flex-col shadow-xl z-10 shrink-0">
        {selectedTable ? (
          <>
            <div className="p-6 border-b border-[var(--color-brand-charcoal)]/10 bg-[var(--color-brand-charcoal)]/5">
              <h2 className="text-2xl font-serif">Table {selectedTable.table_number}</h2>
              <p className="text-sm text-foreground/60 uppercase tracking-widest mt-1">{selectedTable.status.replace('_', ' ')}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {orders.length === 0 ? (
                <div className="text-center text-foreground/50 py-12">No open orders</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="border border-[var(--color-brand-charcoal)]/10 rounded-xl overflow-hidden">
                    <div className="bg-[var(--color-brand-charcoal)]/5 px-4 py-2 flex justify-between text-sm font-medium">
                      <span>Order #{order.id.split('-')[0].toUpperCase()}</span>
                      <span className="uppercase text-[var(--color-brand-gold)]">{order.status}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium mr-2">{item.quantity}x</span>
                            {item.name}
                          </div>
                          <span>${Number(item.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-[var(--color-brand-charcoal)]/5 border-t border-[var(--color-brand-charcoal)]/10">
                      <div className="flex justify-between font-serif text-lg">
                        <span>Total</span>
                        <span>${Number(order.total).toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => processPayment(order.id)}
                        className="w-full mt-4 bg-[var(--color-brand-nearblack)] dark:bg-[var(--color-brand-ivory)] dark:text-[var(--color-brand-nearblack)] text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Checkout</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 p-6 text-center">
            <Receipt className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-serif">Select a table to view orders and process payments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
