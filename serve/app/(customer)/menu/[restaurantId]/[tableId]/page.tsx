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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-[var(--color-brand-charcoal)]/10 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-serif tracking-tight text-foreground">
            {restaurant.name}
          </h1>
          <p className="text-xs text-foreground/60 uppercase tracking-widest mt-0.5">
            Table {table.table_number}
          </p>
        </div>
      </header>

      {/* Categories Nav (Optional horizontal scroll) */}
      <nav className="px-6 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-6 border-b border-[var(--color-brand-charcoal)]/5">
        {categories.map((category: any) => (
          <a
            key={category.id}
            href={`#category-${category.id}`}
            className="text-sm uppercase tracking-widest font-medium text-foreground hover:text-[var(--color-brand-gold)] transition-colors"
          >
            {category.name}
          </a>
        ))}
      </nav>

      {/* Menu Content */}
      <main className="px-6 py-8 space-y-12">
        {categories.map((category: any) => (
          <section key={category.id} id={`category-${category.id}`}>
            <h2 className="text-2xl font-serif mb-6 text-foreground">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
