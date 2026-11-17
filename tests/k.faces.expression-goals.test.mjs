import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EXPRESSION_GOALS,EXPRESSIONS,VARIANTS,coreShards} from '../tools/faces-core.mjs';
test('every sparse expression goal group has drawable compatible constituent choices',()=>{
 const grouped=new Map();for(const [expression,slot,property,value]of EXPRESSION_GOALS){assert.ok(EXPRESSIONS.some(([name])=>name===expression));const key=expression+' '+slot;if(!grouped.has(key))grouped.set(key,{slot,goals:[]});grouped.get(key).goals.push({property,value});}
 for(const {slot,goals}of grouped.values())assert.ok(VARIANTS[slot].some(([,features,parts])=>parts.length&&goals.every(({property,value})=>[].concat(features[property]??[]).includes(value))),slot);
});
test('happy is a sparse goal with multiple compatible mouths and brows, not a fixed face vector',()=>{
 const matching=slot=>VARIANTS[slot].filter(([,features])=>EXPRESSION_GOALS.filter(([e,s])=>e==='happy'&&s===slot).every(([, ,property,value])=>[].concat(features[property]??[]).includes(value)));
 assert.ok(matching('mouth').length>=2);assert.ok(matching('eyebrows').length>=2);
 assert.equal(EXPRESSION_GOALS.filter(([e,s])=>e==='happy'&&s==='mouth').length,1);
 const text=coreShards()['presets.sop'];assert.equal((text.match(/ k.faces.expression.goal /g)??[]).length,EXPRESSION_GOALS.length);
});
