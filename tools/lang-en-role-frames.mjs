// Q64 (reviewer block 2026-11-15 03:45): frames written in this repository, in w.lang.en's frame format.
//  1. one general frame for each role of k.actions that no general frame read (29 roles: make.part, make.material,
//     make.topic, change.old value, change.replacement, place.direction, place.source, connect.tool, group.target,
//     group.group, group.criterion, take apart.parts / source / tool, pick.source, pick.other, ask.other, copy.place,
//     send.means, send.format, undo.thing / number / state, save.thing, save.place, load.source, redo.thing / number,
//     deselect.thing), each built from the role's markers in k.actions ("make a boat out of paper": material by "out
//     of"; "replace the hat with a crown": replacement by "with");
//  2. the nine frames of PSys2's src/lang/en.local.mjs that did not read their own example, fixed here and kept here
//     (one home: tools/import/psys2-lang-en.mjs MOVED_HERE leaves them out of the import, PSys2 deletes its copies).
//   node tools/lang-en-role-frames.mjs     writes docs/worlds/w.lang.en/shards/role-frames.sop
// Deterministic: no input but this file. tests/w.lang.en.frames.test.mjs reads every frame's example in its world.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text } from './import/lib.mjs';

const SRC = 'hand-core 1';
// parts: lead (polite lead, optional), verb <act>, det (optional), role <role> [takes], word [words] (optional?)
const lead = ['lead'], det = ['det'];
const verb = (act) => ['verb', act];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
// The general frames of the roles: [name, act, mode, priority, k.actions role it asks for, example, parts].
const P = 12;
export const ROLE_FRAMES = [
  ['acts.make.part', 'make', undefined, P, 'make.part', 'Draw a house with a red door.', [lead, verb('make'), det, role('thing'), word(['with', 'that has', 'which has']), det, role('part')]],
  ['acts.make.material', 'make', undefined, P, 'make.material', 'Make a boat out of paper.', [lead, verb('make'), det, role('thing'), word(['out of', 'from', 'made of', 'made from']), det, role('material')]],
  ['acts.make.topic', 'make', undefined, P, 'make.topic', 'Make a chart about sales.', [lead, verb('make'), det, role('thing'), word(['about', 'on the topic of']), det, role('topic')]],
  ['acts.change.from', 'change', undefined, P, 'change.old value', 'Change the car from red to blue.', [lead, verb('change'), det, role('thing'), word(['from']), role('old'), word(['to', 'into']), role('value')]],
  ['acts.change.replace', 'change', 'replace', 11, 'change.replacement', 'Replace the hat with a crown.', [lead, word(['replace', 'swap', 'substitute', 'exchange', 'switch']), det, role('thing'), word(['with', 'by', 'for']), det, role('replacement')]],
  ['acts.place.towards', 'place', undefined, 13, 'place.direction', 'Move the car towards the house.', [lead, verb('place'), det, role('thing'), word(['towards', 'toward', 'in the direction of']), det, role('direction')]],
  ['acts.place.from', 'place', undefined, 13, 'place.source', 'Move the cat from the sofa to the bed.', [lead, verb('place'), det, role('thing'), word(['from', 'off', 'out of']), det, role('source'), role('rel', 'prep'), det, role('place')]],
  ['acts.connect.tool', 'connect', undefined, P, 'connect.tool', 'Connect the boxes using a line.', [lead, verb('connect'), det, role('thing'), word(['using', 'by means of', 'by', 'with']), det, role('tool')]],
  ['acts.group.with', 'group', 'group', P, 'group.target', 'Group the cat with the dog.', [lead, verb('group'), det, role('thing'), word(['with', 'and']), det, role('target')]],
  ['acts.group.into', 'group', 'group', P, 'group.group', 'Group the guests into teams.', [lead, verb('group'), det, role('thing'), word(['into', 'in', 'as']), det, role('group')]],
  ['acts.group.by', 'group', 'group', P, 'group.criterion', 'Sort the guests by colour.', [lead, verb('group'), det, role('thing'), word(['by', 'according to']), det, role('criterion')]],
  ['acts.apart.into', 'group', 'apart', 14, 'take apart.parts', 'Cut the cake into slices.', [lead, verb('take apart'), det, role('thing'), word(['into', 'in']), det, role('parts')]],
  ['acts.apart.from', 'group', 'apart', 14, 'take apart.source', 'Detach the wheel from the car.', [lead, verb('take apart'), det, role('thing'), word(['from', 'off']), det, role('source')]],
  ['acts.apart.with', 'group', 'apart', 14, 'take apart.tool', 'Cut the paper with scissors.', [lead, verb('take apart'), det, role('thing'), word(['with', 'using']), det, role('tool')]],
  ['acts.pick.from', 'pick', undefined, P, 'pick.source', 'Pick a card from the deck.', [lead, verb('pick'), det, role('thing'), word(['from', 'out of', 'among']), det, role('source')]],
  ['acts.pick.over', 'pick', undefined, P, 'pick.other', 'Pick the cat instead of the dog.', [lead, verb('pick'), det, role('thing'), word(['over', 'instead of', 'rather than']), det, role('other')]],
  ['acts.ask.compare', 'ask', 'compare', P, 'ask.other', 'Compare the cat with the dog.', [lead, word(['compare']), det, role('thing'), word(['with', 'to', 'and']), det, role('other')]],
  ['acts.copy.place', 'copy', undefined, P, 'copy.place', 'Copy the star to the corner.', [lead, verb('copy'), det, role('thing'), role('rel', 'prep'), det, role('place')]],
  ['acts.send.by', 'send', undefined, P, 'send.means', 'Send the picture by email.', [lead, verb('send'), det, role('thing'), word(['by', 'via', 'through']), det, role('means')]],
  ['acts.send.as', 'send', undefined, P, 'send.format', 'Send the chart as a PDF.', [lead, verb('send'), det, role('thing'), word(['as']), det, role('format')]],
  ['acts.undo.thing', 'undo', undefined, 9, 'undo.thing', 'Undo the colour change.', [lead, verb('undo'), det, role('thing')]],
  ['acts.undo.number', 'undo', undefined, 13, 'undo.number', 'Undo 3 steps.', [lead, verb('undo'), role('number', 'number'), word(['steps', 'step', 'changes', 'change', 'times', 'things', 'actions'])]],
  ['acts.undo.state', 'undo', undefined, 13, 'undo.state', 'Go back to the start.', [lead, verb('undo'), word(['to', 'back to']), det, role('state')]],
  ['acts.save.thing', 'save', undefined, 10, 'save.thing', 'Save the drawing as lunch.', [lead, verb('save'), det, role('thing'), word(['as', 'under', 'called']), role('name')]],
  ['acts.save.place', 'save', undefined, 10, 'save.place', 'Save the drawing to my files.', [lead, verb('save'), det, role('thing'), word(['to', 'in', 'on', 'into']), det, role('place')]],
  ['acts.load.from', 'load', undefined, 11, 'load.source', 'Load lunch from my files.', [lead, verb('load'), det, role('value'), word(['from']), det, role('source')]],
  ['acts.redo.thing', 'redo', undefined, 9, 'redo.thing', 'Redo the colour change.', [lead, verb('redo'), det, role('thing')]],
  ['acts.redo.number', 'redo', undefined, 13, 'redo.number', 'Redo 2 steps.', [lead, verb('redo'), role('number', 'number'), word(['steps', 'step', 'changes', 'change', 'times', 'things', 'actions'])]],
  ['acts.deselect', 'pick', 'none', P, 'deselect.thing', 'Deselect the circle.', [lead, verb('deselect'), det, role('thing')]],
];
// Role maps the frames above need (a frame role whose name is not the k.actions role).
export const ROLE_MAPS = [
  ['change.old', 'change', 'old', 'old value', 'acts.change.from', 'Change the car from red to blue: red is the value before'],
  ['copy.rel.prep', 'copy', 'rel', 'place', undefined, 'Copy the star to the corner: to marks the place', 'prep'],
];

