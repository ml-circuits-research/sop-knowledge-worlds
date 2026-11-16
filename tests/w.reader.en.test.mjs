// Validate declarative grammar/provider boundaries against published source families.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {factsOf,scanWorlds} from '../tools/lib/worlds.mjs';
import {World,parse,grammarOf,parseText} from '../tools/sopworld/sopworld.mjs';
const worlds=scanWorlds();
const text=readFileSync('docs/worlds/w.reader.en/shards/property-change.sop','utf8');
const records=parse(text);
const of=t=>records.filter(w=>w.type===`w.reader.en.${t}`);
const scalar=x=>typeof x==='string'&&x.startsWith('"')?JSON.parse(x):x;
const one=(w,k)=>scalar(w.attrs[k]?.[0]);
const sources=type=>factsOf(worlds.filter(w=>type.startsWith(w.id+'.')).sort((a,b)=>b.id.length-a.id.length)[0].id,type,worlds);
function lexical(binding){
 const filters=of('filter').filter(f=>one(f,'binding')===one(binding,'name'));
 const features=of('feature').filter(f=>one(f,'binding')===one(binding,'name'));
 const rows=sources(one(binding,'source_type')).filter(w=>(!one(binding,'source_id')||w.id===one(binding,'source_id'))&&filters.every(f=>(w.attrs[one(f,'key')]||[]).some(v=>scalar(v)===one(f,'value'))));
 return rows.flatMap(w=>(w.attrs[one(binding,'text_key')]||[]).filter(v=>filters.filter(f=>one(f,'key')===one(binding,'text_key')).every(f=>scalar(v)===one(f,'value'))).map(v=>({text:scalar(v),cat:one(binding,'cat'),source:w.id,feat:Object.fromEntries(features.map(f=>[one(f,'key'),f.attrs.from_key?scalar(w.attrs[one(f,'from_key')]?.[0]):one(f,'value')]))})));
}
// core.word declarations are in schemas for some families; source providers must read both.
function sourceWords(){return worlds.flatMap(w=>[...parse(w.schemaText),...w.shards.flatMap(s=>s.text.split('\n').filter(l=>l.startsWith('@')&&l.includes(' core.word ')).flatMap(parse))]).filter(w=>w.type==='core.word');}
const words=sourceWords();
// A core.word provider is shared across the loaded vocabulary, not a world named core.
function allLex(){return of('binding').flatMap(b=>{
 if(one(b,'source_type')!=='core.word')return lexical(b);
 const filters=of('filter').filter(f=>one(f,'binding')===one(b,'name'));
 const features=of('feature').filter(f=>one(f,'binding')===one(b,'name'));
 return words.filter(w=>(!one(b,'source_id')||w.id===one(b,'source_id'))&&filters.every(f=>(w.attrs[one(f,'key')]||[]).some(v=>scalar(v)===one(f,'value')))).flatMap(w=>(w.attrs[one(b,'text_key')]||[]).map(v=>({text:scalar(v),cat:one(b,'cat'),source:w.id,feat:Object.fromEntries(features.map(f=>[one(f,'key'),one(f,'value')]))})));
 });}
const lex=allLex();
test('overlay loads on the pinned build without request or legend migration',()=>{
 const w=new World({library:{'w.reader.en':readFileSync('docs/worlds/w.reader.en/schema.sop','utf8')}});assert.equal(w.use('w.reader.en').ok,true);assert.equal(w.tell(text).ok,true);assert.equal(w.check().ok,true);
});
test('providers retain broad source families and no copied domain words',()=>{
 assert.ok(lex.length>1000);
 for(const type of ['k.colours.colour','k.shapes.shape']){const b=of('binding').find(b=>one(b,'source_type')===type);assert.equal(lexical(b).length,sources(type).length);}
 const shapeKinds=of('binding').find(b=>one(b,'source_type')==='k.shapes.shape'&&one(b,'cat')==='KIND');
 assert.equal(lexical(shapeKinds).length,sources('k.shapes.shape').length,'every shape can be named as a target kind as well as a value');
 for(const category of ['PROPERTY','KIND','VALUE','CHANGE','OF','TO','DET'])assert.ok(lex.some(x=>x.cat===category),category);
 assert.ok(lex.every(x=>Object.values(x.feat).every(v=>v!==undefined)));
 assert.ok(!records.some(w=>w.type==='core.word'));
 assert.equal(lex.filter(x=>x.cat==='CHANGE').length,1,'only the licensed frame verb, not all change synonyms');
 assert.equal(of('feature').some(f=>one(f,'key')==='mood'),false,'mood belongs to the imperative production');
});
test('template references and paths are complete; property/value compatibility is explicit',()=>{
 const nodes=new Map(of('node').map(n=>[one(n,'name'),n]));const rules=new Set(of('rule').map(r=>one(r,'name')));
 for(const map of of('map')){assert.ok(nodes.has(one(map,'root')));if(map.attrs.rule)assert.ok(rules.has(one(map,'rule')));assert.notEqual(!!map.attrs.rule,!!map.attrs.cat);}
 for(const n of nodes.values()){if(n.attrs.parent)assert.ok(nodes.has(one(n,'parent')));const steps=of('step').filter(s=>one(s,'of')===one(n,'name')).sort((a,b)=>Number(one(a,'at'))-Number(one(b,'at')));if(one(n,'kind')==='copy')assert.deepEqual(steps.map(s=>Number(one(s,'at'))),steps.map((_,i)=>i));for(const s of steps)assert.notEqual(!!s.attrs.key,!!s.attrs.index);}
 for(const [name,value]of [['command.constraint.character','requirement'],['command.constraint.polarity','positive']]){const n=nodes.get(name);assert.equal(one(n,'kind'),'literal');assert.equal(one(n,'value'),value);}
 for(const name of ['target.bare.mode','target.definite.mode']){const n=nodes.get(name);assert.equal(one(n,'kind'),'literal');assert.equal(one(n,'value'),'existing');}
 assert.equal(of('agreement').length,1);for(const a of of('agreement'))for(const key of ['left','right'])assert.equal(one(nodes.get(one(a,key)),'kind'),'copy');
});
test('published grammar consumes bindings across both value families with bounded category composition',()=>{
 const g=new World();g.load(text);const byText={};for(const e of lex)(byText[e.text]??=[]).push({cat:e.cat,feat:e.feat});
 const grammar={types:{rule:'w.reader.en.rule',word:'unused.word',coord:'unused.coord'},lexicon:byText};
 assert.ok(grammarOf(g,grammar).rules.has('Command'));
 const kind=lex.find(x=>x.cat==='KIND'&&/^[a-z]+$/.test(x.text));
 for(const concept of ['colour','shape']){const property=lex.find(x=>x.cat==='PROPERTY'&&x.feat.concept===concept);const value=lex.find(x=>x.cat==='VALUE'&&x.feat.concept===concept&&/^[a-z]+$/.test(x.text));const result=parseText(g,`change the ${property.text} of the ${kind.text} to ${value.text}`,{...grammar,start:'Message'});assert.ok(result.length>0,concept);}
});
