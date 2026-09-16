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
  const compareStartDate = searchParams.get("compareStartDate"); // ISO string
  const compareEndDate = searchParams.get("compareEndDate"); // ISO string

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // 1. Fetch main period orders
  let ordersQuery = supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      status,
      payment_status,
      created_at,
      tables ( id, table_number ),
      payments ( amount, status ),
      order_items (
        id, name, quantity, unit_price, total_price,
        order_item_modifiers ( name, price_adjustment )
      )
    `)
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (startDate) ordersQuery = ordersQuery.gte("created_at", startDate);
  if (endDate) ordersQuery = ordersQuery.lte("created_at", endDate);

  const { data: orders, error: ordersError } = await ordersQuery;
  
  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  // 2. Fetch comparison period orders (if provided)
  let compareOrders: any[] = [];
  if (compareStartDate && compareEndDate) {
    let compareQuery = supabase
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        payments ( amount, status )
      `)
      .eq("restaurant_id", restaurantId)
      .gte("created_at", compareStartDate)
      .lte("created_at", compareEndDate);
    
    const { data: compData } = await compareQuery;
    if (compData) compareOrders = compData;
  }

  // 3. Process main period orders
  let totalRevenue = 0;
  let paidOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let unpaidOrdersCount = 0;
  
  const revenueByDate: Record<string, number> = {};
  const ordersByDate: Record<string, number> = {};
  const tableStats: Record<string, { orders: number; revenue: number; active: number }> = {};
  const orderStatusCounts: Record<string, number> = {
    pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0
  };
  const peakHours: Record<string, number> = {};
  
  const customerStats = { total: 0, identified: 0, anonymous: 0 };
  const paymentStats = { succeeded: 0, pending: 0, failed: 0, refunded: 0 };

  const liveOrders: any[] = [];
  const recentOrders: any[] = [];

  const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
  const categoryStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

  orders.forEach((order: any, index: number) => {
    // Recent orders (latest 8)
    if (index < 8) recentOrders.push(order);
    
    // Live orders (latest 5 active)
    if (['pending', 'preparing', 'ready'].includes(order.status) && liveOrders.length < 5) {
      liveOrders.push(order);
    }

    // Customer insights
    customerStats.total++;
    if (order.customer_name && order.customer_name.trim() !== '') {
      customerStats.identified++;
    } else {
      customerStats.anonymous++;
    }

    // Basic status counts
    orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;
    if (order.status === 'cancelled') cancelledOrdersCount++;

    // Calculate revenue and payment stats
    let orderRevenue = 0;
    let hasSuccessfulPayment = false;
    
    if (order.payments && Array.isArray(order.payments)) {
      order.payments.forEach((p: any) => {
        paymentStats[p.status as keyof typeof paymentStats] = (paymentStats[p.status as keyof typeof paymentStats] || 0) + 1;
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

    // Table stats
    if (order.tables) {
      const tNum = order.tables.table_number;
      if (!tableStats[tNum]) tableStats[tNum] = { orders: 0, revenue: 0, active: 0 };
      tableStats[tNum].orders += 1;
      tableStats[tNum].revenue += orderRevenue;
      if (['pending', 'preparing', 'ready'].includes(order.status)) {
        tableStats[tNum].active += 1;
      }
    }

    // Time series & Peak hours (only count genuine non-cancelled orders)
    if (order.status !== 'cancelled') {
      // Adjusting for basic date string. In a real app, use timezone.
      const dateObj = new Date(order.created_at);
      
      // We want to handle hours properly matching the day
      // For single day, it groups by hour visually in the UI, but API just returns days and peak hours across the period
      const dateStr = dateObj.toISOString().split('T')[0];
      const hourStr = dateObj.getHours().toString().padStart(2, '0') + ':00';
      
      ordersByDate[dateStr] = (ordersByDate[dateStr] || 0) + 1;
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + orderRevenue;
      peakHours[hourStr] = (peakHours[hourStr] || 0) + 1;
    }
  });

  const aov = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

  // 4. Fetch Order Items specifically for best selling (with categories)
  let orderItems: any[] = [];
  const validOrderIds = orders
    .filter(o => o.status !== 'cancelled' && (o.payment_status === 'paid' || o.payments.some((p:any) => p.status === 'succeeded')))
    .map(o => o.id);

  if (validOrderIds.length > 0) {
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

  orderItems.forEach((item: any) => {
    const qty = Number(item.quantity);
    const price = Number(item.total_price);
    const mItem = item.menu_items;
    
    if (mItem) {
      const itemId = mItem.id;
      if (!itemStats[itemId]) itemStats[itemId] = { name: mItem.name, quantity: 0, revenue: 0 };
      itemStats[itemId].quantity += qty;
      itemStats[itemId].revenue += price;
      
      if (mItem.categories) {
        const catId = mItem.categories.id;
        if (!categoryStats[catId]) categoryStats[catId] = { name: mItem.categories.name, quantity: 0, revenue: 0 };
        categoryStats[catId].quantity += qty;
        categoryStats[catId].revenue += price;
      }
    }
  });

  // 5. Compare Period processing
  let compareRevenue = 0;
  let comparePaidOrders = 0;
  let compareOrdersCount = 0;
  
  compareOrders.forEach((order: any) => {
    if (order.status !== 'cancelled') {
      compareOrdersCount++;
    }
    let orderRev = 0;
    let hasSucc = false;
    if (order.payments && Array.isArray(order.payments)) {
      order.payments.forEach((p: any) => {
        if (p.status === 'succeeded') {
          orderRev += Number(p.amount);
          hasSucc = true;
        }
      });
    }
    if (hasSucc) {
      compareRevenue += orderRev;
      comparePaidOrders++;
    }
  });
  
  const compareAov = comparePaidOrders > 0 ? compareRevenue / comparePaidOrders : 0;

  // Formatting return
  const bestSellingItems = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const bestCategories = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
  const tablePerformance = Object.entries(tableStats)
    .map(([table, stats]) => ({ table, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);
    
  const timeSeries = Object.keys(revenueByDate).sort().map(date => ({
    date,
    revenue: revenueByDate[date],
    orders: ordersByDate[date]
  }));

  const busiestHours = Object.entries(peakHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(e => ({ hour: e[0], count: e[1] }));

  const ordersByHour = Object.keys(peakHours).sort().map(h => ({ hour: h, count: peakHours[h] }));

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalOrders: orders.length,
      paidOrdersCount,
      unpaidOrdersCount,
      cancelledOrdersCount,
      aov,
      comparison: {
        revenue: compareRevenue,
        orders: compareOrdersCount,
        aov: compareAov,
        hasData: compareOrders.length > 0
      }
    },
    timeSeries,
    bestSellingItems,
    bestCategories,
    tablePerformance,
    orderStatusCounts,
    busiestHours,
    customerStats,
    paymentStats,
    liveOrders,
    recentOrders,
    ordersByHour
  });
}
