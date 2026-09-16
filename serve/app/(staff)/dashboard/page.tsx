"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Users, Receipt, Calendar, CreditCard, ChevronRight, Activity, Clock, ShoppingBag } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useRouter } from "next/navigation";

type DateRange = "today" | "yesterday" | "7days" | "30days";

export default function DashboardPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

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

  const fetchDashboardData = async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let compStart = new Date();
    let compEnd = new Date();

    if (dateRange === "today") {
      start.setHours(0, 0, 0, 0);
      compStart.setDate(compStart.getDate() - 1);
      compStart.setHours(0, 0, 0, 0);
      compEnd.setDate(compEnd.getDate() - 1);
      compEnd.setHours(23, 59, 59, 999);
    } else if (dateRange === "yesterday") {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      
      compStart.setDate(compStart.getDate() - 2);
      compStart.setHours(0, 0, 0, 0);
      compEnd.setDate(compEnd.getDate() - 2);
      compEnd.setHours(23, 59, 59, 999);
    } else if (dateRange === "7days") {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      
      compStart.setDate(compStart.getDate() - 14);
      compStart.setHours(0, 0, 0, 0);
      compEnd.setDate(compEnd.getDate() - 7);
      compEnd.setHours(23, 59, 59, 999);
    } else if (dateRange === "30days") {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      
      compStart.setDate(compStart.getDate() - 60);
      compStart.setHours(0, 0, 0, 0);
      compEnd.setDate(compEnd.getDate() - 30);
      compEnd.setHours(23, 59, 59, 999);
    }

    try {
      const res = await fetch(`/api/reports?restaurantId=${restaurantId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}&compareStartDate=${compStart.toISOString()}&compareEndDate=${compEnd.toISOString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [restaurantId, dateRange]);

  useRealtimeSync(restaurantId, fetchDashboardData);

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0 && current > 0) return "+100%";
    if (previous === 0 && current === 0) return "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-[var(--color-status-yellow)]';
      case 'preparing': return 'text-[var(--color-status-orange)]';
      case 'ready': return 'text-[var(--color-status-green)]';
      case 'completed': return 'text-white/70';
      case 'cancelled': return 'text-red-400';
      default: return 'text-[var(--color-brand-grey)]';
    }
  };

  if (!data && isLoading) {
    return (
      <div className="p-10 h-full overflow-y-auto bg-[var(--color-brand-bg-dark)] flex items-center justify-center">
        <p className="text-[var(--color-brand-grey)] tracking-widest uppercase text-sm animate-pulse">Loading Operations Centre...</p>
      </div>
    );
  }

  const { summary, timeSeries, orderStatusCounts, liveOrders, recentOrders, customerStats, paymentStats, bestSellingItems, bestCategories, tablePerformance, ordersByHour } = data || {};
  const activeOrders = (orderStatusCounts?.pending || 0) + (orderStatusCounts?.preparing || 0) + (orderStatusCounts?.ready || 0);
  const totalOrders = summary?.totalOrders || 0;
  const compHasData = summary?.comparison?.hasData;

  return (
    <div className="p-8 md:p-10 h-full overflow-y-auto bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] font-sans">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-serif">Overview</h1>
          <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase mt-2">Performance & Analytics</p>
        </div>
        <div className="flex bg-[var(--color-brand-bg-surface)] p-1 rounded border border-white/5 overflow-x-auto w-full md:w-auto">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7days", label: "Last 7 Days" },
            { id: "30days", label: "Last 30 Days" },
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id as DateRange)}
              className={`px-4 py-2 text-xs font-medium tracking-widest uppercase rounded transition-colors whitespace-nowrap ${
                dateRange === range.id 
                  ? 'bg-[var(--color-brand-bg-elevated)] text-[var(--color-brand-ivory)] shadow' 
                  : 'text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 2. KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        
        {/* REVENUE */}
        <div className="bg-[var(--color-brand-bg-surface)] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[var(--color-brand-gold)]/30 transition-colors flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-brand-gold)]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-4">Revenue</h3>
          <p className="text-3xl font-serif">£{(summary?.totalRevenue || 0).toFixed(2)}</p>
          <div className="mt-auto pt-4 text-xs flex items-center gap-2">
            {compHasData ? (
              <span className={`font-medium ${summary.totalRevenue >= summary.comparison.revenue ? 'text-[var(--color-status-green)]' : 'text-red-400'}`}>
                {getPercentageChange(summary.totalRevenue, summary.comparison.revenue)}
              </span>
            ) : (
              <span className="text-[var(--color-brand-grey)]">vs previous period</span>
            )}
          </div>
        </div>

        {/* ORDERS */}
        <div className="bg-[var(--color-brand-bg-surface)] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-4">Orders</h3>
          <p className="text-3xl font-serif">{summary?.totalOrders || 0}</p>
          <div className="mt-auto pt-4 text-xs flex items-center gap-2">
            {compHasData ? (
              <span className={`font-medium ${summary.totalOrders >= summary.comparison.orders ? 'text-[var(--color-status-green)]' : 'text-red-400'}`}>
                {getPercentageChange(summary.totalOrders, summary.comparison.orders)}
              </span>
            ) : (
              <span className="text-[var(--color-brand-grey)]">vs previous period</span>
            )}
          </div>
        </div>

        {/* AVERAGE ORDER VALUE */}
        <div className="bg-[var(--color-brand-bg-surface)] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-4">Avg Order Value</h3>
          <p className="text-3xl font-serif">£{(summary?.aov || 0).toFixed(2)}</p>
          <div className="mt-auto pt-4 text-xs flex items-center gap-2">
             {compHasData ? (
              <span className={`font-medium ${summary.aov >= summary.comparison.aov ? 'text-[var(--color-status-green)]' : 'text-red-400'}`}>
                {getPercentageChange(summary.aov, summary.comparison.aov)}
              </span>
            ) : (
              <span className="text-[var(--color-brand-grey)]">vs previous period</span>
            )}
          </div>
        </div>

        {/* ACTIVE ORDERS */}
        <div className="bg-[var(--color-brand-bg-surface)] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[var(--color-status-orange)]/30 transition-colors flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-status-orange)]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-4">Active Orders</h3>
          <p className="text-3xl font-serif">{activeOrders}</p>
          <div className="mt-auto pt-4 text-[10px] uppercase tracking-wider flex flex-col gap-1.5 text-[var(--color-brand-grey)]">
            <span className="flex items-center justify-between"><span>Pending</span> <span className="text-white">{orderStatusCounts?.pending || 0}</span></span>
            <span className="flex items-center justify-between"><span>Preparing</span> <span className="text-white">{orderStatusCounts?.preparing || 0}</span></span>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="bg-[var(--color-brand-bg-surface)] p-6 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-4">Customers</h3>
          <p className="text-3xl font-serif">{customerStats?.total || 0}</p>
          <div className="mt-auto pt-4 text-[10px] uppercase tracking-wider flex flex-col gap-1.5 text-[var(--color-brand-grey)]">
            <span className="flex items-center justify-between"><span>Identified</span> <span className="text-[var(--color-brand-gold)] font-medium">{customerStats?.identified || 0}</span></span>
            <span className="flex items-center justify-between"><span>Anonymous</span> <span className="text-white">{customerStats?.anonymous || 0}</span></span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* 3. SALES / REVENUE CHART */}
        <div className="lg:col-span-2 bg-[var(--color-brand-bg-surface)] border border-white/5 p-8 rounded-xl flex flex-col relative group">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Revenue & Orders</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[var(--color-brand-gold)] rounded-sm"></div><span className="text-[var(--color-brand-grey)]">Revenue (£)</span></div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-end min-h-[250px] relative">
            {timeSeries?.length > 0 && summary?.totalRevenue > 0 ? (
              <div className="w-full h-full border-b border-l border-white/10 flex items-end justify-between px-2 pb-0 pt-4 relative">
                {timeSeries.map((day: any, i: number) => {
                  const maxRev = Math.max(...timeSeries.map((d: any) => d.revenue), 1);
                  const heightRev = (day.revenue / maxRev) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group/bar px-1 relative">
                      <div className="w-full max-w-[3rem] bg-gradient-to-t from-[var(--color-brand-gold)]/40 to-[var(--color-brand-gold)] rounded-t-sm transition-all hover:opacity-80" style={{ height: `${Math.max(heightRev, 2)}%` }}>
                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--color-brand-bg-dark)] border border-[var(--color-brand-gold)]/30 text-[var(--color-brand-ivory)] text-xs py-1.5 px-3 rounded shadow-xl pointer-events-none whitespace-nowrap z-10 transition-opacity">
                          £{day.revenue.toFixed(2)} <span className="text-[var(--color-brand-grey)] ml-1">({day.orders} orders)</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--color-brand-grey)] mt-3 truncate max-w-full">
                        {dateRange === 'today' || dateRange === 'yesterday' 
                          ? 'Today' 
                          : new Date(day.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-8 h-8 text-white/10 mb-4" />
                <h4 className="text-[var(--color-brand-ivory)] font-medium mb-1">No completed sales yet</h4>
                <p className="text-sm text-[var(--color-brand-grey)]">Revenue will appear here once payments are recorded.</p>
                {totalOrders > 0 && <p className="text-xs text-[var(--color-status-yellow)] mt-2">There are {totalOrders} orders waiting for payment.</p>}
              </div>
            )}
          </div>
        </div>

        {/* 4. ORDER ACTIVITY & 10. CUSTOMER INSIGHTS */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl flex-1 flex flex-col">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Order Activity</h3>
            {totalOrders > 0 ? (
              <div className="space-y-4 flex-1 justify-center flex flex-col">
                {[
                  { id: 'pending', label: 'Pending', count: orderStatusCounts?.pending || 0, color: 'bg-[var(--color-status-yellow)]' },
                  { id: 'preparing', label: 'Preparing', count: orderStatusCounts?.preparing || 0, color: 'bg-[var(--color-status-orange)]' },
                  { id: 'ready', label: 'Ready', count: orderStatusCounts?.ready || 0, color: 'bg-[var(--color-status-green)]' },
                  { id: 'completed', label: 'Completed', count: orderStatusCounts?.completed || 0, color: 'bg-white/20' },
                  { id: 'cancelled', label: 'Cancelled', count: orderStatusCounts?.cancelled || 0, color: 'bg-red-500/20 text-red-400' },
                ].map(stat => (
                  <div key={stat.id} onClick={() => router.push('/orders')} className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                      <span className="text-sm text-[var(--color-brand-grey)] group-hover:text-white transition-colors">{stat.label}</span>
                    </div>
                    <span className="font-serif">{stat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 py-10">
                <Receipt className="w-6 h-6 mb-2" />
                <p className="text-sm">No activity</p>
              </div>
            )}
          </div>

          <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-4">Customer Insights</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-serif text-[var(--color-brand-gold)]">
                  {customerStats?.total > 0 ? Math.round((customerStats.identified / customerStats.total) * 100) : 0}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-brand-grey)] mt-1">Identification Rate</p>
              </div>
              <button onClick={() => router.push('/customers')} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group">
                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* 5. LIVE ACTIVE ORDERS */}
        <div className="bg-[var(--color-brand-bg-surface)] border border-[var(--color-brand-gold)]/10 p-6 rounded-xl flex flex-col col-span-1 lg:col-span-2 relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.03)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-gold)]/5 rounded-bl-full -mr-32 -mt-32 pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-ivory)] font-bold">Live Orders</h3>
            </div>
            {liveOrders?.length > 0 && (
              <button onClick={() => router.push('/orders')} className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-brand-gold)] hover:underline flex items-center gap-1 bg-[var(--color-brand-gold)]/10 px-3 py-1.5 rounded transition-colors hover:bg-[var(--color-brand-gold)]/20">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 relative z-10">
            {liveOrders && liveOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveOrders.map((order: any) => (
                  <div key={order.id} onClick={() => router.push(`/orders?orderId=${order.id}`)} className="bg-[var(--color-brand-bg-dark)] border border-white/5 p-5 rounded-lg cursor-pointer hover:border-[var(--color-brand-gold)]/40 transition-all hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] group relative overflow-hidden flex flex-col gap-3">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-brand-gold)]/30 group-hover:bg-[var(--color-brand-gold)] transition-colors"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-serif text-[var(--color-brand-ivory)] text-lg">#{order.id.split('-')[0].toUpperCase()}</span>
                        <span className="text-sm text-[var(--color-brand-grey)]">{order.customer_name || 'Anonymous'}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-1 bg-white/5 rounded uppercase tracking-widest font-bold ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                    
                    <div className="flex justify-between items-end mt-auto pt-2 border-t border-white/5">
                      <div className="flex flex-col gap-1 text-[11px] text-[var(--color-brand-grey)] tracking-wide">
                        <span>Table {order.tables?.table_number} · {order.order_items?.length || 0} items</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-white/30" /> {getTimeAgo(order.created_at)}</span>
                      </div>
                      <span className="font-serif text-[var(--color-brand-ivory)]">£{(order.payments?.[0]?.amount || (order.order_items || []).reduce((acc: number, item: any) => acc + Number(item.total_price), 0)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center opacity-50 py-10">
                <Activity className="w-8 h-8 mb-4 text-[var(--color-brand-grey)]" />
                <h4 className="text-[var(--color-brand-ivory)] font-medium mb-1">No active orders</h4>
                <p className="text-sm">All caught up.</p>
              </div>
            )}
          </div>
        </div>

        {/* 12. PAYMENT OVERVIEW */}
        <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Payment Status</h3>
            <button onClick={() => router.push('/payments')} className="text-xs text-[var(--color-brand-grey)] hover:text-white transition-colors">
              Details
            </button>
          </div>
          
          {totalOrders > 0 ? (
            <div className="space-y-5 flex-1 flex flex-col justify-center">
               {[
                  { id: 'succeeded', label: 'Succeeded', count: paymentStats?.succeeded || 0, color: 'bg-[var(--color-status-green)]' },
                  { id: 'pending', label: 'Pending', count: paymentStats?.pending || 0, color: 'bg-[var(--color-status-yellow)]' },
                  { id: 'failed', label: 'Failed', count: paymentStats?.failed || 0, color: 'bg-red-500' },
                  { id: 'refunded', label: 'Refunded', count: paymentStats?.refunded || 0, color: 'bg-white/40' },
                ].map(stat => (
                  <div key={stat.id} className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-brand-grey)]">{stat.label}</span>
                      <span className="font-medium text-white">{stat.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${Math.max((stat.count / Math.max(totalOrders, 1)) * 100, (stat.count > 0 ? 3 : 0))}%` }}></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 py-10">
              <CreditCard className="w-6 h-6 mb-4 text-[var(--color-brand-grey)]" />
              <p className="text-sm text-white">No payments recorded</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* 6. TOP SELLING ITEMS */}
        <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl flex flex-col">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Top Selling Items</h3>
          {bestSellingItems?.length > 0 ? (
             <div className="space-y-4 flex-1">
               {bestSellingItems.map((item: any, i: number) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer" onClick={() => router.push('/menu-admin')}>
                   <div className="flex items-center gap-3">
                     <span className="text-xs text-[var(--color-brand-gold)] font-mono w-4 opacity-50">{i + 1}.</span>
                     <span className="text-sm truncate max-w-[140px] text-white/90 group-hover:text-[var(--color-brand-gold)] transition-colors">{item.name}</span>
                   </div>
                   <span className="text-[10px] text-[var(--color-brand-grey)] bg-black/30 px-2.5 py-1 rounded-sm uppercase tracking-wider border border-white/5">{item.quantity} sold</span>
                 </div>
               ))}
             </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 py-10">
              <ShoppingBag className="w-6 h-6 mb-4" />
              <p className="text-sm text-[var(--color-brand-grey)]">No sales data</p>
            </div>
          )}
        </div>

        {/* 7. CATEGORY PERFORMANCE */}
        <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl flex flex-col">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Sales By Category</h3>
          {bestCategories?.length > 0 ? (
             <div className="space-y-5 flex-1">
               {bestCategories.slice(0, 5).map((cat: any, i: number) => (
                 <div key={i} className="flex flex-col gap-2">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-[var(--color-brand-grey)]">{cat.name}</span>
                     <span className="font-medium text-white/90">£{cat.revenue.toFixed(2)}</span>
                   </div>
                   <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-brand-gold)]/60 rounded-full" style={{ width: `${Math.max((cat.revenue / (bestCategories[0]?.revenue || 1)) * 100, 2)}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 py-10">
               <p className="text-sm text-[var(--color-brand-grey)]">No category data</p>
            </div>
          )}
        </div>

        {/* 8. TABLE PERFORMANCE */}
        <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl flex flex-col">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Table Performance</h3>
          {tablePerformance?.length > 0 ? (
             <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {tablePerformance.slice(0, 5).map((t: any, i: number) => (
                 <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                   <div className="flex flex-col gap-1">
                     <span className="text-sm font-medium text-[var(--color-brand-ivory)] flex items-center gap-2">
                       Table {t.table}
                       {t.active > 0 && <span title={`${t.active} active orders`} className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>}
                     </span>
                     <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-grey)]">{t.orders} orders</span>
                   </div>
                   <span className="text-sm font-serif text-[var(--color-brand-gold)]">£{t.revenue.toFixed(2)}</span>
                 </div>
               ))}
             </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 py-10">
               <p className="text-sm text-[var(--color-brand-grey)]">No tables active</p>
            </div>
          )}
        </div>

        {/* 9. PEAK HOURS */}
        <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl flex flex-col relative group">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)] mb-6">Peak Hours</h3>
          {ordersByHour?.length > 0 ? (
             <div className="flex-1 flex items-end justify-between px-2 h-32 mt-4 relative">
               {ordersByHour.map((hr: any, i: number) => {
                 const max = Math.max(...ordersByHour.map((h: any) => h.count), 1);
                 const height = (hr.count / max) * 100;
                 return (
                   <div key={i} className="flex flex-col items-center group/bar relative h-full justify-end w-full">
                     <div className="w-[80%] max-w-[1.5rem] bg-[var(--color-brand-grey)]/20 group-hover/bar:bg-[var(--color-brand-gold)]/60 transition-colors rounded-t-sm" style={{ height: `${Math.max(height, 5)}%` }}></div>
                     <span className="text-[9px] text-white/30 mt-3 absolute -bottom-6">{hr.hour.split(':')[0]}</span>
                     
                     <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--color-brand-bg-dark)] border border-white/10 text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 transition-opacity">
                        {hr.hour}: {hr.count} orders
                      </div>
                   </div>
                 );
               })}
             </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 py-10">
              <Clock className="w-6 h-6 mb-4 text-[var(--color-brand-grey)]" />
              <p className="text-sm text-white">No activity recorded</p>
            </div>
          )}
        </div>

      </div>

      {/* 11. RECENT ORDERS */}
      <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-6 rounded-xl overflow-x-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Recent Orders</h3>
          <button onClick={() => router.push('/orders')} className="text-xs text-[var(--color-brand-grey)] hover:text-white transition-colors">
            View All
          </button>
        </div>
        
        {recentOrders?.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-[var(--color-brand-grey)] uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="pb-4 px-4 font-normal">Order</th>
                <th className="pb-4 px-4 font-normal">Customer</th>
                <th className="pb-4 px-4 font-normal">Table</th>
                <th className="pb-4 px-4 font-normal">Items</th>
                <th className="pb-4 px-4 font-normal text-right">Total</th>
                <th className="pb-4 px-4 font-normal text-center">Status</th>
                <th className="pb-4 px-4 font-normal text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr 
                  key={order.id} 
                  onClick={() => router.push(`/orders?orderId=${order.id}`)}
                  className="border-b border-white/5 hover:bg-[var(--color-brand-gold)]/5 transition-colors cursor-pointer group"
                >
                  <td className="py-5 px-4 font-mono text-[var(--color-brand-ivory)] group-hover:text-[var(--color-brand-gold)] transition-colors">#{order.id.split('-')[0].toUpperCase()}</td>
                  <td className="py-5 px-4 text-white/90">{order.customer_name || 'Anonymous'}</td>
                  <td className="py-5 px-4 text-[var(--color-brand-grey)]">Table {order.tables?.table_number}</td>
                  <td className="py-5 px-4 text-[var(--color-brand-grey)]">{order.order_items?.length || 0}</td>
                  <td className="py-5 px-4 font-serif text-[var(--color-brand-ivory)] text-right">£{(order.payments?.[0]?.amount || (order.order_items || []).reduce((acc: number, item: any) => acc + Number(item.total_price), 0)).toFixed(2)}</td>
                  <td className="py-5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded bg-white/5 uppercase tracking-widest text-[9px] font-bold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-right text-[var(--color-brand-grey)] text-xs tracking-wide">{getTimeAgo(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center opacity-50 flex flex-col justify-center items-center border border-dashed border-white/10 rounded-lg bg-black/20 mt-4">
             <Receipt className="w-8 h-8 mb-4 text-[var(--color-brand-grey)]" />
             <p className="text-sm text-white">No recent orders</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
