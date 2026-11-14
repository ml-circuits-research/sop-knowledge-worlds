// k.genres (block "15:00" item 1): the facts load and are what the tool gives; every genre names a register, its parts
// are in order with sane counts, every step names a move, alternatives at one place agree on their counts, every
// source is used, cited in WORLD.md and exists; registers are sane. Integration case for the library's std.compose:
// a hand-traced shortest outline per genre, and N seeded outlines per genre that all satisfy the structure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { genresShards, outline } from '../tools/genres-core.mjs';

const worlds = scanWorlds();
const world = fullWorld('k.genres', worlds);
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const MANY = new Set(['source', 'person_also', 'also_move']);
const NUM = new Set(['n', 'min', 'max', 'year', 'sentence_min', 'sentence_typical', 'sentence_max', 'paragraph_min', 'paragraph_max', 'vocabulary_band']);
const rows = (type) => world.ofType(type).map((w) => Object.fromEntries(Object.entries(w.attrs).filter(([k]) => k !== 'core.source')
  .map(([k, v]) => [k, MANY.has(k) ? v.map(tok) : NUM.has(k) ? Number(tok(v[0])) : tok(v[0])])));
const facts = { source: rows('k.genres.source'), move: rows('k.genres.move'), register: rows('k.genres.register'), genre: rows('k.genres.genre'), part: rows('k.genres.part'), step: rows('k.genres.step') };
const GENRES = ['scientific article', 'presentation', 'essay', 'story', 'report'];

// A seeded random function (mulberry32).
export const seeded = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

