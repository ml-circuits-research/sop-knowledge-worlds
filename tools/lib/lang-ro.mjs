// A reference reader of w.lang.ro's frames (shard frames): the frames are written in w.lang.en's frame vocabulary, so
// the same reader reads them (frameReader of tools/lib/lang-en.mjs), given the Romanian words: the verbs of an act (every
// form the class of a dictionary lemma generates, for the lemmas whose sense reaches the act: a k.actions verb, or a
// k.words verb sense whose English word is a k.actions verb of that act), the determiners, prepositions, numerals,
// phrase groups and lexicons of w.lang.ro, all compared without diacritics (folded). A sentence is folded, its joined
// clitics split (șterge-l -> șterge l), the politeness words of the phrase group `skip` dropped; a kind's noun phrase
// is read by the order fact adjective.after.noun (the first noun is the head, the adjectives its values).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, morphOf, analyse, generate, fold, dictionary, splitClitics } from '../sopworld/sopworld.mjs';
import { WORLDS_DIR, fullWorld } from './worlds.mjs';
import { frameReader } from './lang-en.mjs';

const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const TYPES = { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', template: 'w.lang.ro.template', vowel: 'w.lang.ro.vowel' };
const shardWires = (id) => { const d = join(WORLDS_DIR, id, 'shards'); return readdirSync(d).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(d, f), 'utf8'))); };

// The rows of the dictionary folders: [lemma, class, gender, sense].
export function dictionaryRows(folders = ['dictionary', 'dictionary-unimorph']) {
  const rows = [];
  for (const folder of folders) {
    const dir = join(WORLDS_DIR, 'w.lang.ro', folder);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.tsv')).sort()) for (const l of readFileSync(join(dir, f), 'utf8').split('\n')) if (l && !l.startsWith('#')) rows.push(l.split('\t'));
  }
  return rows;
}

