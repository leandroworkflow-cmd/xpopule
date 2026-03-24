import { useParams, useNavigate } from "react-router-dom";
import { useMarket } from "@/hooks/useMarkets";
import { categoryLabels, categoryColors } from "@/types/market";
import { TradingDrawer } from "@/components/TradingDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, ArrowLeft, Info } from "lucide-react";
import { useState } from "react";

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: market, isLoading } = useMarket(id || "");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 text-muted-foreground">
        Mercado não encontrado.
      </div>
    );
  }

  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const endDate = new Date(market.end_date).toLocaleDateString("pt-BR");

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      {market.image_url && (
        <div className="h-56 rounded-xl overflow-hidden mb-6 bg-background/50">
          <img src={market.image_url} alt={market.title} className="h-full w-full object-cover" />
        </div>
      )}

      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${catColor}`}>
        <Trophy className="h-3 w-3 mr-1" />
        {catLabel}
      </span>

      <h1 className="text-2xl font-bold text-foreground mb-3 capitalize">{market.title}</h1>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Calendar className="h-4 w-4" />
        Encerra em: {endDate}
      </div>

      {/* Rules */}
      <div className="rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Info className="h-4 w-4 text-primary" />
          Regras do Mercado
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{market.resolution_rule}</p>
      </div>

      {/* Action */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="success"
          className="h-14 text-lg font-bold"
          onClick={() => setDrawerOpen(true)}
        >
          SIM — R$ {market.yes_price}
        </Button>
        <Button
          variant="danger"
          className="h-14 text-lg font-bold"
          onClick={() => setDrawerOpen(true)}
        >
          NÃO — R$ {market.no_price}
        </Button>
      </div>

      <TradingDrawer market={market} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

export default MarketDetail;
