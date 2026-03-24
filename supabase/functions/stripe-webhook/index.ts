import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") || "";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const amountTotal = (session.amount_total || 0) / 100; // cents → reais

    if (!userId) {
      console.error("No client_reference_id in session", session.id);
      return new Response(JSON.stringify({ error: "Missing client_reference_id" }), { status: 400 });
    }

    console.log(`Processing deposit: user=${userId}, amount=R$${amountTotal}`);

    // Update user balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError?.message);
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const newBalance = Number(profile.balance) + amountTotal;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update balance:", updateError.message);
      return new Response(JSON.stringify({ error: "Balance update failed" }), { status: 500 });
    }

    // Record transaction
    const { error: txError } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amountTotal,
      description: `Depósito via Stripe (session: ${session.id})`,
    });

    if (txError) {
      console.error("Failed to record transaction:", txError.message);
    }

    console.log(`Deposit successful: user=${userId}, new_balance=${newBalance}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
