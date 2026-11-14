// w.lang.en.closed (reviewer block "02:15"): every closed-class word of w.lang.en's word lists has its class; the
// shard is what tools/lang-en-closed.mjs derives from the lists, so it cannot go stale.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { factsOf } from '../tools/lib/worlds.mjs';
import { closedClasses, shardText, SHARD, CLASSES, TYPE_CLASS, MARKER_TYPES, OPEN } from '../tools/lang-en-closed.mjs';

const r = closedClasses();
const facts = factsOf('w.lang.en', 'w.lang.en.closed');
const unq = (v) => String(v).replace(/^"|"$/g, '');
const classesOf = (w) => facts.filter((f) => unq(f.attrs.text[0]) === w).map((f) => f.attrs.class[0]).sort();

test('the shard is what the tool derives from the word lists (npm run build reruns it)', () => {
  assert.equal(readFileSync(SHARD, 'utf8'), shardText(r));
});

test('every word of the lists has a class, or is an open-class word named as such', () => {
  assert.deepEqual(r.missing, [], `without a class: ${r.missing.map((x) => x.join(' ')).join(', ')}`);
  // open: the OPEN list of the marker lists, and the exceptions of the one-class lists (det new, neg lose, the attribute nouns)
  const attrNouns = new Set(factsOf('w.lang.en', 'w.lang.en.word').filter((f) => f.attrs.cat[0] === 'ATTRN').map((f) => unq(f.attrs.text[0])));
  for (const [t, w] of r.open) assert.ok(OPEN.has(w) || attrNouns.has(w) || ['det new', 'neg lose', 'neg.imperative.skip have'].includes(`${t} ${w}`), `${t} ${w}`);
  // the single words of every list are either classed or open
  const types = [...Object.keys(TYPE_CLASS), ...MARKER_TYPES].map((t) => `w.lang.en.${t}`);
  const classed = new Set(facts.map((f) => unq(f.attrs.text[0])));
  const open = new Set(r.open.map(([t, w]) => `${t}|${w}`));
  for (const f of factsOf('w.lang.en', types)) for (const w of (f.attrs.text ?? []).map(unq).map((x) => x.toLowerCase()).filter((x) => /^[a-z']+$/.test(x))) {
    assert.ok(classed.has(w) || open.has(`${f.type.slice(10)}|${w}`), `${f.type} ${w}`);
  }
});

test('classes are the closed parts of speech, and the usual words get the usual ones', () => {
  for (const f of facts) assert.ok(CLASSES.includes(f.attrs.class[0]), f.id);
  assert.ok(facts.length >= 250, `${facts.length} facts`);
  assert.deepEqual(classesOf('the'), ['determiner']);
  assert.deepEqual(classesOf('that'), ['determiner', 'pronoun']);
  assert.deepEqual(classesOf('in front of'), ['preposition']);
  assert.deepEqual(classesOf('how many'), ['determiner']);
  assert.deepEqual(classesOf('can'), ['auxiliary']);
  assert.deepEqual(classesOf('and'), ['conjunction']);
  assert.deepEqual(classesOf('three'), ['numeral']);
  assert.deepEqual(classesOf('first'), ['ordinal']);
  assert.deepEqual(classesOf('um'), ['interjection']);
  assert.deepEqual(classesOf('not'), ['particle']);
  assert.deepEqual(classesOf('where'), ['adverb']);
  for (const w of ['want', 'colour', 'new', 'think']) assert.deepEqual(classesOf(w), [], w);
  // `from` names the lists the word is in
  assert.deepEqual(facts.find((f) => f.id === 'w.lang.en.closed.the.determiner').attrs.from.slice().sort(), ['w.lang.en.det', 'w.lang.en.word']);
});
