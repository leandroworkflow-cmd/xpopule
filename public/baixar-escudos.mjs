import fetch from "node-fetch";
import fs from "fs";

const times = {
  flamengo: 127, palmeiras: 121, corinthians: 131, fluminense: 124,
  botafogo: 120, vasco: 123, internacional: 119, gremio: 1062,
  atletico_mg: 152, cruzeiro: 212, santos: 118, sao_paulo: 126,
  bahia: 122, athletico_pr: 185, coritiba: 183, fortaleza: 157,
  bragantino: 199, chapecoense: 177, criciuma: 176, vitoria: 161,
  mirassol: 3989, remo: 3998, juventude: 3984, america_mg: 160,
  goias: 129, cuiaba: 3988, atletico_go: 128, sport: 151,
  ceara: 156, avai: 178,
};

fs.mkdirSync("escudos", { recursive: true });

for (const [nome, id] of Object.entries(times)) {
  const url = `https://media.api-sports.io/football/teams/${id}.png`;
  const res = await fetch(url, { headers: { "x-apisports-key": "5fbcd8796ee08b5467555175324df4c3" } });
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(`escudos/${nome}.png`, Buffer.from(buffer));
  console.log(`✓ ${nome}`);
}
console.log("Todos os escudos baixados!");
