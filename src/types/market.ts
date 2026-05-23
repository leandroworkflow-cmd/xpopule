import {
  TrendingUp, Landmark, Clapperboard, CloudSun, Trophy,
  Swords, ShoppingBag, Waves, Music2
} from "lucide-react";

export interface DBMarket {
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

  // campos reais do banco
  nome: string | null;
  subtitulo: string | null;
  tipo_mercado: "binario" | "multiplo" | "periodo" | null;
  foto_capa: string | null;
  home_logo: string | null;
  away_logo: string | null;
  away_image_url: string | null;
  volume_home: number;
  volume_draw: number;
  volume_away: number;
  event_date: string | null;
  start_date: string | null;
  yes_prob: number | null;
}

// ── 9 categorias reais do banco ───────────────────────────────────────────────
export const categoryLabels: Record<string, string> = {
  basquete:       "Basquete",
  clima:          "Clima",
  cultura:        "Cultura",
  economia:       "Econômicas",
  esportes:       "Esportiva",
  luta:           "Lutas",
  mercado:        "Mercado",
  politica:       "Política",
  volei:          "Vôlei",
  tenis:          "Tênis",
};

export const categoryColors: Record<string, string> = {
  basquete:       "bg-orange-500/15 text-orange-400 border-orange-500/30",
  clima:          "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cultura:        "bg-purple-500/15 text-purple-400 border-purple-500/30",
  economia:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  esportes:       "bg-green-500/15 text-green-400 border-green-500/30",
  luta:           "bg-red-500/15 text-red-400 border-red-500/30",
  mercado:        "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  politica:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  volei:          "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  tenis:          "bg-lime-500/15 text-lime-400 border-lime-500/30",
};

export const categoryIcons: Record<string, typeof TrendingUp> = {
  basquete:       Trophy,
  clima:          CloudSun,
  cultura:        Music2,
  economia:       TrendingUp,
  esportes:       Trophy,
  luta:           Swords,
  mercado:        ShoppingBag,
  politica:       Landmark,
  volei:          Waves,
  tenis:          Trophy,
};
