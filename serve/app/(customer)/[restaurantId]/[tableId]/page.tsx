import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ restaurantId: string; tableId: string }>;
}) {
  const { restaurantId, tableId } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) return notFound();

  const { data: table } = await supabase
    .from("tables")
    .select("table_number")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (!table) return notFound();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-black text-white overflow-hidden">
      {/* Background Image - In a real app this would be a dynamic restaurant image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-luminosity" />
      </div>

      {/* Top section: Language (Mock) */}
      <div className="w-full flex justify-end p-6 z-20">
        <button className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
          <span>EN</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {/* Center section: Branding */}
      <div className="z-20 flex flex-col items-center text-center px-6">
        {/* Subtle decorative mark */}
        <div className="mb-6 opacity-80">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="var(--color-brand-gold)"/>
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif tracking-widest uppercase mb-4 text-[var(--color-brand-ivory)]">
          {restaurant.name}
        </h1>
        <p className="text-sm font-sans tracking-[0.2em] text-[var(--color-brand-grey)] uppercase">
          RESTAURANT
        </p>
      </div>

      {/* Bottom section: CTA & tagline */}
      <div className="z-20 w-full flex flex-col items-center px-6 pb-12 space-y-12">
        <div className="text-center space-y-2">
          <p className="text-lg font-serif text-[var(--color-brand-ivory)]">Exceptional food.</p>
          <p className="text-lg font-serif text-[var(--color-brand-ivory)]">Extraordinary moments.</p>
        </div>

        <Link 
          href={`/menu/${restaurantId}/${tableId}`}
          className="w-full max-w-sm bg-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold-light)] text-[var(--color-brand-bg-dark)] py-4 px-8 rounded flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(201,164,92,0.15)]"
        >
          <span className="font-sans font-medium text-sm tracking-[0.15em] uppercase">
            View Menu
          </span>
        </Link>
      </div>
    </div>
  );
}
