import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLANS: Record<string, { name: string; amount: number }> = {
  pro:    { name: "Nefra Pro — Previsões Ilimitadas", amount: 29.90 },
  expert: { name: "Nefra Expert — Acesso Completo",  amount: 59.90 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { userId, planId } = body;

    if (!userId || !planId || !PLANS[planId]) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const plan = PLANS[planId];

    // 1. Cria a preferência no Mercado Pago (mesmo padrão do criar-pagamento)
    const preferencia = {
      items: [{
        title: plan.name,
        quantity: 1,
        unit_price: plan.amount,
        currency_id: "BRL",
      }],
      back_urls: {
        success: "https://mercadox-phi.vercel.app/carteira?status=success&type=subscription&plan=" + planId,
        failure: "https://mercadox-phi.vercel.app/carteira?status=failure&type=subscription",
        pending: "https://mercadox-phi.vercel.app/carteira?status=pending&type=subscription",
      },
      auto_return: "approved",
      external_reference: String(userId),
      notification_url: "https://odexmyskaespjusivjua.supabase.co/functions/v1/webhook-pagamento",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencia),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Erro MP", details: data }),
        { status: res.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const preferenceId = data.id;

    // 2. Salva em pedidos_pendentes (mesmo padrão do criar-pagamento)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error: insertError } = await supabase.from("pedidos_pendentes").insert({
      preference_id: preferenceId,
      user_id: userId,
      market_id: null,
      posicao_id: null,
      tipo: "subscription",
      quantity: 1,
      price_per_contract: plan.amount,
      total_cost: plan.amount,
      status: "pending",
      plan_id: planId,
    });

    if (insertError) {
      console.log("ERRO ao salvar pedido_pendente:", insertError.message);
    }

    return new Response(
      JSON.stringify({ init_point: data.init_point, id: preferenceId }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
