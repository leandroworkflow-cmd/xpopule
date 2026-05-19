import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Star, Crown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  price_brl: number;
  predictions_limit: number;
  features: string[];
}

interface Subscription {
  plan_id: string;
  status: string;
  current_period_end: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Zap,
  pro: Star,
  expert: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-border",
  pro: "border-primary shadow-lg shadow-primary/10",
  expert: "border-purple-500 shadow-lg shadow-purple-500/10",
};

const PLAN_BADGE: Record<string, { label: string; className: string } | null> = {
  free: null,
  pro: { label: "Mais popular", className: "bg-primary text-primary-foreground" },
  expert: { label: "Completo", className: "bg-purple-500 text-white" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Planos() {
  const { user } = useAuth();

  const [plans, setPlans]               = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading]           = useState(true);
  const [loadingPlan, setLoadingPlan]   = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("plans").select("*").order("price_brl"),
      supabase.from("subscriptions").select("plan_id, status, current_period_end")
        .eq("user_id", user.id).eq("status", "active").maybeSingle(),
    ]).then(([{ data: pl }, { data: sub }]) => {
      setPlans((pl ?? []) as Plan[]);
      setSubscription(sub as Subscription | null);
      setLoading(false);
    });
  }, [user]);

  const handleAssinar = async (planId: string) => {
    if (!user) { toast.error("Faça login para continuar"); return; }
    if (planId === "free") return;

    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { userId: user.id, planId },
      });

      if (error || !data?.init_point) throw new Error(error?.message ?? "Erro ao criar pagamento");

      window.location.href = data.init_point;
    } catch (e: any) {
      toast.error("Erro ao processar: " + e.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Planos e Assinatura</h1>
        <p className="text-sm text-muted-foreground">
          Comece grátis com 5 previsões por mês. Faça upgrade para previsões ilimitadas.
        </p>
      </div>

      {/* Plano atual */}
      {subscription && subscription.plan_id !== "free" && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Plano ativo: <span className="text-primary capitalize">{subscription.plan_id}</span>
            </p>
            {subscription.current_period_end && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Renova em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          <Star className="h-5 w-5 text-primary" />
        </div>
      )}

      {/* Cards de planos */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon       = PLAN_ICONS[plan.id] ?? Zap;
            const borderCls  = PLAN_COLORS[plan.id] ?? "border-border";
            const badge      = PLAN_BADGE[plan.id];
            const isCurrent  = subscription?.plan_id === plan.id;
            const isLoading  = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card p-6 flex flex-col gap-5 transition-all ${borderCls}`}
              >
                {/* Badge */}
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      Plano atual
                    </span>
                  </div>
                )}

                {/* Cabeçalho */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground text-lg">{plan.name}</span>
                  </div>
                  {plan.price_brl === 0 ? (
                    <p className="text-3xl font-bold text-foreground">Grátis</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-3xl font-bold text-foreground">{fmt(plan.price_brl)}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {plan.predictions_limit === -1
                      ? "Previsões ilimitadas"
                      : `${plan.predictions_limit} previsões por mês`}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {(plan.features as string[]).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão */}
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano atual
                  </Button>
                ) : plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano gratuito
                  </Button>
                ) : (
                  <Button
                    className="w-full font-bold"
                    variant={plan.id === "pro" ? "default" : "outline"}
                    onClick={() => handleAssinar(plan.id)}
                    disabled={!!loadingPlan}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Assinar ${plan.name}`
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Pagamentos processados com segurança pelo Mercado Pago. Cancele quando quiser.
      </p>
    </div>
  );
}
