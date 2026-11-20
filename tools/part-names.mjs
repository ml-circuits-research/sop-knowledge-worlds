// k.parts.name: one fact for each word that names a part of a drawn thing, so a reader binds "the roof", "the rays",
// "her hair" to one meaning whatever the whole is (k.parts.called holds the same word once for every whole that has
// it). The names are the parts of k.parts.called with their other words (also=) as core.word facts; the parts a face
// or a whole drawn person has (k.faces, styles plain and figure) are named too, with the slots they draw (slot=).
//   node tools/part-names.mjs        writes docs/worlds/k.parts/shards/names.sop
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg } from './import/lib.mjs';
import { parse } from './sopworld/sopworld.mjs';

const SRC = 'hand-core 1';
const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
// The k.faces slots each part word draws on a face or a whole person (style plain and figure), and the other words of
// the parts that k.parts.called does not list.
export const SLOTS = {
  hair: ['hair_front', 'hair_back'], eyes: ['eyes'], smile: ['mouth'], head: ['head'], nose: ['nose'], ears: ['ears'], eyebrows: ['eyebrows'], cheeks: ['cheeks'],
  beard: ['beard'], moustache: ['moustache'], glasses: ['glasses'], hat: ['hat'], earrings: ['earrings'], neck: ['neck'], shirt: ['top'], pants: ['bottom'], shoes: ['shoes'],
  jacket: ['coat'],
};
export const EXTRA = {
  nose: [], ears: ['ear'], eyebrows: ['eyebrow', 'brows'], beard: [], moustache: ['mustache'], glasses: ['spectacles', 'sunglasses'], hat: ['cap', 'hats'],
  earrings: ['earring'], neck: [], jacket: ['coat', 'jackets', 'coats'],
};

export function partNames() {
  const called = parse(readFileSync(join(WORLDS_DIR, 'k.parts', 'shards', 'psys2.sop'), 'utf8')).filter((w) => w.type === 'k.parts.called');
  const names = new Map();
  for (const w of called) {
    const part = tok(w.attrs.part[0]), entry = names.get(part) ?? { of: new Set(), also: new Set() };
    entry.of.add(tok(w.attrs.of[0]));
    for (const a of w.attrs.also ?? []) entry.also.add(tok(a));
    names.set(part, entry);
  }
  for (const [part, also] of Object.entries(EXTRA)) { const entry = names.get(part) ?? { of: new Set(), also: new Set() }; for (const a of also) entry.also.add(a); names.set(part, entry); }
  // A word another part names as itself is not also an other word of this one.
  for (const entry of names.values()) for (const a of [...entry.also]) if (names.has(a)) entry.also.delete(a);
  const sorted = [...names.keys()].sort();
  const facts = sorted.map((name) => wire(`k.parts.name.${seg(name)}`, 'k.parts.name', [['name', name], ...[...names.get(name).of].sort().map((o) => ['of', o]), ...(SLOTS[name] ?? []).map((s) => ['slot', s])], SRC));
  const words = sorted.filter((name) => names.get(name).also.size).map((name) => wire(`k.parts.word.name.${seg(name)}`, 'core.word', [...[...names.get(name).also].sort().map((t) => ['text', t]), ['means', name], ['of', 'k.parts.name.name']], SRC));
  return `${header({ id: 'k.parts/shards/names', about: `${sorted.length} words that name a part of a drawn thing (one fact each, the wholes that have it, the k.faces slots it draws), and their other words.`, sources: ['hand-core 1 (from k.parts.called and the slots of k.faces; tools/part-names.mjs)'], license: 'CC0-1.0', script: 'tools/part-names.mjs' })}\n${facts.join('\n')}\n\n${words.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(join(WORLDS_DIR, 'k.parts', 'shards', 'names.sop'), partNames());
  console.log('names.sop written');
}
