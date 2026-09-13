import Link from "next/link";
import { LayoutDashboard, ReceiptText, ChefHat, Users, Settings } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-brand-nearblack)] text-white flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="font-serif text-xl tracking-widest">SERVÉ</span>
        </div>
        
        <nav className="flex-1 py-6 space-y-1 px-3">
          {[
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "POS & Tables", href: "/pos", icon: ReceiptText },
            { name: "Kitchen", href: "/kitchen", icon: ChefHat },
            { name: "Customers", href: "/customers", icon: Users },
            { name: "Settings", href: "/settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/10 text-sm text-white/60">
          <p>Logged in as Manager</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
