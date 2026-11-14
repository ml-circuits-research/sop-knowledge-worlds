// Other names of the countries and cities of k.geo, from WordNet (reviewer block 2026-11-14 07:40 item 3: `core.word`
// aliases, "Peking"). A join, not a list: for each country and city of k.geo whose name is a word of k.words with a
// noun sense that is that place (a city: its sense lies in the city's country, `part_of`; a country: its sense is a
// kind of country or nation), the other names of that sense (`synonym`) that are proper names become `core.word`
// facts of the place. A synonym that is a description ("capital of Red China", "Austrian capital"), or the name of
// another place of k.geo, is left out; so is a sense one of whose other names is another place of k.geo (Congo:
// Zaire is the other Congo) or that is about a former state (Russia: the USSR). The facts keep WordNet's licence, so they go into a shard of their own.
// Deterministic; `npm run build` runs it, and a test checks that the shard is fresh.
//   node tools/geo-aliases.mjs           writes docs/worlds/k.geo/shards/aliases.sop
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { scanWorlds, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, byText } from './import/lib.mjs';

const SRC = 'wordnet 3.1';
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => vals(w, k)[0];
// Words that may stand in lower case inside a proper name (Federal Republic of Germany, Bosnia and Herzegovina).
const LINK = new Set(['of', 'the', 'and', 'de', 'del', 'la', 'le', 'du', 'da', 'do', 'des', 'el', 'al', 'y']);
export const properName = (t) => /^\p{Lu}/u.test(t) && t.split(/[\s-]+/).every((x) => /^\p{Lu}/u.test(x) || /^\d/.test(x) || LINK.has(x));
const COUNTRY = /\b(country|nation)\b/;
// A sense about a state that no longer exists ("a former communist country", the USSR under Russia) is not the place.
const FORMER = /^(a |an |the )?former\b/;

export function aliasRows(worlds = scanWorlds()) {
  const geo = worlds.find((w) => w.id === 'k.geo').shards.filter((s) => !s.id.endsWith('/aliases')).flatMap((s) => parse(s.text));
  const countries = geo.filter((w) => w.type === 'k.geo.country');
  const cities = geo.filter((w) => w.type === 'k.geo.city');
  // every name a place of k.geo has (any type), and the other names a country already has
  const placeNames = new Set(geo.filter((w) => w.type.startsWith('k.geo.') && w.attrs.name).map((w) => one(w, 'name')));
  const words = new Map(); // `${of}|${means}` -> texts already said
  for (const w of geo.filter((x) => x.type === 'core.word')) {
    const k = `${one(w, 'of')}|${one(w, 'means')}`;
    words.set(k, new Set([...(words.get(k) ?? []), ...vals(w, 'text')]));
  }
  const countryWords = (name) => new Set([name, ...(words.get(`k.geo.country.name|${name}`) ?? [])]);
  const senses = new Map(); // word -> noun senses
  for (const s of worlds.find((w) => w.id === 'k.words').shards) for (const w of parse(s.text)) {
    if (w.type !== 'k.words.sense' || one(w, 'pos') !== 'noun') continue;
    const k = one(w, 'word');
    senses.set(k, [...(senses.get(k) ?? []), w]);
  }
  const rows = [];
  // a sense one of whose other names is the name of another place of k.geo is that place (Congo: Zaire)
  const fits = (name, sense) => !FORMER.test(one(sense, 'gloss') ?? '') && !vals(sense, 'synonym').some((t) => t !== name && placeNames.has(t));
  const add = (of, name, sense) => {
    const said = words.get(`${of}|${name}`) ?? new Set();
    const texts = vals(sense, 'synonym').filter((t) => t !== name && properName(t) && !placeNames.has(t) && !said.has(t)).sort(byText);
    if (texts.length) rows.push({ of, name, texts, sense: `${one(sense, 'word')} noun ${one(sense, 'n')}` });
  };
  const seen = new Set();
  for (const c of countries) {
    const name = one(c, 'name');
    if (seen.has(`c|${name}`)) continue;
    seen.add(`c|${name}`);
    const s = (senses.get(name) ?? []).find((w) => fits(name, w) && [...vals(w, 'kind_of'), ...vals(w, 'instance_of')].some((k) => COUNTRY.test(k)));
    if (s) add('k.geo.country.name', name, s);
  }
  for (const c of cities) {
    const name = one(c, 'name');
    if (seen.has(`t|${name}`) || placeNames.has(name) && countries.some((x) => one(x, 'name') === name)) continue;
    const inCountry = countryWords(one(c, 'country'));
    const s = (senses.get(name) ?? []).find((w) => fits(name, w) && vals(w, 'part_of').some((p) => inCountry.has(p)));
    if (!s) continue;
    seen.add(`t|${name}`);
    add('k.geo.city.name', name, s);
  }
  return rows.sort((a, b) => byText(a.of, b.of) || byText(a.name, b.name));
}

export function aliasesShard(rows = aliasRows()) {
  const lines = rows.map((r) => `# ${r.name}: the sense ${r.sense}\n${wire(`k.geo.word.alias.${r.of === 'k.geo.city.name' ? 'city' : 'country'}.${seg(r.name)}`, 'core.word', [...r.texts.map((t) => ['text', t]), ['means', /\s/.test(r.name) ? text(r.name) : r.name], ['of', r.of]], SRC)}`);
  return `${header({ id: 'k.geo/shards/aliases', about: `other names of ${rows.filter((r) => r.of === 'k.geo.country.name').length} countries and ${rows.filter((r) => r.of === 'k.geo.city.name').length} cities (Peking for Beijing, Bombay for Mumbai), the synonyms of their WordNet sense that are proper names`,
    sources: [`${SRC} (Princeton WordNet 3.1, through k.words: the synonyms of the sense of the place's name)`], license: 'WordNet-3.0', script: 'tools/geo-aliases.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = aliasRows();
  const out = aliasesShard(rows);
  writeFileSync(join(WORLDS_DIR, 'k.geo', 'shards', 'aliases.sop'), out);
  console.log(`aliases.sop: ${rows.length} places, ${rows.reduce((n, r) => n + r.texts.length, 0)} other names, ${Buffer.byteLength(out)} bytes`);
}
