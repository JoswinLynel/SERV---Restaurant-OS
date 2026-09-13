"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function createCheckoutSession(
  restaurantId: string,
  tableId: string,
  items: {
    menu_item_id: string;
    quantity: number;
    modifiers: { id: string; name: string }[];
    notes?: string;
  }[]
) {
  if (!items || items.length === 0) {
    throw new Error("Basket is empty");
  }

  const supabase = await createClient();

  // 1. Verify table belongs to restaurant
  const { data: table, error: tableError } = await supabase
    .from("tables")
    .select("id")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (tableError || !table) {
    console.error("Table lookup failed:", { tableError, tableId, restaurantId, table });
    throw new Error("Invalid table or restaurant");
  }

  // 2. Calculate true total from database
  let totalAmount = 0;
  const orderItemsData = [];

  for (const item of items) {
    // Verify menu item
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price, is_available")
      .eq("id", item.menu_item_id)
      .single();

    if (menuError || !menuItem) {
      throw new Error(`Menu item not found: ${item.menu_item_id}`);
    }

    if (!menuItem.is_available) {
      throw new Error(`Item ${menuItem.name} is currently unavailable`);
    }

    let itemUnitPrice = Number(menuItem.price);
    const validatedModifiers = [];

    // Verify modifiers
    for (const mod of item.modifiers) {
      const { data: modOption, error: modError } = await supabase
        .from("modifier_options")
        .select("id, name, price_adjustment")
        .eq("id", mod.id)
        .single();

      if (modError || !modOption) {
        throw new Error(`Invalid modifier: ${mod.name}`);
      }

      itemUnitPrice += Number(modOption.price_adjustment);
      validatedModifiers.push({
        name: modOption.name,
        price_adjustment: Number(modOption.price_adjustment),
      });
    }

    const itemTotalPrice = itemUnitPrice * item.quantity;
    totalAmount += itemTotalPrice;

    orderItemsData.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      unit_price: itemUnitPrice,
      total_price: itemTotalPrice,
      notes: item.notes || "",
      modifiers: validatedModifiers,
    });
  }

  // 3. Create Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      subtotal: totalAmount,
      tax: 0,
      total: totalAmount,
      status: "pending",
      payment_status: "unpaid",
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Order creation failed:", { orderError });
    throw new Error("Failed to create order");
  }

  // 4. Create Order Items
  for (const oi of orderItemsData) {
    const { data: orderItem, error: oiError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        menu_item_id: oi.menu_item_id,
        name: oi.name,
        quantity: oi.quantity,
        unit_price: oi.unit_price,
        total_price: oi.total_price,
        notes: oi.notes,
      })
      .select()
      .single();

    if (oiError || !orderItem) continue;

    if (oi.modifiers.length > 0) {
      const modifiersToInsert = oi.modifiers.map((m) => ({
        order_item_id: orderItem.id,
        name: m.name,
        price_adjustment: m.price_adjustment,
      }));
      await supabase.from("order_item_modifiers").insert(modifiersToInsert);
    }
  }

  // 5. Create Payment record in DB (pending)
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      amount: totalAmount,
      status: "pending",
    })
    .select()
    .single();

  if (paymentError || !payment) {
    console.error("Payment creation failed:", { paymentError });
    throw new Error("Failed to create payment record");
  }

  // 6. Build redirect URLs
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const successUrl = `${origin}/menu/${restaurantId}/${tableId}/success?orderId=${order.id}`;
  const cancelUrl = `${origin}/menu/${restaurantId}/${tableId}`;

  // 7. If Stripe is configured, create a Stripe Checkout Session
  //    If Stripe is NOT configured, redirect directly to success (order is already created)
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY not configured — skipping Stripe, redirecting to success.");
    return { url: successUrl };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia",
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "link"],
    line_items: orderItemsData.map((oi) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: oi.name,
          description: oi.modifiers.length > 0 ? oi.modifiers.map(m => m.name).join(", ") : undefined,
        },
        unit_amount: Math.round(oi.unit_price * 100),
      },
      quantity: oi.quantity,
    })),
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orderId: order.id,
      tableId: tableId,
      restaurantId: restaurantId,
    },
  });

  return { url: session.url };
}
