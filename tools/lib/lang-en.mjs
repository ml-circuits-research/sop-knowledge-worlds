// Reading w.lang.en the way a host does, for tests and tools: the morphology rules as facts, and the options the
// library's std.grammar needs (which category is which type), built from the world's own `w.lang.en.cat` facts.
// The algorithms are the library's (std.grammar) or the host's; these are the smallest reference readings.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './worlds.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => vals(w, k)[0];
const CONSONANT = /[bcdfghjklmnpqrstvwxz]$/;

// The singular or plural of a word by the facts { inflect, irregular, exceptions } (wires): irregulars first, then
// the first rule of the set by order that matches (the semantics written in schema.sop).
export function inflect({ inflect: rules, irregular = [], exceptions = [] }, word, op, set) {
  const w = String(word).toLowerCase();
  // a read-only (classical) plural is read, but a common pair of the same plural is read first (axes: axe before ax)
  const ordered = [...irregular.filter((x) => one(x, 'read_only') === 'yes'), ...irregular.filter((x) => one(x, 'read_only') !== 'yes')];
  const irr = new Map(ordered.filter((x) => op === 'singular' || one(x, 'read_only') !== 'yes').map((x) => (op === 'singular' ? [one(x, 'plural'), one(x, 'singular')] : [one(x, 'singular'), one(x, 'plural')])));
  if (irr.has(w)) return irr.get(w);
  // the singular of a listed pair is a singular: "gas" (gas, gases) is not read as the plural of "ga" (KR2: catalog-plurals)
  if (op === 'singular' && irregular.some((x) => one(x, 'singular') === w)) return w;
  const exc = (kind, key) => exceptions.filter((x) => one(x, 'kind') === kind).map((x) => one(x, key));
  const mine = rules.filter((r) => one(r, 'op') === op && (op === 'plural' || one(r, 'set') === set)).sort((a, b) => Number(one(a, 'order')) - Number(one(b, 'order')));
  for (const r of mine) {
    if (one(r, 'min_length') && w.length < Number(one(r, 'min_length'))) continue;
    const sfx = vals(r, 'suffix');
    let hit = sfx.length ? sfx.find((s) => w.endsWith(s) && (one(r, 'after') !== 'consonant' || CONSONANT.test(w.slice(0, -s.length)))) : '';
    if (one(r, 'exception') === 'us-plural') hit = exc('us-plural-word', 'word').includes(w) || exc('us-plural-suffix', 'stem').some((s) => w.endsWith(`${s}es`)) ? 'es' : null;
    if (hit === undefined || hit === null) continue;
    if (vals(r, 'unless_suffix').some((s) => w.endsWith(s))) continue;
    if (one(r, 'unless_is_singular') === 'yes' && w.endsWith('is') && !exc('is-plural', 'stem').some((s) => w.endsWith(`${s}s`))) continue;
    const base = one(r, 'replace') != null && hit ? w.slice(0, w.length - hit.length) : w.slice(0, w.length - Number(one(r, 'drop') ?? 0));
    return base + (one(r, 'replace') ?? one(r, 'add') ?? '');
  }
  return w;
}

// The options of the library's parseText for a world that holds w.lang.en: rules, words, closed classes, digits.
export function hostOptions(world) {
  const classes = {};
  let digits;
  for (const c of world.ofType('w.lang.en.cat')) {
    const name = c.attrs.name[0], type = c.attrs.type?.[0];
    if (c.attrs.digits) digits = name;
    if (type && type !== 'w.lang.en.word') classes[name] = type;
  }
  return { types: { rule: 'w.lang.en.rule', word: 'w.lang.en.word' }, classes, digits };
}

