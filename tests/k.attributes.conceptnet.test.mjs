// KR6 from ConceptNet 5.7 (block "Reviewer 2026-11-15 18:45" (2)): the share-alike shard things-conceptnet holds only
// values the hand check (sources/conceptnet/audit.tsv) found right, since every relation's sampled error was 5 % or
// more; the shard says the rates. With the raw files (sources/conceptnet/raw) the shard is rebuilt and compared.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, scanWorlds, factsOf, readHeader } from '../tools/lib/worlds.mjs';
import { readAudit, SHARD, candidates, decide, shardText, RELATIONS } from '../tools/import/conceptnet-attributes.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const text = readFileSync(SHARD, 'utf8');

test('a share-alike shard of its own, with the hand check of each relation in its header', () => {
  assert.deepEqual(readHeader(text).license, ['CC-BY-SA-4.0']);
  for (const rel of Object.keys(RELATIONS)) assert.match(text, new RegExp(`${rel} -> ${RELATIONS[rel]}: \\d+ written of \\d+ candidates \\(\\d+ with weight >= [12]\\); hand check of \\d+ drawn from those: \\d+ wrong \\([\\d.]+ %\\), so (only the values checked right|every value with weight)`));
  for (const l of text.split('\n').filter((x) => x.startsWith('@'))) assert.match(l, /core\.source="conceptnet 5\.7"$/);
});

test('every value written was checked right (no relation reached a sampled error under 5 %)', () => {
  const audit = readAudit(), right = new Set([...audit].filter(([, v]) => v.verdict === 'right').map(([k]) => k));
  const key = Object.fromEntries(Object.entries(RELATIONS).map(([r, k]) => [k, r]));
  for (const w of factsOf('k.attributes', 'k.attributes.thing', scanWorlds()).filter((x) => x.id.startsWith('k.attributes.thing.conceptnet.'))) {
    const n = tok(w.attrs.name[0]);
    for (const k of ['can', 'used_for', 'property']) for (const v of (w.attrs[k] ?? []).map(tok)) assert.ok(right.has(`${key[k]}\t${n}\t${v}`), `${n} ${k} ${v}`);
    for (const v of (w.attrs.material ?? []).map(tok)) assert.ok([...right].some((r) => r.startsWith(`MadeOf\t${n}\t`) && r.split('\t')[2].split(/,| and /).map((x) => x.trim()).includes(v)), `${n} material ${v}`);
  }
  assert.ok(audit.size >= 340);
});

test('with the raw files, the shard is what the importer gives', { skip: !existsSync(join(REPO, 'sources/conceptnet/raw/assertions-en.tsv')) && 'the raw files are not here (sources/conceptnet/SOURCE.md)' }, async () => {
  assert.equal(text, shardText(decide(await candidates())));
});
