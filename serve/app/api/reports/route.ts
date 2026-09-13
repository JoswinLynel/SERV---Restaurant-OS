import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use the admin client or a service role client if needed, 
// but it's better to use the authenticated client. 
// However, since we might not have full auth set up, we'll use the service role key 
// for internal reporting API, ensuring we strictly check restaurantId.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const startDate = searchParams.get("startDate"); // ISO string
  const endDate = searchParams.get("endDate"); // ISO string

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // 1. Fetch Orders within date range
  let ordersQuery = supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_status,
      created_at,
      tables ( id, table_number ),
      payments ( amount, status )
    `)
    .eq("restaurant_id", restaurantId);

  if (startDate) ordersQuery = ordersQuery.gte("created_at", startDate);
  if (endDate) ordersQuery = ordersQuery.lte("created_at", endDate);

  const { data: orders, error: ordersError } = await ordersQuery;
  
  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  // 2. Fetch Order Items for these orders (only if orders exist)
  let orderItems: any[] = [];
  if (orders && orders.length > 0) {
    // We only want items from non-cancelled orders for sales stats
    const validOrderIds = orders
      .filter(o => o.status !== 'cancelled' && (o.payment_status === 'paid' || o.payments.some((p:any) => p.status === 'succeeded')))
      .map(o => o.id);
    
    // Split into chunks if there are too many (Supabase max URL length limit)
    // For simplicity in this demo, we'll fetch all items for the restaurant in the date range
    // by joining through orders. Wait, we can't easily join backwards in postgrest to filter by date.
    // Instead, we can just fetch items for the valid order IDs.
    
    if (validOrderIds.length > 0) {
      // Chunking to avoid URL too long
      const chunkSize = 150;
      for (let i = 0; i < validOrderIds.length; i += chunkSize) {
        const chunk = validOrderIds.slice(i, i + chunkSize);
        const { data: itemsChunk } = await supabase
          .from("order_items")
          .select(`
            quantity,
            total_price,
            menu_items ( id, name, category_id, categories ( id, name ) )
          `)
          .in("order_id", chunk);
          
        if (itemsChunk) {
          orderItems = [...orderItems, ...itemsChunk];
        }
      }
    }
  }

  // AGGREGATIONS

  let totalRevenue = 0;
  let paidOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let unpaidOrdersCount = 0;
  const revenueByDate: Record<string, number> = {};
  const ordersByDate: Record<string, number> = {};
  const tableStats: Record<string, { orders: number; revenue: number }> = {};
  const orderStatusCounts: Record<string, number> = {
    pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0
  };
  const peakHours: Record<string, number> = {};

  orders.forEach((order: any) => {
    // Basic status counts
    orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;
    if (order.status === 'cancelled') cancelledOrdersCount++;

    // Calculate revenue for this order based on successful payments
    let orderRevenue = 0;
    let hasSuccessfulPayment = false;
    
    if (order.payments && Array.isArray(order.payments)) {
      order.payments.forEach((p: any) => {
        if (p.status === 'succeeded') {
          orderRevenue += Number(p.amount);
          hasSuccessfulPayment = true;
        }
      });
    }

    if (hasSuccessfulPayment) {
      totalRevenue += orderRevenue;
      paidOrdersCount++;
    } else if (order.status !== 'cancelled') {
      unpaidOrdersCount++;
    }

    // Time series (group by day YYYY-MM-DD)
    // Adjusting for basic date string. In a real app, use timezone.
    const dateObj = new Date(order.created_at);
    const dateStr = dateObj.toISOString().split('T')[0];
    const hourStr = dateObj.getHours().toString().padStart(2, '0') + ':00';
    
    // Only count genuine orders (not cancelled) for trends, or count all? Let's count non-cancelled for trends
    if (order.status !== 'cancelled') {
      ordersByDate[dateStr] = (ordersByDate[dateStr] || 0) + 1;
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + orderRevenue;
      peakHours[hourStr] = (peakHours[hourStr] || 0) + 1;
      
      // Table stats
      if (order.tables) {
        const tNum = order.tables.table_number;
        if (!tableStats[tNum]) tableStats[tNum] = { orders: 0, revenue: 0 };
        tableStats[tNum].orders += 1;
        tableStats[tNum].revenue += orderRevenue;
      }
    }
  });

  const aov = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

  // Aggregate Items & Categories
  const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
  const categoryStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

  orderItems.forEach((item: any) => {
    const qty = Number(item.quantity);
    const price = Number(item.total_price);
    const mItem = item.menu_items;
    
    if (mItem) {
      // Item
      const itemId = mItem.id;
      if (!itemStats[itemId]) itemStats[itemId] = { name: mItem.name, quantity: 0, revenue: 0 };
      itemStats[itemId].quantity += qty;
      itemStats[itemId].revenue += price;
      
      // Category
      if (mItem.categories) {
        const catId = mItem.categories.id;
        if (!categoryStats[catId]) categoryStats[catId] = { name: mItem.categories.name, quantity: 0, revenue: 0 };
        categoryStats[catId].quantity += qty;
        categoryStats[catId].revenue += price;
      }
    }
  });

  // Convert objects to sorted arrays
  const bestSellingItems = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity);
  const bestCategories = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
  const tablePerformance = Object.entries(tableStats)
    .map(([table, stats]) => ({ table, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);
    
  // Time series arrays
  const timeSeries = Object.keys(revenueByDate).sort().map(date => ({
    date,
    revenue: revenueByDate[date],
    orders: ordersByDate[date]
  }));

  const busiestHours = Object.entries(peakHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => ({ hour: e[0], count: e[1] }));

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalOrders: orders.length,
      paidOrdersCount,
      unpaidOrdersCount,
      cancelledOrdersCount,
      aov,
    },
    timeSeries,
    bestSellingItems,
    bestCategories,
    tablePerformance,
    orderStatusCounts,
    busiestHours
  });
}
