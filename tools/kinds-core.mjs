// k.kinds: the "up" edges of the catalog as facts (reviewer 21:55, owner 15:03: the abstraction space is a layered
// graph, not a tree; a thing has several parents on several dimensions). Every edge is one fact
// `k.kinds.parent name=<thing> is_a=<parent> dimension=<d>` with the fact it is read from (`from` a type, `key`,
// `value`; `group` for a drawing's source group) and that fact's source, so a share-alike or WordNet fact stays in a
// shard of its own licence. Nothing is typed by hand per thing: the edges are read off
//   - kind:     k.animals class, k.attributes kind, k.food kind, k.body kind, k.space kind, k.wearables kind,
//               k.people role is and group; the WordNet hypernyms already imported in k.words (the sense of a
//               name is the first noun sense under the root of the sense the catalog gives the name, joins.mjs);
//               the group a drawing's source filed it in (k.objects shards, a table of groups below);
//   - place:    the habitat of an animal (a cow lives on a farm: a farm animal);
//   - feature:  legs and covering of an animal, wheels (k.attributes, k.parts), an engine or a motor (k.parts: a
//               machine), wings;
//   - use:      what a thing is used for (k.attributes used_for), where a wearable is worn (k.wearables worn_on);
//   - material: what a thing is made of (k.attributes material);
//   - diet:     what an animal eats (k.animals diet: a herbivore).
// The parents that are made here (farm animal, thing with wheels, road vehicle) get their own parents (shard
// `classes`), so the graph goes up 2-3 layers from every thing. The `is_a` of the worlds that extend k.kinds.kind
// (k.commonsense, k.people kind and role, k.shapes) are already up edges in their own worlds and are not copied: the
// graph is k.kinds.parent plus those is_a (docs/worlds/k.kinds/WORLD.md).
//   node tools/kinds-core.mjs     writes docs/worlds/k.kinds/shards/*.sop and docs/worlds/k.kinds/PARENTS.md
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, readHeader } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText, splitParts } from './import/lib.mjs';

export const PARENTS_PAGE = join(WORLDS_DIR, 'k.kinds', 'PARENTS.md');
export const DIMENSIONS = ['kind', 'place', 'feature', 'use', 'material', 'diet'];
const HAND = 'hand-core 1';

