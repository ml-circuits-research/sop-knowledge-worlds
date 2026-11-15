// KR6, abilities (block "Reviewer 2026-11-15 16:45"; the first worker takes colour and material): what a common thing
// can do (`k.attributes.thing can`), for the things of the catalog that have none, from what the data here already
// says, joined by WordNet's hypernyms:
//   1. the agent role of k.actions: a thing named as `who` of an everyday action can do it (a baby cries, a stone
//      sinks); `person`, `animal` and the other wide kinds are not taken (everything a person does is not an ability
//      of each kind of person);
//   2. inherited: a thing whose first noun sense in WordNet lies under a kind that the catalog says can do something
//      (k.attributes.thing can, k.animals.animal can, or the agent of an action) can do it too (a laptop is a machine:
//      it works; a freighter is a ship: it sails, floats). The kind is the nearest one up the chain that says
//      anything, and it must be the same WordNet sense as the kind's own first sense (its chain above it is the same),
//      so "bulb" the lamp gives nothing to an onion, whose bulb is a plant part. Wide kinds (entity, object, artifact,
//      organism, animal, person, plant, food ...) give nothing;
//   3. a name of k.food is skipped when its first WordNet sense is not a food (a plum is first the tree), and a name
//      with senses in two of the domains food, plant, animal, artifact is skipped (a queen, a needle);
//   4. every value proposed is checked by hand in sources/coverage/abilities-audit.tsv (right / wrong, and why for a
//      wrong one); only the right ones are written, and a value not in the audit stops the tool.
// The facts are read off WordNet's chains and the catalog's own facts: shard things-abilities, WordNet-3.0.
//   node tools/attributes-abilities.mjs     writes docs/worlds/k.attributes/shards/things-abilities.sop
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, factsOf } from './lib/worlds.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';
import { firstNounSenses } from './sensitive-core.mjs';

export const SHARD = join(WORLDS_DIR, 'k.attributes', 'shards', 'things-abilities.sop');
export const AUDIT = join(REPO, 'sources', 'coverage', 'abilities-audit.tsv');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
export const WIDE = new Set(['entity', 'physical entity', 'object', 'whole', 'artifact', 'organism', 'living thing', 'being', 'thing', 'matter', 'substance',
  'instrumentality', 'animal', 'person', 'causal agent', 'abstraction', 'part', 'unit', 'food', 'solid', 'plant', 'vascular plant', 'man', 'woman', 'adult', 'people']);
const DOMAINS = { 'noun.food': 'food', 'noun.plant': 'plant', 'noun.animal': 'animal', 'noun.artifact': 'artifact' };

export const readAudit = (text = readFileSync(AUDIT, 'utf8')) => new Map(text.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [thing, verb, verdict, why] = l.split('\t'); return [`${thing}\t${verb}`, { verdict, why }]; }));

