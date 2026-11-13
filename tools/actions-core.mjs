// The hand-written core of k.actions (R7.2): common verbs with who does it, to what, with what, where, the result,
// the opposite and what undoes it.
//   node tools/actions-core.mjs     writes docs/worlds/k.actions/shards/actions-<group>.sop; prints the forms with --forms
// The other forms of a verb (third person, past, -ing) are worked out by rule unless the data gives them; all of
// them were read (the list printed by --forms).
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';
import { ACTIONS } from './actions-data.mjs';

const SRC = 'hand-core 1';
const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const GROUPS = { move: 'moving oneself', hands: 'handling a thing', make: 'making', change: 'changing a thing', sense: 'the senses', mind: 'the mind', talk: 'speech, sounds and signs', body: 'the body', social: 'with others', nature: 'what weather, plants and things do' };
// Shards: groups put together so that no shard is tiny.
const SHARDS = { move: 'move', hands: 'hands', make: 'make-change', change: 'make-change', sense: 'mind-talk', mind: 'mind-talk', talk: 'mind-talk', body: 'body-social-nature', social: 'body-social-nature', nature: 'body-social-nature' };

// The third person, the past and the -ing form of a verb (the first word of a phrase is the verb).
export function formsOf(verb, given = {}) {
  const third = /(s|x|z|ch|sh|o)$/.test(verb) ? `${verb}es` : /[^aeiou]y$/.test(verb) ? `${verb.slice(0, -1)}ies` : `${verb}s`;
  const past = verb.endsWith('e') ? `${verb}d` : /[^aeiou]y$/.test(verb) ? `${verb.slice(0, -1)}ied` : `${verb}ed`;
  const ing = verb.endsWith('ie') ? `${verb.slice(0, -2)}ying` : verb.endsWith('e') && !/(ee|ye|oe)$/.test(verb) ? `${verb.slice(0, -1)}ing` : `${verb}ing`;
  if (verb.includes(' ') && !(given.third && given.past && given.ing)) throw new Error(`${verb}: a phrase needs its three forms`);
  return [given.third ?? third, given.past ?? past, given.ing ?? ing];
}

export function actionShards() {
  const names = new Set(ACTIONS.map((a) => a[0]));
  if (names.size !== ACTIONS.length) throw new Error('an action is there twice');
  const byShard = new Map();
  for (const [name, group, who, object, tool, where, result, opposite, undone, example, similar, forms] of ACTIONS) {
    if (!GROUPS[group]) throw new Error(`${name}: group ${group}`);
    for (const v of [opposite, undone]) if (v && (!names.has(v) || v === name)) throw new Error(`${name}: ${v} is not another action`);
    const s = SHARDS[group];
    if (!byShard.has(s)) byShard.set(s, { actions: [], words: [], similar: [], groups: new Set() });
    const b = byShard.get(s);
    b.groups.add(group);
    b.actions.push(wire(`k.actions.action.${seg(name)}`, 'k.actions.action', [['name', name], ['group', group], ...list(who).map((v) => ['who', v]), ...list(object).map((v) => ['object', v]), ...list(tool).map((v) => ['tool', v]),
      ...list(where).map((v) => ['where', v]), ['result', text(result)], ['opposite', opposite], ['undone_by', undone], ['example', text(example)]], SRC));
    b.words.push(wire(`k.actions.word.action.${seg(name)}`, 'core.word', [...[...new Set(formsOf(name, forms))].filter((f) => f !== name).map((f) => ['text', f]), ['means', name], ['of', 'k.actions.action.name']], SRC));
    for (const w of list(similar)) {
      if (names.has(w)) continue; // a verb that is an action itself stands for itself (hop is not listed under jump)
      b.similar.push(wire(`k.actions.similar.${seg(w)}.${seg(name)}`, 'k.actions.similar', [['name', w], ['action', name]], SRC));
    }
  }
  const files = {};
  for (const [s, b] of byShard) {
    const id = `actions-${s}`;
    files[`${id}.sop`] = `${header({
      id: `k.actions/shards/${id}`,
      about: `${b.actions.length} actions of ${[...b.groups].map((g) => GROUPS[g]).join('; ')}: who or what does it, to what, with what, where, what comes of it, the opposite and what undoes it, an example; the other forms of the verbs; and ${b.similar.length} verbs and phrases that mean nearly the same.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/actions-data.mjs)'],
      license: 'CC0-1.0', script: 'tools/actions-core.mjs',
    })}\n${b.actions.join('\n')}\n\n# Words: the other forms of the verbs.\n${b.words.join('\n')}\n\n# Verbs and phrases that mean nearly the same as an action, or a kind of it.\n${b.similar.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--forms')) { for (const a of ACTIONS) console.log(`${a[0]}: ${formsOf(a[0], a[11]).join(', ')}`); process.exit(0); }
  const files = actionShards();
  writeShards(join(WORLDS_DIR, 'k.actions', 'shards'), files, 'actions-');
  console.log(`${ACTIONS.length} actions\n${Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n')}`);
}
