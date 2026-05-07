import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DBMarket } from "@/types/market";

export function useMarkets(category?: string | null) {
  return useQuery({
    queryKey: ["markets", category],
    queryFn: async () => {
      let query = supabase
        .from("markets")
        .select("*")
        .eq("status", "active")
        .order("end_date", { ascending: true });
      if (category) {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data || []).map((m: any) => ({
        ...m,
        title: m.nome || m.title || "",
      }));
      return mapped as unknown as DBMarket[];
    },
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
      return { ...data, title: (data as any).nome || (data as any).title || "" } as unknown as DBMarket;
    },
    enabled: !!id,
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
