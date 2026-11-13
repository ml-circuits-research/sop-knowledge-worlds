// k.actions, the words of the acts (Round 8, item 1): 14 acts, the roles each takes with the prepositions that mark
// them, and the English verbs and phrasal verbs that mean each act.
//   node tools/acts-core.mjs             writes docs/worlds/k.actions/shards/acts.sop and verbs-*.sop
//   node tools/acts-core.mjs --glosses   rewrites sources/wordnet/act-verb-glosses.tsv from the raw WordNet files
// The verbs are the rows of sources/hand-core/act-verbs.tsv (act, verb, the WordNet verb senses of the verb that
// were read and mean the act, the role of the object, and what the verb itself says). The glosses of those senses
// are in sources/wordnet/act-verb-glosses.tsv, so the shards are built without the raw files.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const HAND = 'hand-core 1';
const WN = 'wordnet 3.1';
export const VERBS_TSV = join(REPO, 'sources', 'hand-core', 'act-verbs.tsv');
export const GLOSSES_TSV = join(REPO, 'sources', 'wordnet', 'act-verb-glosses.tsv');
const RAW = join(REPO, 'sources', 'wordnet', 'raw', 'wordnet31');

// Prepositions that say where: they mark the place of an act.
export const WHERE = ['on', 'in', 'at', 'onto', 'into', 'to', 'under', 'above', 'below', 'over', 'behind', 'beside', 'near', 'between',
  'inside', 'outside', 'around', 'next to', 'close to', 'in front of', 'on top of', 'to the left of', 'to the right of', 'in the middle of'];

// An act: [name, about, opposite, roles]. A role: [name, holds, needed, about, markers].
export const ACTS = [
  ['make', 'bring a new thing into being', 'remove', [
    ['kind', 'kind', true, 'what kind of thing to make', []],
    ['number', 'number', false, 'how many to make', []],
    ['place', 'place', false, 'where the new thing goes', WHERE],
    ['value', 'value', false, 'a value the new thing has, such as its colour', ['in']],
    ['part', 'thing', false, 'a part the new thing has', ['with']],
    ['material', 'thing', false, 'what it is made from', ['from', 'out of', 'of']],
  ]],
  ['remove', 'take a thing away so that it is no longer there', 'make', [
    ['thing', 'thing', true, 'what to remove', []],
    ['source', 'thing', false, 'what it is removed from', ['from', 'out of', 'off']],
  ]],
  ['change', 'give a thing another value of one of its attributes, or put another thing in its place', undefined, [
    ['thing', 'thing', true, 'what to change', ['of']],
    ['attribute', 'attribute', false, 'which attribute changes', []],
    ['value', 'value', false, 'the new value', ['to', 'into']],
    ['old value', 'value', false, 'the value before', ['from']],
    ['amount', 'amount', false, 'by how much', ['by']],
    ['replacement', 'thing', false, 'the thing that takes its place', ['with', 'by', 'for']],
  ]],
  ['place', 'put a thing somewhere, or move it to another place', undefined, [
    ['thing', 'thing', true, 'what to place', []],
    ['place', 'place', false, 'where it goes', WHERE],
    ['direction', 'direction', false, 'which way it moves', ['towards']],
    ['source', 'place', false, 'where it was', ['from', 'off', 'out of']],
    ['amount', 'amount', false, 'how far', ['by']],
  ]],
  ['connect', 'join two things so that they stay together or a line runs between them', 'take apart', [
    ['thing', 'thing', true, 'the first thing', []],
    ['target', 'thing', false, 'the thing it is joined to', ['to', 'with', 'and', 'onto']],
    ['tool', 'thing', false, 'what joins them', ['by', 'using', 'by means of']],
  ]],
  ['group', 'put several things together as one group, or in an order', 'take apart', [
    ['thing', 'thing', true, 'the things to group', []],
    ['target', 'thing', false, 'what they are grouped with', ['with', 'and']],
    ['group', 'group', false, 'the group or groups they go into', ['into', 'in', 'as']],
    ['criterion', 'attribute', false, 'what decides the group or the order', ['by', 'according to']],
  ]],
  ['take apart', 'separate a thing into its parts, or one thing from another', 'connect', [
    ['thing', 'thing', true, 'what to take apart', []],
    ['parts', 'group', false, 'the pieces it becomes', ['into', 'in']],
    ['source', 'thing', false, 'what it is separated from', ['from', 'off']],
    ['tool', 'thing', false, 'what it is separated with', ['with', 'using']],
  ]],
  ['pick', 'choose one or some things out of several, to act on them next', 'deselect', [
    ['thing', 'thing', true, 'what is picked', []],
    ['source', 'group', false, 'what it is picked from', ['from', 'out of', 'among']],
    ['other', 'thing', false, 'what is not picked', ['over', 'instead of', 'rather than']],
  ]],
  ['ask', 'want to know something about the things that are there', undefined, [
    ['topic', 'topic', false, 'what the question is about', ['about']],
    ['thing', 'thing', false, 'the thing asked for', ['for']],
    ['place', 'place', false, 'where to look', [...WHERE, 'by']],
    ['other', 'thing', false, 'a second thing, for a comparison', ['with', 'to', 'and']],
  ]],
  ['copy', 'make another thing that is the same as one that is there', undefined, [
    ['thing', 'thing', true, 'what to copy', []],
    ['number', 'number', false, 'how many copies', []],
    ['place', 'place', false, 'where the copy goes', WHERE],
  ]],
  ['send', 'let someone else have the thing, or put it out of the application', undefined, [
    ['thing', 'thing', true, 'what to send', []],
    ['recipient', 'person', false, 'who gets it', ['to']],
    ['means', 'means', false, 'how it is sent', ['by', 'via', 'through']],
    ['format', 'value', false, 'as what it is sent', ['as']],
  ]],
  ['undo', 'take back what was done last, so that things are as before', 'redo', [
    ['thing', 'thing', false, 'what was done and is taken back', []],
    ['number', 'number', false, 'how many steps', []],
    ['state', 'value', false, 'the earlier state to return to', ['to']],
  ]],
  ['save', 'keep the work so that it can be brought back later', 'load', [
    ['thing', 'thing', false, 'what to keep', []],
    ['name', 'name', false, 'the name it is kept under', ['as', 'under']],
    ['place', 'place', false, 'where it is kept', ['to', 'in', 'on']],
    ['format', 'value', false, 'in what form it is kept, such as a kind of file', ['as', 'in']],
  ]],
  ['load', 'bring back work that was kept', 'save', [
    ['thing', 'thing', true, 'what to bring back', []],
    ['source', 'place', false, 'where it was kept', ['from']],
  ]],
  // From the PSys2 hand-over k.actions-missing.md: the opposite of undo, and the opposite of pick (nothing picked).
  ['redo', 'do again what was taken back by undo', 'undo', [
    ['thing', 'thing', false, 'what was taken back and is done again', []],
    ['number', 'number', false, 'how many steps', []],
  ]],
  ['deselect', 'leave off picking a thing, so that it is no longer picked; with no thing, nothing is picked', 'pick', [
    ['thing', 'thing', false, 'what is no longer picked; none: all of them', []],
  ]],
];

