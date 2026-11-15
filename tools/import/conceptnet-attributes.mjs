// KR6 from ConceptNet 5.7 (block "Reviewer 2026-11-15 18:45" (2); the [DATA] that arrived in psys2
// data/external/conceptnet-en/, CC BY-SA 4.0): abilities (CapableOf -> can), uses (UsedFor -> used_for), materials
// (MadeOf -> material) and properties (HasProperty -> property) of the 1,500 common things (tools/coverage.mjs), into
// k.attributes.thing, in a share-alike shard of its own (things-conceptnet, CC-BY-SA-4.0).
//   node tools/import/conceptnet-attributes.mjs [--in sources/conceptnet/raw]   writes the shard (needs the raw files)
//   node tools/import/conceptnet-attributes.mjs --candidates                    prints the candidates to check by hand
// The rule:
//   - the start of the edge is one of the 1,500 common things (spelt as in the list, underscores as spaces);
//   - can, used_for and material only for a thing the catalog has no value of that key for (the catalog's own values
//     win); property for every thing (a new key);
//   - can is an action of k.actions: the end itself, or its first word ("drop bomb" -> drop); other ends are dropped;
//   - used_for is said as the catalog says uses: a phrase that starts with a verb of w.lang.en takes the -ing form of
//     it (the library's inflectBy: "make music" -> "making music"); other phrases as they are;
//   - one value per thing, key and value (the highest weight kept); a material is one word: a checked list ("plastic and
//     metal") is written as its one-word parts, a phrase of several words ("ice cream") is left out;
//   - every relation is checked by hand on a sample (sources/conceptnet/audit.tsv: relation, thing, value, weight,
//     right / wrong, why): 100 values drawn (seeded) from those with weight >= WEIGHT (2), or, where fewer than 100 have
//     it, from all (every edge of these relations has weight >= 1, so the threshold is then 1). When fewer
//     than 5 % of the sample are wrong, every value with weight >= WEIGHT is written (but the ones checked wrong);
//     otherwise only the values checked right. The rates and the choice are in the shard's header.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wire, header, seg, byText } from './lib.mjs';
import { inflectBy } from '../sopworld/sopworld.mjs';
import { enWorld } from '../lib/lang-en.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SHARD = join(REPO, 'docs/worlds/k.attributes/shards/things-conceptnet.sop');
export const AUDIT = join(REPO, 'sources/conceptnet/audit.tsv');
export const WEIGHT = 2;
export const SAMPLE = 100;
export const RELATIONS = { CapableOf: 'can', UsedFor: 'used_for', MadeOf: 'material', HasProperty: 'property' };
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

// A deterministic draw of n items (a linear congruential generator; the same seed gives the same sample).
export function sample(items, n, seed = 18) {
  if (items.length <= n) return [...items];
  let s = seed >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n).sort((x, y) => byText(`${x.rel} ${x.thing} ${x.value}`, `${y.rel} ${y.thing} ${y.value}`));
}

export const readAudit = (text = existsSync(AUDIT) ? readFileSync(AUDIT, 'utf8') : '') => new Map(text.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => { const [rel, thing, value, weight, verdict, why] = l.split('\t'); return [`${rel}\t${thing}\t${value}`, { verdict, why }]; }));

