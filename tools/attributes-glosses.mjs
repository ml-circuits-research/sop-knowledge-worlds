// KR6 (block 15:35): the usual colour, material and abilities of the common things (tools/coverage.mjs, the 1,500)
// that the catalog lacks, read from the WordNet gloss of the sense kept, by three rules:
//  - colour: a basic colour word (k.values.colour.basic; gray read as grey, "-coloured" and "-ish" endings dropped)
//    in the head noun phrase of the gloss (the words before the first relative word or preposition): "sweet fleshy
//    red fruit" (strawberry: red);
//  - material: a material word of MATERIALS (normalised to the material names the catalog already uses: steel and
//    iron are metal, fabric and canvas cloth, porcelain china) in the head noun phrase, or after "made of", "made
//    from", "consisting of", "constructed of"...: "a glass or plastic vessel" (bottle);
//  - can: the verb of a relative clause on the thing ("a machine that cuts grain": cut), or after "capable of" or
//    "able to", when it is an action of k.actions; not after a preposition ("through which water can pass"), not
//    a generic verb (make, give, have, get, do, go, take, come).
// Every value the rules propose is checked by hand in sources/coverage/kr6-audit.tsv (right or wrong, with why);
// only the right ones are published, and a value the audit has not seen stops the tool. A value is proposed only
// where the catalog has none for that thing and key. The facts keep WordNet's licence (shard things-glosses).
//   node tools/attributes-glosses.mjs        writes docs/worlds/k.attributes/shards/things-glosses.sop
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, byText } from './import/lib.mjs';

