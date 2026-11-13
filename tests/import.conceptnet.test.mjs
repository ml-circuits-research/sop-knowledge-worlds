// tools/import/conceptnet.mjs on a made-up fixture in the format of the assertions file. ConceptNet itself is not
// in the repository (sources/conceptnet/SOURCE.md); these lines are invented for the test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds, library } from '../tools/lib/worlds.mjs';
import { importConceptnet, readEdge, term } from '../tools/import/conceptnet.mjs';

const edge = (rel, a, b, w) => `/a/[/r/${rel}/,${a}/,${b}/]\t/r/${rel}\t${a}\t${b}\t{"dataset": "/d/test", "weight": ${w}}`;
const lines = [
  edge('AtLocation', '/c/en/kettle', '/c/en/kitchen', 3.5), edge('AtLocation', '/c/en/kettle', '/c/en/stove', 2.0),
  edge('UsedFor', '/c/en/kettle', '/c/en/boil_water', 4.0), edge('MadeOf', '/c/en/kettle/n', '/c/en/metal', 2.0),
  edge('IsA', '/c/en/kettle', '/c/en/pot', 2.0), edge('PartOf', '/c/en/spout', '/c/en/kettle', 2.0),
  edge('HasA', '/c/en/kettle', '/c/en/handle', 2.83), edge('CapableOf', '/c/en/kettle', '/c/en/whistle', 1.0),
  edge('AtLocation', '/c/fr/bouilloire', '/c/en/kitchen', 5.0), edge('RelatedTo', '/c/en/kettle', '/c/en/tea', 9.0),
  edge('AtLocation', '/c/en/fish', '/c/en/sea', 6.0), edge('AtLocation', '/c/en/kettle', '/c/en/kitchen', 2.0), 'broken line',
];

test('edges are filtered and mapped to keys', () => {
  assert.equal(term('/c/en/ice_cream/n'), 'ice cream');
  assert.equal(term('/c/fr/glace'), null);
  assert.deepEqual(readEdge(lines[0]), { name: 'kettle', key: 'at', value: 'kitchen', weight: 3.5 });
  assert.equal(readEdge(lines[7]), null);
  assert.equal(readEdge(lines[9]), null);
});

test('one fact per thing, values by weight, hand-written things left alone, and it loads', async () => {
  const run = () => importConceptnet(lines, { taken: new Set(['fish']) });
  const { files, stats } = await run();
  assert.deepEqual(Object.keys(files), ['conceptnet-k.sop', 'conceptnet-s.sop']);
  assert.deepEqual(stats, { lines: 13, edges: 9, things: 2, values: 7, skippedTaken: 1, shards: 2 });
  assert.equal(files['conceptnet-k.sop'].split('\n').find((l) => l.startsWith('@')),
    '@k.commonsense.cn.kettle k.commonsense.thing name=kettle at=kitchen at=stove used_for="boil water" made_of=metal is_a=pot has=handle core.source="conceptnet 5.7"');
  assert.ok(files['conceptnet-s.sop'].includes('@k.commonsense.cn.spout k.commonsense.thing name=spout part_of=kettle core.source="conceptnet 5.7"'));
  assert.ok(files['conceptnet-k.sop'].includes('# license: CC-BY-SA-4.0'));
  assert.deepEqual((await run()).files, files);
  const w = new World({ library: library(scanWorlds()) });
  w.use('k.commonsense');
  for (const text of Object.values(files)) assert.equal(w.tell(text).ok, true);
  assert.deepEqual(w.query({ type: 'k.commonsense.thing', where: { name: 'kettle' }, seek: 'at' }).values, ['kitchen', 'stove']);
});