// The open classes for the words of one sentence, from k.words (found through vocab.json, as a host finds a
// shard): a word that is no closed-class word gets N for a noun sense and MOD for an adjective sense of its singular.
const shardCache = new Map();
const fromCache = new Map();
export function hostLexicon(world, sentence, worlds) {
  const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
  const closed = new Set();
  for (const t of Object.values(hostOptions(world).classes)) for (const w of world.ofType(t)) for (const x of w.attrs.text ?? []) closed.add(tok(x).toLowerCase());
  for (const w of world.ofType('w.lang.en.word')) closed.add(tok(w.attrs.text[0]).toLowerCase());
  const facts = { inflect: world.ofType('w.lang.en.inflect'), irregular: world.ofType('w.lang.en.irregular'), exceptions: world.ofType('w.lang.en.noun.exception') };
  const kwords = worlds.find((w) => w.id === 'k.words');
  const lex = {};
  // categories whose words are the values of a key of another world's facts (from_type, from_key): a join by value
  const low = String(sentence).toLowerCase();
  for (const c of world.ofType('w.lang.en.cat').filter((x) => x.attrs.from_type)) {
    const type = c.attrs.from_type[0], key = c.attrs.from_key[0], name = c.attrs.name[0];
    const id = `${type} ${key}`;
    if (!fromCache.has(id)) {
      const owner = worlds.filter((w) => type.startsWith(`${w.id}.`)).sort((a, b) => b.id.length - a.id.length)[0];
      const re = new RegExp(` ${type.replace(/\./g, '\\.')} (?:[^\\n]* )?${key}=("[^"]*"|\\S+)`, 'g');
      fromCache.set(id, new Set(owner.shards.flatMap((s) => [...s.text.matchAll(re)].map((m) => tok(m[1]).toLowerCase()))));
    }
    for (const v of fromCache.get(id)) if (new RegExp(`(^|[^a-z])${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`).test(low)) lex[v] = [...(lex[v] ?? []), { cat: name, lemma: v }];
  }
  for (const word of String(sentence).toLowerCase().match(/[a-z]+/g) ?? []) {
    if (closed.has(word)) continue;
    for (const lemma of [...new Set([inflect(facts, word, 'singular', 'lemma'), word])]) {
      if (lex[word]?.some((e) => e.cat === 'N' || e.cat === 'MOD')) break; // a word of a category from another world also keeps its k.words reading
      for (const id of (vocab[lemma] ?? []).filter((s) => s.startsWith('k.words/'))) {
        if (!shardCache.has(id)) shardCache.set(id, kwords.shards.find((s) => s.id === id).text);
        const text = shardCache.get(id);
        const pos = new Set([...text.matchAll(new RegExp(`k\\.words\\.sense word=${lemma} pos=(\\w+)`, 'g'))].map((m) => m[1]));
        const es = [...(pos.has('noun') ? [{ cat: 'N', lemma }] : []), ...(pos.has('adjective') && lemma === word ? [{ cat: 'MOD', lemma }] : [])];
        if (es.length) lex[word] = [...(lex[word] ?? []), ...es].filter((e, i, a) => a.findIndex((x) => x.cat === e.cat) === i);
      }
    }
  }
  // A word with an adjective sense right before a word with a noun sense is its modifier, not the first noun of a
  // compound ("red house": red is also a noun, the colour); a noun with no adjective sense still compounds ("apple pie").
  const order = String(sentence).toLowerCase().match(/[a-z]+/g) ?? [];
  for (let i = 0; i + 1 < order.length; i++) {
    const w = order[i], next = lex[order[i + 1]] ?? [];
    if (lex[w]?.some((e) => e.cat === 'MOD') && lex[w].some((e) => e.cat === 'N') && next.some((e) => e.cat === 'N')) lex[w] = lex[w].filter((e) => e.cat !== 'N');
  }
  return lex;
}

