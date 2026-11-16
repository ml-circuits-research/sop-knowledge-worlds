import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,parse,parseText} from '../tools/sopworld/sopworld.mjs';
import {scanWorlds,factsOf} from '../tools/lib/worlds.mjs';
const worlds=scanWorlds(),entry=worlds.find(w=>w.id==='w.reader.en.phrases');
const text=entry.shards.map(s=>s.text).join('\n'),records=parse(text);
const one=(w,k)=>{const v=w?.attrs[k]?.[0];return typeof v==='string'&&v.startsWith('"')?JSON.parse(v):v;};
const of=type=>records.filter(w=>w.type==='w.reader.en.'+type);
const sourceCache=new Map();
function sources(type){if(!sourceCache.has(type)){const id=worlds.filter(w=>type.startsWith(w.id+'.')).sort((a,b)=>b.id.length-a.id.length)[0].id;sourceCache.set(type,factsOf(id,type,worlds));}return sourceCache.get(type);}
const lex=[];
for(const binding of of('binding')){const b=one(binding,'name'),features=of('feature').filter(w=>one(w,'binding')===b),filters=of('filter').filter(w=>one(w,'binding')===b),textKey=one(binding,'text_key');for(const source of sources(one(binding,'source_type'))){if(binding.attrs.source_id&&source.id!==one(binding,'source_id'))continue;if(!filters.every(f=>(source.attrs[one(f,'key')]||[]).some(v=>one({attrs:{v:[v]}},'v')===one(f,'value'))))continue;for(const token of source.attrs[textKey]||[]){const t=one({attrs:{v:[token]}},'v');if(!filters.filter(f=>one(f,'key')===textKey).every(f=>t===one(f,'value')))continue;const feat={};for(const f of features){const key=one(f,'key');feat[key]=f.attrs.from_key?(one(f,'from_key')===textKey?t:one(source,one(f,'from_key'))):one(f,'value');assert.notEqual(feat[key],undefined);}lex.push({text:t,cat:one(binding,'cat'),feat,origin:source.id});}}}
const nodes=new Map(of('node').map(w=>[one(w,'name'),w]));
const rules=of('rule');
test('separate phrase profile loads with published schema dependencies only',()=>{const w=new World({library:Object.fromEntries(worlds.filter(w=>['w.reader.en','w.reader.en.frames','w.reader.en.phrases'].includes(w.id)).map(w=>[w.id,w.schemaText]))});assert.equal(w.use('w.reader.en.phrases').ok,true);assert.equal(w.tell(text).ok,true);assert.equal(w.check().ok,true);assert.ok(!records.some(w=>w.type==='core.word'));});
test('general commands expose verb identity and construction family, never inferred act or selector',()=>{
 const commands=rules.filter(w=>one(w,'lhs')==='Command');assert.deepEqual(commands.map(w=>w.attrs.rhs),[['V','NP'],['V','NP','ResultPredicate'],['V','NP','GoalPP']]);
 assert.ok(!of('node').some(w=>['act','selector','target_mode'].includes(one(w,'field'))));
 for(const family of ['transitive','resultative','oblique']){assert.equal(one(nodes.get(`phrases.command.${family}.valency`),'value'),family);assert.equal(one(nodes.get(`phrases.command.${family}.mood`),'value'),'do');}
 const licences=factsOf('w.reader.en.frames','w.reader.en.frames.licence',worlds);assert.deepEqual(new Set(lex.filter(e=>e.cat==='V').map(e=>e.feat.verb)),new Set(licences.map(l=>one(l,'verb_id'))));
});
test('all templates use existing structured nodes and paths; qualifier and result stay independent',()=>{
 for(const m of of('map')){assert.ok(nodes.has(one(m,'root')));assert.notEqual(!!m.attrs.rule,!!m.attrs.cat);if(m.attrs.rule)assert.ok(rules.some(r=>one(r,'name')===one(m,'rule')));}
 for(const n of nodes.values()){if(n.attrs.parent)assert.ok(nodes.has(one(n,'parent')));if(one(n,'kind')==='copy'){const steps=of('step').filter(s=>one(s,'of')===one(n,'name')).sort((a,b)=>Number(one(a,'at'))-Number(one(b,'at')));assert.ok(steps.length>0);assert.deepEqual(steps.map(s=>Number(one(s,'at'))),steps.map((_,i)=>i));}}
 assert.equal(one(nodes.get('phrases.nominal.kind.qualifier'),'kind'),'null');assert.equal(one(nodes.get('phrases.nominal.qualified.qualifier'),'kind'),'object');assert.equal(one(nodes.get('phrases.command.resultative.complement'),'field'),'result');assert.equal(one(nodes.get('phrases.nominal.qualified.qualifier.character'),'value'),'requirement');assert.equal(one(nodes.get('phrases.result.value.polarity'),'value'),'positive');
 for(const category of ['V','KIND','VALUE','DET','PREP'])assert.ok(lex.some(e=>e.cat===category));
});
test('pinned grammar parses shared valencies and neutral qualified NPs from reusable source families',()=>{
 const w=new World();w.load(text);const lexicon={};for(const e of lex)(lexicon[e.text]??=[]).push(e);const options={types:{rule:'w.reader.en.rule',word:'unused',coord:'unused'},lexicon,start:'Message'};
 const word=verb=>lex.find(e=>e.cat==='V'&&e.feat.verb===verb).text,kind=lex.find(e=>e.cat==='KIND'&&/^[a-z]+$/.test(e.text)).text,values=lex.filter(e=>e.cat==='VALUE'&&e.feat.concept==='colour'&&/^[a-z]+$/.test(e.text));
 const inputs=[`${word('k.actions.verb.make.create')} a ${values[0].text} ${kind}`,`${word('k.actions.verb.remove.remove')} the ${kind}`,`${word('k.actions.verb.change.make')} the ${values[0].text} ${kind} ${values[1].text}`,`${word('k.actions.verb.place.put')} the ${kind} near the ${kind}`];
 for(const input of inputs){const parsed=parseText(w,input,options);assert.ok(parsed.length>0);assert.equal(parsed.truncated,undefined);}
});
