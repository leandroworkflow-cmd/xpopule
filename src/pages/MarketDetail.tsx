import { useParams, useNavigate } from "react-router-dom";
import { useMarket, useMarketPosicoes } from "@/hooks/useMarkets";
import { categoryLabels, categoryColors, categoryIcons } from "@/types/market";
import { TradingDrawer } from "@/components/TradingDrawer";
import { PriceChart } from "@/components/PriceChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Info, TrendingUp, BarChart3, Sparkles, Lock, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { extractTeamsFromTitle } from "@/lib/teamLogos";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function useOpcoesMercado(marketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["opcoes_mercado", marketId],
    queryFn: async () => {
      const { data, error } = await supabase.from("opcoes_mercado").select("*").eq("market_id", marketId).order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled,
  });
}

function extrairLadosDoNome(nome: string): { ladoA: string; ladoB: string } | null {
  const separators = [/\s+vs\.?\s+/i, /\s+X\s+/];
  for (const sep of separators) {
    const parts = nome.split(sep);
    if (parts.length >= 2) {
      const rawA = parts[0].includes(":") ? parts[0].split(":").pop()! : parts[0];
      const rawB = parts[1].split(/[:\-–—]/)[0];
      return { ladoA: rawA.trim(), ladoB: rawB.trim() };
    }
  }
  return null;
}

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: market, isLoading } = useMarket(id || "");
  const { data: posicoes = [] } = useMarketPosicoes(id || "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOpcao, setSelectedOpcao] = useState<any>(null);
  const [selectedSide, setSelectedSide] = useState<"sim" | "nao" | null>(null);

  const tipoMercado = (market as any)?.tipo_mercado || "binario";
  const isMulti = tipoMercado === "multiplo" || tipoMercado === "periodo";
  const { data: opcoes = [] } = useOpcoesMercado(id || "", isMulti);

  const { user } = useAuth();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  const checkPlan = async () => {
    if (!user) return false;
    const { data } = await supabase.from("subscriptions").select("plan_id, status").eq("user_id", user.id).eq("status", "active").maybeSingle();
    return data?.plan_id === "pro" || data?.plan_id === "expert";
  };

  const handleAnalysis = async () => {
    if (!user) { toast.error("Faça login para continuar"); return; }
    const pro = await checkPlan();
    setIsPro(pro);
    if (!pro) { setShowAnalysis(true); return; }
    setShowAnalysis(true);
    setLoadingAI(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-analysis", { body: { marketId: id, userId: user.id } });
      if (error || !data?.analysis) throw new Error(error?.message ?? "Erro ao gerar análise");
      setAnalysis(data.analysis);
    } catch (e: any) {
      toast.error("Erro ao gerar análise: " + e.message);
      setShowAnalysis(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const formatAnalysis = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-xl" /><Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!market) {
    return <div className="max-w-4xl mx-auto text-center py-16 text-muted-foreground">Mercado não encontrado.</div>;
  }

  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const CatIcon  = categoryIcons[market.category] || TrendingUp;
  const endDate  = new Date(market.end_date).toLocaleDateString("pt-BR");
  const title    = (market as any).nome || market.title || "";
  const category = (market as any).category || "";

  const total         = (market.yes_price || 0) + (market.no_price || 0);
  const yesPct        = total > 0 ? Math.round((market.yes_price / total) * 100) : 50;
  const noPct         = 100 - yesPct;
  const yesMultiplier = market.yes_price > 0 ? (100 / market.yes_price).toFixed(1) : "—";
  const noMultiplier  = market.no_price  > 0 ? (100 / market.no_price).toFixed(1)  : "—";

  // ✅ Nomes dinâmicos: posicoes → split do título → fallback
  const posicaoCasa = posicoes.find((p: any) => p.tipo === "time_casa");
  const posicaoFora = posicoes.find((p: any) => p.tipo === "time_fora");
  const ladosDoNome = extrairLadosDoNome(title);

  const yesLabel =
    posicaoCasa?.nome_atleta ||
    ladosDoNome?.ladoA ||
    "Sim";

  const noLabel =
    posicaoFora?.nome_atleta ||
    ladosDoNome?.ladoB ||
    "Não";

  const isBinaryGeneric = yesLabel === "Sim" && noLabel === "Não";

  // ✅ Usa home_logo/away_logo do banco — sem extractTeamsFromTitle
  const isFutebol = category === "esportes";
  const homeLogo = (market as any).home_logo || null;
  const awayLogo = (market as any).away_logo || null;
  const parts    = title.split(/ x | vs /i);
  const teams = isFutebol ? {
    teamA: { name: parts[0]?.trim() || "Time A", logo: homeLogo || "" },
    teamB: { name: parts[1]?.trim() || "Time B", logo: awayLogo || "" },
  } : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${catColor}`}>
              <CatIcon className="h-3 w-3" />{catLabel}
            </span>
            {market.volume > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />{market.volume} contratos
              </span>
            )}
          </div>

          {/* Escudos só para futebol */}
          {teams && (
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
          )}

          <h1 className="text-2xl font-bold text-foreground mb-2 capitalize">{title}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Calendar className="h-4 w-4" />Encerra em: {endDate}
          </div>

          {(market as any).image_url && !teams && (
            <div className="h-48 rounded-xl overflow-hidden mb-6 bg-background/50">
              <img src={(market as any).image_url} alt={title} className="h-full w-full object-cover" />
            </div>
          )}

          {!showAnalysis && (
            <Button className="w-full mb-6 h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90" onClick={handleAnalysis}>
              <Sparkles className="h-4 w-4" /> Ver Análise da IA
            </Button>
          )}

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
                {isPro === false && (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground mb-1">Recurso exclusivo Pro</p>
                      <p className="text-sm text-muted-foreground">Faça upgrade para o plano Pro e tenha acesso a análises de IA em todos os mercados.</p>
                    </div>
                    <Button className="w-full font-bold" onClick={() => navigate("/planos")}>
                      <Sparkles className="h-4 w-4 mr-2" /> Ver planos
                    </Button>
                  </div>
                )}
                {loadingAI && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Gerando análise...
                    </div>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 rounded bg-muted/40 animate-pulse" style={{ width: `${85 - i * 10}%` }} />
                    ))}
                  </div>
                )}
                {analysis && (
                  <div className="text-sm text-foreground leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }} />
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
              <Info className="h-4 w-4 text-primary" /> Regras do Mercado
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {(market as any).resolution_rule || "As regras serão definidas pelo administrador do mercado."}
            </p>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="rounded-xl border border-border bg-card p-5 sticky top-20 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Negociar</h3>

            {tipoMercado === "multiplo" && (
              <>
                <div className="flex flex-col gap-2">
                  {(opcoes as any[]).map((op) => (
                    <button key={op.id} onClick={() => { setSelectedOpcao(op); setDrawerOpen(true); }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedOpcao?.id === op.id ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"}`}>
                      {op.foto_url
                        ? <img src={op.foto_url} alt={op.label} className="h-12 w-12 rounded-lg object-cover border border-border/40 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary shrink-0">{op.label.slice(0, 1).toUpperCase()}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{op.label}</p>
                        {op.descricao && <p className="text-[10px] text-muted-foreground truncate">{op.descricao}</p>}
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">{op.probabilidade}%</span>
                    </button>
                  ))}
                </div>
                <Button className="w-full h-12 font-bold" onClick={() => setDrawerOpen(true)} disabled={!selectedOpcao}>
                  {selectedOpcao ? `Apostar em ${selectedOpcao.label}` : "Selecione uma opção"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">Cada contrato paga R$ 1,00 se a posição estiver correta.</p>
              </>
            )}

            {tipoMercado === "periodo" && (
              <>
                <div className="flex flex-col gap-2">
                  {(opcoes as any[]).map((op) => {
                    const maxProb = Math.max(...(opcoes as any[]).map((o) => Number(o.probabilidade) || 0), 0);
                    const isLeading = Number(op.probabilidade) === maxProb;
                    return (
                      <button key={op.id} onClick={() => { setSelectedOpcao(op); setDrawerOpen(true); }}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${selectedOpcao?.id === op.id ? "border-primary bg-primary/10" : isLeading ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{op.label}</p>
                          {op.descricao && <p className="text-[10px] text-muted-foreground truncate">{op.descricao}</p>}
                        </div>
                        <div className="relative flex-shrink-0 w-10 h-10 ml-3">
                          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/30" />
                            <circle cx="18" cy="18" r="14" fill="none" stroke={isLeading ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="3" strokeDasharray={`${Number(op.probabilidade) * 0.879} 100`} strokeLinecap="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">{op.probabilidade}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Button className="w-full h-12 font-bold" onClick={() => setDrawerOpen(true)} disabled={!selectedOpcao}>
                  {selectedOpcao ? `Apostar: ${selectedOpcao.label}` : "Selecione um período"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">Cada contrato paga R$ 1,00 se a posição estiver correta.</p>
              </>
            )}

            {(tipoMercado === "binario" || !tipoMercado) && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                  <div>
                    <p className="text-xs text-muted-foreground">{isBinaryGeneric ? "Sim" : "Vitória"}</p>
                    <p className="text-base font-bold text-success leading-tight">{yesLabel}</p>
                    <p className="text-lg font-bold text-success">{yesPct}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{yesMultiplier}x retorno</p>
                    <p className="text-xs text-muted-foreground">R$ {market.yes_price}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-danger/5 border border-danger/20">
                  <div>
                    <p className="text-xs text-muted-foreground">{isBinaryGeneric ? "Não" : "Vitória"}</p>
                    <p className="text-base font-bold text-danger leading-tight">{noLabel}</p>
                    <p className="text-lg font-bold text-danger">{noPct}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{noMultiplier}x retorno</p>
                    <p className="text-xs text-muted-foreground">R$ {market.no_price}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="success" className="h-12 text-sm font-bold truncate"
                    onClick={() => { setSelectedSide("sim"); setDrawerOpen(true); }}>
                    {isBinaryGeneric ? "Comprar SIM" : yesLabel}
                  </Button>
                  <Button variant="danger" className="h-12 text-sm font-bold truncate"
                    onClick={() => { setSelectedSide("nao"); setDrawerOpen(true); }}>
                    {isBinaryGeneric ? "Comprar NÃO" : noLabel}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">Cada contrato paga R$ 1,00 se a posição estiver correta.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <TradingDrawer
        market={market}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedSide(null); }}
        posicoes={posicoes}
        selectedSide={selectedSide}
        yesLabel={yesLabel}
        noLabel={noLabel}
      />
    </div>
  );
};

export default MarketDetail;
// cache bust 1781489715
