// w.lang.en for the library's abstraction round (block "21:05" items 2 and 5): frames that are variants of a general
// alternation are marked (tools/lang-en-variants.mjs), never deleted; the words a request skips and the words of
// removal are classes of words; k.values has the comparatives together and apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { readFrames, variantRows, variantsShard, alternationsOf, ALTERNATIONS } from '../tools/lang-en-variants.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const dir = join(WORLDS_DIR, 'w.lang.en', 'shards');
const wires = readdirSync(dir).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')));
const of = (type) => wires.filter((w) => w.type === type);
const texts = (w) => (w.attrs.text ?? []).map(tok);

test('the variants shard is what tools/lang-en-variants.mjs gives, and w.lang.en loads with it', () => {
  assert.equal(readFileSync(join(dir, 'variants.sop'), 'utf8'), variantsShard());
  const w = fullWorld('w.lang.en');
  assert.equal(w.ofType('w.lang.en.variant').length, variantRows().length);
});

test('every variant names a frame that is still there; its canonical frames have the same act and mode, no alternation, and every role it takes', () => {
  const frames = readFrames(), byName = new Map(frames.map((f) => [f.name, f]));
  const variants = of('w.lang.en.variant');
  // every variant names a family of the alternations (shard alternations, and verb ellipsis here, under context)
  const families = new Map(of('w.lang.en.alternation_family').map((w) => [tok(w.attrs.name[0]), tok(w.attrs.parent?.[0])]));
  for (const a of ALTERNATIONS) assert.ok(families.has(a), a);
  assert.equal(families.get('verb ellipsis'), 'context');
  for (const v of variants) assert.ok(families.has(tok(v.attrs.alternation[0])), tok(v.attrs.alternation[0]));
  assert.ok(frames.length >= 352, `${frames.length} frames: none deleted`);
  for (const v of variants) {
    const f = byName.get(tok(v.attrs.frame[0]));
    assert.ok(f, tok(v.attrs.frame[0]));
    assert.ok(ALTERNATIONS.includes(tok(v.attrs.alternation[0])));
    for (const c of (v.attrs.canonical ?? []).map(tok)) {
      const g = byName.get(c);
      assert.ok(g && g.act === f.act && g.mode === f.mode && !alternationsOf(g).length, `${f.name} -> ${c}`);
      for (const r of f.roles) assert.ok(g.roles.has(r), `${f.name} -> ${c}: role ${r}`);
    }
  }
  const by = Object.fromEntries(ALTERNATIONS.map((a) => [a, variants.filter((v) => tok(v.attrs.alternation[0]) === a).length]));
  const marked = new Set(variants.map((v) => tok(v.attrs.frame[0])));
  console.log(`frames ${frames.length}; marked ${marked.size} (${JSON.stringify(by)}); with a canonical frame ${new Set(variants.filter((v) => v.attrs.canonical).map((v) => tok(v.attrs.frame[0]))).size}`);
  // the rule's own examples
  const has = (name, a) => variants.some((v) => tok(v.attrs.frame[0]) === name && tok(v.attrs.alternation[0]) === a);
  assert.ok(has('acts.more.make.wish', 'request wrapper'), 'I want a house');
  assert.ok(has('acts.data.change.want', 'request wrapper'), 'I want the bars green');
  assert.ok(has('acts.facts.layer.on.want.hl', 'passive'), 'I want France and Spain highlighted');
  assert.ok(has('acts.more.change.short', 'verb ellipsis'), 'House huge.');
  assert.ok(!marked.has('acts.ask.what.is'), 'a question with its wh-word in front is canonical (wh in situ is the variant)');
  assert.ok(!marked.has('acts.make'), 'the plain make frame is canonical');
  assert.ok(!marked.has('acts.make.name'), 'a guest called Ann: a naming participle is no passive');
  assert.ok(!marked.has('acts.data.remove.dont'), "I don't want pears: a removal, not a wrapper");
});

test('the words a request skips, by class, hold every word the first host asked for', () => {
  const skip = new Map(of('w.lang.en.skip').map((w) => [w.attrs.class[0], texts(w)]));
  const asked = { politeness: ['please', 'pls', 'plz'], desire: ['want', 'like'], filler: ['also', 'now', 'just', 'too', 'very', 'really', 'then'], conjunction: ['and'], copula: ['be'], reflexive: ['yourself', 'myself'], request_preposition: ['of', 'on', 'to', 'for', 'with'] };
  for (const [c, ws] of Object.entries(asked)) for (const w of ws) assert.ok(skip.get(c)?.includes(w), `${c}: ${w}`);
  // a skipped preposition is a preposition of the grammar; a skipped copula a form of be of the grammar
  const preps = new Set(of('w.lang.en.prep').flatMap(texts));
  for (const p of skip.get('request_preposition')) assert.ok(preps.has(p), p);
  const copula = new Set(of('w.lang.en.copula').flatMap(texts));
  for (const c of skip.get('copula')) assert.ok(copula.has(c), c);
});

test('negation and removal: no, without, never, lose, minus are words of w.lang.en.neg; the removal words say so', () => {
  const neg = of('w.lang.en.neg');
  const all = new Set(neg.flatMap(texts)), removal = new Set(neg.filter((w) => w.attrs.means?.[0] === 'removal').flatMap(texts));
  for (const w of ['no', 'without', 'never', 'lose', 'minus', 'not']) assert.ok(all.has(w), w);
  for (const w of ['without', 'lose', 'minus']) assert.ok(removal.has(w), w);
  assert.ok(!removal.has('never') && !removal.has('not'));
  assert.ok(of('w.lang.en.joiner').some((w) => texts(w).includes('if')), 'if joins a condition');
});

test('k.values: together and apart compare a distance and a width', () => {
  const comps = parse(readFileSync(join(WORLDS_DIR, 'k.values', 'shards', 'scales.sop'), 'utf8')).filter((w) => w.type === 'k.values.comparative');
  const find = (t, scale) => comps.find((w) => tok(w.attrs.text[0]) === t && tok(w.attrs.scale[0]) === scale)?.attrs.way[0];
  assert.equal(find('together', 'distance'), 'down');
  assert.equal(find('apart', 'distance'), 'up');
  assert.equal(find('together', 'width'), 'down');
  assert.equal(find('apart', 'width'), 'up');
});