// The nine frames of PSys2's local file, fixed: [name, act, mode, set, priority, needs, roles, example, parts, fixed, why].
export const MOVED_HERE = [
  ['acts.facts.ask.what.in.lead', 'ask', 'what', 'acts.facts', 13, 'facts', ['attribute', 'thing'], 'Can you say what continent Egypt is in?',
    [lead, word(['can you say', 'can you tell me', 'can u tell me', 'tell me', 'do you know', 'let me know']), word(['what', 'which']), role('attribute', 'lexicon', { lexicon: 'attribute' }), det, role('thing'), word(['is', 'are']), word(['in', 'part of', 'from', 'on'])],
    null, 'the thing stands before "is", as the example says it (it stood after "is")'],
  ['acts.media.m.pick.play.bare', 'pick', 'play', 'acts.media', 8, 'playable', [], 'Play.',
    [lead, word(['play', 'play something', 'play some music', 'play music', 'put some music on', 'put on some music', 'play a song', 'music', 'surprise me', 'i want to hear some music', 'i want some music', 'i wanna hear some music', 'i want to hear something', 'play me something', 'play me a song']), word(['please', 'pls', 'plz', 'now', 'for me'], true)],
    null, 'the bare verb "play" is one of its words'],
  ['acts.media.m.pick.again', 'pick', 'again', 'acts.media', 15, 'playable', [], 'Play it again.',
    [lead, word(['again', 'replay', 'play again', 'play it again', 'play that again', 'once more', 'one more time', 'one more go', 'go again', 'one more', 'encore', 'repeat that', 'repeat it', 'do it again', 'run it again', 'say it again', 'another go', 'another time', 'one more round', 'the same again', 'the same one', 'same again']), word(['please', 'pls', 'plz', 'now'], true)],
    null, 'priority 15, over acts.media.m.pick.play (14), which took "it again" as the thing'],
  ['acts.media.m.pick.play.kind.of', 'pick', 'play', 'acts.media', 15, 'playable', ['kind', 'thing'], 'Scale of F major please.',
    [lead, det, role('kind', 'lexicon', { lexicon: 'kind' }), word(['of', 'in', 'for', 'on', 'from']), role('thing'), word(['please', 'pls', 'plz', 'now', 'for me'], true)],
    null, 'priority 15, over acts.media.m.make.melody.colon (14); a closing "please", as its example says'],
  ['acts.media.m.pick.play.kind.bare', 'pick', 'play', 'acts.media', 15, 'playable', ['kind'], 'Scale please.',
    [lead, det, role('kind', 'lexicon', { lexicon: 'kind' }), word(['please', 'pls', 'plz', 'now', 'for me'], true)],
    null, 'priority 15, over acts.media.m.make.melody.colon (14)'],
  ['acts.text.make.blank', 'make', 'blank', 'acts.text', 13, 'textual', ['thing'], 'Start a new chapter.',
    [lead, word(['start', 'begin', 'add', 'insert', 'create', 'make', 'open'], true), det, word(['new', 'next', 'blank', 'empty', 'another', 'fresh']), role('thing', 'lexicon', { lexicon: 'kind' })],
    null, 'priority 13, over acts.text.make.kind (12), which read "new chapter" with the mode text'],
  ['acts.text.make.numbered', 'make', 'numbered', 'acts.text', 14, 'textual', ['thing', 'amount', 'value'], 'Chapter 3: The Return.',
    [lead, role('thing', 'lexicon', { lexicon: 'kind' }), role('amount', 'number'), role('value', 'rest', { optional: true })],
    null, 'priority 14, over acts.text.make.text (13), which took "3: The Return" as the text'],
  ['acts.text.make.blank.at', 'make', 'blank', 'acts.text', 14, 'textual', ['thing', 'rel', 'place'], 'Insert a new line after the title.',
    [lead, word(['start', 'begin', 'add', 'insert', 'create', 'make', 'put'], true), det, word(['new', 'next', 'blank', 'empty', 'another', 'fresh'], true), role('thing', 'lexicon', { lexicon: 'kind' }), role('rel', 'prep'), det, role('place')],
    null, 'priority 14, over acts.text.make.text (13), which took "after the title" as the text'],
  ['acts.facts.layer.on.want.pin', 'pick', undefined, 'acts.facts', 15, 'facts', ['thing'], 'I want a flag on Berlin.',
    [lead, word(['i want', 'i would like', "i'd like", 'can you get', 'get', 'have', 'keep', "let's have"]), word(['a', 'the'], true), word(['flag', 'marker', 'pin']), word(['on', 'at', 'for'], true), det, role('thing')],
    { what: 'pin' }, 'priority 15, over acts.facts.layer.on.pin.verb (14), which took "on Berlin" as the thing'],
];

