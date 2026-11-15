// KR6 (block 18:45, questions.md Q80): material and use from Wikidata (CC0), the usual colour from Visual Genome
// (CC BY 4.0), each checked by hand (sources/coverage/kr6-*-audit.tsv); tools/import/attributes-data.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { candidates, shards, readAudit, MATERIAL } from '../tools/import/attributes-data.mjs';

const SH = join(WORLDS_DIR, 'k.attributes', 'shards');
const RAW = ['sources/wikidata-thing-attributes/raw/thing-attributes.tsv', 'sources/visual-genome/raw/object-attributes.tsv', 'sources/wordnet/raw/wordnet31/data.noun', 'sources/frequency-words/raw/en_50k.txt'].every((f) => existsSync(join(REPO, f)));
test('the shards things-wikidata and things-visual-genome are what the importer gives', { skip: !RAW && 'raw files not copied (sources/wikidata-thing-attributes, sources/visual-genome, sources/wordnet)' }, async () => {
  const s = shards(await candidates());
  for (const n of ['things-wikidata.sop', 'things-visual-genome.sop']) assert.equal(readFileSync(join(SH, n), 'utf8'), s[n], n);
  for (const k of ['material', 'use', 'colour']) assert.ok(s.stats[k].rate >= 0.05 || s.stats[k].keep.length === s.stats[k].all, k);
});

test('every published value was checked right by hand; each source in a shard of its licence', () => {
  const worlds = scanWorlds();
  const facts = factsOf('k.attributes', 'k.attributes.thing', worlds);
  const unq = (v) => String(v).replace(/^"|"$/g, '');
  const back = Object.fromEntries(Object.entries(MATERIAL).map(([k, v]) => [v, k]));
  const mat = readAudit('kr6-wikidata-material-audit'), use = readAudit('kr6-wikidata-use-audit'), col = readAudit('kr6-visual-genome-colour-audit');
  const right = (a, thing, values) => values.some((v) => a.get(`${thing}\t${v}`) === 'right');
  for (const w of facts.filter((x) => x.id.startsWith('k.attributes.thing.wikidata.'))) {
    const n = unq(w.attrs.name[0]);
    for (const v of (w.attrs.material ?? []).map(unq)) assert.ok(right(mat, n, [v, ...Object.entries(MATERIAL).filter(([, x]) => x === v).map(([k]) => k)]), `${n} material ${v}`);
    for (const v of (w.attrs.used_for ?? []).map(unq)) assert.ok(right(use, n, [v]), `${n} used_for ${v}`);
  }
  for (const w of facts.filter((x) => x.id.startsWith('k.attributes.thing.vg.'))) assert.ok(right(col, unq(w.attrs.name[0]), w.attrs.colour.map(unq)), w.id);
  assert.match(readFileSync(join(SH, 'things-wikidata.sop'), 'utf8'), /^# license: CC0-1\.0$/m);
  assert.match(readFileSync(join(SH, 'things-visual-genome.sop'), 'utf8'), /^# license: CC-BY-4\.0$/m);
  assert.ok(back.metal, 'steel and iron are named metal');
});
