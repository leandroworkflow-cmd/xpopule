import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { amount } = await req.json();
    
    if (!amount || amount < 10) {
      return new Response(JSON.stringify({ error: "Valor mínimo: R$ 10,00" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create pending order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        amount,
        status: "pending",
        description: `Depósito de R$ ${amount.toFixed(2)} via PIX`,
      })
      .select("id")
      .single();

    if (orderError) {
      throw new Error("Falha ao criar pedido: " + orderError.message);
    }

    // PIX checkout with 30min expiry
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["pix"],
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email,
      expires_at: expiresAt,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Depósito MercadoX`,
              description: `Adicionar R$ ${amount.toFixed(2)} ao saldo`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/carteira?deposit=success`,
      cancel_url: `${req.headers.get("origin")}/carteira?deposit=canceled`,
      metadata: {
        order_id: order.id,
      },
    });

    // Update order with stripe checkout id
    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
