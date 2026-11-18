import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scanWorlds, schemaWorld} from '../tools/lib/worlds.mjs';

const catalog = scanWorlds();
const fact = (owner,id) => catalog.find(world => world.id === owner).shards
  .flatMap(shard => shard.text.split('\n')).find(line => line.startsWith('@'+id+' '));

test('common media and declared support regions yield traceable placement suggestions', () => {
  const {world,result} = schemaWorld(catalog,'k.composition2d');
  assert.equal(result.ok,true);
  const rows = [
    ...['boat','sun','airship','thread'].map(name=>'@want.'+name+' k.composition2d.subject name='+name),
    fact('k.scenes','k.scenes.thing.sun'), fact('k.scenes','k.scenes.thing.boat'),
    fact('k.layouts','k.layouts.anchor.lake.water'), fact('k.layouts','k.layouts.layout.landscape'),
    fact('k.layouts','k.layouts.slot.landscape.sky'),
    '@airship k.scenes.thing name=airship place=sky',
    '@fabric k.layouts.anchor of=loom name=work kind=surface x=5 y=4 w=30 h=40 holds=thread',
  ];
  assert.ok(rows.every(Boolean));
  const r=world.tell(rows.join('\n'));
  assert.equal(r.ok,true,JSON.stringify(r.violations));
  const slots=world.ofType('k.composition2d.slot'),anchors=world.ofType('k.composition2d.anchor');
  for(const subject of ['sun','airship'])
    assert.ok(slots.some(({attrs:a})=>a.subject.includes(subject)&&a.place.includes('sky')&&a.y[0]==='0'&&a.h[0]==='50'));
  const boat=anchors.find(({attrs:a})=>a.subject.includes('boat')&&a.of.includes('lake')&&a.evidence.includes('$k.scenes.thing.boat'));
  assert.deepEqual(['x','y','w','h'].map(key=>Number(boat.attrs[key][0])),[3,22,94,56]);
  assert.ok(boat.attrs.evidence.includes('$k.layouts.anchor.lake.water'));
  assert.ok(anchors.some(({attrs:a})=>a.subject.includes('thread')&&a.of.includes('loom')));
  assert.ok(!anchors.some(({attrs:a})=>a.subject.includes('sun')&&a.of.includes('lake')));
});

test('an explicitly assigned structural role opens a region without inferring a role from shape', () => {
  const {world,result} = schemaWorld(catalog,'k.composition2d');
  assert.equal(result.ok,true);
  assert.equal(world.tell([
    '@want k.composition2d.subject name=diamond',
    fact('k.layouts','k.layouts.layout.scatter'),
    fact('k.layouts','k.layouts.slot.scatter.item'),
  ].join('\n')).ok,true);
  assert.deepEqual(world.ofType('k.composition2d.slot'),[]);
  assert.equal(world.tell('@role k.composition2d.role name=node').ok,true);
  const [region]=world.ofType('k.composition2d.slot');
  assert.equal(region.attrs.basis[0],'role');
  assert.equal(region.attrs.layout[0],'scatter');
  assert.deepEqual(['x','y','w','h'].map(key=>Number(region.attrs[key][0])),[0,0,100,100]);
  assert.deepEqual(region.attrs.evidence,['$k.layouts.slot.scatter.item']);
});
