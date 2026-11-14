// k.procedures (block "09:10"): methods, how goals are reached, as facts (format: questions.md Q44).
//   node tools/procedures-core.mjs     writes docs/worlds/k.procedures/shards/*.sop
// Each method below is general: its steps read the goal's roles, what earlier steps made, the live world and the
// facts of other knowledge worlds; none is written for one sentence. Two shards: `from-knowledge` (methods whose steps
// are read off one knowledge world: scenes, layouts, anchors, parts, joins, wearables, roles, feelings, places) and
// `tasks` (named tasks: a family photo, setting a table, a chart, a report).
// In this file only (not in the facts): an argument is [role, spec], where spec is { binding, key, else_key, value,
// rel, of, attribute }; b() and v() write the two kinds of filler.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const b = (binding, key, extra = {}) => ({ binding, key, ...extra });
const v = (value, extra = {}) => ({ value, ...extra });
const FACE_SLOTS = ['hat', 'glasses', 'beard', 'moustache', 'shoulders'];
const FEELING_SLOTS = ['mouth', 'eyebrows', 'eyes', 'cheeks'];

export const METHODS = [
  // ---- from knowledge ----
  { shard: 'from-knowledge', name: 'compose a scene', act: 'make', example: ['draw a farm', 'a beach'],
    about: 'Draw a scene of k.scenes: its ground first, then every thing the scene has, as many as it usually has, where it usually is; a thing that rests on another (a duck on the pond) after the things it rests on.',
    goal: { kind: { from: 'k.scenes.scene' } },
    bind: {
      scene: { goal: 'kind' },
      setting: { from: 'k.scenes.scene', match: { name: { equals: 'scene' }, ground: { present: true } } },
      loose: { from: 'k.scenes.has', match: { scene: { equals: 'scene' }, on: { present: false } } },
      resting: { from: 'k.scenes.has', match: { scene: { equals: 'scene' }, on: { present: true } } },
      base: { live: 'any', match: { kind: { equals: 'resting', equals_key: 'on' } } },
      made: { step: [2, 3] },
    },
    steps: [
      { act: 'make', each: 'setting', about: 'lay the ground of the scene', args: [['kind', b('setting', 'ground')], ['place', v('ground')]] },
      { act: 'make', each: 'loose', after: [1], about: 'make each thing the scene has where it usually is', args: [['kind', b('loose', 'thing')], ['number', b('loose', 'count')], ['place', b('loose', 'where')]] },
      { act: 'make', each: 'resting', after: [2], about: 'make each thing that rests on another, on it', args: [['kind', b('resting', 'thing')], ['number', b('resting', 'count')], ['place', b('base', undefined, { rel: 'on' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'made' }] },

  { shard: 'from-knowledge', name: 'arrange in a layout', act: 'group', example: ['arrange them like a family photo', 'put the people in a row'],
    about: 'Arrange things as a layout of k.layouts says: group them under the layout, then put each into the first slot of the layout that holds its kind.',
    goal: { group: { from: 'k.layouts.layout' }, thing: { needed: true } },
    bind: {
      layout: { goal: 'group' }, things: { goal: 'thing' }, made: { step: [1] },
      slot: { from: 'k.layouts.slot', key: 'name', match: { layout: { equals: 'layout' }, holds: { equals: 'things', equals_key: 'kind' } } },
    },
    steps: [
      { act: 'group', expand: false, about: 'group the things under the layout', args: [['thing', b('things')], ['group', b('layout')]] },
      { act: 'place', each: 'things', after: [1], expand: false, about: 'put each thing into the slot that holds its kind', args: [['thing', b('things')], ['place', b('slot', undefined, { rel: 'in', of: 'made' })]] },
    ],
    conditions: [{ when: 'after', fact: 'grouped', thing: 'things', other: 'made' }] },

  { shard: 'from-knowledge', name: 'put a thing on the anchor of another', act: 'place', rank: 3, example: ['put the man on the swing', 'put the cup on the table'],
    about: 'Put a thing on another thing at the anchor of that thing which holds its kind (the seat of a swing holds a person, the top of a table a cup), making the other thing first if there is none.',
    goal: { thing: { needed: true }, place: { from: 'k.layouts.anchor', by: 'of', rel: 'on' } },
    bind: {
      thing: { goal: 'thing' }, base: { goal: 'place' },
      anchor: { from: 'k.layouts.anchor', key: 'name', match: { of: { equals: 'base', equals_key: 'kind' }, holds: { equals: 'thing', equals_key: 'kind' } } },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the thing to put it on, if there is none', args: [['kind', b('base', 'kind')]] },
      { act: 'place', after: [1], expand: false, about: 'put the thing on the anchor', args: [['thing', b('thing')], ['place', b('anchor', undefined, { rel: 'on', of: 'base' })]] },
    ],
    conditions: [
      { when: 'before', fact: 'exists', thing: 'anchor' },
      { when: 'before', step: 1, fact: 'absent', thing: 'base' },
      { when: 'after', fact: 'on', thing: 'thing', other: 'base' },
    ] },

  { shard: 'from-knowledge', name: 'make a thing on the anchor of another', act: 'make', rank: 3, example: ['a person sitting on a swing', 'a cat on a sofa', 'a vase on the table'],
    about: 'Make a thing on another thing at the anchor of that thing which holds its kind: make the other thing if there is none, make the thing, put it on the anchor.',
    goal: { kind: { needed: true }, number: {}, place: { from: 'k.layouts.anchor', by: 'of', rel: 'on' } },
    bind: {
      kind: { goal: 'kind' }, number: { goal: 'number' }, base: { goal: 'place' }, made: { step: [2] },
      anchor: { from: 'k.layouts.anchor', key: 'name', match: { of: { equals: 'base', equals_key: 'kind' }, holds: { equals: 'kind' } } },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the thing to put it on, if there is none', args: [['kind', b('base', 'kind')]] },
      { act: 'make', expand: false, about: 'make the thing, as many as the goal says', args: [['kind', b('kind')], ['number', b('number')]] },
      { act: 'place', after: [1, 2], expand: false, about: 'put it on the anchor', args: [['thing', b('made')], ['place', b('anchor', undefined, { rel: 'on', of: 'base' })]] },
    ],
    conditions: [
      { when: 'before', fact: 'exists', thing: 'anchor' },
      { when: 'before', step: 1, fact: 'absent', thing: 'base' },
      { when: 'after', fact: 'on', thing: 'made', other: 'base' },
    ] },

  { shard: 'from-knowledge', name: 'put on a new wearable', act: 'make', rank: 2, example: ['a man with a hat', 'put a scarf on the girl'],
    about: 'Make a wearable of k.wearables on a person, at the place of the body where it is worn.',
    goal: { kind: { from: 'k.wearables.wearable' }, place: { rel: 'on', needed: true } },
    bind: { wear: { goal: 'kind' }, wearer: { goal: 'place' }, worn: { from: 'k.wearables.wearable', key: 'worn_on', match: { name: { equals: 'wear' } } }, made: { step: [1] } },
    steps: [{ act: 'make', expand: false, about: 'make it where it is worn', args: [['kind', b('wear')], ['place', b('worn', undefined, { rel: 'on', of: 'wearer' })]] }],
    conditions: [{ when: 'after', fact: 'on', thing: 'made', other: 'wearer' }] },

  { shard: 'from-knowledge', name: 'put on a wearable', act: 'place', rank: 2, example: ['put the hat on the man'],
    about: 'Put a wearable that is there on a person, at the place of the body where it is worn.',
    goal: { thing: { from: 'k.wearables.wearable' }, place: { rel: 'on', needed: true } },
    bind: { wear: { goal: 'thing' }, wearer: { goal: 'place' }, worn: { from: 'k.wearables.wearable', key: 'worn_on', match: { name: { equals: 'wear', equals_key: 'kind' } } } },
    steps: [{ act: 'place', expand: false, about: 'put it where it is worn', args: [['thing', b('wear')], ['place', b('worn', undefined, { rel: 'on', of: 'wearer' })]] }],
    conditions: [{ when: 'after', fact: 'on', thing: 'wear', other: 'wearer' }] },

  { shard: 'from-knowledge', name: 'put a wearable on a face', act: 'make', world: 'w.face', example: ['give the face glasses', 'a face with a cap'],
    about: 'On a drawn face (w.face), a wearable that a face shows is the part of its face slot, in the variant k.wearables names.',
    goal: { kind: { from: 'k.wearables.wearable' }, place: { needed: true } },
    bind: {
      wear: { goal: 'kind' }, face: { goal: 'place' },
      slot: { from: 'k.wearables.wearable', key: 'face_slot', match: { name: { equals: 'wear' } } },
      variant: { from: 'k.wearables.wearable', key: 'face', match: { name: { equals: 'wear' } } },
    },
    steps: [{ act: 'make', expand: false, about: 'make the part of the slot in its variant', args: [['kind', b('slot')], ['value', b('variant', undefined, { attribute: 'variant' })], ['value', b('face', undefined, { attribute: 'face' })]] }],
    conditions: [{ when: 'before', fact: 'exists', thing: 'slot' }] },

  { shard: 'from-knowledge', name: 'a person of a role', act: 'make', rank: 2, example: ['draw a doctor', 'a firefighter'],
    about: 'Draw a person of a role of k.people: the person, then what the role wears, each where it is worn, and what the role holds, in the hand.',
    goal: { kind: { from: 'k.people.role' }, number: {}, place: {} },
    bind: {
      role: { goal: 'kind' }, number: { goal: 'number' }, place: { goal: 'place' }, person: { step: [1] },
      wears: { from: 'k.people.role', key: 'wears', match: { name: { equals: 'role' } } },
      holds: { from: 'k.people.role', key: 'holds', match: { name: { equals: 'role' } } },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the person of the role, as many and where the goal says', args: [['kind', b('role')], ['number', b('number')], ['place', b('place')]] },
      { act: 'make', each: 'wears', after: [1], about: 'put on what the role wears', args: [['kind', b('wears')], ['place', b('person', undefined, { rel: 'on' })]] },
      { act: 'make', each: 'holds', after: [1], expand: false, about: 'put what the role holds in the hand', args: [['kind', b('holds')], ['place', v('right_hand', { rel: 'in', of: 'person' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'person' }] },

  { shard: 'from-knowledge', name: 'a face of a role', act: 'make', world: 'w.face', example: ['a pirate face', 'make the avatar a doctor'],
    about: 'On a drawn face (w.face), a role of k.people is a face with the hat, glasses, beard, moustache and shoulders the role has.',
    goal: { kind: { from: 'k.people.role' } },
    bind: { role: { goal: 'kind' }, face: { step: [1] }, said: { from: 'k.people.role', match: { name: { equals: 'role' } } } },
    steps: [
      { act: 'make', expand: false, about: 'make the face', args: [['kind', v('face')]] },
      ...FACE_SLOTS.map((s) => ({ act: 'make', after: [1], expand: false, about: `give it the ${s} of the role`, args: [['kind', v(s)], ['value', b('said', s, { attribute: 'variant' })], ['value', b('face', undefined, { attribute: 'face' })]] })),
    ],
    conditions: FACE_SLOTS.map((s, i) => ({ when: 'before', step: i + 2, fact: 'has', thing: 'said', attribute: s })) },

  { shard: 'from-knowledge', name: 'show a feeling on a face', act: 'change', world: 'w.face', example: ['make the face look shy', 'make her happy'],
    about: 'A feeling of k.feelings on a drawn face (w.face): its expression where it has one, then the variant of each part the feeling names.',
    goal: { thing: { needed: true }, value: { from: 'k.feelings.feeling' } },
    bind: { face: { goal: 'thing' }, feeling: { goal: 'value' }, said: { from: 'k.feelings.feeling', match: { name: { equals: 'feeling' } } } },
    steps: [
      { act: 'change', expand: false, about: 'set the expression', args: [['thing', b('face')], ['attribute', v('expression')], ['value', b('said', 'expression')]] },
      ...FEELING_SLOTS.map((s) => ({ act: 'change', after: [1], expand: false, about: `set the ${s}`, args: [['thing', v(s, { of: 'face' })], ['attribute', v('variant')], ['value', b('said', s)]] })),
    ],
    conditions: ['expression', ...FEELING_SLOTS].map((s, i) => ({ when: 'before', step: i + 1, fact: 'has', thing: 'said', attribute: s })) },

  { shard: 'from-knowledge', name: 'take apart a drawn thing', act: 'take apart', example: ['take apart the car', 'take the wheels off the bicycle'],
    about: 'Take a drawn thing apart into the parts of its drawing (k.objects) that have a name: make each where it is on the thing; what has no name of its own (the body of a drawing, an unnamed stroke) stays as the thing.',
    goal: { thing: { from: 'k.objects.part', by: 'of' } },
    bind: {
      thing: { goal: 'thing' }, made: { step: [1, 2] },
      kinded: { from: 'k.objects.part', match: { of: { equals: 'thing', equals_key: 'kind' }, kind: { present: true, not: 'detail' } } },
      named: { from: 'k.objects.part', match: { of: { equals: 'thing', equals_key: 'kind' }, named: { value: 'model' }, kind: { present: false } } },
      labelled: { together: ['kinded', 'named'] },
    },
    steps: [
      { act: 'make', each: 'kinded', about: 'make each part of a kind where it is on the thing', args: [['kind', b('kinded', 'kind')], ['place', b('kinded', 'name', { rel: 'at', of: 'thing' })]] },
      { act: 'make', each: 'named', about: 'make each other named part where it is on the thing', args: [['kind', b('named', 'name')], ['place', b('named', 'name', { rel: 'at', of: 'thing' })]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'labelled' }, { when: 'after', fact: 'exists', thing: 'thing' }, { when: 'after', fact: 'exists', thing: 'made' }] },

  { shard: 'from-knowledge', name: 'take apart into named parts', act: 'take apart', rank: 2, example: ['take apart a piano'],
    about: 'Take a thing apart into the parts k.parts names for it (no drawing parts known): make each part, then remove the thing.',
    goal: { thing: { from: 'k.parts.whole' } },
    bind: { thing: { goal: 'thing' }, part: { from: 'k.parts.whole', key: 'has', match: { name: { equals: 'thing', equals_key: 'kind' } } } },
    steps: [
      { act: 'make', each: 'part', about: 'make each part', args: [['kind', b('part')]] },
      { act: 'remove', after: [1], about: 'remove the whole', args: [['thing', b('thing')]] },
    ],
    conditions: [{ when: 'after', fact: 'absent', thing: 'thing' }] },

  { shard: 'from-knowledge', name: 'take apart a group', act: 'take apart', example: ['take the group apart'],
    about: 'A group made by grouping things is taken apart by the act itself: the things stay, the group goes.',
    goal: { thing: { kind: 'group' } },
    bind: { group: { goal: 'thing' } },
    steps: [{ act: 'take apart', expand: false, about: 'take the group apart', args: [['thing', b('group')]] }],
    conditions: [{ when: 'after', fact: 'absent', thing: 'group' }] },

  { shard: 'from-knowledge', name: 'build from parts', act: 'make', example: ['build a house from parts'],
    about: 'Build a thing out of its parts as k.layouts joins say: make each part, join the parts that attach to each other, group them as the thing.',
    goal: { kind: { from: 'k.layouts.joins', by: 'b' }, material: { value: 'parts' } },
    bind: {
      whole: { goal: 'kind' }, made: { step: [1] },
      part: { from: 'k.layouts.joins', key: 'a', match: { b: { equals: 'whole' }, rel: { value: 'part_of' } } },
      joint: { from: 'k.layouts.joins', match: { rel: { value: 'attaches_to' }, a: { equals: 'part' }, b: { equals: 'part' } } },
      first: { live: 'any', match: { kind: { equals: 'joint', equals_key: 'a' } } },
      second: { live: 'any', match: { kind: { equals: 'joint', equals_key: 'b' } } },
    },
    steps: [
      { act: 'make', each: 'part', about: 'make each part', args: [['kind', b('part')]] },
      { act: 'connect', each: 'joint', after: [1], about: 'join each part to the part it attaches to', args: [['thing', b('first')], ['target', b('second')]] },
      { act: 'group', after: [2], expand: false, about: 'group the parts as the thing', args: [['thing', b('made')], ['group', b('whole')]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'part' }, { when: 'after', fact: 'grouped', thing: 'made' }] },

  { shard: 'from-knowledge', name: 'show a country on the map', act: 'ask', world: 'w.map', example: ['where is Peru', 'show me France on the map'],
    about: 'On a map (w.map), a country of k.geo is shown and highlighted, and the view is centred on it.',
    goal: { thing: { from: 'k.geo.country' } },
    bind: { place: { goal: 'thing' }, shown: { live: 'place', match: { name: { equals: 'place' } } } },
    steps: [
      { act: 'make', expand: false, about: 'show the country, highlighted', args: [['kind', v('place')], ['value', b('place', undefined, { attribute: 'name' })], ['value', v('country', { attribute: 'sort' })], ['value', v('true', { attribute: 'highlight' })]] },
      { act: 'change', after: [1], expand: false, about: 'centre the view on it', args: [['thing', v('view')], ['attribute', v('centre')], ['value', b('place')]] },
    ],
    conditions: [{ when: 'before', step: 1, fact: 'absent', thing: 'shown' }] },

  { shard: 'from-knowledge', name: 'show a city on the map', act: 'ask', world: 'w.map', example: ['where is Lima'],
    about: 'On a map (w.map), a city of k.geo gets a pin with its name, and the view is centred on it.',
    goal: { thing: { from: 'k.geo.city' } },
    bind: { place: { goal: 'thing' }, pinned: { live: 'pin', match: { on: { equals: 'place' } } } },
    steps: [
      { act: 'make', expand: false, about: 'pin the city', args: [['kind', v('pin')], ['value', b('place', undefined, { attribute: 'on' })], ['value', v('city', { attribute: 'sort' })], ['value', b('place', undefined, { attribute: 'label' })]] },
      { act: 'change', after: [1], expand: false, about: 'centre the view on it', args: [['thing', v('view')], ['attribute', v('centre')], ['value', b('place')]] },
    ],
    conditions: [{ when: 'before', step: 1, fact: 'absent', thing: 'pinned' }] },

  // ---- named tasks ----
  { shard: 'tasks', name: 'a family photo of the people there', act: 'make', example: ['a family photo', 'arrange everyone for a family photo'],
    about: 'When there are people in the picture, a family photo is those people arranged in the layout "family photo".',
    goal: { kind: { value: 'family photo' } },
    bind: { kinds: { from: 'k.people.kind', key: 'name' }, people: { live: 'any', match: { kind: { equals: 'kinds' } } } },
    steps: [{ act: 'group', about: 'arrange them as a family photo', args: [['thing', b('people')], ['group', v('family photo')]] }],
    conditions: [{ when: 'before', fact: 'exists', thing: 'people' }] },

  { shard: 'tasks', name: 'a family photo of a new family', act: 'make', rank: 2, example: ['a family photo'],
    about: 'When there is nobody yet, a family photo is a family (a man, a woman, a boy, a girl and their dog) arranged in the layout "family photo".',
    goal: { kind: { value: 'family photo' } },
    bind: { kinds: { from: 'k.people.kind', key: 'name' }, people: { live: 'any', match: { kind: { equals: 'kinds' } } }, family: { step: [1, 2, 3, 4, 5] } },
    steps: [
      ...['man', 'woman', 'boy', 'girl'].map((k) => ({ act: 'make', expand: false, about: `make the ${k}`, args: [['kind', v(k)]] })),
      { act: 'make', expand: false, optional: true, about: 'make the dog', args: [['kind', v('dog')]] },
      { act: 'group', after: [1, 2, 3, 4, 5], about: 'arrange them as a family photo', args: [['thing', b('family')], ['group', v('family photo')]] },
    ],
    conditions: [{ when: 'before', fact: 'absent', thing: 'people' }] },

  { shard: 'tasks', name: 'set a table', act: 'make', rank: 2, example: ['set a table for four', 'lay the table for two'],
    about: 'A table set for a number of people (four if none is said): the table if there is none, a chair for each around it, and a plate and a cup for each on its top.',
    goal: { kind: { value: 'table setting' }, number: { default: 4 } },
    bind: { n: { goal: 'number' }, table: { live: 'table' } },
    steps: [
      { act: 'make', expand: false, about: 'make the table, if there is none', args: [['kind', v('table')]] },
      { act: 'make', after: [1], expand: false, about: 'a chair for each, around the table', args: [['kind', v('chair')], ['number', b('n')], ['place', b('table', undefined, { rel: 'around' })]] },
      { act: 'make', after: [1], expand: false, about: 'a plate for each, on the table', args: [['kind', v('plate')], ['number', b('n')], ['place', v('surface', { rel: 'on', of: 'table' })]] },
      { act: 'make', after: [1], expand: false, about: 'a cup for each, on the table', args: [['kind', v('cup')], ['number', b('n')], ['place', v('surface', { rel: 'on', of: 'table' })]] },
    ],
    conditions: [{ when: 'before', step: 1, fact: 'absent', thing: 'table' }, { when: 'after', fact: 'exists', thing: 'table' }] },

  { shard: 'tasks', name: 'set a table in a seating plan', act: 'make', world: 'w.seating', example: ['set a table for four'],
    about: 'In a seating plan (w.seating), a table set for a number of people is a table with that many seats, and the seats, numbered.',
    goal: { kind: { value: 'table setting' }, number: { default: 4 } },
    bind: { n: { goal: 'number' }, seat: { upto: 'n' }, table: { step: [1] } },
    steps: [
      { act: 'make', expand: false, about: 'make the table with its number of seats', args: [['kind', v('table')], ['value', v('table', { attribute: 'name' })], ['value', b('n', undefined, { attribute: 'seats' })]] },
      { act: 'make', each: 'seat', after: [1], expand: false, about: 'make each seat of the table', args: [['kind', v('seat')], ['value', b('table', undefined, { attribute: 'table' })], ['value', b('seat', undefined, { attribute: 'n' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'table' }] },

  { shard: 'tasks', name: 'a chart of the things there', act: 'make', world: 'w.list', example: ['a chart of the things in the picture'],
    about: 'A chart of the things there, as a list (w.list): how many things of each kind there are, one item per kind with its count.',
    goal: { kind: { value: 'chart' } },
    bind: { things: { live: 'any' }, counted: { step: [1] }, list: { step: [2] } },
    steps: [
      { act: 'ask', expand: false, about: 'count the things of each kind', args: [['topic', v('count')], ['thing', b('things')]] },
      { act: 'make', expand: false, about: 'make the list', args: [['kind', v('list')], ['value', v('chart', { attribute: 'name' })]] },
      { act: 'make', each: 'counted', after: [1, 2], expand: false, about: 'one item per kind, with its count', args: [['kind', v('item')], ['value', b('counted', 'kind', { attribute: 'text' })], ['value', b('counted', 'count', { attribute: 'quantity' })], ['value', b('list', undefined, { attribute: 'list' })]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'things' }, { when: 'after', fact: 'exists', thing: 'list' }] },

  { shard: 'tasks', name: 'a report on a timeline', act: 'make', world: 'w.timeline', example: ['a report about what we did'],
    about: 'A report about what was done, on a timeline (w.timeline): one event per act done, in order, at its place in the history.',
    goal: { kind: { value: 'report' } },
    bind: { done: { history: true }, timeline: { step: [1] } },
    steps: [
      { act: 'make', expand: false, about: 'make the timeline', args: [['kind', v('timeline')], ['value', v('report', { attribute: 'name' })]] },
      { act: 'make', each: 'done', after: [1], expand: false, about: 'one event per act done', args: [['kind', v('event')], ['value', b('done', 'act', { attribute: 'title' })], ['value', b('done', 'thing', { attribute: 'about' })], ['value', b('done', 'at', { attribute: 'at' })], ['value', b('timeline', undefined, { attribute: 'timeline' })]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'done' }, { when: 'after', fact: 'exists', thing: 'timeline' }] },

  { shard: 'tasks', name: 'a report as a list', act: 'make', world: 'w.list', example: ['a report about what we did'],
    about: 'A report about what was done, as a list (w.list): one item per act done, numbered in order.',
    goal: { kind: { value: 'report' } },
    bind: { done: { history: true }, list: { step: [1] } },
    steps: [
      { act: 'make', expand: false, about: 'make the list', args: [['kind', v('list')], ['value', v('report', { attribute: 'name' })]] },
      { act: 'make', each: 'done', after: [1], expand: false, about: 'one item per act done', args: [['kind', v('item')], ['value', b('done', 'act', { attribute: 'text' })], ['value', b('done', 'thing', { attribute: 'note' })], ['value', b('done', 'at', { attribute: 'n' })], ['value', b('list', undefined, { attribute: 'list' })]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'done' }, { when: 'after', fact: 'exists', thing: 'list' }] },
];

// Words that name the named tasks, for the vocabulary (a host finds the methods of a task by these words).
export const TASK_WORDS = [
  ['family photo', ['family photo', 'family picture', 'group photo']],
  ['table setting', ['set a table', 'set the table', 'lay the table', 'table setting', 'place setting']],
  ['chart', ['chart', 'bar chart', 'tally']],
  ['report', ['report', 'summary', 'what we did']],
];

const id = (m) => seg(m);
function methodLines(m) {
  const M = id(m.name), out = [];
  out.push(wire(`k.procedures.method.${M}`, 'k.procedures.method', [['name', text(m.name)], ['about', text(m.about)], ['act', m.act], ['world', m.world], ['rank', m.rank], ...(m.example ?? []).map((e) => ['example', text(e)])], SRC));
  for (const [role, g] of Object.entries(m.goal ?? {})) out.push(wire(`k.procedures.goal.${M}.${seg(role)}`, 'k.procedures.goal', [['method', text(m.name)], ['role', role], ['from', g.from], ['by', g.by], ['value', g.value], ['kind', g.kind], ['rel', g.rel], ['needed', g.needed], ['default', g.default]], SRC));
  for (const [name, x] of Object.entries(m.bind ?? {})) {
    out.push(wire(`k.procedures.binding.${M}.${name}`, 'k.procedures.binding', [['method', text(m.name)], ['name', name], ['goal', x.goal], ...(x.step ?? []).map((s) => ['step', s]), ['from', x.from], ['live', x.live], ['history', x.history], ['upto', x.upto], ...(x.together ?? []).map((t) => ['together', t]), ['value', x.value], ['key', x.key]], SRC));
    for (const [key, t] of Object.entries(x.match ?? {})) out.push(wire(`k.procedures.match.${M}.${name}.${key}`, 'k.procedures.match', [['method', text(m.name)], ['binding', name], ['key', key], ['value', t.value], ['not', t.not], ['equals', t.equals], ['equals_key', t.equals_key], ['present', t.present]], SRC));
  }
  m.steps.forEach((s, i) => {
    const n = i + 1;
    out.push(wire(`k.procedures.step.${M}.${n}`, 'k.procedures.step', [['method', text(m.name)], ['n', n], ['act', s.act], ['each', s.each], ...(s.after ?? []).map((a) => ['after', a]), ['expand', s.expand], ['optional', s.optional], ['about', s.about && text(s.about)]], SRC));
    for (const [role, a] of s.args) out.push(wire(`k.procedures.arg.${M}.${n}.${seg(role)}${a.attribute ? `.${a.attribute}` : ''}`, 'k.procedures.arg', [['method', text(m.name)], ['step', n], ['role', role], ['attribute', a.attribute], ['binding', a.binding], ['key', a.key], ['else_key', a.else_key], ['value', a.value], ['rel', a.rel], ['of', a.of]], SRC));
  });
  for (const [i, c] of (m.conditions ?? []).entries()) out.push(wire(`k.procedures.condition.${M}.${i + 1}`, 'k.procedures.condition', [['method', text(m.name)], ['n', i + 1], ['step', c.step], ['when', c.when], ['fact', c.fact], ['thing', c.thing], ['other', c.other], ['attribute', c.attribute], ['value', c.value]], SRC));
  return out;
}

export function procedureShards() {
  const files = {};
  const about = {
    'from-knowledge': 'methods whose steps are read off other knowledge worlds: compose a scene (k.scenes), arrange in a layout and put on an anchor (k.layouts), take apart (k.objects, k.parts), build from parts (k.layouts joins), dress (k.wearables), a person or a face of a role (k.people), a feeling on a face (k.feelings, w.face), a place on the map (k.geo, w.map).',
    tasks: 'methods of named tasks: a family photo, setting a table (a picture or w.seating), a chart of the things there (w.list), a report about what was done (w.timeline or w.list); and the words that name the tasks.',
  };
  for (const shard of ['from-knowledge', 'tasks']) {
    const ms = METHODS.filter((m) => m.shard === shard);
    const body = ms.map((m) => `# ${m.name}\n${methodLines(m).join('\n')}`).join('\n\n');
    const words = shard === 'tasks' ? `\n\n# Words for the named tasks (the value of the goal role kind).\n${TASK_WORDS.map(([task, ws]) => wire(`k.procedures.word.task.${seg(task)}`, 'core.word', [...ws.map((w) => ['text', w]), ['means', task], ['of', 'k.procedures.goal.value']], SRC)).join('\n')}` : '';
    files[`${shard}.sop`] = `${header({ id: `k.procedures/shards/${shard}`, about: `${ms.length} ${about[shard]}`, sources: ['hand-core 1 (hand-written in this repository: tools/procedures-core.mjs)'], license: 'CC0-1.0', script: 'tools/procedures-core.mjs' })}\n${body}${words}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = procedureShards();
  writeShards(join(WORLDS_DIR, 'k.procedures', 'shards'), files);
  for (const [n, t] of Object.entries(files)) console.log(n, t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes');
}
