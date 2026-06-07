// supabase/functions/registrar-login/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: registra login com IP real + geolocalização automática
//
// Deploy:
//   supabase functions deploy registrar-login
//
// Variáveis de ambiente necessárias (Supabase > Settings > Edge Functions > Secrets):
//   SUPABASE_URL       → já existe automaticamente
//   SUPABASE_SERVICE_ROLE_KEY → adicione manualmente (Settings > API > service_role)
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Autentica o usuário pelo JWT do header ────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sem autorização" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service_role ignora RLS
    );

    // Valida o token e pega dados do usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Captura IP real ───────────────────────────────────────────────────
    // Supabase Edge Functions recebem o IP real nos headers abaixo
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") || // Cloudflare
      null;

    const userAgent = req.headers.get("user-agent") || null;

    // ── 3. Geolocalização via ip-api.com (gratuito, sem API key) ────────────
    let cidade: string | null = null;
    let pais:   string | null = null;
    let regiao: string | null = null;

    if (ip && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,city,country,regionName&lang=pt-BR`,
          { signal: AbortSignal.timeout(3000) } // timeout 3s para não travar
        );
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.status === "success") {
            cidade = geo.city   || null;
            pais   = geo.country || null;
            regiao = geo.regionName || null;
          }
        }
      } catch {
        // Geo falhou — segue sem ela, não bloqueia o login
      }
    }

    // ── 4. Body opcional: evento (login | logout) e nome ────────────────────
    let evento: "login" | "logout" = "login";
    let nomeBody: string | null = null;

    try {
      const body = await req.json();
      if (body?.evento === "logout") evento = "logout";
      if (body?.nome) nomeBody = body.nome;
    } catch {
      // body vazio é ok
    }

    const nome =
      nomeBody ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      null;

    // ── 5. Evita duplicar login no mesmo minuto (debounce server-side) ───────
    if (evento === "login") {
      const umMinutoAtras = new Date(Date.now() - 60_000).toISOString();
      const { data: recente } = await supabase
        .from("login_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("evento", "login")
        .gte("created_at", umMinutoAtras)
        .limit(1)
        .maybeSingle();

      if (recente) {
        return new Response(JSON.stringify({ ok: true, duplicado: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── 6. Insere o log ──────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from("login_logs").insert({
      user_id:    user.id,
      email:      user.email ?? "",
      nome,
      evento,
      ip,
      user_agent: userAgent,
      cidade,
      pais,
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ ok: true, ip, cidade, pais, regiao }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("registrar-login error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
