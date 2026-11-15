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

  { shard: 'tasks', name: 'a chart of the things there in a chart', act: 'make', world: 'w.chart', example: ['a chart of the things in the picture'],
    about: 'A chart of the things there, in a chart (w.chart): a bar chart with one series of counts, one value per kind with its count.',
    goal: { kind: { value: 'chart' } },
    bind: { things: { live: 'any' }, counted: { step: [1] }, chart: { step: [2] }, series: { step: [3] } },
    steps: [
      { act: 'ask', expand: false, about: 'count the things of each kind', args: [['topic', v('count')], ['thing', b('things')]] },
      { act: 'make', expand: false, about: 'make the bar chart', args: [['kind', v('chart')], ['value', v('chart', { attribute: 'title' })], ['value', v('bar', { attribute: 'form' })]] },
      { act: 'make', after: [2], expand: false, about: 'make its series of counts', args: [['kind', v('series')], ['value', v('count', { attribute: 'name' })], ['value', b('chart', undefined, { attribute: 'chart' })]] },
      { act: 'make', each: 'counted', after: [1, 3], expand: false, about: 'one value per kind, with its count', args: [['kind', v('point')], ['value', b('counted', 'kind', { attribute: 'category' })], ['value', b('counted', 'count', { attribute: 'value' })], ['value', b('series', undefined, { attribute: 'series' })]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'things' }, { when: 'after', fact: 'exists', thing: 'chart' }] },

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

  // ---- compositions (block "15:00" item 3): a genre of k.genres written as a w.document, its choice points as
  // `choose` bindings solved jointly under their matches and sampled by k.interest (questions.md Q57) ----
  { shard: 'compose', name: 'write a story', act: 'make', world: 'w.document', example: ['write a story', 'tell me a story', 'tell me a story about a dragon'],
    about: 'A story by the book (k.story, the genre "story" of k.genres): choose together a goal, an obstacle that blocks it, a setting that has the obstacle, the means that overcomes it, the act that uses the means, a helper who has the means, a protagonist who can have the goal and lacks the means, one to three attempts that fail, and the target of the goal; then make the document and one chapter per part of the genre. Each element of k.story is the binding of its name (turning point: turning_point); std.compose tells it in its part with its move. A topic ("a story about a dragon", the role topic of make) is preferred as the obstacle, setting, helper, protagonist or target.',
    goal: { kind: { value: 'story' }, topic: {} },
    bind: {
      // "a story about a dragon": the topic is preferred (soft, Q57) as the obstacle, the setting, the helper, the
      // protagonist or the target; a hard "one of them is the topic" is a disjunction the format cannot say.
      topic: { goal: 'topic' },
      doc: { step: [1] },
      parts: { from: 'k.genres.part', match: { genre: { value: 'story' } } },
      goal: { from: 'k.story.goal', choose: 1 },
      goal_act: { from: 'k.actions.action', choose: 1, match: { name: { equals: 'goal', equals_key: 'act' }, who: { equals: 'protagonist', equals_key: 'name' } } },
      obstacle: { from: 'k.story.obstacle', choose: 1, match: { blocks: { equals: 'goal', equals_key: 'name' }, thing: { equals: 'topic', soft: true } } },
      setting: { from: 'k.scenes.has', choose: 1, match: { thing: { equals: 'obstacle', equals_key: 'thing' }, scene: { equals: 'topic', soft: true } } },
      means: { from: 'k.story.obstacle', key: 'means', choose: 1, match: { thing: { equals: 'obstacle', equals_key: 'thing' }, blocks: { equals: 'obstacle', equals_key: 'blocks' } } },
      resolution: { from: 'k.actions.action', choose: 1, match: { name: { equals: 'obstacle', equals_key: 'overcome_by' }, tool: { equals: 'means' }, who: { equals: 'protagonist', equals_key: 'name' } } },
      helper_holds: { from: 'k.people.role', match: { holds: { equals: 'means' } } },
      helper_uses: { from: 'k.people.role', match: { uses: { equals: 'means' } } },
      helper: { together: ['helper_holds', 'helper_uses'], choose: 1, match: { works_at: { equals: 'setting', equals_key: 'scene', soft: true }, name: { equals: 'topic', soft: true } } },
      protagonist_kind: { from: 'k.people.kind' },
      protagonist_role: { from: 'k.people.role', match: { group: { present: true } } },
      protagonist_animal: { from: 'k.animals.animal' },
      protagonist: { together: ['protagonist_kind', 'protagonist_role', 'protagonist_animal'], choose: 1, match: { holds: { differs: 'means' }, uses: { differs: 'means' }, name: [{ differs: 'helper', equals_key: 'name' }, { equals: 'topic', soft: true }], works_at: { equals: 'setting', equals_key: 'scene', soft: true } } },
      attempts_min: { from: 'k.story.element', key: 'min', match: { name: { value: 'attempt' } } },
      attempts_max: { from: 'k.story.element', key: 'max', match: { name: { value: 'attempt' } } },
      attempt: { from: 'k.actions.action', choose: 'attempts_max', choose_min: 'attempts_min', match: { name: { equals: 'obstacle', equals_key: 'tried_by' }, who: { equals: 'protagonist', equals_key: 'name' } } },
      goal_place: { from: 'k.story.goal', match: { target: { value: 'place' }, name: { equals: 'goal', equals_key: 'name' } } },
      goal_thing: { from: 'k.story.goal', match: { target: { value: 'thing' }, name: { equals: 'goal', equals_key: 'name' } } },
      goal_being: { from: 'k.story.goal', match: { target: { value: 'being' }, name: { equals: 'goal', equals_key: 'name' } } },
      thing_names: { from: 'k.actions.action', key: 'object', match: { name: { equals: 'goal_thing', equals_key: 'act' } } },
      being_names: { from: 'k.actions.action', key: 'object', match: { name: { equals: 'goal_being', equals_key: 'act' } } },
      beings: { together: ['protagonist_kind', 'protagonist_role', 'protagonist_animal'], key: 'name' },
      target_place: { from: 'k.scenes.scene', match: { kind: { equals: 'goal_place', equals_key: 'place_kind' }, name: { differs: 'setting', equals_key: 'scene' } } },
      target_thing: { from: 'k.objects.object', match: { name: { equals: 'thing_names' } } },
      target_being: { together: ['being_names'], match: { name: { equals: 'beings' } } },
      target: { together: ['target_place', 'target_thing', 'target_being'], choose: 1, match: { name: [{ differs: 'protagonist', equals_key: 'name' }, { differs: 'helper', equals_key: 'name' }, { equals: 'topic', soft: true }] } },
      turning_point: { value: 'give' },
      ending: { together: ['goal'] },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the document of the story, titled by its target', args: [['kind', v('document')], ['value', b('target', undefined, { attribute: 'title' })], ['value', v('story', { attribute: 'genre' })], ['value', v('narrative', { attribute: 'register' })], ['value', b('target', undefined, { attribute: 'topic' })]] },
      { act: 'make', each: 'parts', after: [1], expand: false, about: 'one chapter for each part of the story genre (orientation, complication, climax, resolution, ending)', args: [['kind', v('chapter')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('parts', 'n', { attribute: 'n' })], ['value', b('parts', 'name', { attribute: 'part' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'doc' }] },

  { shard: 'compose', name: 'write a presentation about a topic', act: 'make', world: 'w.document', example: ['write a presentation about penguins', 'make slides about Peru'],
    about: 'A presentation (the genre "presentation" of k.genres) about a topic: choose three to five points, statements of the catalog about the topic on different keys, sampled by k.interest; then make the document, the title, agenda, summary and closing slides, and one content slide per point.',
    goal: { kind: { value: 'presentation' }, topic: { needed: true } },
    bind: {
      topic: { goal: 'topic' }, doc: { step: [1] },
      single: { from: 'k.genres.part', match: { genre: { value: 'presentation' }, max: { value: 1 } } },
      points_min: { from: 'k.genres.part', key: 'min', match: { genre: { value: 'presentation' }, name: { value: 'point' } } },
      points_max: { from: 'k.genres.part', key: 'max', match: { genre: { value: 'presentation' }, name: { value: 'point' } } },
      point_part: { from: 'k.genres.part', match: { genre: { value: 'presentation' }, name: { value: 'point' } } },
      points: { about: 'topic', choose: 'points_max', choose_min: 'points_min', match: { key: { differs: 'points' } } },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the document of the presentation', args: [['kind', v('document')], ['value', b('topic', undefined, { attribute: 'title' })], ['value', v('presentation', { attribute: 'genre' })], ['value', v('presentation', { attribute: 'register' })], ['value', b('topic', undefined, { attribute: 'topic' })]] },
      { act: 'make', each: 'single', after: [1], expand: false, about: 'the slides of the parts that occur once (title, agenda, summary, closing)', args: [['kind', v('slide')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('single', 'n', { attribute: 'n' })], ['value', b('single', 'name', { attribute: 'part' })], ['value', b('single', 'layout', { attribute: 'layout' })], ['value', b('single', 'heading', { attribute: 'title', else_key: 'name' })]] },
      { act: 'make', each: 'points', after: [1], expand: false, about: 'one content slide per point', args: [['kind', v('slide')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('point_part', 'n', { attribute: 'n' })], ['value', v('point', { attribute: 'part' })], ['value', v('content', { attribute: 'layout' })], ['value', b('points', undefined, { attribute: 'title' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'doc' }] },

  { shard: 'compose', name: 'write an essay about a topic', act: 'make', world: 'w.document', example: ['write an essay about penguins'],
    about: 'An essay (the genre "essay" of k.genres) about a topic: choose two to four arguments, statements about the topic on different keys, and a counterargument on another key, sampled by k.interest (arguments that surprise, a counterargument that is what a reader assumes); then make the document, the introduction, counterargument and conclusion chapters and one chapter per argument.',
    goal: { kind: { value: 'essay' }, topic: { needed: true } },
    bind: {
      topic: { goal: 'topic' }, doc: { step: [1] },
      single: { from: 'k.genres.part', match: { genre: { value: 'essay' }, max: { value: 1 } } },
      args_min: { from: 'k.genres.part', key: 'min', match: { genre: { value: 'essay' }, name: { value: 'argument' } } },
      args_max: { from: 'k.genres.part', key: 'max', match: { genre: { value: 'essay' }, name: { value: 'argument' } } },
      argument_part: { from: 'k.genres.part', match: { genre: { value: 'essay' }, name: { value: 'argument' } } },
      arguments: { about: 'topic', choose: 'args_max', choose_min: 'args_min', match: { key: { differs: 'arguments' } } },
      counterargument: { about: 'topic', choose: 1, match: { key: { differs: 'arguments', equals_key: 'key' } } },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the document of the essay', args: [['kind', v('document')], ['value', b('topic', undefined, { attribute: 'title' })], ['value', v('essay', { attribute: 'genre' })], ['value', v('essay', { attribute: 'register' })], ['value', b('topic', undefined, { attribute: 'topic' })]] },
      { act: 'make', each: 'single', after: [1], expand: false, about: 'the chapters of the parts that occur once (introduction, counterargument, conclusion)', args: [['kind', v('chapter')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('single', 'n', { attribute: 'n' })], ['value', b('single', 'name', { attribute: 'part' })], ['value', b('single', 'heading', { attribute: 'title', else_key: 'name' })]] },
      { act: 'make', each: 'arguments', after: [1], expand: false, about: 'one chapter per argument', args: [['kind', v('chapter')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('argument_part', 'n', { attribute: 'n' })], ['value', v('argument', { attribute: 'part' })], ['value', b('arguments', undefined, { attribute: 'title' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'doc' }] },

  { shard: 'compose', name: 'write a scientific article about a topic', act: 'make', world: 'w.document', example: ['write a scientific article about penguins', 'a paper about Peru'],
    about: 'A scientific article (the genre "scientific article" of k.genres, IMRaD) about a topic: choose two to five results, statements about the topic on different keys, sampled by k.interest (numbers with units first); the methods are the types of the catalog those statements come from; then make the document and one chapter per required part (abstract, introduction, methods, results, discussion).',
    goal: { kind: { value: 'scientific article' }, topic: { needed: true } },
    bind: {
      topic: { goal: 'topic' }, doc: { step: [1] },
      parts: { from: 'k.genres.part', match: { genre: { value: 'scientific article' }, min: { not: 0 } } },
      results_min: { from: 'k.genres.step', key: 'min', match: { genre: { value: 'scientific article' }, part: { value: 'results' }, move: { value: 'report result' } } },
      results_max: { from: 'k.genres.step', key: 'max', match: { genre: { value: 'scientific article' }, part: { value: 'results' }, move: { value: 'report result' } } },
      results: { about: 'topic', choose: 'results_max', choose_min: 'results_min', match: { key: { differs: 'results' } } },
      methods: { together: ['results'], key: 'type' },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the document of the article', args: [['kind', v('document')], ['value', b('topic', undefined, { attribute: 'title' })], ['value', v('scientific article', { attribute: 'genre' })], ['value', v('scientific', { attribute: 'register' })], ['value', b('topic', undefined, { attribute: 'topic' })]] },
      { act: 'make', each: 'parts', after: [1], expand: false, about: 'one chapter per required part, under its heading', args: [['kind', v('chapter')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('parts', 'n', { attribute: 'n' })], ['value', b('parts', 'name', { attribute: 'part' })], ['value', b('parts', 'heading', { attribute: 'title', else_key: 'name' })]] },
    ],
    conditions: [{ when: 'after', fact: 'exists', thing: 'doc' }] },

  { shard: 'compose', name: 'write a report of what was done', act: 'make', world: 'w.document', example: ['write a report', 'a report about what we did'],
    about: 'A report (the genre "report" of k.genres) of what was done in the session: choose one to six of the acts done (the history), one to four things there now as results, and one to three acts not yet done as next steps, sampled by k.interest; then make the document and one chapter per required part (summary, introduction, work done, results, next steps).',
    goal: { kind: { value: 'report' } },
    bind: {
      doc: { step: [1] }, done: { history: true },
      parts: { from: 'k.genres.part', match: { genre: { value: 'report' }, min: { not: 0 } } },
      work_min: { from: 'k.genres.step', key: 'min', match: { genre: { value: 'report' }, part: { value: 'work done' } } },
      work_max: { from: 'k.genres.step', key: 'max', match: { genre: { value: 'report' }, part: { value: 'work done' } } },
      work: { together: ['done'], choose: 'work_max', choose_min: 'work_min' },
      results_min: { from: 'k.genres.step', key: 'min', match: { genre: { value: 'report' }, part: { value: 'results' }, move: { value: 'report result' } } },
      results_max: { from: 'k.genres.step', key: 'max', match: { genre: { value: 'report' }, part: { value: 'results' }, move: { value: 'report result' } } },
      results: { live: 'any', choose: 'results_max', choose_min: 'results_min' },
      next_min: { from: 'k.genres.step', key: 'min', match: { genre: { value: 'report' }, part: { value: 'next steps' } } },
      next_max: { from: 'k.genres.step', key: 'max', match: { genre: { value: 'report' }, part: { value: 'next steps' } } },
      next: { from: 'k.actions.act', choose: 'next_max', choose_min: 'next_min', match: { name: { differs: 'done', equals_key: 'act' } } },
    },
    steps: [
      { act: 'make', expand: false, about: 'make the document of the report', args: [['kind', v('document')], ['value', v('report', { attribute: 'title' })], ['value', v('report', { attribute: 'genre' })], ['value', v('report', { attribute: 'register' })]] },
      { act: 'make', each: 'parts', after: [1], expand: false, about: 'one chapter per required part, under its heading', args: [['kind', v('chapter')], ['value', b('doc', undefined, { attribute: 'document' })], ['value', b('parts', 'n', { attribute: 'n' })], ['value', b('parts', 'name', { attribute: 'part' })], ['value', b('parts', 'heading', { attribute: 'title', else_key: 'name' })]] },
    ],
    conditions: [{ when: 'before', fact: 'exists', thing: 'done' }, { when: 'after', fact: 'exists', thing: 'doc' }] },
];

// Words that name the named tasks, for the vocabulary (a host finds the methods of a task by these words).
export const TASK_WORDS = [
  ['family photo', ['family photo', 'family picture', 'group photo']],
  ['table setting', ['set a table', 'set the table', 'lay the table', 'table setting', 'place setting']],
  ['chart', ['chart', 'bar chart', 'tally']],
  ['report', ['report', 'summary', 'what we did']],
  ['story', ['story', 'tale', 'fairy tale']],
  ['presentation', ['presentation', 'slides', 'talk', 'slide show']],
  ['essay', ['essay', 'composition']],
  ['scientific article', ['scientific article', 'paper', 'research article', 'article']],
];

// Everyday procedures (block 07:30 item 2, PSys2 Q17: "a flowchart of making tea" found only the planner's drawing
// methods): k.procedures.howto facts, apart from the methods. A step is [about, { role, after, branch, detail }];
// `after` defaults to the step before (none for the first). `words` name the procedure as people ask for it: gerunds,
// nouns and "how to" forms only ("make a cup of tea" may ask for a drawing of one).
const CDC = 'Centers for Disease Control and Prevention (CDC), "When and How to Wash Your Hands", Handwashing in Community Settings (2023)';
const ADA = 'American Dental Association, "Brushing Your Teeth", MouthHealthy (mouthhealthy.org, read 2026-11-15; facts only, no text taken)';
const GCC = 'The Green Cross Code (UK road safety for pedestrians), as given by Milton Keynes City Council, "Green Cross Code" (milton-keynes.gov.uk, read 2026-11-15; facts only, no text taken)';
const FOODSAFETY = 'FoodSafety.gov (U.S. Department of Health and Human Services), "4 Steps to Food Safety" (read 2026-11-15)';
const USFA = 'U.S. Fire Administration (FEMA), "Stop, drop and roll" pictograph (usfa.fema.gov, read 2026-11-15)';
const READY = 'Ready.gov (FEMA), "Earthquakes": Survive DURING, Drop, Cover, then Hold On (read 2026-11-15)';
const CDC_COUGH = 'Centers for Disease Control and Prevention (CDC), "Healthy Habits: Coughing and Sneezing" (cdc.gov, read 2026-11-15)';
export const HOWTOS = [
  { name: 'making tea', basis: 'own', words: ['making a cup of tea', 'tea making', 'how to make tea'],
    about: 'a cup of tea with a tea bag, as it is usually made',
    steps: [['Boil water'], ['Put a tea bag in a cup'], ['Pour the hot water into the cup'], ['Let it steep for a few minutes'],
      ['Take out the tea bag'], ['Milk or sugar?', { role: 'decision' }], ['Add milk or sugar', { branch: 'yes' }],
      ['Drink the tea', { after: [6, 7], branch: 'no' }]] },
  { name: 'washing hands', basis: 'cited', license: 'public-domain', cite: CDC, words: ['washing your hands', 'handwashing', 'hand washing', 'how to wash your hands', 'how to wash hands'],
    about: 'washing hands with soap and water, in the five steps of the CDC (wet, lather, scrub, rinse, dry)',
    steps: [['Wet your hands', { detail: 'Wet your hands with clean, running water (warm or cold), turn off the tap, and apply soap.' }],
      ['Lather with soap', { detail: 'Lather your hands by rubbing them together with the soap. Lather the backs of your hands, between your fingers, and under your nails.' }],
      ['Scrub for 20 seconds', { detail: 'Scrub your hands for at least 20 seconds.' }],
      ['Rinse your hands', { detail: 'Rinse your hands well under clean, running water.' }],
      ['Dry your hands', { detail: 'Dry your hands using a clean towel or an air dryer.' }]] },
  { name: 'planting a seed', basis: 'own', words: ['sowing a seed', 'planting seeds', 'sowing seeds', 'how to plant a seed', 'how to sow seeds'],
    about: 'a seed sown in a pot, as it is usually done',
    steps: [['Fill a pot with soil'], ['Make a small hole in the soil'], ['Put the seed in the hole'], ['Cover the seed with soil'],
      ['Water the soil'], ['Put the pot in a warm, light place'], ['Is the soil dry?', { role: 'decision' }],
      ['Water the soil again', { branch: 'yes' }], ['Wait for the seed to sprout', { after: [7, 8], branch: 'no' }]] },
  // 20 more (reviewer 19:05, fourth worker): six cited (the words of the source kept in `detail`), fourteen own
  // brushing teeth and crossing the road: the steps are facts read where `cite` says, written here in our own words
  // (basis=paraphrased, no quotation: the ADA's and the council's pages are not under a licence we may republish)
  { name: 'brushing teeth', basis: 'paraphrased', cite: ADA, words: ['brushing your teeth', 'tooth brushing', 'toothbrushing', 'how to brush your teeth', 'how to brush teeth'],
    about: 'brushing the teeth twice a day with a soft brush, after the steps the American Dental Association gives',
    steps: [['Tilt the brush towards the gums'], ['Brush gently back and forth, one tooth at a time'],
      ['Clean the outside, the inside and the tops of the teeth'], ['Turn the brush upright for the inside of the front teeth']] },
  { name: 'crossing the road', basis: 'paraphrased', cite: GCC, words: ['crossing the street', 'crossing a road', 'green cross code', 'how to cross the road', 'how to cross the street'],
    about: 'crossing a road on foot, after the six steps of the Green Cross Code (think, stop, look, wait, look and listen again, arrive alive)',
    steps: [['Think: choose a safe place to cross', { detail: 'A crossing with lights or stripes, a bridge or a subway is safest.' }],
      ['Stop near the edge of the pavement'], ['Look both ways and listen'], ['Is traffic coming?', { role: 'decision' }],
      ['Wait until it has gone by', { branch: 'yes' }], ['Cross in a straight line', { after: [4, 5], branch: 'no' }],
      ['Keep looking and listening until you are across']] },
  { name: 'keeping food safe', basis: 'cited', license: 'public-domain', cite: FOODSAFETY, words: ['food safety', 'safe food handling', 'clean separate cook chill', 'how to keep food safe'],
    about: 'the four steps to food safety at home: clean, separate, cook, chill',
    steps: [['Clean', { detail: 'Wash cutting boards, dishes, utensils, and countertops with hot, soapy water.' }],
      ['Separate', { detail: 'Use separate cutting boards and plates for produce, meat, poultry, seafood, and eggs.' }],
      ['Cook', { detail: 'Use a food thermometer to be sure your food is safe.' }],
      ['Chill', { detail: 'Refrigerate perishable foods within 2 hours.' }]] },
  { name: 'stop, drop and roll', basis: 'cited', license: 'public-domain', cite: USFA, words: ['stop drop and roll', 'if your clothes catch fire', 'what to do if your clothes catch fire'],
    about: 'what to do if your clothes catch fire, as the U.S. Fire Administration teaches it',
    steps: [['Stop', { detail: 'If your clothes catch fire, stop, drop and roll.' }],
      ['Drop to the ground and cover your face', { detail: 'Stop, drop to the ground, and cover your face with your hands.' }],
      ['Roll until the fire is out', { detail: 'Roll over and over or back and forth until the fire is out.' }]] },
  { name: 'drop, cover and hold on', basis: 'cited', license: 'public-domain', cite: READY, words: ['drop cover and hold on', 'what to do in an earthquake', 'earthquake safety'],
    about: 'what to do while the ground shakes in an earthquake, as Ready.gov describes it',
    steps: [['Drop to your hands and knees', { detail: 'Drop to your hands and knees.' }],
      ['Cover your head and neck', { detail: 'Cover your head and neck with your arms.' }],
      ['Hold on until the shaking stops', { detail: 'Hold on to any sturdy furniture until the shaking stops.' }]] },
  { name: 'covering a cough', basis: 'cited', license: 'public-domain', cite: CDC_COUGH, words: ['covering coughs and sneezes', 'cough etiquette', 'how to cover a cough', 'how to sneeze'],
    about: 'covering a cough or a sneeze so as not to spread germs, as the CDC describes it',
    steps: [['Do you have a tissue?', { role: 'decision' }],
      ['Cough or sneeze into a tissue', { branch: 'yes', detail: 'Cover your mouth and nose with a tissue when you cough or sneeze' }],
      ['Throw the tissue in the trash', { detail: 'Throw used tissues in the trash' }],
      ['Cough or sneeze into your elbow', { after: [1], branch: 'no', detail: "If you don't have a tissue, cough or sneeze into your elbow, not your hands" }],
      ['Wash your hands', { after: [3, 4], detail: 'added here, not in the source: washing hands, the procedure of the CDC above' }]] },
  { name: 'making a sandwich', basis: 'own', words: ['sandwich making', 'how to make a sandwich'],
    about: 'a sandwich with a filling between two slices of bread, as it is usually made',
    steps: [['Take two slices of bread'], ['Spread butter on the bread'], ['Put the filling on one slice'], ['Put the other slice on top'],
      ['Cut it in half?', { role: 'decision' }], ['Cut the sandwich in half', { branch: 'yes' }], ['Serve the sandwich', { after: [5, 6], branch: 'no' }]] },
  { name: 'boiling an egg', basis: 'own', words: ['boiling eggs', 'boiled egg', 'how to boil an egg', 'how to boil eggs'],
    about: 'an egg boiled in its shell, soft or hard, as it is usually done',
    steps: [['Put the egg in a pan'], ['Cover it with cold water'], ['Bring the water to the boil'], ['Soft or hard?', { role: 'decision' }],
      ['Boil it for about 5 minutes', { branch: 'yes', detail: 'soft' }], ['Boil it for about 10 minutes', { after: [4], branch: 'no', detail: 'hard' }],
      ['Cool the egg in cold water', { after: [5, 6] }], ['Peel the egg']] },
  { name: 'making toast', basis: 'own', words: ['toasting bread', 'how to make toast'],
    about: 'a slice of bread toasted in a toaster',
    steps: [['Put a slice of bread in the toaster'], ['Set how brown it should be'], ['Press the lever down'], ['Wait until the toast pops up'],
      ['Is it brown enough?', { role: 'decision' }], ['Toast it a little longer', { branch: 'yes' }], ['Spread butter or jam on it', { after: [5, 6], branch: 'no' }]] },
  { name: 'cooking pasta', basis: 'own', words: ['boiling pasta', 'how to cook pasta', 'how to make pasta'],
    about: 'dried pasta boiled in salted water, as it is usually cooked',
    steps: [['Boil a large pan of water'], ['Add salt to the water'], ['Put the pasta in the water'], ['Stir it now and then'],
      ['Cook it for the time on the packet'], ['Is it soft enough?', { role: 'decision' }], ['Cook it a minute longer', { branch: 'no' }],
      ['Drain the pasta', { after: [6, 7], branch: 'yes' }], ['Add the sauce']] },
  { name: 'making the bed', basis: 'own', words: ['making your bed', 'bed making', 'how to make the bed', 'how to make a bed'],
    about: 'a bed made in the morning, as it is usually done',
    steps: [['Take off the pillows'], ['Straighten the sheet'], ['Shake out the duvet'], ['Spread the duvet over the bed'], ['Put the pillows back']] },
  { name: 'doing the laundry', basis: 'own', words: ['washing clothes', 'doing laundry', 'laundry', 'how to do the laundry', 'how to wash clothes'],
    about: 'clothes washed in a washing machine and dried, as it is usually done',
    steps: [['Sort the clothes by colour'], ['Put the clothes in the washing machine'], ['Add detergent'], ['Choose the programme and start the machine'],
      ['Take the clothes out when it stops'], ['Can they go in the dryer?', { role: 'decision' }], ['Dry them in the dryer', { branch: 'yes' }],
      ['Hang them up to dry', { after: [6], branch: 'no' }], ['Fold the clothes and put them away', { after: [7, 8] }]] },
  { name: 'washing the dishes', basis: 'own', words: ['washing up', 'doing the dishes', 'dishwashing', 'how to wash the dishes', 'how to wash dishes'],
    about: 'dishes washed by hand in a sink, as it is usually done',
    steps: [['Scrape the food off the dishes'], ['Fill the sink with hot, soapy water'], ['Wash each dish with a sponge'], ['Rinse it in clean water'],
      ['Put it on the rack to dry'], ['Are there more dishes?', { role: 'decision' }], ['Wash the next dish', { branch: 'yes' }],
      ['Empty the sink', { after: [6, 7], branch: 'no' }]] },
  { name: 'setting the table', basis: 'own', words: ['laying the table', 'how to set the table', 'how to lay the table'],
    about: 'a table set for a meal, one place for each person',
    steps: [['Put a plate at each place'], ['Put the fork on the left of the plate'], ['Put the knife and spoon on the right'], ['Put a glass above the knife'],
      ['Put a napkin at each place'], ['Put the food and drinks in the middle']] },
  { name: 'packing a school bag', basis: 'own', words: ['packing your school bag', 'packing a schoolbag', 'how to pack a school bag'],
    about: 'a school bag packed the evening before a school day',
    steps: [['Look at tomorrow\'s timetable'], ['Put in the books and notebooks for each lesson'], ['Put in the pencil case'],
      ['Is there sport tomorrow?', { role: 'decision' }], ['Pack the sports kit', { branch: 'yes' }], ['Put in the lunch box and a water bottle', { after: [4, 5], branch: 'no' }],
      ['Close the bag and put it by the door']] },
  { name: 'feeding a pet', basis: 'own', words: ['feeding the cat', 'feeding the dog', 'how to feed a pet'],
    about: 'a cat or a dog fed at home, as it is usually done',
    steps: [['Wash the bowl'], ['Measure out the food'], ['Put the food in the bowl'], ['Fill the water bowl with fresh water'], ['Put the bowls in their place']] },
  { name: 'watering a plant', basis: 'own', words: ['watering plants', 'watering the plants', 'how to water a plant'],
    about: 'a pot plant watered at home',
    steps: [['Touch the soil'], ['Is the soil dry?', { role: 'decision' }], ['Pour water on the soil until it drains out', { branch: 'yes' }],
      ['Empty the saucer', { after: [3] }], ['Check again in a few days', { after: [2, 4], branch: 'no' }]] },
  { name: 'getting dressed', basis: 'own', words: ['dressing', 'how to get dressed'],
    about: 'getting dressed in the morning',
    steps: [['Look at the weather'], ['Choose clothes for the day'], ['Put on underwear and socks'], ['Put on trousers or a skirt'],
      ['Put on a shirt or a top'], ['Is it cold?', { role: 'decision' }], ['Put on a jumper', { branch: 'yes' }], ['Put on your shoes', { after: [6, 7], branch: 'no' }]] },
  { name: 'tying shoelaces', basis: 'own', words: ['tying your shoes', 'tying a shoelace', 'how to tie shoelaces', 'how to tie your shoes'],
    about: 'shoelaces tied in a bow (the loop, swoop and pull way)',
    steps: [['Cross the laces and pull them tight'], ['Make a loop with one lace'], ['Wrap the other lace around the loop'], ['Push it through the hole to make a second loop'],
      ['Pull both loops tight']] },
  { name: 'sending a letter', basis: 'own', words: ['posting a letter', 'mailing a letter', 'how to send a letter', 'how to post a letter'],
    about: 'a letter sent by post',
    steps: [['Write the letter'], ['Fold it and put it in an envelope'], ['Seal the envelope'], ['Write the address on the envelope'],
      ['Stick a stamp on it'], ['Put it in a post box']] },
];

function howtoLines(h) {
  const H = seg(h.name), out = [];
  out.push(wire(`k.procedures.howto.${H}`, 'k.procedures.howto', [['name', text(h.name)], ['about', text(h.about)], ['basis', h.basis], ['cite', h.cite && text(h.cite)], ['core.license', h.license]], SRC));
  h.steps.forEach(([about, o = {}], i) => {
    const n = i + 1, after = o.after ?? (n > 1 ? [n - 1] : []);
    out.push(wire(`k.procedures.howto_step.${H}.${n}`, 'k.procedures.howto_step', [['howto', text(h.name)], ['n', n], ['about', text(about)], ['role', o.role ?? 'process'], ...after.map((a) => ['after', a]), ['branch', o.branch], ['detail', o.detail && text(o.detail)], ['core.license', o.detail && h.license]], SRC));
  });
  out.push(wire(`k.procedures.word.howto.${H}`, 'core.word', [...h.words.map((w) => ['text', w]), ['means', h.name], ['of', 'k.procedures.howto.name']], SRC));
  return out;
}

// Block 07:30 item 3 (PSys2 Q17: a random flowchart was "a face of a role"): the methods a person would ask to see as a
// procedure, whose goal is a task named in plain words and whose steps, read aloud, are steps a person could follow.
// Every other method is one of the app's ways to reach a goal (an anchor, a wearable, a face's variant, a map view,
// a world's rendering of a task that has a plain method: the list of the things there beside the bar chart, the
// seating plan beside setting a table): `user_facing=false`.
export const USER_FACING = new Set(['compose a scene', 'build from parts', 'set a table', 'a chart of the things there in a chart',
  'write a story', 'write a presentation about a topic', 'write an essay about a topic', 'write a scientific article about a topic', 'write a report of what was done']);

const id = (m) => seg(m);
function methodLines(m) {
  const M = id(m.name), out = [];
  out.push(wire(`k.procedures.method.${M}`, 'k.procedures.method', [['name', text(m.name)], ['about', text(m.about)], ['act', m.act], ['world', m.world], ['rank', m.rank], ['user_facing', USER_FACING.has(m.name)], ...(m.example ?? []).map((e) => ['example', text(e)])], SRC));
  for (const [role, g] of Object.entries(m.goal ?? {})) out.push(wire(`k.procedures.goal.${M}.${seg(role)}`, 'k.procedures.goal', [['method', text(m.name)], ['role', role], ['from', g.from], ['by', g.by], ['value', g.value], ['kind', g.kind], ['rel', g.rel], ['needed', g.needed], ['default', g.default]], SRC));
  for (const [name, x] of Object.entries(m.bind ?? {})) {
    out.push(wire(`k.procedures.binding.${M}.${name}`, 'k.procedures.binding', [['method', text(m.name)], ['name', name], ['goal', x.goal], ...(x.step ?? []).map((s) => ['step', s]), ['from', x.from], ['live', x.live], ['history', x.history], ['upto', x.upto], ...(x.together ?? []).map((t) => ['together', t]), ['value', x.value], ['about', x.about], ['key', x.key], ['choose', x.choose], ['choose_min', x.choose_min]], SRC));
    // A match is one spec, or a list of specs on the same key (told apart by n: questions.md Q57).
    for (const [key, spec] of Object.entries(x.match ?? {})) for (const [i, t] of [].concat(spec).entries()) {
      const n = Array.isArray(spec) ? i + 1 : undefined;
      out.push(wire(`k.procedures.match.${M}.${name}.${key}${n ? `.${n}` : ''}`, 'k.procedures.match', [['method', text(m.name)], ['binding', name], ['key', key], ['n', n], ['value', t.value], ['not', t.not], ['equals', t.equals], ['equals_key', t.equals_key], ['differs', t.differs], ['present', t.present], ['soft', t.soft]], SRC));
    }
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
    tasks: 'methods of named tasks: a family photo, setting a table (a picture or w.seating), a chart of the things there (w.list or w.chart), a report about what was done (w.timeline or w.list); and the words that name the tasks.',
    compose: 'compositions by the book (block "15:00" item 3): a story (k.story), a presentation, an essay, a scientific article about a topic and a report of what was done, each a genre of k.genres written as a w.document; their choices are `choose` bindings solved jointly under their matches and sampled by k.interest (the format addition proposed in questions.md Q57).',
  };
  for (const shard of ['from-knowledge', 'tasks', 'compose']) {
    const ms = METHODS.filter((m) => m.shard === shard);
    const body = ms.map((m) => `# ${m.name}\n${methodLines(m).join('\n')}`).join('\n\n');
    const words = shard === 'tasks' ? `\n\n# Words for the named tasks (the value of the goal role kind).\n${TASK_WORDS.map(([task, ws]) => wire(`k.procedures.word.task.${seg(task)}`, 'core.word', [...ws.map((w) => ['text', w]), ['means', task], ['of', 'k.procedures.goal.value']], SRC)).join('\n')}` : '';
    files[`${shard}.sop`] = `${header({ id: `k.procedures/shards/${shard}`, about: `${ms.length} ${about[shard]}`, sources: ['hand-core 1 (hand-written in this repository: tools/procedures-core.mjs)'], license: 'CC0-1.0', script: 'tools/procedures-core.mjs' })}\n${body}${words}\n`;
  }
  files['everyday.sop'] = `${header({ id: 'k.procedures/shards/everyday', about: `${HOWTOS.length} everyday procedures a person may ask a flowchart of (${HOWTOS.map((h) => h.name).join(', ')}; block 07:30 item 2): their steps, decisions and order, each said to be cited, paraphrased (facts read in a source, our words) or written here (own); not methods of the planner.`, sources: ['hand-core 1 (hand-written in this repository: tools/procedures-core.mjs; the instructions cited are named by `cite`; the steps of a procedure with basis=cited quote a work of the US government, public domain, marked core.license=public-domain)'], license: 'CC0-1.0 AND public-domain', script: 'tools/procedures-core.mjs' })}\n${HOWTOS.map((h) => `# ${h.name}\n${howtoLines(h).join('\n')}`).join('\n\n')}\n`;
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = procedureShards();
  writeShards(join(WORLDS_DIR, 'k.procedures', 'shards'), files);
  for (const [n, t] of Object.entries(files)) console.log(n, t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes');
}
