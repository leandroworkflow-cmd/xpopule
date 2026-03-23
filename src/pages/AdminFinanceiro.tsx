import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2, Vault, TrendingUp, BarChart3, Wallet,
  CheckCircle, XCircle, Download,
} from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  pix_key: string;
  status: string;
  created_at: string;
  profiles?: { email: string | null } | null;
}

interface DailyVolume {
  date: string;
  volume: number;
}

export default function AdminFinanceiro() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [custody, setCustody] = useState(0);
  const [grossFees, setGrossFees] = useState(0);
  const [marketVolume, setMarketVolume] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [dailyVolumes, setDailyVolumes] = useState<DailyVolume[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Acesso restrito a administradores.");
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchAll = async () => {
    const [
      profilesRes,
      feesRes,
      marketsRes,
      withdrawalsRes,
      txRes,
    ] = await Promise.all([
      supabase.from("profiles").select("balance"),
      supabase.from("platform_fees").select("amount"),
      supabase.from("markets").select("volume, status").eq("status", "active"),
      supabase.from("withdrawal_requests").select("*, profiles(email)").order("created_at", { ascending: false }),
      supabase.from("transactions").select("amount, created_at").gte(
        "created_at",
        new Date(Date.now() - 30 * 86400000).toISOString()
      ),
    ]);

    // Custody = sum of all user balances
    setCustody(
      (profilesRes.data || []).reduce((s, p) => s + Number(p.balance), 0)
    );

    // Gross fees
    setGrossFees(
      (feesRes.data || []).reduce((s, f) => s + Number(f.amount), 0)
    );

    // Market volume (active markets)
    setMarketVolume(
      (marketsRes.data || []).reduce((s, m) => s + m.volume, 0)
    );

    // Withdrawals
    setWithdrawals((withdrawalsRes.data as unknown as WithdrawalRequest[]) || []);

    // Daily volumes (last 30 days)
    const txData = txRes.data || [];
    const volumeMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      volumeMap[key] = 0;
    }
    txData.forEach((tx) => {
      const key = new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (volumeMap[key] !== undefined) {
        volumeMap[key] += Math.abs(Number(tx.amount));
      }
    });
    setDailyVolumes(Object.entries(volumeMap).map(([date, volume]) => ({ date, volume })));

    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  const adminBalance = grossFees; // Net admin profit = accumulated fees

  const handleWithdrawal = async (id: string, action: "approved" | "rejected") => {
    setProcessing(id);
    const wr = withdrawals.find((w) => w.id === id);
    if (!wr) return;

    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: action, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      setProcessing(null);
      return;
    }

    if (action === "approved") {
      // Deduct from user balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", wr.user_id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ balance: Number(profile.balance) - wr.amount })
          .eq("id", wr.user_id);
      }

      // Record withdrawal fee
      await supabase.from("platform_fees").insert({
        withdrawal_request_id: id,
        fee_type: "withdrawal",
        amount: wr.fee,
      });

      toast.success(`Saque de R$ ${fmt(wr.net_amount)} aprovado.`);
    } else {
      toast.success("Saque rejeitado.");
    }

    setProcessing(null);
    fetchAll();
  };

  const exportCSV = () => {
    const headers = ["Data,Tipo,Valor"];
    const rows = dailyVolumes.map((d) => `${d.date},Volume,${d.volume.toFixed(2)}`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-mercadox-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    pending: { label: "Pendente", variant: "default" },
    approved: { label: "Aprovado", variant: "secondary" },
    rejected: { label: "Rejeitado", variant: "destructive" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Custódia, taxas e gestão de saques da plataforma.
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Exportar Relatório Mensal
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gradient-card rounded-xl border border-border p-5 flex items-start gap-3">
          <Vault className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div>
            <div className="text-xs text-muted-foreground">Custódia Total</div>
            <div className="text-xl font-bold text-foreground">R$ {fmt(custody)}</div>
            <div className="text-[10px] text-muted-foreground">Saldo dos usuários</div>
          </div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-5 flex items-start gap-3">
          <TrendingUp className="h-8 w-8 text-success shrink-0 mt-1" />
          <div>
            <div className="text-xs text-muted-foreground">Lucro Bruto (Taxas)</div>
            <div className="text-xl font-bold text-success">R$ {fmt(grossFees)}</div>
            <div className="text-[10px] text-muted-foreground">Negociação + Saque</div>
          </div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-5 flex items-start gap-3">
          <BarChart3 className="h-8 w-8 text-primary shrink-0 mt-1" />
          <div>
            <div className="text-xs text-muted-foreground">Volume em Mercados</div>
            <div className="text-xl font-bold text-foreground">{marketVolume.toLocaleString("pt-BR")}</div>
            <div className="text-[10px] text-muted-foreground">Contratos ativos</div>
          </div>
        </div>
        <div className="gradient-card rounded-xl border border-border p-5 flex items-start gap-3">
          <Wallet className="h-8 w-8 text-success shrink-0 mt-1" />
          <div>
            <div className="text-xs text-muted-foreground">Saldo ADM Disponível</div>
            <div className="text-xl font-bold text-success">R$ {fmt(adminBalance)}</div>
            <div className="text-[10px] text-muted-foreground">Lucro líquido</div>
          </div>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="gradient-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa — Últimos 30 dias</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyVolumes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(215, 14%, 55%)" }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 12%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(215, 14%, 55%)" }}
                formatter={(value: number) => [`R$ ${fmt(value)}`, "Volume"]}
              />
              <Bar dataKey="volume" fill="hsl(152, 60%, 48%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Withdrawal Requests */}
      <div className="gradient-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Solicitações de Saque</h2>
        {withdrawals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhuma solicitação de saque pendente.
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor Bruto</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((wr) => {
                  const st = statusLabels[wr.status] || { label: wr.status, variant: "secondary" as const };
                  return (
                    <TableRow key={wr.id}>
                      <TableCell className="text-foreground text-sm">
                        {(wr.profiles as any)?.email || "—"}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        R$ {fmt(wr.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        R$ {fmt(wr.fee)}
                      </TableCell>
                      <TableCell className="text-success font-bold">
                        R$ {fmt(wr.net_amount)}
                      </TableCell>
                      <TableCell className="text-foreground text-xs font-mono max-w-[150px] truncate">
                        {wr.pix_key}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {wr.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleWithdrawal(wr.id, "approved")}
                              disabled={processing === wr.id}
                            >
                              {processing === wr.id ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleWithdrawal(wr.id, "rejected")}
                              disabled={processing === wr.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}