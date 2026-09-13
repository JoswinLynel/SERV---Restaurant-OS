import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-08-26.dahlia",
});

// Initialize Supabase admin client to bypass RLS in the webhook securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "mock_key");

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("No signature found", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.orderId) {
          const orderId = session.metadata.orderId;
          const intentId = session.payment_intent as string;

          // 1. Update Payment Record to 'succeeded' and record intent ID
          const { error: paymentError } = await supabaseAdmin
            .from("payments")
            .update({ 
              status: "succeeded",
              stripe_payment_intent_id: intentId 
            })
            .eq("order_id", orderId)
            // Idempotency: only update if pending
            .eq("status", "pending");

          if (paymentError) {
            console.error("Error updating payment status:", paymentError);
          }

          // 2. Update Order Record to 'paid'
          const { error: orderError } = await supabaseAdmin
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", orderId)
            .eq("payment_status", "unpaid");

          if (orderError) {
            console.error("Error updating order payment status:", orderError);
          }
        }
        break;
      }
      
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.orderId) {
          const orderId = session.metadata.orderId;

          // Update Payment Record to 'failed'
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed" })
            .eq("order_id", orderId)
            .eq("status", "pending");
        }
        break;
      }
      
      default:
        // Ignore other events
        break;
    }

    return new NextResponse("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
