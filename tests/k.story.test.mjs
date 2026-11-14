// k.story (block "15:00" item 2): the facts load and are what the tool gives; every reference resolves to a fact of
// another world (things of k.scenes and k.objects, acts of k.actions, the parts and moves of the story genre of
// k.genres, the types elements are filled from); every source is used and cited; every constraint has a check.
// Integration case for the library's std.compose: hand-traced story plans that hold every hard constraint, broken
// plans that are refused by the constraint they break, and N plans sampled from all plans that hold the hard
// constraints, each checked again from the facts alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { storyShards, storyKb, storyPlans, checkPlan } from '../tools/story-core.mjs';

const worlds = scanWorlds();
const world = fullWorld('k.story', worlds);
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const MANY = new Set(['source', 'fills', 'overcome_by', 'means', 'tried_by']);
const NUM = new Set(['n', 'min', 'max', 'year']);
const rows = (type) => world.ofType(type).map((w) => Object.fromEntries(Object.entries(w.attrs).filter(([k]) => k !== 'core.source')
  .map(([k, v]) => [k, MANY.has(k) ? v.map(tok) : NUM.has(k) ? Number(tok(v[0])) : tok(v[0])])));
const facts = { source: rows('k.story.source'), element: rows('k.story.element'), goal: rows('k.story.goal'), obstacle: rows('k.story.obstacle'), constraint: rows('k.story.constraint') };
const kb = storyKb(worlds);
const ORDER = [...facts.element].sort((a, b) => a.n - b.n).map((e) => e.name);
const seeded = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

