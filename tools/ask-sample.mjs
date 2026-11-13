// Round 9 item 8: how many of a seeded sample of 100 natural questions of a domain find a fact by lookup.
//   node tools/ask-sample.mjs [domain ...] [--root <docs/worlds of another checkout>] [--misses]
// A domain: a list of things (entities) and question templates; a question is one thing in one template. Its
// lookup is one sopworld query, or several of which one must be supported (can a penguin fly: `can=fly` or
// `cannot=fly`). A thing is first looked up by its name, then by the name a core.word of the world gives it
// (hippo -> hippopotamus). The sample: all questions of the domain, shuffled with a fixed seed, the first 100.
// The lists of things are not read from the facts they ask about: tools/ask-domains.mjs says where each comes from.
import { scanWorlds, fullWorld, WORLDS_DIR } from './lib/worlds.mjs';
import { DOMAINS } from './ask-domains.mjs';

const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
function rng(seed) { let s = seed; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seedOf = (text) => [...text].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) | 0, 9);

// text (lower case) -> the names it means, from the core.word facts `of=<type>.name` of a world's shards and schema.
function wordsOf(world) {
  const words = new Map();
  for (const text of [world.schemaText, ...world.shards.map((s) => s.text)]) for (const line of text.split('\n')) {
    if (!/^@\S+ core\.word /.test(line) || !/ of=\S+\.name\b/.test(line)) continue;
    const means = / means=("[^"]*"|\S+)/.exec(line)?.[1];
    if (!means) continue;
    for (const m of line.matchAll(/ text=("[^"]*"|\S+)/g)) { const k = tok(m[1]).toLowerCase(); words.set(k, [...(words.get(k) ?? []), tok(means)]); }
  }
  return words;
}

export function sample(domain, { root = WORLDS_DIR, n = 100 } = {}) {
  const d = DOMAINS[domain];
  const worlds = scanWorlds(root);
  const all = [];
  // A thing is a name, or [name, kind]: then only the templates of that kind apply (d.templates is then an object).
  for (const t of d.things()) {
    const [e, kind] = Array.isArray(t) ? t : [t, null];
    for (const [ask, queries] of (kind ? d.templates[kind] : d.templates)) all.push({ thing: e, ask: ask.replace('{x}', e), queries });
  }
  const rnd = rng(seedOf(domain));
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const picked = all.slice(0, n);
  const loaded = new Map(), words = new Map();
  const worldOf = (id) => { if (!loaded.has(id)) { loaded.set(id, worlds.some((w) => w.id === id) ? fullWorld(id, worlds) : null); words.set(id, worlds.some((w) => w.id === id) ? wordsOf(worlds.find((w) => w.id === id)) : new Map()); } return loaded.get(id); };
  const val = (v) => (/^[^\s"\\$?@#][^\s"\\]*$/.test(v) ? v : JSON.stringify(v));
  const results = picked.map((q) => {
    const found = q.queries(q.thing).some((query) => {
      const id = query.type.split('.').slice(0, 2).join('.');
      const w = worldOf(id);
      if (!w) return false;
      const names = [q.thing, ...(words.get(id).get(q.thing.toLowerCase()) ?? [])];
      return names.some((name) => {
        try {
          const where = Object.fromEntries(Object.entries(query.where).map(([k, v]) => [k, v === '{x}' ? val(name) : v]));
          const a = w.query({ ...query, where });
          return a.status === 'supported' && (query.mode === 'count' ? Number(a.value) > 0 : true);
        } catch { return false; }
      });
    });
    return { ask: q.ask, found };
  });
  return { domain, asked: results.length, found: results.filter((r) => r.found).length, misses: results.filter((r) => !r.found).map((r) => r.ask) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--root');
  const root = at >= 0 ? args[at + 1] : WORLDS_DIR;
  const names = args.filter((a, i) => !a.startsWith('--') && i !== at + 1 || (at < 0 && !a.startsWith('--')));
  for (const domain of (names.length ? names : Object.keys(DOMAINS))) {
    const r = sample(domain, { root });
    console.log(`${domain}: ${r.found} of ${r.asked} questions find a fact`);
    if (args.includes('--misses')) for (const m of r.misses) console.log(`  no fact: ${m}`);
  }
}
