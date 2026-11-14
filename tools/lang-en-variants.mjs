// w.lang.en: which frames are variants that a general alternation will cover (block "21:05" item 2, ABSTRACTION
// ROUND): a desire or politeness wrapper ("I want ...", "could you ...", "can you tell me ..."), a passive ("I want
// France highlighted"), a dative ("give me a house"), a verb ellipsis (no verb: "House huge.", "Red."). The library applies these alternations to every canonical
// frame once (its 21:00 block, item 2); the frames are marked, not deleted, until its curve says they can go.
//   node tools/lang-en-variants.mjs     writes docs/worlds/w.lang.en/shards/variants.sop
// One fact per frame and alternation (a family of the shard alternations): `w.lang.en.variant frame= alternation=
// canonical=`, by rule from the frame's
// parts (no frame is named by hand): `canonical` names the frames of the same act and mode that carry none of these
// alternations and take every role the variant takes (what is left when the alternation is undone), where there are.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';
import { wire, header, seg, writeShards, text } from './import/lib.mjs';

const SRC = 'hand-core 1';
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const DIR = join(WORLDS_DIR, 'w.lang.en', 'shards');
// The alternations a frame can be a variant of, by the names of the third worker's w.lang.en.alternation_family facts
// (shard alternations: the rules that bring a variant back to its canonical form). The question with its wh-word in
// front is the canonical form there (wh in situ is the variant), so a frame with a fronted wh-word is no variant.
// "verb ellipsis" (the verb left out: "House huge.") is a family of its own, under context, written here.
export const ALTERNATIONS = ['request wrapper', 'passive', 'dative shift', 'verb ellipsis'];
export const OWN_FAMILIES = [{ name: 'verb ellipsis', parent: 'context', about: 'the verb left out: the roles alone (House huge., Legend off., Red.); the act is the frame\'s' }];
// Wrappers: words of desire and politeness around a request or a question, and the phrase groups made of them.
const WRAPPERS = new Set(['i want', 'i wanna', 'i would like', "i'd like", 'id like', 'i would love', 'i prefer', 'i like', 'i need', 'i want to know', 'i wanna know', 'i need to know',
  'i would like to know', 'can you', 'could you', 'would you', 'will you', 'can u', 'can you tell me', 'can u tell me', 'can you say', 'could you tell me', 'do you know', 'tell me',
  'show me', 'let me know', 'let me see', 'please', 'pls', 'plz', 'kindly', 'how about', 'give me']);
