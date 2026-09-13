import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MenuItemCard } from "@/components/customer/MenuItemCard";
import { FloatingBasket } from "@/components/customer/FloatingBasket";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ restaurantId: string; tableId: string }>;
}) {
  const { restaurantId, tableId } = await params;
  const supabase = await createClient();

  // Fetch restaurant details
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) {
    return notFound();
  }

  // Fetch table details
  const { data: table } = await supabase
    .from("tables")
    .select("table_number")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (!table) {
    return notFound();
  }

  // Fetch menu and categories with items
  const { data: menus } = await supabase
    .from("menus")
    .select(`
      id,
      categories (
        id, name, display_order,
        menu_items (
          id, name, description, price, image_url, is_available, dietary_labels, display_order
        )
      )
    `)
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .limit(1)
    .single();

  const categories = menus?.categories || [];
  categories.sort((a: any, b: any) => a.display_order - b.display_order);
  categories.forEach((c: any) => {
    c.menu_items.sort((a: any, b: any) => a.display_order - b.display_order);
  });

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg-dark)] text-[var(--color-brand-ivory)] pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--color-brand-bg-dark)]/90 backdrop-blur-md px-6 py-6 flex flex-col items-center border-b border-white/5">
        <div className="w-full flex justify-between items-start mb-2">
          <div className="flex-1" />
          <div className="flex-1 flex justify-center">
            {/* Minimal Logo Mark */}
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
              <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="var(--color-brand-gold)"/>
            </svg>
          </div>
          <div className="flex-1 flex justify-end">
            <span className="text-[10px] uppercase tracking-widest text-[var(--color-brand-grey)] flex items-center gap-1 cursor-pointer">
              EN <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </span>
          </div>
        </div>
        <h1 className="text-xl font-serif tracking-widest uppercase text-[var(--color-brand-ivory)] mt-2">
          {restaurant.name}
        </h1>
        <p className="text-[10px] text-[var(--color-brand-grey)] uppercase tracking-[0.2em] mt-1">
          Table {table.table_number}
        </p>
      </header>

      {/* Categories Nav */}
      <nav className="px-6 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-8 border-b border-white/5 sticky top-[108px] z-10 bg-[var(--color-brand-bg-dark)]/90 backdrop-blur-md">
        {categories.map((category: any, idx: number) => (
          <a
            key={category.id}
            href={`#category-${category.id}`}
            className={`text-[11px] uppercase tracking-[0.15em] font-medium transition-colors ${idx === 0 ? 'text-[var(--color-brand-gold)] border-b border-[var(--color-brand-gold)] pb-1' : 'text-[var(--color-brand-grey)] hover:text-[var(--color-brand-ivory)]'}`}
          >
            {category.name}
          </a>
        ))}
      </nav>

      {/* Menu Content */}
      <main className="px-4 py-8 space-y-16 max-w-3xl mx-auto">
        {categories.map((category: any) => (
          <section key={category.id} id={`category-${category.id}`}>
            <h2 className="text-2xl font-serif mb-6 px-2 text-[var(--color-brand-ivory)] border-b border-white/5 pb-4">
              {category.name}
            </h2>
            <div className="flex flex-col space-y-1">
              {category.menu_items.map((item: any) => (
                <MenuItemCard key={item.id} item={item} restaurantId={restaurantId} />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Floating Basket Button */}
      <FloatingBasket />
    </div>
  );
}
