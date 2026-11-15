// KR6, what a thing is for (block "Reviewer 2026-11-15 18:10" (2)): `k.attributes.thing used_for` for the catalog things
// that do nothing by themselves (`canApplies` false: a bed, a road, a box, a key, a wall) and have no use yet, by the
// method of tools/attributes-abilities.mjs, from what the data here already says:
//   1. the instrument role of k.actions: a thing named as `tool` of an everyday action is for doing it (a bed is the
//      tool of sleep: sleeping; a spoon of eat: eating);
//   2. not the object role of k.actions: what an action is done to is rarely what the thing is for (an apple is
//      peeled, bitten, taken; a wall painted, touched); of 112 such values checked by hand 104 were wrong, so the role
//      is not read (the checked values stay in the audit);
//   3. inherited: a thing whose first noun sense in WordNet lies under a kind the catalog gives a use (k.attributes
//      used_for) has it too (a cottage is a house: living), with the guards of the abilities: the nearest kind that says
//      anything, the same WordNet sense as the kind's own, no wide kind, no k.food name whose first sense is no food,
//      no name with senses in two domains;
//   4. the use is said as the catalog says uses, the -ing form of the action's verb (the library's inflectBy on
//      w.lang.en: sleep -> sleeping), with its particle (put on -> putting on);
//   5. every value is checked by hand in sources/coverage/uses-audit.tsv; only the right ones are written, and a value
//      not in the audit stops the tool.
//   node tools/attributes-uses.mjs     writes docs/worlds/k.attributes/shards/things-uses.sop
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, factsOf } from './lib/worlds.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';
import { firstNounSenses } from './sensitive-core.mjs';
import { canApplies, WIDE } from './attributes-abilities.mjs';
import { inflectBy } from './sopworld/sopworld.mjs';
import { enWorld } from './lib/lang-en.mjs';

export const SHARD = join(WORLDS_DIR, 'k.attributes', 'shards', 'things-uses.sop');
export const AUDIT = join(REPO, 'sources', 'coverage', 'uses-audit.tsv');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const DOMAINS = { 'noun.food': 'food', 'noun.plant': 'plant', 'noun.animal': 'animal', 'noun.artifact': 'artifact' };
export const readAudit = (text = readFileSync(AUDIT, 'utf8')) => new Map(text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [thing, use, verdict, why] = l.split('\t'); return [`${thing}\t${use}`, { verdict, why }]; }));

let en = null;
export const gerund = (verb) => { en ??= enWorld(); const [v, ...rest] = verb.split(' '); return [inflectBy(en, v, 'ing'), ...rest].join(' '); };

