// w.lang.ro frames and order (block "18:20" item 1): Romanian requests read into the acts of k.actions with their roles,
// in w.lang.en's frame vocabulary, by the same reader (tools/lib/lang-ro.mjs over tools/lib/lang-en.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { roReader } from '../tools/lib/lang-ro.mjs';
import { framesShard, FRAMES, rolesOf } from '../tools/lang-ro-frames.mjs';
import { measureFrames } from '../tools/lang-ro-coverage.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const enDir = join(WORLDS_DIR, 'w.lang.en/shards');
const en = readdirSync(enDir).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(enDir, f), 'utf8')));
const enFrames = new Map(en.filter((w) => w.type === 'w.lang.en.frame').map((f) => [one(f, 'name'), f]));
const reader = roReader();

test('frames: the shard is what tools/lang-ro-frames.mjs writes; each frame says an English frame (same act, mode, roles among its roles)', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.ro/shards/frames.sop'), 'utf8'), framesShard());
  for (const [name, enName, act, mode, , needs, , pattern] of FRAMES) {
    const f = enFrames.get(enName);
    assert.ok(f, `${name}: English frame ${enName}`);
    assert.equal(one(f, 'act'), act, `${name}: act`);
    assert.equal(one(f, 'mode') ?? null, mode, `${name}: mode`);
    assert.equal(one(f, 'needs') ?? null, needs, `${name}: needs`);
    const enRoles = new Set((f.attrs.role ?? []).map(tok));
    for (const r of rolesOf(pattern)) assert.ok(enRoles.has(r), `${name}: role ${r} is a role of ${enName}`);
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

const ROWS = process.env.RO_EN_MEANING ?? '/tmp/wt2/training/eval/ro-en-meaning/rows.jsonl';
test('frames: on PSys2\'s ro-en-meaning set, the share of requests whose act and roles the frames read (skipped without it)', { skip: !existsSync(ROWS) && 'no ro-en-meaning rows' }, () => {
  const rows = readFileSync(ROWS, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const { groups } = measureFrames(rows, reader, en);
  const pct = (g, k) => Math.round(1000 * g[k] / g.rows) / 10;
  for (const [k, g] of Object.entries(groups)) console.log(`# ${k}: ${g.rows} requests; read ${pct(g, 'read')}%, act ${pct(g, 'act')}%, act+roles ${pct(g, 'roles')}%`);
  assert.ok(pct(groups['hand Romanian'], 'roles') >= 35, JSON.stringify(groups));
  assert.ok(pct(groups['machine Romanian'], 'roles') >= 20, JSON.stringify(groups));
});