const byName = new Map(ACTS.map((a) => [a[0], a]));
const tsv = (path) => readFileSync(path, 'utf8').split('\n').filter((l) => l.trim()).slice(1).map((l) => l.split('\t'));

// The rows of the table of verbs: { act, text, senses, object, complement, attribute, value, separable, after, marks }.
export function readVerbs() {
  return tsv(VERBS_TSV).map(([act, verb, senses, object, complement, attribute, value, separable, after, marks]) => ({
    act, text: verb, senses: (senses ?? '').split(' ').filter(Boolean).map(Number), object, complement, attribute, value,
    separable: separable === 'yes', after,
    marks: (marks ?? '').split(';').map((m) => m.trim()).filter(Boolean).map((m) => m.split('>')),
  }));
}

// verb + sense number -> the definition part of the gloss.
export function readGlosses() {
  return new Map(tsv(GLOSSES_TSV).map(([verb, n, gloss]) => [`${verb} ${n}`, gloss]));
}

// The table of glosses, read from the raw WordNet files (only for the senses the table of verbs names).
export async function glossesFromRaw() {
  const { readData, readIndex, shortGloss } = await import('./import/wordnet.mjs');
  const data = readData(readFileSync(join(RAW, 'data.verb'), 'utf8'));
  const index = readIndex(readFileSync(join(RAW, 'index.verb'), 'utf8'));
  const lines = ['verb\tsense\tgloss'];
  const seen = new Set();
  for (const v of readVerbs()) for (const n of v.senses) {
    if (seen.has(`${v.text} ${n}`)) continue;
    seen.add(`${v.text} ${n}`);
    const synset = data.get(index.get(v.text.replace(/ /g, '_'))?.[n - 1]);
    if (!synset) throw new Error(`WordNet has no verb sense ${n} of "${v.text}"`);
    lines.push(`${v.text}\t${n}\t${shortGloss(synset.gloss)}`);
  }
  return `${lines.join('\n')}\n`;
}

