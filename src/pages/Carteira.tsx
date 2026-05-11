import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, ArrowUpRight, ArrowDownRight, Trophy, X, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  side: string | null;
  quantity: number | null;
  amount: number;
  description: string | null;
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

const typeConfig: Record<string, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  deposit:    { label: "Depósito",   icon: ArrowUpRight,   color: "text-success" },
  withdrawal: { label: "Saque",      icon: ArrowDownRight, color: "text-danger"  },
  buy:        { label: "Compra",     icon: ArrowDownRight, color: "text-danger"  },
  sell:       { label: "Venda",      icon: ArrowUpRight,   color: "text-success" },
  payout:     { label: "Pagamento",  icon: Trophy,         color: "text-success" },
  deposito:   { label: "Depósito",   icon: ArrowUpRight,   color: "text-success" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TIPOS_PIX = [
  { value: "cpf",       label: "CPF" },
  { value: "email",     label: "E-mail" },
  { value: "celular",   label: "Celular" },
  { value: "aleatoria", label: "Chave aleatória" },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "text-warning", icon: Clock },
  aprovado: { label: "Aprovado", color: "text-success", icon: CheckCircle },
  recusado: { label: "Recusado", color: "text-danger",  icon: AlertCircle },
};

export default function Carteira() {
  const { user, balance } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [saques, setSaques]             = useState<Saque[]>([]);
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
    ]).then(([{ data: txs }, { data: sqs }]) => {
      setTransactions(txs || []);
      setSaques(sqs || []);
      setLoading(false);
    });
  }, [user]);

  const handleSolicitarSaque = async () => {
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || valorNum < 10) { toast.error("Valor mínimo de saque é R$ 10,00"); return; }
    if (!chavePix.trim()) { toast.error("Informe sua chave Pix"); return; }
    if (valorNum > (balance ?? 0)) { toast.error("Saldo insuficiente"); return; }
    setLoadingSaque(true);
    try {
      const { error: debitError } = await supabase.rpc("debitar_saldo", { p_user_id: user!.id, p_valor: valorNum });
      if (debitError) throw new Error(debitError.message);
      const { error: saqueError } = await supabase.from("saques").insert({ user_id: user!.id, valor: valorNum, chave_pix: chavePix.trim(), tipo_chave: tipoChave, status: "pendente" });
      if (saqueError) throw new Error(saqueError.message);
      await supabase.from("transactions").insert({ user_id: user!.id, tipo: "withdrawal", valor: valorNum, status: "pending", mp_payment_id: `saque_${Date.now()}` });
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Minha Carteira</h1>
        <p className="text-sm text-muted-foreground">Saldo e histórico de transações.</p>
      </div>

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
              <Button size="sm" className="gap-1.5" onClick={() => window.location.href = "/depositar"}>
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
          <p className="text-2xl font-bold text-warning">{saques.filter(s => s.status === "pendente").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Processados em até 24h</p>
        </div>
      </div>

      {showSaque && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Solicitar Saque</h2>
              <button onClick={() => setShowSaque(false)} className="text-muted-foreground hover:text-foreground">
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
                    <button key={t.value} onClick={() => setTipoChave(t.value)} className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${tipoChave === t.value ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Chave Pix</label>
                <Input placeholder={tipoChave === "cpf" ? "000.000.000-00" : tipoChave === "email" ? "seu@email.com" : tipoChave === "celular" ? "+55 11 99999-9999" : "Chave aleatória"} value={chavePix} onChange={e => setChavePix(e.target.value)} className="bg-background border-border h-11" />
              </div>
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">Saques são processados manualmente em até 24 horas úteis. O saldo será debitado imediatamente.</p>
              </div>
              <Button className="w-full h-11 font-bold" onClick={handleSolicitarSaque} disabled={loadingSaque}>
                {loadingSaque ? "Processando..." : "Confirmar Saque"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {saques.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Histórico de Saques</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
            {saques.map(s => {
              const cfg = statusConfig[s.status] || statusConfig.pendente;
              const Icon = cfg.icon;
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <ArrowDownRight className="h-4 w-4 text-danger" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Saque via Pix</p>
                      <p className="text-xs text-muted-foreground">{s.tipo_chave.toUpperCase()}: {s.chave_pix}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">- R$ {fmt(s.valor)}</p>
                    <div className={`flex items-center gap-1 justify-end mt-0.5 ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Histórico de Transações</h2>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma transação ainda.</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
            {transactions.map(tx => {
              const tipo = tx.type || (tx as any).tipo || "deposit";
              const cfg  = typeConfig[tipo] || typeConfig.deposit;
              const Icon = cfg.icon;
              const val = tx.amount || (tx as any).valor || 0;
              const isPositive = ["deposit","sell","payout","deposito"].includes(tipo);
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                      {tx.description && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isPositive ? "text-success" : "text-danger"}`}>
                    {isPositive ? "+" : "-"} R$ {fmt(Number(val))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

      {saques.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3">Histórico de Saques</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
            {saques.map(s => {
              const cfg = statusConfig[s.status] || statusConfig.pendente;
              const Icon = cfg.icon;
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <ArrowDownRight className="h-4 w-4 text-danger" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Saque via Pix</p>
                      <p className="text-xs text-muted-foreground">{s.tipo_chave.toUpperCase()}: {s.chave_pix}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">- R$ {fmt(s.valor)}</p>
                    <div className={`flex items-center gap-1 justify-end mt-0.5 ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Histórico de Transações</h2>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Nenhuma transação ainda.</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/40">
            {transactions.map(tx => {
              const tipo = tx.type || (tx as any).tipo || "deposit";
              const cfg  = typeConfig[tipo] || typeConfig.deposit;
              const Icon = cfg.icon;
              const val = tx.amount || (tx as any).valor || 0;
              const isPositive = ["deposit","sell","payout","deposito"].includes(tipo);
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                      {tx.description && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isPositive ? "text-success" : "text-danger"}`}>
                    {isPositive ? "+" : "-"} R$ {fmt(Number(val))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
