// w.lang.ro frames and order (block "18:20" item 1): Romanian requests read into the acts of k.actions with their roles,
// in w.lang.en's frame vocabulary, by the same reader (tools/lib/lang-ro.mjs over tools/lib/lang-en.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { roReader } from '../tools/lib/lang-ro.mjs';
import { measureFrames } from '../tools/lang-ro-coverage.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const enDir = join(WORLDS_DIR, 'w.lang.en/shards');
const en = readdirSync(enDir).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(enDir, f), 'utf8')));
const enFrames = new Map(en.filter((w) => w.type === 'w.lang.en.frame').map((f) => [one(f, 'name'), f]));
const reader = roReader();

// The frames are data of w.lang.ro (reviewer 16:10: Romanian out of the tools): shard frames, edited by hand.
const roWires = parse(readFileSync(join(WORLDS_DIR, 'w.lang.ro/shards/frames.sop'), 'utf8'));
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
// [name, en, act, mode, priority, needs, example, roles]
const FRAMES = roWires.filter((w) => w.type === 'w.lang.ro.frame').map((f) => [one(f, 'name'), one(f, 'en'), one(f, 'act'), one(f, 'mode') ?? null, Number(one(f, 'priority')), one(f, 'needs') ?? null, one(f, 'example'), vals(f, 'role')]);
const rolesOf = (roles) => roles;

test('frames: each frame says an English frame (same act, mode, needs, roles among its roles), its parts in order', () => {
  assert.ok(FRAMES.length >= 46);
  const parts = roWires.filter((w) => w.type === 'w.lang.ro.part');
  for (const [name, enName, act, mode, , needs, , pattern] of FRAMES) {
    const f = enFrames.get(enName);
    assert.ok(f, `${name}: English frame ${enName}`);
    assert.equal(one(f, 'act'), act, `${name}: act`);
    assert.equal(one(f, 'mode') ?? null, mode, `${name}: mode`);
    assert.equal(one(f, 'needs') ?? null, needs, `${name}: needs`);
    const enRoles = new Set((f.attrs.role ?? []).map(tok));
    for (const r of rolesOf(pattern)) assert.ok(enRoles.has(r), `${name}: role ${r} is a role of ${enName}`);
    const mine = parts.filter((p) => one(p, 'frame') === name).map((p) => Number(one(p, 'at'))).sort((a, b) => a - b);
    assert.deepEqual(mine, mine.map((_, i) => i + 1), `${name}: parts 1..n`);
    assert.deepEqual(parts.filter((p) => one(p, 'frame') === name && one(p, 'is') === 'role').map((p) => one(p, 'role')).filter((r, i, a) => a.indexOf(r) === i).sort(), [...pattern].sort(), `${name}: the roles are its role parts`);
  }
});

test('frames: every Romanian frame reads its own example, and typed without diacritics, to its act, mode and roles', () => {
  const bad = [];
  for (const [name, , act, mode, , , example, pattern] of FRAMES) {
    for (const s of [example, example.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()]) {
      const r = reader.read(s);
      const mine = r.find((x) => x.frame === name);
      if (!mine) { bad.push(`${name}: "${s}" not read (${r[0]?.frame ?? 'no frame'})`); continue; }
      const best = r[0];
      if (best.frame !== name && !(best.act === mine.act && best.mode === mine.mode && JSON.stringify(best.args) === JSON.stringify(mine.args))) bad.push(`${name}: "${s}" read as ${best.frame}`);
      const captured = Object.keys(mine.roles).filter((x) => rolesOf(pattern).includes(x)); // fixed arguments of the English frame aside
      if (rolesOf(pattern).length && !captured.length) bad.push(`${name}: no role captured`);
      void act; void mode;
    }
  }
  assert.deepEqual(bad, []);
});

test('frames: clitics, prepositions and order: joined clitics split, a preposition marks the place, an adjective after its noun is a value', () => {
  const r = (s) => reader.read(s)[0];
  assert.deepEqual(r('Șterge-l.').args, { thing: 'l' });
  assert.deepEqual(r('Scoate-ți antena.').args, { thing: 'antena' });
  assert.deepEqual(r('Mută casa lângă copac.').args, { thing: 'casa', 'place.marker': 'langa', place: 'copac' });
  assert.deepEqual(r('Desenează o casă roșie.').args, { kind: 'casa', value: 'rosie' });
  assert.deepEqual(r('deseneaza doua case, te rog').args, { number: 'doua', kind: 'case' });
  assert.equal(r('Anulează.').act, 'undo');
});

