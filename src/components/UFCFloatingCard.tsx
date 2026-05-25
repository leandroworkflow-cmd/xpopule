import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function UFCFloatingCard() {
  const navigate = useNavigate();

  const { data: ufcMarket } = useQuery({
    queryKey: ["ufc_next_floating"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("markets")
        .select("id, nome, end_date, yes_prob")
        .eq("category", "luta")
        .eq("status", "active")
        .gte("end_date", now)
        .order("end_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!ufcMarket) return null;

  const title   = (ufcMarket as any).nome || "";
  const endDate = new Date((ufcMarket as any).end_date);
  const dateStr = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const timeStr = endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const prob    = (ufcMarket as any).yes_prob ?? 50;

  return (
    <div className="fixed top-20 right-4 z-50 w-[200px] rounded-xl border border-red-500/30 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-red-500/5">
        <span className="text-sm">🥊</span>
        <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
          Próximo UFC
        </span>
        <span className="ml-auto text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
          Em breve
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 flex flex-col gap-2">
        <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug">
          {title}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>📅 {dateStr}</span>
          <span>⏰ {timeStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full"
              style={{ width: `${prob}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-red-400">{prob}%</span>
        </div>
        <button
          onClick={() => navigate(`/mercado/${ufcMarket.id}`)}
          className="w-full py-1.5 rounded-lg text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          Ver mercado →
        </button>
      </div>
    </div>
  );
}