// The catalog: things that have each key (in shards other than this one), the action names, the verbs of w.lang.en.
function catalog() {
  const dir = join(REPO, 'docs/worlds/k.attributes/shards'), has = new Map();
  // the catalog's own values, without the shards derived from WordNet by tools/attributes-abilities.mjs and
  // attributes-uses.mjs (they leave ConceptNet's facts out in turn, so neither depends on the other)
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sop') && !['things-conceptnet.sop', 'things-abilities.sop', 'things-uses.sop'].includes(x))) for (const l of readFileSync(join(dir, f), 'utf8').split('\n')) {
    const m = / k\.attributes\.thing name=("[^"]*"|\S+)/.exec(l);
    if (!m) continue;
    const n = tok(m[1]);
    if (!has.has(n)) has.set(n, new Set());
    for (const k of ['can', 'used_for', 'material']) if (l.includes(` ${k}=`)) has.get(n).add(k);
  }
  const actions = new Set();
  for (const f of readdirSync(join(REPO, 'docs/worlds/k.actions/shards'))) for (const m of readFileSync(join(REPO, 'docs/worlds/k.actions/shards', f), 'utf8').matchAll(/ k\.actions\.action name=("[^"]*"|\S+)/g)) actions.add(tok(m[1]));
  const verbs = new Set();
  const d = join(REPO, 'docs/worlds/w.lang.en/dictionary');
  for (const f of readdirSync(d)) for (const l of readFileSync(join(d, f), 'utf8').split('\n')) { const [lemma, cls] = l.split('\t'); if (cls?.startsWith('verb')) verbs.add(lemma); }
  return { has, actions, verbs };
}

let en = null;
const ing = (phrase, verbs) => {
  const [v, ...rest] = phrase.split(' ');
  if (!verbs.has(v) || /ing$/.test(v)) return phrase;
  en ??= enWorld();
  return [inflectBy(en, v, 'ing'), ...rest].join(' ');
};

// The candidates: [{ rel, key, thing, value, weight }], one per relation, thing and value.
export async function candidates(rawDir = join(REPO, 'sources/conceptnet/raw')) {
  const { run } = await import('../coverage.mjs');
  const things = new Set(run().list.map((e) => e.word));
  const { has, actions, verbs } = catalog();
  const out = new Map();
  for (const f of ['assertions-en.tsv', 'hasproperty-en.tsv']) for (const l of readFileSync(join(rawDir, f), 'utf8').split('\n').slice(1)) {
    const [rel, s, e, w] = l.split('\t');
    const key = RELATIONS[rel];
    if (!key || !s || !e) continue;
    const thing = s.replace(/_/g, ' ');
    if (!things.has(thing) || (key !== 'property' && has.get(thing)?.has(key))) continue;
    let value = e.replace(/_/g, ' ').trim().toLowerCase();
    if (key === 'can') value = actions.has(value) ? value : actions.has(value.split(' ')[0]) ? value.split(' ')[0] : null;
    else if (key === 'used_for') value = ing(value, verbs);
    if (!value || value === thing) continue;
    const id = `${rel}\t${thing}\t${value}`, weight = Number(w);
    if (!out.has(id) || out.get(id).weight < weight) out.set(id, { rel, key, thing, value, weight });
  }
  return [...out.values()].sort((a, b) => byText(`${a.rel} ${a.thing} ${a.value}`, `${b.rel} ${b.thing} ${b.value}`));
}

export function decide(cands, audit = readAudit()) {
  const per = {};
  for (const rel of Object.keys(RELATIONS)) {
    const all = cands.filter((c) => c.rel === rel);
    const threshold = all.filter((c) => c.weight >= WEIGHT).length >= SAMPLE ? WEIGHT : 1;
    const heavy = all.filter((c) => c.weight >= threshold);
    const drawn = sample(heavy, SAMPLE);
    const checked = drawn.map((c) => ({ ...c, verdict: audit.get(`${rel}\t${c.thing}\t${c.value}`)?.verdict }));
    const wrong = checked.filter((c) => c.verdict === 'wrong').length;
    const unchecked = checked.filter((c) => !c.verdict);
    const rate = checked.length ? wrong / checked.length : 1;
    const open = rate < 0.05 && !unchecked.length;
    const verdictOf = (c) => audit.get(`${rel}\t${c.thing}\t${c.value}`)?.verdict;
    const written = (open ? heavy : all).filter((c) => (open ? verdictOf(c) !== 'wrong' : verdictOf(c) === 'right'));
    per[rel] = { threshold, all: all.length, heavy: heavy.length, sampled: checked.length, wrong, rate, open, unchecked, written };
  }
  return per;
}

export function shardText(per) {
  const by = new Map();
  for (const rel of Object.keys(RELATIONS)) for (const c of per[rel].written) {
    if (!by.has(c.thing)) by.set(c.thing, []);
    // a material is one word (an atom of k.attributes): a list ("plastic and metal") gives its one-word parts
    const values = c.key === 'material' ? c.value.split(/,| and /).map((x) => x.trim()).filter((x) => x && !x.includes(' ')) : [c.value];
    for (const v of values) if (!by.get(c.thing).some(([k, x]) => k === c.key && (x.string ?? x) === v)) by.get(c.thing).push([c.key, c.key === 'can' || c.key === 'material' ? v : { string: v }]);
  }
  const order = Object.values(RELATIONS);
  const lines = [...by].sort((a, b) => byText(a[0], b[0])).map(([n, kv]) => wire(`k.attributes.thing.conceptnet.${seg(n)}`, 'k.attributes.thing',
    [['name', n], ...kv.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || byText(String(a[1].string ?? a[1]), String(b[1].string ?? b[1])))], 'conceptnet 5.7'));
  const said = Object.entries(RELATIONS).map(([rel, key]) => { const p = per[rel]; return `${rel} -> ${key}: ${p.written.length} written of ${p.all} candidates (${p.heavy} with weight >= ${p.threshold}); hand check of ${p.sampled} drawn from those: ${p.wrong} wrong (${(100 * p.rate).toFixed(1)} %), so ${p.open ? `every value with weight >= ${p.threshold} but the ones checked wrong` : 'only the values checked right'}`; }).join('; ');
  return `${header({ id: 'k.attributes/shards/things-conceptnet', about: `abilities, uses, materials and properties of the 1,500 common things from ConceptNet 5.7 (KR6; the rule in tools/import/conceptnet-attributes.mjs). ${said}`,
    sources: ['conceptnet 5.7 (ConceptNet 5 (conceptnet.io), derived in part from Open Mind Common Sense, Wiktionary, WordNet and other sources; CC BY-SA 4.0; English edges of CapableOf, UsedFor, MadeOf, HasProperty)'],
    license: 'CC-BY-SA-4.0', script: 'tools/import/conceptnet-attributes.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--in');
  const cands = await candidates(i < 0 ? undefined : process.argv[i + 1]);
  const per = decide(cands);
  if (process.argv.includes('--candidates')) {
    for (const rel of Object.keys(RELATIONS)) for (const c of per[rel].unchecked) console.log(`${c.rel}\t${c.thing}\t${c.value}\t${c.weight}`);
    process.exit(0);
  }
  const missing = Object.values(per).flatMap((p) => p.unchecked);
  if (missing.length) { console.error(`${missing.length} sampled values are not checked yet: --candidates lists them; write them into ${AUDIT}`); process.exit(1); }
  writeFileSync(SHARD, shardText(per));
  for (const [rel, p] of Object.entries(per)) console.log(`${rel}: ${p.written.length} written; sample ${p.sampled}, ${p.wrong} wrong; ${p.open ? 'open' : 'checked only'}`);
}