test('k.genres: the shards are what tools/genres-core.mjs gives; the five genres', () => {
  for (const [name, t] of Object.entries(genresShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.genres', 'shards', name), 'utf8'), t, name);
  assert.deepEqual(facts.genre.map((g) => g.name).sort(), [...GENRES].sort());
  assert.ok(facts.move.length >= 40 && facts.source.length >= 20, `${facts.move.length} moves, ${facts.source.length} sources`);
});

test('k.genres: genres, parts and steps fit together (order, counts, moves, alternatives)', () => {
  const moves = new Set(facts.move.map((m) => m.name));
  for (const g of facts.genre) {
    assert.ok(facts.register.some((r) => r.name === g.register), `${g.name}: register ${g.register}`);
    for (const m of g.also_move ?? []) assert.ok(moves.has(m), `${g.name}: also_move ${m}`);
    const parts = facts.part.filter((p) => p.genre === g.name).sort((a, b) => a.n - b.n);
    assert.deepEqual(parts.map((p) => p.n), parts.map((_, i) => i + 1), `${g.name}: parts numbered 1..k`);
    for (const p of parts) {
      assert.ok(p.min <= p.max, `${g.name}/${p.name}: min <= max`);
      if (g.unit === 'slide') assert.ok(p.layout, `${g.name}/${p.name}: a slide part names its layout`);
      else assert.equal(p.layout, undefined, `${g.name}/${p.name}: layout only for slides`);
      const steps = facts.step.filter((s) => s.genre === g.name && s.part === p.name);
      assert.ok(steps.length, `${g.name}/${p.name}: has steps`);
      const places = [...new Set(steps.map((s) => s.n))].sort((a, b) => a - b);
      assert.deepEqual(places, places.map((_, i) => i + 1), `${g.name}/${p.name}: steps numbered 1..k`);
      for (const n of places) {
        const alts = steps.filter((s) => s.n === n);
        assert.equal(new Set(alts.map((s) => `${s.min} ${s.max}`)).size, 1, `${g.name}/${p.name}/${n}: alternatives agree on their counts`);
      }
      for (const s of steps) {
        assert.ok(moves.has(s.move), `${g.name}/${p.name}: move ${s.move}`);
        assert.ok(s.min <= s.max, `${g.name}/${p.name}/${s.move}: min <= max`);
      }
      // A part that occurs makes at least one sentence.
      assert.ok(places.some((n) => steps.find((s) => s.n === n).min > 0), `${g.name}/${p.name}: some step is required`);
    }
    // At least one part is required, and the parts of a genre are not all optional.
    assert.ok(parts.some((p) => p.min > 0), g.name);
  }
  for (const s of facts.step) assert.ok(facts.part.some((p) => p.genre === s.genre && p.name === s.part), `step of an unknown part ${s.genre}/${s.part}`);
  // Every move is used by some genre (a step or also_move); the discourse moves asked for templates (14:45 item 2) exist.
  for (const m of facts.move) assert.ok(facts.step.some((s) => s.move === m.name) || facts.genre.some((g) => g.also_move?.includes(m.name)), `move ${m.name} unused`);
  for (const m of ['introduce topic', 'compare', 'surprising fact', 'give example', 'raise a question', 'conclude', 'transition']) assert.ok(moves.has(m), m);
});

test('k.genres: the slide layouts are w.document\'s; the w.document kind of each genre exists', () => {
  const layouts = ['title', 'agenda', 'content', 'summary', 'closing'];
  const doc = join(WORLDS_DIR, 'w.document', 'schema.sop');
  if (existsSync(doc)) {
    const t = readFileSync(doc, 'utf8');
    const line = t.split('\n').find((l) => l.startsWith('@w.document.slide.layout '));
    if (line) for (const l of layouts) assert.ok(line.includes(`enum=${l}`), `w.document slide layout ${l}`);
    for (const g of facts.genre) assert.ok(t.includes(`core.type of=w.document.${g.unit} `), `w.document.${g.unit}`);
  }
  for (const p of facts.part) if (p.layout) assert.ok(layouts.includes(p.layout), p.layout);
});

test('k.genres: registers are sane and say what each genre is known for', () => {
  for (const r of facts.register) {
    assert.ok(r.sentence_min <= r.sentence_typical && r.sentence_typical <= r.sentence_max, `${r.name}: sentence lengths`);
    assert.ok(r.paragraph_min <= r.paragraph_max, `${r.name}: paragraph`);
    assert.ok(!(r.person_also ?? []).includes(r.person), `${r.name}: person not twice`);
    assert.ok(r.own.length > 0 && r.source.length > 0, `${r.name}: sources and own`);
  }
  const reg = (g) => facts.register.find((r) => r.name === facts.genre.find((x) => x.name === g).register);
  assert.equal(reg('story').tense, 'past'); assert.equal(reg('story').person, 'third'); assert.equal(reg('story').direct_speech, 'true');
  assert.equal(reg('scientific article').hedging, 'true'); assert.equal(reg('scientific article').citations, 'true'); assert.equal(reg('scientific article').units, 'true');
  assert.ok(reg('presentation').sentence_max < reg('scientific article').sentence_max);
  assert.ok(reg('story').vocabulary_band < reg('scientific article').vocabulary_band);
  // Tenses by part: methods and results of an article in the past, next steps of a report in the future.
  const part = (g, p) => facts.part.find((x) => x.genre === g && x.name === p);
  assert.equal(part('scientific article', 'methods').tense, 'past'); assert.equal(part('scientific article', 'results').tense, 'past'); assert.equal(part('report', 'next steps').tense, 'future');
});

test('k.genres: every source is used, cited in WORLD.md and well formed; every fact names a source or its own choice', () => {
  const names = new Set(facts.source.map((s) => s.name));
  const used = new Set();
  for (const type of ['move', 'register', 'genre', 'part', 'step']) for (const f of facts[type]) {
    for (const s of f.source ?? []) { assert.ok(names.has(s), `${type} ${f.name ?? f.move}: source ${s}`); used.add(s); }
    if (type !== 'step') assert.ok((f.source ?? []).length || f.own, `${type} ${f.name}: a source or own`);
  }
  for (const s of facts.source) assert.ok(used.has(s.name), `source ${s.name} unused`);
  const md = readFileSync(join(WORLDS_DIR, 'k.genres', 'WORLD.md'), 'utf8');
  for (const s of facts.source) {
    const author = s.cite.split(/[,(]/)[0].trim();
    assert.ok(md.includes(author) && md.includes(String(Math.abs(s.year))), `${s.name}: ${author} ${s.year} in WORLD.md`);
    if (s.doi) assert.match(s.doi, /^10\.\d{4,5}\//, s.name);
  }
});

// Hand-traced shortest outlines (every count at its minimum, the first alternative at each place).
const SHORTEST = {
  'scientific article': [
    ['abstract', 'state purpose', 'describe method', 'report result', 'conclude'],
    ['introduction', 'generalise', 'review previous work', 'indicate a gap', 'state purpose'],
    ['methods', 'describe method', 'describe method'],
    ['results', 'report result', 'report result'],
    ['discussion', 'summarize', 'interpret result', 'conclude'],
  ],
  presentation: [['title', 'introduce topic'], ['agenda', 'outline structure'],
    ['point', 'state claim', 'give evidence'], ['point', 'state claim', 'give evidence'], ['point', 'state claim', 'give evidence'],
    ['summary', 'summarize'], ['closing', 'thank audience']],
  essay: [['introduction', 'introduce topic', 'state thesis'], ['argument', 'state claim', 'give evidence'], ['argument', 'state claim', 'give evidence'],
    ['counterargument', 'counterargument', 'rebut'], ['conclusion', 'restate thesis', 'conclude']],
  story: [['orientation', 'set the scene', 'introduce character', 'state goal'], ['complication', 'complicate', 'attempt'], ['climax', 'turning point'], ['resolution', 'resolve'], ['ending', 'end']],
  report: [['summary', 'summarize'], ['introduction', 'introduce topic', 'state purpose'], ['work done', 'report action'], ['results', 'report result'], ['next steps', 'next step']],
};

test('k.genres: the shortest outline of each genre is the hand-traced one', () => {
  for (const g of GENRES) {
    const o = outline(facts, g);
    const flat = o.map((p) => [p.part, ...p.moves.flatMap((m) => Array(m.sentences).fill(m.move))]);
    assert.deepEqual(flat, SHORTEST[g], g);
  }
});

export const SAMPLES = 1000;
test(`k.genres: ${SAMPLES} seeded outlines per genre satisfy the structure; how many differ`, () => {
  const report = {};
  for (const g of GENRES) {
    const rnd = seeded(7);
    const seen = new Set();
    const parts = facts.part.filter((p) => p.genre === g);
    for (let i = 0; i < SAMPLES; i += 1) {
      const o = outline(facts, g, rnd);
      seen.add(JSON.stringify(o));
      // Parts in order, each between its counts.
      for (let j = 1; j < o.length; j += 1) assert.ok(o[j - 1].n <= o[j].n, `${g}: order`);
      for (const p of parts) { const k = o.filter((x) => x.part === p.name).length; assert.ok(k >= p.min && k <= p.max, `${g}/${p.name}: ${k} times`); }
      // Each part: one move per place at most, every required place made, sentences inside the step's counts.
      for (const x of o) {
        assert.ok(x.moves.length > 0, `${g}/${x.part}: empty`);
        const steps = facts.step.filter((s) => s.genre === g && s.part === x.part);
        for (const m of x.moves) { const s = steps.find((y) => y.move === m.move); assert.ok(s && m.sentences >= s.min && m.sentences <= s.max, `${g}/${x.part}/${m.move}`); }
        for (const s of steps.filter((y) => y.min > 0)) assert.ok(x.moves.some((m) => steps.some((y) => y.n === s.n && y.move === m.move)), `${g}/${x.part}: place ${s.n} made`);
      }
    }
    report[g] = seen.size;
    assert.ok(seen.size > 50, `${g}: ${seen.size} distinct outlines of ${SAMPLES}`);
  }
  console.log(`k.genres outlines: ${SAMPLES} per genre, distinct: ${JSON.stringify(report)}`);
});
