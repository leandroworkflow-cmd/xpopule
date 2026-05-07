import { useParams, useNavigate } from "react-router-dom";
import { useMarket, useMarketPosicoes } from "@/hooks/useMarkets";
import { categoryLabels, categoryColors, categoryIcons } from "@/types/market";
import { TradingDrawer } from "@/components/TradingDrawer";
import { PriceChart } from "@/components/PriceChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Info, TrendingUp, BarChart3 } from "lucide-react";
import { useState } from "react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: market, isLoading } = useMarket(id || "");
  const { data: posicoes = [] } = useMarketPosicoes(id || "");
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 text-muted-foreground">
        Mercado não encontrado.
      </div>
    );
  }

  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const CatIcon = categoryIcons[market.category] || TrendingUp;
  const endDate = new Date(market.end_date).toLocaleDateString("pt-BR");

  const total = market.yes_price + market.no_price;
  const yesPct = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const yesMultiplier = market.yes_price > 0 ? (100 / market.yes_price).toFixed(1) : "—";
  const noMultiplier = market.no_price > 0 ? (100 / market.no_price).toFixed(1) : "—";

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${catColor}`}>
              <CatIcon className="h-3 w-3" />
              {catLabel}
            </span>
            {market.volume > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {market.volume} contratos
              </span>
            )}
          </div>
          {(() => {
            const teams = extractTeamsFromTitle(market.title);
            if (teams) {
              return (
                <div className="flex items-center justify-center gap-6 py-4 mb-4 rounded-xl border border-border bg-card/50">
                  <div className="flex flex-col items-center gap-2">
                    <img src={teams.teamA.logo} alt={teams.teamA.name} className="h-16 w-16 object-contain" />
                    <span className="text-sm font-bold text-foreground capitalize">{teams.teamA.name}</span>
                  </div>
                  <span className="text-lg font-black text-muted-foreground">VS</span>
                  <div className="flex flex-col items-center gap-2">
                    <img src={teams.teamB.logo} alt={teams.teamB.name} className="h-16 w-16 object-contain" />
                    <span className="text-sm font-bold text-foreground capitalize">{teams.teamB.name}</span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
          <h1 className="text-2xl font-bold text-foreground mb-2 capitalize">{market.title}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Calendar className="h-4 w-4" />
            Encerra em: {endDate}
          </div>
          {market.image_url && !extractTeamsFromTitle(market.title) && (
            <div className="h-48 rounded-xl overflow-hidden mb-6 bg-background/50">
              <img src={market.image_url} alt={market.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Histórico de Preço</h2>
            </div>
            <PriceChart marketId={market.id} yesPrice={market.yes_price} noPrice={market.no_price} />
          </div>
          <div className="rounded-xl border border-border p-5 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Info className="h-4 w-4 text-primary" />
              Regras do Mercado
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{market.resolution_rule}</p>
          </div>
        </div>
        <div className="lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-border bg-card p-5 sticky top-20 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Negociar</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
              <div>
                <p className="text-xs text-muted-foreground">Sim</p>
                <p className="text-lg font-bold text-success">{yesPct}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">{yesMultiplier}x retorno</p>
                <p className="text-xs text-muted-foreground">R$ {market.yes_price}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-danger/5 border border-danger/20">
              <div>
                <p className="text-xs text-muted-foreground">Não</p>
                <p className="text-lg font-bold text-danger">{noPct}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">{noMultiplier}x retorno</p>
                <p className="text-xs text-muted-foreground">R$ {market.no_price}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="success" className="h-12 text-sm font-bold" onClick={() => setDrawerOpen(true)}>
                Comprar SIM
              </Button>
              <Button variant="danger" className="h-12 text-sm font-bold" onClick={() => setDrawerOpen(true)}>
                Comprar NÃO
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Cada contrato paga R$ 1,00 se a posição estiver correta.
            </p>
          </div>
        </div>
      </div>
      <TradingDrawer market={market} open={drawerOpen} onClose={() => setDrawerOpen(false)} posicoes={posicoes} />
    </div>
  );
};

export default MarketDetail;
ENDOFFILE

cp /tmp/market.tsx src/pages/MarketDetail.tsx
git add src/pages/MarketDetail.tsx
git push