// Not wrappers: "I don't want X" is a removal (the negation changes the act), not a request for X in other words.
// a word or phrase of desire or politeness: a listed one, or "I / we ... want / like / love / need / prefer" and
// "can / could / would / may I / you / we ..." (can I have, could we get)
const isWrapper = (w) => WRAPPERS.has(w) || /^(i|we)( would| do| really)? (want|wanna|like|love|need|prefer)\b/.test(w) || /^(can|could|would|will|may) (i|you|u|we)\b/.test(w) || /^(i'd|id|we'd) (like|love)\b/.test(w) || /^(let's|lets) (have|see|get)\b/.test(w);
// a part is a wrapper when at least half of its words are (the others are plain verbs of the same request: get, have)
const wrapperPart = (ws) => ws.length > 0 && ws.filter(isWrapper).length * 2 >= ws.length;
const WRAPPER_PHRASES = new Set(['shape.want', 'lead.polite']);
const WH = new Set(['what', 'which', 'whats', "what's", 'where', 'who', 'how', 'how many', 'how much', 'when']);
const AUX = new Set(['is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'would', 'will', 'should', 'has', 'have', 's', 'can i', 'could i', 'can you', 'did i', 'have i']);
const OBLIQUE = new Set(['me', 'us', 'him', 'her', 'them']);
// past participles; the naming ones (a guest called Ann) are reduced relatives, not passives
const isParticiple = (w) => /^[a-z]+(ed|en)$/.test(w) && !['red', 'green', 'then', 'when', 'often', 'seven', 'ten', 'eleven', 'garden', 'golden', 'wooden', 'open', 'even', 'hidden', 'called', 'named', 'titled', 'labelled', 'labeled'].includes(w);

export function readFrames(dir = DIR) {
  const wires = readdirSync(dir).filter((f) => f.endsWith('.sop') && f !== 'variants.sop').sort().flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')));
  const parts = new Map();
  for (const p of wires.filter((w) => w.type === 'w.lang.en.part')) {
    const f = tok(p.attrs.frame[0]);
    if (!parts.has(f)) parts.set(f, []);
    parts.get(f).push({ at: Number(p.attrs.at[0]), is: p.attrs.is[0], words: (p.attrs.word ?? []).map((w) => String(tok(w)).toLowerCase()), phrase: (p.attrs.phrase ?? []).map(tok), role: tok(p.attrs.role?.[0]), takes: p.attrs.takes?.[0], act: tok(p.attrs.act?.[0]), optional: p.attrs.optional?.[0] === 'yes' });
  }
  return wires.filter((w) => w.type === 'w.lang.en.frame').map((f) => {
    const name = tok(f.attrs.name[0]);
    return { name, act: tok(f.attrs.act[0]), mode: tok(f.attrs.mode?.[0]) ?? null, roles: new Set((f.attrs.role ?? []).map(tok)), parts: (parts.get(name) ?? []).sort((a, b) => a.at - b.at) };
  }).sort((a, b) => (a.name < b.name ? -1 : 1));
}

// The alternations a frame carries, by its required parts (an optional part does not make a variant: the frame
// with it is the canonical one with an optional extra).
export function alternationsOf(frame) {
  const req = frame.parts.filter((p) => !p.optional && p.is !== 'det');
  const out = new Set();
  const first = req[0];
  const wordsOf = (p) => p.words;
  // a wrapper: the first required part is all desire / politeness words, or a wrapper phrase group
  if (first && (((first.is === 'word' || first.is === 'lead') && wrapperPart(wordsOf(first))) || (first.is === 'phrase' && first.phrase.some((x) => WRAPPER_PHRASES.has(x))))) out.add('request wrapper');
  // a wrapper at the end: "... please" required
  const last = req.at(-1);
  if (last && last !== first && last.is === 'word' && last.words.length && last.words.every((w) => ['please', 'pls', 'plz'].includes(w))) out.add('request wrapper');
  // a passive: a role followed by a required part of past participles only (highlighted, marked, coloured)
  for (let i = 0; i + 1 < req.length; i++) if (req[i].is === 'role' && req[i + 1].is === 'word' && req[i + 1].words.length && req[i + 1].words.every(isParticiple)) { out.add('passive'); break; }
  // a dative: a verb (or a wrapper "give me") followed by a required oblique pronoun, then a role
  for (let i = 0; i + 1 < req.length; i++) {
    const a = req[i], b = req[i + 1], c = req[i + 2];
    if ((a.is === 'verb' || (a.is === 'word' && a.words.some((w) => ['give', 'get', 'make', 'draw', 'show', 'send', 'bring'].includes(w)))) && b.is === 'word' && b.words.length && b.words.every((w) => OBLIQUE.has(w)) && c?.is === 'role') { out.add('dative shift'); break; }
  }
  // an ellipsis: no verb, no word or phrase that carries the act; only roles (and a wrapper or a determiner)
  // (a role followed by a determiner acts as a verb: "Bold the second paragraph"; a frame of one role that takes the
  // rest of the message is a catch-all, not an ellipsis)
  const verbLike = req.some((p, i) => p.is === 'role' && frame.parts[frame.parts.indexOf(p) + 1]?.is === 'det');
  const catchAll = req.length === 1 && req[0].takes === 'rest';
  const hasVerb = frame.parts.some((p) => p.is === 'verb' || p.words.some((w) => w.startsWith('v.')));
  if (req.length && !verbLike && !catchAll && !hasVerb && req.every((p) => p.is === 'role' || p.is === 'lexicon' || (p.is === 'word' && p.words.every((w) => ['please', 'pls', 'plz', 'instead', 'again', 'now', 'time', 'mode'].includes(w))))) out.add('verb ellipsis');
  return ALTERNATIONS.filter((a) => out.has(a));
}

export function variantRows(frames = readFrames()) {
  const alts = new Map(frames.map((f) => [f.name, alternationsOf(f)]));
  const rows = [];
  for (const f of frames) for (const a of alts.get(f.name)) {
    const canonical = frames.filter((g) => g.name !== f.name && g.act === f.act && g.mode === f.mode && !alts.get(g.name).length && [...f.roles].every((r) => g.roles.has(r))).map((g) => g.name);
    rows.push({ frame: f.name, alternation: a, canonical });
  }
  return rows;
}

export function variantsShard(rows = variantRows(), frames = readFrames()) {
  const lines = OWN_FAMILIES.map((f) => wire(`w.lang.en.alternation_family.${seg(f.name)}`, 'w.lang.en.alternation_family', [['name', f.name], ['about', text(f.about)], ['parent', f.parent]], SRC));
  lines.push(...rows.map((r) => wire(`w.lang.en.variant.${seg(r.frame)}.${seg(r.alternation)}`, 'w.lang.en.variant', [['frame', r.frame], ['alternation', r.alternation], ...r.canonical.map((c) => ['canonical', c])], SRC)));
  const by = Object.fromEntries(ALTERNATIONS.map((a) => [a, rows.filter((r) => r.alternation === a).length]));
  const nFrames = new Set(rows.map((r) => r.frame)).size;
  return `${header({ id: 'w.lang.en/shards/variants', about: `the family verb ellipsis, and the frames that are variants a general alternation will cover, marked (not deleted) for the library's alternations: ${nFrames} of ${frames.length} frames (${ALTERNATIONS.map((a) => `${a} ${by[a]}`).join(', ')}), each with the canonical frames of the same act and mode where there are; by rule from the frames' parts.`,
    sources: ['hand-core 1 (computed in this repository from the frames of w.lang.en: tools/lang-en-variants.mjs)'], license: 'CC0-1.0', script: 'tools/lang-en-variants.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const frames = readFrames(), rows = variantRows(frames), t = variantsShard(rows, frames);
  writeShards(DIR, { 'variants.sop': t }, 'variants');
  console.log(`variants.sop: ${rows.length} variants over ${new Set(rows.map((r) => r.frame)).size} of ${frames.length} frames, ${Buffer.byteLength(t)} bytes; with a canonical frame: ${new Set(rows.filter((r) => r.canonical.length).map((r) => r.frame)).size}`);
  for (const a of ALTERNATIONS) console.log(`  ${a}: ${rows.filter((r) => r.alternation === a).map((r) => r.frame).slice(0, 8).join(', ')}`);
}
