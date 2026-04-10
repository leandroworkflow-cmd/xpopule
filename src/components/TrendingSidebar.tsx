import { DBMarket } from "@/types/market";
import { TrendingUp, TrendingDown, Flame, BarChart3 } from "lucide-react";

interface TrendingSidebarProps {
  markets: DBMarket[];
  onSelect: (market: DBMarket) => void;
}

export function TrendingSidebar({ markets, onSelect }: TrendingSidebarProps) {
  const trending = [...markets]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const topMovers = [...markets]
    .sort((a, b) => {
      const aSpread = Math.abs(a.yes_price - a.no_price);
      const bSpread = Math.abs(b.yes_price - b.no_price);
      return bSpread - aSpread;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 sticky top-20">
      {/* Trending */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-bold text-foreground">Trending</h3>
        </div>
        <div className="space-y-3">
          {trending.map((market, i) => {
            const total = market.yes_price + market.no_price;
            const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
            return (
              <button
                key={market.id}
                onClick={() => onSelect(market)}
                className="w-full text-left flex items-start gap-2 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
              >
                <span className="text-xs font-bold text-muted-foreground mt-0.5 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug capitalize">
                    {market.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {market.volume} contratos
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-success whitespace-nowrap">{yesPct}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Movers */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Top Movers</h3>
        </div>
        <div className="space-y-3">
          {topMovers.map((market, i) => {
            const total = market.yes_price + market.no_price;
            const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
            const isHigh = yesPct >= 50;
            return (
              <button
                key={market.id}
                onClick={() => onSelect(market)}
                className="w-full text-left flex items-start gap-2 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
              >
                <span className="text-xs font-bold text-muted-foreground mt-0.5 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug capitalize">
                    {market.title}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isHigh ? "text-success" : "text-danger"}`}>{yesPct}%</span>
                  {isHigh ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-danger" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
