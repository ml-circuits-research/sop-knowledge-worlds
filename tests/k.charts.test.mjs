// k.charts (block 15:35 item 2): which chart fits which data, from Mackinlay 1986, Cleveland and McGill 1984 and Few.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, factsOf, scanWorlds } from '../tools/lib/worlds.mjs';
import { SHARD, shardText, chartsFor } from '../tools/charts-core.mjs';

const worlds = scanWorlds();
const unq = (v) => String(v).replace(/^"|"$/g, '');
const one = (f, k) => (f.attrs[k] ? unq(f.attrs[k][0]) : undefined);
const all = (f, k) => (f.attrs[k] ?? []).map(unq);
const of = (t) => factsOf('k.charts', `k.charts.${t}`, worlds);
const kinds = of('kind'), rules = of('rule'), ranks = of('rank'), rels = of('relationship'), encodings = of('encoding');
const sources = new Set(of('source').map((s) => one(s, 'name')));

test('the shard is what tools/charts-core.mjs writes; every fact cites works of k.charts.source', () => {
  assert.equal(readFileSync(SHARD, 'utf8'), shardText());
  for (const f of [...kinds, ...rules, ...rels, ...ranks]) for (const s of all(f, 'source')) assert.ok(sources.has(s), `${f.id}: ${s}`);
  for (const r of rules) assert.ok(all(r, 'source').length, r.id);
});

test('joins: a kind\'s form is a form of w.chart, its encoding is ranked; a rule names a kind and a relationship', () => {
  const schema = readFileSync(join(WORLDS_DIR, 'w.chart', 'schema.sop'), 'utf8');
  const forms = [.../^@w\.chart\.chart\.form core\.slot .*$/m.exec(schema)[0].matchAll(/ enum=(\S+)/g)].map((m) => m[1]);
  const encs = new Set(encodings.map((e) => one(e, 'name'))), kindNames = new Set(kinds.map((k) => one(k, 'name'))), relNames = new Set(rels.map((r) => one(r, 'name')));
  for (const k of kinds) { assert.ok(forms.includes(one(k, 'form')), `${one(k, 'name')}: form`); assert.ok(ranks.some((r) => one(r, 'encoding') === one(k, 'encoding')), one(k, 'encoding')); }
  for (const r of ranks) assert.ok(encs.has(one(r, 'encoding')), r.id);
  for (const r of rules) { assert.ok(kindNames.has(one(r, 'kind')), r.id); assert.ok(relNames.has(one(r, 'relationship')), r.id); }
  for (const rel of relNames) assert.ok(rules.some((r) => one(r, 'relationship') === rel && one(r, 'rank') === '1'), `${rel}: a best kind`);
});

test('the rankings, most accurate first: position, then length, then angle, then area (Cleveland and McGill; Mackinlay)', () => {
  const rank = (src, data, e) => Number(one(ranks.find((r) => one(r, 'source') === src && one(r, 'data') === data && one(r, 'encoding') === e), 'rank'));
  for (const src of ['cleveland1984', 'mackinlay1986']) {
    assert.equal(rank(src, 'quantitative', 'position'), 1);
    assert.ok(rank(src, 'quantitative', 'length') < rank(src, 'quantitative', 'angle') && rank(src, 'quantitative', 'angle') < rank(src, 'quantitative', 'area'), src);
  }
  assert.equal(rank('mackinlay1986', 'nominal', 'colour hue'), 2, 'for nominal data hue comes right after position');
});

test('expressiveness and the rules: the reviewer\'s cases, and every best kind takes the data its relationship has', () => {
  assert.deepEqual(chartsFor({ relationship: 'part-to-whole', categories: 4 }), ['pie chart', 'bar chart'], 'a share of a whole: a pie for a few parts');
  assert.deepEqual(chartsFor({ relationship: 'part-to-whole', categories: 9 }), ['bar chart'], 'too many slices: bars');
  assert.deepEqual(chartsFor({ relationship: 'part-to-whole', series: 3 }), ['stacked bar chart'], 'several wholes: stacked bars');
  assert.equal(chartsFor({ relationship: 'time series', points: 12 })[0], 'line chart', 'a trend over time: a line');
  assert.equal(chartsFor({ relationship: 'correlation' })[0], 'scatter plot');
  const kind = (n) => kinds.find((k) => one(k, 'name') === n);
  for (const r of rules.filter((x) => one(x, 'relationship') === 'part-to-whole' && one(x, 'kind') !== 'bar chart')) assert.equal(one(kind(one(r, 'kind')), 'whole'), 'true', r.id);
  for (const r of rules.filter((x) => one(x, 'relationship') === 'time series')) assert.ok(all(kind(one(r, 'kind')), 'x').includes('time'), r.id);
  for (const r of rules.filter((x) => one(x, 'relationship') === 'correlation')) assert.deepEqual([all(kind(one(r, 'kind')), 'x'), all(kind(one(r, 'kind')), 'y')], [['quantitative'], ['quantitative']]);
  assert.ok(!all(kind('pie chart'), 'x').includes('time'), 'no pie over time');
});
