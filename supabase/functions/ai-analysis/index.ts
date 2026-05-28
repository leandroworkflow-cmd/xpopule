import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { marketId, userId } = await req.json();

    if (!marketId || !userId) {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Verifica se usuário tem plano pro ou expert
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const isPro = sub?.plan_id === "pro" || sub?.plan_id === "expert";
    if (!isPro) {
      return new Response(JSON.stringify({ error: "Plano Pro ou Expert necessário" }), {
        status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 2. Busca dados do mercado
    const { data: market } = await supabase
      .from("markets")
      .select("*")
      .eq("id", marketId)
      .single();

    if (!market) {
      return new Response(JSON.stringify({ error: "Mercado não encontrado" }), {
        status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 3. Monta o prompt com os dados do mercado
    const total = market.yes_price + market.no_price;
    const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
    const noPct = 100 - yesPct;
    const yesMultiplier = market.yes_price > 0 ? (100 / market.yes_price).toFixed(2) : "—";
    const noMultiplier = market.no_price > 0 ? (100 / market.no_price).toFixed(2) : "—";

    const prompt = `Você é um analista especializado em mercados de previsão esportivos e de eventos.

Analise o seguinte mercado de previsão e forneça uma análise profissional em português brasileiro:

**Mercado:** ${market.title}
**Categoria:** ${market.category}
**Encerra em:** ${new Date(market.end_date).toLocaleDateString("pt-BR")}
**Regra de resolução:** ${market.resolution_rule}

**Probabilidades atuais do mercado:**
- SIM: ${yesPct}% (retorno ${yesMultiplier}x)
- NÃO: ${noPct}% (retorno ${noMultiplier}x)
- Volume: ${market.volume} contratos negociados

Forneça uma análise com:
1. **Resumo** (2-3 linhas sobre o evento)
2. **Análise das probabilidades** (o que os números indicam)
3. **Fatores favoráveis ao SIM**
4. **Fatores favoráveis ao NÃO**
5. **Recomendação** (qual posição parece mais interessante e por quê)

Seja objetivo, direto e profissional. Não garanta resultados — lembre que previsões envolvem incerteza.`;

    // 4. Chama a API do Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      console.log("ERRO GROQ:", JSON.stringify(groqData));
      throw new Error(groqData.error?.message ?? "Erro ao chamar Groq");
    }

    const analysis = groqData.choices?.[0]?.message?.content ?? "Não foi possível gerar análise.";

    return new Response(JSON.stringify({ analysis }), {
      status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
