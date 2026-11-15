// KR6 (block 18:45, the data of questions.md Q80): usual material, use and colour of the 1,500 common things
// (tools/coverage.mjs) from two sources, each in a shard of its licence, under k.attributes.thing:
//  - Wikidata (CC0; sources/wikidata-thing-attributes): `made from material` (P186) and `has use` (P366) of the item
//    whose WordNet 3.1 synset id (P8814) is the sense kept; materials not for foods (WordNet's noun.food or a food of
//    k.food: their P186 values are ingredients, whose home is k.food made_of), named as the catalog names materials
//    (steel and iron are metal, textile cloth, porcelain china: MATERIAL below);
//  - Visual Genome (CC BY 4.0; sources/visual-genome): the usual colour is the modal colour attribute of the objects of
//    the sense's synset (NLTK's name: the synset's first lemma and its sense number) when the colour words of the
//    eleven basic colours are said at least MIN_MENTIONS times of that synset and the modal one holds at least MIN_SHARE.
// Only where the catalog has no value for that key (other shards than these three and things-glosses). Every value is
// checked by hand in sources/coverage/kr6-*-audit.tsv (all of them, or a seeded sample of 100); the shard publishes the
// unchecked values only when the sampled error is under 5 %, otherwise the checked right ones only (block 18:45).
//   node tools/import/attributes-data.mjs     writes docs/worlds/k.attributes/shards/things-wikidata.sop and things-visual-genome.sop
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wire, header, text, byText } from './lib.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SH = join(REPO, 'docs', 'worlds', 'k.attributes', 'shards');
export const MIN_MENTIONS = 20, MIN_SHARE = 0.5, MAX_ERROR = 0.05;
const WD = 'wikidata 2026-11-15', VG = 'visual-genome 1.4';
const OWN = new Set(['things-wikidata.sop', 'things-visual-genome.sop', 'things-glosses.sop']);
export const MATERIAL = { 'natural fiber': 'fibre', polypropylene: 'plastic', 'polyvinyl chloride': 'plastic', branch: 'wicker', steel: 'metal', 'profile steel': 'metal', iron: 'metal', 'sheet metal': 'metal', aluminium: 'metal', copper: 'metal',
  textile: 'cloth', 'cotton fabric': 'cotton', flannel: 'cloth', webbing: 'cloth', porcelain: 'china', 'borosilicate glass': 'glass', 'glass tube': 'glass', 'flight feather': 'feather', 'silk product': 'silk' };
const COLOURS = { white: 'white', black: 'black', grey: 'grey', gray: 'grey', red: 'red', orange: 'orange', yellow: 'yellow', green: 'green', blue: 'blue', purple: 'purple', pink: 'pink', brown: 'brown' };
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);

