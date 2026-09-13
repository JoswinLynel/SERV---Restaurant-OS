"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, ReceiptText, CreditCard, AlertCircle, Calendar, ShoppingBag, Grid } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type ReportData = {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    paidOrdersCount: number;
    unpaidOrdersCount: number;
    cancelledOrdersCount: number;
    aov: number;
  };
  timeSeries: { date: string; revenue: number; orders: number }[];
  bestSellingItems: { name: string; quantity: number; revenue: number }[];
  bestCategories: { name: string; quantity: number; revenue: number }[];
  tablePerformance: { table: string; orders: number; revenue: number }[];
  orderStatusCounts: Record<string, number>;
  busiestHours: { hour: string; count: number }[];
};

export default function ReportsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  
  const [dateRange, setDateRange] = useState<"TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH">("LAST_7_DAYS");

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

  const fetchReports = async () => {
    if (!restaurantId) return;
    
    // Calculate dates
    const now = new Date();
    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999);
    
    switch (dateRange) {
      case "TODAY":
        start.setHours(0, 0, 0, 0);
        break;
      case "YESTERDAY":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "LAST_7_DAYS":
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case "LAST_30_DAYS":
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;
      case "THIS_MONTH":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    try {
      const res = await fetch(`/api/reports?restaurantId=${restaurantId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (!res.ok) throw new Error("Failed to load reports");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [restaurantId, dateRange]);

  useRealtimeSync(restaurantId, fetchReports);

  // Max value for chart scaling
  const maxRevenue = useMemo(() => {
    if (!data?.timeSeries.length) return 100;
    return Math.max(...data.timeSeries.map(d => d.revenue), 100);
  }, [data]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-white/5 shrink-0 bg-[var(--color-brand-bg-dark)] flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-serif mb-2">Reports</h1>
          <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase">
            Understand your restaurant's performance
          </p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {(["TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_30_DAYS", "THIS_MONTH"] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded text-[10px] tracking-wider uppercase font-medium whitespace-nowrap transition-colors ${
                dateRange === range 
                  ? "bg-[var(--color-brand-gold)] text-[var(--color-brand-bg-dark)]" 
                  : "border border-white/10 text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]"
              }`}
            >
              {range.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              {error}
              <button onClick={fetchReports} className="ml-auto underline text-xs uppercase tracking-wider">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-lg border border-white/5" />)}
              </div>
              <div className="h-80 bg-white/5 rounded-lg border border-white/5" />
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-brand-grey)]">
              No sales data available.
            </div>
          ) : (
            <>
              {/* Top Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Revenue</h3>
                    <TrendingUp className="w-4 h-4 text-[var(--color-brand-gold)]" />
                  </div>
                  <p className="text-3xl font-serif text-[var(--color-brand-gold)]">£{data.summary.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-[var(--color-brand-grey)] mt-2">Paid successfully</p>
                </div>
                
                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Orders</h3>
                    <ReceiptText className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-3xl font-serif">{data.summary.totalOrders}</p>
                  <p className="text-xs text-[var(--color-brand-grey)] mt-2">Total genuine orders</p>
                </div>

                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Average Order</h3>
                    <ShoppingBag className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-3xl font-serif">£{data.summary.aov.toFixed(2)}</p>
                  <p className="text-xs text-[var(--color-brand-grey)] mt-2">Per paid order</p>
                </div>

                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Paid Orders</h3>
                    <CreditCard className="w-4 h-4 text-[var(--color-status-green)]" />
                  </div>
                  <p className="text-3xl font-serif text-[var(--color-status-green)]">{data.summary.paidOrdersCount}</p>
                  <div className="mt-2 text-xs flex gap-3 text-[var(--color-brand-grey)]">
                    <span>{data.summary.unpaidOrdersCount} unpaid</span>
                    <span>{data.summary.cancelledOrdersCount} cancelled</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-xl p-8 h-80 flex flex-col justify-end relative">
                <h3 className="absolute top-8 left-8 text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">
                  Revenue Over Time
                </h3>
                
                {data.timeSeries.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--color-brand-grey)]">
                    No sales data yet for this period.
                  </div>
                ) : (
                  <div className="w-full h-48 border-b border-l border-white/10 flex items-end justify-between px-2 sm:px-8 pb-0 mt-8 gap-2 overflow-hidden">
                    {data.timeSeries.map((day, i) => {
                      const heightPercent = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                      // Display simple date (e.g. DD/MM)
                      const dateObj = new Date(day.date);
                      const displayDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                      
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 bg-black/80 px-3 py-1 rounded text-[10px] tracking-wider opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-white/10 text-center">
                            <span className="text-[var(--color-brand-gold)]">£{day.revenue.toFixed(2)}</span>
                            <br/><span className="text-white/50">{day.orders} orders</span>
                          </div>
                          
                          <div 
                            className="w-full max-w-[40px] bg-gradient-to-t from-[var(--color-brand-gold)]/50 to-[var(--color-brand-gold)] rounded-t-sm transition-all group-hover:opacity-80" 
                            style={{ height: `${Math.max(heightPercent, 2)}%` }} 
                          />
                          <div className="text-[9px] text-[var(--color-brand-grey)] uppercase tracking-wider mt-2 truncate w-full text-center">
                            {displayDate}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Two Column Layout for details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Best Sellers */}
                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-[var(--color-brand-gold)]" />
                    <h3 className="text-sm tracking-wider uppercase font-serif text-[var(--color-brand-ivory)]">
                      Best-Selling Items
                    </h3>
                  </div>
                  {data.bestSellingItems.length === 0 ? (
                    <div className="p-6 text-sm text-[var(--color-brand-grey)] text-center">No item data</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-[var(--color-brand-grey)]">
                          <th className="px-6 py-4 font-medium">Item</th>
                          <th className="px-6 py-4 font-medium text-center">Qty</th>
                          <th className="px-6 py-4 font-medium text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.bestSellingItems.slice(0, 5).map((item, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">{item.name}</td>
                            <td className="px-6 py-4 text-center font-medium text-[var(--color-brand-grey)]">{item.quantity}</td>
                            <td className="px-6 py-4 text-right">£{item.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Categories */}
                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <Grid className="w-4 h-4 text-[var(--color-brand-gold)]" />
                    <h3 className="text-sm tracking-wider uppercase font-serif text-[var(--color-brand-ivory)]">
                      Sales By Category
                    </h3>
                  </div>
                  {data.bestCategories.length === 0 ? (
                    <div className="p-6 text-sm text-[var(--color-brand-grey)] text-center">No category data</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-[var(--color-brand-grey)]">
                          <th className="px-6 py-4 font-medium">Category</th>
                          <th className="px-6 py-4 font-medium text-center">Items</th>
                          <th className="px-6 py-4 font-medium text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.bestCategories.map((cat, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">{cat.name}</td>
                            <td className="px-6 py-4 text-center font-medium text-[var(--color-brand-grey)]">{cat.quantity}</td>
                            <td className="px-6 py-4 text-right">£{cat.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Table Performance */}
                <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="w-4 h-4 border border-[var(--color-brand-gold)] rounded-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[var(--color-brand-gold)] rounded-sm" />
                    </div>
                    <h3 className="text-sm tracking-wider uppercase font-serif text-[var(--color-brand-ivory)]">
                      Table Performance
                    </h3>
                  </div>
                  {data.tablePerformance.length === 0 ? (
                    <div className="p-6 text-sm text-[var(--color-brand-grey)] text-center">No table data</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-[var(--color-brand-grey)]">
                          <th className="px-6 py-4 font-medium">Table</th>
                          <th className="px-6 py-4 font-medium text-center">Orders</th>
                          <th className="px-6 py-4 font-medium text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.tablePerformance.slice(0, 5).map((t, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">Table {t.table}</td>
                            <td className="px-6 py-4 text-center font-medium text-[var(--color-brand-grey)]">{t.orders}</td>
                            <td className="px-6 py-4 text-right">£{t.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Mini Stats (Peak hours & statuses) */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Peak Hours */}
                  <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Peak Ordering Times</h3>
                    {data.busiestHours.length === 0 ? (
                      <p className="text-sm text-[var(--color-brand-grey)]">No time data available</p>
                    ) : (
                      <div className="space-y-4">
                        {data.busiestHours.map((h, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="font-mono text-sm">{h.hour}</div>
                            <div className="text-xs text-[var(--color-brand-grey)]">{h.count} orders</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Order Status */}
                  <div className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-6 rounded-lg">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Order Statuses</h3>
                    <div className="flex justify-between flex-wrap gap-4 text-sm">
                      {Object.entries(data.orderStatusCounts).map(([status, count]) => {
                        if (count === 0) return null;
                        return (
                          <div key={status} className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-grey)]">{status}</span>
                            <span className="font-medium text-lg">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
