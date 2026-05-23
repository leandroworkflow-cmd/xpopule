import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DBMarket, categoryLabels, categoryColors, categoryIcons } from "@/types/market";
import { Calendar, TrendingUp } from "lucide-react";
import { extractTeamsFromTitle } from "@/lib/teamLogos";

interface MarketCardProps {
  market: DBMarket;
  onClick: (market: DBMarket) => void;
}

// Hook para buscar opções de mercados multiplo/periodo
function useOpcoesMercado(marketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["opcoes_mercado", marketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opcoes_mercado")
        .select("*")
        .eq("market_id", marketId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled,
  });
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const navigate = useNavigate();
  const catLabel = categoryLabels[market.category] || market.category;
  const catColor = categoryColors[market.category] || "bg-muted text-muted-foreground";
  const CatIcon = categoryIcons[market.category] || TrendingUp;
  const endDateObj = new Date(market.end_date);
  const endDate = endDateObj.toLocaleDateString("pt-BR");
  const matchDateStr = endDateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const matchTimeStr = endDateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const now = new Date();
  const isToday =
    endDateObj.getFullYear() === now.getFullYear() &&
    endDateObj.getMonth() === now.getMonth() &&
    endDateObj.getDate() === now.getDate();

  const title = (market as any).nome || market.title || "";
  const tipoMercado = (market as any).tipo_mercado || "binario";

  // Apenas busca opções se for multiplo ou periodo
  const isMulti = tipoMercado === "multiplo" || tipoMercado === "periodo";
  const { data: opcoes = [] } = useOpcoesMercado(market.id, isMulti);

  const total = (market.yes_price || 50) + (market.no_price || 50);
  const yesPct = total > 0 ? Math.round(((market.yes_price || 50) / total) * 100) : 50;
  const noPct = 100 - yesPct;

  const teams = extractTeamsFromTitle(title);
  const homeLogo = (market as any).home_logo || teams?.teamA?.logo;
  const awayLogo = (market as any).away_logo || teams?.teamB?.logo;
  const hasTeams = teams !== null || homeLogo;

  const volHome = (market as any).volume_home || 0;
  const volDraw = (market as any).volume_draw || 0;
  const volAway = (market as any).volume_away || 0;
  const fmtVol = (v: number) => v === 0 ? "0 contr." : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;

  // ── HEADER (comum a todos os tipos) ──────────────────────────────────────
  const Header = () => (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${catColor}`}>
        <CatIcon className="h-3 w-3" />
        {catLabel}
      </span>
      {hasTeams && isToday && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          AO VIVO
        </span>
      )}
      {(volHome + volDraw + volAway) > 0 && (
        <span className="text-[10px] text-muted-foreground ml-auto">
          {fmtVol(volHome + volDraw + volAway)} total
        </span>
      )}
    </div>
  );

  // ── FOOTER (comum a todos os tipos) ──────────────────────────────────────
  const Footer = () => (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        R$ {((volHome + volDraw + volAway) * 100).toLocaleString("pt-BR")} vol
      </span>
      <span className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {endDate}
      </span>
    </div>
  );

  // ── MODO 1: MÚLTIPLO — ex: Eleições com candidatos ───────────────────────
  if (isMulti && tipoMercado === "multiplo") {
    return (
      <div
        onClick={() => navigate(`/mercado/${market.id}`)}
        className="rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
      >
        <Header />
        <h3 className="font-semibold text-sm text-foreground px-4 pb-3 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Opções com foto */}
        <div className="px-3 pb-3 flex flex-col gap-2 mt-auto">
          {opcoes.slice(0, 3).map((op: any) => (
            <button
              key={op.id}
              onClick={(e) => { e.stopPropagation(); onClick(market); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/40 hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
            >
              {op.foto_url && (
                <img
                  src={op.foto_url}
                  alt={op.label}
                  className="h-8 w-8 rounded-full object-cover border border-border/40 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{op.label}</div>
                {op.descricao && (
                  <div className="text-[10px] text-muted-foreground truncate">{op.descricao}</div>
                )}
              </div>
              <div className="flex-shrink-0 text-xs font-bold text-primary">
                {op.probabilidade}%
              </div>
            </button>
          ))}
          {opcoes.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{opcoes.length - 3} opções
            </p>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  // ── MODO 2: PERÍODO — ex: Quando o Bitcoin vai atingir X? ────────────────
  if (isMulti && tipoMercado === "periodo") {
    return (
      <div
        onClick={() => navigate(`/mercado/${market.id}`)}
        className="rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
      >
        <Header />

        {/* Imagem + título */}
        {(market as any).image_url && (
          <div className="h-12 mx-4 mb-2 rounded-lg overflow-hidden bg-background/50">
            <img
              src={(market as any).image_url}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <h3 className="font-semibold text-sm text-foreground px-4 pb-3 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Opções de período como pills */}
        <div className="px-3 pb-3 flex flex-col gap-1.5 mt-auto">
          {opcoes.slice(0, 4).map((op: any) => {
            const maxProb = Math.max(...opcoes.map((o: any) => o.probabilidade));
            const isLeading = op.probabilidade === maxProb;
            return (
              <button
                key={op.id}
                onClick={(e) => { e.stopPropagation(); onClick(market); }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border transition-all text-left
                  ${isLeading
                    ? "bg-primary/10 border-primary/30 hover:bg-primary/20"
                    : "bg-muted/20 border-border/40 hover:bg-muted/40"
                  }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{op.label}</div>
                  {op.descricao && (
                    <div className="text-[10px] text-muted-foreground truncate">{op.descricao}</div>
                  )}
                </div>
                <div className="relative ml-2 flex-shrink-0 w-10 h-10">
                  <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                      strokeWidth="2.5" className="text-border/30" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={isLeading ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                      strokeWidth="2.5"
                      strokeDasharray={`${op.probabilidade} ${100 - op.probabilidade}`}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                    {op.probabilidade}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <Footer />
      </div>
    );
  }

  // ── MODO 3: ESPORTES — times frente a frente ─────────────────────────────
  if (hasTeams) {
    return (
      <div
        onClick={() => navigate(`/mercado/${market.id}`)}
        className="rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
      >
        <Header />
        <div className="text-center text-[11px] text-muted-foreground font-medium px-4 pb-1">
          {matchDateStr} • {matchTimeStr}
        </div>
        <h3 className="font-semibold text-xs text-foreground px-4 pb-2 leading-snug line-clamp-2 text-center capitalize">
          {title}
        </h3>
        <div className="flex items-center justify-center gap-3 px-4 py-3">
          <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
            {homeLogo ? (
              <img src={homeLogo} alt={teams?.teamA?.name} className="h-12 w-12 object-contain" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {teams?.teamA?.name?.slice(0, 3).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] font-semibold text-foreground text-center truncate w-full capitalize">
              {teams?.teamA?.name}
            </span>
          </div>
          <span className="text-sm font-bold text-muted-foreground">VS</span>
          <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
            {awayLogo ? (
              <img src={awayLogo} alt={teams?.teamB?.name} className="h-12 w-12 object-contain" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {teams?.teamB?.name?.slice(0, 3).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] font-semibold text-foreground text-center truncate w-full capitalize">
              {teams?.teamB?.name}
            </span>
          </div>
        </div>
        <div className="px-3 pb-3 mt-auto">
          <div className="flex gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-success/10 border border-success/30 hover:bg-success/20 transition-all">
              <span className="text-[9px] text-muted-foreground truncate w-full text-center capitalize leading-tight">
                {teams?.teamA?.name?.split(" ")[0] || "Time A"}
              </span>
              <span className="text-[11px] font-bold text-success">{fmtVol(volHome)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all">
              <span className="text-[9px] text-muted-foreground text-center leading-tight">Empate</span>
              <span className="text-[11px] font-bold text-foreground">{fmtVol(volDraw)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg bg-danger/10 border border-danger/30 hover:bg-danger/20 transition-all">
              <span className="text-[9px] text-muted-foreground truncate w-full text-center capitalize leading-tight">
                {teams?.teamB?.name?.split(" ")[0] || "Time B"}
              </span>
              <span className="text-[11px] font-bold text-danger">{fmtVol(volAway)}</span>
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── MODO 4: BINÁRIO — Sim/Não padrão ─────────────────────────────────────
  return (
    <div
      onClick={() => navigate(`/mercado/${market.id}`)}
      className="rounded-xl border border-border/60 bg-card hover:border-primary/40 transition-all cursor-pointer group flex flex-col"
    >
      <Header />
      <h3 className="font-semibold text-sm text-foreground px-4 pb-2 leading-snug line-clamp-3 group-hover:text-primary transition-colors capitalize flex-1">
        {title}
      </h3>
      {(market as any).image_url && (
        <div className="h-16 mx-4 rounded-lg overflow-hidden mb-3 bg-background/50">
          <img src={(market as any).image_url} alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <div className="px-4 pb-3 space-y-2 mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-success/40" style={{ width: `${Math.max(yesPct, 8)}%` }} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Sim</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
            className="min-w-[52px] h-8 rounded-md text-xs font-bold bg-success/10 text-success hover:bg-success/20 border border-success/20 transition-all">
            {yesPct}%
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-danger/40" style={{ width: `${Math.max(noPct, 8)}%` }} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Não</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClick(market); }}
            className="min-w-[52px] h-8 rounded-md text-xs font-bold bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-all">
            {noPct}%
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card animate-pulse">
      <div className="px-4 pt-4 pb-2"><div className="h-5 w-20 rounded-full bg-muted/30" /></div>
      <div className="px-4 pb-3">
        <div className="h-4 w-full rounded bg-muted/30 mb-1.5" />
        <div className="h-4 w-2/3 rounded bg-muted/30" />
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted/30" />
          <div className="h-8 w-14 rounded-md bg-muted/30" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted/30" />
          <div className="h-8 w-14 rounded-md bg-muted/30" />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40">
        <div className="h-3 w-20 rounded bg-muted/30" />
        <div className="h-3 w-16 rounded bg-muted/30" />
      </div>
    </div>
  );
}
