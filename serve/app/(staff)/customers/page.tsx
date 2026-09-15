"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Search, AlertCircle, ShoppingBag, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function CustomersPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "IDENTIFIED" | "ANONYMOUS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
      // Fallback for demo
      setRestaurantId("20000000-0000-0000-0000-000000000002");
    };
    initAuth();
  }, [supabase]);

  const fetchOrders = async () => {
    if (!restaurantId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        table_id,
        customer_name,
        status,
        payment_status,
        total,
        created_at,
        tables ( table_number ),
        payments ( id, amount, status )
      `)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data);
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurantId, supabase]);

  useRealtimeSync(restaurantId, fetchOrders);

  // Derived metrics
  const { totalAnonymousSpend, totalIdentifiedSpend, anonymousOrderCount, identifiedOrderCount } = useMemo(() => {
    let anonSpend = 0;
    let idSpend = 0;
    let anonCount = 0;
    let idCount = 0;

    orders.forEach(order => {
      let isIdentified = !!order.customer_name;
      if (isIdentified) idCount++;
      else anonCount++;

      if (order.payments && Array.isArray(order.payments)) {
        order.payments.forEach((p: any) => {
          if (p.status === "succeeded") {
            if (isIdentified) idSpend += Number(p.amount);
            else anonSpend += Number(p.amount);
          }
        });
      }
    });

    return {
      totalAnonymousSpend: anonSpend,
      totalIdentifiedSpend: idSpend,
      anonymousOrderCount: anonCount,
      identifiedOrderCount: idCount,
    };
  }, [orders]);

  const displayedOrders = useMemo(() => {
    let filtered = orders;
    
    if (filter === "IDENTIFIED") {
      filtered = orders.filter(o => !!o.customer_name);
    } else if (filter === "ANONYMOUS") {
      filtered = orders.filter(o => !o.customer_name);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.tables?.table_number?.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [orders, filter, searchQuery]);

  if (loading) {
    return <div className="p-10 text-[var(--color-brand-grey)]">Loading customers...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 shrink-0 bg-[var(--color-brand-bg-dark)]">
        <h1 className="text-3xl font-serif mb-2">Customers</h1>
        <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase">
          Understand your guests and their dining history
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Identified Orders</h3>
                <Users className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-3xl font-serif">{identifiedOrderCount}</p>
              <p className="text-xs text-[var(--color-brand-grey)] mt-2">Orders with guest names</p>
            </div>
            
            <div className="bg-[var(--color-brand-bg-dark)] border border-[var(--color-brand-gold)]/20 p-6 rounded-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-gold)]">Anonymous Orders</h3>
                <ShoppingBag className="w-4 h-4 text-[var(--color-brand-gold)]" />
              </div>
              <p className="text-3xl font-serif text-[var(--color-brand-gold)]">{anonymousOrderCount}</p>
              <p className="text-xs text-[var(--color-brand-grey)] mt-2">Total anonymous orders</p>
            </div>

            <div className="bg-[var(--color-brand-bg-dark)] border border-[var(--color-brand-gold)]/20 p-6 rounded-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-gold)]">Identified Spend</h3>
                <CreditCard className="w-4 h-4 text-[var(--color-brand-gold)]" />
              </div>
              <p className="text-3xl font-serif text-[var(--color-brand-gold)]">£{totalIdentifiedSpend.toFixed(2)}</p>
              <p className="text-xs text-[var(--color-brand-grey)] mt-2">From successful payments</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-grey)]" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-brand-bg-dark)] border border-white/10 rounded px-10 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-gold)]/50 transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              {(["ALL", "IDENTIFIED", "ANONYMOUS"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded text-xs tracking-wider uppercase font-medium transition-colors ${
                    filter === f 
                      ? "bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)]" 
                      : "border border-white/10 text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Data Area */}
          <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-lg overflow-hidden">
            {filter === "IDENTIFIED" ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Users className="w-12 h-12 mb-4 opacity-20 text-[var(--color-brand-grey)]" />
                <h3 className="text-xl font-serif mb-2">No customers yet</h3>
                <p className="text-sm text-[var(--color-brand-grey)] max-w-sm">
                  Customers will appear here when guests provide identifying information during the ordering process.
                </p>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <ShoppingBag className="w-12 h-12 mb-4 opacity-20 text-[var(--color-brand-grey)]" />
                <h3 className="text-xl font-serif mb-2">No anonymous orders</h3>
                <p className="text-sm text-[var(--color-brand-grey)]">
                  {searchQuery ? "No orders match your search." : "There are currently no anonymous orders."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-brand-grey)] bg-white/[0.02]">
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Order / Table</th>
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedOrders.map(order => {
                    const successfulPayment = order.payments?.find((p: any) => p.status === 'succeeded');
                    const displayAmount = successfulPayment ? successfulPayment.amount : order.total;
                    
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[var(--color-brand-ivory)] font-serif border border-white/10">
                              {order.customer_name ? order.customer_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="font-medium text-[var(--color-brand-ivory)]">{order.customer_name || 'Anonymous'}</div>
                              <div className="text-xs text-[var(--color-brand-grey)]">Guest</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-xs opacity-70 mb-1" title={order.id}>
                            #{order.id.split('-')[0]}
                          </div>
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-[var(--color-brand-grey)]">
                            Table {order.tables?.table_number || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--color-brand-grey)]">
                          {new Date(order.created_at).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          <span className={successfulPayment ? "text-[var(--color-brand-gold)]" : "text-[var(--color-brand-grey)] opacity-70"}>
                            £{Number(displayAmount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                              order.payment_status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {order.payment_status}
                            </span>
                            <span className="text-[10px] text-[var(--color-brand-grey)] uppercase">{order.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href="/orders" className="p-2 inline-flex items-center justify-center rounded-full hover:bg-white/10 text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