function present() { // the keys the catalog already has, by thing
  const out = new Map();
  for (const f of readdirSync(SH).filter((x) => x.endsWith('.sop') && !OWN.has(x))) for (const l of readFileSync(join(SH, f), 'utf8').split('\n')) {
    if (!l.includes(' k.attributes.thing name=')) continue;
    const n = tok(l.match(/ name=("[^"]*"|\S+)/)[1]), h = out.get(n) ?? out.set(n, new Set()).get(n);
    for (const k of ['colour', 'material', 'used_for']) if (l.includes(` ${k}=`)) h.add(k);
  }
  return out;
}
export function readAudit(name) {
  const m = new Map();
  for (const l of readFileSync(join(REPO, 'sources', 'coverage', `${name}.tsv`), 'utf8').split('\n')) { if (!l.trim() || l.startsWith('#')) continue; const [thing, value, verdict] = l.split('\t'); m.set(`${thing}\t${value}`, verdict); }
  return m;
}

export async function candidates() {
  const { run } = await import('../coverage.mjs');
  const list = run().list, have = present();
  const wn = join(REPO, 'sources', 'wordnet', 'raw', 'wordnet31');
  const data = readFileSync(join(wn, 'data.noun'), 'latin1').split('\n').filter((l) => /^\d{8} /.test(l));
  const lex = new Map(data.map((l) => [l.slice(0, 8), l.split(' ')[1]])), first = new Map(data.map((l) => [l.slice(0, 8), l.split(' ')[4].toLowerCase()]));
  const senses = new Map(readFileSync(join(wn, 'index.noun'), 'latin1').split('\n').filter((l) => l && !l.startsWith(' ')).map((l) => { const p = l.trim().split(/\s+/); return [p[0], p.filter((x) => /^\d{8}$/.test(x))]; }));
  const nltk = (off) => { const lem = first.get(off), i = (senses.get(lem) ?? []).indexOf(off); return i < 0 ? null : `${lem}.n.${String(i + 1).padStart(2, '0')}`; };
  const foodNames = new Set(readdirSync(join(REPO, 'docs', 'worlds', 'k.food', 'shards')).flatMap((f) => [...readFileSync(join(REPO, 'docs', 'worlds', 'k.food', 'shards', f), 'utf8').matchAll(/ k\.food\.food name=("[^"]*"|\S+)/g)].map((m) => tok(m[1]))));
  const bySyn = new Map();
  for (const l of readFileSync(join(REPO, 'sources', 'wikidata-thing-attributes', 'raw', 'thing-attributes.tsv'), 'utf8').split('\n').slice(1)) { const r = l.split('\t'); if (r[3] === 'P186' || r[3] === 'P366') (bySyn.get(r[0]) ?? bySyn.set(r[0], []).get(r[0])).push(r); }
  const vg = new Map();
  for (const l of readFileSync(join(REPO, 'sources', 'visual-genome', 'raw', 'object-attributes.tsv'), 'utf8').split('\n').slice(1)) { if (!l) continue; const [syn, , attr, , c] = l.split('\t'); const col = COLOURS[attr.trim().toLowerCase()]; if (!col) continue; const m = vg.get(syn) ?? vg.set(syn, new Map()).get(syn); m.set(col, (m.get(col) ?? 0) + Number(c)); }
  const out = { material: [], use: [], colour: [] };
  for (const e of list) {
    const h = have.get(e.word) ?? new Set();
    for (const r of bySyn.get(`${e.sense}-n`) ?? []) {
      if (r[3] === 'P186' && !h.has('material') && !foodNames.has(e.word) && lex.get(e.sense) !== '13') out.material.push({ thing: e.word, value: r[6], item: r[1] });
      if (r[3] === 'P366' && !h.has('used_for')) out.use.push({ thing: e.word, value: r[6], item: r[1] });
    }
    const name = nltk(e.sense), m = name && vg.get(name);
    if (m && !h.has('colour')) { const tot = [...m.values()].reduce((a, b) => a + b, 0), [top, n] = [...m].sort((a, b) => b[1] - a[1] || byText(a[0], b[0]))[0]; if (tot >= MIN_MENTIONS && n / tot >= MIN_SHARE) out.colour.push({ thing: e.word, value: top, synset: name, n, tot }); }
  }
  return out;
}

// the values a shard publishes: all when the audit's error is under MAX_ERROR, else the checked right ones
function choose(list, audit) {
  const checked = list.filter((c) => audit.has(`${c.thing}\t${c.value}`)), wrong = checked.filter((c) => audit.get(`${c.thing}\t${c.value}`) === 'wrong');
  const rate = checked.length ? wrong.length / checked.length : 1;
  const keep = list.filter((c) => (rate < MAX_ERROR ? audit.get(`${c.thing}\t${c.value}`) !== 'wrong' : audit.get(`${c.thing}\t${c.value}`) === 'right'));
  return { keep, checked: checked.length, wrong: wrong.length, all: list.length, rate };
}

export function shards(c) {
  const m = choose(c.material, readAudit('kr6-wikidata-material-audit')), u = choose(c.use, readAudit('kr6-wikidata-use-audit')), col = choose(c.colour, readAudit('kr6-visual-genome-colour-audit'));
  const pct = (x) => `${x.wrong} of ${x.checked} checked wrong (${Math.round(x.rate * 100)} %)`;
  const note = (x) => (x.rate < MAX_ERROR ? `all ${x.all} published` : `${x.keep.length} checked right published of ${x.all}`);
  const things = new Map();
  for (const v of m.keep) (things.get(v.thing) ?? things.set(v.thing, { material: new Set(), used_for: new Set() }).get(v.thing)).material.add(MATERIAL[v.value] ?? v.value);
  for (const v of u.keep) (things.get(v.thing) ?? things.set(v.thing, { material: new Set(), used_for: new Set() }).get(v.thing)).used_for.add(v.value);
  const wdLines = [...things].sort((a, b) => byText(a[0], b[0])).map(([n, t]) => wire(`k.attributes.thing.wikidata.${n.replace(/[^a-z0-9]+/gi, '_')}`, 'k.attributes.thing', [['name', n], ...[...t.material].sort(byText).map((x) => ['material', x]), ...[...t.used_for].sort(byText).map((x) => ['used_for', text(x)])], WD));
  const vgLines = col.keep.sort((a, b) => byText(a.thing, b.thing)).flatMap((v) => [`# ${v.thing}: ${v.synset}, ${v.value} ${v.n} of ${v.tot} colour mentions`, wire(`k.attributes.thing.vg.${v.thing.replace(/[^a-z0-9]+/gi, '_')}`, 'k.attributes.thing', [['name', v.thing], ['colour', v.value]], VG)]);
  return {
    'things-wikidata.sop': `${header({ id: 'k.attributes/shards/things-wikidata', about: `the usual material and the uses of common things that the catalog lacked, from Wikidata (made from material P186, has use P366) of the item of the WordNet 3.1 sense kept (P8814); materials not for foods. Hand checks (sources/coverage/kr6-wikidata-*-audit.tsv): material ${pct(m)}, ${note(m)}; use ${pct(u)}, ${note(u)}; under 5 % all would be published.`,
      sources: [`${WD} (Wikidata, CC0: thing-attributes.tsv fetched 2026-11-15, questions.md Q80)`], license: 'CC0-1.0', script: 'tools/import/attributes-data.mjs' })}\n${wdLines.join('\n')}\n`,
    'things-visual-genome.sop': `${header({ id: 'k.attributes/shards/things-visual-genome', about: `the usual colour of common things that the catalog lacked, from Visual Genome's object attributes: the modal basic colour of the sense's synset when its colour words are said at least ${MIN_MENTIONS} times and it holds at least ${MIN_SHARE * 100} % of them. Hand check (sources/coverage/kr6-visual-genome-colour-audit.tsv): ${pct(col)}, ${note(col)}. Attribution: Visual Genome (Krishna et al., 2017), CC BY 4.0.`,
      sources: [`${VG} (Visual Genome, Krishna et al. 2017, CC BY 4.0: object attributes aggregated, questions.md Q80)`], license: 'CC-BY-4.0', script: 'tools/import/attributes-data.mjs' })}\n${vgLines.join('\n')}\n`,
    stats: { material: m, use: u, colour: col },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!['sources/wikidata-thing-attributes/raw/thing-attributes.tsv', 'sources/visual-genome/raw/object-attributes.tsv'].every((f) => existsSync(join(REPO, f)))) { console.error('raw files missing: see sources/wikidata-thing-attributes/SOURCE.md and sources/visual-genome/SOURCE.md'); process.exit(1); }
  const s = shards(await candidates());
  for (const n of ['things-wikidata.sop', 'things-visual-genome.sop']) { writeFileSync(join(SH, n), s[n]); console.log(n, s[n].split('\n').filter((l) => l.startsWith('@')).length, 'wires'); }
  for (const [k, x] of Object.entries(s.stats)) console.log(k, `candidates ${x.all}, checked ${x.checked}, wrong ${x.wrong}, published ${x.keep.length}`);
}
