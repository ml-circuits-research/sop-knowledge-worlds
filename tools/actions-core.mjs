// The hand-written core of k.actions (R7.2): common verbs with who does it, to what, with what, where, the result,
// the opposite and what undoes it.
//   node tools/actions-core.mjs     writes docs/worlds/k.actions/shards/actions-<group>.sop
// The forms of the verbs are w.lang.en's (KR2); see unconfirmedForms.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';
import { ACTIONS, EFFECTS } from './actions-data.mjs';
import { formChecker } from './forms-report.mjs';

const SRC = 'hand-core 1';
const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const GROUPS = { move: 'moving oneself', hands: 'handling a thing', make: 'making', change: 'changing a thing', sense: 'the senses', mind: 'the mind', talk: 'speech, sounds and signs', body: 'the body', social: 'with others', nature: 'what weather, plants and things do' };
// Shards: groups put together so that no shard is tiny.
const SHARDS = { move: 'move', hands: 'hands', make: 'make-change', change: 'make-change', sense: 'mind-talk', mind: 'mind-talk', talk: 'mind-talk', body: 'body-social-nature', social: 'body-social-nature', nature: 'body-social-nature' };

// The forms of a verb (third person, past, -ing) have one home, w.lang.en (KR2, reviewer 16:45): a form the pinned
// library confirms there (tools/forms-report.mjs: analyse or inflectBy; for a phrase, its first word and the same
// particle) is not written here; only a form the data gives and w.lang.en does not confirm stays (wetted).
let checker = null;
export function unconfirmedForms(name, given = {}) {
  checker ??= formChecker();
  const head = name.split(' ')[0], rest = name.split(' ').slice(1).join(' ');
  return Object.values(given).filter((f) => !(checker(name, f) || (rest && f.split(' ').slice(1).join(' ') === rest && checker(head, f.split(' ')[0]))));
}

export function actionShards() {
  const names = new Set(ACTIONS.map((a) => a[0]));
  if (names.size !== ACTIONS.length) throw new Error('an action is there twice');
  for (const v of Object.keys(EFFECTS)) if (!names.has(v)) throw new Error(`effect of ${v}: no such action`);
  const byShard = new Map();
  for (const [name, group, who, object, tool, where, result, opposite, undone, example, similar, forms] of ACTIONS) {
    if (!GROUPS[group]) throw new Error(`${name}: group ${group}`);
    for (const v of [opposite, undone]) if (v && (!names.has(v) || v === name)) throw new Error(`${name}: ${v} is not another action`);
    const s = SHARDS[group];
    if (!byShard.has(s)) byShard.set(s, { actions: [], words: [], similar: [], groups: new Set() });
    const b = byShard.get(s);
    b.groups.add(group);
    b.actions.push(wire(`k.actions.action.${seg(name)}`, 'k.actions.action', [['name', name], ['group', group], ...list(who).map((v) => ['who', v]), ...list(object).map((v) => ['object', v]), ...list(tool).map((v) => ['tool', v]),
      ...list(where).map((v) => ['where', v]), ['result', text(result)], ['holds', EFFECTS[name]?.holds], ['money', EFFECTS[name]?.money], ['opposite', opposite], ['undone_by', undone], ['example', text(example)]], SRC));
    const kept = [...new Set(unconfirmedForms(name, forms))];
    if (kept.length) b.words.push(wire(`k.actions.word.action.${seg(name)}`, 'core.word', [...kept.map((f) => ['text', f]), ['means', name], ['of', 'k.actions.action.name']], SRC));
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
      about: `${b.actions.length} actions of ${[...b.groups].map((g) => GROUPS[g]).join('; ')}: who or what does it, to what, with what, where, what comes of it, the opposite and what undoes it, an example; a form of a verb w.lang.en does not have (wetted); and ${b.similar.length} verbs and phrases that mean nearly the same.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/actions-data.mjs)'],
      license: 'CC0-1.0', script: 'tools/actions-core.mjs',
    })}\n${b.actions.join('\n')}\n\n# Words: the forms of a verb that w.lang.en does not confirm (its forms are w.lang.en's, KR2).\n${b.words.join('\n')}\n\n# Verbs and phrases that mean nearly the same as an action, or a kind of it.\n${b.similar.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = actionShards();
  writeShards(join(WORLDS_DIR, 'k.actions', 'shards'), files, 'actions-');
  console.log(`${ACTIONS.length} actions\n${Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n')}`);
}
