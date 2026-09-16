"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Receipt, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function PaymentsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

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
      setRestaurantId("20000000-0000-0000-0000-000000000002");
    };
    initAuth();
  }, [supabase]);

  const fetchPayments = async () => {
    if (!restaurantId) return;
    setLoading(true);

    let query = supabase
      .from("payments")
      .select(`
        *,
        orders!inner(
          id, 
          restaurant_id,
          customer_name,
          tables(table_number)
        )
      `)
      .eq("orders.restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (filter !== "ALL") {
      query = query.eq("status", filter.toLowerCase());
    }

    const { data, error } = await query;
    if (data) {
      setPayments(data);
    } else if (error) {
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [restaurantId, filter, supabase]);

  useRealtimeSync(restaurantId, fetchPayments);

  if (loading) {
    return <div className="p-10 text-[var(--color-brand-grey)]">Loading payments...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans overflow-hidden">
      <div className="p-8 border-b border-white/5 shrink-0 flex justify-between items-center bg-[var(--color-brand-bg-dark)]">
        <div>
          <h1 className="text-3xl font-serif">Payments</h1>
          <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase mt-2">Manage transactions</p>
        </div>
        <div className="flex gap-2">
          {["ALL", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"].map(f => (
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

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-brand-grey)]">
              <Receipt className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-serif">No payments yet.</p>
              <p className="text-sm mt-2">Wait for customers to complete checkout.</p>
            </div>
          ) : (
            <div className="bg-[var(--color-brand-bg-dark)] rounded-lg border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-[var(--color-brand-grey)]">
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Table</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--color-brand-grey)]">
                        {new Date(payment.created_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs opacity-70" title={payment.order_id}>
                          {payment.order_id.split('-')[0]}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-[var(--color-brand-bg-elevated)] border border-white/10 px-2 py-1 rounded text-xs uppercase tracking-wider text-[var(--color-brand-ivory)]">
                          {payment.orders.customer_name || "Anonymous"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-white/5 px-2 py-1 rounded text-xs">
                          {payment.orders.tables?.table_number || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-[var(--color-brand-gold)]">
                        £{Number(payment.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${
                          payment.status === 'succeeded' ? 'bg-green-500/10 text-green-400' :
                          payment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/orders?orderId=${payment.order_id}`} className="text-xs text-[var(--color-brand-gold)] hover:underline">
                          View Order
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
