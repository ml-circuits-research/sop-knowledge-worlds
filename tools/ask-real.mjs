// Round 11 item 1: the demo's real questions, answered from the catalog the way a host would.
//   node tools/ask-real.mjs [--root <docs/worlds of another checkout>] [--list] [--misses] [--json]
// The questions: sources/psys2-eval/real-questions.jsonl (the Talk tab's failed questions and the lookup set of
// PSys2; sources/psys2-eval/SOURCE.md says where each comes from).
//
// What the tool does with a question, and nothing more: it finds the words of the question in the catalog.
//   - a THING: a word or phrase that names a fact (the naming key of a type: `name`, `word` or `text`), or a
//     core.word of such a fact (plural forms, other names);
//   - an ASKED KEY: a word that a schema gives to a slot or a type (`core.word text=legs means=k.animals.animal.legs`);
//   - a VALUE: a word that is a value of a key of the thing's type (fruit is a `kind` of k.food.food): it names
//     that key ("is a cake a fruit" asks the kind of a cake);
//   - a COMPARATIVE or a step of a scale (k.values: bigger, longest, big): it names the scale, and
//     k.attributes.found says under which keys the values of that scale are found.
// A reading is one thing (or two for a comparison) with one key; a question finds a fact when a fact of the thing
// has the key. With no asked key the question asks what the thing is: a fact with `gloss` or `about`. The tool
// does not read English beyond that: no grammar, no word order except "the thing nearest the key" as a tie-break.
// The words it ignores are the function words of FUNCTION (a host has such a list); every other word of the
// question must be used by the reading, else the question is counted as found only in part.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const FUNCTION = new Set(('a an the is are was were be am do does did what which who whose how why where when of in on at to from than and or me you '
  + 'your we us it its i my thing things can could please there here that this these those have has had not no yes many much some any s tell about '
  + 'for with by as if will would one other').split(' '));
// Question words that always ask for something: a reading that uses no key does not answer them.
const ASKING = new Set(['why', 'where', 'when', 'how', 'can']);
// Words that never ask for a key, whatever a schema calls its keys.
const COPULA = new Set('a an the is are was were be am what which who of it'.split(' '));
const DEFINITION = ['gloss', 'about'];
// With no gloss, what a thing is, is its kind.
const KIND = ['kind', 'class', 'is_a', 'instance_of'];

export function loadCatalog(root = WORLDS_DIR) {
  const types = new Map();      // type -> { slots: Map(key -> { many, enum }), nameKey }
  const keyWords = new Map();   // text -> [{ type, key | null }]
  const things = new Map();     // text -> [{ type, name }]
  const facts = new Map();      // type + '\n' + name -> [fact]
  const values = new Map();     // text -> Set(type + '\n' + key)
  const byType = new Map();     // type -> [fact]
  const add = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  const worlds = scanWorlds(root);
  const words = [];
  for (const w of worlds) for (const s of parse(w.schemaText)) {
    if (s.type === 'core.type') types.set(s.attrs.of[0], { slots: new Map(), ids: [] });
    if (s.type === 'core.slot') { const t = types.get(s.attrs.of[0]); t.slots.set(s.attrs.key[0], { many: s.attrs.many?.[0] === 'true', enum: s.attrs.enum?.map(tok) }); if (s.attrs.id?.[0] === 'true') t.ids.push(s.attrs.key[0]); }
    if (s.type === 'core.word') words.push(s);
  }
  for (const t of types.values()) t.nameKey = ['name', 'word', 'text'].includes(t.ids[0]) ? t.ids[0] : null;
  for (const w of worlds) for (const s of w.shards) for (const f of parse(s.text)) {
    if (f.type === 'core.word') { words.push(f); continue; }
    const t = types.get(f.type);
    if (!t?.nameKey) continue;
    const name = tok(f.attrs[t.nameKey][0]);
    add(facts, `${f.type}\n${name}`, f);
    add(byType, f.type, f);
    for (const [k, vs] of Object.entries(f.attrs)) {
      if (k === t.nameKey || k.startsWith('core.') || DEFINITION.includes(k)) continue;
      for (const v of vs) { const text = tok(v).toLowerCase(); if (text.split(' ').length > 3) continue; if (!values.has(text)) values.set(text, new Set()); values.get(text).add(`${f.type}\n${k}`); }
    }
  }
  for (const [key, list] of facts) { const [type, name] = key.split('\n'); const text = name.toLowerCase(); if (!(things.get(text) ?? []).some((x) => x.type === type && x.name === name)) add(things, text, { type, name }); void list; }
  for (const w of words) {
    const means = tok(w.attrs.means?.[0]), of = w.attrs.of?.[0];
    if (!means) continue;
    for (const raw of w.attrs.text ?? []) {
      const text = tok(raw).toLowerCase();
      if (of) { const type = of.slice(0, of.lastIndexOf('.')); if (facts.has(`${type}\n${means}`) && !(things.get(text) ?? []).some((x) => x.type === type && x.name === means)) add(things, text, { type, name: means }); }
      else if (types.has(means)) add(keyWords, text, { type: means, key: null });
      else { const type = means.slice(0, means.lastIndexOf('.')), key = means.slice(type.length + 1); if (types.get(type)?.slots.has(key)) add(keyWords, text, { type, key }); }
    }
  }
  // Scales: a comparative, a superlative or a step names a scale; k.attributes.found says where a scale's values are.
  const scaleWords = new Map(); // text -> [{ scale, degree }]
  for (const f of byType.get('k.values.comparative') ?? []) add(scaleWords, tok(f.attrs.text[0]).toLowerCase(), { scale: tok(f.attrs.scale[0]), degree: tok(f.attrs.degree?.[0]) });
  for (const w of worlds.filter((x) => x.id === 'k.values')) for (const s of w.shards) for (const f of parse(s.text)) if (f.type === 'k.values.step') add(scaleWords, tok(f.attrs.name[0]).toLowerCase(), { scale: tok(f.attrs.scale[0]), degree: 'step' });
  for (const w of words) { const of = w.attrs.of?.[0]; if (of === 'k.values.step.name') for (const raw of w.attrs.text ?? []) for (const s of scaleWords.get(tok(w.attrs.means[0]).toLowerCase()) ?? []) if (s.degree === 'step') add(scaleWords, tok(raw).toLowerCase(), s); }
  const found = new Map();      // attribute or scale -> [{ type, key }]
  for (const w of worlds.filter((x) => x.id === 'k.attributes')) for (const s of w.shards) for (const f of parse(s.text)) if (f.type === 'k.attributes.found') add(found, tok(f.attrs.attribute[0]), { type: tok(f.attrs.type[0]), key: tok(f.attrs.key[0]) });
  return { types, keyWords, things, facts, values, byType, scaleWords, found };
}

