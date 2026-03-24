import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Portfolio = () => {
  const { user, balance } = useAuth();

  const { data: positions, isLoading } = useQuery({
    queryKey: ["my-positions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*, markets(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enriched = (positions ?? []).map((pos) => {
    const market = pos.markets as any;
    if (!market) return null;
    const currentPrice = pos.side === "yes" ? market.yes_price : market.no_price;
    const pnl = ((currentPrice - pos.avg_price) / 100) * pos.quantity;
    const pnlPercent = pos.avg_price ? ((currentPrice - pos.avg_price) / pos.avg_price) * 100 : 0;
    return { ...pos, market, currentPrice, pnl, pnlPercent };
  }).filter(Boolean);

  const totalPnl = enriched.reduce((sum, p) => sum + p!.pnl, 0);
  const totalCost = enriched.reduce((sum, p) => sum + (p!.avg_price * p!.quantity) / 100, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Meu Portfólio</h1>
        <p className="text-sm text-muted-foreground">Suas posições abertas e desempenho.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="gradient-card rounded-xl border border-border p-4">
          <span className="text-xs text-muted-foreground">Saldo Disponível</span>
          <div className="text-xl font-bold text-foreground mt-1">
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-4">
          <span className="text-xs text-muted-foreground">Investido</span>
          <div className="text-xl font-bold text-foreground mt-1">R$ {totalCost.toFixed(2)}</div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-4">
          <span className="text-xs text-muted-foreground">P&L Total</span>
          <div className={`text-xl font-bold mt-1 ${totalPnl >= 0 ? "text-success" : "text-danger"}`}>
            {totalPnl >= 0 ? "+" : ""}R$ {totalPnl.toFixed(2)}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : enriched.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma posição aberta.
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((pos, i) => (
            <div key={i} className="gradient-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground truncate capitalize">{pos!.market.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={pos!.side === "yes" ? "default" : "destructive"} className={pos!.side === "yes" ? "bg-success/15 text-success border-0" : "bg-danger/15 text-danger border-0"}>
                    {pos!.side === "yes" ? "Sim" : "Não"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {pos!.quantity} contratos @ R$ {pos!.avg_price}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Preço Atual: R$ {pos!.currentPrice}</div>
                <div className={`font-bold ${pos!.pnl >= 0 ? "text-success" : "text-danger"}`}>
                  {pos!.pnl >= 0 ? "+" : ""}R$ {pos!.pnl.toFixed(2)}
                  <span className="text-xs ml-1">({pos!.pnlPercent >= 0 ? "+" : ""}{pos!.pnlPercent.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
