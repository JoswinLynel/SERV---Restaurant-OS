"use server";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-08-26.dahlia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "mock_key"
);

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

  // 1. Verify table belongs to restaurant
  const { data: table, error: tableError } = await supabaseAdmin
    .from("tables")
    .select("id, table_code")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (tableError || !table) {
    throw new Error("Invalid table or restaurant");
  }

  // 2. Calculate true total from database
  let totalAmount = 0;
  const orderItemsData = [];

  for (const item of items) {
    // Verify menu item
    const { data: menuItem, error: menuError } = await supabaseAdmin
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
      const { data: modOption, error: modError } = await supabaseAdmin
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
  const { data: order, error: orderError } = await supabaseAdmin
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
    throw new Error("Failed to create order");
  }

  // 4. Create Order Items
  for (const oi of orderItemsData) {
    const { data: orderItem, error: oiError } = await supabaseAdmin
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
      await supabaseAdmin.from("order_item_modifiers").insert(modifiersToInsert);
    }
  }

  // 5. Create Payment record in DB (pending)
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      order_id: order.id,
      amount: totalAmount,
      status: "pending",
    })
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error("Failed to create payment record");
  }

  // 6. Create Stripe Checkout Session
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "link"],
    line_items: orderItemsData.map((oi) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: oi.name,
          description: oi.modifiers.length > 0 ? oi.modifiers.map(m => m.name).join(", ") : undefined,
        },
        unit_amount: Math.round(oi.unit_price * 100), // Stripe expects pence/cents
      },
      quantity: oi.quantity,
    })),
    mode: "payment",
    success_url: `${origin}/t/${table.table_code}/success?orderId=${order.id}`,
    cancel_url: `${origin}/t/${table.table_code}`,
    metadata: {
      orderId: order.id,
      tableId: tableId,
      restaurantId: restaurantId,
    },
  });

  return { url: session.url };
}
