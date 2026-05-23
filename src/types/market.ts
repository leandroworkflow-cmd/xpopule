import { TrendingUp, Landmark, Clapperboard, CloudSun, Trophy, Bitcoin, Globe } from "lucide-react";

export interface DBMarket {
  // ── campos originais ──────────────────────────────────────────────────────
  id: string;
  external_id: string | null;
  title: string;
  category: string;
  yes_price: number;
  no_price: number;
  volume: number;
  resolution_rule: string | null;
  end_date: string;
  status: string;
  image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;

  // ── campos adicionados no schema real ────────────────────────────────────
  nome: string | null;               // título em pt-BR
  subtitulo: string | null;          // subtítulo / contexto
  tipo_mercado: "binario" | "multiplo" | "periodo" | null; // tipo de renderização
  foto_capa: string | null;          // imagem de capa alternativa

  // esportes
  home_logo: string | null;
  away_logo: string | null;
  away_image_url: string | null;
  volume_home: number;
  volume_draw: number;
  volume_away: number;
  event_date: string | null;
  start_date: string | null;

  // yes_prob herdado da query (banco guarda como yes_prob)
  yes_prob: number | null;
}

// ── labels, cores e ícones por categoria ─────────────────────────────────────
export const categoryLabels: Record<string, string> = {
  economia:       "Economia",
  politica:       "Política",
  entretenimento: "Entretenimento",
  clima:          "Clima",
  esportes:       "Esportes",
  financeiro:     "Financeiro",
  mundo:          "Mundo",
};

export const categoryColors: Record<string, string> = {
  economia:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  politica:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  entretenimento: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  clima:          "bg-amber-500/15 text-amber-400 border-amber-500/30",
  esportes:       "bg-orange-500/15 text-orange-400 border-orange-500/30",
  financeiro:     "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  mundo:          "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export const categoryIcons: Record<string, typeof TrendingUp> = {
  economia:       TrendingUp,
  politica:       Landmark,
  entretenimento: Clapperboard,
  clima:          CloudSun,
  esportes:       Trophy,
  financeiro:     Bitcoin,
  mundo:          Globe,
};
