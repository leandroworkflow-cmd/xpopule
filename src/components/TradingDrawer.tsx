import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DBMarket } from "@/types/market";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PAYOUT = 1.00;
const FEE_RATE = 0.01;
const QUICK_AMOUNTS = [5, 10, 50, 100];
const MIN_AMOUNT = 1;

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  const num = parseInt(digits || "0", 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(formatted: string): number {
  const clean = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function calcFromAmount(amount: number, pricePerContract: number) {
  const qty = pricePerContract > 0 ? amount / pricePerContract : 0;
  const fee = amount * FEE_RATE;
  const totalCost = amount + fee;
  const potentialReturn = qty * PAYOUT;
  const netProfit = potentialReturn - totalCost;
  return { qty, subtotal: amount, fee, totalCost, potentialReturn, netProfit };
}

interface TradingDrawerProps {
  market: DBMarket | null;
  open: boolean;
  onClose: () => void;
  selectedTipo?: "time_casa" | "empate" | "time_fora";
  posicoes?: any[];
}

export function TradingDrawer({
  market,
  open,
  onClose,
  selectedTipo = "time_casa",
  posicoes = [],
}: TradingDrawerProps) {
  const [tipo, setTipo] = useState<"time_casa" | "empate" | "time_fora">(selectedTipo);
  const [amountDisplay, setAmountDisplay] = useState("1,00");
  const [loading, setLoading] = useState(false);
  const { balance, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTipo(selectedTipo);
  }, [selectedTipo, open]);

  if (!market) return null;

  const title = (market as any).nome || (market as any).title || "";
  const timeCasa = (market as any).time_casa || "Time A";
  const timeFora = (market as any).time_fora || "Time B";
  const dataEvento = (market as any).data_evento || (market as any).end_date;
  const descricao = (market as any).descricao || (market as any).resolution_rule || "";

  const posicaoAtual = posicoes.find((p) => p.tipo === tipo);
  const pricePerContract = posicaoAtual?.preco_unitario ?? 0;
  const volDisponivel = posicaoAtual?.volume_disponivel ?? 0;

  const amount = parseCurrency(amountDisplay);
  const fees = calcFromAmount(amount, pricePerContract);
  const invalidAmount = amount < MIN_AMOUNT;
  const semEstoque = volDisponivel === 0;

  const tipoLabel = (t: string) => {
    if (t === "time_casa") return timeCasa;
    if (t === "time_fora") return timeFora;
    return "Empate";
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(formatCurrency(e.target.value));
  };

  const addAmount = (val: number) => {
    setAmountDisplay(fmt(parseCurrency(amountDisplay) + val));
  };

  const handleOrder = async () => {
    if (invalidAmount) {
      toast.error("O valor mínimo é R$ 1,00.");
      return;
    }
    if (semEstoque) {
      toast.error("Sem contratos disponíveis para esta posição.");
      return;
    }
    if (!user) {
      toast.info("Faça login para negociar.");
      onClose();
      navigate(`/login?redirect=${encodeURIComponent(`/mercado/${market.id}`)}`);
      return;
    }

    setLoading(true);
    console.log("🚀 Iniciando checkout...");
    console.log("📦 Payload:", {
      amount: fees.totalCost,
      marketId: market.id,
      posicaoId: posicaoAtual?.id,
      tipo,
      quantity: Math.floor(fees.qty),
      pricePerContract,
      userId: user.id,
    });

    try {
      const { data, error } = await supabase.functions.invoke("Criar--pagamento", {
        body: {
          amount: fees.totalCost,
          marketId: market.id,
          posicaoId: posicaoAtual?.id,
          tipo,
          quantity: Math.floor(fees.qty),
          pricePerContract,
          userId: user.id,
        },
      });

      console.log("✅ Resposta da função:", data);
      console.log("❌ Erro da função:", error);
      console.log("🔗 init_point:", data?.init_point);

      if (error) throw error;
      if (!data?.init_point) throw new Error("URL de pagamento não retornada.");

      window.location.assign(data.init_point);
    } catch (err: any) {
      console.error("💥 Checkout error:", err);
      toast.error("Erro ao criar sessão de pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground text-left text-lg leading-snug capitalize">
            {title}
          </SheetTitle>
          {dataEvento && (
            <p className="text-xs text-muted-foreground">
              Evento: {new Date(dataEvento).toLocaleDateString("pt-BR")}
            </p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">

          {/* Seleção de posição */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Escolha sua posição</label>
            <div className="flex gap-2">
              {(["time_casa", "empate", "time_fora"] as const).map((t) => {
                const pos = posicoes.find((p) => p.tipo === t);
                const isSelected = tipo === t;
                const colorClass =
                  t === "time_casa"
                    ? isSelected
                      ? "bg-success/20 border-success text-success"
                      : "border-border text-muted-foreground hover:border-success/50"
                    : t === "time_fora"
                    ? isSelected
                      ? "bg-danger/20 border-danger text-danger"
                      : "border-border text-muted-foreground hover:border-danger/50"
                    : isSelected
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50";

                return (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-1 rounded-lg border transition-all ${colorClass}`}
                  >
                    <span className="text-[10px] font-medium text-center leading-tight truncate w-full">
                      {tipoLabel(t)}
                    </span>
                    {pos && (
                      <>
                        <span className="text-sm font-bold">
                          {pos.preco_unitario > 0 ? (1 / pos.preco_unitario).toFixed(2) : "—"}x
                        </span>
                        <span className="text-[9px] opacity-70">R$ {fmt(pos.preco_unitario)}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valores rápidos */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Valor rápido</label>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((val) => (
                <Button key={val} variant="outline" size="sm" className="h-10 font-bold"
                  onClick={() => addAmount(val)}>
                  +{val}
                </Button>
              ))}
              <Button variant="outline" size="sm"
                className="h-10 font-bold text-primary border-primary/30"
                onClick={() => setAmountDisplay(fmt(balance ?? 0))}>
                MAX
              </Button>
            </div>
          </div>

          {/* Input de valor */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Valor do investimento</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-lg">
                R$
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="pl-11 bg-background border-border text-foreground text-lg h-12"
              />
            </div>
            {invalidAmount && amount > 0 && (
              <p className="text-xs text-destructive mt-1">Valor mínimo: R$ 1,00</p>
            )}
            {!invalidAmount && pricePerContract > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Você está adquirindo{" "}
                <span className="font-semibold text-foreground">{Math.floor(fees.qty)}</span> contrato(s) de{" "}
                <span className="font-semibold text-foreground">{tipoLabel(tipo)}</span> @ R$ {fmt(pricePerContract)}
              </p>
            )}
            {semEstoque && (
              <p className="text-xs text-destructive mt-1">Sem contratos disponíveis para esta posição.</p>
            )}
          </div>

          {/* Resumo financeiro */}
          <div className="rounded-lg bg-background/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investimento ({Math.floor(fees.qty)} contratos)</span>
              <span className="text-foreground font-medium">R$ {fmt(fees.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa (1%)</span>
              <span className="text-foreground">R$ {fmt(fees.fee)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground font-semibold">Custo total</span>
              <span className="text-foreground font-bold">R$ {fmt(fees.totalCost)}</span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retorno potencial</span>
                <span className="text-foreground font-medium">R$ {fmt(fees.potentialReturn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro líquido estimado</span>
                <span className={`font-bold text-lg ${fees.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                  R$ {fmt(fees.netProfit)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Cada contrato paga R$ {fmt(PAYOUT)} se a posição estiver correta.
            </p>
          </div>

          {/* Botão de compra */}
          <Button
            variant={tipo === "time_fora" ? "danger" : tipo === "time_casa" ? "success" : "default"}
            className="w-full h-12 text-base font-bold"
            onClick={handleOrder}
            disabled={loading || invalidAmount || semEstoque}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Processando...
              </>
            ) : (
              `Comprar ${tipoLabel(tipo)} — R$ ${fmt(fees.totalCost)}`
            )}
          </Button>

          {/* Regras */}
          {descricao && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Info className="h-4 w-4 text-primary" />
                Regras do Mercado
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{descricao}</p>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
