import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,parse} from '../tools/sopworld/sopworld.mjs';
import {factsOf,scanWorlds} from '../tools/lib/worlds.mjs';
const worlds=scanWorlds();
const entry=worlds.find(w=>w.id==='w.reader.en.frames');
const data=entry.shards.map(s=>s.text).join('\n'),records=parse(data);
const pick=(w,k)=>w?.attrs[k]?.[0];
const of=t=>records.filter(w=>w.type===`w.reader.en.frames.${t}`);
const verbs=new Map(factsOf('k.actions','k.actions.verb',worlds).map(w=>[w.id,w]));
const frames=factsOf('w.lang.en','w.lang.en.frame',worlds),parts=new Map(factsOf('w.lang.en','w.lang.en.part',worlds).map(w=>[w.id,w]));
const maps=new Map(factsOf('w.lang.en','w.lang.en.role_map',worlds).map(w=>[w.id,w]));
const actRoles=factsOf('k.actions','k.actions.role',worlds);
const frameOf=l=>frames.find(f=>pick(f,'name')===pick(l,'frame_name'));
test('new opt-in module loads without changing the preview module',()=>{
 const w=new World({library:Object.fromEntries(worlds.filter(w=>['w.reader.en','w.reader.en.frames'].includes(w.id)).map(w=>[w.id,w.schemaText]))});
 assert.equal(w.use('w.reader.en.frames').ok,true);assert.equal(w.tell(data).ok,true);assert.equal(w.check().ok,true);
 assert.equal(w.ofType('w.reader.en.rule').length,0,'no new production family or old shard imported');
});
test('licences bind exact source senses and frame parts rather than a shared act guess',()=>{
 for(const l of of('licence')){const v=verbs.get(pick(l,'verb_id')),f=frameOf(l),p=parts.get(pick(l,'verb_part'));assert.ok(v&&f&&p,pick(l,'name'));assert.equal(pick(p,'frame'),pick(f,'name'));assert.equal(pick(p,'is'),'verb');assert.equal(pick(p,'act'),pick(v,'act'));assert.ok(pick(f,'act'));}
 const increment=of('licence').find(l=>pick(l,'name')==='increment');assert.equal(pick(verbs.get(pick(increment,'verb_id')),'act'),'make');assert.equal(pick(frameOf(increment),'act'),'change','selected frame owns semantic act');
 const transitive=of('licence').filter(l=>pick(l,'valency')==='transitive');assert.deepEqual(transitive.map(l=>pick(frameOf(l),'act')).sort(),['make','remove']);
});
test('every declared source role has a grounded semantic role and an ordered copy path',()=>{
 for(const l of of('licence')){const f=frameOf(l),roles=of('role').filter(r=>pick(r,'licence')===pick(l,'name'));assert.deepEqual(roles.map(r=>pick(r,'frame_role')).sort(),[...(f.attrs.role||[])].sort());for(const r of roles){const p=parts.get(pick(r,'part'));assert.equal(pick(p,'frame'),pick(f,'name'));assert.equal(pick(p,'role'),pick(r,'frame_role'));const m=maps.get(pick(r,'role_map'));if(r.attrs.role_map){assert.ok(m);assert.equal(pick(m,'act'),pick(f,'act'));assert.equal(pick(m,'role'),pick(r,'frame_role'));if(m.attrs.frame)assert.equal(pick(m,'frame'),pick(f,'name'));if(m.attrs.takes)assert.equal(pick(m,'takes'),pick(p,'takes'));assert.equal(pick(m,'act_role'),pick(r,'act_role'));}else assert.equal(pick(r,'act_role'),pick(r,'frame_role'));assert.ok(actRoles.some(a=>pick(a,'act')===pick(f,'act')&&pick(a,'name')===pick(r,'act_role')));const root=records.find(n=>n.type==='w.reader.en.node'&&pick(n,'name')===pick(r,'path_root'));assert.equal(pick(root,'kind'),'copy');const path=records.filter(n=>n.type==='w.reader.en.step'&&pick(n,'of')===pick(root,'name')).sort((a,b)=>Number(pick(a,'at'))-Number(pick(b,'at')));assert.deepEqual(path.map(s=>Number(pick(s,'at'))),path.map((_,i)=>i));assert.equal(pick(path[0],'key'),'node');}}
});
test('marker and argument projections remain distinct and resultative object keeps selector scope',()=>{
 const roles=of('role').filter(r=>pick(r,'licence')==='place'&&pick(r,'act_role')==='place');assert.equal(roles.length,2);assert.equal(roles.filter(r=>pick(maps.get(pick(r,'role_map')),'marker')==='yes').length,1);assert.notEqual(pick(roles[0],'path_root'),pick(roles[1],'path_root'));
 const resultRoles=of('role').filter(r=>pick(r,'licence')==='result.change');const paths=resultRoles.map(r=>records.filter(n=>n.type==='w.reader.en.step'&&pick(n,'of')===pick(r,'path_root')).sort((a,b)=>Number(pick(a,'at'))-Number(pick(b,'at'))).map(n=>pick(n,'key')));assert.deepEqual(paths,[['node','object'],['node','result']],'whole object including any selector stays apart from result predicate');
});
