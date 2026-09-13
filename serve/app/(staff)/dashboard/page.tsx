import { TrendingUp, Users, Receipt, AlertCircle, Calendar } from "lucide-react";

export default function DashboardPage() {
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
          <p className="text-4xl font-serif">£4,289.50</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-status-green)] font-medium">+12.5%</span>
            <span className="text-[var(--color-brand-grey)]">vs yesterday</span>
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
          <p className="text-4xl font-serif">12</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-brand-ivory)] font-medium">8</span>
            <span className="text-[var(--color-brand-grey)]">Preparing</span>
            <span className="text-[var(--color-brand-grey)] ml-2">|</span>
            <span className="text-[var(--color-brand-ivory)] ml-2 font-medium">4</span>
            <span className="text-[var(--color-brand-grey)]">Ready</span>
          </div>
        </div>
        
        <div className="bg-[var(--color-brand-bg-surface)] p-8 rounded-xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Guests Served</h3>
            <div className="p-2 bg-white/5 text-white/60 rounded">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-serif">148</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-[var(--color-brand-ivory)] font-medium">Avg £29.00</span>
            <span className="text-[var(--color-brand-grey)]">per guest</span>
          </div>
        </div>
      </div>
      
      {/* Mock Chart Area */}
      <div className="bg-[var(--color-brand-bg-surface)] border border-white/5 p-8 rounded-xl mb-8 h-80 flex flex-col justify-center items-center relative overflow-hidden">
        <h3 className="absolute top-8 left-8 text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-grey)]">Revenue Overview</h3>
        
        {/* Abstract mock chart lines */}
        <div className="w-full max-w-4xl h-48 border-b border-l border-white/10 relative flex items-end justify-between px-8 pb-0">
          {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
            <div key={i} className="w-12 bg-gradient-to-t from-[var(--color-brand-gold)]/50 to-[var(--color-brand-gold)] rounded-t-sm" style={{ height: `${height}%` }} />
          ))}
        </div>
        
        <div className="w-full max-w-4xl flex justify-between px-8 mt-4 text-[10px] text-[var(--color-brand-grey)] uppercase tracking-widest">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>

      <div className="bg-[var(--color-brand-gold)]/5 border border-[var(--color-brand-gold)]/20 p-6 rounded flex items-start gap-6">
        <div className="p-3 bg-[var(--color-brand-gold)]/10 rounded-full mt-1 shrink-0">
          <AlertCircle className="w-5 h-5 text-[var(--color-brand-gold)]" />
        </div>
        <div>
          <h4 className="font-serif text-lg text-[var(--color-brand-gold)] mb-2">Welcome to SERVÉ</h4>
          <p className="text-sm text-[var(--color-brand-grey)] tracking-wide leading-relaxed">
            This is the restaurant dashboard where managers can view analytics, manage staff, and configure settings. Currently displaying simulated data for the demonstration environment.
          </p>
        </div>
      </div>
    </div>
  );
}
