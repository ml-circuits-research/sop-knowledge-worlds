// Diagram topics (block 07:30 item 9, PSys2 Q17 (9): the speller read "tea" as "sea" because no world the diagram
// host loads says the word): one derived fact per topic a diagram can be drawn about, read from the fills of k.diagrams
// (a fill's `topic` key: the method, the everyday procedure, the thing whose parts, the kind whose kinds, the cycle,
// the kind of space body ...), with the kinds of diagram it fills and the types it comes from. A host that loads these
// shards knows every topic word of the diagram knowledge (its speller's vocabulary, a topic for a random diagram).
// Derived: rebuilt by `npm run build`; a topic keeps the licence and source of the facts it comes from (one shard per
// licence, split by first letter when large); `nodes` is the size of the largest diagram of it (a topic of one node
// is not listed: a diagram of one box says nothing).
//   node tools/diagram-topics.mjs     writes docs/worlds/k.diagrams/shards/topics-*.sop
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, readHeader } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';

const DIR = join(WORLDS_DIR, 'k.diagrams', 'shards');
const PREFIX = 'topics-';
const MAX = 1800;
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => (w.attrs[k] ? tok(w.attrs[k][0]) : undefined);

export function diagramTopics(worlds = scanWorlds()) {
  const fillShard = worlds.find((w) => w.id === 'k.diagrams').shards.find((s) => s.id === 'k.diagrams/shards/diagrams');
  const fills = parse(fillShard.text).filter((w) => w.type === 'k.diagrams.fill' && w.attrs.topic);
  const schemas = worlds.map((w) => w.schemaText).join('\n');
  const subtypes = (t) => [t, ...[...schemas.matchAll(new RegExp(`^@(\\S+) core\\.type .*extends=${t.replace(/\./g, '\\.')}( |$)`, 'gm'))].map((m) => m[1])];
  const worldOf = (t) => worlds.filter((w) => t.startsWith(`${w.id}.`)).sort((a, b) => b.id.length - a.id.length)[0];
  // the facts of some types, with the licence and the sources of the shard of each
  const cache = new Map();
  const factsOf = (t) => {
    if (cache.has(t)) return cache.get(t);
    const want = new Set(subtypes(t)), out = [];
    for (const s of worldOf(t).shards) {
      const license = readHeader(s.text).license?.[0] ?? null;
      for (const line of s.text.split('\n')) {
        if (!line.startsWith('@')) continue;
        const ty = line.split(' ', 3)[1];
        if (want.has(ty)) for (const w of parse(line)) out.push({ w, license });
      }
    }
    cache.set(t, out);
    return out;
  };
  const topics = new Map(); // license -> name -> { kinds, from, nodes, sources }
  const add = (license, name, kind, from, nodes, sources) => {
    if (!name || nodes < 2) return;
    if (!topics.has(license)) topics.set(license, new Map());
    const m = topics.get(license);
    const t = m.get(name) ?? m.set(name, { kinds: new Set(), from: new Set(), nodes: 0, sources: new Set() }).get(name);
    t.kinds.add(kind); t.from.add(from); t.nodes = Math.max(t.nodes, nodes);
    for (const s of sources) t.sources.add(s);
  };
  for (const f of fills) {
    const kind = one(f, 'kind'), type = one(f, 'type'), key = one(f, 'key'), topic = one(f, 'topic');
    const facts = factsOf(type);
    const src = (w) => (w.attrs['core.source'] ?? []).map(tok);
    if (topic === 'name') { // the topic's own fact and the values of its key (a car and its parts)
      for (const { w, license } of facts) add(license, one(w, 'name'), kind, type, 1 + new Set(w.attrs[key] ?? []).size, src(w));
    } else if (topic === key) { // the topic is a value of the key: the facts under it (a kind and its kinds)
      const under = new Map();
      for (const { w, license } of facts) for (const v of (w.attrs[key] ?? []).map(tok)) {
        const k = `${license}\t${v}`;
        const u = under.get(k) ?? under.set(k, { license, v, names: new Set(), sources: new Set() }).get(k);
        u.names.add(one(w, 'name')); for (const s of src(w)) u.sources.add(s);
      }
      for (const u of under.values()) add(u.license, u.v, kind, type, 1 + u.names.size, u.sources);
    } else { // the facts about the topic are the nodes (the steps of a method, the planets)
      const about = new Map();
      for (const { w, license } of facts) if (w.attrs[key]) for (const v of (w.attrs[topic] ?? []).map(tok)) {
        const k = `${license}\t${v}`;
        const a = about.get(k) ?? about.set(k, { license, v, n: 0, sources: new Set() }).get(k);
        a.n++; for (const s of src(w)) a.sources.add(s);
      }
      for (const a of about.values()) add(a.license, a.v, kind, type, a.n, a.sources);
    }
  }
  return topics;
}

const slug = (l) => l.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function topicShards(topics = diagramTopics()) {
  const files = {};
  for (const license of [...topics.keys()].sort(byText)) {
    const m = topics.get(license);
    const names = [...m.keys()].sort(byText);
    const parts = names.length > MAX ? Object.entries(names.reduce((g, n) => { const c = /^[a-l]/i.test(n) ? 'a-l' : 'm-z'; (g[c] ??= []).push(n); return g; }, {})) : [[null, names]];
    for (const [part, list] of parts) {
      const id = `${PREFIX}${slug(license)}${part ? `-${part}` : ''}`;
      const sources = [...new Set(list.flatMap((n) => [...m.get(n).sources]))].sort(byText);
      const lines = list.map((n) => { const t = m.get(n); return wire(`k.diagrams.topic.${slug(license).replace(/-/g, '_')}.${seg(n)}`, 'k.diagrams.topic', [['name', n], ...[...t.kinds].sort(byText).map((k) => ['kind', k]), ...[...t.from].sort(byText).map((f) => ['from', f]), ['nodes', t.nodes]], [...t.sources].sort(byText)[0]) + [...t.sources].sort(byText).slice(1).map((s) => ` core.source=${JSON.stringify(s)}`).join(''); });
      files[`${id}.sop`] = `${header({ id: `k.diagrams/shards/${id}`, about: `${list.length} topics a diagram can be drawn about, read from the fills of k.diagrams over facts under ${license} (block 07:30 item 9): each with the kinds of diagram it fills, the types it comes from and the nodes of its largest diagram. Derived; rebuilt by the build.`, sources: sources.map((s) => `${s} (the facts the topics are read from)`), license, script: 'tools/diagram-topics.mjs' })}\n${lines.join('\n')}\n`;
    }
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = topicShards();
  for (const old of readdirSync(DIR)) if (old.startsWith(PREFIX) && old.endsWith('.sop')) rmSync(join(DIR, old));
  for (const [n, t] of Object.entries(files)) writeFileSync(join(DIR, n), t);
  for (const [n, t] of Object.entries(files)) console.log(n, t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes');
}