// The proposals: [{ name, verb, via }] where via is `who` (rule 1) or the kind it is inherited from (rule 2).
export function proposals(worlds = scanWorlds()) {
  const senses = firstNounSenses(worlds);
  const domains = new Map(); // word -> the domains of all its noun senses
  for (const w of factsOf('k.words', 'k.words.sense', worlds)) if (w.attrs.pos?.[0] === 'noun' && DOMAINS[w.attrs.supersense?.[0]]) {
    const n = tok(w.attrs.word[0]);
    if (!domains.has(n)) domains.set(n, new Set());
    domains.get(n).add(DOMAINS[w.attrs.supersense[0]]);
  }
  const agents = new Map(), add = (w, v) => { if (!agents.has(w)) agents.set(w, new Set()); agents.get(w).add(v); };
  const who = new Map();
  for (const a of factsOf('k.actions', 'k.actions.action', worlds)) for (const w of (a.attrs.who ?? []).map(tok)) { add(w, tok(a.attrs.name[0])); if (!who.has(w)) who.set(w, new Set()); who.get(w).add(tok(a.attrs.name[0])); }
  const has = new Set();
  for (const [world, type] of [['k.attributes', 'k.attributes.thing'], ['k.animals', 'k.animals.animal']]) for (const t of factsOf(world, type, worlds)) {
    if (t.id.startsWith('k.attributes.thing.abilities.')) continue; // this tool's own facts
    const n = tok(t.attrs.name[0]);
    for (const v of (t.attrs.can ?? []).map(tok)) add(n, v);
    if (t.attrs.can) has.add(n);
  }
  const names = new Set(), foods = new Set(factsOf('k.food', 'k.food.food', worlds).map((f) => tok(f.attrs.name[0])));
  for (const [world, type] of [['k.objects', 'k.objects.object'], ['k.scenes', 'k.scenes.thing'], ['k.attributes', 'k.attributes.thing'], ['k.food', 'k.food.food']]) for (const f of factsOf(world, type, worlds)) names.add(tok(f.attrs.name[0]));
  const out = [];
  for (const n of [...names].sort(byText)) {
    if (has.has(n) || WIDE.has(n)) continue;
    if (who.has(n)) { for (const v of who.get(n)) out.push({ name: n, verb: v, via: 'who' }); continue; }
    const s = senses.get(n);
    if (!s || (foods.has(n) && s.supersense !== 'noun.food') || (domains.get(n)?.size ?? 0) > 1) continue;
    for (let i = 0; i < s.kind_of.length; i++) {
      const k = s.kind_of[i];
      if (WIDE.has(k) || !agents.has(k)) continue;
      if (JSON.stringify(senses.get(k)?.kind_of) !== JSON.stringify(s.kind_of.slice(i + 1))) continue; // another sense of the kind's word
      for (const v of agents.get(k)) out.push({ name: n, verb: v, via: k });
      break;
    }
  }
  return out;
}

export function derive(worlds = scanWorlds(), audit = readAudit()) {
  const props = proposals(worlds);
  const unaudited = props.filter((p) => !audit.has(`${p.name}\t${p.verb}`));
  const right = props.filter((p) => audit.get(`${p.name}\t${p.verb}`)?.verdict === 'right');
  const wrong = props.filter((p) => audit.get(`${p.name}\t${p.verb}`)?.verdict === 'wrong');
  return { props, right, wrong, unaudited };
}

export function shardText({ props, right, wrong }) {
  const by = new Map();
  for (const p of right) { if (!by.has(p.name)) by.set(p.name, { via: p.via, verbs: [] }); by.get(p.name).verbs.push(p.verb); }
  const lines = [...by].map(([n, { via, verbs }]) => [`# ${n}: ${via === 'who' ? 'the agent of these actions in k.actions' : `a kind of ${via} (WordNet)`}`,
    wire(`k.attributes.thing.abilities.${seg(n)}`, 'k.attributes.thing', [['name', n], ...verbs.sort(byText).map((v) => ['can', v])], 'wordnet 3.1')]).flat();
  return `${header({ id: 'k.attributes/shards/things-abilities', about: `what ${by.size} common things of the catalog that had no ability can do (${right.length} values; ${wrong.length} of ${props.length} proposed were wrong by the hand check and are not written): the agent role of k.actions, and abilities inherited down WordNet's hypernyms from the kinds the catalog describes (KR6; the rule in tools/attributes-abilities.mjs)`,
    sources: ['wordnet 3.1 (the hypernym chains of the first noun senses, as imported in k.words; the abilities they carry down are the catalog\'s own: k.attributes, k.animals, k.actions; hand-checked in sources/coverage/abilities-audit.tsv)'],
    license: 'WordNet-3.0', script: 'tools/attributes-abilities.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const d = derive();
  if (d.unaudited.length) { console.error(`not in the audit (check them by hand in ${AUDIT}):\n${d.unaudited.map((p) => `${p.name}\t${p.verb}\t\t${p.via}`).join('\n')}`); process.exit(1); }
  writeFileSync(SHARD, shardText(d));
  console.log(`things-abilities.sop: ${new Set(d.right.map((p) => p.name)).size} things, ${d.right.length} values; ${d.wrong.length} of ${d.props.length} wrong`);
}
