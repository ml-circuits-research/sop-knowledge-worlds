// KR6 uses (block "Reviewer 2026-11-15 18:10" (2)): tools/attributes-uses.mjs gives the shard things-uses for the things
// that do nothing by themselves, from the instrument role of k.actions and the uses the catalog gives kinds, carried
// down WordNet's hypernyms; every value written was checked by hand (sources/coverage/uses-audit.tsv).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { derive, shardText, readAudit, gerund, SHARD } from '../tools/attributes-uses.mjs';
import { canApplies } from '../tools/attributes-abilities.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

test('the shard things-uses is what the tool gives (values proposed since and not checked are left out and named)', (t) => {
  const d = derive(worlds);
  if (d.unaudited.length) t.diagnostic(`not checked yet (run node tools/attributes-uses.mjs): ${d.unaudited.map((p) => `${p.name} ${p.use}`).join(', ')}`);
  assert.equal(readFileSync(SHARD, 'utf8'), shardText(d), 'run node tools/attributes-uses.mjs');
  assert.ok(d.props.length >= 60 && d.wrong.length / d.props.length < 0.25, `${d.wrong.length} of ${d.props.length} wrong`);
  assert.match(readFileSync(SHARD, 'utf8'), /\d+ of \d+ proposed \([\d.]+ %\) were wrong by the hand check/);
});

test('only things that do nothing by themselves; no value checked wrong is written; uses said as -ing forms', () => {
  const audit = readAudit(), acts = canApplies(worlds);
  const uses = new Map(factsOf('k.attributes', 'k.attributes.thing', worlds).filter((w) => w.id.startsWith('k.attributes.thing.uses.')).map((w) => [tok(w.attrs.name[0]), (w.attrs.used_for ?? []).map(tok)]));
  for (const [n, us] of uses) { assert.ok(!acts(n), n); for (const u of us) assert.equal(audit.get(`${n}\t${u}`)?.verdict, 'right', `${n} ${u}`); }
  assert.deepEqual(uses.get('soap'), ['washing']);
  assert.ok(uses.get('palace').includes('living') && uses.get('motorway').includes('driving'));
  for (const n of ['alley', 'coffin', 'vial', 'balloon']) assert.equal(uses.get(n), undefined, n);
  assert.deepEqual([gerund('sleep'), gerund('put on'), gerund('cut')], ['sleeping', 'putting on', 'cutting']);
});