export function proposals(worlds = scanWorlds()) {
  const senses = firstNounSenses(worlds), acts = canApplies(worlds);
  const domains = new Map();
  for (const w of factsOf('k.words', 'k.words.sense', worlds)) if (w.attrs.pos?.[0] === 'noun' && DOMAINS[w.attrs.supersense?.[0]]) {
    const n = tok(w.attrs.word[0]);
    if (!domains.has(n)) domains.set(n, new Set());
    domains.get(n).add(DOMAINS[w.attrs.supersense[0]]);
  }
  const role = new Map(), add = (w, use, via) => { if (!role.has(w)) role.set(w, new Map()); if (!role.get(w).has(use)) role.get(w).set(use, via); };
  for (const a of factsOf('k.actions', 'k.actions.action', worlds)) {
    const use = gerund(tok(a.attrs.name[0]));
    for (const t of (a.attrs.tool ?? []).map(tok)) add(t, use, 'tool');
  }
  const kindUses = new Map(), has = new Set();
  for (const t of factsOf('k.attributes', 'k.attributes.thing', worlds)) {
    if (/^k\.attributes\.thing\.(uses|conceptnet|wikidata|vg)\./.test(t.id)) continue; // this tool's own facts; the imported ones (ConceptNet, Wikidata, Visual Genome: tools/import/*-attributes.mjs, attributes-data.mjs) are not the catalog's own and must not seed a WordNet-licensed shard, so neither depends on the other
    const n = tok(t.attrs.name[0]);
    if (t.attrs.used_for) { has.add(n); if (!kindUses.has(n)) kindUses.set(n, new Set()); for (const u of t.attrs.used_for.map(tok)) kindUses.get(n).add(u); }
  }
  const names = new Set(), foods = new Set(factsOf('k.food', 'k.food.food', worlds).map((f) => tok(f.attrs.name[0])));
  for (const [world, type] of [['k.objects', 'k.objects.object'], ['k.scenes', 'k.scenes.thing'], ['k.attributes', 'k.attributes.thing'], ['k.food', 'k.food.food']]) for (const f of factsOf(world, type, worlds)) names.add(tok(f.attrs.name[0]));
  const out = [];
  for (const n of [...names].sort(byText)) {
    if (has.has(n) || WIDE.has(n) || acts(n)) continue;
    if (role.has(n)) { for (const [use, via] of role.get(n)) out.push({ name: n, use, via }); continue; }
    const s = senses.get(n);
    if (!s || (foods.has(n) && s.supersense !== 'noun.food') || (domains.get(n)?.size ?? 0) > 1) continue;
    for (let i = 0; i < s.kind_of.length; i++) {
      const k = s.kind_of[i];
      if (WIDE.has(k) || !kindUses.has(k)) continue;
      if (JSON.stringify(senses.get(k)?.kind_of) !== JSON.stringify(s.kind_of.slice(i + 1))) continue;
      for (const use of kindUses.get(k)) out.push({ name: n, use, via: k });
      break;
    }
  }
  return out;
}

export function derive(worlds = scanWorlds(), audit = readAudit()) {
  const props = proposals(worlds);
  const verdict = (p) => audit.get(`${p.name}\t${p.use}`)?.verdict;
  return { props, right: props.filter((p) => verdict(p) === 'right'), wrong: props.filter((p) => verdict(p) === 'wrong'), unaudited: props.filter((p) => !verdict(p)) };
}

export function shardText({ props, right, wrong }) {
  const by = new Map();
  for (const p of right) { if (!by.has(p.name)) by.set(p.name, { via: new Set(), uses: [] }); by.get(p.name).via.add(p.via); by.get(p.name).uses.push(p.use); }
  const said = (v) => (v === 'tool' ? 'the instrument of these actions in k.actions' : v === 'object' ? 'what these actions of k.actions use' : `a kind of ${v} (WordNet)`);
  const lines = [...by].map(([n, { via, uses }]) => [`# ${n}: ${[...via].map(said).join('; ')}`,
    wire(`k.attributes.thing.uses.${seg(n)}`, 'k.attributes.thing', [['name', n], ...uses.sort(byText).map((u) => ['used_for', { string: u }])], 'wordnet 3.1')]).flat();
  const rate = props.length ? `${wrong.length} of ${props.length} proposed (${(100 * wrong.length / props.length).toFixed(1)} %) were wrong by the hand check and are not written` : 'none proposed';
  return `${header({ id: 'k.attributes/shards/things-uses', about: `what ${by.size} common things of the catalog that do nothing by themselves and had no use are for (${right.length} values; ${rate}): the instrument role of k.actions, and uses inherited down WordNet's hypernyms from the kinds the catalog describes (KR6; the rule in tools/attributes-uses.mjs)`,
    sources: ['wordnet 3.1 (the hypernym chains of the first noun senses, as imported in k.words; the uses they carry down are the catalog\'s own: k.attributes, k.actions; hand-checked in sources/coverage/uses-audit.tsv)'],
    license: 'WordNet-3.0', script: 'tools/attributes-uses.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const d = derive();
  if (d.unaudited.length) { console.error(`not in the audit (check them by hand in ${AUDIT}):\n${d.unaudited.map((p) => `${p.name}\t${p.use}\t\t${p.via}`).join('\n')}`); process.exit(1); }
  writeFileSync(SHARD, shardText(d));
  console.log(`things-uses.sop: ${new Set(d.right.map((p) => p.name)).size} things, ${d.right.length} values; ${d.wrong.length} of ${d.props.length} wrong`);
}
