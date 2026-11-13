// k.faces: the hand-written core is what tools/faces-core.mjs gives; every variant is drawable from its facts and
// lies inside the box of its slot; presets and expressions name variants that exist; any combination composes;
// the previews are up to date.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fullWorld, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { SHAPES } from '../tools/render-svg.mjs';
import { coreShards, SLOTS, STYLE } from '../tools/faces-core.mjs';
import { indexOf, composeFace, presetFace, randomFace, renderAll, RANDOM_FACES, COLOUR_KEYS } from '../tools/render-faces.mjs';

const world = fullWorld('k.faces');
const idx = indexOf(world);
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);

test('the core shards on disk are what tools/faces-core.mjs gives', () => {
  for (const [name, text] of Object.entries(coreShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.faces', 'shards', name), 'utf8'), text, name);
});

test('the style plain has the sixteen slots, at least six variants each, ten for hair, eyes and mouth', () => {
  const slots = idx.slots.get(STYLE);
  assert.deepEqual(slots.map((s) => s.name).sort(), SLOTS.map((s) => s[0]).sort());
  assert.equal(slots.length, 16);
  assert.deepEqual(slots.filter((s) => s.mirror).map((s) => s.name).sort(), ['cheeks', 'earrings', 'ears', 'eyebrows', 'eyes']);
  for (const s of slots) {
    const n = idx.variants.filter((v) => v.style === STYLE && v.slot === s.name).length;
    assert.ok(n >= (['hair_front', 'eyes', 'mouth'].includes(s.name) ? 10 : 6), `${s.name}: ${n} variants`);
  }
});

test('every variant is drawable from its facts and lies inside the box of its slot', () => {
  assert.ok(idx.variants.length >= 100);
  for (const v of idx.variants) {
    const slot = idx.slots.get(v.style)?.find((s) => s.name === v.slot);
    assert.ok(slot, `${v.id}: no slot ${v.slot} in the style ${v.style}`);
    const parts = idx.parts.get(`${v.slot}\t${v.name}`);
    assert.ok(parts?.length >= 1, `${v.id}: no parts`);
    assert.equal(new Set(parts.map((p) => p.name)).size, parts.length, `${v.id}: part names are unique`);
    for (const p of parts) {
      const at = `${v.id}.${p.name}`;
      assert.ok(SHAPES.includes(p.shape), at);
      for (const k of ['x', 'y', 'w', 'h', 'z']) assert.ok(Number.isFinite(p[k]), `${at}: ${k}`);
      assert.ok(p.x >= slot.x - 0.11 && p.y >= slot.y - 0.11 && p.x + p.w <= slot.x + slot.w + 0.11 && p.y + p.h <= slot.y + slot.h + 0.11, `${at}: outside the box of the slot ${slot.name}`);
      if (p.shape === 'circle' || p.shape === 'square') assert.ok(Math.abs(p.w - p.h) < 0.11, `${at}: a ${p.shape} has w = h`);
      if (p.shape === 'line' || p.shape === 'polygon') {
        assert.ok(p.points.length >= (p.shape === 'line' ? 2 : 3), `${at}: too few points`);
        assert.deepEqual(p.points.map((q) => q.n), p.points.map((_, i) => i + 1), `${at}: points numbered 1..n`);
        const xs = p.points.map((q) => q.x), ys = p.points.map((q) => q.y);
        [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].forEach((b, i) => assert.ok(Math.abs(b - [p.x, p.y, p.w, p.h][i]) < 0.11, `${at}: box is not the bounds of its points`));
      } else assert.equal(p.points.length, 0, `${at}: only lines and polygons have points`);
      if (p.rgb) assert.match(p.rgb, /^#[0-9A-F]{6}$/, at);
    }
    assert.ok(composeFace(world, { style: v.style, pick: { [v.slot]: v.name } }).length >= parts.length);
  }
});

test('colours: natural skin, hair and eye colours with names, each with a shade', () => {
  const of = (o, natural) => [...idx.colours.values()].filter((c) => c.of === o && (natural === undefined || c.natural === natural));
  assert.ok(of('skin', true).length >= 6 && of('hair', true).length >= 8 && of('eyes', true).length >= 6 && of('clothes').length >= 8);
  for (const c of idx.colours.values()) { assert.match(c.rgb, /^#[0-9A-F]{6}$/, c.name); assert.match(c.shade, /^#[0-9A-F]{6}$/, c.name); }
});

test('presets name a variant of their style for every slot they fill, and four colours', () => {
  assert.ok(idx.presets.length >= 12);
  for (const p of idx.presets) {
    for (const slot of idx.slots.get(p.style)) {
      const name = p.attrs[slot.name]?.[0];
      if (name === undefined) { assert.ok(slot.optional || ['ears', 'neck', 'eyebrows', 'nose', 'shoulders'].includes(slot.name), `${p.name}: ${slot.name} is missing`); continue; }
      assert.ok(idx.variants.some((v) => v.style === p.style && v.slot === slot.name && v.name === tok(name)), `${p.name}: ${slot.name}=${name}`);
    }
    for (const [key, o] of Object.entries(COLOUR_KEYS)) assert.ok(idx.colours.has(`${o}\t${tok(p.attrs[key][0])}`), `${p.name}: ${key}`);
    assert.ok(composeFace(world, presetFace(world, p.name)).length > 5, p.name);
  }
  for (const name of ['child', 'woman', 'man', 'old woman', 'old man', 'robot']) assert.ok(idx.presets.some((p) => p.name === name), name);
});

test('expressions switch to variants that exist; talking is a pair of mouths; wink closes one eye', () => {
  assert.deepEqual(idx.expressions.map((e) => e.name).sort(), ['angry', 'happy', 'sad', 'sleepy', 'surprised', 'talking', 'wink']);
  const slotOf = { mouth: 'mouth', mouth_alt: 'mouth', eyebrows: 'eyebrows', eyes: 'eyes', one_eye: 'eyes' };
  for (const e of idx.expressions) {
    for (const [key, slot] of Object.entries(slotOf)) for (const name of e.attrs[key] ?? []) assert.ok(idx.variants.some((v) => v.style === e.style && v.slot === slot && v.name === tok(name)), `${e.name}: ${key}=${name}`);
    for (const p of idx.presets.filter((x) => x.style === e.style)) assert.ok(composeFace(world, presetFace(world, p.name, e.name)).length > 5);
  }
  const talking = idx.expressions.find((e) => e.name === 'talking');
  assert.ok(talking.attrs.mouth && talking.attrs.mouth_alt);
  const wink = presetFace(world, 'woman', 'wink');
  assert.equal(wink.oneEye, 'closed');
  assert.notEqual(wink.pick.eyes, 'closed');
});

test('a seeded random face is the same every time, fills every slot that is not optional, and composes', () => {
  assert.deepEqual(randomFace(world, 7), randomFace(world, 7));
  for (let seed = 1; seed <= RANDOM_FACES; seed++) {
    const face = randomFace(world, seed);
    for (const slot of idx.slots.get(STYLE)) if (!slot.optional) assert.ok(face.pick[slot.name], `seed ${seed}: ${slot.name}`);
    assert.ok(composeFace(world, face).length > 5);
  }
});

test('the previews in docs/worlds/k.faces/preview are what the renderer draws now', () => {
  const files = renderAll(world);
  const dir = join(WORLDS_DIR, 'k.faces', 'preview');
  assert.deepEqual(readdirSync(dir).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
});

// R6.4: the questions the world must answer (see also tests/k.faces.questions.jsonl).
import { findVariants, presetDifference } from '../tools/render-faces.mjs';

test('"which mouths are there": the variants of the slot mouth', () => {
  const a = world.query({ type: 'k.faces.variant', where: { slot: 'mouth', style: 'plain' }, seek: 'name', mode: 'list' });
  assert.equal(a.status, 'supported');
  assert.ok(a.values.length >= 10);
  for (const m of ['smile', 'sad', 'open', 'neutral']) assert.ok(a.values.includes(m), m);
});

test('"a long face with small eyes and thick eyebrows": the variants whose features match, ranked by how many match', () => {
  assert.equal(findVariants(world, 'head', { shape: 'long' })[0].name, 'long');
  assert.deepEqual(findVariants(world, 'eyes', { size: 'small' }).map((v) => v.name), ['dot']);
  assert.deepEqual(findVariants(world, 'eyebrows', { feel: 'thick' }).map((v) => v.name), ['bushy', 'thick', 'thick arched']);
  // More features: the variant that matches both comes first, then those that match one.
  const brows = findVariants(world, 'eyebrows', { feel: ['thick', 'arched'] });
  assert.deepEqual(brows[0], { name: 'thick arched', matched: ['feel=thick', 'feel=arched'] });
  assert.ok(brows.slice(1).every((v) => v.matched.length === 1));
  assert.deepEqual(brows.map((v) => v.name).sort(), ['arched', 'bushy', 'raised', 'thick', 'thick arched']);
  const hair = findVariants(world, 'hair_back', { length: 'long', feel: 'curly' });
  assert.equal(hair[0].name, 'long curly');
  assert.deepEqual(findVariants(world, 'hat', { kind: 'top hat' }).map((v) => v.name), ['top hat']);
  assert.deepEqual(findVariants(world, 'mouth', { shape: 'heart' }), []);
  // The face assembled from the best matches composes.
  const pick = { head: findVariants(world, 'head', { shape: 'long' })[0].name, eyes: findVariants(world, 'eyes', { size: 'small' })[0].name, eyebrows: brows[0].name, mouth: 'neutral' };
  assert.ok(composeFace(world, { style: 'plain', pick }).length >= 5);
});

test('"what is the difference between the woman and the old woman": the keys where two presets differ', () => {
  const d = presetDifference(world, 'woman', 'old woman');
  const byKey = Object.fromEntries(d.map((x) => [x.key, x]));
  assert.deepEqual(byKey.hair_colour, { key: 'hair_colour', woman: 'dark brown', 'old woman': 'white' });
  assert.deepEqual(byKey.glasses, { key: 'glasses', woman: null, 'old woman': 'small round' });
  assert.deepEqual(byKey.cheeks, { key: 'cheeks', woman: null, 'old woman': 'wrinkles' });
  assert.ok(!('head' in byKey) && !('style' in byKey), 'both have an oval head and the same style');
  assert.deepEqual(presetDifference(world, 'man', 'man'), []);
});
