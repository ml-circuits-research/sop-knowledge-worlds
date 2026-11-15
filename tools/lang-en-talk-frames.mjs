// Conversation frames (reviewer block 2026-11-15 09:20 K3, PSys2 Q18; real rows r0166, r0216, r0630 "hello", r0588,
// r0591, r0594, r0597, r0600, r0603, r0606, r0612 "thanks", r0148 "who am I?"): a greeting, thanks and a goodbye (the
// acts greet, thank, farewell of k.actions, family conversation), and the questions about the assistant ("who are
// you", "how are you": ask, the thing fixed to "yourself" as acts.ask.name does for "what is your name"). What the speaker says and asks about
// themselves ("my name is Ana", "you can call me Ana", "who am I", "what is my name") is w.person's (shard
// person-frames): this shard does not repeat it. Hand-written words, CC0.
//   node tools/lang-en-talk-frames.mjs     writes docs/worlds/w.lang.en/shards/talk-frames.sop
// tests/w.lang.en.talk-frames.test.mjs reads the real rows back.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { header } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const SRC = 'hand-core 1';
const lead = ['lead'], det = ['det'];
const verb = (act) => ['verb', act];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
const HELLO = ['hello', 'hi', 'hey', 'hi there', 'hello there', 'hey there', 'good morning', 'good afternoon', 'good evening', 'morning', 'howdy', 'greetings', 'good day', 'hiya', 'yo', 'hey hey', 'hullo', 'hallo'];
const THANKS = ['thanks', 'thank you', 'thank u', 'thx', 'ty', 'thanks a lot', 'thanks a bunch', 'thank you very much', 'thanks very much', 'thanks so much', 'thank you so much', 'many thanks', 'cheers', 'much appreciated', 'thanks a million', 'tysm', 'thank you kindly', 'great thanks', 'ok thanks', 'okay thanks', 'ok thank you'];
const BYE = ['bye', 'goodbye', 'good bye', 'bye bye', 'byebye', 'see you', 'see you later', 'see ya', 'see you soon', 'good night', 'goodnight', 'night night', 'farewell', 'talk to you later', 'cya', 'take care', 'i have to go', 'i gotta go', 'gotta go', 'i am leaving', 'im leaving', 'later'];
const END = ['please', 'pls', 'again', 'buddy', 'friend', 'mate', 'robot'];
// [name, act, mode, priority, example, parts, fixed, about]
export const FRAMES = [
  ['talk.greet', 'greet', undefined, 16, 'Hello.', [word(HELLO), word(END, true)], null, 'a greeting'],
  ['talk.greet.person', 'greet', undefined, 15, 'Hello Robi.', [word(HELLO), role('person', 'words', { max: 2 })], null, 'a greeting with the name of who is greeted'],
  ['talk.greet.verb', 'greet', undefined, 12, 'Say hello to Ana.', [lead, verb('greet'), word(['to', 'unto'], true), role('person', 'words', { max: 3 })], null, 'greet someone (the role person of greet, after a verb of greeting)'],
  ['talk.thank', 'thank', undefined, 16, 'Thanks.', [word(THANKS), word(END, true)], null, 'thanks'],
  ['talk.thank.for', 'thank', undefined, 16, 'Thank you for the drawing.', [word(THANKS), word(['for', 'about']), det, role('topic')], null, 'thanks for something (the role topic of thank)'],
  ['talk.farewell', 'farewell', undefined, 16, 'Goodbye.', [word(BYE), word([...END, 'now', 'for now', 'for today'], true)], null, 'a goodbye'],
  ['talk.farewell.person', 'farewell', undefined, 15, 'Bye Robi.', [word(BYE), role('person', 'words', { max: 2 })], null, 'a goodbye with the name of who is left'],
  ['talk.ask.who', 'ask', 'who', 15, 'Who are you?', [lead, word(['who are you', 'what are you', 'tell me about yourself', 'introduce yourself', 'who am i talking to', 'who is this', 'what kind of thing are you'])], { thing: 'yourself', topic: 'identity' }, 'asks who the assistant is'],
  ['talk.ask.how', 'ask', 'feeling', 15, 'How are you?', [lead, word(['how are you', 'how are you doing', 'how are u', 'how r u', 'how is it going', 'hows it going', 'how s it going', 'how do you do', 'how are things', 'are you ok', 'are you okay', 'how do you feel', 'how are you feeling', 'whats up', 'what s up', 'sup']), word(['today', 'now'], true)], { thing: 'yourself', topic: 'feeling' }, 'asks how the assistant is'],
];

export function talkFrameShard() {
  const frames = FRAMES.flatMap(([name, act, mode, priority, example, parts, fixed, about]) => [`# ${about}`, ...frameLines(name, { act, mode, set: 'acts', priority, roles: rolesOf(parts), example }, parts, fixed ?? {}, SRC)]);
  return `${header({ id: 'w.lang.en/shards/talk-frames', about: `conversation frames (block 09:20 K3, PSys2 Q18): ${FRAMES.length} frames for a greeting, thanks and a goodbye (the acts greet, thank, farewell of k.actions) and the questions about the assistant (who, how; its name is acts.ask.name); what the speaker says about themselves is w.person's shard person-frames.`,
    sources: ['hand-core 1 (written in this repository: tools/lang-en-talk-frames.mjs)'], license: 'CC0-1.0', script: 'tools/lang-en-talk-frames.mjs' })}\n${frames.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = talkFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'talk-frames.sop'), t);
  console.log(`talk-frames.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
