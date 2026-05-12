import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet, ArrowUpRight, ArrowDownRight, Trophy,
  X, AlertCircle, CheckCircle, Clock, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  mp_payment_id: string | null;
  created_at: string;
}

interface Saque {
  id: string;
  valor: number;
  chave_pix: string;
  tipo_chave: string;
  status: string;
  created_at: string;
}

interface Contrato {
  id: string;
  posicao_id: string;
  quantidade: number;
  preco_pago: number;
  status: string;
  created_at: string;
  tipo?: string;
  market_title?: string;
  market_category?: string;
  home_logo?: string | null;
  away_logo?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  isNaN(v) ? "0,00" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

const TIPOS_PIX = [
  { value: "cpf",       label: "CPF" },
  { value: "email",     label: "E-mail" },
  { value: "celular",   label: "Celular" },
  { value: "aleatoria", label: "Chave aleatória" },
];

const tipoLabel: Record<string, string> = {
  time_casa: "Casa",
  empate:    "Empate",
  time_fora: "Fora",
  sim:       "SIM",
  nao:       "NÃO",
};

const statusSaqueConfig: Record<string, { label: string; color: string; Icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "text-yellow-400", Icon: Clock        },
  aprovado: { label: "Aprovado", color: "text-emerald-400", Icon: CheckCircle },
  recusado: { label: "Recusado", color: "text-red-400",    Icon: AlertCircle  },
};

const statusContratoConfig: Record<string, { label: string; color: string }> = {
  ativo:     { label: "Ativo",     color: "text-blue-400"    },
  ganho:     { label: "Ganho",     color: "text-emerald-400" },
  perdido:   { label: "Perdido",   color: "text-red-400"     },
  pendente:  { label: "Pendente",  color: "text-yellow-400"  },
  cancelado: { label: "Cancelado", color: "text-zinc-400"    },
  active:    { label: "Ativo",     color: "text-blue-400"    },
  won:       { label: "Ganho",     color: "text-emerald-400" },
  lost:      { label: "Perdido",   color: "text-red-400"     },
};

const txConfig: Record<string, { label: string; positive: boolean }> = {
  deposito:   { label: "Depósito",  positive: true  },
  deposit:    { label: "Depósito",  positive: true  },
  saque:      { label: "Saque",     positive: false },
  withdrawal: { label: "Saque",     positive: false },
  compra:     { label: "Compra",    positive: false },
  buy:        { label: "Compra",    positive: false },
  ganho:      { label: "Ganho",     positive: true  },
  payout:     { label: "Ganho",     positive: true  },
  sell:       { label: "Venda",     positive: true  },
};