export function actShards() {
  const verbs = readVerbs();
  const glosses = readGlosses();
  const acts = [], roles = [];
  for (const [name, about, opposite, rs] of ACTS) {
    acts.push(wire(`k.actions.act.${seg(name)}`, 'k.actions.act', [['name', name], ['about', text(about)], ['opposite', opposite], ...rs.map((r) => ['role', r[0]])], HAND));
    for (const [role, holds, needed, what, markers] of rs) {
      roles.push(wire(`k.actions.role.${seg(name)}.${seg(role)}`, 'k.actions.role', [['act', name], ['name', role], ['holds', holds], ['needed', needed ? 'true' : undefined],
        ['about', text(what)], ...markers.map((m) => ['marker', m])], HAND));
    }
  }
  const files = {
    'acts.sop': `${header({
      id: 'k.actions/shards/acts',
      about: `the ${ACTS.length} acts (${ACTS.map((a) => a[0]).join(', ')}), and the roles each act takes with the prepositions that usually mark them.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/acts-core.mjs)'], license: 'CC0-1.0', script: 'tools/acts-core.mjs',
    })}\n${acts.join('\n')}\n\n# Roles: what an act can be told, what kind of filler each takes, and the words that mark it.\n${roles.join('\n')}\n`,
  };
  for (const [act] of ACTS) {
    const mine = verbs.filter((v) => v.act === act);
    const lines = [], marks = [];
    for (const v of mine) {
      const fromWordnet = v.senses.length > 0;
      const id = `${seg(act)}.${seg(v.text)}`;
      lines.push(wire(`k.actions.verb.${id}`, 'k.actions.verb', [['text', v.text], ['act', act], ...v.senses.map((n) => ['sense', n]),
        ['gloss', fromWordnet ? text(glosses.get(`${v.text} ${v.senses[0]}`) ?? (() => { throw new Error(`no gloss for ${v.text} ${v.senses[0]}; run node tools/acts-core.mjs --glosses`); })()) : undefined],
        ['object', v.object], ['complement', v.complement], ['attribute', v.attribute], ['value', v.value],
        ['separable', v.separable ? 'true' : undefined], ['after_particle', v.after], ['named', fromWordnet ? 'model' : undefined]], fromWordnet ? WN : HAND));
      for (const [marker, role] of v.marks) {
        marks.push(wire(`k.actions.marking.${id}.${seg(marker)}`, 'k.actions.marking', [['verb', v.text], ['act', act], ['marker', marker], ['role', role]], HAND));
      }
    }
    const hand = mine.filter((v) => !v.senses.length).length;
    files[`verbs-${seg(act)}.sop`] = `${header({
      id: `k.actions/shards/verbs-${seg(act)}`,
      about: `${mine.length} verbs and phrasal verbs that mean the act "${act}" (${mine.slice(0, 8).map((v) => v.text).join(', ')} ...): the WordNet senses read for it, the role of the object, what the verb itself says, and the prepositions that mark a role after this verb.`,
      sources: [`wordnet 3.1 (Princeton WordNet 3.1: the verb, its sense numbers and the gloss of ${mine.length - hand} verbs; which act a sense means and the roles are a language model's reading, named=model)`,
        `hand-core 1 (hand-written in this repository: ${hand} verbs that WordNet does not list in this meaning, and the markings; sources/hand-core/act-verbs.tsv)`],
      license: 'WordNet-3.0', script: 'tools/acts-core.mjs',
    })}\n${lines.join('\n')}\n${marks.length ? `\n# Markings: after this verb, the word marks the role.\n${marks.join('\n')}\n` : ''}`;
  }
  return files;
}

// Checks that need no world: every act of the table exists, every role named is a role of the act.
export function checkVerbs() {
  const errors = [];
  for (const v of readVerbs()) {
    const act = byName.get(v.act);
    if (!act) { errors.push(`${v.text}: no act ${v.act}`); continue; }
    const roles = new Set(act[3].map((r) => r[0]));
    for (const r of [v.object, v.complement, v.after, ...v.marks.map((m) => m[1])]) if (r && !roles.has(r)) errors.push(`${v.act} ${v.text}: no role ${r}`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--glosses')) {
    writeFileSync(GLOSSES_TSV, await glossesFromRaw());
    console.log(`glosses: ${readGlosses().size}`);
  }
  const errors = checkVerbs();
  if (errors.length) { for (const e of errors) console.error(e); process.exit(1); }
  if (!existsSync(GLOSSES_TSV)) { console.error('no glosses: run with --glosses'); process.exit(1); }
  writeShards(join(WORLDS_DIR, 'k.actions', 'shards'), actShards(), 'acts');
  writeShards(join(WORLDS_DIR, 'k.actions', 'shards'), Object.fromEntries(Object.entries(actShards()).filter(([n]) => n.startsWith('verbs-'))), 'verbs-');
  console.log(`${ACTS.length} acts, ${readVerbs().length} verbs`);
}
