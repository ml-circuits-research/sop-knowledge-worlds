// The approximate numbers of k.geo that no imported source gives (Round 9 item 3): the length of well-known rivers,
// the area of the oceans, of well-known seas and deserts and of the continents, as usually given; written by a
// language model, only where sure (named=model). Each fact names a thing that the Natural Earth shards have (the
// tool checks it), so the facts of one thing merge when both shards are told.
//   node tools/geo-numbers.mjs     writes docs/worlds/k.geo/shards/numbers.sop
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
// [name, continent, kilometres]
export const RIVERS = [
  ['Nile', 'Africa', 6650], ['Congo', 'Africa', 4700], ['Niger', 'Africa', 4180], ['Zambezi', 'Africa', 2570], ['Orange', 'Africa', 2200], ['Limpopo', 'Africa', 1750],
  ['Yangtze', 'Asia', 6300], ['Huang', 'Asia', 5460], ['Mekong', 'Asia', 4350], ['Indus', 'Asia', 3180], ['Ganges', 'Asia', 2520], ['Euphrates', 'Asia', 2800], ['Tigris', 'Asia', 1900], ['Ural', 'Asia', 2430], ['Jordan', 'Asia', 251],
  ['Volga', 'Europe', 3530], ['Danube', 'Europe', 2850], ['Dnieper', 'Europe', 2200], ['Don', 'Europe', 1870], ['Dniester', 'Europe', 1360], ['Rhine', 'Europe', 1230], ['Elbe', 'Europe', 1090], ['Vistula', 'Europe', 1050], ['Loire', 'Europe', 1010], ['Tagus', 'Europe', 1010],
  ['Oder', 'Europe', 854], ['Rhône', 'Europe', 813], ['Seine', 'Europe', 777], ['Po', 'Europe', 652], ['Tiber', 'Europe', 406], ['Shannon', 'Europe', 360], ['Severn', 'Europe', 354], ['Thames', 'Europe', 346],
  ['Lena', 'Europe', 4400], ['Ob', 'Europe', 3650], ['Amur', 'Europe', 2820], ['Kolyma', 'Europe', 2130],
  ['Mississippi', 'North America', 3730], ['Missouri', 'North America', 3770], ['Yukon', 'North America', 3190], ['Rio Grande', 'North America', 3050], ['Arkansas', 'North America', 2360], ['Colorado', 'North America', 2330],
  ['Columbia', 'North America', 2000], ['Mackenzie', 'North America', 1740], ['Snake', 'North America', 1740], ['Ohio', 'North America', 1580], ['St. Lawrence', 'North America', 1200],
  ['Amazonas', 'South America', 6400], ['Paraná', 'South America', 4880], ['Tocantins', 'South America', 2450], ['Orinoco', 'South America', 2140],
  ['Murray', 'Oceania', 2510], ['Darling', 'Oceania', 1470],
];
// [name, square kilometres]
export const SEAS = [
  ['Pacific Ocean', 165000000], ['Atlantic Ocean', 106000000], ['Indian Ocean', 70600000], ['Southern Ocean', 20300000], ['Arctic Ocean', 14100000],
  ['Coral Sea', 4790000], ['Arabian Sea', 3860000], ['South China Sea', 3500000], ['Caribbean Sea', 2750000], ['Mediterranean Sea', 2500000], ['Bering Sea', 2000000], ['Gulf of Mexico', 1600000], ['Sea of Okhotsk', 1580000],
  ['Barents Sea', 1400000], ['Hudson Bay', 1230000], ['Sea of Japan', 978000], ['North Sea', 570000], ['Red Sea', 438000], ['Black Sea', 436000], ['Baltic Sea', 377000], ['Caspian Sea', 371000], ['Persian Gulf', 251000],
];
export const DESERTS = [
  ['Sahara', 9200000], ['Gobi Desert', 1300000], ['Kalahari Desert', 900000], ["Rub' al Khali", 650000], ['Syrian Desert', 500000], ['Karakum Desert', 350000], ['Great Victoria Desert', 350000], ['Taklamakan', 337000], ['Kyzyl Kum', 300000],
  ['Great Sandy Desert', 285000], ['Sonoran Desert', 260000], ['Thar Desert', 200000], ['Simpson Desert', 176000], ['Gibson Desert', 156000], ['Atacama Desert', 105000], ['Namib', 81000], ['Negev', 13000],
];
export const CONTINENTS = [['Asia', 44600000], ['Africa', 30400000], ['North America', 24700000], ['South America', 17800000], ['Antarctica', 14200000], ['Europe', 10200000], ['Oceania', 8500000]];
// Other names: [text, the name it means, the key it names]
export const WORDS = [['Amazon', 'Amazonas', 'k.geo.river.name'], ['Yellow River', 'Huang', 'k.geo.river.name'], ['Huang He', 'Huang', 'k.geo.river.name'], ['Empty Quarter', "Rub' al Khali", 'k.geo.desert.name'], ['Gobi', 'Gobi Desert', 'k.geo.desert.name'], ['Kalahari', 'Kalahari Desert', 'k.geo.desert.name'],
  ['Atacama', 'Atacama Desert', 'k.geo.desert.name'], ['Sahara Desert', 'Sahara', 'k.geo.desert.name'], ['Namib Desert', 'Namib', 'k.geo.desert.name'], ['Pacific', 'Pacific Ocean', 'k.geo.sea.name'], ['Atlantic', 'Atlantic Ocean', 'k.geo.sea.name'], ['Mediterranean', 'Mediterranean Sea', 'k.geo.sea.name']];