export function roReader({ folders = ['dictionary', 'dictionary-unimorph'], needs = () => true } = {}) {
  const world = fullWorld('w.lang.ro');
  const m = morphOf(world, { types: TYPES });
  const f = (s) => fold(m, String(s)).toLowerCase();
  const en = shardWires('w.lang.en');
  const actionWires = shardWires('k.actions');
  // the acts a lemma's sense reaches
  const actsOfWord = new Map();
  for (const v of actionWires.filter((w) => w.type === 'k.actions.verb')) { const t = one(v, 'text'); if (!actsOfWord.has(t)) actsOfWord.set(t, new Set()); actsOfWord.get(t).add(one(v, 'act')); }
  const actsOf = (sense) => {
    if (!sense) return [];
    if (sense.startsWith('k.actions.verb.')) { const rest = sense.slice('k.actions.verb.'.length); const act = [...new Set(actionWires.filter((w) => w.type === 'k.actions.act').map((a) => one(a, 'name')))].find((a) => rest.startsWith(`${a}.`)); return act ? [act] : []; }
    const mm = /^k\.words\.(.+)\.verb\.\d+$/.exec(sense);
    return mm ? [...(actsOfWord.get(mm[1].replace(/_/g, ' ')) ?? [])] : [];
  };
  const verbs = [];
  const seen = new Set();
  const rows = dictionaryRows(folders);
  for (const [lemma, cls, , sense] of rows) {
    if (!cls?.startsWith('v.')) continue;
    const acts = actsOf(sense);
    if (!acts.length) continue;
    const c = m.classes.get(cls);
    if (!c) continue;
    for (const cell of c.cells.values()) {
      let form;
      try { form = generate(m, lemma, cls, cell.feat); } catch { continue; }
      for (const x of [].concat(form ?? [])) for (const act of acts) {
        const key = `${act} ${f(x)}`;
        if (!seen.has(key)) { seen.add(key); verbs.push({ type: 'k.actions.verb', attrs: { text: [f(x)], act: [act] } }); }
      }
    }
  }
  const ro = world.ofType.bind(world);
  const W = (type, attrs) => ({ type: `w.lang.en.${type}`, attrs: Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined).map(([k, v]) => [k, [].concat(v).map(String)])) });
    // a Romanian frame takes its English frame's frame-specific role maps and fixed arguments (same vocabulary)
  const enOfRo = new Map(ro('w.lang.ro.frame').map((x) => [one(x, 'en'), []]));
  for (const x of ro('w.lang.ro.frame')) enOfRo.get(one(x, 'en')).push(one(x, 'name'));
  const inherited = en.filter((w) => (w.type === 'w.lang.en.role_map' || w.type === 'w.lang.en.fixed') && enOfRo.has(one(w, 'frame')))
    .flatMap((w) => enOfRo.get(one(w, 'frame')).map((name) => ({ ...w, attrs: { ...w.attrs, frame: [name] } })));
  const wires = [
    ...en.filter((w) => w.type === 'w.lang.en.role_map' || w.type === 'w.lang.en.mode_map'), ...inherited,
    ...ro('w.lang.ro.det').map((d) => W('det', { text: f(one(d, 'form')) })),
    ...ro('w.lang.ro.prep').map((p) => W('prep', { text: f(one(p, 'form')), rel: one(p, 'rel') })),
    ...ro('w.lang.ro.numeral').map((n) => W('numeral', { text: f(one(n, 'form')), value: one(n, 'value') })),
    ...ro('w.lang.ro.phrase').map((p) => W('phrase', { name: one(p, 'name'), item: vals(p, 'item').map(f) })),
    ...ro('w.lang.ro.lex').map((p) => W('lex', { name: one(p, 'name'), item: vals(p, 'item').map(f) })),
    // a phrase group may also be a lexicon of a role (the joined clitic as the thing: șterge-l)
    ...ro('w.lang.ro.phrase').map((p) => W('lex', { name: one(p, 'name'), item: vals(p, 'item').map(f) })),
    ...ro('w.lang.ro.frame').map((x) => W('frame', { name: one(x, 'name'), act: one(x, 'act'), mode: one(x, 'mode'), set: 'acts', priority: one(x, 'priority'), needs: one(x, 'needs'), role: vals(x, 'role') })),
    ...ro('w.lang.ro.part').map((p) => W('part', { frame: one(p, 'frame'), at: one(p, 'at'), is: one(p, 'is'), act: one(p, 'act'), role: one(p, 'role'), takes: one(p, 'takes'), lexicon: one(p, 'lexicon'), max_words: one(p, 'max_words'), word: vals(p, 'word').map(f), phrase: vals(p, 'phrase'), optional: one(p, 'optional') })),
  ];
  const d = dictionary({ read: (p) => folders.map((x) => { const file = join(WORLDS_DIR, 'w.lang.ro', x, `${p}.tsv`); return existsSync(file) ? readFileSync(file, 'utf8') : null; }).filter(Boolean).join('\n') || null, fold: (s) => fold(m, s) });
  const pos = (w) => new Set(analyse(m, w, { dictionary: d }).map((a) => String(a.cls ?? a.class ?? '').split('.')[0]));
  // the noun phrase of a kind: the first noun is the head, the adjectives after it are its values (adjective.after.noun)
  const kindPhrase = (words) => {
    const ws = words.split(' ');
    const i = ws.findIndex((w) => [...pos(w)].some((c) => ['m', 'f', 'n'].includes(c)));
    if (i < 0) return { head: words, mods: [] };
    return { head: ws[i], mods: ws.slice(i + 1).filter((w) => pos(w).has('a')) };
  };
  const read = frameReader(wires, verbs, { needs, kindPhrase });
  const skip = vals(ro('w.lang.ro.phrase').find((p) => one(p, 'name') === 'skip'), 'item').map(f);
  const prepare = (s) => {
    let t = ` ${[...String(s).matchAll(/[\p{L}\p{N}]+(?:-[\p{L}]+)*/gu)].flatMap(([x]) => splitClitics(m, x)).map(f).join(' ')} `;
    for (const k of skip) t = t.split(` ${k} `).join(' ');
    return t.trim();
  };
  const enOf = new Map(ro('w.lang.ro.frame').map((x) => [one(x, 'name'), one(x, 'en')]));
  return { read: (s) => read(prepare(s)), prepare, verbs: verbs.length, morph: m, enOf: (name) => enOf.get(name) };
}
