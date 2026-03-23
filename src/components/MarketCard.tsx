import { Market } from "@/data/markets";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { categoryLabels } from "@/data/markets";

interface MarketCardProps {
  market: Market;
  onClick: (market: Market) => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const isUp = market.history.length > 1 && market.history[market.history.length - 1].price > market.history[0].price;

  return (
    <div
      onClick={() => onClick(market)}
      className="gradient-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant="secondary" className="text-xs font-medium">
          {categoryLabels[market.category]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(market.endDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
        </span>
      </div>

      <h3 className="font-semibold text-sm text-foreground mb-4 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {market.title}
      </h3>

      <div className="h-12 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={market.history}>
            <defs>
              <linearGradient id={`gradient-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "hsl(152, 60%, 48%)" : "hsl(350, 65%, 55%)"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isUp ? "hsl(152, 60%, 48%)" : "hsl(350, 65%, 55%)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={isUp ? "hsl(152, 60%, 48%)" : "hsl(350, 65%, 55%)"}
              strokeWidth={1.5}
              fill={`url(#gradient-${market.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-xs font-bold bg-success/15 text-success hover:bg-success/25 transition-colors">
            Sim {market.yesPrice}¢
          </button>
          <button className="px-3 py-1.5 rounded-md text-xs font-bold bg-danger/15 text-danger hover:bg-danger/25 transition-colors">
            Não {market.noPrice}¢
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          Vol: {(market.volume / 1000).toFixed(0)}k
        </span>
      </div>
    </div>
  );
}
