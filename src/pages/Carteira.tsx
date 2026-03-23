import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, ArrowUpRight, ArrowDownRight, Trophy, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: string;
  side: string | null;
  quantity: number | null;
  amount: number;
  description: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  deposit: { label: "Depósito", icon: ArrowUpRight, color: "text-success" },
  withdrawal: { label: "Saque", icon: ArrowDownRight, color: "text-danger" },
  buy: { label: "Compra", icon: ArrowDownRight, color: "text-danger" },
  sell: { label: "Venda", icon: ArrowUpRight, color: "text-success" },
  payout: { label: "Pagamento", icon: Trophy, color: "text-success" },
};

export default function Carteira() {
  const { user, balance } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTransactions(data || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Minha Carteira</h1>
        <p className="text-sm text-muted-foreground">Saldo e histórico de transações.</p>
      </div>

      <div className="gradient-card rounded-xl border border-border p-6 mb-8">
        <div className="flex items-center gap-3 text-muted-foreground text-sm mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          Saldo Disponível
        </div>
        <div className="text-3xl font-bold text-foreground">
          R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">Histórico de Transações</h2>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma transação ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const cfg = typeConfig[tx.type] || { label: tx.type, icon: XCircle, color: "text-muted-foreground" };
            const Icon = cfg.icon;
            return (
              <div key={tx.id} className="gradient-card rounded-lg border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full bg-accent flex items-center justify-center ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{cfg.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {tx.description || (tx.side ? `${tx.quantity}x ${tx.side === "yes" ? "Sim" : "Não"}` : "")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${tx.amount >= 0 ? "text-success" : "text-danger"}`}>
                    {tx.amount >= 0 ? "+" : ""}R$ {Math.abs(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
