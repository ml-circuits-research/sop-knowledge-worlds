// k.words (Round 9 item 7): opposites and chains of kinds by lookup.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds } from '../tools/lib/worlds.mjs';
import { sample } from '../tools/ask-sample.mjs';

const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
// Read from the shard texts: loading all 319 shards into one world for every test file is slow.
const senses = [];
for (const s of scanWorlds().find((w) => w.id === 'k.words').shards) for (const line of s.text.split('\n')) {
  const m = /^@\S+ k\.words\.sense word=(\S+) pos=(\S+) n=(\d+) /.exec(line);
  if (!m) continue;
  const all = (k) => [...line.matchAll(new RegExp(` ${k}=("[^"]*"|\\S+)`, 'g'))].map((x) => tok(x[1]));
  senses.push({ word: m[1], pos: m[2], n: Number(m[3]), opposite: all('opposite'), near: all('near_opposite'), kinds: all('kind_of'), isa: [...all('is_a'), ...all('instance_of')] });
}
const of = (word, pos) => senses.filter((s) => s.word === word && s.pos === pos);

test('opposites: the well-known pairs, said from both sides where both words are kept', () => {
  for (const [a, b, pos] of [['hot', 'cold', 'adjective'], ['big', 'little', 'adjective'], ['large', 'small', 'adjective'], ['good', 'bad', 'adjective'], ['happy', 'unhappy', 'adjective'], ['open', 'close', 'verb'], ['win', 'lose', 'verb'], ['buy', 'sell', 'verb'],
    ['quickly', 'slowly', 'adverb'], ['man', 'woman', 'noun']]) assert.ok(of(a, pos).some((s) => s.opposite.includes(b)), `${a}: ${b}`);
  assert.ok(of('huge', 'adjective').some((s) => s.near.includes('small')) && !of('huge', 'adjective').some((s) => s.opposite.length));
  const withOpposite = senses.filter((s) => s.opposite.length);
  assert.ok(withOpposite.length >= 1300 && new Set(withOpposite.map((s) => s.word)).size >= 1000, `${withOpposite.length} senses`);
  let both = 0, back = 0;
  for (const s of withOpposite) for (const o of s.opposite) {
    const other = of(o, s.pos);
    if (!other.length) continue;
    both++;
    if (other.some((x) => x.opposite.includes(s.word))) back++;
  }
  // The other word may have its opposite in a sense beyond the three kept.
  assert.ok(both >= 600 && back >= both * 0.8, `${back} of ${both} said from both sides`);
  for (const s of senses) { assert.ok(!(s.opposite.length && s.near.length), `${s.word}: an opposite of its own and a near one`); if (s.near.length) assert.equal(s.pos, 'adjective', s.word); }
});

test('the chain of kinds starts at a direct kind and ends at the top; adjectives and adverbs have none', () => {
  const chained = senses.filter((s) => s.kinds.length);
  assert.ok(chained.length >= 6000, `${chained.length} senses with a chain`);
  for (const s of chained) {
    assert.ok(['noun', 'verb'].includes(s.pos), s.word);
    assert.ok(s.isa.includes(s.kinds[0]), `${s.word} ${s.pos} ${s.n}: the chain starts at ${s.kinds[0]}`);
    if (s.pos === 'noun') assert.equal(s.kinds[s.kinds.length - 1], 'entity', `${s.word} ${s.n}`);
  }
  const dog = of('dog', 'noun').find((s) => s.n === 1).kinds;
  assert.deepEqual(dog.slice(0, 7), ['canine', 'carnivore', 'placental', 'mammal', 'vertebrate', 'chordate', 'animal']);
  assert.ok(of('car', 'noun')[0].kinds.includes('vehicle') && of('apple', 'noun')[0].kinds.includes('food') && of('river', 'noun')[0].kinds.includes('stream'));
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about words, at least 90 find a fact', () => {
  const r = sample('words');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 90, `${r.found} of 100`);
});
