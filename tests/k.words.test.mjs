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

test('senses asked by other worlds (block 16:10): the adjectives of text style and orientation, thicken; hand senses are CC0 in a shard of their own', () => {
  const gloss = (word, pos, n) => {
    for (const s of scanWorlds().find((w) => w.id === 'k.words').shards) {
      const m = new RegExp(`^@k\\.words\\.${word}\\.${pos}\\.${n} k\\.words\\.sense .* gloss="([^"]*)"`, 'm').exec(s.text);
      if (m) return { gloss: m[1], shard: s };
    }
    return null;
  };
  for (const [word, pos, n, part] of [['italic', 'adjective', 1, 'slanting'], ['horizontal', 'adjective', 1, 'horizon'], ['vertical', 'adjective', 1, 'right angles'],
    ['bold', 'adjective', 2, 'clear and distinct'], ['sandy', 'adjective', 1, 'yellowish'], ['anterior', 'adjective', 2, 'earlier in time'], ['thick', 'adjective', 1, 'not thin'],
    ['thicken', 'verb', 1, 'make thick'], ['numbered', 'adjective', 1, 'numbers']]) {
    const g = gloss(word, pos, n);
    assert.ok(g && g.gloss.includes(part), `${word} ${pos} ${n}: ${g?.gloss}`);
  }
  // A hand sense lies in hand.sop, CC0, with the hand source; every other shard holds WordNet's wires only.
  for (const s of scanWorlds().find((w) => w.id === 'k.words').shards) {
    const hand = /core\.source="hand-core 1"/.test(s.text);
    const name = s.path ?? s.file ?? s.id ?? '';
    if (hand) { assert.match(s.text, /^# license: CC0-1\.0$/m, name); assert.doesNotMatch(s.text, /core\.source="wordnet/, name); }
  }
  assert.equal(gloss('numbered', 'adjective', 1).shard.text.match(/^# license: (.*)$/m)[1], 'CC0-1.0');
});

test('register of words (block 15:15 item 2): Zipf frequency and band for lexical choice by genre; usage marks from WordNet', () => {
  const band = new Map(), licences = new Set();
  for (const s of scanWorlds().find((w) => w.id === 'k.words').shards) {
    if (!/frequency-/.test(s.text.split('\n')[0])) continue;
    licences.add(s.text.match(/^# license: (.*)$/m)[1]);
    for (const m of s.text.matchAll(/^@\S+ k\.words\.frequency word=(\S+) zipf=([\d.]+) band=(\d) core\.source="wordfreq 3\.1\.1"$/gm)) {
      band.set(m[1], Number(m[3]));
      // the band is computed from the Zipf value, never labelled apart from it
      const z = Number(m[2]);
      assert.equal(Number(m[3]), z >= 6 ? 1 : z >= 5 ? 2 : z >= 4 ? 3 : z >= 3 ? 4 : 5, m[1]);
    }
  }
  assert.deepEqual([...licences], ['CC-BY-SA-4.0']);
  assert.ok(band.size > 11000, `${band.size} words with a frequency`);
  for (const [w, b] of [['dog', 2], ['animal', 3], ['planet', 3], ['penguin', 4], ['anterior', 4], ['thicken', 5]]) assert.equal(band.get(w), b, w);
  // Every word with a frequency has a sense here.
  const words = new Set(senses.map((s) => s.word.toLowerCase()));
  for (const w of band.keys()) assert.ok(words.has(w), w);
  // Usage marks from WordNet's usage domains.
  const usage = (word, pos) => { for (const s of scanWorlds().find((w) => w.id === 'k.words').shards) { const all = s.text.match(new RegExp(`^@\\S+ k\\.words\\.sense word=${word} pos=${pos} .*$`, 'gm')); if (all) return all.flatMap((l) => [...l.matchAll(/ usage=(\S+)/g)].map((x) => x[1])); } return []; };
  assert.ok(usage('baloney', 'noun').includes('slang'));
  assert.ok(usage('abide', 'verb').includes('archaic'));
});

test('join: the vocabulary band of every k.genres register is a band k.words gives, and each register has words to choose from', () => {
  const genres = scanWorlds().find((w) => w.id === 'k.genres');
  if (!genres) return;
  const counts = [0, 0, 0, 0, 0, 0];
  for (const s of scanWorlds().find((w) => w.id === 'k.words').shards) for (const m of s.text.matchAll(/ k\.words\.frequency word=\S+ zipf=\S+ band=(\d) /g)) counts[Number(m[1])]++;
  const regs = genres.shards.flatMap((s) => [...s.text.matchAll(/^@\S+ k\.genres\.register name=("[^"]*"|\S+).* vocabulary_band=(\d)/gm)].map((m) => [m[1], Number(m[2])]));
  assert.ok(regs.length >= 5);
  for (const [name, band] of regs) {
    const upto = counts.slice(1, band + 1).reduce((a, b) => a + b, 0);
    assert.ok(band >= 1 && band <= 5 && upto >= 800, `${name}: band ${band}, ${upto} words`);
  }
});
