import { Badge } from "@/components/ui/badge";
import { markets } from "@/data/markets";

interface Position {
  marketId: string;
  side: "yes" | "no";
  quantity: number;
  avgPrice: number;
}

const mockPositions: Position[] = [
  { marketId: "1", side: "yes", quantity: 25, avgPrice: 65 },
  { marketId: "3", side: "no", quantity: 15, avgPrice: 55 },
  { marketId: "7", side: "yes", quantity: 40, avgPrice: 74 },
  { marketId: "6", side: "no", quantity: 10, avgPrice: 70 },
];

const Portfolio = () => {
  const positions = mockPositions.map((pos) => {
    const market = markets.find((m) => m.id === pos.marketId)!;
    const currentPrice = pos.side === "yes" ? market.yesPrice : market.noPrice;
    const pnl = ((currentPrice - pos.avgPrice) / 100) * pos.quantity;
    const pnlPercent = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100;
    return { ...pos, market, currentPrice, pnl, pnlPercent };
  });

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalCost = positions.reduce((sum, p) => sum + (p.avgPrice * p.quantity) / 100, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Meu Portfólio</h1>
        <p className="text-sm text-muted-foreground">Suas posições abertas e desempenho.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="gradient-card rounded-xl border border-border p-4">
          <span className="text-xs text-muted-foreground">Saldo Disponível</span>
          <div className="text-xl font-bold text-foreground mt-1">R$ 1.250,00</div>
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

      {/* Positions */}
      <div className="space-y-3">
        {positions.map((pos, i) => (
          <div key={i} className="gradient-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{pos.market.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={pos.side === "yes" ? "default" : "destructive"} className={pos.side === "yes" ? "bg-success/15 text-success border-0" : "bg-danger/15 text-danger border-0"}>
                  {pos.side === "yes" ? "Sim" : "Não"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {pos.quantity} contratos @ {pos.avgPrice}¢
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Preço Atual: {pos.currentPrice}¢</div>
              <div className={`font-bold ${pos.pnl >= 0 ? "text-success" : "text-danger"}`}>
                {pos.pnl >= 0 ? "+" : ""}R$ {pos.pnl.toFixed(2)}
                <span className="text-xs ml-1">({pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
