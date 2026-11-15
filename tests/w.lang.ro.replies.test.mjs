// Romanian reply and request templates (reviewer block 2026-11-15 14:25 item 2; real: the owner read a machine-translated
// reply, "6 nod-zi pe schița sa, s-a alăturat în ordine"): w.lang.ro.request mirrors w.lang.en's act templates one to one
// (name, act, shape, roles), w.lang.ro.reply and w.lang.en.reply share their names and CLDR plural categories; every
// template is realised with three things of different gender (casă f, copac m, desen n) and, where it says a number,
// in every count; requests are read back by w.lang.ro's frames where a frame says the act.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { parse, morphOf, realise, fold, dictionary } from '../tools/sopworld/sopworld.mjs';
import { TYPES } from '../tools/lang-ro-core.mjs';
import { realiseEn } from '../tools/lib/lang-en.mjs';
import { roReader } from '../tools/lib/lang-ro.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const shard = (id, f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8'));
const enAll = readdirSync(join(WORLDS_DIR, 'w.lang.en', 'shards')).filter((f) => f.endsWith('.sop')).flatMap((f) => shard('w.lang.en', f));
const roAll = readdirSync(join(WORLDS_DIR, 'w.lang.ro', 'shards')).filter((f) => f.endsWith('.sop')).flatMap((f) => shard('w.lang.ro', f));
const requests = roAll.filter((w) => w.type === 'w.lang.ro.request'); // every shard (seating-frames has make.for)
const fills = roAll.filter((w) => w.type === 'w.lang.ro.fill');
const roReplies = shard('w.lang.ro', 'replies.sop'), enReplies = shard('w.lang.en', 'replies.sop');
const enTemplates = enAll.filter((w) => w.type === 'w.lang.en.template');
const m = morphOf(fullWorld('w.lang.ro', scanWorlds()), { types: TYPES });
const file = (p) => { const f = join(WORLDS_DIR, 'w.lang.ro', 'dictionary', `${p}.tsv`); return existsSync(f) ? readFileSync(f, 'utf8') : null; };
const dict = dictionary({ read: file, fold: (s) => fold(m, s) });
const base = { num: 'sg', case: 'nomacc', def: 'no' };
// three things of different gender, and the other fillers (lemmas where the template inflects them)
const THINGS = ['casă', 'copac', 'desen'];
const N = { one: '1', few: '3', other: '20' };
const fillersRo = (thing, count) => ({ kind: thing, thing, value: 'roșu', number: N[count ?? 'few'], place: 'lângă copac', source: 'casă', target: 'copac', attribute: 'culoare', amount: 'puțin',
  direction: 'la stânga', topic: 'culoare', criterion: 'mărime', recipient: 'Ana', name: 'prânz', person: 'Ana', shape: 'inimă', arrangement: 'inimă', words: 'blorp', request: 'adaugă o casă',
  key: 'culoare', given: '1', values: 'rotund, pătrat', worlds: 'w.list, w.tasks', why: '-', tier: 'cunoaștere', rel: 'lângă', world: 'w.list', relation: 'lângă', aspect: 'culoare', view: 'hartă' });
const OVERRIDE = { 'make.name': { value: 'Ana' }, 'make.name.place': { value: 'Ana' }, 'make.for': { value: '4' }, 'change.more': { amount: '2' }, 'change.less': { amount: '2' } };
const ro = (t, thing, count) => realise(m, one(t, 'text'), { ...fillersRo(thing, count), ...(OVERRIDE[one(t, 'name')] ?? {}), ...Object.fromEntries(fills.filter((f) => one(f, 'template') === one(t, 'name')).map((f) => [one(f, 'role'), one(f, 'lemma')])) }, { dictionary: dict, base });