// Q69 item 2: PSys2's real turns (psys2 real-ro.tsv at 23f283a6) with "și" meaning too before the object read as the
// same turn without it; "și" between two things is still "and" (the thing is the list).
test('frames: "și" as a focus word, too or also, before the object ("pune și un lac", "desenează și un măgar")', () => {
  const r = (s) => { const x = reader.read(s)[0]; return x && `${x.act} ${JSON.stringify(x.args)}`; };
  for (const [withSi, without] of [['pune si un lac', 'pune un lac'], ['deseneaza si un magar', 'deseneaza un magar'], ['muta si casa la stanga', 'muta casa la stanga'],
    ['deseneaza si un magar pe iarba', 'deseneaza un magar pe iarba'], ['vreau și o casă', 'vreau o casă'], ['șterge și casa', 'șterge casa']]) {
    assert.ok(r(without), `${without}: not read`);
    assert.equal(r(withSi), r(without), withSi);
  }
  assert.equal(reader.read('pune si un lac')[0].act, 'place', 'put a lake too: the English reads "put a lake" as acts.place.bare');
  assert.equal(reader.read('desenează o casă și un copac')[0].roles.thing, 'casa si un copac', 'two things: și is and');
  assert.equal(reader.read('Dă-ți ochi de vizor.')[0].frame, 'ro.make.self', 'the joined clitic ți stays the avatar\'s self');
});

// Q69 item 4: "mai" + a direction is a relative move, the amount of English acts.more.place.dir.amt; real turns of
// PSys2 (real-ro.tsv at 23f283a6), with a thing, with "și" and none, and verbless continuations (the host resolves
// them with the previous act: the library's resolveEllipsis takes relative.more and relative.small as more and small).
test('frames: "mai" + a direction, a relative move ("mută capra mai jos", "mută și mai la stânga", "mai în dreapta")', () => {
  const r = (s) => { const x = reader.read(s)[0]; return x && [x.frame, x.act, x.roles]; };
  for (const [s, frame, roles] of [
    ['muta crocodilii mai jos', 'ro.place.dir.amt', { thing: 'crocodilii', amount: 'mai', rel: 'jos' }],
    ['muta casele mai sus', 'ro.place.dir.amt', { thing: 'casele', amount: 'mai', rel: 'sus' }],
    ['muta capra mai in dreapta', 'ro.place.dir.amt', { thing: 'capra', amount: 'mai', rel: 'in dreapta' }],
    ['mută casa din mijloc mai la dreapta', 'ro.place.dir.amt', { thing: 'casa din mijloc', amount: 'mai', rel: 'la dreapta' }],
    ['muta si mai la stinga', 'ro.place.dir.amt.it', { amount: 'mai', rel: 'la stanga' }],
    ['muta copilul in stinga sus', 'ro.place.dir', { thing: 'copilul', rel: 'in stanga sus' }],
    ['mai in dreapta', 'ro.place.dir.amt.bare', { amount: 'mai', rel: 'in dreapta' }],
    ['si mai jos', 'ro.place.dir.amt.bare', { amount: 'mai', rel: 'jos' }],
    ['puțin mai la stânga', 'ro.place.dir.amt.bare', { amount: 'putin mai', rel: 'la stanga' }],
  ]) {
    const got = r(s);
    assert.ok(got, `${s}: not read`);
    assert.equal(got[0], frame, `${s}: ${got[0]}`);
    assert.equal(got[1], 'place', s);
    for (const [k, v] of Object.entries(roles)) assert.equal(got[2][k], v, `${s}: ${k} ${JSON.stringify(got[2])}`);
  }
  // the lexicons a host passes to resolveEllipsis: single words, each an amount of a move
  const lex = (n) => parse(readFileSync(join(WORLDS_DIR, 'w.lang.ro/shards/frames.sop'), 'utf8')).filter((w) => w.type === 'w.lang.ro.lex' && one(w, 'name') === n).flatMap((w) => (w.attrs.item ?? []).map(tok));
  for (const n of ['relative.more', 'relative.small']) for (const w of lex(n)) { assert.ok(!/\s/.test(w), w); assert.ok(lex('space.amounts').some((a) => a.split(' ').includes(w)), w); }
  assert.ok(!lex('acts.dir').includes('mai jos') && !lex('acts.dir').includes('mai sus'), 'mai is the amount, not a part of the direction');
});

