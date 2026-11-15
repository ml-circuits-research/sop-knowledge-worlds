// Frames for what a person says about themselves and asks about themselves (block 10:55, PSys2 Q19: 30 real turns of
// its former Profile tab), in w.lang.en's frame format, for the world schema w.person:
//  - statements (mood declarative; set acts.state, the act change in the mode set, as the statements of facts are):
//    "My name is Ana", "I am called Ana", "I am 40", "I have two kids", "I like cats, dogs and horses", "I don't like
//    spiders", "I am a teacher", "I speak English and Romanian"; the thing is always the speaker (fixed thing=me);
//  - questions about the speaker (mood interrogative, the act ask): "What do you know about me?", "How many kids do I
//    have?", "How old am I?", "What is my name?", "What do I like?", "What is my job?", "What languages do I speak?".
// The lexicons are derived from their homes: the relations of w.person (its enum and the words for its values) and the
// jobs of k.people (roles of the group job); `npm run build` reruns this tool.
//   node tools/lang-en-person-frames.mjs     writes docs/worlds/w.lang.en/shards/person-frames.sop
// tests/w.person.test.mjs reads the 30 kinds of turn back.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text } from './import/lib.mjs';
import { frameLines, rolesOf } from './lang-en-role-frames.mjs';

const SRC = 'hand-core 1';
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);

export function lexicons() {
  const schema = parse(readFileSync(join(WORLDS_DIR, 'w.person', 'schema.sop'), 'utf8'));
  const relSlot = schema.find((w) => w.id === 'w.person.relative.relation');
  const relations = [...vals(relSlot, 'enum'), ...schema.filter((w) => w.type === 'core.word' && one(w, 'of') === 'w.person.relative.relation').flatMap((w) => vals(w, 'text'))];
  const pdir = join(WORLDS_DIR, 'k.people', 'shards');
  const jobs = readdirSync(pdir).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(pdir, f), 'utf8')))
    .filter((w) => w.type === 'k.people.role' && one(w, 'group') === 'job').map((w) => one(w, 'name'));
  const sorted = (xs) => [...new Set(xs.map((x) => x.toLowerCase()))].sort();
  return {
    'person.relation': { doc: 'Relations of a relative (w.person.relative relation): its values and the words for them (kids, mum, grandma); derived by tools/lang-en-person-frames.mjs.', items: sorted(relations) },
    'person.occupation': { doc: 'Jobs a person says they have: the roles of k.people of the group job (teacher, doctor); derived by tools/lang-en-person-frames.mjs.', items: sorted(jobs) },
  };
}

