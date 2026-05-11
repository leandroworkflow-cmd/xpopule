import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN") ?? "";
serve(async (req) => {
  try {
    const body = await req.json();
    if (body.type !== "payment") return new Response("ok", { status: 200 });
    const paymentId = body.data?.id;
    if (!paymentId) return new Response(JSON.stringify({ error: "payment id ausente" }), { status: 400 });
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } });
    if (!mpRes.ok) return new Response("erro ao consultar MP", { status: 500 });
    const payment = await mpRes.json();
    console.log("PAYMENT STATUS:", payment.status);
    console.log("PAYMENT DATA:", JSON.stringify({ external_reference: payment.external_reference, amount: payment.transaction_amount, metadata: payment.metadata }));
    if (payment.status !== "approved") return new Response("ok", { status: 200 });
    const userId = payment.external_reference;
    const valor = payment.transaction_amount;
    const metadata = payment.metadata || {};
    const { marketId, posicaoId, tipo, quantity, pricePerContract } = metadata;
    console.log("USER ID:", userId, "VALOR:", valor, "METADATA:", JSON.stringify(metadata));
    if (!userId || !valor) return new Response("dados incompletos", { status: 400 });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: existing } = await supabase.from("apostas").select("id").eq("mp_payment_id", String(paymentId)).maybeSingle();
    if (existing) return new Response("ok", { status: 200 });
    if (marketId && tipo && quantity) {
      const { error: debitError } = await supabase.rpc("debitar_saldo", { p_user_id: userId, p_valor: valor });
      if (debitError) return new Response(JSON.stringify({ error: debitError.message }), { status: 500 });
      const { error: apostaError } = await supabase.from("apostas").insert({ user_id: userId, mercado_id: marketId, posicao_id: posicaoId || null, tipo, quantidade: Number(quantity), preco_unitario: Number(pricePerContract), valor_total: Number(valor), status: "ativa", mp_payment_id: String(paymentId) });
      if (apostaError) return new Response(JSON.stringify({ error: apostaError.message }), { status: 500 });
      if (posicaoId) await supabase.rpc("incrementar_volume_comprado", { p_posicao_id: posicaoId, p_quantidade: Number(quantity) });
      return new Response("ok", { status: 200 });
    }
    console.log("Chamando creditar_saldo para userId:", userId, "valor:", valor);
    const { error: rpcError } = await supabase.rpc("creditar_saldo", { p_user_id: userId, p_valor: valor });
    if (rpcError) {
      console.log("ERRO creditar_saldo:", rpcError.message, rpcError.details, rpcError.hint);
      return new Response(JSON.stringify({ error: rpcError.message }), { status: 500 });
    }
    await supabase.from("transactions").insert({ user_id: userId, tipo: "deposito", valor, status: "approved", mp_payment_id: String(paymentId) });
    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