type Tab = "contratos" | "transacoes" | "saques";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Carteira() {
  const { user, balance } = useAuth();

  const [tab, setTab]                   = useState<Tab>("contratos");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [saques, setSaques]             = useState<Saque[]>([]);
  const [contratos, setContratos]       = useState<Contrato[]>([]);
  const [loading, setLoading]           = useState(true);

  const [showSaque, setShowSaque]       = useState(false);
  const [loadingSaque, setLoadingSaque] = useState(false);
  const [valor, setValor]               = useState("");
  const [chavePix, setChavePix]         = useState("");
  const [tipoChave, setTipoChave]       = useState("cpf");

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("saques").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("contratos").select("id, posicao_id, quantidade, preco_pago, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]).then(async ([{ data: txs }, { data: sqs }, { data: cts }]) => {
      setTransactions(txs || []);
      setSaques(sqs || []);

      const contratosList: Contrato[] = cts || [];

      // 1. buscar posicoes
      const posicaoIds = [...new Set(contratosList.map(c => c.posicao_id).filter(Boolean))];
      let posicoesMap: Record<string, any> = {};
      if (posicaoIds.length > 0) {
        const { data: pos } = await supabase.from("posicoes").select("id, mercado_id, tipo").in("id", posicaoIds);
        (pos || []).forEach((p: any) => { posicoesMap[p.id] = p; });
      }

      // 2. buscar markets — usa "nome" (nome real da coluna)
      const mercadoIds = [...new Set(Object.values(posicoesMap).map((p: any) => p.mercado_id).filter(Boolean))];
      let marketsMap: Record<string, any> = {};
      if (mercadoIds.length > 0) {
        const { data: mks } = await supabase.from("markets").select("id, nome, category, home_logo, away_logo").in("id", mercadoIds);
        (mks || []).forEach((m: any) => { marketsMap[m.id] = m; });
      }

      // 3. enriquecer contratos
      const enriched: Contrato[] = contratosList.map(c => {
        const pos = posicoesMap[c.posicao_id];
        const mkt = pos ? marketsMap[pos.mercado_id] : null;
        return {
          ...c,
          tipo:            pos?.tipo      ?? "—",
          market_title:    mkt?.nome      ?? "Mercado desconhecido",
          market_category: mkt?.category  ?? "",
          home_logo:       mkt?.home_logo ?? null,
          away_logo:       mkt?.away_logo ?? null,
        };
      });

      setContratos(enriched);
      setLoading(false);
    });
  }, [user]);

  const handleSolicitarSaque = async () => {
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || valorNum < 10) { toast.error("Valor mínimo de saque é R$ 10,00"); return; }
    if (!chavePix.trim())           { toast.error("Informe sua chave Pix"); return; }
    if (valorNum > (balance ?? 0))  { toast.error("Saldo insuficiente"); return; }

    setLoadingSaque(true);
    try {
      const { error: debitError } = await supabase.rpc("debitar_saldo", { p_user_id: user!.id, p_valor: valorNum });
      if (debitError) throw new Error(debitError.message);

      const { error: saqueError } = await supabase.from("saques").insert({
        user_id: user!.id, valor: valorNum, chave_pix: chavePix.trim(), tipo_chave: tipoChave, status: "pendente",
      });
      if (saqueError) throw new Error(saqueError.message);

      await supabase.from("transactions").insert({
        user_id: user!.id, tipo: "saque", valor: valorNum, status: "pending", mp_payment_id: `saque_${Date.now()}`,
      });

      toast.success("Saque solicitado! Será processado em até 24h.");
      setShowSaque(false);
      setValor("");
      setChavePix("");

      const { data } = await supabase.from("saques").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20);
      setSaques(data || []);
    } catch (e: any) {
      toast.error("Erro ao solicitar saque: " + e.message);
    } finally {
      setLoadingSaque(false);
    }
  };

  const saquesPendentes = saques.filter(s => s.status === "pendente").length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Minha Carteira</h1>
        <p className="text-sm text-muted-foreground">Saldo, contratos e histórico de transações.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Saldo Disponível
              </p>
              <p className="text-4xl font-bold text-foreground">R$ {fmt(balance ?? 0)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" className="gap-1.5" onClick={() => (window.location.href = "/depositar")}>
                <ArrowUpRight className="h-4 w-4" /> Depositar
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowSaque(true)} disabled={(balance ?? 0) < 10}>
                <ArrowDownRight className="h-4 w-4" /> Sacar
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-1">Saques pendentes</p>
          <p className="text-2xl font-bold text-yellow-400">{saquesPendentes}</p>
          <p className="text-xs text-muted-foreground mt-1">Processados em até 24h</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/40 rounded-xl p-1 w-fit">
        {(["contratos", "transacoes", "saques"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "contratos" ? "Meus Contratos" : t === "transacoes" ? "Transações" : "Saques"}
          </button>
        ))}
      </div>

      {/* Tab: Contratos */}
      {tab === "contratos" && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Histórico de Contratos</h2>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : contratos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum contrato comprado ainda.</div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
              {contratos.map(c => {
                const stCfg  = statusContratoConfig[c.status?.toLowerCase()] ?? { label: c.status, color: "text-zinc-400" };
                const tLabel = tipoLabel[c.tipo?.toLowerCase() ?? ""] ?? c.tipo ?? "—";
                const total  = (c.quantidade ?? 0) * (c.preco_pago ?? 0);
                return (
                  <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 shrink-0">
                        {c.home_logo && c.away_logo ? (
                          <>
                            <img src={c.home_logo} alt="" className="absolute left-0 top-0 w-6 h-6 rounded-full border border-border object-cover bg-muted" />
                            <img src={c.away_logo} alt="" className="absolute right-0 bottom-0 w-6 h-6 rounded-full border border-border object-cover bg-muted" />
                          </>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{c.market_title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">{tLabel}</span>
                          {c.market_category && <span className="text-xs text-muted-foreground">{c.market_category}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.quantidade}x · R$ {fmt(c.preco_pago)} cada · {fmtDate(c.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-red-400">- R$ {fmt(total)}</p>
                      <span className={`text-xs font-medium ${stCfg.color}`}>{stCfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Transações */}
      {tab === "transacoes" && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Histórico de Transações</h2>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma transação ainda.</div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
              {transactions.map(tx => {
                const tipo       = (tx.tipo ?? "deposito").toLowerCase();
                const cfg        = txConfig[tipo] ?? { label: tipo, positive: true };
                const val        = Number(tx.valor) || 0;
                const isPositive = cfg.positive;
                const Icon       = isPositive ? ArrowUpRight : ArrowDownRight;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? "+" : "-"} R$ {fmt(val)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Saques */}
      {tab === "saques" && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Histórico de Saques</h2>
          {saques.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum saque solicitado ainda.</div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
              {saques.map(s => {
                const cfg  = statusSaqueConfig[s.status] ?? statusSaqueConfig.pendente;
                const Icon = cfg.Icon;
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <ArrowDownRight className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Saque via Pix</p>
                        <p className="text-xs text-muted-foreground">{s.tipo_chave.toUpperCase()}: {s.chave_pix}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(s.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">- R$ {fmt(s.valor)}</p>
                      <div className={`flex items-center gap-1 justify-end mt-0.5 ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        <span className="text-xs font-medium">{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Saque */}
      {showSaque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Solicitar Saque</h2>
              <button onClick={() => setShowSaque(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Valor do saque</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input type="text" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} className="pl-9 bg-background border-border h-11" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Saldo disponível: R$ {fmt(balance ?? 0)} · Mínimo R$ 10,00</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Tipo de chave Pix</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_PIX.map(t => (
                    <button key={t.value} onClick={() => setTipoChave(t.value)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${tipoChave === t.value ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Chave Pix</label>
                <Input placeholder="Digite sua chave Pix" value={chavePix} onChange={e => setChavePix(e.target.value)} className="bg-background border-border h-11" />
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">Saques são processados manualmente em até 24 horas úteis. O saldo será debitado imediatamente.</p>
              </div>
              <Button className="w-full h-11 font-bold" onClick={handleSolicitarSaque} disabled={loadingSaque}>
                {loadingSaque ? "Processando..." : "Confirmar Saque"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
