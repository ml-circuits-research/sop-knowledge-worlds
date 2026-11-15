// The hand-written core of k.feelings (R7.4): 30 feelings.
//   node tools/feelings-core.mjs     writes docs/worlds/k.feelings/shards/feelings.sop
// A feeling: [name, tone, { expression, mouth, eyebrows, eyes, cheeks, looks_like }, causes, opposite, words]. The kind reply
// to someone who has the feeling is English wording: w.lang.en's shard feelings (KR3, reviewer 14:25).
// looks_like names the feeling whose face it shares: a face cannot tell the two apart (lonely looks like sad).
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const P = 'pleasant', U = 'unpleasant', N = 'neutral';
export const FEELINGS = [
  ['happy', P, { expression: 'happy' }, ['a present', 'playing with friends', 'good news'], 'sad', 'glad, joyful, cheerful, pleased, joy, happiness'],
  ['sad', U, { expression: 'sad' }, ['losing something', 'saying goodbye', 'being left out'], 'happy', 'unhappy, sadness, miserable, down'],
  ['angry', U, { expression: 'angry' }, ['something unfair', 'being teased', 'a broken toy'], 'calm', 'mad, cross, furious, anger'],
  ['afraid', U, { expression: 'surprised', eyebrows: 'sad' }, ['the dark', 'a loud noise', 'a big dog'], 'calm', 'scared, frightened, fear, terrified, fearful'],
  ['surprised', N, { expression: 'surprised' }, ['something unexpected', 'a surprise party', 'a sudden noise'], undefined, 'amazed, astonished, surprise, startled'],
  ['tired', U, { expression: 'sleepy', mouth: 'open' }, ['a long day', 'too little sleep', 'running a lot'], undefined, 'sleepy, exhausted, weary, worn out'],
  ['excited', P, { expression: 'happy', eyes: 'large' }, ['a trip tomorrow', 'a birthday', 'a new game'], 'bored', 'thrilled, excitement, eager'],
  ['proud', P, { expression: 'happy', mouth: 'smirk' }, ['doing something hard', 'a good drawing', 'helping someone'], 'ashamed', 'pride'],
  ['shy', U, { mouth: 'small', eyebrows: 'sad', eyes: 'downcast', cheeks: 'blush' }, ['meeting new people', 'speaking in front of others'], undefined, 'timid, bashful, shyness'],
  ['bored', U, { expression: 'sleepy', mouth: 'neutral' }, ['nothing to do', 'waiting a long time', 'a rainy afternoon'], 'excited', 'boredom, fed up'],
  ['lonely', U, { expression: 'sad', looks_like: 'sad' }, ['nobody to play with', 'being far from friends'], 'loved', 'alone, loneliness, lonesome'],
  ['worried', U, { mouth: 'small', eyebrows: 'sad' }, ['a test', 'someone being ill', 'being late'], 'calm', 'anxious, worry, concerned, uneasy'],
  ['calm', P, { mouth: 'smile', eyebrows: 'straight', eyes: 'closed' }, ['a quiet place', 'a deep breath', 'a story at bedtime'], 'angry', 'relaxed, peaceful, at ease'],
  ['jealous', U, { expression: 'angry', mouth: 'small' }, ['someone else getting a present', 'a friend playing with another child'], undefined, 'envious, jealousy, envy'],
  ['disappointed', U, { expression: 'sad', looks_like: 'sad' }, ['a cancelled trip', 'losing a game', 'a broken promise'], undefined, 'let down, disappointment'],
  ['embarrassed', U, { mouth: 'small', eyebrows: 'sad', eyes: 'closed', cheeks: 'round blush' }, ['a mistake in front of others', 'falling over'], undefined, 'embarrassment, awkward'],
  ['confused', U, { mouth: 'small', eyebrows: 'raised' }, ['a hard question', 'unclear instructions'], undefined, 'puzzled, confusion, mixed up'],
  ['curious', P, { mouth: 'smile', eyebrows: 'raised', eyes: 'large' }, ['a closed box', 'a new animal', 'a strange noise'], undefined, 'curiosity, interested, nosy'],
  ['grateful', P, { expression: 'happy', looks_like: 'happy' }, ['help from a friend', 'a present', 'a kind word'], undefined, 'thankful, gratitude'],
  ['hopeful', P, { mouth: 'smile', eyebrows: 'raised', eyes: 'looking up' }, ['a wish', 'waiting for good news'], undefined, 'hope, optimistic'],
  ['nervous', U, { mouth: 'gritted', eyebrows: 'sad' }, ['a first day at school', 'going on stage'], 'calm', 'tense, jittery, nerves'],
  ['ashamed', U, { expression: 'sad', eyes: 'closed' }, ['telling a lie', 'breaking a rule'], 'proud', 'shame'],
  ['guilty', U, { expression: 'sad', looks_like: 'sad' }, ['hurting someone', 'breaking something and hiding it'], undefined, 'guilt'],
  ['disgusted', U, { mouth: 'tongue out', eyebrows: 'angry', eyes: 'narrow' }, ['a bad smell', 'rotten food'], undefined, 'disgust, sickened'],
  ['loved', P, { expression: 'happy', cheeks: 'blush' }, ['a hug', 'a kind word', 'being looked after'], 'lonely', 'love, cared for, cherished'],
  ['hurt', U, { expression: 'sad', cheeks: 'tear' }, ['an unkind word', 'being pushed', 'a fall'], undefined, 'offended, wounded'],
  ['frustrated', U, { expression: 'angry', mouth: 'gritted' }, ['something that will not work', 'losing again and again'], undefined, 'frustration, annoyed, irritated'],
  ['relieved', P, { mouth: 'smile', eyebrows: 'straight', eyes: 'closed', looks_like: 'calm' }, ['finding something lost', 'good news after a worry'], 'worried', 'relief'],
  ['homesick', U, { expression: 'sad', looks_like: 'sad' }, ['being away from home', 'a first night away'], undefined, 'homesickness'],
  ['amused', P, { expression: 'happy', mouth: 'grin' }, ['a joke', 'a funny face', 'a clown'], undefined, 'amusement, tickled'],
];

export function feelingShards() {
  const lines = FEELINGS.map(([name, tone, face, causes, opposite]) => wire(`k.feelings.feeling.${seg(name)}`, 'k.feelings.feeling', [['name', name], ['tone', tone],
    ['expression', face.expression], ['mouth', face.mouth], ['eyebrows', face.eyebrows], ['eyes', face.eyes], ['cheeks', face.cheeks], ['looks_like', face.looks_like],
    ...causes.map((c) => ['caused_by', text(c)]), ['opposite', opposite]], SRC));
  const words = FEELINGS.map(([name, , , , , w]) => wire(`k.feelings.word.feeling.${seg(name)}`, 'core.word', [...w.split(',').map((x) => ['text', x.trim()]), ['means', name], ['of', 'k.feelings.feeling.name']], SRC));
  return { 'feelings.sop': `${header({
    id: 'k.feelings/shards/feelings',
    about: `${FEELINGS.length} feelings (${FEELINGS.map((f) => f[0]).join(', ')}): how a face shows them (k.faces expressions and variants; which feelings a face cannot tell apart), what usually causes them, the opposite; and other words for them.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/feelings-core.mjs)'],
    license: 'CC0-1.0', script: 'tools/feelings-core.mjs',
  })}\n${lines.join('\n')}\n\n# Words: other words for the feelings, and their nouns.\n${words.join('\n')}\n` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.feelings', 'shards'), feelingShards());
  console.log(`${FEELINGS.length} feelings`);
}
