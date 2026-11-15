// PSys2 Q18 K10 (reviewer block 2026-11-15 09:20): question frames in other word orders over facts that exist, read by the
// reference reader of tools/lib/lang-en.mjs in a facts world whose host lexicon `attribute` is what the catalog says:
// the attribute names of k.attributes (legs, sides, colour ...) and the words of k.time (days, months, seasons ...).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';
import { questionFrameShard, FRAMES } from '../tools/lang-en-question-frames.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const all = shardsOf('w.lang.en'), actions = shardsOf('k.actions');
const attrs = shardsOf('k.attributes').filter((w) => w.type === 'k.attributes.attribute').map((w) => tok(w.attrs.name[0]));
const timeWords = parse(readFileSync(join(WORLDS_DIR, 'k.time', 'schema.sop'), 'utf8')).filter((w) => w.type === 'core.word').flatMap((w) => (w.attrs.text ?? []).map(tok)).filter((x) => /^[a-z]+$/.test(x));
const read = frameReader(all, actions, { lexicons: { attribute: [...new Set([...attrs, ...timeWords])] }, needs: (n) => n === undefined || n === 'facts' });
const said = (s) => { const [c] = read(s); return c ? `${c.act}/${c.mode} ${Object.entries(c.args).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join(' ')}` : null; };

test('question-frames: the shard is what tools/lang-en-question-frames.mjs gives; every frame asks over facts', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'question-frames.sop'), 'utf8'), questionFrameShard());
  assert.ok(attrs.includes('legs') && timeWords.includes('days') && timeWords.includes('months') && timeWords.includes('seasons'));
  assert.equal(FRAMES.length, 7);
});

// the real row (psys2 real-2026-11-15 r0244) and the sentences of PSys2's kids.time world that K10 names
const CASES = [
  ['how many legs has a cow', 'ask/count thing=cow topic=legs', 'acts.facts.ask.count.does'], // real row r0244
  ['How many days has April?', 'ask/count thing=april topic=days'],
  ['April has how many days?', 'ask/count thing=april topic=days', 'acts.facts.ask.count.tail'],
  ['A cow has how many legs?', 'ask/count thing=cow topic=legs'],
  ['How many days are in April?', 'ask/count thing=april topic=days', 'acts.facts.ask.count.in'],
  ['Friday is how many days away?', 'ask/count thing=friday topic=days'],
  ['How many days until Saturday?', 'ask/count thing=saturday topic=days'],
  ['Which months are in summer?', 'ask/what thing=summer topic=months'],
  ['Name the months of spring.', 'ask/what thing=spring topic=months'],
  ['Name all the seasons of the year.', 'ask/what thing=year topic=seasons'],
  ['What are the seasons?', 'ask/what topic=seasons'],
];

test('question-frames: the real row r0244 and the kids.time sentences of K10 read with the right act, mode and roles', () => {
  const right = CASES.filter(([s, want]) => said(s) === want);
  console.log(`# read right: ${right.length} of ${CASES.length}`);
  for (const [s, want, frame] of CASES) {
    assert.equal(said(s), want, s);
    if (frame) assert.equal(read(s)[0].frame, frame, s);
  }
  // the canonical order still reads as before
  assert.equal(said('How many legs does a cow have?'), 'ask/count thing=cow topic=legs');
});
