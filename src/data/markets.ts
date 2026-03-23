export type MarketCategory = "economia" | "politica" | "entretenimento" | "clima" | "esportes";

export interface Market {
  id: string;
  title: string;
  category: MarketCategory;
  yesPrice: number;
  noPrice: number;
  volume: number;
  resolution: string;
  endDate: string;
  history: { time: string; price: number }[];
}

const generateHistory = (currentPrice: number): { time: string; price: number }[] => {
  const points: { time: string; price: number }[] = [];
  let price = currentPrice - 15 + Math.random() * 30;
  for (let i = 30; i >= 0; i--) {
    price = Math.max(5, Math.min(95, price + (Math.random() - 0.48) * 6));
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({ time: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), price: Math.round(price) });
  }
  points[points.length - 1].price = currentPrice;
  return points;
};

export const markets: Market[] = [
  {
    id: "1",
    title: "O Fed vai aumentar os juros em maio?",
    category: "economia",
    yesPrice: 72,
    noPrice: 28,
    volume: 185420,
    resolution: "Resolve como 'Sim' se o Federal Reserve anunciar um aumento na taxa de juros na reunião de maio de 2026.",
    endDate: "2026-05-15",
    history: generateHistory(72),
  },
  {
    id: "2",
    title: "O PIB do Brasil vai crescer mais de 3% em 2026?",
    category: "economia",
    yesPrice: 45,
    noPrice: 55,
    volume: 98300,
    resolution: "Resolve como 'Sim' se o IBGE reportar crescimento do PIB acima de 3% para o ano de 2026.",
    endDate: "2027-03-01",
    history: generateHistory(45),
  },
  {
    id: "3",
    title: "Lula terá aprovação acima de 40% em junho?",
    category: "politica",
    yesPrice: 38,
    noPrice: 62,
    volume: 234100,
    resolution: "Resolve como 'Sim' se a média das pesquisas Datafolha e Ipec indicar aprovação acima de 40% em junho de 2026.",
    endDate: "2026-07-01",
    history: generateHistory(38),
  },
  {
    id: "4",
    title: "Haverá reforma tributária aprovada até dezembro?",
    category: "politica",
    yesPrice: 61,
    noPrice: 39,
    volume: 156800,
    resolution: "Resolve como 'Sim' se o Congresso Nacional aprovar a regulamentação da reforma tributária até 31/12/2026.",
    endDate: "2026-12-31",
    history: generateHistory(61),
  },
  {
    id: "5",
    title: "O Brasil vai ganhar mais de 5 ouros nas Olimpíadas de 2028?",
    category: "esportes",
    yesPrice: 33,
    noPrice: 67,
    volume: 76500,
    resolution: "Resolve como 'Sim' se o Brasil conquistar 6 ou mais medalhas de ouro nos Jogos Olímpicos de Los Angeles 2028.",
    endDate: "2028-08-15",
    history: generateHistory(33),
  },
  {
    id: "6",
    title: "Flamengo será campeão do Brasileirão 2026?",
    category: "esportes",
    yesPrice: 22,
    noPrice: 78,
    volume: 312400,
    resolution: "Resolve como 'Sim' se o Flamengo vencer o Campeonato Brasileiro Série A de 2026.",
    endDate: "2026-12-10",
    history: generateHistory(22),
  },
  {
    id: "7",
    title: "Temperatura média global vai bater recorde em 2026?",
    category: "clima",
    yesPrice: 81,
    noPrice: 19,
    volume: 54200,
    resolution: "Resolve como 'Sim' se a NASA ou NOAA confirmarem que 2026 foi o ano mais quente já registrado.",
    endDate: "2027-02-01",
    history: generateHistory(81),
  },
  {
    id: "8",
    title: "Vai ter La Niña forte no segundo semestre de 2026?",
    category: "clima",
    yesPrice: 55,
    noPrice: 45,
    volume: 32100,
    resolution: "Resolve como 'Sim' se o NOAA classificar o evento La Niña como 'forte' entre julho e dezembro de 2026.",
    endDate: "2027-01-15",
    history: generateHistory(55),
  },
  {
    id: "9",
    title: "O próximo filme da Marvel vai arrecadar mais de US$1 bi?",
    category: "entretenimento",
    yesPrice: 48,
    noPrice: 52,
    volume: 89700,
    resolution: "Resolve como 'Sim' se o próximo filme do MCU a ser lançado ultrapassar US$1 bilhão em bilheteria mundial.",
    endDate: "2026-12-31",
    history: generateHistory(48),
  },
  {
    id: "10",
    title: "BBB 27 terá mais de 100 milhões de votos na final?",
    category: "entretenimento",
    yesPrice: 64,
    noPrice: 36,
    volume: 198600,
    resolution: "Resolve como 'Sim' se a Globo reportar mais de 100 milhões de votos na final do Big Brother Brasil 27.",
    endDate: "2027-04-30",
    history: generateHistory(64),
  },
];

export const categoryLabels: Record<MarketCategory, string> = {
  economia: "Economia",
  politica: "Política",
  entretenimento: "Entretenimento",
  clima: "Clima",
  esportes: "Esportes",
};

export const categoryIcons: Record<MarketCategory, string> = {
  economia: "TrendingUp",
  politica: "Landmark",
  entretenimento: "Clapperboard",
  clima: "CloudSun",
  esportes: "Trophy",
};