const det = ['det'];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
const I_AM = ['i am', 'im', 'i m'];
const ME = { thing: 'me' };
// [name, act, mode, set, priority, mood, example, parts, fixed, about]
export const FRAMES = [
  ['person.state.name', 'change', 'set', 'acts.state', 16, 'declarative', 'My name is Ana.',
    [word(['my name is', 'my names', 'my name s', 'the name is', 'my first name is']), role('value', 'rest')], { ...ME, attribute: 'name' }, 'the speaker says their name'],
  ['person.state.called', 'change', 'set', 'acts.state', 16, 'declarative', 'I am called Ana.',
    [word([...I_AM.map((x) => `${x} called`), ...I_AM.map((x) => `${x} named`), 'call me', 'people call me', 'everyone calls me', 'you can call me']), role('value', 'rest')], { ...ME, attribute: 'name' }, 'the speaker says what they are called'],
  ['person.state.age', 'change', 'set', 'acts.state', 16, 'declarative', 'I am 40.',
    [word([...I_AM, 'i turned', 'i just turned', 'i will be', 'ill be', 'my age is']), role('value', 'number'), word(['years old', 'years', 'year old', 'yrs old', 'yrs', 'now', 'years of age'], true)], { ...ME, attribute: 'age' }, 'the speaker says their age'],
  ['person.state.relatives', 'change', 'set', 'acts.state', 16, 'declarative', 'I have two kids.',
    [word(['i have', 'ive got', 'i got', 'i have got', 'i ve got', 'we have']), word(['a', 'an'], true), role('value', 'number', { optional: true }), role('attribute', 'lexicon', { lexicon: 'person.relation' })], ME, 'the speaker says how many relatives of a relation they have'],
  ['person.state.likes', 'change', 'set', 'acts.state', 16, 'declarative', 'I like cats, dogs and horses.',
    [word(['i like', 'i love', 'i really like', 'i really love', 'i enjoy', 'i adore', 'i am fond of', 'im fond of', 'i am into', 'im into', 'my favourite things are', 'my favorite things are', 'my favourite is', 'my favorite is']), role('value', 'rest')], { ...ME, attribute: 'likes' }, 'what the speaker likes (the host makes one taste per thing)'],
  ['person.state.dislikes', 'change', 'set', 'acts.state', 16, 'declarative', 'I don\'t like spiders.',
    [word(['i dont like', 'i do not like', 'i don t like', 'i hate', 'i dislike', 'i cant stand', 'i can t stand', 'i really dont like', 'i am afraid of', 'im afraid of']), role('value', 'rest')], { ...ME, attribute: 'dislikes' }, 'what the speaker dislikes'],
  ['person.state.occupation', 'change', 'set', 'acts.state', 16, 'declarative', 'I am a teacher.',
    [word([...I_AM, 'i work as', 'i am working as', 'my job is', 'i m working as']), det, role('value', 'lexicon', { lexicon: 'person.occupation' })], { ...ME, attribute: 'occupation' }, 'the speaker says their job (a job of k.people)'],
  ['person.state.language', 'change', 'set', 'acts.state', 16, 'declarative', 'I speak English and Romanian.',
    [word(['i speak', 'i can speak', 'my language is', 'my languages are', 'my mother tongue is', 'my native language is']), role('value', 'rest')], { ...ME, attribute: 'language' }, 'the languages the speaker speaks'],
  ['person.ask.all', 'ask', 'describe', 'acts', 16, 'interrogative', 'What do you know about me?',
    [word(['what do you know about me', 'what do you remember about me', 'tell me about myself', 'tell me what you know about me', 'what have i told you', 'what have i told you about me', 'who am i', 'what do you know of me'])], ME, 'the speaker asks what is known about them'],
  ['person.ask.count', 'ask', 'count', 'acts', 16, 'interrogative', 'How many kids do I have?',
    [word(['how many']), role('attribute', 'lexicon', { lexicon: 'person.relation' }), word(['do i have', 'have i got', 'have i', 'did i say i have', 'did i tell you i have'])], ME, 'the speaker asks how many relatives of a relation they have'],
  ['person.ask.age', 'ask', 'what', 'acts', 16, 'interrogative', 'How old am I?',
    [word(['how old am i', 'what is my age', 'whats my age', 'what age am i', 'do you know how old i am', 'do you know my age'])], { ...ME, attribute: 'age' }, 'the speaker asks their age'],
  ['person.ask.name', 'ask', 'what', 'acts', 16, 'interrogative', 'What is my name?',
    [word(['what is my name', 'whats my name', 'what am i called', 'do you know my name', 'do you remember my name', 'what s my name'])], { ...ME, attribute: 'name' }, 'the speaker asks their name'],
  ['person.ask.likes', 'ask', 'what', 'acts', 16, 'interrogative', 'What do I like?',
    [word(['what do i like', 'what things do i like', 'what are my favourite things', 'what are my favorite things', 'what do i love', 'do you know what i like'])], { ...ME, attribute: 'likes' }, 'the speaker asks what they like'],
  ['person.ask.dislikes', 'ask', 'what', 'acts', 16, 'interrogative', 'What do I not like?',
    [word(['what do i not like', 'what dont i like', 'what do i hate', 'what do i dislike'])], { ...ME, attribute: 'dislikes' }, 'the speaker asks what they dislike'],
  ['person.ask.occupation', 'ask', 'what', 'acts', 16, 'interrogative', 'What is my job?',
    [word(['what is my job', 'whats my job', 'what do i do for a living', 'what do i do for work', 'what is my occupation', 'where do i work'])], { ...ME, attribute: 'occupation' }, 'the speaker asks their job'],
  ['person.ask.language', 'ask', 'what', 'acts', 16, 'interrogative', 'What languages do I speak?',
    [word(['what languages do i speak', 'what language do i speak', 'which languages do i speak', 'which language do i speak'])], { ...ME, attribute: 'language' }, 'the speaker asks the languages they speak'],
];

export function personFrameShard() {
  const lex = Object.entries(lexicons()).map(([name, { doc, items }]) => wire(`w.lang.en.lex.${name}`, 'w.lang.en.lex', [['name', name], ['doc', text(doc)], ...items.map((i) => ['item', text(i)])], SRC));
  const frames = FRAMES.flatMap(([name, act, mode, set, priority, mood, example, parts, fixed, about]) => [`# ${about}`, ...frameLines(name, { act, mode, set, priority, needs: 'person', roles: rolesOf(parts), example, mood }, parts, fixed, SRC)]);
  return `${header({ id: 'w.lang.en/shards/person-frames', about: `frames for what a person says and asks about themselves (block 10:55, PSys2 Q19), for the world schema w.person: ${FRAMES.filter((f) => f[5] === 'declarative').length} statements (mood declarative), ${FRAMES.filter((f) => f[5] === 'interrogative').length} questions (mood interrogative), ${lex.length} derived lexicons.`,
    sources: ['hand-core 1 (written in this repository: tools/lang-en-person-frames.mjs; the lexicons derived from w.person and k.people)'], license: 'CC0-1.0', script: 'tools/lang-en-person-frames.mjs' })}\n# Lexicons\n${lex.join('\n')}\n\n${frames.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = personFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'person-frames.sop'), t);
  console.log(`person-frames.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
