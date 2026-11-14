// Block "00:05" item 2 (reviewer, 2026-11-15): how each attribute of the catalog is said in English. PSys2's first
// compositions said every attribute as "has a X of Y" ("Chad has a code of TCD"). `w.lang.en.phrasing` gives one
// sentence template per key family: a default for each form of k.attributes.narration (relation and measure: "the
// capital of Chad is N'Djamena"; count: "a hen has 2 legs"; state: "Chad is landlocked"; kind: "a hen is a bird"; text),
// and a template of its own for a key that English says with a verb or a phrase ("a cow eats grass", "bread is made
// of flour", "N'Djamena is the capital of Chad", "a cow says moo"). Slots: {thing} the thing with its determiner (a
// hen, Chad), {value} the value as said (with its unit for a number), {key} the key's word (for the defaults).
//
// Read back by this world's frames: five frames of the set `acts.state` (needs=state: a world that takes statements of
// facts, so a host opts in) read a statement as the act change (set) of k.actions with its roles thing, attribute and
// value: acts.state.of ("the {attribute} of {thing} is {value}"), acts.state.count ("{thing} has {number}
// {attribute}"), acts.state.verb and acts.state.phrase ("{thing} eats {value}", "{thing} is made of {value}": the verb
// or phrase is the attribute, from the lexicons attribute.verb and attribute.phrase, which this tool derives from the
// templates), acts.state.is ("{thing} is {value}": the value names the attribute).
//   node tools/lang-en-phrasing.mjs     writes docs/worlds/w.lang.en/shards/templates-phrasing.sop
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';

const SRC = 'hand-core 1';
const q = (s) => JSON.stringify(String(s));

// The defaults, one per form of k.attributes.narration (and the negative of a state).
export const DEFAULTS = [
  ['relation', null, 'the {key} of {thing} is {value}.'],
  ['measure', null, 'the {key} of {thing} is {value}.'],
  ['text', null, 'the {key} of {thing} is {value}.'],
  ['count', null, '{thing} has {value} {key}.'],
  ['kind', null, '{thing} is a {value}.'],
  ['state', 'yes', '{thing} is {key}.'],
  ['state', 'no', '{thing} is not {key}.'],
];

// Keys English says with a verb or a phrase of their own: [key, type or null (every type with the key), text, polarity].
export const KEYS = [
  ['eats', null, '{thing} eats {value}.'],
  ['habitat', null, '{thing} lives in the {value}.'],
  ['group', 'k.animals.animal', '{thing} lives in a {value}.'],
  ['can', null, '{thing} can {value}.'],
  ['cannot', null, '{thing} cannot {value}.'],
  ['sound', null, '{thing} says {value}.'],
  ['baby', null, 'the young of {thing} is a {value}.'],
  ['covering', null, '{thing} has {value}.'],
  ['diet', null, '{thing} is a {value}.'],
  ['colour', null, '{thing} is {value}.'],
  ['material', null, '{thing} is made of {value}.'],
  ['made_of', null, '{thing} is made of {value}.'],
  ['used_for', null, '{thing} is used for {value}.'],
  ['at', null, '{thing} is found in the {value}.'],
  ['grows_on', null, '{thing} grows on a {value}.'],
  ['comes_from', null, '{thing} comes from {value}.'],
  ['eaten', null, '{thing} is eaten {value}.'],
  ['kind', 'k.food.food', '{thing} is {value}.'],
  ['continent', null, '{thing} is in {value}.'],
  ['region', null, '{thing} is in {value}.'],
  ['country', null, '{thing} is in {value}.'],
  ['capital_of', null, '{thing} is the capital of {value}.'],
  ['neighbour', null, '{thing} borders {value}.'],
  ['member', null, '{thing} has the member {value}.'],
  ['orbits', null, '{thing} orbits {value}.'],
  ['rings', null, '{thing} has rings.', 'yes'],
  ['rings', null, '{thing} has no rings.', 'no'],
  ['weekend', null, '{thing} is a weekend day.', 'yes'],
  ['weekend', null, '{thing} is not a weekend day.', 'no'],
  ['equal_sides', null, '{thing} has equal sides.', 'yes'],
  ['pair', null, '{thing} is worn in pairs.', 'yes'],
  ['worn_on', null, '{thing} is worn on the {value}.'],
  ['worn_for', null, '{thing} is worn for {value}.'],
  ['covers', null, '{thing} covers the {value}.'],
  ['works_at', null, '{thing} works at a {value}.'],
  ['wears', null, '{thing} wears a {value}.'],
  ['holds', null, '{thing} holds a {value}.'],
  ['uses', null, '{thing} uses a {value}.'],
  ['does', 'k.people.role', '{thing} can {value}.'],
  ['does', 'k.body.part', '{thing} is the part that {value}.'],
  ['has', null, '{thing} has {value}.'],
  ['part_of', null, '{thing} is part of {value}.'],
  ['inside', null, '{thing} is inside the {value}.'],
  ['on', null, '{thing} is found on a {value}.'],
  ['synonym', null, '{thing} is also called {value}.'],
  ['also', null, '{thing} is also called {value}.'],
  ['opposite', null, 'the opposite of {thing} is {value}.'],
  ['gloss', null, '{thing} is {value}.'],
  ['days', null, '{thing} has {value} days.'],
  ['next', null, '{thing} comes before {value}.'],
  ['gives', null, '{thing} gives {value}.'],
  ['caused_by', null, '{thing} can come from {value}.'],
  ['moons_about', null, '{thing} has about {value} moons.'],
];

