// k.story checked against stories annotated by hand (block "19:45"): sources/story-check/*.jsonl, one row per story
// with the elements found and whether each constraint holds (SOURCE.md there says the fields and the rule). For each
// sample (TinyStories now; public-domain tales when PSys2 has fetched them) the share of stories where each element
// occurs and each constraint holds, in one table, so that a constraint that does not hold in human tales can be
// relaxed or made soft by the numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../tools/lib/worlds.mjs';

const DIR = join(REPO, 'sources', 'story-check');
const samples = readdirSync(DIR).filter((f) => f.endsWith('.jsonl')).sort().map((f) => ({ name: f.replace(/\.jsonl$/, ''), rows: readFileSync(join(DIR, f), 'utf8').trim().split('\n').map((l) => JSON.parse(l)) }));
const FIELDS = ['goal', 'obstacle', 'blocks', 'attempts', 'helper', 'means_thing', 'helper_has', 'lacks', 'setup_used', 'resolution', 'reached', 'goal_first'];

// The measures, each over the stories it applies to (a story with a goal and an obstacle has a plot).
export function measures(rows) {
  const share = (sel, f) => { const s = rows.filter(sel); const k = s.filter(f).length; return { k, n: s.length }; };
  const plot = (r) => r.goal === 1 && r.obstacle === 1;
  return {
    'has a goal': share(() => true, (r) => r.goal === 1),
    'has an obstacle': share(() => true, (r) => r.obstacle === 1),
    'obstacle blocks the goal': share(plot, (r) => r.blocks === 1),
    'attempts that fail': share(plot, (r) => r.attempts >= 1),
    'at most three attempts': share((r) => r.attempts >= 1, (r) => r.attempts <= 3),
    'a helper': share(plot, (r) => r.helper === 1),
    'helper has what is missing': share((r) => r.helper === 1, (r) => r.helper_has === 1),
    'the helper gives a thing': share((r) => r.helper === 1, (r) => r.means_thing === 1),
    'protagonist lacks it': share((r) => r.helper === 1, (r) => r.lacks === 1),
    'resolution': share(plot, (r) => r.resolution === 1),
    'resolution uses a set-up': share((r) => r.resolution === 1, (r) => r.setup_used === 1),
    'goal reached': share(plot, (r) => r.reached === 1),
    'goal told before the obstacle': share(plot, (r) => r.goal_first === 1),
  };
}

test('story check: every annotation row is well formed; its story exists in the corpus where the corpus is here', () => {
  assert.ok(samples.length >= 1);
  for (const s of samples) {
    assert.ok(s.rows.length >= 40, `${s.name}: ${s.rows.length} stories`);
    assert.equal(new Set(s.rows.map((r) => r.id)).size, s.rows.length, `${s.name}: ids differ`);
    for (const r of s.rows) for (const f of FIELDS) assert.ok(f in r && (r[f] === null || Number.isInteger(r[f])), `${s.name} ${r.id}: ${f}`);
  }
  const ts = '/tmp/wt2/data/external/tinystories/stories-1000.jsonl';
  if (existsSync(ts)) {
    const ids = new Set(readFileSync(ts, 'utf8').trim().split('\n').map((l) => JSON.parse(l).id));
    for (const r of samples.find((s) => s.name.startsWith('tinystories'))?.rows ?? []) assert.ok(ids.has(r.id), r.id);
  }
  const tales = '/tmp/wt2/data/external/tales-pd/tales.jsonl';
  if (existsSync(tales)) {
    const all = readFileSync(tales, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    for (const r of samples.find((s) => s.name.startsWith('tales'))?.rows ?? []) assert.ok(all[Number(r.id.split('-').pop())].title.startsWith(r.title), r.id);
  }
});

test('story check: the table of elements and constraints per sample', () => {
  const cols = samples.map((s) => [s.name, measures(s.rows)]);
  const lines = Object.keys(cols[0][1]).map((m) => `${m}: ${cols.map(([n, x]) => `${n} ${x[m].k}/${x[m].n}`).join(', ')}`);
  console.log(`k.story check:\n${lines.join('\n')}`);
  // The constraints k.story keeps hard hold in nine in ten of the human tales where they apply; the elements it made
  // optional and the constraint it made soft do not (the decision of block 19:45, by these numbers).
  const t = Object.fromEntries(cols)[samples.find((s) => s.name.startsWith('tales')).name];
  const r = (m) => t[m].k / t[m].n;
  for (const m of ['obstacle blocks the goal', 'at most three attempts', 'helper has what is missing', 'protagonist lacks it']) assert.ok(r(m) >= 0.9, `${m}: ${t[m].k}/${t[m].n}`);
  for (const m of ['attempts that fail', 'a helper', 'resolution', 'goal reached']) assert.ok(r(m) < 0.8, `${m}: ${t[m].k}/${t[m].n}`);
  const story = readFileSync(join(REPO, 'docs', 'worlds', 'k.story', 'shards', 'structure.sop'), 'utf8');
  for (const e of ['attempt', 'helper', 'means', 'turning_point', 'resolution']) assert.match(story, new RegExp(`@k\\.story\\.element\\.${e} [^\\n]* min=0 `), `${e} optional`);
  assert.match(story, /@k\.story\.constraint\.ending_reaches_the_goal [^\n]* strength=soft /);
});
