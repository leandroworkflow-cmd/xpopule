-- Tabela de apostas (modelo parimutuel)
CREATE TABLE IF NOT EXISTS public.apostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mercado_id TEXT NOT NULL,
  posicao_id UUID REFERENCES public.posicoes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('time_casa', 'empate', 'time_fora')),
  quantidade INTEGER NOT NULL DEFAULT 0,
  preco_unitario NUMERIC(10,4) NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'vencedora', 'perdedora', 'cancelada')),
  payout NUMERIC(12,2),
  mp_payment_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.apostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own apostas" ON public.apostas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage apostas" ON public.apostas
  FOR ALL USING (true);

CREATE TRIGGER update_apostas_updated_at
  BEFORE UPDATE ON public.apostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