// ---- reading a sentence by the argument frames, and realising a template (block 17:05: act generation templates) ----
// The smallest reference reading of `w.lang.en.frame` / `w.lang.en.part` that a host does (PSys2 reads them in its own
// acts reader): every frame whose `needs` the world meets is matched against the words; a part is a lead, a
// determiner, a verb of the act (k.actions), a word or phrase, a lexicon word, or a role capture (words, rest, a
// number, a preposition, a lexicon word). Of the ways a frame matches, the one with the most literal words wins (then the first: captures shortest first, fixed parts longest first); of the frames
// that match, the highest priority wins, then the one with more literal words, then the one with fewer captured
// words (the library's order, 0.58). The frame's roles go to the roles of k.actions by `w.lang.en.role_map`, its act
// by `w.lang.en.mode_map` (PSys2's group/apart is the act take apart).
// Words of a sentence: lower case, without sentence punctuation, apostrophes dropped inside a word, so that "don't" and
// the frames' "dont", "what's" and "whats" are one word (the hand-over writes both).
export const toks = (s) => String(s).toLowerCase().replace(/[.?!,;:]+/g, ' ').replace(/['\u2019]/g, '').trim().split(/\s+/).filter(Boolean);

// `kindPhrase(words) -> { head, mods }`: how the host reads the noun phrase of a kind ("red tables": head table, mods
// red), so that a modifier said inside the kind is the act's value (k.actions make.value).
// `openLexicons`: a lexicon of the host that is not given takes any one to three words (to check a frame's structure
// without a world's words); each reading lists the words its lexicon parts took (`lexicons`: [[name, words]]).
// A phrasal verb that k.actions marks `separable` is also read with its particle moved back next to the verb ("take
// the tables apart" is read as "take apart the tables" too): the particle shift is one alternation for every such verb.
export function frameReader(wires, actionWires, { lexicons = {}, needs = () => true, kindPhrase = null, openLexicons = false } = {}) {
  const of = (t) => wires.filter((w) => w.type === `w.lang.en.${t}`);
  const items = (list) => [...new Set(list)].map(toks).filter((x) => x.length).sort((a, b) => b.length - a.length);
  const phrases = new Map(of('phrase').map((p) => [one(p, 'name'), vals(p, 'item')]));
  const lexes = new Map([...of('lex').map((l) => [one(l, 'name'), vals(l, 'item')]), ...Object.entries(lexicons)]);
  const verbs = new Map();
  for (const v of actionWires.filter((w) => w.type === 'k.actions.verb')) (verbs.get(one(v, 'act')) ?? verbs.set(one(v, 'act'), []).get(one(v, 'act'))).push(one(v, 'text'));
  const separable = actionWires.filter((w) => w.type === 'k.actions.verb' && one(w, 'separable') === 'true').map((w) => toks(one(w, 'text'))).filter((x) => x.length === 2);
  const dets = items(of('det').map((d) => one(d, 'text')));
  const preps = items([...of('prep'), ...of('prep.time')].map((p) => one(p, 'text')));
  const numerals = new Set(of('numeral').map((n) => one(n, 'text')));
  // the thing a frame acts on is a noun phrase, which does not end in a preposition or a determiner ("put the house
  // next to the tree" is not the layout "tree" of a thing "house next to the")
  const npEnd = new Set([...preps.filter((x) => x.length === 1).map((x) => x[0]), ...dets.filter((x) => x.length === 1).map((x) => x[0])]);
  const maps = of('role_map'), modes = of('mode_map');
  const fixed = of('fixed');
  const partsOf = new Map();
  for (const p of of('part')) (partsOf.get(one(p, 'frame')) ?? partsOf.set(one(p, 'frame'), []).get(one(p, 'frame'))).push(p);
  for (const ps of partsOf.values()) ps.sort((a, b) => Number(one(a, 'at')) - Number(one(b, 'at')));
  // a lexicon word may be said in the plural ("tables" for the kind table)
  const lexItems = (name) => { const xs = lexes.get(name) ?? []; return items([...xs, ...xs.map((x) => `${x}s`)]); };
  const open = (name) => openLexicons && !lexes.has(name);
  const compiled = of('frame').filter((f) => needs(one(f, 'needs'))).map((f) => ({ f, parts: (partsOf.get(one(f, 'name')) ?? []).map((p) => {
    const is = one(p, 'is'), opt = one(p, 'optional') === 'yes';
    if (is === 'lead') return { kind: 'fixed', alts: items(phrases.get(one(p, 'phrase')) ?? []), opt: true, literal: true };
    if (is === 'det') return { kind: 'fixed', alts: dets, opt: true };
    if (is === 'verb') return { kind: 'fixed', alts: items(verbs.get(one(p, 'act')) ?? []), opt, literal: true };
    // a word part may also take the verbs of an act (`act`: "arrange, lay out or a verb of place")
    if (is === 'word' || is === 'phrase') return { kind: 'fixed', alts: items([...vals(p, 'word'), ...vals(p, 'phrase').flatMap((x) => phrases.get(x) ?? []), ...(one(p, 'act') ? verbs.get(one(p, 'act')) ?? [] : [])]), opt, literal: true };
    if (is === 'lexicon') return open(one(p, 'lexicon')) ? { kind: 'fixed', any: 3, opt, literal: true, lexicon: one(p, 'lexicon') } : { kind: 'fixed', alts: lexItems(one(p, 'lexicon')), opt, literal: true, lexicon: one(p, 'lexicon') };
    const takes = one(p, 'takes');
    const cap = { kind: 'role', role: one(p, 'role'), takes, opt, max: Number(one(p, 'max_words') ?? 1e9) };
    if (takes === 'prep') return { ...cap, alts: preps };
    if (takes === 'lexicon') return open(one(p, 'lexicon')) ? { ...cap, any: 3, literal: true, lexicon: one(p, 'lexicon') } : { ...cap, alts: lexItems(one(p, 'lexicon')), lexicon: one(p, 'lexicon') };
    return cap;
  }) }));

  // A capital single letter after a word of the lexicon name.letter.after (connect, from, to, between, and, box ...) or
  // after another such name is a name, not the article: "connect A to C", "the arrow from A to B" (block 07:45 item 3).
  // A name is taken only by a role's words: no fixed part (determiner, verb, word, lexicon) matches it, and a thing may
  // end in it ("the box A").
  const nameAfter = new Set((lexes.get('name.letter.after') ?? []).map((x) => x.toLowerCase()));
  const namesOf = (sentence) => {
    const raw = String(sentence).replace(/[.?!,;:]+/g, ' ').replace(/['\u2019]/g, '').trim().split(/\s+/).filter(Boolean);
    const names = [];
    raw.forEach((t, i) => { names[i] = i > 0 && /^[A-Z]$/.test(t) && t !== 'I' && (nameAfter.has(raw[i - 1].toLowerCase()) || names[i - 1]); });
    return names;
  };
  function match(parts, ws, names = []) { // the best match: most literal words, then the first in the search order; { roles, literal, captured }
    const roles = {}, lex = [];
    let literal = 0, best = null, steps = 0;
    const go = (i, j) => { // bounded: parts x words, each alternative once per position, at most 20,000 steps a frame
      if (++steps > 20000) return;
      if (i === parts.length) { if (j === ws.length && (!best || literal > best.literal)) best = { roles: { ...roles }, literal, lex: [...lex] }; return; }
      const p = parts[i];
      const alts = p.any ? Array.from({ length: Math.min(p.any, ws.length - j) }, (_, n) => ws.slice(j, j + n + 1)) : p.alts ?? null;
      if (alts) for (const a of alts) {
        if (a.every((t, k) => ws[j + k] === t && !names[j + k])) {
          if (p.kind === 'role') roles[p.role] = a.join(' ');
          if (p.literal) literal += a.length;
          if (p.lexicon) lex.push([p.lexicon, a.join(' ')]);
          go(i + 1, j + a.length);
          if (p.lexicon) lex.pop();
          if (p.literal) literal -= a.length;
          if (p.kind === 'role') delete roles[p.role];
        }
      }
      else if (p.takes === 'number') {
        if (ws[j] !== undefined && (/^\d+$/.test(ws[j]) || numerals.has(ws[j]))) { roles[p.role] = ws[j]; go(i + 1, j + 1); delete roles[p.role]; }
      } else { // words or rest: one word or more, shortest first (rest: to the end, at least one word; an empty rest is an optional part left out)
        const from = p.takes === 'rest' ? Math.max(1, ws.length - j) : 1;
        for (let n = from; n <= Math.min(p.max, ws.length - j); n++) { if (p.role === 'thing' && p.takes !== 'rest' && npEnd.has(ws[j + n - 1]) && !names[j + n - 1]) continue; roles[p.role] = ws.slice(j, j + n).join(' '); go(i + 1, j + n); }
        delete roles[p.role];
      }
      if (p.opt) go(i + 1, j);
    };
    go(0, 0);
    return best ? { ...best, captured: Object.values(best.roles).reduce((s, x) => s + toks(x).length, 0) } : null;
  }

  const actRoleOf = (name, act, role, takes) => {
    const m = maps.find((x) => one(x, 'frame') === name && one(x, 'role') === role)
      ?? maps.find((x) => !one(x, 'frame') && one(x, 'act') === act && one(x, 'role') === role && one(x, 'takes') === takes)
      ?? maps.find((x) => !one(x, 'frame') && !one(x, 'takes') && one(x, 'act') === act && one(x, 'role') === role);
    return m ? { role: one(m, 'act_role'), marker: one(m, 'marker') === 'yes' } : { role, marker: false };
  };

  /** Every frame that reads the sentence, best first: { frame, act, mode, priority, roles (frame roles), args (k.actions roles) }. */
  // the sentence and its particle-shifted forms: "take the tables apart" -> "take apart the tables"
  const forms = (ws, names) => { // [[words, names]]: the names move with their words
    const out = [[ws, names]];
    const move = (xs, i, k) => [...xs.slice(0, i + 1), xs[k], ...xs.slice(i + 1, k), ...xs.slice(k + 1)];
    for (const [verb, particle] of separable) for (let i = 0; i < ws.length; i++) {
      if (ws[i] !== verb) continue;
      const k = ws.indexOf(particle, i + 2);
      if (k > i + 1) out.push([move(ws, i, k), move(names, i, k)]);
    }
    return out;
  };
  return function read(sentence) {
    const out = [], variants = forms(toks(sentence), namesOf(sentence));
    for (const { f, parts } of compiled) {
      const m = variants.map(([ws, names]) => match(parts, ws, names)).filter(Boolean).sort((a, b) => b.literal - a.literal || a.captured - b.captured)[0];
      if (!m) continue;
      const name = one(f, 'name'), act = one(f, 'act'), mode = one(f, 'mode');
      const args = {};
      for (const x of fixed.filter((y) => one(y, 'frame') === name)) m.roles[one(x, 'role')] = one(x, 'value');
      for (const [r, text] of Object.entries(m.roles)) {
        const p = parts.find((x) => x.role === r);
        const k = actRoleOf(name, act, r, p?.takes);
        if (k.marker) args[`${k.role}.marker`] = text; else args[k.role] = args[k.role] ? `${args[k.role]} ${text}` : text;
      }
      if (kindPhrase && args.kind) { const np = kindPhrase(args.kind); if (np?.head) { args.kind = np.head; if (np.mods?.length) args.value = [...np.mods, ...(args.value ? [args.value] : [])].join(' '); } }
      const mm = modes.find((x) => one(x, 'act') === act && one(x, 'mode') === mode);
      out.push({ frame: name, act: mm ? one(mm, 'means') : act, mode, mood: one(f, 'mood'), priority: Number(one(f, 'priority')), literal: m.literal, captured: m.captured, roles: m.roles, args, lexicons: m.lex });
    }
    return out.sort((a, b) => b.priority - a.priority || b.literal - a.literal || a.captured - b.captured);
  };
}

// The article before a word: `a` or `an` by the sound the word begins with (`w.lang.en.det before=`), the spelling's
// first letter unless a `w.lang.en.onset` fact says otherwise for the longest beginning it names (an hour, a unicorn).
export function articleFor(wires, word) {
  const w = String(word).toLowerCase();
  const onset = wires.filter((x) => x.type === 'w.lang.en.onset' && w.startsWith(one(x, 'begins'))).sort((a, b) => one(b, 'begins').length - one(a, 'begins').length)[0];
  const sound = onset ? one(onset, 'sound') : /^[aeiou]/.test(w) ? 'vowel' : 'consonant';
  return one(wires.find((x) => x.type === 'w.lang.en.det' && one(x, 'before') === sound), 'text');
}

// A template filled (the library's notation, std.morph `realise`): `{role}` the filler as given, `{role:num=pl}` its
// plural by the morphology rules of w.lang.en; the article `a` takes its form from the next word. The first letter is
// made upper case. Returns null when a role of the template has no filler.
export function realiseEn(wires, text, fillers) {
  const facts = { inflect: wires.filter((w) => w.type === 'w.lang.en.inflect'), irregular: wires.filter((w) => w.type === 'w.lang.en.irregular'), exceptions: wires.filter((w) => w.type === 'w.lang.en.noun.exception') };
  let missing = false;
  let s = text.replace(/\{([\w.]+)(?::([^}@]*))?(?:@(\w+))?\}/g, (_, role, cells) => {
    const v = fillers[role];
    if (v === undefined || v === null || v === '') { missing = true; return ''; }
    const feat = Object.fromEntries((cells || '').split(',').filter(Boolean).map((x) => x.split('=')));
    if (feat.num === 'pl') { const ws = String(v).split(' '); ws[ws.length - 1] = inflect(facts, ws[ws.length - 1], 'plural'); return ws.join(' '); }
    return String(v);
  });
  if (missing) return null;
  const article = new Set(wires.filter((w) => w.type === 'w.lang.en.det' && one(w, 'before')).map((w) => one(w, 'text')));
  s = s.replace(/\b(a|an) (\S+)/gi, (m, a, next) => (article.has(a.toLowerCase()) ? `${articleFor(wires, next)} ${next}` : m));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- a sentence of several clauses (PSys2 Q18 K6: "I want a puzzle and I pay 10 lei. What is the change?") ----
// The smallest reference splitter a host does before its frames: a sentence ends at . ? ! or ;; inside one, a clause
// may end at a comma or at a joiner of w.lang.en that cuts (and, then, also, but: the joiner is dropped), or right before
// a question word of w.lang.en (w.lang.en.wh: "pay with 20 lei what is the change", a run-on). Of the ways to cut, the one
// whose clauses all read by a frame wins, the most literal words first, then the fewest captured words, then the fewest
// clauses (the frames' own order, summed over the clauses). `read` is a frameReader; returns the best reading of each
// clause in order, or null when no way of cutting reads every clause.
export function clauseReader(read, wires) {
  const joiners = new Set(wires.filter((w) => w.type === 'w.lang.en.joiner' && one(w, 'cut') === 'yes' && /^[a-z]+$/.test(one(w, 'text'))).map((w) => one(w, 'text')));
  const wh = new Set(wires.filter((w) => w.type === 'w.lang.en.wh').map((w) => one(w, 'text')));
  const better = (a, b) => !b || a.literal > b.literal || (a.literal === b.literal && (a.captured < b.captured || (a.captured === b.captured && a.clauses.length < b.clauses.length)));
  function one1(sentence) { // one sentence: cut points, then the best cutting by dynamic programming from the end
    const ws = sentence.replace(/,/g, ' , ').trim().split(/\s+/).filter(Boolean);
    const low = ws.map((w) => w.toLowerCase().replace(/['’]/g, ''));
    const cuts = []; // [end of a clause, start of the next]
    low.forEach((w, i) => { if (i > 0 && (w === ',' || joiners.has(w))) cuts.push([i, i + 1]); else if (i > 0 && wh.has(w)) cuts.push([i, i]); });
    const memo = new Map();
    const from = (s) => {
      if (s >= ws.length) return { literal: 0, captured: 0, clauses: [] };
      if (memo.has(s)) return memo.get(s);
      let best = null;
      for (const [end, next] of [...cuts.filter(([e]) => e > s), [ws.length, ws.length]]) {
        const text = ws.slice(s, end).filter((w) => w !== ',').join(' ');
        if (!text) continue;
        const [r] = read(text);
        if (!r) continue;
        const rest = from(next);
        if (!rest) continue;
        const c = { literal: r.literal + rest.literal, captured: r.captured + rest.captured, clauses: [{ text, ...r }, ...rest.clauses] };
        if (better(c, best)) best = c;
      }
      memo.set(s, best);
      return best;
    };
    return from(0);
  }
  return (text) => {
    const out = [];
    for (const s of String(text).split(/[.?!;]+/).map((x) => x.trim()).filter(Boolean)) { const r = one1(s); if (!r) return null; out.push(...r.clauses); }
    return out;
  };
}
