// Compositions in k.procedures (block "15:00" item 3): "write a story", "write a presentation / an essay / a
// scientific article about a topic", "write a report of what was done". Their choice points are `choose` bindings
// (the format addition proposed in questions.md Q57), solved here by the reference reader tools/lib/choose.mjs; the
// chosen values are handed to the library's std.plan (the one planner) as value bindings, which expands the steps
// into acts on a w.document. Checks: every name the methods use resolves (genres, parts, moves of k.genres; story
// types); hand-traced plans (a story that holds every k.story constraint, a presentation, a report) give the expected
// choices and acts; N seeded stories, each checked against every hard constraint of k.story from the facts alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds } from '../tools/lib/worlds.mjs';
import { factStore, planner as makePlanner, PlanLive } from '../tools/sopworld/sopworld.mjs';
import { methodFacts, solveChoices, fixChoices } from '../tools/lib/choose.mjs';
import { storyKb, checkPlan } from '../tools/story-core.mjs';

const published = readdirSync(WORLDS_DIR).filter((d) => /^[kw]\./.test(d) && existsSync(join(WORLDS_DIR, d, 'schema.sop'))).sort().map((id) => ({
  id, schemaText: readFileSync(join(WORLDS_DIR, id, 'schema.sop'), 'utf8'),
  shards: existsSync(join(WORLDS_DIR, id, 'shards')) ? readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().map((f) => ({ text: readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8') })) : [],
}));
const store = factStore(published);
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const one = (f, k) => tok(f.attrs[k]?.[0]);
// The chain of kinds (what std.know follows for a host): is_a and is of people, the class of an animal.
const up = new Map();
for (const f of store.facts('k.people.kind')) up.set(one(f, 'name'), (f.attrs.is_a ?? []).map(tok));
for (const f of store.facts('k.people.role')) up.set(one(f, 'name'), [...(f.attrs.is ?? []), ...(f.attrs.is_a ?? [])].map(tok));
for (const f of store.facts('k.animals.animal')) up.set(one(f, 'name'), [...(f.attrs.class ?? []).map(tok), 'animal']);
const isA = (a, b) => { if (a === b) return true; const seen = new Set(), todo = [a]; while (todo.length) { const n = todo.pop(); for (const p of up.get(n) ?? []) { if (p === b) return true; if (!seen.has(p)) { seen.add(p); todo.push(p); } } } return false; };
const chain = [{ type: 'k.people.kind', keys: ['is_a'] }, { type: 'k.people.role', keys: ['is_a', 'is'] }];
// The statements a composition reads about a topic: the facts about things (not drawings, not words).
const TYPES = ['k.animals.animal', 'k.attributes.thing', 'k.attributes.number', 'k.commonsense.thing', 'k.food.food', 'k.geo.country', 'k.geo.city', 'k.space.body', 'k.body.part', 'k.people.role'];
const seeded = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const METHODS = ['write a story', 'write a presentation about a topic', 'write an essay about a topic', 'write a scientific article about a topic', 'write a report of what was done'];
const names = (r) => Object.fromEntries([...r.chosen].map(([k, v]) => [k, v.map(r.nameOf)]));

// Choices solved, then the steps expanded by std.plan with the chosen values fixed.
function compose(method, goal, ctx = {}) {
  const r = solveChoices(methodFacts(store, method), { store, isA, types: TYPES, ...ctx, goal: goal.roles });
  if (!r) return null;
  const fixed = fixChoices(store, method, r.chosen, r.nameOf);
  const mine = (f) => one(f, 'method') === method;
  const view = { facts: (t) => (t === 'k.procedures.binding' ? [...store.facts(t).filter((f) => !mine(f)), ...fixed.binding] : t === 'k.procedures.match' ? [...store.facts(t).filter((f) => !mine(f)), ...fixed.match] : store.facts(t)), index: (t, k) => store.index(t, k), kindsOf: (w) => store.kindsOf(w) };
  const live = new PlanLive({ world: 'w.document', store: view, history: ctx.history ?? [], things: (ctx.live ?? []).map((t) => ({ id: t.id, kind: t.kind })) });
  const plan = makePlanner(view, { chain }).plan(goal, live);
  return { choices: names(r), plan };
}

test('compositions: five methods in w.document; every genre, part, move and count they read exists', () => {
  const genres = new Set(store.facts('k.genres.genre').map((f) => one(f, 'name')));
  const parts = new Set(store.facts('k.genres.part').map((f) => `${one(f, 'genre')}/${one(f, 'name')}`));
  for (const m of METHODS) {
    const meth = store.facts('k.procedures.method').find((f) => one(f, 'name') === m);
    assert.ok(meth, m); assert.equal(one(meth, 'world'), 'w.document', m);
    const bind = methodFacts(store, m);
    for (const b of bind.values()) {
      for (const k of ['choose', 'choose_min']) if (b[k] !== undefined && !/^\d+$/.test(b[k])) assert.ok(bind.has(b[k]), `${m}: ${b.name} ${k} names no binding`);
      for (const x of b.match) {
        for (const ref of [x.equals, x.differs]) if (ref) assert.ok(bind.has(ref), `${m}: ${b.name} names ${ref}`);
        if (x.key === 'genre' && x.value) assert.ok(genres.has(x.value), `${m}: genre ${x.value}`);
      }
      const g = b.match.find((x) => x.key === 'genre')?.value, p = b.match.find((x) => x.key === 'part' || (x.key === 'name' && b.from === 'k.genres.part'))?.value;
      if (g && p) assert.ok(parts.has(`${g}/${p}`), `${m}: part ${g}/${p}`);
      // A count read from k.genres or k.story gives exactly one whole number.
      if (b.key === 'min' || b.key === 'max') { const r = solveChoices(new Map([[b.name, b]]), { store, isA }); assert.ok(r); }
    }
    // Every element of k.story is a binding of "write a story" (turning point: turning_point).
    if (m === 'write a story') for (const e of store.facts('k.story.element')) assert.ok(bind.has(one(e, 'name').replace(/ /g, '_')), `story binding ${one(e, 'name')}`);
  }
});

const ORDER = [...store.facts('k.story.element')].sort((a, b) => Number(one(a, 'n')) - Number(one(b, 'n'))).map((e) => one(e, 'name'));
const kb = storyKb(scanWorlds());
const constraints = store.facts('k.story.constraint').map((f) => ({ name: one(f, 'name'), strength: one(f, 'strength') }));
const asPlan = (c) => ({ setting: c.setting[0], protagonist: c.protagonist[0], goal: c.goal[0], target: c.target[0], obstacle: c.obstacle[0], attempts: c.attempt, helper: c.helper[0], means: c.means[0], turning_point: 'give', resolution: c.resolution[0], ending: c.goal[0], order: ORDER });
const STORY_ACTS = (title) => [
  `make kind=w.document.document title=${title} genre=story register=narrative topic=${title}`,
  'make kind=w.document.chapter document=document1 n=1 part=orientation', 'make kind=w.document.chapter document=document1 n=2 part=complication',
  'make kind=w.document.chapter document=document1 n=3 part=climax', 'make kind=w.document.chapter document=document1 n=4 part=resolution',
  'make kind=w.document.chapter document=document1 n=5 part=ending',
];

test('write a story: the hand-traced plan (a girl, the dragon of the castle, the knight\'s sword) is a solution, holds k.story, and expands to the document and its five chapters', () => {
  const fixed = { goal: 'rescue someone', goal_act: 'help', obstacle: 'dragon', setting: 'castle', means: 'sword', resolution: 'fight', helper: 'knight', protagonist: 'girl', attempt: ['shout', 'hide'], target: 'friend' };
  const r = compose('write a story', { act: 'make', roles: { kind: 'story' } }, { fixed });
  assert.ok(r, 'the traced plan holds every match of the method');
  assert.deepEqual({ ...r.choices, attempt: [...r.choices.attempt].sort() }, Object.fromEntries(Object.entries(fixed).map(([k, v]) => [k, [].concat(v).sort()])));
  assert.deepEqual(checkPlan(kb, constraints, asPlan(r.choices)).hard, []);
  assert.equal(r.plan.method, 'write a story');
  assert.deepEqual(r.plan.lines, STORY_ACTS('friend'));
  // A knight who already holds a sword cannot be the protagonist; a beach has no dragon.
  assert.equal(compose('write a story', { act: 'make', roles: { kind: 'story' } }, { fixed: { ...fixed, protagonist: 'knight', helper: 'king' } }), null);
  assert.equal(compose('write a story', { act: 'make', roles: { kind: 'story' } }, { fixed: { ...fixed, setting: 'beach' } }), null);
});

export const STORIES = 100;
test(`write a story: ${STORIES} seeded stories, each holds every hard constraint of k.story (checked from the facts alone)`, () => {
  const seen = { goal: new Set(), obstacle: new Set(), protagonist: new Set(), helper: new Set() };
  let soft = 0;
  for (let seed = 1; seed <= STORIES; seed += 1) {
    const r = solveChoices(methodFacts(store, 'write a story'), { store, isA, rnd: seeded(seed) });
    assert.ok(r, `seed ${seed}: no story`);
    const c = names(r), p = asPlan(c);
    const chk = checkPlan(kb, constraints, p);
    assert.deepEqual(chk.hard, [], `seed ${seed}: ${JSON.stringify(c)}`);
    soft += chk.soft.length;
    for (const k of Object.keys(seen)) seen[k].add(c[k][0]);
  }
  assert.ok(seen.goal.size === 4 && seen.obstacle.size >= 6, JSON.stringify([...seen.obstacle]));
  console.log(`write a story: ${STORIES} seeded stories hold every hard constraint; ${seen.goal.size} goals, ${seen.obstacle.size} obstacles, ${seen.protagonist.size} protagonists, ${seen.helper.size} helpers; soft constraints held ${soft} times (the soft matches weigh x2)`);
});

test('write a presentation about penguins: the first solution (no seed) and its slides; a seeded one differs; every point is a different key of a statement about the topic', () => {
  const goal = { act: 'make', roles: { kind: 'presentation', value: 'penguin' } };
  const r = compose('write a presentation about a topic', goal);
  assert.deepEqual(r.choices, { points: ['class', 'legs', 'covering', 'habitat', 'diet'] });
  assert.deepEqual(r.plan.lines, [
    'make kind=w.document.document title=penguin genre=presentation register=presentation topic=penguin',
    'make kind=w.document.slide document=document1 n=1 part=title layout=title title=title',
    'make kind=w.document.slide document=document1 n=2 part=agenda layout=agenda title=Overview',
    'make kind=w.document.slide document=document1 n=4 part=summary layout=summary title=Summary',
    'make kind=w.document.slide document=document1 n=5 part=closing layout=closing title=Questions',
    'make kind=w.document.slide document=document1 n=3 part=point layout=content title=class',
    'make kind=w.document.slide document=document1 n=3 part=point layout=content title=legs',
    'make kind=w.document.slide document=document1 n=3 part=point layout=content title=covering',
    'make kind=w.document.slide document=document1 n=3 part=point layout=content title=habitat',
    'make kind=w.document.slide document=document1 n=3 part=point layout=content title=diet',
  ]);
  for (let seed = 1; seed <= 20; seed += 1) {
    const s = solveChoices(methodFacts(store, 'write a presentation about a topic'), { store, isA, types: TYPES, goal: goal.roles, rnd: seeded(seed) });
    const pts = s.chosen.get('points');
    assert.ok(pts.length >= 3 && pts.length <= 5, `seed ${seed}: ${pts.length} points`);
    assert.equal(new Set(pts.map((x) => x.key)).size, pts.length, `seed ${seed}: keys differ`);
    assert.ok(pts.every((x) => x.thing === 'penguin'));
  }
});

test('write an essay and a scientific article: arguments and results on different keys, the counterargument on another key', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const e = solveChoices(methodFacts(store, 'write an essay about a topic'), { store, isA, types: TYPES, goal: { value: 'penguin' }, rnd: seeded(seed) });
    const args = e.chosen.get('arguments'), counter = e.chosen.get('counterargument')[0];
    assert.ok(args.length >= 2 && args.length <= 4 && new Set(args.map((x) => x.key)).size === args.length, `essay ${seed}`);
    assert.ok(!args.some((x) => x.key === counter.key), `essay ${seed}: counterargument on another key`);
    const a = solveChoices(methodFacts(store, 'write a scientific article about a topic'), { store, isA, types: TYPES, goal: { value: 'Peru' }, rnd: seeded(seed) });
    const res = a.chosen.get('results');
    assert.ok(res.length >= 2 && res.length <= 5 && new Set(res.map((x) => x.key)).size === res.length, `article ${seed}`);
  }
  const r = compose('write a scientific article about a topic', { act: 'make', roles: { kind: 'scientific article', value: 'Peru' } });
  assert.deepEqual(r.plan.lines.slice(1), ['Abstract', 'Introduction', 'Methods', 'Results', 'Discussion'].map((h, i) => `make kind=w.document.chapter document=document1 n=${i + 1} part=${h.toLowerCase()} title=${h}`));
});

test('write a report of what was done: the acts done, the things there, next steps not yet done; refused with nothing done', () => {
  const history = [{ act: 'make', thing: 'house1' }, { act: 'change', thing: 'house1' }, { act: 'make', thing: 'tree1' }];
  const live = [{ id: 'house1', kind: 'house' }, { id: 'tree1', kind: 'tree' }];
  const goal = { act: 'make', roles: { kind: 'report' } };
  const r = compose('write a report of what was done', goal, { history, live });
  assert.deepEqual(r.choices, { work: ['make', 'change', 'make'], results: ['house1', 'tree1'], next: ['remove', 'place', 'connect'] });
  assert.deepEqual(r.plan.lines, [
    'make kind=w.document.document title=report genre=report register=report',
    ...['Summary', 'Introduction', 'Work done', 'Results', 'Next steps'].map((h, i) => `make kind=w.document.chapter document=document1 n=${i + 1 + (i >= 4 ? 1 : 0)} part=${h.toLowerCase()} title=${h}`),
  ]);
  for (let seed = 1; seed <= 20; seed += 1) {
    const s = solveChoices(methodFacts(store, 'write a report of what was done'), { store, isA, history, live, rnd: seeded(seed) });
    const next = s.chosen.get('next').map((x) => one(x, 'name'));
    assert.ok(next.every((a) => !history.some((h) => h.act === a)), `seed ${seed}: a next step not yet done`);
  }
  assert.equal(solveChoices(methodFacts(store, 'write a report of what was done'), { store, isA, history: [], live }), null);
});
