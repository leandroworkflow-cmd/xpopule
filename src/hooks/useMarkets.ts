import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DBMarket } from "@/types/market";

// ✅ AO VIVO: event_date <= agora <= event_date + 2h
export function isLive(market: DBMarket): boolean {
  const now        = new Date();
  const eventDate  = (market as any).event_date
    ? new Date((market as any).event_date)
    : null;

  if (!eventDate || market.status !== "active") return false;

  const endLive = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // +2h
  return now >= eventDate && now <= endLive;
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
        isLive: isLive({ ...m, title: m.nome || m.title || "" } as DBMarket),
      }));

      return mapped as unknown as DBMarket[];
    },
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

      return { ...market, isLive: isLive(market) };
    },
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

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
