// Question frames in other word orders over facts that exist (reviewer block 2026-11-15 09:20, PSys2 Q18 K10; real row
// r0244 "how many legs has a cow"), in w.lang.en's frame format, `needs=facts` like the facts frames they stand beside:
//  - the number asked last: "April has how many days?", "a cow has how many legs?" (ask, mode count);
//  - how far in a cycle: "Friday is how many days away?", "how many days until Saturday?" (ask, mode count: the
//    attribute is the unit counted, the thing the end; the library's std.time counts it, PSys2 Q18 L2);
//  - "how many days are in April?" (ask, mode count; it was read as the "how many people live in" question);
//  - the members of a set: "which months are in summer?" (ask, mode what: the months whose season is summer, as "name the
//    months of spring" reads), "name all the seasons of the year", "what are the seasons?" (ask, mode what).
// "how many legs has a cow" itself is read by acts.facts.ask.count.does (its fourth part has "has"); the test says so.
// The attribute is the host lexicon `attribute` of the facts frames (the keys of the facts a host has: legs, days, months).
//   node tools/lang-en-question-frames.mjs     writes docs/worlds/w.lang.en/shards/question-frames.sop
// Deterministic: no input but this file. tests/w.lang.en.question-frames.test.mjs reads the sentences back.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { header } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const lead = ['lead'], det = ['det'];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
const attribute = role('attribute', 'lexicon', { lexicon: 'attribute' });

// [name, mode, priority, example, parts, why]
export const FRAMES = [
  ['acts.facts.ask.count.tail', 'count', 15, 'April has how many days?',
    [det, role('thing'), word(['has', 'have', 'has got', 'have got', 'gets', 'get']), word(['how many']), attribute], 'the number asked last'],
  ['acts.facts.ask.count.in', 'count', 15, 'How many days are in April?',
    [lead, word(['how many']), attribute, word(['are in', 'are there in', 'is in', 'are on', 'go into', 'does it take for']), det, role('thing')], 'over acts.facts.ask.live (14), which read it as "how many people live in"'],
  ['acts.facts.ask.count.away', 'count', 15, 'Friday is how many days away?',
    [det, role('thing'), word(['is', 'are']), word(['how many']), attribute, word(['away', 'from now', 'from today', 'off', 'ahead'])], 'how far a member of a cycle is: the unit counted, the end'],
  ['acts.facts.ask.count.until', 'count', 15, 'How many days until Saturday?',
    [lead, word(['how many']), attribute, word(['until', 'till', 'to', 'are left until', 'are there until', 'is it until', 'is it to', 'before']), det, role('thing')], null],
  ['acts.facts.ask.which.in', 'what', 14, 'Which months are in summer?',
    [lead, word(['which', 'what']), attribute, word(['are in', 'are there in', 'come in', 'belong to', 'are part of', 'make up']), det, role('thing')], 'the members of a set: the topic the kind, the thing the set (as "name the months of spring")'],
  ['acts.facts.ask.name.all', 'what', 13, 'Name all the seasons of the year.',
    [lead, word(['name all', 'name', 'list all', 'list', 'tell me all', 'say all', 'what are all']), det, attribute, word(['of', 'in']), det, role('thing')], 'over acts.facts.ask.of (9); "all" before the attribute'],
  ['acts.facts.ask.what.are', 'what', 8, 'What are the seasons?',
    [lead, word(['what are', 'which are', 'name', 'name all', 'list', 'list all', 'tell me']), det, attribute], 'the whole set of an attribute, nothing else said'],
];

export function questionFrameShard() {
  const lines = FRAMES.flatMap(([name, mode, priority, example, parts, why]) => [...(why ? [`# ${name}: ${why}`] : []), ...frameLines(name, { act: 'ask', mode, set: 'acts.facts', priority, needs: 'facts', roles: rolesOf(parts), example }, parts)]);
  return `${header({ id: 'w.lang.en/shards/question-frames', about: `question frames in other word orders over facts that exist (reviewer block 2026-11-15 09:20, PSys2 Q18 K10): ${FRAMES.length} frames, needs=facts ("April has how many days?", "Friday is how many days away?", "Which months are in summer?", "Name all the seasons of the year."); "how many legs has a cow" (real row r0244) is read by acts.facts.ask.count.does.`,
    sources: ['hand-core 1 (written in this repository, own: tools/lang-en-question-frames.mjs)'], license: 'CC0-1.0', script: 'tools/lang-en-question-frames.mjs' })}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = questionFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'question-frames.sop'), t);
  console.log(`question-frames.sop: ${FRAMES.length} frames, ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