const wordsOf = (text) => text.toLowerCase().replace(/[’']/g, ' ').replace(/[^\p{L}\p{N} ]+/gu, ' ').split(/\s+/).filter(Boolean);

// The spans of the question that the catalog knows, longest first at each place: { from, to, text, things, keys, scales }.
function spans(cat, tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) for (let n = Math.min(4, tokens.length - i); n >= 1; n--) {
    const text = tokens.slice(i, i + n).join(' ');
    const lemmas = [text];
    if (n === 1 && !cat.things.has(text)) { if (text.endsWith('ies')) lemmas.push(`${text.slice(0, -3)}y`); if (text.endsWith('es')) lemmas.push(text.slice(0, -2)); if (text.endsWith('s')) lemmas.push(text.slice(0, -1)); }
    const things = lemmas.flatMap((l) => cat.things.get(l) ?? []);
    const s = { from: i, to: i + n, text, things, lemma: things.length > 0 && !cat.things.has(text), keys: cat.keyWords.get(text) ?? [], scales: cat.scaleWords.get(text) ?? [], values: cat.values.get(text) ?? new Set() };
    if (s.things.length || s.keys.length || s.scales.length || s.values.size) out.push(s);
  }
  return out;
}

const valuesOf = (f, key) => (f.attrs[key] ?? []).map(tok);

export function ask(cat, question) {
  const tokens = wordsOf(question);
  const content = tokens.map((t, i) => (FUNCTION.has(t) || /^\d+$/.test(t) ? -1 : i)).filter((i) => i >= 0);
  const all = spans(cat, tokens);
  const isContent = (s) => { for (let i = s.from; i < s.to; i++) if (!FUNCTION.has(tokens[i])) return true; return false; };
  const overlap = (a, b) => a.from < b.to && b.from < a.to;
  // A thing span is not inside a longer thing span ("north pole", not "pole").
  // A word that a schema gives to a key or a type (legs, made, parts) is a thing only when the question names no other.
  const named = all.filter((s) => s.things.length && isContent(s) && !s.keys.length && !s.scales.length);
  const thingSpans = all.filter((s) => s.things.length && isContent(s) && (!named.length || named.includes(s)) && !all.some((o) => o !== s && o.things.length && o.from <= s.from && o.to >= s.to && o.to - o.from > s.to - s.from));
  const keySpans = all.filter((s) => s.keys.length && !s.text.split(' ').every((w) => COPULA.has(w)));
  const scaleSpans = all.filter((s) => s.scales.length && isContent(s));
  const readings = [];
  const used = (...ss) => new Set(ss.flatMap((s) => Array.from({ length: s.to - s.from }, (_, i) => s.from + i)));
  const push = (r) => { r.left = content.filter((i) => !r.used.has(i)).map((i) => tokens[i]); r.cover = content.length - r.left.length; readings.push(r); };
  const gap = (t, k) => (t.from >= k.to ? t.from - k.to : 100 + k.from - t.to);
  const factsOf = (x) => cat.facts.get(`${x.type}\n${x.name}`) ?? [];

  for (const t of thingSpans) for (const x of t.things) {
    const fs = factsOf(x);
    // 1. An asked key that is a slot of the thing's type, or a word for its type.
    for (const k of keySpans) if (!overlap(k, t)) for (const slot of k.keys) {
      // A content word that asks a key of another type than the thing's: a reading that finds nothing ("the capital of the Sahara").
      if (slot.type !== x.type) { if (isContent(k) && slot.key) push({ kind: 'key', rank: 0.5, thing: x, key: `${slot.type}.${slot.key}`, otherType: true, found: false, answer: [], used: used(t, k), lemma: t.lemma }); continue; }
      // A word for a type ("the parts of a tent", "is a dog an animal") must be a word of the question's own, not a function word.
      if (!slot.key && !isContent(k)) continue;
      const vals = slot.key ? fs.flatMap((f) => valuesOf(f, slot.key)) : fs.flatMap((f) => Object.entries(f.attrs).filter(([key]) => !key.startsWith('core.') && key !== 'named' && key !== cat.types.get(x.type).nameKey).flatMap(([key, vs]) => vs.map((v) => `${key} ${tok(v)}`)));
      if (!slot.key && fs.length && !vals.length) vals.push('yes');
      // Other key words for the same type are used with it ("how many bones are in the body").
      const also = keySpans.filter((o) => o !== k && !overlap(o, t) && !overlap(o, k) && o.keys.some((y) => y.type === x.type));
      // Other content words that are values of this thing's facts are used too ("why is Mars red").
      const extra = all.filter((v) => !overlap(v, t) && !overlap(v, k) && isContent(v) && (v.values.has(`${slot.type}\n${slot.key}`) || fs.some((f) => Object.entries(f.attrs).some(([key, vs]) => !key.startsWith('core.') && vs.some((y) => tok(y).toLowerCase() === v.text)))));
      push({ kind: 'key', rank: isContent(k) ? 4 : 2.8, thing: x, key: `${slot.type}.${slot.key ?? '*'}`, found: vals.length > 0, answer: vals, used: used(t, k, ...extra, ...also), gap: gap(t, k), lemma: t.lemma });
    }
    // 2. A value word of the thing's type names the key ("is a cake a fruit": kind).
    for (const v of all) if (!overlap(v, t) && isContent(v)) for (const tk of v.values) {
      const [type, key] = tk.split('\n');
      if (type !== x.type) continue;
      const vals = fs.flatMap((f) => valuesOf(f, key));
      // Only where the key is a closed list of values (kind: fruit, vegetable) or the thing's own fact has the value.
      const closed = cat.types.get(type).slots.get(key)?.enum?.includes(v.text), own = vals.some((y) => y.toLowerCase() === v.text);
      if (!closed && !own) continue;
      const others = all.filter((o) => o !== v && !overlap(o, t) && !overlap(o, v) && isContent(o) && o.values.has(tk));
      push({ kind: 'value', rank: 3, thing: x, key: `${type}.${key}`, found: vals.length > 0, answer: vals, asked: v.text, used: used(t, v, ...others), gap: gap(t, v), lemma: t.lemma });
    }
    // 3. No key: what the thing is.
  }
  // 3. No key: what the thing is: the glosses of the facts of that name, in any world; with none, their kinds.
  for (const t of thingSpans) {
    const fs = [...new Set(t.things.flatMap((x) => [x, ...(cat.things.get(x.name.toLowerCase()) ?? [])]).flatMap(factsOf))];
    let def = fs.flatMap((f) => DEFINITION.flatMap((k) => valuesOf(f, k)));
    if (!def.length) def = fs.flatMap((f) => KIND.flatMap((k) => valuesOf(f, k)));
    push({ kind: 'definition', rank: 0, thing: t.things[0], key: null, found: def.length > 0, answer: [...new Set(def)], used: used(t), lemma: t.lemma });
  }
  // 4. A scale word with things: each thing has a value under a key where k.attributes.found says the scale is.
  for (const c of scaleSpans) for (const sc of c.scales) {
    const places = cat.found.get(sc.scale) ?? [];
    const ts = thingSpans.filter((t) => !overlap(t, c));
    // Two things are compared under one key where they both have it (the size class of both, not a class for one and
    // metres for the other); a thing without it falls back to the first key it has.
    const valueAt = (t, p) => { for (const x of t.things) if (p.type === x.type) { const vals = factsOf(x).flatMap((f) => valuesOf(f, p.key)); if (vals.length) return { t, x, p, vals }; } return null; };
    const shared = places.find((p) => ts.length > 0 && ts.every((t) => valueAt(t, p)));
    const withValue = ts.map((t) => (shared ? valueAt(t, shared) : places.map((p) => valueAt(t, p)).find(Boolean) ?? null));
    if (ts.length) push({ kind: 'scale', rank: 4, scale: sc.scale, thing: withValue.find(Boolean)?.x ?? ts[0].things[0], key: places.length ? places.map((p) => `${p.type}.${p.key}`).join(' ') : null, noPlace: !places.length,
      found: withValue.every(Boolean), answer: withValue.filter(Boolean).map((v) => `${v.x.name}: ${v.vals.join(', ')}`), used: used(c, ...ts), missing: ts.filter((t, i) => !withValue[i]).map((t) => t.text), lemma: ts.some((t) => t.lemma) });
    // A superlative with a word for a type ("the longest river"): some fact of the type has the scale's key.
    for (const k of keySpans) if (!overlap(k, c)) for (const slot of k.keys) if (!slot.key) for (const p of places) if (p.type === slot.type) {
      const n = (cat.byType.get(p.type) ?? []).filter((f) => f.attrs[p.key]).length;
      push({ kind: 'scale over a type', rank: 4, scale: sc.scale, key: `${p.type}.${p.key}`, found: n > 0, answer: [`${n} facts with ${p.key}`], used: used(c, k) });
    }
  }
  // 5. No thing, but a key and values of its type ("which planet has rings", "what has a roof and a door").
  for (const k of keySpans) if (isContent(k)) for (const slot of k.keys) if (slot.key) {
    const vs = all.filter((v) => !overlap(v, k) && isContent(v) && [...v.values].some((tk) => tk.split('\n')[0] === slot.type));
    if (!vs.length) continue;
    const match = (cat.byType.get(slot.type) ?? []).filter((f) => f.attrs[slot.key] && vs.every((v) => Object.entries(f.attrs).some(([key, ys]) => !key.startsWith('core.') && ys.some((y) => tok(y).toLowerCase() === v.text))));
    const nameKey = cat.types.get(slot.type).nameKey;
    push({ kind: 'search', rank: 1, key: `${slot.type}.${slot.key}`, found: match.length > 0, answer: match.slice(0, 5).map((f) => tok(f.attrs[nameKey][0])), used: used(k, ...vs) });
  }
  // 6. Two units of one quantity: the factor of each says how many of one are in the other, and which is more.
  const units = thingSpans.map((t) => ({ t, x: t.things.find((y) => y.type === 'k.units.unit') })).filter((u) => u.x);
  if (units.length === 2) {
    const [a, b] = units.map((u) => factsOf(u.x)[0]);
    const same = tok(a.attrs.quantity[0]) === tok(b.attrs.quantity[0]);
    const extra = all.filter((s) => (s.scales.length || s.keys.some((k) => k.type === 'k.units.unit')) && !units.some((u) => overlap(u.t, s)));
    push({ kind: 'units', rank: 5, thing: units[0].x, key: 'k.units.unit.factor', found: same, answer: same ? [`${tok(a.attrs.name[0])}: ${a.attrs.factor[0]}`, `${tok(b.attrs.name[0])}: ${b.attrs.factor[0]}`] : [], used: used(units[0].t, units[1].t, ...extra) });
  }

  // The best readings: those that use the most words of the question, and among them those of the highest rank
  // (an asked key before a value word, before a search, before "what is it"). The question finds a fact when one
  // of them does. "What is it" does not answer a question word that asks for something (why, where, how, can).
  const asking = tokens.filter((t) => ASKING.has(t));
  const usable = readings.filter((r) => !((r.kind === 'definition' || r.kind === 'value') && asking.length));
  // A reading that asks a key of another kind of thing stands in the way only when nothing but "what is it" is found.
  const keyed = usable.some((r) => r.found && r.kind !== 'definition');
  const ranked = usable.filter((r) => !(r.otherType && keyed));
  const cover = Math.max(-1, ...ranked.map((r) => r.cover));
  const rank = Math.max(-1, ...ranked.filter((r) => r.cover === cover).map((r) => r.rank));
  const top = ranked.filter((r) => r.cover === cover && r.rank === rank);
  // Among equal readings: the thing that stands after the key ("a box shaped like a guitar": the guitar).
  top.sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0));
  const best = top.find((r) => r.found && !r.lemma) ?? top.find((r) => r.found) ?? null;
  const base = { question, tokens, content: content.map((i) => tokens[i]) };
  // A word of the question that the catalog does not know at all: nothing is found for the question.
  const unknown = content.filter((i) => !all.some((s) => s.from <= i && i < s.to)).map((i) => tokens[i]);
  if (unknown.length) return { ...base, found: 'no', cause: thingSpans.length ? 'word not in vocabulary' : 'thing missing', unknown, reading: null, left: unknown };
  if (best) return { ...base, found: best.left.length ? 'part' : 'whole', reading: best, answer: best.answer, left: best.left, lemma: !!best.lemma };
  // Not found: why.
  let cause;
  if (!content.length || (!named.length && tokens.some((t) => ['it', 'they', 'one', 'other'].includes(t)))) cause = 'needs the conversation';
  else if (!thingSpans.length) cause = 'no thing named';
  else if (top.some((r) => r.otherType) && top.every((r) => r.otherType)) cause = 'key of another kind of thing';
  else if (top.some((r) => r.kind === 'scale' && r.noPlace)) cause = 'key missing: the scale has no key in k.attributes.found';
  else if (top.length && top[0].kind !== 'definition') cause = 'key missing';
  else if (asking.length || content.some((i) => !thingSpans.some((t) => t.from <= i && i < t.to))) cause = 'word for the asked key not in vocabulary';
  else cause = 'key missing';
  const tried = top[0] ?? readings[0] ?? null;
  return { ...base, found: 'no', cause, unknown, reading: tried, left: tried?.left ?? base.content };
}