// The names of a type in the imported shards: `${name}` or `${name}\t${continent}` for rivers.
export function imported() {
  const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
  const have = { river: new Set(), sea: new Set(), desert: new Set(), continent: new Set() };
  for (const s of scanWorlds().find((w) => w.id === 'k.geo').shards) {
    if (s.id.endsWith('/numbers')) continue;
    for (const line of s.text.split('\n')) {
      const m = /^@\S+ k\.geo\.(river|sea|desert|continent) name=("[^"]*"|\S+)(?: continent=("[^"]*"|\S+))?/.exec(line);
      if (m) have[m[1]].add(m[1] === 'river' ? `${tok(m[2])}\t${tok(m[3])}` : tok(m[2]));
    }
  }
  return have;
}

export function numbersShard(have = imported()) {
  const need = (type, key) => { if (!have[type].has(key)) throw new Error(`geo-numbers: no k.geo.${type} ${key.replace('\t', ' in ')} in the imported shards`); };
  const lines = [];
  lines.push('# The length of rivers, in kilometres.');
  for (const [name, continent, km] of RIVERS) { need('river', `${name}\t${continent}`); lines.push(wire(`k.geo.numbers.river.${seg(name)}`, 'k.geo.river', [['name', name], ['continent', continent], ['length_about', km], ['named', 'model']], SRC)); }
  lines.push('', '# The area of oceans and seas, in square kilometres.');
  for (const [name, km2] of SEAS) { need('sea', name); lines.push(wire(`k.geo.numbers.sea.${seg(name)}`, 'k.geo.sea', [['name', name], ['area_about', km2], ['named', 'model']], SRC)); }
  lines.push('', '# The area of deserts, in square kilometres.');
  for (const [name, km2] of DESERTS) { need('desert', name); lines.push(wire(`k.geo.numbers.desert.${seg(name)}`, 'k.geo.desert', [['name', name], ['area_about', km2], ['named', 'model']], SRC)); }
  lines.push('', '# The area of the continents, in square kilometres.');
  for (const [name, km2] of CONTINENTS) { need('continent', name); lines.push(wire(`k.geo.numbers.continent.${seg(name)}`, 'k.geo.continent', [['name', name], ['area_about', km2], ['named', 'model']], SRC)); }
  lines.push('', '# Words: other names.');
  for (const [text, means, of] of WORDS) { need(of.split('.')[2], of.endsWith('river.name') ? [...have.river].find((k) => k.startsWith(`${means}\t`)) ?? means : means); lines.push(wire(`k.geo.numbers.word.${seg(text)}`, 'core.word', [['text', text], ['means', means], ['of', of]], SRC)); }
  return `${header({ id: 'k.geo/shards/numbers', about: `approximate numbers as usually given: the length of ${RIVERS.length} well-known rivers in kilometres; the area of the 5 oceans, of ${SEAS.length - 5} seas, of ${DESERTS.length} deserts and of the 7 continents in square kilometres; ${WORDS.length} other names. Written by a language model, only where sure (named=model). Tell it with the shards of the continents and the shard seas: the facts of one thing merge.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/geo-numbers.mjs)'], license: 'CC0-1.0', script: 'tools/geo-numbers.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = numbersShard();
  writeShards(join(WORLDS_DIR, 'k.geo', 'shards'), { 'numbers.sop': text }, 'numbers');
  console.log(`numbers.sop: ${text.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(text)} bytes`);
}
