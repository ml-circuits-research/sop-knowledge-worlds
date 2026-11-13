// k.layouts (Round 7 addendum 2): named arrangements, anchors on drawable things, what joins what.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { layoutShards, LAYOUTS, handParts, readAnchors, readAnchorPoints, objectNames, readJoins } from '../tools/layouts-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const world = fullWorld('k.layouts', worlds);
const layouts = world.ofType('k.layouts.layout'), slots = world.ofType('k.layouts.slot'), relations = world.ofType('k.layouts.relation');
const anchors = world.ofType('k.layouts.anchor'), joins = world.ofType('k.layouts.joins');
const read = (p) => readFileSync(join(REPO, p), 'utf8');

test('the shards are what tools/layouts-core.mjs gives; the arrangements asked for are there', () => {
  for (const [name, text] of Object.entries(layoutShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.layouts', 'shards', name), 'utf8'), text, name);
  assert.equal(layouts.length, LAYOUTS.length);
  const names = new Set(layouts.map((w) => one(w, 'name')));
  for (const n of ['row', 'column', 'grid', 'ring', 'scatter', 'corners', 'stack', 'tree', 'flow', 'landscape', 'face', 'room', 'family photo']) assert.ok(names.has(n), n);
  for (const w of [...layouts, ...slots, ...relations, ...anchors, ...joins]) assert.deepEqual(w.attrs['core.source'], ['"hand-core 1"'], w.id);
  for (const w of layouts) { assert.ok(w.attrs.usual_for.length >= 4, w.id); assert.ok(tok(w.attrs.about[0]).length > 20, w.id); }
});

test('every arrangement has places and relations between places of its own; a nested arrangement exists', () => {
  const names = new Set(layouts.map((w) => one(w, 'name')));
  const slotsOf = new Map([...names].map((n) => [n, new Map()]));
  for (const s of slots) { assert.ok(names.has(one(s, 'layout')), s.id); slotsOf.get(one(s, 'layout')).set(one(s, 'name'), s); }
  for (const n of names) {
    assert.ok(slotsOf.get(n).size >= 1, `${n}: no place`);
    assert.ok(relations.some((r) => one(r, 'layout') === n), `${n}: no relation`);
    const kind = one(layouts.find((w) => one(w, 'name') === n), 'kind');
    if (kind === 'repeating') assert.ok([...slotsOf.get(n).values()].some((s) => one(s, 'count') === 'many'), `${n}: a repeating arrangement has a place for many`);
  }
  for (const s of slots) {
    for (const a of s.attrs.arranged ?? []) assert.ok(names.has(tok(a)) && tok(a) !== one(s, 'layout'), `${s.id}: arranged ${a}`);
    assert.ok(['x', 'y', 'w', 'h'].every((k) => s.attrs[k]) || ['x', 'y', 'w', 'h'].every((k) => !s.attrs[k]), `${s.id}: a box has x, y, w and h`);
    if (s.attrs.x) assert.ok(Number(one(s, 'x')) + Number(one(s, 'w')) <= 100 && Number(one(s, 'y')) + Number(one(s, 'h')) <= 100, `${s.id}: the box leaves the frame`);
  }
  for (const r of relations) {
    const of = slotsOf.get(one(r, 'layout'));
    assert.ok(of?.has(one(r, 'a')) && of.has(one(r, 'b')), r.id);
    assert.equal(one(r, 'a') === one(r, 'b'), Boolean(r.attrs.among), `${r.id}: "among" goes with one place on both sides`);
    if (r.attrs.among) assert.equal(one(of.get(one(r, 'a')), 'count'), 'many', r.id);
  }
});

test('where two places have boxes, the boxes agree with the relation said between them', () => {
  const box = new Map();
  for (const s of slots) if (s.attrs.x) {
    const [x, y, w, h] = ['x', 'y', 'w', 'h'].map((k) => Number(one(s, k)));
    // The middle of a pair is the middle line of the frame.
    box.set(`${one(s, 'layout')} ${one(s, 'name')}`, { x, y, w, h, cx: one(s, 'pair') === 'true' ? 50 : x + w / 2, cy: y + h / 2 });
  }
  const check = {
    above: (a, b) => a.cy < b.cy, left_of: (a, b) => a.cx < b.cx,
    inside: (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h,
    around: (a, b) => check.inside(b, a),
    on: (a, b) => a.cy < b.cy && a.y + a.h >= b.y - 5 && a.y + a.h <= b.y + b.h,
    beside: (a, b) => a.cy >= b.y && a.cy <= b.y + b.h && (a.x + a.w / 2 <= b.x || a.x + a.w / 2 >= b.x + b.w),
    aligned_row: (a, b) => Math.abs(a.cy - b.cy) <= 5, aligned_column: (a, b) => Math.abs(a.cx - b.cx) <= 5,
    same_size: (a, b) => a.w === b.w && a.h === b.h, smaller_than: (a, b) => a.w * a.h < b.w * b.h,
  };
  let checked = 0;
  for (const r of relations) {
    const a = box.get(`${one(r, 'layout')} ${one(r, 'a')}`), b = box.get(`${one(r, 'layout')} ${one(r, 'b')}`);
    if (!a || !b || one(r, 'a') === one(r, 'b') || !check[one(r, 'rel')]) continue;
    assert.ok(check[one(r, 'rel')](a, b), `${r.id}: the boxes say otherwise`);
    checked++;
  }
  assert.ok(checked >= 45, `${checked} relations checked against boxes`);
});

test('the face arrangement has the places of k.faces (style plain), with their boxes; "behind" agrees with the draw order', () => {
  const faces = fullWorld('k.faces', worlds).ofType('k.faces.slot').filter((w) => one(w, 'style') === 'plain');
  const mine = slots.filter((s) => one(s, 'layout') === 'face');
  assert.equal(mine.length, faces.length);
  const z = new Map();
  for (const f of faces) {
    const s = mine.find((m) => one(m, 'name') === one(f, 'name'));
    assert.ok(s, one(f, 'name'));
    for (const k of ['x', 'y', 'w', 'h']) assert.equal(one(s, k), one(f, k), `${s.id} ${k}`);
    assert.equal(one(s, 'pair') === 'true', one(f, 'mirror') === 'true', s.id);
    assert.equal(one(s, 'optional') === 'true', one(f, 'optional') === 'true', s.id);
    z.set(one(f, 'name'), Number(one(f, 'z')));
  }
  for (const r of relations.filter((x) => one(x, 'layout') === 'face' && one(x, 'rel') === 'behind')) assert.ok(z.get(one(r, 'a')) < z.get(one(r, 'b')), r.id);
});

test('anchors: on an object, inside its frame, with what goes there; with a part, inside that part of a hand-written object; the audits cover the tables', () => {
  const parts = handParts(), objects = objectNames();
  assert.ok(anchors.length >= 200, `${anchors.length} anchors`);
  for (const a of anchors) {
    const [x, y, w, h] = ['x', 'y', 'w', 'h'].map((k) => Number(one(a, k)));
    assert.ok(objects.has(one(a, 'of')), `${a.id}: no object`);
    if (a.attrs.part) {
      const p = parts.get(one(a, 'of'))?.get(one(a, 'part'));
      assert.ok(p, `${a.id}: part ${one(a, 'part')}`);
      assert.ok(x >= p.x - 0.1 && y >= p.y - 0.1 && x + w <= p.x + p.w + 0.1 && y + h <= p.y + p.h + 0.1, `${a.id}: outside its part`);
    }
    assert.ok(x + w <= 100 && y + h <= 100, a.id);
    assert.deepEqual(a.attrs.named, ['model'], a.id);
    assert.ok(one(a, 'kind') === 'base' ? a.attrs.on?.length && !a.attrs.holds : !a.attrs.on, `${a.id}: a base says what it is on; another anchor what it holds`);
  }
  const of = (object, name) => anchors.find((a) => one(a, 'of') === object && one(a, 'name') === name);
  assert.deepEqual(['x', 'y', 'w', 'h'].map((k) => one(of('table', 'surface'), k)), ['5', '35', '90', '0']);
  assert.deepEqual(['x', 'y', 'w', 'h'].map((k) => one(of('person', 'left_hand'), k)), ['30', '55', '0', '0']);
  assert.ok(Number(one(of('person', 'head_top'), 'y')) < Number(one(of('person', 'left_hand'), 'y')));
  for (const [object, kind] of [['chair', 'seat'], ['swing', null], ['lake', 'water'], ['house', 'roof'], ['cup', 'handle'], ['person', 'hand'], ['hat', 'base']]) {
    if (kind) assert.ok(anchors.some((a) => one(a, 'of') === object && one(a, 'kind') === kind), `${object}: ${kind}`);
  }
  // The audit: one row for every row first written; a wrong one is no longer as it was, an unclear one is gone.
  const audit = read('sources/hand-core/anchors-audit.tsv').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  const now = new Map(readAnchors(read('sources/hand-core/anchors.tsv')).map((a) => [`${a.object} ${a.name}`, a]));
  for (const [, object, name, kind, part, at, verdict, note] of audit) {
    const a = now.get(`${object} ${name}`);
    assert.ok(['right', 'wrong', 'unclear'].includes(verdict), `${object} ${name}`);
    if (verdict === 'right') assert.deepEqual([a?.kind, a?.part, a?.at], [kind, part, at], `${object} ${name}`);
    if (verdict === 'wrong') { assert.ok(note && a, `${object} ${name}`); assert.notDeepEqual([a.kind, a.part, a.at], [kind, part, at], `${object} ${name} is still as it was`); }
    if (verdict === 'unclear') assert.equal(a, undefined, `${object} ${name}`);
  }
  for (const key of now.keys()) assert.ok(audit.some((r) => `${r[1]} ${r[2]}` === key), `${key} was not looked at`);
  // Round 9: the anchors given as places in the frame, and their audit.
  const points = new Map(readAnchorPoints(read('sources/hand-core/anchor-points.tsv')).map((a) => [`${a.object} ${a.name}`, a]));
  const pointAudit = read('sources/hand-core/anchor-points-audit.tsv').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  for (const [, object, name, kind, x, y, w, h, verdict, note] of pointAudit) {
    const a = points.get(`${object} ${name}`), was = [kind, ...[x, y, w, h].map(Number)];
    assert.ok(['right', 'wrong', 'unclear'].includes(verdict), `${object} ${name}`);
    if (verdict === 'right') assert.deepEqual([a?.kind, ...(a?.box ?? [])], was, `${object} ${name}`);
    if (verdict === 'wrong') { assert.ok(note && a, `${object} ${name}`); assert.notDeepEqual([a.kind, ...a.box], was, `${object} ${name} is still as it was`); }
    if (verdict === 'unclear') assert.equal(a, undefined, `${object} ${name}`);
  }
  for (const key of points.keys()) assert.ok(pointAudit.some((r) => `${r[1]} ${r[2]}` === key), `${key} was not looked at`);
  for (const [object, kind] of [['swing', 'seat'], ['bench', 'seat'], ['bed', 'surface'], ['horse', 'seat'], ['bookcase', 'surface'], ['tree', 'hook'], ['roof', 'roof'], ['car', 'surface'], ['boat', 'surface'], ['bicycle', 'seat'], ['table', 'surface'], ['shelf', 'surface'], ['person', 'top'], ['person', 'hand'], ['person', 'base']]) {
    assert.ok(anchors.some((a) => one(a, 'of') === object && one(a, 'kind') === kind), `${object}: ${kind}`);
  }
  assert.throws(() => readAnchorPoints('swing\tseat\tseat\t42\t61\t80\t0\tchild\n'), /not in the frame/);
  assert.throws(() => readAnchorPoints('no such thing\tseat\tseat\t42\t61\t20\t0\tchild\n'), /no object/);
  assert.throws(() => readAnchorPoints('swing\tseat\tseat\t42\t61\t20\t0\t\n'), /what goes there/);
  assert.throws(() => readAnchors('chair\tseat\tseat\tcushion\ttop\tperson\n'), /no part cushion/);
  assert.throws(() => readAnchors('chair\tseat\tperch\tseat\ttop\tperson\n'), /kind perch/);
});

test('Round 9: what another thing is usually on or in, in k.scenes, has an anchor on its drawing (but for a named few)', () => {
  const scenes = fullWorld('k.scenes', worlds), objects = objectNames();
  const anchored = new Set(anchors.map((a) => one(a, 'of')));
  const BODY = { head: 'person', hand: 'person', foot: 'person' }; // the top of the head, the hands and the feet of the person
  const drawing = new Map(scenes.ofType('k.scenes.has').map((w) => [`${one(w, 'scene')}\t${one(w, 'thing')}`, one(w, 'drawing')]));
  const without = new Set();
  let facts = 0, held = 0;
  for (const w of [...scenes.ofType('k.scenes.has'), ...scenes.ofType('k.scenes.thing')]) for (const raw of w.attrs.on ?? []) {
    const on = tok(raw);
    const d = w.type === 'k.scenes.has' ? (drawing.get(`${one(w, 'scene')}\t${on}`) ?? (objects.has(on) ? on : null)) : (BODY[on] ?? (objects.has(on) ? on : null));
    facts++;
    if (anchored.has(d)) held++; else without.add(on);
  }
  // No drawing: pirate ship, stall, ceiling. A drawing that shows no sure place: cot, witch.
  assert.deepEqual([...without].sort(), ['ceiling', 'cot', 'pirate ship', 'stall', 'witch']);
  assert.ok(held >= facts * 0.97, `${held} of ${facts}`);
});

test('what joins what: the examples asked for; no kind joins itself; a part of a hand-written object is a part of its drawing', () => {
  const has = (a, rel, b) => joins.some((j) => one(j, 'a') === a && one(j, 'rel') === rel && one(j, 'b') === b);
  for (const [a, rel, b] of [['roof', 'attaches_to', 'wall'], ['wheel', 'part_of', 'car'], ['hat', 'sits_on', 'head'], ['arrow', 'connects', 'box'], ['arrow', 'attaches_to', 'box']]) assert.ok(has(a, rel, b), `${a} ${rel} ${b}`);
  assert.ok(joins.length >= 150, `${joins.length} joins`);
  for (const j of joins) { assert.notEqual(one(j, 'a'), one(j, 'b'), j.id); assert.deepEqual(j.attrs.named, ['model'], j.id); }
  // "a part_of b" where b is a hand-written drawing: count those whose drawing has a part of that name or kind.
  const parts = handParts();
  const partOf = joins.filter((j) => one(j, 'rel') === 'part_of' && parts.has(one(j, 'b')));
  const found = partOf.filter((j) => [...parts.get(one(j, 'b')).keys()].some((p) => p === one(j, 'a') || p.endsWith(`_${one(j, 'a')}`) || p.startsWith(`${one(j, 'a')}_`)));
  assert.ok(partOf.length >= 20 && found.length >= partOf.length * 0.6, `${found.length} of ${partOf.length} part_of facts are parts of the drawing`);
  assert.throws(() => readJoins('roof\tglued_to\twall\ttop\n'), /rel/);
  assert.throws(() => readJoins('roof\tpart_of\troof\t\n'), /two different kinds/);
});

test('other names reach the arrangement through the vocabulary index', () => {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  for (const word of ['queue', 'pile', 'circle', 'flowchart', 'hierarchy', 'scenery', 'matrix', 'group photo', 'scattered']) assert.ok(vocab[word]?.includes('k.layouts/shards/layouts'), word);
});
