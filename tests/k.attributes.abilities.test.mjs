// KR6 abilities (block "Reviewer 2026-11-15 16:45"): tools/attributes-abilities.mjs gives the shard things-abilities from
// the agents of k.actions and the abilities the catalog says of kinds, carried down WordNet's hypernyms; every value it
// writes was checked by hand (sources/coverage/abilities-audit.tsv) and no wrong one is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { derive, shardText, readAudit, SHARD } from '../tools/attributes-abilities.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

test('the shard things-abilities is what the tool gives from the catalog and the hand check (values proposed since and not checked are left out and named)', (t) => {
  const d = derive(worlds);
  if (d.unaudited.length) t.diagnostic(`not checked yet (run node tools/attributes-abilities.mjs): ${d.unaudited.map((p) => `${p.name} ${p.verb}`).join(', ')}`);
  assert.equal(readFileSync(SHARD, 'utf8'), shardText(d), 'run node tools/attributes-abilities.mjs');
  assert.ok(d.props.length >= 100 && d.wrong.length / d.props.length < 0.2, `${d.wrong.length} of ${d.props.length} wrong`);
});

test('no value checked wrong is written; the rule keeps senses apart', () => {
  const audit = readAudit();
  const can = new Map(factsOf('k.attributes', 'k.attributes.thing', worlds).filter((w) => w.id.startsWith('k.attributes.thing.abilities.')).map((w) => [tok(w.attrs.name[0]), (w.attrs.can ?? []).map(tok)]));
  for (const [n, vs] of can) for (const v of vs) assert.equal(audit.get(`${n}\t${v}`)?.verdict, 'right', `${n} ${v}`);
  assert.deepEqual(can.get('laptop'), ['work']);
  assert.ok(can.get('freighter').includes('sail') && can.get('baby').includes('cry'));
  assert.deepEqual(can.get('louse'), ['crawl']); // lice are wingless: fly checked wrong
  for (const n of ['plum', 'onion', 'queen', 'mortar', 'shipwreck', 'person']) assert.ok(!can.get(n) || n === 'shipwreck', n); // a plum is first the tree; the onion's bulb is not the lamp
  assert.deepEqual(can.get('shipwreck'), ['sink']);
});
