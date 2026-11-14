// Stand-ins by the kinds of k.kinds (reviewer block 2026-11-15 03:20, item 4: drawable shapes for frequent catalog
// lemmas that have none: "a k.objects drawing where a source exists, else the nearest drawable through k.kinds
// parents, said as such"). For each common thing of tools/coverage.mjs that has no drawing at all (no object of its
// name, no word of an object, no stand-in), the first parent of the dimension `kind` in k.kinds that is the name of a
// k.objects object becomes a `k.objects.stand_in` (the type that says "drawn as the kind": a host says "a stork, drawn
// as a bird"). Only a parent one step up, and only where the edge is about the sense kept: an edge a world states of
// the thing by name (k.attributes kind, k.animals, k.food, k.wearables: the catalog's own kind facts), or an edge of
// k.words whose sense has the gloss of the sense kept (so "hammock" is not drawn as a hill, nor "viola" as a herb).
// Two steps crossed senses in every trial (tuba -> bass, the instrument -> bass, the fish), so they are not taken.
//   node tools/stand-ins-kinds.mjs    writes docs/worlds/k.objects/shards/stand-ins-kinds.sop (CC0: the hand facts)
//                                     and stand-ins-kinds-wordnet.sop (WordNet's edges, its licence)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, byText } from './import/lib.mjs';

export const SHARDS = ['stand-ins-kinds.sop', 'stand-ins-kinds-wordnet.sop'];
// A WordNet edge only for a sense of a drawable class (hammock, "a small natural hill", is noun.object: no stand-in),
// and not where the sense kept is not what a drawing means by the word (with the reason).
const DRAWABLE = new Set(['noun.artifact', 'noun.food', 'noun.animal', 'noun.plant']);
export const NOT_MEANT = { grill: 'the sense kept is the restaurant; a drawing of a grill means the grate, which the restaurant would not show' };
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
const lines = (world, skip = []) => readdirSync(join(WORLDS_DIR, world, 'shards')).filter((f) => f.endsWith('.sop') && !skip.includes(f)).sort()
  .flatMap((f) => readFileSync(join(WORLDS_DIR, world, 'shards', f), 'utf8').split('\n'));

export async function standIns() {
  const { run } = await import('./coverage.mjs');
  const objects = new Set(), drawn = new Set();
  for (const l of lines('k.objects', SHARDS)) {
    let m;
    if ((m = l.match(/^@\S+ k\.objects\.object name=("[^"]*"|\S+)/))) { objects.add(tok(m[1]).toLowerCase()); drawn.add(tok(m[1]).toLowerCase()); }
    else if ((m = l.match(/^@\S+ k\.objects\.stand_in name=("[^"]*"|\S+)/))) drawn.add(tok(m[1]).toLowerCase());
    else if (l.includes(' core.word ') && l.includes('of=k.objects.object.name')) for (const t of l.matchAll(/ text=("[^"]*"|\S+)/g)) drawn.add(tok(t[1]).toLowerCase());
  }
  // the glosses of the k.words senses, to tell an edge of the sense kept
  const gloss = new Map(), supersense = new Map();
  for (const l of lines('k.words')) {
    const m = l.match(/^@\S+ k\.words\.sense word=("[^"]*"|\S+) pos=noun n=(\d+) (?:supersense=(\S+) )?(?:\S+ )*?gloss=("(?:[^"\\]|\\.)*")/);
    if (m) { gloss.set(`${tok(m[1])} noun ${m[2]}`, JSON.parse(m[4])); supersense.set(`${tok(m[1])} noun ${m[2]}`, m[3]); }
  }
  const up = new Map();
  for (const l of lines('k.kinds')) {
    const m = l.match(/^@\S+ k\.kinds\.parent name=("[^"]*"|\S+) is_a=("[^"]*"|\S+) dimension=kind from=(\S+)(?: key=\S+)?(?: value=("[^"]*"|\S+))?.* core\.source="([^"]+)"/);
    if (m) { const n = tok(m[1]).toLowerCase(); (up.get(n) ?? up.set(n, []).get(n)).push({ parent: tok(m[2]), from: m[3], value: m[4] && tok(m[4]), source: m[5] }); }
  }
  const out = [], none = [];
  for (const e of run().list.filter((x) => !x.drawing && !x.link && !drawn.has(x.word.toLowerCase()))) {
    const edges = (up.get(e.word.toLowerCase()) ?? []).filter((x) => objects.has(x.parent.toLowerCase()));
    // an edge of k.words counts when it was read from the thing's own sense (its word is the thing) and that sense has
    // the gloss of the sense kept (the definition part: coverage cuts the gloss at the first ";")
    const def = (g) => (g ?? '').split(';')[0].trim();
    const ok = edges.find((x) => x.from !== 'k.words.sense')
      ?? edges.find((x) => x.from === 'k.words.sense' && x.value?.startsWith(`${e.word} noun `) && def(gloss.get(x.value)) === def(e.gloss)
        && DRAWABLE.has(supersense.get(x.value)) && !NOT_MEANT[e.word]);
    if (ok) out.push({ word: e.word, drawing: ok.parent, from: ok.from, source: ok.source, rank: e.rank, gloss: e.gloss });
    else none.push(e.word);
  }
  return { out: out.sort((a, b) => byText(a.word, b.word)), none };
}

export function standInShards({ out }) {
  const hand = out.filter((s) => s.source !== 'wordnet 3.1'), wn = out.filter((s) => s.source === 'wordnet 3.1');
  const body = (list) => list.map((s) => `# ${s.word} (${s.gloss}): a kind of ${s.drawing}, by ${s.from}\n${wire(`k.objects.kinds.${seg(s.word)}`, 'k.objects.stand_in', [['name', s.word], ['drawing', s.drawing]], s.source)}`).join('\n');
  const about = (n, by) => `${n} common things with no drawing at all, drawn by the drawing of their kind (a stand-in: the host says "drawn as a ..."), the parent one step up in k.kinds ${by}. Written by tools/stand-ins-kinds.mjs.`;
  return {
    [SHARDS[0]]: `${header({ id: 'k.objects/shards/stand-ins-kinds', about: about(hand.length, 'that a world of the catalog states by name (k.attributes kind, k.animals, k.food, k.wearables)'), sources: ['hand-core 1 (the kind facts of the hand-written worlds, read through k.kinds.parent)'], license: 'CC0-1.0', script: 'tools/stand-ins-kinds.mjs' })}\n${body(hand)}\n`,
    [SHARDS[1]]: `${header({ id: 'k.objects/shards/stand-ins-kinds-wordnet', about: about(wn.length, 'from WordNet, where the edge is about the sense kept (the same gloss)'), sources: ['wordnet 3.1 (Princeton WordNet 3.1, the hypernyms read through k.kinds.parent)'], license: 'WordNet-3.0', script: 'tools/stand-ins-kinds.mjs' })}\n${body(wn)}\n`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await standIns();
  for (const [f, t] of Object.entries(standInShards(r))) writeFileSync(join(WORLDS_DIR, 'k.objects', 'shards', f), t);
  console.log(`stand-ins: ${r.out.length} (${r.out.map((s) => `${s.word}->${s.drawing}`).join(', ')}); common things still with no drawing: ${r.none.length}`);
}
