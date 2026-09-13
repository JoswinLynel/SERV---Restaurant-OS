import { TrendingUp, Users, Receipt, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <h1 className="text-3xl font-serif mb-8 text-foreground">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--color-brand-charcoal)]/5 p-6 rounded-2xl border border-[var(--color-brand-charcoal)]/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-foreground/70 font-medium">Today's Revenue</h3>
            <div className="p-2 bg-[var(--color-brand-gold)]/20 text-[var(--color-brand-gold)] rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-serif">$4,289.50</p>
        </div>
        
        <div className="bg-[var(--color-brand-charcoal)]/5 p-6 rounded-2xl border border-[var(--color-brand-charcoal)]/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-foreground/70 font-medium">Active Orders</h3>
            <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-serif">12</p>
        </div>
        
        <div className="bg-[var(--color-brand-charcoal)]/5 p-6 rounded-2xl border border-[var(--color-brand-charcoal)]/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-foreground/70 font-medium">Guests Served</h3>
            <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-serif">148</p>
        </div>
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Welcome to SERVÉ</h4>
          <p className="text-blue-600/80 dark:text-blue-400/80">
            This is the restaurant dashboard where managers can view analytics, manage staff, and configure settings. Currently displaying simulated data for the demo environment.
          </p>
        </div>
      </div>
    </div>
  );
}
