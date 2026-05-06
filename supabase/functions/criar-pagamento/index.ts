import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { amount, marketId, posicaoId, tipo, quantity, pricePerContract, userId } = body;

    if (!amount || !userId || !tipo || !quantity) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const preferencia = {
      items: [{ title: `MercadoX - ${tipo} (${quantity} contrato(s))`, quantity: 1, unit_price: Number(amount), currency_id: "BRL" }],
      back_urls: {
        success: "https://mercadox-phi.vercel.app/carteira?status=success",
        failure: "https://mercadox-phi.vercel.app/carteira?status=failure",
        pending: "https://mercadox-phi.vercel.app/carteira?status=pending",
      },
      auto_return: "approved",
      external_reference: String(userId),
      metadata: { marketId, posicaoId, tipo, quantity, pricePerContract, userId },
      notification_url: "https://odexmyskaespjusivjua.supabase.co/functions/v1/webhook-pagamento",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(preferencia),
    });

    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: "Erro MP", details: data }), { status: res.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ init_point: data.init_point, id: data.id }), { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