export function readQuestions(path = join(REPO, 'sources/psys2-eval/real-questions.jsonl')) {
  return readFileSync(path, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

// The run: every question, and the counts. A question with `invented` is about a noun that does not exist: the
// right outcome is "thing missing". A question with `expect` (a regular expression of the demo's lookup set) is
// answered right when one of the values found matches it.
export function run({ root = WORLDS_DIR, questions = readQuestions() } = {}) {
  const cat = loadCatalog(root);
  const rows = questions.map((q) => {
    const r = ask(cat, q.text);
    let outcome = r.found === 'no' ? `not found: ${r.cause}` : r.found === 'whole' ? 'found' : 'found in part';
    if (q.invented) outcome = r.found === 'no' ? 'invented noun, rightly not found' : 'invented noun, wrongly found';
    else if (q.expect && r.found !== 'no') outcome = new RegExp(q.expect, 'i').test(r.answer.map((a) => `has ${a} ${(r.reading.key ?? '').split('.').pop()}`).join(' ; ')) ? outcome : `${outcome}, answer not as expected`;
    return { ...q, ...r, outcome };
  });
  const counts = {};
  for (const r of rows) { const set = r.set; counts[set] ??= {}; counts[set][r.outcome] = (counts[set][r.outcome] ?? 0) + 1; }
  return { rows, counts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--root');
  const { rows, counts } = run({ root: at >= 0 ? args[at + 1] : WORLDS_DIR });
  if (args.includes('--json')) console.log(JSON.stringify(rows.map((r) => ({ set: r.set, text: r.text, outcome: r.outcome, key: r.reading?.key ?? null, thing: r.reading?.thing?.name ?? null, answer: r.answer ?? null, left: r.left }))));
  else {
    for (const [set, c] of Object.entries(counts)) {
      const n = Object.values(c).reduce((a, b) => a + b, 0);
      console.log(`${set}: ${n} questions`);
      for (const [k, v] of Object.entries(c).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
    }
    if (args.includes('--list') || args.includes('--misses')) for (const r of rows) {
      if (args.includes('--misses') && (r.outcome === 'found' || r.outcome.startsWith('invented noun, rightly'))) continue;
      const rd = r.reading;
      console.log(`[${r.set}] ${r.text}\n    ${r.outcome}${rd ? ` | ${rd.kind}${rd.thing ? ` ${rd.thing.type} ${rd.thing.name}` : ''}${rd.key ? ` -> ${rd.key}` : ''}` : ''}${r.answer?.length ? ` = ${r.answer.join(' ; ').slice(0, 140)}` : ''}${r.left?.length ? ` | not used: ${r.left.join(', ')}` : ''}`);
    }
  }
}