export const SHARD = join(WORLDS_DIR, 'k.attributes', 'shards', 'things-glosses.sop');
export const AUDIT = join(REPO, 'sources', 'coverage', 'kr6-audit.tsv');
const SRC = 'wordnet 3.1';
const COLOURS = new Set(['black', 'white', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown']);
export const MATERIALS = { wood: 'wood', wooden: 'wood', timber: 'wood', metal: 'metal', metallic: 'metal', steel: 'metal', iron: 'metal', aluminum: 'metal', aluminium: 'metal', tin: 'metal', brass: 'metal', bronze: 'metal', copper: 'metal',
  glass: 'glass', plastic: 'plastic', paper: 'paper', cardboard: 'cardboard', cloth: 'cloth', fabric: 'cloth', textile: 'cloth', canvas: 'cloth', cotton: 'cotton', wool: 'wool', woolen: 'wool', woollen: 'wool', silk: 'silk',
  leather: 'leather', rubber: 'rubber', stone: 'stone', brick: 'brick', concrete: 'concrete', clay: 'clay', ceramic: 'china', porcelain: 'china', china: 'china', gold: 'gold', silver: 'silver', wax: 'wax', ice: 'ice',
  straw: 'straw', wicker: 'wicker', bamboo: 'bamboo', nylon: 'nylon', sand: 'sand' };
const GENERIC = new Set(['make', 'give', 'have', 'get', 'do', 'go', 'take', 'come']);
const HEAD_END = /^(that|which|who|used|with|for|of|in|on|to|from|by|having|consisting|containing|where|when|as|especially|usually|typically|resembling|like)$/;
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);

// the k.attributes.thing keys the catalog already has, by thing (other shards than this one)
function present() {
  const d = join(WORLDS_DIR, 'k.attributes', 'shards'), out = new Map();
  for (const f of readdirSync(d).filter((x) => x.endsWith('.sop') && x !== 'things-glosses.sop')) for (const l of readFileSync(join(d, f), 'utf8').split('\n')) {
    if (!l.includes(' k.attributes.thing name=')) continue;
    const n = tok(l.match(/ name=("[^"]*"|\S+)/)[1]), h = out.get(n) ?? out.set(n, new Set()).get(n);
    for (const k of ['colour', 'material', 'can']) if (l.includes(` ${k}=`)) h.add(k);
  }
  return out;
}
const actionNames = () => new Set(readdirSync(join(WORLDS_DIR, 'k.actions', 'shards')).filter((f) => f.endsWith('.sop'))
  .flatMap((f) => [...readFileSync(join(WORLDS_DIR, 'k.actions', 'shards', f), 'utf8').matchAll(/ k\.actions\.action name=("[^"]*"|\S+)/g)].map((m) => tok(m[1]))));

// The values one gloss gives: { colour: [], material: [], can: [] }.
export function fromGloss(gloss, actions) {
  const g = gloss.toLowerCase(), words = g.split(/[\s;,()]+/).filter(Boolean), np = [];
  for (const w of words) { if (np.length && HEAD_END.test(w)) break; np.push(w); }
  const colour = [...new Set(np.map((w) => w.replace(/-colou?red$|ish$/, '')).map((w) => (w === 'gray' ? 'grey' : w)).filter((w) => COLOURS.has(w)))];
  const made = [...g.matchAll(/\b(?:made|consisting|composed|constructed|built|formed) (?:mainly |mostly |usually |chiefly |typically )?(?:of|from) (?:a |an |the )?(\w+)(?: or (\w+))?/g)].flatMap((m) => [m[1], m[2]]);
  const material = [...new Set([...made, ...np].filter((w) => w && MATERIALS[w]).map((w) => MATERIALS[w]))];
  const verbs = [...g.matchAll(/(?<!\b(?:through|in|on|at|by|with|from|to|into|under|over|for|of) )\b(?:that|which|who) (?:can |usually |typically |normally )?(\w+?)(?:es|s)\b(?! (?:of|as)\b)/g), ...g.matchAll(/\bcapable of (\w+?)ing\b/g), ...g.matchAll(/\bable to (\w+)\b/g)].map((m) => m[1]);
  const can = [...new Set(verbs.filter((v) => !GENERIC.has(v)).map((v) => (actions.has(v) ? v : actions.has(`${v}e`) ? `${v}e` : null)).filter(Boolean))];
  return { colour, material, can };
}

export function readAudit(text = readFileSync(AUDIT, 'utf8')) {
  const m = new Map();
  for (const l of text.split('\n')) { if (!l.trim() || l.startsWith('#')) continue; const [thing, key, value, verdict, why] = l.split('\t'); m.set(`${thing}\t${key}\t${value}`, { verdict, why }); }
  return m;
}

export async function derive() {
  const { run } = await import('./coverage.mjs');
  const have = present(), actions = actionNames(), audit = readAudit();
  const facts = [], unaudited = [], counts = { colour: [0, 0], material: [0, 0], can: [0, 0] }; // [proposed, wrong]
  for (const e of run().list) {
    const v = fromGloss(e.gloss, actions), keep = [];
    for (const k of ['colour', 'material', 'can']) {
      if (have.get(e.word)?.has(k)) continue;
      for (const x of v[k]) {
        const a = audit.get(`${e.word}\t${k}\t${x}`);
        if (!a) { unaudited.push(`${e.word} ${k} ${x}`); continue; }
        counts[k][0]++;
        if (a.verdict === 'wrong') { counts[k][1]++; continue; }
        keep.push([k, x]);
      }
    }
    if (keep.length) facts.push({ name: e.word, gloss: e.gloss, keep });
  }
  return { facts: facts.sort((a, b) => byText(a.name, b.name)), unaudited, counts };
}

export function shardText({ facts, counts }) {
  const lines = facts.flatMap((f) => [`# ${f.name}: ${f.gloss}`, wire(`k.attributes.thing.glosses.${f.name.replace(/[^a-z0-9]+/gi, '_')}`, 'k.attributes.thing', [['name', f.name], ...f.keep], SRC)]);
  const n = (k) => facts.filter((f) => f.keep.some(([x]) => x === k)).length;
  const rate = (k) => `${counts[k][1]} of ${counts[k][0]} wrong`;
  return `${header({ id: 'k.attributes/shards/things-glosses', about: `the usual colour (${n('colour')} things), material (${n('material')}) and abilities (${n('can')}) of common things that the catalog lacked, read from the WordNet gloss of the sense kept by the rules of tools/attributes-glosses.mjs (KR6); every proposed value checked by hand (sources/coverage/kr6-audit.tsv: colour ${rate('colour')}, material ${rate('material')}, can ${rate('can')}); only the right ones are here.`,
    sources: ['wordnet 3.1 (Princeton WordNet 3.1: the glosses of the senses kept by tools/coverage.mjs)'], license: 'WordNet-3.0', script: 'tools/attributes-glosses.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const d = await derive();
  if (d.unaudited.length) { console.error(`not in the audit (check them by hand in ${AUDIT}):\n${d.unaudited.join('\n')}`); process.exit(1); }
  writeFileSync(SHARD, shardText(d));
  console.log(`things-glosses.sop: ${d.facts.length} things; proposed and wrong: ${JSON.stringify(d.counts)}`);
}