function frameLines(name, { act, mode, set, priority, needs, roles, example }, parts, fixed = {}) {
  const lines = [wire(`w.lang.en.frame.${name}`, 'w.lang.en.frame', [['name', name], ['act', act], ['mode', mode], ['set', set], ['priority', priority], ['needs', needs], ...roles.map((r) => ['role', r]), ['example', text(example)]], SRC)];
  parts.forEach(([is, a, b, c], i) => {
    const e = [['frame', name], ['at', i + 1]];
    if (is === 'lead') e.push(['is', 'lead'], ['phrase', 'lead.polite'], ['optional', 'yes']);
    else if (is === 'det') e.push(['is', 'det'], ['optional', 'yes']);
    else if (is === 'verb') e.push(['is', 'verb'], ['act', /\s/.test(a) ? text(a) : a]);
    else if (is === 'word') { e.push(['is', 'word'], ...a.map((w) => ['word', text(w)])); if (b) e.push(['optional', 'yes']); }
    else if (is === 'role') { e.push(['is', 'role'], ['role', a], ['takes', b]); if (c.lexicon) e.push(['lexicon', c.lexicon]); if (c.optional) e.push(['optional', 'yes']); }
    lines.push(wire(`w.lang.en.part.${name}.${i + 1}`, 'w.lang.en.part', e, SRC));
  });
  for (const [r, v] of Object.entries(fixed ?? {})) lines.push(wire(`w.lang.en.fixed.${name}.${r}`, 'w.lang.en.fixed', [['frame', name], ['role', r], ['value', text(v)]], SRC));
  return lines;
}
const rolesOf = (parts) => [...new Set(parts.filter((p) => p[0] === 'role').map((p) => p[1]))];

