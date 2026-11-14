// w.lang.en.arrangement (block "04:40" item 4): the phrases that say how things are arranged, joined to k.layouts
// (the arrangement, and a relation that arrangement has) and to the layouts of w.diagram and k.diagrams.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, factsOf, scanWorlds } from '../tools/lib/worlds.mjs';

const worlds = scanWorlds();
const unq = (v) => String(v).replace(/^"|"$/g, '');
const one = (f, k) => (f.attrs[k] ? unq(f.attrs[k][0]) : undefined);
const phrases = factsOf('w.lang.en', 'w.lang.en.arrangement', worlds);
const layouts = factsOf('k.layouts', 'k.layouts.layout', worlds);
const relations = factsOf('k.layouts', 'k.layouts.relation', worlds);
const diagramLayouts = [...readFileSync(join(WORLDS_DIR, 'w.diagram', 'schema.sop'), 'utf8').match(/^@w\.diagram\.diagram\.layout core\.slot .*$/m)[0].matchAll(/ enum=(\S+)/g)].map((m) => m[1]);
const byText = (t) => phrases.find((p) => one(p, 'text') === t);

test('every phrase names a k.layouts arrangement, a relation that arrangement has, or a w.diagram layout', () => {
  assert.ok(phrases.length >= 50, `${phrases.length} phrases`);
  for (const p of phrases) {
    assert.ok(one(p, 'layout') || one(p, 'relation') || one(p, 'diagram_layout'), one(p, 'text'));
    if (one(p, 'layout')) assert.ok(layouts.some((l) => one(l, 'name') === one(p, 'layout')), `${one(p, 'text')}: ${one(p, 'layout')}`);
    if (one(p, 'layout') && one(p, 'relation')) assert.ok(relations.some((r) => one(r, 'layout') === one(p, 'layout') && one(r, 'rel') === one(p, 'relation')), `${one(p, 'text')}: ${one(p, 'layout')} has no ${one(p, 'relation')}`);
    if (one(p, 'diagram_layout')) assert.ok(diagramLayouts.includes(one(p, 'diagram_layout')), one(p, 'text'));
  }
});

test('the reviewer\'s phrases, and a phrase for every repeating arrangement of k.layouts and every diagram layout but one of its kind', () => {
  assert.deepEqual(['layout', 'diagram_layout'].map((k) => one(byText('in a circle'), k)), ['ring', 'circular']);
  assert.deepEqual(['layout', 'diagram_layout'].map((k) => one(byText('in a grid'), k)), ['grid', 'grid']);
  assert.equal(one(byText('in a row'), 'layout'), 'row');
  assert.equal(one(byText('in a column'), 'layout'), 'column');
  assert.equal(one(byText('evenly'), 'relation'), 'evenly_spaced');
  assert.deepEqual(['layout', 'relation', 'direction'].map((k) => one(byText('left to right'), k)), ['row', 'left_of', 'left_to_right']);
  assert.deepEqual(['layout', 'relation', 'direction'].map((k) => one(byText('top to bottom'), k)), ['column', 'above', 'top_to_bottom']);
  assert.equal(one(byText('right to left'), 'inverse'), 'yes');
  const named = new Set(phrases.map((p) => one(p, 'layout')));
  for (const l of layouts.filter((x) => one(x, 'kind') === 'repeating' || ['tree', 'radial', 'corners', 'border'].includes(one(x, 'name')))) assert.ok(named.has(one(l, 'name')), one(l, 'name'));
  const asked = new Set(phrases.map((p) => one(p, 'diagram_layout')));
  for (const l of diagramLayouts) assert.ok(asked.has(l), l);
});

test('the diagram layouts the phrases ask for are the layouts of k.diagrams\' kinds', () => {
  const kindLayouts = new Set(factsOf('k.diagrams', 'k.diagrams.kind', worlds).flatMap((k) => (k.attrs.layout ?? []).map(unq)));
  assert.deepEqual([...kindLayouts].sort(), [...diagramLayouts].sort());
});