// The facts of some types, read from the shard lines (keys with their values, strings unquoted), with their shard.
export function readFacts(types, worlds) {
  const want = new Set(types), out = Object.fromEntries(types.map((t) => [t, []]));
  for (const w of worlds) for (const s of w.shards) {
    if (w.id === 'k.kinds') continue;
    for (const line of s.text.split('\n')) {
      if (!line.startsWith('@')) continue;
      const sp = line.indexOf(' '), sp2 = line.indexOf(' ', sp + 1);
      const type = line.slice(sp + 1, sp2 < 0 ? undefined : sp2);
      if (!want.has(type)) continue;
      const attrs = {};
      for (const m of line.slice(sp2).matchAll(/([A-Za-z_.]+)=("(?:[^"\\]|\\.)*"|\S+)/g)) (attrs[m[1]] ??= []).push(m[2].startsWith('"') ? JSON.parse(m[2]) : m[2]);
      out[type].push({ id: line.slice(1, sp), shard: s, attrs });
    }
  }
  return out;
}

// The group a drawing's source filed it in (the k.objects shard name without its number) -> the kind it names.
// Groups that mix kinds (nature, land, sky, more, things, a place symbol, a coarse Unicode group) name none.
export const GROUPS = {
  animals: 'animal', buildings: 'building', food: 'food', home: 'household item', household: 'household item', plants: 'plant', structures: 'structure', vehicles: 'vehicle',
  'mulberry-animal-birds': 'bird', 'mulberry-animal-crustacean-and-molluscs': 'invertebrate', 'mulberry-animal-fish-and-marine-mammals': 'water animal',
  'mulberry-animal-mammal': 'mammal', 'mulberry-animal-other-invertebrates': 'invertebrate', 'mulberry-animal-reptiles-and-amphibians': 'vertebrate',
  'mulberry-animal-spiders-and-insects': 'arthropod', 'mulberry-art-making': 'art supply', 'mulberry-building-contents': 'household item',
  'mulberry-building-equipment-and-devices': 'device', 'mulberry-building-furniture': 'furniture', 'mulberry-building-public': 'building',
  'mulberry-building-residential': 'building', 'mulberry-building-shop': 'building', 'mulberry-building-structure': 'structure',
  'mulberry-celebration-item': 'celebration item', 'mulberry-clothes-accessories': 'accessory', 'mulberry-clothes-general': 'clothing',
  'mulberry-clothes-jewellery': 'jewellery', 'mulberry-clothes-sport': 'sportswear', 'mulberry-drink-type': 'drink',
  'mulberry-electrical-computer': 'computer equipment', 'mulberry-electrical-general': 'electrical device', 'mulberry-electrical-media': 'electrical device',
  'mulberry-electrical-phone': 'electrical device', 'mulberry-electrical-tv': 'electrical device', 'mulberry-food-breads-and-baking': 'baked goods',
  'mulberry-food-dairy': 'dairy product', 'mulberry-food-eggs': 'food', 'mulberry-food-fish-and-seafood': 'seafood', 'mulberry-food-fruit': 'fruit',
  'mulberry-food-ingredients': 'ingredient', 'mulberry-food-kitchen-items': 'kitchen utensil', 'mulberry-food-meals-and-snacks': 'dish',
  'mulberry-food-meat': 'meat', 'mulberry-food-nuts': 'nut', 'mulberry-food-pastas-and-rice': 'food', 'mulberry-food-poultry': 'poultry',
  'mulberry-food-sweets-and-desserts': 'dessert', 'mulberry-food-vegetables-and-salad': 'vegetable', 'mulberry-food-vegetables-and-salads': 'vegetable',
  'mulberry-healthcare-grooming-items': 'toiletry', 'mulberry-healthcare-medical-items': 'medical supply', 'mulberry-leisure-games': 'game',
  'mulberry-leisure-playground': 'playground equipment', 'mulberry-leisure-toys': 'toy', 'mulberry-money': 'money', 'mulberry-music-instrument': 'musical instrument',
  'mulberry-plants-and-trees': 'plant', 'mulberry-science': 'science equipment', 'mulberry-sport-accessories': 'sports equipment',
  'mulberry-tools-garden': 'garden tool', 'mulberry-tools-workshop': 'tool', 'mulberry-transport-air': 'aircraft', 'mulberry-transport-rail': 'rail vehicle',
  'mulberry-transport-road': 'road vehicle', 'mulberry-transport-space': 'spacecraft', 'mulberry-transport-water': 'watercraft',
  'mulberry-work-and-school-stationery': 'stationery',
  'noto-animal-amphibian': 'amphibian', 'noto-animal-bird': 'bird', 'noto-animal-bug': 'invertebrate', 'noto-animal-mammal': 'mammal', 'noto-animal-marine': 'water animal',
  'noto-animal-reptile': 'reptile', 'noto-arts-crafts': 'art supply', 'noto-award-medal': 'award', 'noto-clothing': 'clothing', 'noto-computer': 'computer equipment',
  'noto-dishware': 'tableware', 'noto-drink': 'drink', 'noto-event': 'celebration item', 'noto-food-asian': 'dish', 'noto-food-fruit': 'fruit', 'noto-food-prepared': 'dish',
  'noto-food-sweet': 'dessert', 'noto-food-vegetable': 'vegetable', 'noto-game': 'game', 'noto-household': 'household item', 'noto-light-video': 'electrical device',
  'noto-medical': 'medical supply', 'noto-money': 'money', 'noto-musical-instrument': 'musical instrument', 'noto-office': 'office supply', 'noto-phone': 'electrical device',
  'noto-place-building': 'building', 'noto-place-religious': 'building', 'noto-plant-flower': 'flower', 'noto-plant-other': 'plant', 'noto-science': 'science equipment',
  'noto-sport': 'sports equipment', 'noto-tool': 'tool', 'noto-transport-air': 'aircraft', 'noto-transport-water': 'watercraft', 'noto-writing': 'writing implement',
  'openmoji-healthcare': 'medical supply', 'openmoji-technology': 'electrical device', 'openmoji-gardening': 'garden tool',
};

// The parents of the kinds made here (and of the group kinds WordNet does not hold): [kind, parent, dimension].
export const CLASSES = [
  ['animal with legs', 'animal'], ['animal without legs', 'animal'], ['animal with wings', 'animal'], ['thing with wheels', 'thing'], ['thing with wings', 'thing'], ['machine', 'thing'],
  ['household item', 'thing'], ['water animal', 'animal'], ['art supply', 'thing'], ['celebration item', 'thing'], ['sportswear', 'clothing'],
  ['computer equipment', 'electrical device'], ['electrical device', 'device'], ['baked goods', 'food'], ['dairy product', 'food'], ['ingredient', 'food'],
  ['kitchen utensil', 'household item'], ['medical supply', 'thing'], ['playground equipment', 'thing'], ['science equipment', 'thing'],
  ['sports equipment', 'thing'], ['garden tool', 'tool'], ['rail vehicle', 'vehicle'], ['road vehicle', 'vehicle'], ['watercraft', 'vehicle'], ['aircraft', 'vehicle'],
  ['spacecraft', 'vehicle'], ['office supply', 'thing'], ['writing implement', 'thing'], ['toiletry', 'thing'], ['stationery', 'thing'], ['worker', 'person'],
  ['story character', 'person'], ['vehicle', 'thing'], ['tool', 'thing'], ['furniture', 'thing'], ['clothing', 'thing'], ['building', 'thing'],
  ['device', 'thing'], ['container', 'thing'], ['toy', 'thing'], ['plant', 'living thing'], ['animal', 'living thing'], ['person', 'living thing'], ['food', 'thing'], ['drink', 'food'],
  ['game', 'thing'], ['money', 'thing'], ['award', 'thing'], ['flower', 'plant'], ['tableware', 'household item'],
];
// The feature, place, use and material kinds are named by a pattern, and their parent is the root of the thing.
const covering = { fur: 'animal with fur', feathers: 'animal with feathers', scales: 'animal with scales', hair: 'animal with hair', shell: 'animal with a shell', spines: 'animal with spines', wool: 'animal with wool' };
// (Not a clock's balance wheel or a ship's paddle wheel: the wheels a thing runs on.)
const PART_FEATURES = [[/^(wheel|wheels|car wheel|bicycle wheel|wagon wheel)$/, 'thing with wheels'], [/\b(engine|motor)$/, 'machine'], [/^wings?$/, 'thing with wings']];
// Last words that are qualifiers of an emoji name, not its head ("tilted right", "medium volume"), and compounds that
// are not a kind of their last word (a guinea pig is no pig). Proper names (every word capitalised) have no head.
const HEAD_NOT = new Set(['right', 'left', 'volume', 'tone', 'portable', 'up', 'down', 'face', 'way']);
const NOT_HEADED = new Set(['guinea pig', 'flying saucer', 'hot dog', 'light rail', 'sea horse', 'starfish', 'jellyfish', 'koala bear', 'killer whale', 'flying disc', 'sea lion', 'ladybird', 'polar bear',
  'Tasmanian devil', 'teddy bear', 'Komodo dragon', 'carousel horse', 'rocking horse', 'white of the eye', 'airplane arrival', 'airplane departure']);
const STOP = new Set(['entity', 'physical entity', 'abstraction', 'abstract entity']);
// The root of each sense the catalog gives a name (tools/joins.mjs), for choosing its WordNet sense.
const ROOTS = {
  animal: ['animal'], person: ['person'], food: ['food', 'foodstuff', 'beverage', 'edible fruit', 'vegetable', 'produce', 'plant part', 'plant organ', 'nutriment', 'dish', 'herb', 'fruit'],
  plant: ['plant', 'plant part', 'plant organ'], 'body part': ['body part', 'organ', 'structure', 'tissue', 'part'], clothing: ['clothing', 'covering', 'accessory', 'artifact'],
  shape: ['shape', 'figure', 'solid'], 'body in space': ['celestial body', 'natural object'], thing: ['artifact', 'natural object', 'physical entity'],
};
const KIND_SENSE = { animal: 'animal', food: 'food', drink: 'food', plant: 'plant', clothing: 'clothing', jewellery: 'clothing', person: 'person' };
const groupOf = (shardId) => shardId.split('/').pop().replace(/-\d+$/, '');
const srcOf = (f) => f.attrs['core.source'] ?? [HAND];

export function kindsGraph(worlds = scanWorlds()) {
  const T = ['k.animals.animal', 'k.attributes.thing', 'k.food.food', 'k.body.part', 'k.space.body', 'k.wearables.wearable', 'k.people.kind', 'k.people.role',
    'k.shapes.shape', 'k.commonsense.thing', 'k.objects.object', 'k.parts.whole', 'k.parts.inherited', 'k.parts.usual', 'k.words.sense'];
  const F = readFacts(T, worlds);
  const edges = new Map(); // `${name}\t${is_a}` -> edge (the first reason kept: the catalog's own facts before WordNet's)
  const add = (name, isA, dimension, reason) => {
    if (!name || !isA || name === isA || STOP.has(isA)) return;
    const k = `${name}\t${isA}`;
    if (!edges.has(k)) edges.set(k, { name, is_a: isA, dimension, ...reason });
  };
  // The things of the catalog and the sense each is given (the first owner that says one).
  const sense = new Map(), owners = new Map();
  const own = (name, s, type) => { if (!name) return; if (!sense.has(name) && s) sense.set(name, s); (owners.get(name) ?? owners.set(name, new Set()).get(name)).add(type); };
  for (const f of F['k.animals.animal']) own(f.attrs.name[0], 'animal', 'k.animals.animal');
  for (const t of ['k.people.kind', 'k.people.role']) for (const f of F[t]) if (f.attrs.derived?.[0] !== 'true') own(f.attrs.name[0], 'person', t);
  for (const f of F['k.food.food']) own(f.attrs.name[0], 'food', 'k.food.food');
  for (const f of F['k.body.part']) own(f.attrs.name[0], 'body part', 'k.body.part');
  for (const f of F['k.shapes.shape']) if (f.attrs.derived?.[0] !== 'true') own(f.attrs.name[0], 'shape', 'k.shapes.shape');
  for (const f of F['k.space.body']) own(f.attrs.name[0], 'body in space', 'k.space.body');
  for (const f of F['k.wearables.wearable']) own(f.attrs.name[0], 'clothing', 'k.wearables.wearable');
  for (const f of F['k.attributes.thing']) own(f.attrs.name[0], KIND_SENSE[f.attrs.kind?.[0]] ?? 'thing', 'k.attributes.thing');
  for (const f of F['k.commonsense.thing']) if (f.attrs.derived?.[0] !== 'true') own(f.attrs.name[0], null, 'k.commonsense.thing');
  for (const f of F['k.objects.object']) {
    const g = groupOf(f.shard.id);
    if (/^(stand-ins|words)/.test(g)) continue;
    own(f.attrs.name[0], /animal/.test(g) ? 'animal' : /(^|-)(food|drink)/.test(g) && !/kitchen/.test(g) ? 'food' : /plant/.test(g) ? 'plant' : /cloth/.test(g) ? 'clothing' : 'thing', 'k.objects.object');
  }

  // kind: the catalog's own classes.
  const KEYS = [['k.animals.animal', 'class'], ['k.attributes.thing', 'kind'], ['k.food.food', 'kind'], ['k.body.part', 'kind'], ['k.space.body', 'kind'], ['k.wearables.wearable', 'kind'], ['k.people.role', 'is']];
  for (const [type, key] of KEYS) for (const f of F[type]) for (const v of f.attrs[key] ?? []) add(f.attrs.name[0], v, 'kind', { from: type, key, source: srcOf(f)[0] });
  const ROLE_GROUP = { job: 'worker', story: 'story character' };
  for (const f of F['k.people.role']) for (const v of f.attrs.group ?? []) if (ROLE_GROUP[v]) add(f.attrs.name[0], ROLE_GROUP[v], 'kind', { from: 'k.people.role', key: 'group', value: v, source: srcOf(f)[0] });
  // kind: the group of a drawing's source.
  for (const f of F['k.objects.object']) {
    const g = groupOf(f.shard.id), k = GROUPS[g];
    if (k) add(f.attrs.name[0], k, 'kind', { from: 'k.objects.object', group: g, source: srcOf(f).join('\t'), licence: f.shard });
  }
  // place, feature, diet of animals.
  for (const f of F['k.animals.animal']) {
    const n = f.attrs.name[0], src = srcOf(f)[0];
    for (const h of f.attrs.habitat ?? []) if (h !== 'hair') add(n, `${h} animal`, 'place', { from: 'k.animals.animal', key: 'habitat', value: h, source: src });
    for (const l of f.attrs.legs ?? []) add(n, Number(l) > 0 ? 'animal with legs' : 'animal without legs', 'feature', { from: 'k.animals.animal', key: 'legs', value: l, source: src });
    for (const c of f.attrs.covering ?? []) if (covering[c]) add(n, covering[c], 'feature', { from: 'k.animals.animal', key: 'covering', value: c, source: src });
    for (const d of f.attrs.diet ?? []) add(n, d, 'diet', { from: 'k.animals.animal', key: 'diet', value: d, source: src });
  }
  // feature, use, material of things.
  for (const f of F['k.attributes.thing']) {
    const n = f.attrs.name[0], src = srcOf(f)[0];
    for (const w of f.attrs.wheels ?? []) if (Number(w) > 0) add(n, 'thing with wheels', 'feature', { from: 'k.attributes.thing', key: 'wheels', value: w, source: src });
    for (const u of f.attrs.used_for ?? []) add(n, `thing for ${u}`, 'use', { from: 'k.attributes.thing', key: 'used_for', value: u, source: src });
    for (const m of f.attrs.material ?? []) add(n, `thing made of ${m}`, 'material', { from: 'k.attributes.thing', key: 'material', value: m, source: src });
  }
  for (const f of F['k.wearables.wearable']) for (const w of f.attrs.worn_on ?? []) add(f.attrs.name[0], `thing worn on the ${w}`, 'use', { from: 'k.wearables.wearable', key: 'worn_on', value: w, source: srcOf(f)[0] });
  for (const t of ['k.parts.usual', 'k.parts.whole', 'k.parts.inherited']) for (const f of F[t]) {
    if (!owners.has(f.attrs.name[0])) continue;
    for (const p of f.attrs.has ?? []) for (const [re, k0] of PART_FEATURES) if (re.test(p)) { const k = k0 === 'thing with wings' && sense.get(f.attrs.name[0]) === 'animal' ? 'animal with wings' : k0; add(f.attrs.name[0], k, 'feature', { from: t, key: 'has', value: p, source: srcOf(f)[0] }); }
  }
  // kind: WordNet (k.words): the sense of each thing and of each parent named so far, its hypernyms, and the chain
  // of first hypernyms above (kind_of, nearest first).
  const senses = new Map();
  for (const f of F['k.words.sense']) if (f.attrs.pos[0] === 'noun') (senses.get(f.attrs.word[0]) ?? senses.set(f.attrs.word[0], []).get(f.attrs.word[0])).push(f);
  for (const l of senses.values()) l.sort((a, b) => Number(a.attrs.n[0]) - Number(b.attrs.n[0]));
  const wordnetOf = (name, s) => {
    const l = senses.get(name) ?? senses.get(name.toLowerCase());
    if (!l) return null;
    const roots = ROOTS[s] ?? ROOTS.thing;
    const up = (f) => [...(f.attrs.kind_of ?? []), ...(f.attrs.is_a ?? []), ...(f.attrs.instance_of ?? [])];
    // A thing: else the first concrete sense; and where k.words keeps no chain for any sense of the word (a rare
    // word), its first sense, the most frequent one.
    return l.find((f) => up(f).some((u) => roots.includes(u))) ?? (s === 'thing' ? l.find((f) => up(f).includes('physical entity')) ?? (l.length === 1 || l.every((f) => !f.attrs.kind_of) ? l[0] : null) : null);
  };
  // kind: the head of a name of several words ("Christmas cake" is a cake, "cloud with rain" a cloud, "DVD player" a
  // player): the last word before with, without, at, of, in, on, for, behind, singular where the plural is no noun, when it is a
  // noun of k.words or a thing of the catalog. Names with "and" (two things) are left out.
  const isNoun = (w) => senses.has(w) || owners.has(w);
  // Mulberry names often put the qualifier last ("chair computer", "DVD player portable"): a name drawn only by
  // Mulberry gets no head edge.
  const mulberryOnly = new Set();
  for (const f of F['k.objects.object']) if (groupOf(f.shard.id).startsWith('mulberry')) mulberryOnly.add(f.attrs.name[0]);
  for (const f of F['k.objects.object']) if (!groupOf(f.shard.id).startsWith('mulberry')) mulberryOnly.delete(f.attrs.name[0]);
  for (const name of [...owners.keys()].sort(byText)) {
    if (/ and | & /.test(name) || !/ /.test(name) || (mulberryOnly.has(name) && owners.get(name).size === 1)) continue;
    const words = name.split(/ (?:with|without|at|of|in|on|for|behind) /)[0].split(' ');
    let head = words[words.length - 1].toLowerCase();
    if (words.length < 2 && head === name.toLowerCase()) continue;
    if (!isNoun(head) && /s$/.test(head) && isNoun(head.replace(/(ies)$/, 'y').replace(/(ches|shes|sses|xes)$/, (m) => m.slice(0, -2)).replace(/([^s])s$/, '$1'))) head = head.replace(/(ies)$/, 'y').replace(/(ches|shes|sses|xes)$/, (m) => m.slice(0, -2)).replace(/([^s])s$/, '$1');
    if (head === name || !(owners.has(head) || wordnetOf(head, sense.get(name) ?? 'thing') || (ROOTS[sense.get(name)] ?? []).includes(head)) || HEAD_NOT.has(head) || NOT_HEADED.has(name) || words.every((w) => /^[A-Z]/.test(w))) continue;
    add(name, head, 'kind', { from: [...owners.get(name)].sort(byText)[0], key: 'name', value: name, source: HAND, head: true });
  }
  // The kinds made above and the group kinds get their parents.
  for (const [k, p] of CLASSES) add(k, p, 'kind', { from: 'k.kinds.parent', source: HAND, made: true });
  for (const e of [...edges.values()]) {
    if (e.dimension === 'place' || e.dimension === 'diet') add(e.is_a, 'animal', 'kind', { from: 'k.kinds.parent', source: HAND, made: true });
    if (e.dimension === 'use' || e.dimension === 'material') add(e.is_a, e.is_a.startsWith('thing worn') ? 'clothing' : 'thing', 'kind', { from: 'k.kinds.parent', source: HAND, made: true });
    if (e.dimension === 'feature' && covering[e.value]) add(e.is_a, 'animal', 'kind', { from: 'k.kinds.parent', source: HAND, made: true });
  }

  const parentSense = new Map();
  for (const e of edges.values()) if (!parentSense.has(e.is_a)) parentSense.set(e.is_a, sense.get(e.name) ?? null);
  const chosen = new Map();
  const names = [...new Set([...owners.keys(), ...parentSense.keys()])].sort(byText);
  const reasonOf = (f, key) => ({ from: 'k.words.sense', key, value: `${f.attrs.word[0]} noun ${f.attrs.n[0]}`, source: srcOf(f)[0] });
  // First the hypernyms of each name's own sense, then the chains above (so an edge's reason is its own sense).
  for (const name of names) {
    if (STOP.has(name)) continue;
    const f = wordnetOf(name, sense.get(name) ?? parentSense.get(name) ?? 'thing');
    if (!f) continue;
    chosen.set(name, f);
    for (const p of f.attrs.is_a ?? []) add(name, p, 'kind', reasonOf(f, 'is_a'));
    for (const p of f.attrs.instance_of ?? []) add(name, p, 'kind', reasonOf(f, 'instance_of'));
  }
  // A word of a chain is the first word of a hypernym, whose sense is not said: the edge is kept only where that
  // word's chosen sense (or, for a word that is no thing, one of its senses) has that parent, so that the chain of
  // "carriage" (railway car) does not make "car" (a motor car) a wheeled vehicle.
  const hasParent = (f, p) => (f.attrs.is_a ?? []).includes(p) || (f.attrs.instance_of ?? []).includes(p) || f.attrs.kind_of?.[0] === p;
  const chainOk = (w, p) => (chosen.has(w) ? hasParent(chosen.get(w), p) : senses.has(w) ? senses.get(w).some((f) => hasParent(f, p)) : true);
  for (const name of names) {
    const f = chosen.get(name);
    if (!f) continue;
    const chain = f.attrs.kind_of ?? [];
    for (let i = 0; i + 1 < chain.length; i += 1) if (chainOk(chain[i], chain[i + 1])) add(chain[i], chain[i + 1], 'kind', reasonOf(f, 'kind_of'));
  }
  // The is_a told in the worlds that extend k.kinds.kind: up edges already, not copied (counted by the report).
  const told = [];
  for (const t of ['k.commonsense.thing', 'k.people.kind', 'k.people.role', 'k.shapes.shape']) for (const f of F[t]) if (f.attrs.derived?.[0] !== 'true') for (const p of f.attrs.is_a ?? []) told.push({ name: f.attrs.name[0], is_a: p, dimension: 'kind', from: t, key: 'is_a' });
  return { told, edges: [...edges.values()].sort((a, b) => byText(a.name, b.name) || byText(a.is_a, b.is_a)), owners, sense, chosen };
}

// The licence of a shard, from its header.
const licenceOf = (shard) => readHeader(shard.text);
const SHARD_OF = (e) => {
  if (e.head) return 'head';
  if (e.from === 'k.objects.object') return `group-${e.group.startsWith('noto') ? 'noto' : e.group.startsWith('mulberry') ? 'mulberry' : e.group.startsWith('openmoji') ? 'openmoji' : 'hand'}`;
  if (/^"?wordnet/.test(e.source)) return e.from === 'k.words.sense' ? 'wordnet' : `${e.dimension}-wordnet`;
  if (e.made) return 'classes';
  if (e.head) return 'head';
  return e.dimension;
};

export function kindsShards(g = kindsGraph(), worlds = scanWorlds()) {
  const byShard = new Map();
  for (const e of g.edges) (byShard.get(SHARD_OF(e)) ?? byShard.set(SHARD_OF(e), []).get(SHARD_OF(e))).push(e);
  const line = (e) => wire(`k.kinds.parent.${seg(e.name)}.${seg(e.is_a)}`, 'k.kinds.parent', [['name', e.name], ['is_a', e.is_a], ['dimension', e.dimension], ['from', e.from], ['key', e.key], ['value', e.value], ['group', e.group]], e.source.split('\t')[0]).replace(/$/, e.source.includes('\t') ? e.source.split('\t').slice(1).map((s) => ` core.source=${JSON.stringify(s)}`).join('') : '');
  const ABOUT = {
    kind: 'what a thing is, by the classes of the catalog\'s own facts (k.animals class, k.attributes kind, k.food kind, k.body kind, k.space kind, k.wearables kind, k.people role is and group)',
    head: 'what a thing of a name of several words is by the head of its name (a Christmas cake is a cake, a cloud with rain a cloud, a DVD player a player)',
    classes: 'the parents of the kinds made by these edges (farm animal, thing with wheels, road vehicle, machine) and of the group kinds',
    place: 'where an animal lives (k.animals habitat): a cow is a farm animal',
    feature: 'what a thing has (k.animals legs and covering, k.attributes wheels, the usual parts of k.parts): an animal with legs, a thing with wheels, a machine (it has an engine or a motor)',
    'feature-wordnet': 'what a thing has, read off the WordNet parts of k.parts: a thing with wheels, a machine (it has an engine or a motor), a thing with wings',
    use: 'what a thing is for (k.attributes used_for) and where a wearable is worn (k.wearables worn_on)',
    material: 'what a thing is made of (k.attributes material)',
    diet: 'what an animal eats (k.animals diet): a herbivore, a carnivore, an omnivore',
    wordnet: 'what a thing is by WordNet 3.1 (k.words): the hypernyms of the sense of the name and the chain of first hypernyms above it',
    'group-hand': 'the hand-written group of a drawing (k.objects)', 'group-noto': 'the Unicode subgroup a Noto Emoji drawing is filed in (k.objects)',
    'group-mulberry': 'the Mulberry symbols category a drawing is filed in (k.objects)', 'group-openmoji': 'the OpenMoji group a drawing is filed in (k.objects)',
  };
  const shardHeaders = new Map(worlds.flatMap((w) => w.shards.map((s) => [s.id, s])));
  const files = {};
  for (const [name, es] of [...byShard].sort((a, b) => byText(a[0], b[0]))) {
    let sources, licence;
    if (name.startsWith('group-') && name !== 'group-hand') {
      const hs = [...new Set(es.map((e) => e.licence.id))].map((id) => licenceOf(shardHeaders.get(id)));
      sources = [...new Set(hs.flatMap((h) => h.sources))]; licence = [...new Set(hs.flatMap((h) => h.license))].join(' AND ');
    } else if (/wordnet/.test(name)) { sources = ['wordnet 3.1 (Princeton WordNet 3.1, read from k.words and k.parts as imported)']; licence = 'WordNet-3.0'; }
    else { sources = ['hand-core 1 (read from the catalog\'s own facts by tools/kinds-core.mjs)']; licence = 'CC0-1.0'; }
    const groups = es.reduce((m, e) => { const k = e.name[0].toLowerCase(); (m.get(k) ?? m.set(k, []).get(k)).push(line(e)); return m; }, new Map());
    const parts = splitParts([...groups.values()].map((lines) => ({ lines })));
    parts.forEach((p, i) => {
      const id = parts.length > 1 ? `${name}-${i + 1}` : name;
      const lines = p.flatMap((x) => x.lines);
      files[`${id}.sop`] = `${header({ id: `k.kinds/shards/${id}`, about: `${lines.length} up edges: ${ABOUT[name]}.`, sources, license: licence, script: 'tools/kinds-core.mjs' })}\n${lines.join('\n')}\n`;
    });
  }
  return files;
}

// Where the plain second parent of a single-parent thing would come from, per the worlds that name it.
const HINTS = {
  'k.objects.object': 'Drawings with a group kind (Mulberry, Noto) and no WordNet sense or one outside the root of their group; the plain second parent is the class a k.attributes.thing fact would give (761 things have one) or the WordNet sense of the head of a Mulberry name, whose qualifier comes last ("chair computer")',
  'k.food.food': 'The k.food kind and the WordNet hypernym are the same word (beef: meat; basil: herb), so one edge; the plain second is on another dimension: what the food comes from or grows on (k.food comes_from, grows_on: a food from an animal, a fruit of a tree), not taken yet',
  'k.shapes.shape': 'Shapes with only their WordNet sense: k.shapes says no is_a for them; the plain second is a k.shapes is_a (a circle is a round shape, a cylinder a solid of revolution)',
  'k.food.food, k.objects.object': 'As k.food.food; the drawing group says the same kind (vegetable, dish)',
  'k.attributes.thing, k.objects.object': 'The k.attributes kind or material only; the WordNet sense is missing or outside the root (fire, rainbow)',
  'k.body.part': 'Parts with the k.body kind only (part, bone): the plain second is what they are part of (k.body part_of), an up edge on another dimension not taken here',
  'k.space.body': 'Named bodies with their kind only: the plain second is the system they belong to (k.space in, orbits)',
};

// The report: parents per thing, per dimension; things with none; things with one parent where a second is plain.
export function parentsReport(g = kindsGraph()) {
  const up = new Map();
  for (const e of [...g.edges, ...g.told]) (up.get(e.name) ?? up.set(e.name, []).get(e.name)).push(e);
  const things = [...g.owners.keys()].sort(byText);
  const none = things.filter((n) => !up.has(n));
  const one = things.filter((n) => up.get(n)?.length === 1);
  const dims = (n) => new Set((up.get(n) ?? []).map((e) => e.dimension));
  const byDim = Object.fromEntries(DIMENSIONS.map((d) => [d, g.edges.filter((e) => e.dimension === d).length]));
  const multi = things.filter((n) => dims(n).size >= 2).length;
  // A second parent is plain where the thing's own world has a class key it does not fill, or a drawing has no
  // group kind and no class: the owner types of each single-parent thing say which.
  const ownerList = (n) => [...g.owners.get(n)].sort(byText).join(', ');
  const perOwner = new Map();
  for (const n of one) { const k = ownerList(n); (perOwner.get(k) ?? perOwner.set(k, []).get(k)).push(n); }
  const lines = [
    '# k.kinds: the up edges of the catalog (generated)',
    '',
    'Generated by `tools/kinds-core.mjs` from the shards; do not edit by hand. The edges are `k.kinds.parent` facts',
    '(shards `k.kinds/shards/*`); with the `is_a` of k.commonsense, k.people and k.shapes (which extend `k.kinds.kind`)',
    'they are every "up" edge the catalog has (reviewer 21:55).',
    '',
    `- ${g.edges.length} edges over ${new Set(g.edges.map((e) => e.name)).size} names (things of the catalog, the kinds above them and WordNet's chain); per dimension: ${DIMENSIONS.map((d) => `${d} ${byDim[d]}`).join(', ')}.`,
    `- ${things.length} things of the catalog (the names of k.animals, k.objects, k.food, k.attributes, k.body, k.space, k.wearables, k.people, k.shapes, k.commonsense): ${multi} with parents on two or more dimensions, ${things.length - none.length - one.length - multi} with several parents on one, ${one.length} with one parent, ${none.length} with none.`,
    `- WordNet senses chosen for ${g.chosen.size} names.`,
    '',
    '## Things with no parent',
    '',
    'Mostly emoji names that are no word (no WordNet sense) and whose drawing group names no kind:',
    '',
    none.map((n) => `${n} (${ownerList(n)})`).join('; ') || '(none)',
    '',
    '## Things with one parent, by the worlds that name them',
    '',
    'A second parent is plain for most of these; where it would come from is said per group.',
    '',
    ...[...perOwner].sort((a, b) => b[1].length - a[1].length).map(([k, ns]) => `- **${k}** (${ns.length})${HINTS[k] ? `. ${HINTS[k]}` : ''}: ${ns.slice(0, 40).map((n) => `${n} -> ${up.get(n)[0].is_a}`).join('; ')}${ns.length > 40 ? '; ...' : ''}`),
    '',
  ];
  return { text: lines.join('\n'), none, one, multi, things: things.length, byDim };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const worlds = scanWorlds();
  const g = kindsGraph(worlds);
  const files = kindsShards(g, worlds);
  writeShards(join(WORLDS_DIR, 'k.kinds', 'shards'), files);
  const r = parentsReport(g);
  writeFileSync(PARENTS_PAGE, r.text);
  for (const [n, t] of Object.entries(files)) console.log(n, t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes');
  console.log(`${g.edges.length} edges; ${r.things} things: ${r.multi} on 2+ dimensions, ${r.one.length} with one parent, ${r.none.length} with none`);
}
