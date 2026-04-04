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

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY is not configured");
    return new Response(JSON.stringify({ error: "Payment service not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    const { amount, marketId, side, quantity, pricePerContract } = body;
    
    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: "Valor mínimo: R$ 1,00" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Create pending order with metadata
    const description = marketId
      ? `Compra de ${quantity}x contrato ${side?.toUpperCase()} @ R$ ${pricePerContract}`
      : `Depósito de R$ ${amount.toFixed(2)} via PIX`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        amount,
        status: "pending",
        description,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Falha ao criar pedido: " + orderError.message);
    }

    // PIX checkout with 30min expiry
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

    const sessionConfig: any = {
      payment_method_types: ["pix", "card"],
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email,
      expires_at: expiresAt,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "MercadoX",
              description: description,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin") || "https://xpopule.lovable.app"}/carteira?deposit=success`,
      cancel_url: `${req.headers.get("origin") || "https://xpopule.lovable.app"}/carteira?deposit=canceled`,
      metadata: {
        order_id: order.id,
        market_id: marketId || "",
        side: side || "",
        quantity: String(quantity || ""),
        price_per_contract: String(pricePerContract || ""),
      },
    };

    console.log("Creating Stripe session with config:", JSON.stringify({
      payment_method_types: sessionConfig.payment_method_types,
      mode: sessionConfig.mode,
      amount: Math.round(amount * 100),
      user_id: user.id,
    }));

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Update order with stripe checkout id
    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_id: session.id })
      .eq("id", order.id);

    console.log("Stripe session created:", session.id, "URL:", session.url);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
