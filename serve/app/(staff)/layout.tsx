import Link from "next/link";
import { LayoutDashboard, ReceiptText, ChefHat, Grid, BookOpen, CreditCard, Users, BarChart3, Settings } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[var(--color-brand-bg-surface)] text-[var(--color-brand-ivory)] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-brand-bg-dark)] border-r border-white/5 flex-col hidden md:flex shrink-0">
        <div className="h-20 flex flex-col items-center justify-center border-b border-white/5 px-6">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 opacity-80">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="var(--color-brand-gold)"/>
          </svg>
          <span className="font-serif text-sm tracking-widest uppercase">SERVÉ</span>
        </div>
        
        <nav className="flex-1 py-8 space-y-1.5 px-4 overflow-y-auto hide-scrollbar">
          {[
            { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { name: "Orders", href: "/orders", icon: ReceiptText },
            { name: "Kitchen", href: "/kitchen", icon: ChefHat },
            { name: "Tables", href: "/pos", icon: Grid },
            { name: "Menu", href: "/menu-admin", icon: BookOpen },
            { name: "Payments", href: "/payments", icon: CreditCard },
            { name: "Customers", href: "/customers", icon: Users },
            { name: "Reports", href: "/reports", icon: BarChart3 },
            { name: "Settings", href: "/settings", icon: Settings },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isActive = idx === 3; // Hardcoding POS/Tables active for demo if needed, or better just rely on hover
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-4 px-4 py-3 rounded text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)] hover:bg-white/5 transition-colors group"
              >
                <Icon className="w-4 h-4 group-hover:text-[var(--color-brand-gold)] transition-colors" />
                <span className="font-sans text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg-elevated)] border border-white/10 flex items-center justify-center">
            <span className="font-serif text-xs text-[var(--color-brand-gold)]">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Manager</span>
            <span className="text-[10px] text-[var(--color-brand-grey)] tracking-wider">manager@serve.co.uk</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--color-brand-bg-surface)]">
        {children}
      </div>
    </div>
  );
}
