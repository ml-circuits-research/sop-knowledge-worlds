// What holds a thing up in a picture and what it keeps out of (k.scenes.support), and which parts of the drawable
// things are surfaces (k.scenes.surface): owner, 2026-11-20 ("you put a house in the middle of the river").
//   node tools/support-core.mjs [--check]   writes docs/worlds/k.scenes/shards/support.sop
// The place rows hold for every thing of a k.scenes place (ground things stand on the ground and keep out of water, off
// roads and out of the sky of a view; water things are on the water; sky things in the air, out of the ground). The thing rows are derived, not listed: every
// k.scenes thing whose place is the ground and that is a wheeled vehicle, a motor vehicle or public transport by the
// kind parents of k.kinds (dimension=kind, followed up the tree; a thing with wheels by its feature parent and a
// vehicle by kind), except what runs on rails, is on the road. The surfaces are the water, road, ground and sky parts
// of the terrain features of k.layouts (shards/terrain.sop) and of the water anchors of k.layouts (the water of a sea).
// The lights (k.scenes.light) are the things in the sky that shine (k.attributes can=shine): the sun, the moon, a star.
// Deterministic: the same shards give the same file.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WORLDS = join(import.meta.dirname, '..', 'docs', 'worlds');
const SRC = 'core.source="hand-core 1"';
const unq = (s) => s.replace(/^"|"$/g, '');
const atom = (s) => (/^[a-z][a-z0-9_]*$/.test(s) ? s : JSON.stringify(s));
const ident = (s) => s.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const lines = (dir) => readdirSync(dir).sort().flatMap((f) => readFileSync(join(dir, f), 'utf8').split('\n'));

// The kind parents (dimension=kind) and the things with wheels (a feature parent).
const parents = new Map(), wheeled = new Set();
for (const line of lines(join(WORLDS, 'k.kinds', 'shards'))) {
  const m = line.match(/ k\.kinds\.parent name=("[^"]*"|\S+) is_a=("[^"]*"|\S+) dimension=(\w+)/);
  if (!m) continue;
  const [a, b] = [unq(m[1]), unq(m[2])];
  if (m[3] === 'kind') (parents.get(a) ?? parents.set(a, new Set()).get(a)).add(b);
  if (b === 'thing with wheels') wheeled.add(a);
}
const ancestors = (name) => { const seen = new Set(), todo = [name]; while (todo.length) for (const p of parents.get(todo.pop()) ?? []) if (!seen.has(p)) { seen.add(p); todo.push(p); } return seen; };
const places = new Map();
for (const line of lines(join(WORLDS, 'k.scenes', 'shards'))) {
  const m = line.match(/ k\.scenes\.thing name=("[^"]*"|\S+) place=(\w+)/);
  if (m) places.set(unq(m[1]), m[2]);
}
const RAILS = ['rail vehicle', 'train', 'locomotive'];
const onRoad = [...places.keys()].filter((name) => {
  if (places.get(name) !== 'ground') return false;
  const up = ancestors(name);
  if (RAILS.some((r) => r === name || up.has(r))) return false;
  const vehicle = ['vehicle', 'motor vehicle', 'wheeled vehicle', 'public transport'].some((v) => up.has(v));
  return up.has('motor vehicle') || up.has('public transport') || (wheeled.has(name) && vehicle);
}).sort();

// Surfaces: the terrain parts that are water, road, ground or sky, and the water anchors of drawn objects.
const SURFACE_OF_PART = { water: 'water', surface: 'road', ground_far: 'ground', ground_middle: 'ground', ground_near: 'ground', sky_high: 'air', sky_middle: 'air', sky_low: 'air' };
const surfaces = [];
for (const line of readFileSync(join(WORLDS, 'k.layouts', 'shards', 'terrain.sop'), 'utf8').split('\n')) {
  const m = line.match(/ k\.layouts\.terrain_part of=("[^"]*"|\S+) name=(\S+) /);
  if (m && SURFACE_OF_PART[m[2]]) surfaces.push([unq(m[1]), m[2], SURFACE_OF_PART[m[2]]]);
}
const terrain = new Set(surfaces.map(([of]) => of));
for (const line of lines(join(WORLDS, 'k.layouts', 'shards'))) {
  const m = line.match(/ k\.layouts\.anchor of=("[^"]*"|\S+) name=(\S+) kind=water /);
  if (m && !terrain.has(unq(m[1]))) surfaces.push([unq(m[1]), m[2], 'water']);
}

// The lights of a landscape: things in the sky that shine (k.attributes can=shine), by their k.scenes place.
const shining = new Set();
for (const line of lines(join(WORLDS, 'k.attributes', 'shards'))) {
  const m = line.match(/ k\.attributes\.thing name=("[^"]*"|\S+) .*\bcan=(shine|glow)\b/);
  if (m) shining.add(unq(m[1]));
}
const lights = [...shining].filter((name) => places.get(name) === 'sky').sort();

const out = [
  '# k.scenes/shards/support: what holds a thing up in a picture and what it keeps out of, and which parts of drawable',
  '# things are surfaces (owner, 2026-11-20). The place rows hold for every thing of that place; the thing rows are',
  `# derived from k.kinds (${onRoad.length} ground things that are wheeled or motor vehicles or public transport, not on rails, are on the road).`,
  '# sources: hand-core 1 (hand-written in this repository; the thing rows derived from k.kinds and k.scenes)',
  '# license: CC0-1.0',
  '# script: tools/support-core.mjs',
  '',
  '# Every thing of a place.',
  `@k.scenes.support.ground k.scenes.support name=ground on=ground avoids=water avoids=road avoids=air ${SRC}`,
  `@k.scenes.support.water k.scenes.support name=water on=water avoids=road avoids=air ${SRC}`,
  `@k.scenes.support.sky k.scenes.support name=sky on=air avoids=ground ${SRC}`,
  '',
  '# Ground things that drive: on the road where there is one (they keep out of the water as every ground thing does).',
  ...onRoad.map((name) => `@k.scenes.support.thing.${ident(name)} k.scenes.support name=${atom(name)} on=road ${SRC}`),
  '',
  '# A bridge stands over water and roads.',
  `@k.scenes.support.thing.bridge k.scenes.support name=bridge on=water on=road ${SRC}`,
  '',
  '# Lights: things in the sky that shine (k.attributes can=shine).',
  ...lights.map((name) => `@k.scenes.light.${ident(name)} k.scenes.light name=${atom(name)} ${SRC}`),
  '',
  '# Surfaces: the parts of terrain features and the water anchors of drawn objects.',
  ...surfaces.map(([of, part, surface]) => `@k.scenes.surface.${ident(of)}.${ident(part)} k.scenes.surface of=${atom(of)} part=${part} surface=${surface} ${SRC}`),
];
const file = join(WORLDS, 'k.scenes', 'shards', 'support.sop'), text = out.join('\n') + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(file, 'utf8') !== text) { console.error('stale: ' + file); process.exit(1); }
} else writeFileSync(file, text);
console.log(`support.sop: ${onRoad.length} things on the road, ${lights.length} lights, ${surfaces.length} surfaces`);
