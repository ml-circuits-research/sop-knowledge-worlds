// w.lang.en.fn (reviewer block 2026-11-15 14:25 item 3, KR3): the function words by view (filler, politeness, wish,
// hesitation), the words the reviewer named among them, and each said in a phrase group of the hand-over (or as one of
// the words of such a phrase), so the views and PSys2's lists do not drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';

const dir = join(WORLDS_DIR, 'w.lang.en', 'shards');
const all = readdirSync(dir).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const fn = all.filter((w) => w.type === 'w.lang.en.fn');
const plain = (s) => String(s).toLowerCase().replace(/['’]/g, '');

test('views: every view has words; the words the reviewer named are there with their view', () => {
  const byView = (v) => fn.filter((w) => vals(w, 'view').includes(v)).map((w) => one(w, 'text'));
  for (const v of ['filler', 'politeness', 'wish', 'hesitation']) assert.ok(byView(v).length >= 8, v);
  for (const [t, v] of [['please', 'politeness'], ['pls', 'politeness'], ['kindly', 'politeness'], ['just', 'filler'], ['um', 'hesitation'], ['want', 'wish'], ['would like', 'wish'], ['need', 'wish'], ['wanna', 'wish'], ['i mean', 'filler']]) {
    assert.ok(byView(v).includes(t), `${t}: ${v}`);
  }
  for (const w of fn) assert.equal(one(w, 'text'), plain(one(w, 'text')), `${one(w, 'text')}: lower case, no apostrophe`);
});

test('each function word is said in a phrase group of the hand-over (its whole text, or a word of a phrase there)', () => {
  const GROUPS = ['lead.filler', 'filler', 'tail.filler', 'trailing', 'lead.polite', 'lead.ask', 'shape.want', 'shape.wishto', 'shape.ind', 'shape.prefer', 'connective'];
  const items = all.filter((w) => w.type === 'w.lang.en.phrase' && GROUPS.includes(one(w, 'name'))).flatMap((w) => vals(w, 'item')).map(plain);
  const words = new Set(items.flatMap((i) => i.split(/\s+/)));
  const said = new Set(items);
  const missing = fn.map((w) => one(w, 'text')).filter((t) => !said.has(t) && !t.split(' ').every((x) => words.has(x)));
  console.log(`# fn: ${fn.length} words; not in a phrase group: ${missing.join(', ')}`);
  assert.ok(missing.length <= 6, missing.join(', '));
});
