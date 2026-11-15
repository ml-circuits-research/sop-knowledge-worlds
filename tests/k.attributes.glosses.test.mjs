// KR6 (block 15:35): usual colour, material and abilities of common things read from WordNet glosses
// (tools/attributes-glosses.mjs), every proposed value checked by hand in sources/coverage/kr6-audit.tsv.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { SHARD, derive, shardText, fromGloss, readAudit } from '../tools/attributes-glosses.mjs';

// the rules read the glosses of the senses kept by tools/coverage.mjs, which needs the raw WordNet and frequency files
const RAW = ['sources/wordnet/raw/wordnet31/data.noun', 'sources/frequency-words/raw/en_50k.txt'].every((f) => existsSync(join(REPO, f)));
test('the shard things-glosses is what the tool gives, and every value the rules propose is in the audit', { skip: !RAW && 'raw files not downloaded (sources/wordnet, sources/frequency-words)' }, async () => {
  const d = await derive();
  assert.deepEqual(d.unaudited, []);
  assert.equal(readFileSync(SHARD, 'utf8'), shardText(d));
  // the error rate of each rule, as the audit says, is in the shard's header
  for (const k of ['colour', 'material', 'can']) assert.ok(readFileSync(SHARD, 'utf8').includes(`${k} ${d.counts[k][1]} of ${d.counts[k][0]} wrong`), k);
});

test('the values are typed: a basic colour, a material, an action of k.actions; no wrong value of the audit is published', () => {
  const worlds = scanWorlds();
  const actions = new Set(factsOf('k.actions', 'k.actions.action', worlds).map((w) => String(w.attrs.name[0]).replace(/^"|"$/g, '')));
  const audit = readAudit();
  const mine = factsOf('k.attributes', 'k.attributes.thing', worlds).filter((w) => w.id.startsWith('k.attributes.thing.glosses.'));
  assert.ok(mine.length >= 60, `${mine.length} things`);
  for (const w of mine) for (const k of ['colour', 'material', 'can']) for (const v of w.attrs[k] ?? []) {
    assert.equal(audit.get(`${w.attrs.name[0]}\t${k}\t${v}`)?.verdict, 'right', `${w.id} ${k}=${v}`);
    if (k === 'can') assert.ok(actions.has(v), v);
  }
});

test('the rules on glosses: a colour and a material in the head of the gloss, an ability in its relative clause', () => {
  const acts = new Set(['cut', 'send', 'run']);
  assert.deepEqual(fromGloss('a glass or plastic vessel used for storing drinks', acts).material, ['glass', 'plastic']);
  assert.deepEqual(fromGloss('a heavy iron lever with one end forged into a wedge', acts).material, ['metal']);
  assert.deepEqual(fromGloss('sweet fleshy red fruit', acts).colour, ['red']);
  assert.deepEqual(fromGloss('a bird with a red breast', acts).colour, [], 'a colour after "with" is a part\'s');
  assert.deepEqual(fromGloss('a machine that cuts grain and binds it in sheaves', acts).can, ['cut']);
  assert.deepEqual(fromGloss('a passage through which water runs', acts).can, [], 'not after a preposition');
});
