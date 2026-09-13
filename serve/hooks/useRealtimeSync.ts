import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * A shared hook that ensures all pages in the staff application stay globally synchronized 
 * by listening to `orders` table insertions/updates scoped to the active `restaurantId`.
 */
export function useRealtimeSync(restaurantId: string | null, onSync: () => void) {
  useEffect(() => {
    if (!restaurantId) return;

    const supabase = createClient();

    // The 'orders' table acts as the unified event bus.
    // Order creation, order status updates, and webhook payment updates all modify the 'orders' table.
    const channel = supabase
      .channel('global-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => {
          onSync();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, onSync]);
}