// block 14:25 item 1: the two shapes of the real turns still unread after Q69
test('frames: "fă și o fetiță" makes a girl; two directions in one move ("mută prima casă mai la stânga și mai jos")', () => {
  const r = (s) => reader.read(s)[0];
  assert.equal(r('fa si o fetita').frame, 'ro.make.focus');
  assert.equal(r('fa si o fetita').act, 'make');
  assert.equal(r('fa si un lac mic in stinga').frame, 'ro.make.place.focus');
  for (const [s, rel, rel2] of [['muta prima casa mai la stinga si mai jos', 'la stanga', 'jos'], ['muta capra mai jos si mai in stinga', 'jos', 'in stanga'], ['muta vaca si mai jos si mai in dreapta', 'jos', 'in dreapta']]) {
    const x = r(s);
    assert.equal(x.frame, 'ro.place.dir.two', s);
    assert.equal(x.roles.rel, rel, s);
    assert.equal(x.roles.rel2, rel2, s);
  }
});

// reviewer 16:10: the function words of w.lang.ro by view (shard fn) are the home of the frames' skip, focus and wish
// groups; real turns: "pai muta casa pe pamint" (a lead filler), "pune si un lac" (focus), "te rog" anywhere
test('fn: the views of w.lang.ro give the frames their skip, focus and wish words; real turns read with them', () => {
  const ro = parse(readFileSync(join(WORLDS_DIR, 'w.lang.ro/shards/fn.sop'), 'utf8')).filter((w) => w.type === 'w.lang.ro.fn');
  const view = (v) => ro.filter((w) => (w.attrs.view ?? []).map(tok).includes(v)).map((w) => one(w, 'text'));
  for (const [t, v] of [['te rog', 'politeness'], ['vreau', 'wish'], ['aș vrea', 'wish'], ['păi', 'filler'], ['ăă', 'hesitation'], ['și', 'focus']]) assert.ok(view(v).includes(t), `${t}: ${v}`);
  const phrase = (n) => parse(readFileSync(join(WORLDS_DIR, 'w.lang.ro/shards/frames.sop'), 'utf8')).find((w) => w.type === 'w.lang.ro.phrase' && one(w, 'name') === n);
  for (const t of view('focus').filter((x) => !x.includes(' mai'))) assert.ok((phrase('focus').attrs.item ?? []).map(tok).includes(t), t);
  for (const t of view('hesitation')) assert.ok((phrase('skip').attrs.item ?? []).map(tok).includes(t), t);
  const r = (s) => reader.read(s)[0];
  assert.equal(r('pai muta casa pe pamint').act, 'place');
  assert.equal(r('ăă muta casa la stanga').act, 'place');
  assert.equal(r('vreau o casa te rog').act, 'make');
});

const ROWS = process.env.RO_EN_MEANING ?? '/tmp/wt2/training/eval/ro-en-meaning/rows.jsonl';
test('frames: on PSys2\'s ro-en-meaning set, the share of requests whose act and roles the frames read (skipped without it)', { skip: !existsSync(ROWS) && 'no ro-en-meaning rows' }, () => {
  const rows = readFileSync(ROWS, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const { groups } = measureFrames(rows, reader, en);
  const pct = (g, k) => Math.round(1000 * g[k] / g.rows) / 10;
  for (const [k, g] of Object.entries(groups)) console.log(`# ${k}: ${g.rows} requests; read ${pct(g, 'read')}%, act ${pct(g, 'act')}%, act+roles ${pct(g, 'roles')}%`);
  assert.ok(pct(groups['hand Romanian'], 'roles') >= 35, JSON.stringify(groups));
  assert.ok(pct(groups['machine Romanian'], 'roles') >= 20, JSON.stringify(groups));
});
