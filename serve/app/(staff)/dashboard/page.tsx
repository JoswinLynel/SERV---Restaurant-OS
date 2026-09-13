"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Users, Receipt, AlertCircle, Calendar } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export default function DashboardPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
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

  const fetchToday = async () => {
    if (!restaurantId) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    try {
      const res = await fetch(`/api/reports?restaurantId=${restaurantId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchToday();
  }, [restaurantId]);

  useRealtimeSync(restaurantId, fetchToday);

  const totalRevenue = data?.summary?.totalRevenue || 0;
  const activeOrders = (data?.orderStatusCounts?.pending || 0) + (data?.orderStatusCounts?.preparing || 0) + (data?.orderStatusCounts?.ready || 0);
  const preparing = data?.orderStatusCounts?.preparing || 0;
  const ready = data?.orderStatusCounts?.ready || 0;
  const totalOrders = data?.summary?.totalOrders || 0;
  const aov = data?.summary?.aov || 0;

  return (
    <div className="p-10 h-full overflow-y-auto bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] font-sans">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-serif">Overview</h1>
          <p className="text-[10px] text-[var(--color-brand-grey)] tracking-[0.2em] uppercase mt-2">Performance & Analytics</p>
        </div>
        <div className="flex items-center gap-4 bg-[var(--color-brand-bg-surface)] px-4 py-2 rounded border border-white/5">
          <Calendar className="w-4 h-4 text-[var(--color-brand-gold)]" />
          <span className="text-sm text-[var(--color-brand-grey)] tracking-wider">Today, {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-[var(--color-brand-bg-surface)] p-8 rounded-xl border border-white/5 relative overflow-hidden group hover:border-[var(--color-brand-gold)]/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-gold)]/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Today's Revenue</h3>
            <div className="p-2 bg-[var(--color-brand-gold)]/10 text-[var(--color-brand-gold)] rounded">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-serif">£{totalRevenue.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-status-green)] font-medium">Real Data</span>
            <span className="text-[var(--color-brand-grey)]">from successful payments</span>
          </div>
        </div>
        
        <div className="bg-[var(--color-brand-bg-surface)] p-8 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Active Orders</h3>
            <div className="p-2 bg-white/5 text-white/60 rounded">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-serif">{activeOrders}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-brand-ivory)] font-medium">{preparing}</span>
            <span className="text-[var(--color-brand-grey)]">Preparing</span>
            <span className="text-[var(--color-brand-grey)] ml-2">|</span>
            <span className="text-[var(--color-brand-ivory)] ml-2 font-medium">{ready}</span>
            <span className="text-[var(--color-brand-grey)]">Ready</span>
          </div>
        </div>
        
        <div className="bg-[var(--color-brand-bg-surface)] p-8 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Anonymous Orders</h3>
            <div className="p-2 bg-white/5 text-white/60 rounded">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-serif">{totalOrders}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-brand-ivory)] font-medium">Avg £{aov.toFixed(2)}</span>
            <span className="text-[var(--color-brand-grey)]">per order</span>
          </div>
        </div>
      </div>
      
      {/* Mock Chart Area Replaced with Real Data Indicator */}
      <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-8 rounded-xl mb-8 h-80 flex flex-col justify-center items-center relative overflow-hidden">
        <h3 className="absolute top-8 left-8 text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Revenue Overview</h3>
        
        {data?.timeSeries && data.timeSeries.length > 0 ? (
          <div className="w-full max-w-4xl h-48 border-b border-l border-white/10 relative flex items-end justify-between px-8 pb-0 mt-8">
            {data.timeSeries.map((day: any, i: number) => {
              const max = Math.max(...data.timeSeries.map((d: any) => d.revenue), 100);
              const height = (day.revenue / max) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                  <div className="w-12 bg-gradient-to-t from-[var(--color-brand-gold)]/50 to-[var(--color-brand-gold)] rounded-t-sm transition-all" style={{ height: `${Math.max(height, 5)}%` }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-brand-grey)]">No revenue data for today yet. View full Reports for historical trends.</div>
        )}
      </div>

      <div className="bg-[var(--color-brand-gold)]/5 border border-[var(--color-brand-gold)]/20 p-6 rounded flex items-start gap-6">
        <div className="p-3 bg-[var(--color-brand-gold)]/10 rounded-full mt-1 shrink-0">
          <AlertCircle className="w-5 h-5 text-[var(--color-brand-gold)]" />
        </div>
        <div>
          <h4 className="font-serif text-lg text-[var(--color-brand-gold)] mb-2">Dashboard Active</h4>
          <p className="text-sm text-[var(--color-brand-grey)] tracking-wide leading-relaxed">
            This dashboard now uses real, live database aggregations. Navigate to the Reports tab for a full breakdown of restaurant performance over custom date ranges.
          </p>
        </div>
      </div>
    </div>
  );
}
