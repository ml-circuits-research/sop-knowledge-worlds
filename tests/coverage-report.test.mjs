// The coverage report of the common things (Round 8, item 6): docs/worlds/COVERAGE.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, schemaWorld } from '../tools/lib/worlds.mjs';
import { ROWS } from '../tools/coverage-report.mjs';

test('every row of the report names a type and keys that exist', () => {
  const worlds = scanWorlds();
  for (const [label, ...sources] of ROWS) for (const [type, by, keys] of sources) {
    const { world } = schemaWorld(worlds, type.split('.').slice(0, 2).join('.'));
    const schema = world.schema(type);
    assert.ok(schema, `${label}: ${type}`);
    for (const k of [by, ...keys]) assert.ok(schema.keys[k], `${label}: ${type} has no key ${k}`);
  }
});

test('COVERAGE.md has the drawings, a line per attribute, the worlds and the gaps (the counts change with the worlds: rerun tools/coverage-report.mjs)', () => {
  const page = readFileSync(join(WORLDS_DIR, 'COVERAGE.md'), 'utf8');
  for (const [label] of ROWS) assert.ok(page.includes(`| ${label} | `), label);
  for (const h of ['## Drawings', '## Attributes', '## Worlds', '## Gaps']) assert.ok(page.includes(h), h);
});

test('the counts of a fresh run add up (when the raw files are there)', { skip: !existsSync(join(REPO, 'sources/wordnet/raw/wordnet31/data.noun')) || !existsSync(join(REPO, 'sources/frequency-words/raw/en_50k.txt')) }, async () => {
  const { coverageReport } = await import('../tools/coverage-report.mjs');
  const { run } = await import('../tools/coverage.mjs');
  const r = coverageReport(run().list, JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8')));
  assert.equal(r.total, 1500);
  assert.equal(r.drawn + r.linked + r.neither, r.total);
  for (const x of r.rows) assert.equal(x.own + x.through + x.none, r.total, x.label);
});