const keyOf = (r) => r[0];
export const nameOf = (key, of, pol) => [of ?? 'any', key, ...(pol ? [pol] : [])].join('.').replace(/\.any\./, '.');

// The verb or phrase between {thing} and {value} of a template, without a final determiner: the lexicon item that
// says the key when a frame reads the sentence back.
export function middle(text) {
  const m = text.match(/^\{thing\} (.+?) (?:(?:a|an|the) )?\{value\}\.$/);
  if (!m || m[1].includes('{')) return null;
  return m[1];
}
export function lexiconItems(rows = KEYS) {
  const verb = new Set(), phrase = new Set();
  for (const r of rows) {
    const x = middle(r[2]);
    if (!x || x === 'is' || x === 'has about') continue;
    if (/^(is|are) /.test(x)) phrase.add(x.replace(/^(is|are) /, '')); else verb.add(x);
  }
  for (const r of rows.filter((x) => x[3])) { // a state said with a verb: "has rings", "is worn in pairs"
    const m = r[2].match(/^\{thing\} (.+)\.$/)[1];
    if (/^(is|are) /.test(m)) phrase.add(m.replace(/^(is|are) /, '')); else verb.add(m);
  }
  return { verb: [...verb].sort(), phrase: [...phrase].sort() };
}

// The frames that read the templates back (set acts.state, needs=state), as [name, priority, roles, example, parts].
const P = (is, extra = {}) => ({ is, ...extra });
export const FRAMES = [
  ['acts.state.of', 8, ['attribute', 'thing', 'value'], 'The capital of Chad is N\'Djamena.',
    [P('word', { word: ['the'] }), P('role', { role: 'attribute', takes: 'words', max_words: 3 }), P('word', { word: ['of'] }), P('det', { optional: 'yes' }),
      P('role', { role: 'thing', takes: 'words' }), P('word', { word: ['is', 'are'] }), P('det', { optional: 'yes' }), P('role', { role: 'value', takes: 'rest' })]],
  ['acts.state.count', 9, ['thing', 'value', 'attribute'], 'A hen has 2 legs.',
    [P('det', { optional: 'yes' }), P('role', { role: 'thing', takes: 'words' }), P('word', { word: ['has', 'have'] }), P('word', { word: ['about'], optional: 'yes', listed: 'yes' }),
      P('role', { role: 'value', takes: 'number' }), P('role', { role: 'attribute', takes: 'words', max_words: 3 })]],
  ['acts.state.phrase', 7, ['thing', 'attribute', 'value'], 'Bread is made of flour.',
    [P('det', { optional: 'yes' }), P('role', { role: 'thing', takes: 'words' }), P('word', { word: ['is', 'are'] }), P('role', { role: 'attribute', takes: 'lexicon', lexicon: 'attribute.phrase' }),
      P('det', { optional: 'yes' }), P('role', { role: 'value', takes: 'rest', optional: 'yes' })]],
  ['acts.state.verb', 7, ['thing', 'attribute', 'value'], 'A cow eats grass.',
    [P('det', { optional: 'yes' }), P('role', { role: 'thing', takes: 'words' }), P('role', { role: 'attribute', takes: 'lexicon', lexicon: 'attribute.verb' }),
      P('det', { optional: 'yes' }), P('role', { role: 'value', takes: 'rest', optional: 'yes' })]],
  ['acts.state.is', 5, ['thing', 'value'], 'A hen is a bird.',
    [P('det', { optional: 'yes' }), P('role', { role: 'thing', takes: 'words' }), P('word', { word: ['is', 'are'] }), P('det', { optional: 'yes' }), P('role', { role: 'value', takes: 'rest' })]],
];

