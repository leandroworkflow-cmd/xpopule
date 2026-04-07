import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DBMarket, categoryLabels } from "@/types/market";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PAYOUT = 100;
const FEE_RATE = 0.01;
const QUICK_AMOUNTS = [10, 50, 100];
const MIN_AMOUNT = 1;

function calcFromAmount(amount: number, pricePerContract: number) {
  const qty = amount / pricePerContract;
  const fee = amount * FEE_RATE;
  const totalCost = amount + fee;
  const potentialReturn = qty * PAYOUT;
  const netProfit = potentialReturn - totalCost;
  return { qty, subtotal: amount, fee, totalCost, potentialReturn, netProfit };
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  const num = parseInt(digits || "0", 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(formatted: string): number {
  const clean = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

interface TradingDrawerProps {
  market: DBMarket | null;
  open: boolean;
  onClose: () => void;
}

export function TradingDrawer({ market, open, onClose }: TradingDrawerProps) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amountDisplay, setAmountDisplay] = useState("1,00");
  const [loading, setLoading] = useState(false);
  const { balance, user, refreshBalance } = useAuth();
  const navigate = useNavigate();

  if (!market) return null;
  const price = side === "yes" ? market.yes_price : market.no_price;
  const amount = parseCurrency(amountDisplay);
  const fees = calcFromAmount(amount, price);
  const insufficientBalance = user && fees.totalCost > balance;
  const invalidAmount = amount < MIN_AMOUNT;
  const catLabel = categoryLabels[market.category] || market.category;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountDisplay(formatCurrency(e.target.value));
  };

  const addAmount = (val: number) => {
    const newAmount = amount + val;
    setAmountDisplay(fmt(newAmount));
  };

  const handleOrder = async () => {
    if (invalidAmount) {
      toast.error("O valor mínimo para participar é R$ 1,00.");
      return;
    }

    if (!user) {
      toast.info("Faça login para negociar.");
      onClose();
      navigate(`/login?redirect=${encodeURIComponent(`/mercado/${market.id}`)}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          amount: fees.totalCost,
          marketId: market.id,
          side,
          quantity: fees.qty,
          pricePerContract: price,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("URL de pagamento não retornada.");

      window.location.assign(data.url);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Erro ao criar sessão de pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader>
          <Badge variant="secondary" className="w-fit text-xs">
            {catLabel}
          </Badge>
          <SheetTitle className="text-foreground text-left text-lg leading-snug mt-2 capitalize">
            {market.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Side selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={side === "yes" ? "success" : "outline"}
              className={`h-14 text-base ${side === "yes" ? "glow-success" : ""}`}
              onClick={() => setSide("yes")}
            >
              <div className="text-center">
                <div className="font-bold">Sim</div>
                <div className="text-xs opacity-80">R$ {fmt(market.yes_price)}</div>
              </div>
            </Button>
            <Button
              variant={side === "no" ? "danger" : "outline"}
              className={`h-14 text-base ${side === "no" ? "glow-danger" : ""}`}
              onClick={() => setSide("no")}
            >
              <div className="text-center">
                <div className="font-bold">Não</div>
                <div className="text-xs opacity-80">R$ {fmt(market.no_price)}</div>
              </div>
            </Button>
          </div>

          {/* Quick amount buttons */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Adicionar Valor Rápido</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="h-10 font-bold"
                  onClick={() => addAmount(val)}
                >
                  + R$ {val}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Valor do Investimento</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-lg">R$</span>
              <Input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="pl-11 bg-background border-border text-foreground text-lg h-12"
              />
            </div>
            {invalidAmount && amount > 0 && (
              <p className="text-xs text-destructive mt-1 font-medium">
                O valor mínimo para participar deste mercado é R$ 1,00
              </p>
            )}
            {!invalidAmount && (
              <p className="text-xs text-muted-foreground mt-1">
                Você está adquirindo <span className="font-semibold text-foreground">{fmt(fees.qty)}</span> contratos de {side === "yes" ? "SIM" : "NÃO"} @ R$ {fmt(price)}
              </p>
            )}
          </div>

          {/* Fee breakdown */}
          <div className="rounded-lg bg-background/50 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investimento ({fmt(fees.qty)} contratos)</span>
              <span className="text-foreground font-medium">R$ {fmt(fees.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de negociação (1%)</span>
              <span className="text-foreground">R$ {fmt(fees.fee)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground font-semibold">Custo Total</span>
              <span className="text-foreground font-bold">R$ {fmt(fees.totalCost)}</span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retorno Potencial</span>
                <span className="text-foreground font-medium">R$ {fmt(fees.potentialReturn)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro Líquido Estimado</span>
                <span className={`font-bold ${fees.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                  R$ {fmt(fees.netProfit)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada contrato paga R$ {fmt(PAYOUT)} se estiver correto.
            </p>
          </div>

          {/* Insufficient balance info */}
          {insufficientBalance && (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-warning">
                Saldo insuficiente (R$ {fmt(balance)}). Ao confirmar, você será redirecionado para pagamento via PIX.
              </p>
            </div>
          )}

          {/* Order button */}
          <Button
            variant={side === "yes" ? "success" : "danger"}
            className="w-full h-12 text-base font-bold"
            onClick={handleOrder}
            disabled={loading || invalidAmount}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                {insufficientBalance ? "Redirecionando para pagamento..." : "Processando..."}
              </>
            ) : insufficientBalance ? (
              `Pagar via PIX — R$ ${fmt(fees.totalCost)}`
            ) : (
              `Comprar ${side === "yes" ? "Sim" : "Não"} — R$ ${fmt(fees.totalCost)}`
            )}
          </Button>

          {/* Rules */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Info className="h-4 w-4 text-primary" />
              Regras do Mercado
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{market.resolution_rule}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Encerramento: {new Date(market.end_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
