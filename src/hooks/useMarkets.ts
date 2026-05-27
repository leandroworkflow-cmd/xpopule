import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DBMarket } from "@/types/market";

// Retorna true se o mercado está acontecendo agora
export function isLive(market: DBMarket): boolean {
  const now = new Date();
  const start = market.start_date ? new Date(market.start_date) : null;
  const end = market.end_date ? new Date(market.end_date) : null;

  if (!start || !end) return false;
  return now >= start && now <= end && market.status === "active";
}

export function useMarkets(category?: string | null) {
  return useQuery({
    queryKey: ["markets", category],
    queryFn: async () => {
      const now = new Date().toISOString();

      let query = supabase
        .from("markets")
        .select("*")
        .eq("status", "active")
        // ✅ FIX 1: Exclui jogos cujo end_date já passou
        .gte("end_date", now)
        .order("end_date", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((m: any) => ({
        ...m,
        title: m.nome || m.title || "",
        // ✅ FIX 2 & 3: Calcula isLive no momento do fetch
        isLive: isLive({ ...m, title: m.nome || m.title || "" } as DBMarket),
      }));

      return mapped as unknown as DBMarket[];
    },
    // Revalida a cada 60s para manter o "AO VIVO" atualizado
    refetchInterval: 60_000,
  });
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: ["market", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      const market = {
        ...data,
        title: (data as any).nome || (data as any).title || "",
      } as unknown as DBMarket;

      return {
        ...market,
        isLive: isLive(market),
      };
    },
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

// ✅ NOVO: busca as posições (time_casa, empate, time_fora) de um mercado
export function useMarketPosicoes(marketId: string) {
  return useQuery({
    queryKey: ["posicoes", marketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posicoes")
        .select("*")
        .eq("mercado_id", marketId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!marketId,
  });
}