// Which frame reads a template: by its shape.
export function frameOf(text) {
  if (/^the \{key\} of \{thing\} is /.test(text) || /^the [a-z ]+ of \{thing\} is /.test(text)) return 'acts.state.of';
  if (/^\{thing\} has (about )?\{value\} /.test(text)) return 'acts.state.count';
  const x = middle(text) ?? (text.match(/^\{thing\} (.+)\.$/) ?? [])[1];
  if (x === 'is' || x === 'is not {key}' || /^is (a )?\{key\}$/.test(x) || x === 'is {key}') return 'acts.state.is';
  if (x && /^(is|are) /.test(x)) return 'acts.state.phrase';
  if (x) return 'acts.state.verb';
  return null;
}

export function phrasingShard() {
  const rows = [
    ...DEFAULTS.map(([form, pol, text]) => ({ name: `form.${form}${pol ? `.${pol}` : ''}`, form, polarity: pol, text })),
    ...KEYS.map(([key, of, text, pol]) => ({ name: `key.${nameOf(key, of, pol)}`, key, of, polarity: pol, text })),
  ];
  const lex = lexiconItems();
  const out = [
    '# w.lang.en/shards/templates-phrasing: how each attribute of the catalog is said (block 00:05 item 2): a template per form of',
    '# k.attributes.narration (relation, measure, text, count, kind, state) and one per key English says with a verb or phrase',
    '# of its own ("{thing} eats {value}."), in the library\'s template notation; the frames of the set acts.state that read',
    '# them back as the act change of k.actions (thing, attribute, value), and the lexicons of the verbs and phrases that say',
    '# a key (derived from the templates). Checked in tests/w.lang.en.phrasing.test.mjs on a fact of every narrated key.',
    '# sources: hand-core 1 (written in this repository)',
    '# license: CC0-1.0',
    '# script: tools/lang-en-phrasing.mjs',
    '',
  ];
  for (const r of rows) {
    const f = frameOf(r.text);
    if (!f) throw new Error(`no frame reads ${r.text}`);
    const roles = [...r.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((x) => x !== 'key');
    out.push(`@w.lang.en.phrasing.${r.name} w.lang.en.phrasing name=${r.name}${r.form ? ` form=${r.form}` : ''}${r.key ? ` key=${r.key}` : ''}${r.of ? ` of=${r.of}` : ''}${r.polarity ? ` polarity=${r.polarity}` : ''}`
      + `${roles.map((x) => ` role=${x}`).join('')} frame=${f} text=${q(r.text)} core.source="${SRC}"`);
  }
  out.push('', '# the verbs and phrases that say a key, read by acts.state.verb and acts.state.phrase');
  out.push(`@w.lang.en.lex.attribute.verb w.lang.en.lex name=attribute.verb doc="the verbs that say a key of the catalog: {thing} <verb> {value}" ${lex.verb.map((x) => `item=${q(x)}`).join(' ')} core.source="${SRC}"`);
  out.push(`@w.lang.en.lex.attribute.phrase w.lang.en.lex name=attribute.phrase doc="the phrases after is that say a key of the catalog: {thing} is <phrase> {value}" ${lex.phrase.map((x) => `item=${q(x)}`).join(' ')} core.source="${SRC}"`);
  out.push('', '# the frames that read a statement of a fact as the act change (set) with thing, attribute and value');
  for (const [name, pr, roles, ex, parts] of FRAMES) {
    out.push(`@w.lang.en.frame.${name} w.lang.en.frame name=${name} act=change mode=set set=acts.state priority=${pr} needs=state ${roles.map((x) => `role=${x}`).join(' ')} example=${q(ex)} core.source="${SRC}"`);
    parts.forEach((p, i) => {
      const attrs = Object.entries(p).flatMap(([k, v]) => [].concat(v).map((x) => `${k}=${k === 'word' ? q(x) : x}`)).join(' ');
      out.push(`@w.lang.en.part.${name}.${i + 1} w.lang.en.part frame=${name} at=${i + 1} ${attrs} core.source="${SRC}"`);
    });
  }
  return `${out.join('\n')}\n`;
}

if (process.argv[1]?.endsWith('lang-en-phrasing.mjs')) {
  const text = phrasingShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en/shards/templates-phrasing.sop'), text);
  console.log(`templates-phrasing: ${DEFAULTS.length} form templates, ${KEYS.length} key templates, ${FRAMES.length} frames; lexicons ${JSON.stringify(lexiconItems())}`);
}
