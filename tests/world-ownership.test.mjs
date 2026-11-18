import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parse} from '../tools/sopworld/sopworld.mjs';
import {scanWorlds,schemaWorld,vocabularyWorld,vocabularyOf,moduleInfo} from '../tools/lib/worlds.mjs';
import {scanSchemas,actsWorld,actsVocabularyWorld} from '../tools/lib/schemas.mjs';

const worlds=scanWorlds(),schemas=scanSchemas();

test('published schema sources never own lexical facts; vocabulary has its own source',()=>{
 for(const entry of [...worlds,...schemas]){
  const source=parse(entry.schemaText),patterns=new Set(source.filter(w=>['core.rule','core.deny','core.check','core.calc'].includes(w.type)).flatMap(w=>['when','not','if','with','then','args','over'].flatMap(key=>(w.attrs[key]??[]).filter(value=>value.startsWith('$')).map(value=>value.slice(1)))));
  assert.equal(source.some(w=>w.type==='core.word'&&!patterns.has(w.id)),false,entry.id);
  const words=vocabularyOf(entry.id,[entry]);
  const ids=new Set();
  for(const word of words){
   assert.ok(word.id.startsWith(entry.id+'.'),word.id);
   assert.ok(word.attrs['core.source']?.length,word.id);
   assert.equal(ids.has(word.id),false,word.id);ids.add(word.id);
  }
 }
});

test('schema imports remain empty of lexical and domain-instance facts',()=>{
 for(const entry of worlds){
  const {world,result}=schemaWorld(worlds,entry.id);
  assert.equal(result.ok,true,entry.id);
  assert.equal(world.wires.size,0,entry.id);
 }
 for(const entry of schemas)assert.equal(actsWorld([entry.id],schemas).ofType('core.word').length,0,entry.id);
});

test('explicit vocabulary composition follows only declared imports and preserves owned facts',()=>{
 const id='k.faces',closure=new Set();
 const add=(name)=>{if(closure.has(name))return;closure.add(name);for(const dep of moduleInfo(worlds.find(w=>w.id===name).schemaText).imports)add(dep);};add(id);
 const expected=[...closure].flatMap(name=>vocabularyOf(name,worlds));
 const {world,result}=vocabularyWorld(worlds,id);assert.equal(result.ok,true);
 assert.deepEqual(world.ofType('core.word').map(w=>w.id).sort(),expected.map(w=>w.id).sort());
 for(const wire of expected)assert.deepEqual(world.get(wire.id).attrs,wire.attrs,wire.id);
 assert.equal(world.ofType('k.faces.variant').length,0,'no face data shard was implicitly loaded');
 assert.equal(world.ofType('k.time.month').length,0,'unrelated modules are not loaded');
 const other=actsVocabularyWorld(['w.face'],schemas);
 assert.deepEqual(other.ofType('core.word').map(w=>w.id).sort(),vocabularyOf('w.face',schemas).map(w=>w.id).sort());
});

test('imported reusable rules still derive from explicit instance facts after lexical separation',()=>{
 const {world,result}=vocabularyWorld(worlds,'k.commonsense');assert.equal(result.ok,true);
 assert.equal(world.ofType('k.commonsense.thing').length,0);
 const inserted=world.tell('@probe.leaf k.commonsense.thing name=probe is_a=probe.parent core.source="test 1"\n@probe.parent k.kinds.kind name=probe.parent is_a=probe.root core.source="test 1"');
 assert.equal(inserted.ok,true,JSON.stringify(inserted.violations));
 assert.deepEqual([...world.get('probe.leaf').attrs.kind_of].sort(),['probe.parent','probe.root']);
 const clean=schemaWorld(worlds,'k.commonsense').world;
 assert.equal(clean.ofType('k.commonsense.thing').length,0,'temporary composition cannot mutate the schema owner');
 assert.equal(clean.ofType('core.word').length,0);
});

test('declared vocabulary cannot silently disappear or become an untyped data preload',()=>{
 assert.throws(()=>vocabularyOf('sample',[{id:'sample',vocabularyPath:'sample/shards/words.sop'}]),/source was not supplied/);
 assert.throws(()=>vocabularyOf('sample',[{id:'sample',vocabularyText:'@x sample.item name=x'}]),/only core.word/);
});
