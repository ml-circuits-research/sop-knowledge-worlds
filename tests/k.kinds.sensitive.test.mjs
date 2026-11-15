// k.kinds `sensitive` (block 2026-11-15 13:15, PSys2 Q20; real row: the chip "Add a weapon." after a sunny scene):
// the shard is what tools/sensitive-core.mjs gives from k.words (fresh), and the rule marks weapons, drugs, alcoholic
// drinks and tobacco without sweeping in everyday tools through a wide hypernym.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { sensitiveShard, sensitivityOf, firstNounSenses, readNot, VALUES } from '../tools/sensitive-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

test('the shard sensitive is what tools/sensitive-core.mjs gives from k.words (run it after k.words changes)', () => {
  for (const [name, text] of Object.entries(sensitiveShard(worlds))) assert.equal(readFileSync(join(WORLDS_DIR, 'k.kinds', 'shards', name), 'utf8'), text, `${name}: run node tools/sensitive-core.mjs`);
});

test('weapons, drugs, alcoholic drinks and tobacco are marked; knives, axes and other everyday tools are not', () => {
  const marked = new Map(factsOf('k.kinds', 'k.kinds.sensitivity', worlds).map((w) => [tok(w.attrs.name[0]), w.attrs.sensitive[0]]));
  for (const v of marked.values()) assert.ok(VALUES.includes(v));
  for (const [w, v] of [['gun', 'weapon'], ['rifle', 'weapon'], ['pistol', 'weapon'], ['sword', 'weapon'], ['dagger', 'weapon'], ['spear', 'weapon'], ['bomb', 'weapon'], ['grenade', 'weapon'], ['bullet', 'weapon'], ['cannon', 'weapon'], ['missile', 'weapon'],
    ['cocaine', 'drug'], ['heroin', 'drug'], ['beer', 'alcohol'], ['wine', 'alcohol'], ['vodka', 'alcohol'], ['alcohol', 'alcohol'], ['cigarette', 'tobacco'], ['tobacco', 'tobacco']]) assert.equal(marked.get(w), v, w);
  // the rule: only the first noun sense (a knife is first an edge tool, knife.n.02 the weapon), narrow roots (not
  // instrument or device), the drink only for alcohol, the product only for tobacco, and the words whose everyday
  // sense differs from WordNet's first (sources/hand-core/sensitive-not.tsv)
  for (const w of ['knife', 'axe', 'hammer', 'saw', 'scissors', 'fork', 'spoon', 'screwdriver', 'chisel', 'bow', 'arrow', 'shield', 'tank', 'slingshot', 'helmet', 'water pistol',
    'battery', 'shell', 'hatchet', 'slug', 'round', 'mortar', 'glass', 'cup', 'medicine', 'pipe', 'glycerol', 'methanol', 'tea', 'coffee']) assert.equal(marked.get(w), undefined, w);
  assert.ok(marked.size >= 60 && marked.size <= 200, `${marked.size} words marked`);
});

test('every word of sensitive-not.tsv is one the rule would mark (the list stays short and justified)', () => {
  const senses = firstNounSenses(worlds);
  const not = readNot();
  assert.ok(not.size <= 20);
  for (const [w, why] of not) {
    assert.ok(why, w);
    assert.ok(sensitivityOf(w, senses), `${w}: the rule does not mark it, so it needs no row`);
  }
});
