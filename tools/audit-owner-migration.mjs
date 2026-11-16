// Read-only published-fact audit. No loading/inference and no capability claims.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from './sopworld/sopworld.mjs';
const catalog = JSON.parse(readFileSync('docs/worlds/index.json', 'utf8'));
const groups = {
  duck:['duck'], bird:['bird'], swing:['swing'], seat:['seat'], child:['child'], grandfather:['grandfather','old man'], girl:['girl'], robot:['robot'], man:['man'], boy:['boy'], woman:['woman'], frog:['frog'], flower:['flower'], petal:['petal'], hair:['hair','hair_front','hair_back'], beard:['beard'], grass:['grass'], lake:['lake'], pond:['pond'], water:['water'], sky:['sky'], ground:['ground'], cloud:['cloud'], sun:['sun'], house:['house'], fish:['fish'], 'water plant':['water plant','seaweed'], levels:['levels','layers','level'], node:['node'], arrow:['arrow'], hexagon:['hexagon'], circle:['circle'], letter:['letter'], story:['story'], chapter:['chapter'], narrator:['narrator'], colours:[], expressions:[]
};
const paths = [...new Set(catalog.worlds.flatMap(w => [w.schema, ...(w.shards ?? []).map(s => s.path)]))].sort();
const evidence = Object.fromEntries(Object.keys(groups).map(k => [k, []]));
const hashes = [];
for (const path of paths) {
  const file = `docs/worlds/${path}`, text = readFileSync(file,'utf8');
  hashes.push([file,createHash('sha256').update(text).digest('hex')]);
  const license = [...text.matchAll(/^# license:\s*(.*)$/gm)].map(m=>m[1]);
  for (const [index,line] of text.split('\n').entries()) {
    if (!line.startsWith('@')) continue;
    // Fast lexical prefilter before parsing the large published vocabulary.
    if (!Object.values(groups).flat().some(v => line.includes(v)) && !/ k\.(colours\.(colour|basic)|faces\.expression) /.test(line)) continue;
    const wire = parse(line)[0];
    if (!wire) continue;
    for (const [concept, aliases] of Object.entries(groups)) {
      const fields = Object.entries(wire.attrs).filter(([key,vs]) => ['name','of','thing','part','text','means','is','is_a','drawing','face','from','has','slot','unit'].includes(key) && vs.some(v=>aliases.includes(v.replace(/^"|"$/g,'')))).map(([k])=>k);
      const family = concept==='colours' && /^k\.colours\.(colour|basic)$/.test(wire.type) || concept==='expressions' && wire.type==='k.faces.expression';
      if (!fields.length && !family) continue;
      evidence[concept].push({file,line:index+1,id:wire.id,type:wire.type,matched:fields,attrs:wire.attrs,license});
    }
  }
}
const output={method:'Exact selected attribute values plus colour/expression family facts; catalog-listed patterns and shards only. Declaration occurrences, no inference. Aliases are explicit candidates, never equivalences.',catalogVersion:catalog.version,aliases:groups,inputs:hashes,evidence};
const body=JSON.stringify(output,null,2)+'\n';
const target='migration/owner-concepts-evidence.json';
if(process.argv.includes('--check')) {
  if(readFileSync(target,'utf8')!==body) throw new Error(`${target} is stale; run node tools/audit-owner-migration.mjs`);
} else writeFileSync(target,body);
console.log(`${Object.keys(groups).length} concepts; ${Object.values(evidence).reduce((n,rows)=>n+rows.length,0)} evidence occurrences; ${hashes.length} published inputs; ${Buffer.byteLength(body)} bytes`);