test('requests: one to one with w.lang.en\'s act templates (name, act, shape, roles); a number in its CLDR categories', () => {
  const byName = new Map(enTemplates.map((t) => [one(t, 'name'), t]));
  assert.deepEqual([...new Set(requests.map((r) => one(r, 'name')))].sort(), [...byName.keys()].sort());
  for (const r of requests) {
    const e = byName.get(one(r, 'name'));
    for (const k of ['act', 'shape']) assert.equal(one(r, k), one(e, k), `${one(r, 'name')}: ${k}`);
    assert.deepEqual(vals(r, 'role').sort(), vals(e, 'role').sort(), one(r, 'name'));
    const slots = [...one(r, 'text').matchAll(/\{(\w+)/g)].map((x) => x[1]).filter((x) => !fills.some((f) => one(f, 'template') === one(r, 'name') && one(f, 'role') === x));
    for (const s of slots) assert.ok(vals(r, 'role').includes(s), `${one(r, 'name')}: slot ${s}`);
    if (vals(r, 'role').includes('number')) assert.ok(['few', 'other'].includes(one(r, 'count')), one(r, 'name'));
  }
});

test('requests and replies realised with three things of different gender, in every count', () => {
  const bad = [];
  for (const t of [...requests, ...roReplies.filter((w) => w.type === 'w.lang.ro.reply')]) for (const thing of THINGS) {
    const s = ro(t, thing, one(t, 'count'));
    if (!s || /[{}]/.test(s)) bad.push(`${one(t, 'name')} ${one(t, 'count') ?? ''} ${thing}: ${s}`);
  }
  assert.deepEqual(bad, []);
  const reply = (name, count, thing) => ro(roReplies.find((w) => one(w, 'name') === name && one(w, 'count') === count), thing, count);
  assert.equal(reply('done.make', 'one', 'casă'), 'am desenat o casă.');
  assert.equal(reply('done.make', 'one', 'copac'), 'am desenat un copac.');
  assert.equal(reply('done.make', 'few', 'desen'), 'am desenat 3 desene.');
  assert.equal(reply('done.make', 'other', 'casă'), 'am desenat 20 de case.');
  assert.equal(reply('done.make.value', 'few', 'copac'), 'am desenat 3 copaci roșii.');
  assert.equal(reply('done.make.value', 'few', 'desen'), 'am desenat 3 desene roșii.');
  assert.equal(reply('done.make.value', 'one', 'casă'), 'am desenat o casă roșie.');
  assert.equal(reply('done.change', 'one', 'copac'), 'copacul este acum roșu.');
  assert.equal(reply('done.change', 'few', 'casă'), 'cele 3 case sunt acum roșii.');
  assert.equal(reply('done.make.shape', 'one', 'casă'), 'am desenat o casă în formă de inimă.');
  assert.equal(reply('not_understood', 'one', 'casă'), 'nu am înțeles: blorp.');
  assert.equal(reply('refused.cannot_be', 'one', 'casă'), 'casa nu poate fi roșie.');
  assert.equal(reply('refused.no_such', 'one', 'copac'), 'aici nu există un copac.');
  assert.equal(reply('refused.not_a_number', 'one', 'casă'), 'culoarea casei nu este un număr.');
  assert.equal(reply('person.know.none', 'one', 'casă'), 'încă nu știu nimic despre tine.');
  const req = (name, count, thing) => ro(requests.find((w) => one(w, 'name') === name && (one(w, 'count') ?? null) === (count ?? null)), thing, count);
  assert.equal(req('ask.count', null, 'copac'), 'cât de mulți copaci sunt?');
  assert.equal(req('ask.count', null, 'casă'), 'cât de multe case sunt?');
  assert.equal(req('ask.attribute', null, 'casă'), 'care este culoarea casei?');
  assert.equal(req('change.value', null, 'desen'), 'fă desenul roșu.');
});

test('replies: the same names and counts in English and Romanian (English one / other, Romanian one / few / other); English realised', () => {
  const key = (ws, lang) => [...new Set(ws.filter((w) => w.type === `w.lang.${lang}.reply`).map((w) => one(w, 'name')))].sort();
  assert.deepEqual(key(roReplies, 'ro'), key(enReplies, 'en'));
  for (const name of key(enReplies, 'en')) {
    const enCounts = enReplies.filter((w) => one(w, 'name') === name).map((w) => one(w, 'count'));
    const roCounts = roReplies.filter((w) => one(w, 'name') === name).map((w) => one(w, 'count'));
    if (enCounts.includes('other')) assert.deepEqual(roCounts.sort(), ['few', 'one', 'other'], name); else assert.deepEqual(roCounts, ['one'], name);
  }
  const en = (name, count, f) => realiseEn(enAll, one(enReplies.find((w) => one(w, 'name') === name && one(w, 'count') === count), 'text'), f);
  for (const kind of ['house', 'apple', 'tree']) for (const t of enReplies.filter((w) => w.type === 'w.lang.en.reply')) {
    const s = en(one(t, 'name'), one(t, 'count'), { kind, thing: kind, number: one(t, 'count') === 'one' ? '1' : '3', value: 'red', shape: 'heart', target: 'tree', words: 'blorp', request: 'add a house',
      key: 'name', given: '1', values: 'round, square', worlds: 'w.list, w.tasks', why: '-', tier: 'knowledge', rel: 'at', place: 'table', name: 'party', world: 'w.list', relation: 'near', aspect: 'colour', view: 'map' });
    assert.ok(s && !/[{}]/.test(s), `${one(t, 'name')} ${kind}: ${s}`);
  }
  assert.equal(en('done.make', 'one', { kind: 'apple' }), 'I drew an apple.');
  assert.equal(en('done.make', 'other', { kind: 'mouse', number: '3' }), 'I drew 3 mice.');
});

test('requests read back by w.lang.ro\'s frames to their act, where a frame says it', () => {
  const reader = roReader();
  const ACTS = new Set(['make', 'remove', 'change', 'place', 'connect', 'group', 'pick', 'copy', 'send', 'undo', 'redo', 'save', 'load']);
  const bad = [];
  let read = 0;
  for (const t of requests.filter((r) => ACTS.has(one(r, 'act')))) {
    const s = ro(t, 'casă', one(t, 'count'));
    const r = reader.read(s)[0];
    const act = r ? (r.act === 'group' && r.mode === 'apart' ? 'take apart' : r.act) : null;
    if (act === one(t, 'act')) read++; else bad.push(`${one(t, 'name')}: "${s}" -> ${act}`);
  }
  console.log(`# requests read back to their act: ${read}; not: ${bad.join('; ')}`);
  assert.ok(read >= 20, `${read}: ${bad.join('; ')}`);
});
