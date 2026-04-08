import { useNavigate } from "react-router-dom";
import { DBMarket, categoryLabels, categoryColors } from "@/types/market";
import { Calendar, Trophy, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MarketCardProps {
  market: DBMarket;
  onClick: (market: DBMarket) => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const navigate = useNavigate();
  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const endDate = new Date(market.end_date).toLocaleDateString("pt-BR");

  const total = market.yes_price + market.no_price;
  const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;

  return (
    <div
      onClick={() => navigate(`/mercado/${market.id}`)}
      className="gradient-card rounded-xl border border-border/50 p-4 hover:border-primary/40 transition-all cursor-pointer group flex flex-col shadow-lg hover:shadow-primary/5"
    >
      {/* Image */}
      {market.image_url && (
        <div className="h-36 rounded-lg overflow-hidden mb-3 bg-background/50 flex items-center justify-center">
          <img
            src={market.image_url}
            alt={market.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      {/* Category tag + volume */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catColor}`}>
          <Trophy className="h-3 w-3 mr-1" />
          {catLabel}
        </span>
        {market.volume > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {market.volume} negociados
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-foreground mb-3 leading-snug line-clamp-2 group-hover:text-primary transition-colors capitalize flex-1">
        {market.title}
      </h3>

      {/* Sentiment bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-semibold mb-1">
          <span className="text-success">SIM {yesPct}%</span>
          <span className="text-danger">NÃO {100 - yesPct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-danger/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{ width: `${yesPct}%` }}
          />
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Calendar className="h-3.5 w-3.5" />
        <span>Encerra em: {endDate}</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(market); }}
          className="h-11 rounded-lg text-sm font-bold bg-success/15 text-success hover:bg-success/25 border border-success/30 transition-all hover:shadow-[0_0_12px_-3px_hsl(var(--success)/0.4)]"
        >
          SIM — R$ {market.yes_price}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(market); }}
          className="h-11 rounded-lg text-sm font-bold bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30 transition-all hover:shadow-[0_0_12px_-3px_hsl(var(--danger)/0.4)]"
        >
          NÃO — R$ {market.no_price}
        </button>
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="gradient-card rounded-xl border border-border/50 p-4 animate-pulse">
      <div className="h-36 rounded-lg bg-muted/30 mb-3" />
      <div className="h-5 w-20 rounded-full bg-muted/30 mb-3" />
      <div className="h-4 w-full rounded bg-muted/30 mb-2" />
      <div className="h-4 w-2/3 rounded bg-muted/30 mb-3" />
      <div className="h-1.5 w-full rounded-full bg-muted/30 mb-3" />
      <div className="h-4 w-32 rounded bg-muted/30 mb-4" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-11 rounded-lg bg-muted/30" />
        <div className="h-11 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}
