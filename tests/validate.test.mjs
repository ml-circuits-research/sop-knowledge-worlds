import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateWorlds } from '../tools/validate.mjs';
import { REPO } from '../tools/lib/worlds.mjs';
import { version, build } from '../tools/sopworld/sopworld.mjs';

test('the pinned sopworld build is the one VERSION names', () => {
  const v = Object.fromEntries(readFileSync(join(REPO, 'tools/sopworld/VERSION'), 'utf8').trim().split('\n').map((l) => l.split(': ')));
  const sha = createHash('sha256').update(readFileSync(join(REPO, 'tools/sopworld/sopworld.mjs'))).digest('hex');
  assert.equal(sha, v.sha256);
  assert.equal(version, v.version);
  assert.equal(build.hash, v.build);
  assert.ok(v.commit.startsWith('c7247e2'));
});

test('every world under docs/worlds loads with zero errors', () => {
  const r = validateWorlds();
  assert.deepEqual(r.errors, []);
});

const fixture = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'skw-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
};
const schema = '@k.toy core.module name=k.toy exports=item\n@k.toy.item.name core.slot of=k.toy.item key=name id=true kind=atom\n';
const head = '# sources: test 1\n# license: CC0-1.0\n# script: none\n';

test('a good world passes and is measured', () => {
  const root = fixture({ 'k.toy/schema.sop': schema, 'k.toy/shards/a.sop': `${head}@k.toy.a k.toy.item name=a core.source="test 1"\n` });
  try {
    const r = validateWorlds(root);
    assert.deepEqual(r.errors, []);
    const shard = r.results.find((x) => x.shard === 'k.toy/shards/a');
    assert.equal(shard.wires, 1);
    assert.ok(shard.bytes > 0);
  } finally { rmSync(root, { recursive: true }); }
});

test('refusals, a missing source, a missing header and a duplicate across shards are errors', () => {
  const root = fixture({
    'k.toy/schema.sop': schema,
    'k.toy/shards/a.sop': `${head}@k.toy.a k.toy.item name=a core.source="test 1"\n@k.toy.b k.toy.item name=b\n`,
    'k.toy/shards/b.sop': `${head}@k.toy.a k.toy.item name=c core.source="test 1"\n`,
    'k.toy/shards/c.sop': '@k.toy.d k.toy.item name=d name=e core.source="test 1"\n',
  });
  try {
    const r = validateWorlds(root);
    assert.equal(r.ok, false);
    const all = r.errors.join('\n');
    assert.match(all, /k\.toy\.b has no core\.source/);
    assert.match(all, /with the other shards/);
    assert.match(all, /c\.sop: the header has no "# sources:" line/);
    assert.match(all, /c\.sop: cardinality/);
  } finally { rmSync(root, { recursive: true }); }
});

test('a schema that declares a type outside its prefix is an error', () => {
  const root = fixture({ 'k.toy/schema.sop': '@k.toy core.module name=k.toy\n@k.toy.s core.slot of=other.item key=name\n' });
  try {
    const r = validateWorlds(root);
    assert.match(r.errors.join('\n'), /not under its own prefix/);
  } finally { rmSync(root, { recursive: true }); }
});
