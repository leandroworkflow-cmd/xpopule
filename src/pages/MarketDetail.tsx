import { useParams, useNavigate } from "react-router-dom";
import { useMarket, useMarketPosicoes } from "@/hooks/useMarkets";
import { categoryLabels, categoryColors, categoryIcons } from "@/types/market";
import { TradingDrawer } from "@/components/TradingDrawer";
import { PriceChart } from "@/components/PriceChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Info, TrendingUp, BarChart3, Sparkles, Lock, X } from "lucide-react";
import { useState } from "react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate as useNav } from "react-router-dom";

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: market, isLoading } = useMarket(id || "");
  const { data: posicoes = [] } = useMarketPosicoes(id || "");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── IA Analysis ───────────────────────────────────────────────────────────
  const { user } = useAuth();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis]         = useState<string | null>(null);
  const [loadingAI, setLoadingAI]       = useState(false);
  const [isPro, setIsPro]               = useState<boolean | null>(null);

  const checkPlan = async () => {
    if (!user) return false;
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    return data?.plan_id === "pro" || data?.plan_id === "expert";
  };

  const handleAnalysis = async () => {
    if (!user) { toast.error("Faça login para continuar"); return; }

    // Verifica plano
    const pro = await checkPlan();
    setIsPro(pro);

    if (!pro) {
      setShowAnalysis(true); // mostra o paywall
      return;
    }

    setShowAnalysis(true);
    setLoadingAI(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-analysis", {
        body: { marketId: id, userId: user.id },
      });

      if (error || !data?.analysis) throw new Error(error?.message ?? "Erro ao gerar análise");
      setAnalysis(data.analysis);
    } catch (e: any) {
      toast.error("Erro ao gerar análise: " + e.message);
      setShowAnalysis(false);
    } finally {
      setLoadingAI(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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

  // Formata o markdown simples da análise
  const formatAnalysis = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");

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

          {/* ── Botão Análise IA ── */}
          {!showAnalysis && (
            <Button
              className="w-full mb-6 h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
              onClick={handleAnalysis}
            >
              <Sparkles className="h-4 w-4" />
              Ver Análise da IA
            </Button>
          )}

          {/* ── Painel de Análise ── */}
          {showAnalysis && (
            <div className="rounded-xl border border-primary/30 bg-card mb-6 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Análise da IA</span>
                </div>
                <button onClick={() => { setShowAnalysis(false); setAnalysis(null); }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="p-5">
                {/* Paywall para usuários free */}
                {isPro === false && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground mb-1">Recurso exclusivo Pro</p>
                      <p className="text-sm text-muted-foreground">
                        Faça upgrade para o plano Pro e tenha acesso a análises de IA em todos os mercados.
                      </p>
                    </div>
                    <Button className="w-full font-bold" onClick={() => navigate("/planos")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ver planos
                    </Button>
                  </div>
                )}

                {/* Loading */}
                {loadingAI && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      Gerando análise...
                    </div>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-4 rounded bg-muted/40 animate-pulse`} style={{ width: `${85 - i * 10}%` }} />
                    ))}
                  </div>
                )}

                {/* Análise gerada */}
                {analysis && (
                  <div
                    className="text-sm text-foreground leading-relaxed space-y-2"
                    dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
                  />
                )}
              </div>
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