export function roleFrameShard() {
  const a = ROLE_FRAMES.flatMap(([name, act, mode, priority, asks, example, parts]) => [`# ${asks}`, ...frameLines(name, { act, mode, set: 'acts', priority, roles: rolesOf(parts), example }, parts)]);
  const maps = ROLE_MAPS.map(([n, act, r, actRole, frame, doc, takes]) => wire(`w.lang.en.role_map.${n}`, 'w.lang.en.role_map', [['name', n], ['act', act], ['role', r], ['takes', takes], ['act_role', /\s/.test(actRole) ? text(actRole) : actRole], ['frame', frame], ...(r === 'rel' ? [['marker', 'yes']] : []), ['doc', text(doc)]], SRC));
  const b = MOVED_HERE.flatMap(([name, act, mode, set, priority, needs, roles, example, parts, fixed, why]) => [`# ${name}: ${why}`, ...frameLines(name, { act, mode, set, priority, needs, roles, example }, parts, fixed)]);
  return `${header({ id: 'w.lang.en/shards/role-frames', about: `frames written in this repository (Q64): ${ROLE_FRAMES.length} general frames, one for each role of k.actions that no general frame read, built from the role's markers in k.actions ("make a boat out of paper": material by "out of"); and the ${MOVED_HERE.length} frames of PSys2's src/lang/en.local.mjs that did not read their own example, fixed and kept here (same names; the import leaves them out, PSys2 deletes its copies). Each frame follows a comment with the role it asks for or what was fixed.`,
    sources: ['hand-core 1 (written in this repository: tools/lang-en-role-frames.mjs; the nine moved frames after PSys2 src/lang/en.local.mjs at commit 447a5f9a)'], license: 'CC0-1.0', script: 'tools/lang-en-role-frames.mjs' })}\n${a.join('\n')}\n\n# Role maps of these frames.\n${maps.join('\n')}\n\n# The frames of PSys2's local file, fixed here (one home).\n${b.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = roleFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'role-frames.sop'), t);
  console.log(`role-frames.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