test('k.story: the shards are what tools/story-core.mjs gives; the elements the brief names', () => {
  for (const [name, t] of Object.entries(storyShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.story', 'shards', name), 'utf8'), t, name);
  for (const e of ['setting', 'protagonist', 'goal', 'obstacle', 'helper', 'attempt', 'turning point', 'resolution', 'ending']) assert.ok(facts.element.some((x) => x.name === e), e);
  assert.deepEqual(facts.element.map((e) => e.n).sort((a, b) => a - b), facts.element.map((_, i) => i + 1));
});

test('k.story: every reference resolves to a fact of another world', () => {
  const genres = fullWorld('k.genres', worlds);
  const parts = new Set(genres.ofType('k.genres.part').filter((w) => tok(w.attrs.genre[0]) === 'story').map((w) => tok(w.attrs.name[0])));
  const moves = new Set(genres.ofType('k.genres.step').filter((w) => tok(w.attrs.genre[0]) === 'story').map((w) => tok(w.attrs.move[0])));
  const declared = new Set(worlds.flatMap((w) => [...w.schemaText.matchAll(/core\.type of=(\S+)/g)].map((m) => m[1])));
  for (const e of facts.element) {
    assert.ok(parts.has(e.part), `${e.name}: part ${e.part} of the story genre`);
    assert.ok(moves.has(e.move), `${e.name}: move ${e.move} of the story genre`);
    for (const t of e.fills) assert.ok(declared.has(t), `${e.name}: fills ${t}`);
    assert.ok(e.min <= e.max, e.name);
  }
  // The story genre's moves are all told by some element (or are the genre's evaluation).
  for (const m of moves) assert.ok(facts.element.some((e) => e.move === m) || m === 'evaluate', `move ${m} of the story genre has no element`);
  const things = new Set([...kb.has.values()].flatMap((s) => [...s]));
  for (const g of facts.goal) assert.ok(kb.actions.has(g.act), `${g.name}: act ${g.act}`);
  for (const o of facts.obstacle) {
    const id = `${o.thing}/${o.blocks}`;
    assert.ok(things.has(o.thing) && kb.objects.has(o.thing), `${id}: a thing of k.scenes with a k.objects drawing`);
    assert.ok(facts.goal.some((g) => g.name === o.blocks), `${id}: blocks a goal`);
    for (const a of [...o.overcome_by, ...o.tried_by]) assert.ok(kb.actions.has(a), `${id}: act ${a}`);
    for (const a of o.tried_by) assert.ok(!o.overcome_by.includes(a), `${id}: ${a} both tried in vain and overcoming`);
    for (const m of o.means) {
      assert.ok(kb.objects.has(m), `${id}: means ${m} has a drawing`);
      assert.ok(o.overcome_by.some((a) => kb.actions.get(a).tool.includes(m)), `${id}: means ${m} is a tool of an overcoming act`);
    }
    // Every overcoming act has a means, and some means has a helper (a role that holds or uses it).
    for (const a of o.overcome_by) assert.ok(o.means.some((m) => kb.actions.get(a).tool.includes(m)), `${id}: ${a} has a means`);
    assert.ok(o.means.some((m) => kb.roles.some((r) => r.holds.includes(m) || r.uses.includes(m))), `${id}: some means has a helper`);
  }
  for (const c of facts.constraint) {
    assert.ok(facts.element.some((e) => e.name === c.element) && facts.element.some((e) => e.name === c.other), `${c.name}: elements`);
  }
});

test('k.story: every source is used and cited in WORLD.md; every fact names a source or its own choice', () => {
  const names = new Set(facts.source.map((s) => s.name)), used = new Set();
  for (const type of ['element', 'goal', 'obstacle', 'constraint']) for (const f of facts[type]) {
    for (const s of f.source ?? []) { assert.ok(names.has(s), `${type} ${f.name ?? f.thing}: ${s}`); used.add(s); }
    assert.ok((f.source ?? []).length || f.own, `${type} ${f.name ?? f.thing}: a source or own`);
  }
  for (const s of facts.source) assert.ok(used.has(s.name), `source ${s.name} unused`);
  const md = readFileSync(join(WORLDS_DIR, 'k.story', 'WORLD.md'), 'utf8');
  for (const s of facts.source) {
    const author = s.cite.split(/[,(]/)[0].trim();
    assert.ok(md.includes(author) && md.includes(String(Math.abs(s.year))), `${s.name}: ${author} ${s.year} in WORLD.md`);
  }
});

// Hand-traced plans: every hard constraint holds, traced by hand against the facts named in the comments.
export const TRACED = [
  // castle has a dragon (k.scenes); the dragon guards the one to rescue (k.story); a girl is a child is a person,
  // who can help (rescue), shout, hide and fight (k.actions who); a knight holds a sword (k.people), a girl holds
  // nothing; fight has the tool sword; friend is an object of help and a k.people role; the knight works at the castle.
  { setting: 'castle', protagonist: 'girl', goal: 'rescue someone', target: 'friend', obstacle: 'dragon', attempts: ['shout', 'hide'], helper: 'knight', means: 'sword', turning_point: 'give', resolution: 'fight', ending: 'rescue someone', soft: ['helper belongs in the setting'] },
  // the river scene has a river; a river lies between, for a visit; a boy can visit, jump, wait, shout and sail; a
  // sailor uses a sailboat, the tool of sail; a grandmother is an object of visit.
  { setting: 'river', protagonist: 'boy', goal: 'visit someone', target: 'grandmother', obstacle: 'river', attempts: ['jump', 'wait', 'shout'], helper: 'sailor', means: 'sailboat', turning_point: 'give', resolution: 'sail', ending: 'visit someone', soft: [] },
  // the forest has a tree and a fox (k.scenes); a fox is a mammal, an animal: it can go, jump and climb (who=animal);
  // a firefighter uses a ladder, the tool of climb; the mountains are an outdoor scene.
  { setting: 'forest', protagonist: 'fox', goal: 'find a thing', target: 'key', obstacle: 'tree', attempts: ['jump'], helper: 'firefighter', means: 'ladder', turning_point: 'give', resolution: 'climb', ending: 'find a thing', soft: ['protagonist belongs in the setting'] },
];
// The one fox plan above fails only because a fox cannot find (find: who=person, dog): kept as a refused example.
const REFUSED_FOX = ['protagonist can reach the goal'];

test('k.story: the hand-traced plans hold every hard constraint (and the soft ones traced); broken plans are refused by name', () => {
  const [castle, river, fox] = TRACED;
  for (const p of [castle, river]) {
    const r = checkPlan(kb, facts.constraint, { ...p, order: ORDER });
    assert.deepEqual(r.hard, [], `${p.setting}: ${r.hard}`);
    assert.deepEqual(r.soft, p.soft, `${p.setting}: soft`);
  }
  assert.deepEqual(checkPlan(kb, facts.constraint, { ...fox, order: ORDER }).hard, REFUSED_FOX);
  // A fox can reach a place past a fallen tree? cut is for persons only: refused by the resolution's who.
  assert.deepEqual(checkPlan(kb, facts.constraint, { ...fox, goal: 'reach a place', target: 'mountains', resolution: 'cut', means: 'saw', helper: 'carpenter', attempts: ['jump'], ending: 'reach a place', order: ORDER }).hard, ['protagonist can overcome with the means']);
  const broken = (change, names) => assert.deepEqual(checkPlan(kb, facts.constraint, { ...castle, order: ORDER, ...change }).hard, names, JSON.stringify(change));
  broken({ protagonist: 'knight', helper: 'king' }, ['protagonist lacks the means']); // a knight already holds a sword
  broken({ helper: 'baker' }, ['helper has the means']);
  broken({ setting: 'beach' }, ['setting has the obstacle']);
  broken({ obstacle: 'river' }, ['obstacle blocks the goal', 'setting has the obstacle', 'means overcomes the obstacle', 'attempts fail', 'resolution uses the means']); // no river/rescue fact
  broken({ attempts: ['fight'] }, ['attempts fail']);
  broken({ attempts: ['shout', 'shout'] }, ['attempts fail']);
  broken({ attempts: ['shout', 'hide', 'run', 'shout'] }, ['attempts fail']);
  broken({ resolution: 'climb' }, ['resolution uses the means']);
  broken({ means: 'ladder', helper: 'firefighter' }, ['means overcomes the obstacle', 'resolution uses the means']);
  broken({ target: 'museum' }, ['target fits the goal']);
  broken({ order: ['setting', 'protagonist', 'goal', 'target', 'obstacle', 'attempt', 'means', 'turning point', 'helper', 'resolution', 'ending'] }, ['helper comes before the turning point']);
  broken({ order: ['setting', 'protagonist', 'goal', 'target', 'obstacle', 'attempt', 'helper', 'turning point', 'resolution', 'means', 'ending'] }, ['means comes before the resolution']);
  broken({ ending: 'find a thing' }, ['ending reaches the goal']);
});

export const SAMPLES = 1000;
test(`k.story: all plans that hold the hard constraints, counted; ${SAMPLES} sampled and checked again from the facts`, () => {
  const total = storyPlans(kb);
  assert.ok(total > 10000, `${total} plans`);
  const rnd = seeded(11);
  const want = new Set();
  while (want.size < SAMPLES) want.add(Math.floor(rnd() * total));
  const picked = [];
  let i = 0;
  storyPlans(kb, (p) => { if (want.has(i)) picked.push(p); i += 1; });
  assert.equal(picked.length, SAMPLES);
  const soft = {}, goals = new Set(), obstacles = new Set(), protagonists = new Set();
  for (const p of picked) {
    // The attempts: 1 to 3 different acts of the protagonist among the obstacle's tried_by.
    const k = 1 + Math.floor(rnd() * Math.min(3, p.tries.length));
    const pool = [...p.tries], attempts = [];
    while (attempts.length < k) attempts.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    const r = checkPlan(kb, facts.constraint, { ...p, attempts, order: ORDER });
    assert.deepEqual(r.hard, [], JSON.stringify(p));
    for (const s of r.soft) soft[s] = (soft[s] ?? 0) + 1;
    goals.add(p.goal); obstacles.add(`${p.obstacle}/${p.goal}`); protagonists.add(p.protagonist);
  }
  // Every kind of goal and every obstacle fact has plans.
  const all = new Set();
  storyPlans(kb, (p) => all.add(`${p.obstacle}/${p.goal}`));
  for (const o of facts.obstacle) assert.ok(all.has(`${o.thing}/${o.blocks}`), `${o.thing}/${o.blocks} has no plan`);
  console.log(`k.story: ${total} plans hold every hard constraint; ${SAMPLES} sampled: ${goals.size} goals, ${obstacles.size} obstacle facts, ${protagonists.size} protagonists; soft constraints held: ${JSON.stringify(soft)}`);
});
