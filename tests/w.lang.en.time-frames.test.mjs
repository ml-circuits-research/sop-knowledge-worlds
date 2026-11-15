// Frames that state and ask the date and the time (reviewer block 2026-11-15 09:20 K7, PSys2 Q18; real row r0586) and
// the clock words of k.time they join (k.time.clock_phrase, the spans in clock words): requests read back by the
// reference reader, each value read joined to a fact of k.time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';
import { timeFrameShard, lexicons } from '../tools/lang-en-time-frames.mjs';

const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const all = shards('w.lang.en'), actions = shards('k.actions'), time = shards('k.time');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const read = frameReader(all, actions, { needs: (n) => [undefined, 'attrs', 'values', 'in', 'dir', 'number'].includes(n) });
const names = (type) => new Set(time.filter((w) => w.type === type).map((w) => String(one(w, 'name')).toLowerCase()));

// [request, real row or '', act/mode, args]
const ROWS = [
  ['I should tell you, today is Friday', 'r0586', 'change/set', { thing: 'today', attribute: 'weekday', value: 'friday' }],
  ['today is monday', '', 'change/set', { thing: 'today', attribute: 'weekday', value: 'monday' }],
  ['just so you know, it is Sunday', '', 'change/set', { thing: 'today', attribute: 'weekday', value: 'sunday' }],
  ['Today is the 5th of May.', '', 'change/set', { thing: 'today', attribute: 'date', value: '5th may' }],
  ['today is may 5', '', 'change/set', { thing: 'today', attribute: 'date', value: 'may 5' }],
  ['we are in December', '', 'change/set', { thing: 'now', attribute: 'month', value: 'december' }],
  ["it's spring", '', 'change/set', { thing: 'now', attribute: 'season', value: 'spring' }],
  ['The clock says half past 3.', '', 'change/set', { thing: 'now', attribute: 'time', value: 'half past 3' }],
  ["it's quarter to four", '', 'change/set', { thing: 'now', attribute: 'time', value: 'quarter to four' }],
  ["it is 5 o'clock", '', 'change/set', { thing: 'now', attribute: 'time', value: '5' }],
  ['it is 3 30 pm', '', 'change/set', { thing: 'now', attribute: 'time', value: '3 30' }],
  ['it is noon', '', 'change/set', { thing: 'now', attribute: 'time', value: 'noon' }],
  ['what time is it', '', 'ask/what', { thing: 'now', topic: 'time' }],
  ['what day is it today', '', 'ask/what', { thing: 'today', topic: 'weekday' }],
  ["what's the date today", '', 'ask/what', { thing: 'today', topic: 'date' }],
];

test('the shard time-frames is what tools/lang-en-time-frames.mjs gives (its lexicons follow k.time)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'time-frames.sop'), 'utf8'), timeFrameShard());
});

test('the date and the time stated and asked: "today is Friday" (r0586), "the clock says half past 3", "what time is it"', () => {
  const bad = [];
  for (const [s, id, am, args] of ROWS) {
    const [r] = read(s);
    const got = r ? `${r.act}/${r.mode ?? ''} ${JSON.stringify(Object.fromEntries(Object.entries(r.args).sort()))}` : 'nothing';
    const want = `${am} ${JSON.stringify(Object.fromEntries(Object.entries(args).sort()))}`;
    if (got !== want) bad.push(`${id || '-'} "${s}": ${got} (${r?.frame}), want ${want}`);
  }
  assert.deepEqual(bad, []);
  // not every "it is" is a time
  for (const s of ['it is red', 'it is big', 'make it red']) assert.ok(!read(s)[0]?.frame?.startsWith('time.'), s);
});

test('the values read are facts of k.time: weekdays, months, seasons, hours and clock phrases', () => {
  const L = lexicons();
  for (const w of L['time.weekday'].items) assert.ok(names('k.time.weekday').has(w), w);
  for (const w of L['time.month'].items) assert.ok(names('k.time.month').has(w), w);
  for (const w of L['time.season'].items) assert.ok(names('k.time.season').has(w), w);
  for (const w of L['time.clock_phrase'].items) assert.ok(names('k.time.clock_phrase').has(w), w);
  assert.equal(names('k.time.weekday').size, 7);
  // "quarter to 4" is 3:45: a phrase's minutes, and the spans said in clock words
  const minutes = new Map(time.filter((w) => w.type === 'k.time.clock_phrase').map((w) => [one(w, 'name'), Number(one(w, 'minutes'))]));
  assert.equal(minutes.get('half past'), 30);
  assert.equal(minutes.get('quarter to'), -15);
  assert.equal(minutes.get("o'clock"), 0);
  const span = (n) => time.find((w) => w.type === 'k.time.duration' && one(w, 'name') === n);
  assert.equal(Number(one(span('half an hour'), 'count')), 30);
  assert.equal(one(span('half an hour'), 'unit'), 'minute');
  assert.equal(Number(one(span('an hour and a half'), 'count')), 90);
  for (const h of ['noon', 'midnight', '12', 'three']) assert.ok(L['time.hour'].items.includes(h), h);
});
