// Block "22:30": every w.lang.en frame reads its own example. Two passes, with the reference frame reader of
// tools/lib/lang-en.mjs (the library's order: priority, then literal words, then fewer captured words):
//  1. structure: the frame alone reads its example, a host lexicon it names taking any one to three words; the words
//     each lexicon part took (a leading determiner left out) are the host lexicon of the frame's kind of world (its
//     `needs`), as a host's world would give them;
//  2. in its world: with those lexicons and every frame that world meets (no needs, or the frame's), the best reading of
//     the example is the frame itself, or one with the same act, mode and roles.
// A frame that fails is listed in KNOWN with the reason; the test fails on a new failure and on a listed frame that
// passes (take it off the list). The templates read their own output in tests/w.lang.en.templates.test.mjs (acts) and
// tests/w.lang.en.phrasing.test.mjs (attributes); the discourse templates are prose for a composer, read by no frame.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';

const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().map((f) => readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8'));
const all = shardsOf('w.lang.en').flatMap((t) => parse(t));
const actions = shardsOf('k.actions').flatMap((t) => parse(t));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const frames = all.filter((w) => w.type === 'w.lang.en.frame');
const others = all.filter((w) => w.type !== 'w.lang.en.frame' && w.type !== 'w.lang.en.part');
const dets = new Set(all.filter((w) => w.type === 'w.lang.en.det').map((d) => one(d, 'text')));
const given = new Set(all.filter((w) => w.type === 'w.lang.en.lex').map((l) => one(l, 'name'))); // lexicons this world gives

// Frames whose example is not read as said, with why (to fix in the frames, or a reader the library has and this one not).
export const KNOWN = {
  // frames of PSys2's local file (src/lang/en.local.mjs, published as written; tests/w.lang.en.test.mjs compares them):
  'acts.facts.ask.what.in.lead': 'the example puts the thing before "is" ("what continent Egypt is in"), the frame after it; acts.facts.ask.what.thing.is.in reads it the same',
  'acts.media.m.pick.play.bare': 'the bare verb "play" is not among the frame\'s words (play something, play music...)',
  'acts.media.m.pick.again': '"again" is read as part of the thing by acts.media.m.pick.play (priority over the again frame)',
  'acts.media.m.pick.play.kind.of': 'acts.media.m.make.melody.colon (a kind and the rest as notes) outranks it; PSys2 orders by the frame list',
  'acts.media.m.pick.play.kind.bare': 'as acts.media.m.pick.play.kind.of',
  'acts.text.make.blank': 'acts.text.make.kind reads "start a new chapter" with the same act but mode text, not blank ("new" is a word of the blank frame only)',
  'acts.text.make.numbered': 'acts.text.make.text takes "3: The Return" as the text; the numbered frame needs priority over it',
  'acts.text.make.blank.at': 'acts.text.make.text takes "after the title" as the text; the place frame needs priority over it',
  'acts.facts.layer.on.want.pin': 'acts.facts.layer.on.pin.verb takes "on Berlin" as the thing (the preposition is not split off)',
  // frames of the chart world (data), ordering among PSys2's frames of one set:
  'acts.data.change.nice': 'acts.data.change.value.d takes "a nice green" as the value; the nice frame (the adjective as a word of its own) has no priority over it',
  'acts.data.remove.out.all': 'acts.remove.out (a general frame, priority 11) reads "take all the values out"',
  'acts.data.make.data.as': 'the determiner before "pie chart" is taken as the value by acts.data.change.as',
  'acts.data.make.data.as.noun': 'the article "a" stays in the data ("bikes 4 scooters 9 a"): a rest capture before a lexicon part',
  'acts.data.change.adj': 'acts.make reads "make it stacked" as a kind "it stacked" (make is a verb of make)',
};

function check() {
  const alone = new Map(), lexByNeeds = new Map();
  for (const f of frames) {
    const name = one(f, 'name');
    const wires = [...others, f, ...all.filter((w) => w.type === 'w.lang.en.part' && one(w, 'frame') === name)];
    const [r] = frameReader(wires, actions, { openLexicons: true })(one(f, 'example'));
    alone.set(name, r ?? null);
    const needs = one(f, 'needs') ?? '';
    if (!lexByNeeds.has(needs)) lexByNeeds.set(needs, {});
    for (const [lx, w] of (r?.lexicons ?? []).filter(([x]) => !given.has(x))) {
      const ws = w.split(' ');
      (lexByNeeds.get(needs)[lx] ??= new Set()).add((ws.length === 2 && dets.has(ws[0]) ? ws.slice(1) : ws).join(' '));
    }
  }
  const lexFor = (needs) => { const out = {}; for (const n of new Set([needs, ''])) for (const [k, s] of Object.entries(lexByNeeds.get(n) ?? {})) out[k] = [...new Set([...(out[k] ?? []), ...s])]; return out; };
  const readers = new Map(), failed = new Map();
  let best = 0, same = 0;
  for (const f of frames) {
    const name = one(f, 'name'), needs = one(f, 'needs'), example = one(f, 'example');
    if (!alone.get(name)) { failed.set(name, `"${example}": not read by the frame alone`); continue; }
    if (!readers.has(needs)) readers.set(needs, frameReader(all, actions, { lexicons: lexFor(needs ?? ''), needs: (n) => n === undefined || n === needs }));
    const r = readers.get(needs)(example);
    const mine = r.find((x) => x.frame === name);
    if (!mine) { failed.set(name, `"${example}": not read in its world (${r[0]?.frame ?? 'no frame'} reads it)`); continue; }
    if (r[0].frame === name) { best += 1; continue; }
    if (r[0].act === mine.act && r[0].mode === mine.mode && JSON.stringify(r[0].args) === JSON.stringify(mine.args)) { same += 1; continue; }
    failed.set(name, `"${example}": read as ${r[0].frame} ${r[0].act}/${r[0].mode ?? ''} ${JSON.stringify(r[0].args)}, not ${mine.act}/${mine.mode ?? ''} ${JSON.stringify(mine.args)}`);
  }
  return { best, same, failed };
}

test('frames: every frame reads its own example, alone and in its world (or a frame with the same reading wins)', () => {
  const { best, same, failed } = check();
  console.log(`# ${frames.length} frames: ${best} read their example best, ${same} tie with a frame of the same reading, ${failed.size} known failures`);
  const fresh = [...failed].filter(([n]) => !KNOWN[n]).map(([n, why]) => `${n}: ${why}`);
  assert.deepEqual(fresh, [], 'new failures');
  assert.deepEqual(Object.keys(KNOWN).filter((n) => !failed.has(n)), [], 'listed frames that now read their example: take them off KNOWN');
});

test('frames: the roles of k.actions that no general frame reads (asks for frames), counted', () => {
  const GENERAL = new Set([undefined, 'in', 'named', 'attrs', 'values', 'number', 'more', 'less', 'rel', 'dir', 'layout', 'scale', 'turn', 'wish', 'say', 'list', 'clear', 'none', 'thingask']);
  const acts = new Map(actions.filter((w) => w.type === 'k.actions.act').map((a) => [one(a, 'name'), (a.attrs.role ?? []).map(tok)]));
  const maps = all.filter((w) => w.type === 'w.lang.en.role_map');
  const modes = new Map(all.filter((w) => w.type === 'w.lang.en.mode_map').map((m) => [`${one(m, 'act')} ${one(m, 'mode')}`, one(m, 'means')]));
  const read = new Set();
  for (const f of frames.filter((x) => GENERAL.has(one(x, 'needs')))) {
    const act = modes.get(`${one(f, 'act')} ${one(f, 'mode')}`) ?? one(f, 'act');
    for (const role of (f.attrs.role ?? []).map(tok)) {
      const m = maps.find((x) => one(x, 'frame') === one(f, 'name') && one(x, 'role') === role) ?? maps.find((x) => !one(x, 'frame') && one(x, 'act') === one(f, 'act') && one(x, 'role') === role);
      read.add(`${act}.${m ? one(m, 'act_role') : role}`);
    }
    for (const x of all.filter((w) => w.type === 'w.lang.en.fixed' && one(w, 'frame') === one(f, 'name'))) read.add(`${act}.${one(x, 'role')}`);
  }
  const unread = [...acts].flatMap(([a, rs]) => rs.filter((r) => !read.has(`${a}.${r}`)).map((r) => `${a}.${r}`));
  console.log(`# roles of k.actions no general frame reads: ${unread.length} of ${[...acts.values()].flat().length}: ${unread.join(', ')}`);
  assert.ok(unread.length <= 40, unread.join(', '));
});
