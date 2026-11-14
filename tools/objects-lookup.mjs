// The drawing a host takes for a word, in the order k.objects/WORLD.md gives (Q67 b): the object of that name, else
// an object the word is a core.word of (couch: sofa), else a stand-in of that name (a stork, drawn as a bird), and only
// then an object the word is a keyword of (k.objects.keyword: "gobble" finds the turkey). A keyword is a search word
// of an image library, never a name: "ship" is a keyword of the anchor and also the name of the ship's own drawing.
// Plain data in, plain data out: tests and hosts give the parsed facts of k.objects (factsOf, or their own reader).
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const low = (t) => String(tok(t)).toLowerCase();
const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(v)) m.get(k).push(v); };

export const LOOKUP_TYPES = ['k.objects.object', 'core.word', 'k.objects.stand_in', 'k.objects.keyword'];

// facts: parsed wires of the types above, in shard order. Returns the four maps (lower-case text -> names).
export function drawingIndex(facts) {
  const ix = { objects: new Map(), words: new Map(), standIns: new Map(), keywords: new Map() };
  for (const w of facts) {
    if (w.type === 'k.objects.object') ix.objects.set(low(w.attrs.name[0]), tok(w.attrs.name[0]));
    else if (w.type === 'core.word' && w.attrs.of?.map(tok).includes('k.objects.object.name')) for (const t of w.attrs.text ?? []) push(ix.words, low(t), tok(w.attrs.means[0]));
    else if (w.type === 'k.objects.stand_in') push(ix.standIns, low(w.attrs.name[0]), tok(w.attrs.drawing[0]));
    else if (w.type === 'k.objects.keyword') for (const t of w.attrs.text ?? []) push(ix.keywords, low(t), tok(w.attrs.of[0]));
  }
  return ix;
}

// The drawing for one word: { drawing, via: 'name' | 'word' | 'stand_in' | 'keyword', others } or null. `others` are
// the further objects of the same step (a keyword names many: "bird" is a keyword of the turkey and the chicken).
export function drawingFor(word, ix) {
  const k = low(word);
  if (ix.objects.has(k)) return { drawing: ix.objects.get(k), via: 'name', others: [] };
  for (const [via, m] of [['word', ix.words], ['stand_in', ix.standIns], ['keyword', ix.keywords]]) {
    const all = m.get(k);
    if (all?.length) return { drawing: all[0], via, others: all.slice(1) };
  }
  return null;
}
