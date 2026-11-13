// The hand-written core of k.feelings (R7.4): 30 feelings.
//   node tools/feelings-core.mjs     writes docs/worlds/k.feelings/shards/feelings.sop
// A feeling: [name, tone, { expression, mouth, eyebrows, eyes, cheeks }, causes, opposite, reply, words].
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const P = 'pleasant', U = 'unpleasant', N = 'neutral';
export const FEELINGS = [
  ['happy', P, { expression: 'happy' }, ['a present', 'playing with friends', 'good news'], 'sad', 'I am glad you are happy! What made your day so good?', 'glad, joyful, cheerful, pleased, joy, happiness'],
  ['sad', U, { expression: 'sad' }, ['losing something', 'saying goodbye', 'being left out'], 'happy', 'I am sorry you are sad. Do you want to tell me about it?', 'unhappy, sadness, miserable, down'],
  ['angry', U, { expression: 'angry' }, ['something unfair', 'being teased', 'a broken toy'], 'calm', 'It is all right to be angry. Take a deep breath, and tell me what happened.', 'mad, cross, furious, anger'],
  ['afraid', U, { expression: 'surprised', eyebrows: 'sad' }, ['the dark', 'a loud noise', 'a big dog'], 'calm', 'I am here with you. What is frightening you?', 'scared, frightened, fear, terrified, fearful'],
  ['surprised', N, { expression: 'surprised' }, ['something unexpected', 'a surprise party', 'a sudden noise'], undefined, 'What a surprise! What happened?', 'amazed, astonished, surprise, startled'],
  ['tired', U, { expression: 'sleepy' }, ['a long day', 'too little sleep', 'running a lot'], undefined, 'You have done a lot today. A rest will do you good.', 'sleepy, exhausted, weary, worn out'],
  ['excited', P, { expression: 'happy', eyes: 'large' }, ['a trip tomorrow', 'a birthday', 'a new game'], 'bored', 'How exciting! Tell me what you are looking forward to.', 'thrilled, excitement, eager'],
  ['proud', P, { expression: 'happy', mouth: 'smile' }, ['doing something hard', 'a good drawing', 'helping someone'], 'ashamed', 'You can be proud of that. Well done!', 'pride'],
  ['shy', U, { mouth: 'small', eyebrows: 'sad', cheeks: 'blush' }, ['meeting new people', 'speaking in front of others'], undefined, 'Take your time. I am happy to wait.', 'timid, bashful, shyness'],
  ['bored', U, { expression: 'sleepy', mouth: 'neutral' }, ['nothing to do', 'waiting a long time', 'a rainy afternoon'], 'excited', 'Shall we think of something to do together?', 'boredom, fed up'],
  ['lonely', U, { expression: 'sad' }, ['nobody to play with', 'being far from friends'], 'loved', 'I am here, and I like talking with you. Who would you like to see?', 'alone, loneliness, lonesome'],
  ['worried', U, { mouth: 'small', eyebrows: 'sad' }, ['a test', 'someone being ill', 'being late'], 'calm', 'That sounds like a lot on your mind. What worries you most?', 'anxious, worry, concerned, uneasy'],
  ['calm', P, { mouth: 'smile', eyebrows: 'straight', eyes: 'closed' }, ['a quiet place', 'a deep breath', 'a story at bedtime'], 'angry', 'It is good to feel calm. Enjoy the quiet.', 'relaxed, peaceful, at ease'],
  ['jealous', U, { expression: 'angry', mouth: 'small' }, ['someone else getting a present', 'a friend playing with another child'], undefined, 'It is hard when someone else has what you want. What would you wish for?', 'envious, jealousy, envy'],
  ['disappointed', U, { expression: 'sad' }, ['a cancelled trip', 'losing a game', 'a broken promise'], undefined, 'That is a pity. You were looking forward to it.', 'let down, disappointment'],
  ['embarrassed', U, { mouth: 'small', eyebrows: 'sad', cheeks: 'round blush' }, ['a mistake in front of others', 'falling over'], undefined, 'That happens to everybody. It will soon be forgotten.', 'embarrassment, awkward'],
  ['confused', U, { mouth: 'small', eyebrows: 'raised' }, ['a hard question', 'unclear instructions'], undefined, 'Let us go through it slowly, one step at a time.', 'puzzled, confusion, mixed up'],
  ['curious', P, { mouth: 'smile', eyebrows: 'raised', eyes: 'large' }, ['a closed box', 'a new animal', 'a strange noise'], undefined, 'Good question! Let us find out together.', 'curiosity, interested, nosy'],
  ['grateful', P, { expression: 'happy', mouth: 'smile' }, ['help from a friend', 'a present', 'a kind word'], undefined, 'It is lovely to say thank you. Who helped you?', 'thankful, gratitude'],
  ['hopeful', P, { mouth: 'smile', eyebrows: 'raised' }, ['a wish', 'waiting for good news'], undefined, 'I hope it comes true. What are you hoping for?', 'hope, optimistic'],
  ['nervous', U, { mouth: 'wide', eyebrows: 'sad' }, ['a first day at school', 'going on stage'], 'calm', 'Many people feel like that before something new. You can do it.', 'tense, jittery, nerves'],
  ['ashamed', U, { expression: 'sad', eyes: 'closed' }, ['telling a lie', 'breaking a rule'], 'proud', 'Everybody makes mistakes. Saying sorry can make it better.', 'shame'],
  ['guilty', U, { expression: 'sad' }, ['hurting someone', 'breaking something and hiding it'], undefined, 'You can put it right. What could you do now?', 'guilt'],
  ['disgusted', U, { mouth: 'tongue out', eyebrows: 'angry', eyes: 'narrow' }, ['a bad smell', 'rotten food'], undefined, 'Yuck, that is not nice. Let us get away from it.', 'disgust, sickened'],
  ['loved', P, { expression: 'happy', cheeks: 'blush' }, ['a hug', 'a kind word', 'being looked after'], 'lonely', 'You are loved. That is a warm feeling.', 'love, cared for, cherished'],
  ['hurt', U, { expression: 'sad' }, ['an unkind word', 'being pushed', 'a fall'], undefined, 'I am sorry that hurt you. Do you want to tell me what happened?', 'offended, wounded'],
  ['frustrated', U, { expression: 'angry' }, ['something that will not work', 'losing again and again'], undefined, 'That is annoying. Shall we try another way, or take a short break?', 'frustration, annoyed, irritated'],
  ['relieved', P, { mouth: 'smile', eyes: 'closed' }, ['finding something lost', 'good news after a worry'], 'worried', 'What a relief! Now you can breathe out.', 'relief'],
  ['homesick', U, { expression: 'sad' }, ['being away from home', 'a first night away'], undefined, 'You miss home. What do you like best there?', 'homesickness'],
  ['amused', P, { expression: 'happy', mouth: 'grin' }, ['a joke', 'a funny face', 'a clown'], undefined, 'That is funny! Tell me the joke.', 'amusement, tickled'],
];

export function feelingShards() {
  const lines = FEELINGS.map(([name, tone, face, causes, opposite, reply]) => wire(`k.feelings.feeling.${seg(name)}`, 'k.feelings.feeling', [['name', name], ['tone', tone],
    ['expression', face.expression], ['mouth', face.mouth], ['eyebrows', face.eyebrows], ['eyes', face.eyes], ['cheeks', face.cheeks],
    ...causes.map((c) => ['caused_by', text(c)]), ['opposite', opposite], ['reply', text(reply)]], SRC));
  const words = FEELINGS.map(([name, , , , , , w]) => wire(`k.feelings.word.feeling.${seg(name)}`, 'core.word', [...w.split(',').map((x) => ['text', x.trim()]), ['means', name], ['of', 'k.feelings.feeling.name']], SRC));
  return { 'feelings.sop': `${header({
    id: 'k.feelings/shards/feelings',
    about: `${FEELINGS.length} feelings (${FEELINGS.map((f) => f[0]).join(', ')}): how a face shows them (k.faces expressions and variants), what usually causes them, the opposite, a kind reply; and other words for them.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/feelings-core.mjs)'],
    license: 'CC0-1.0', script: 'tools/feelings-core.mjs',
  })}\n${lines.join('\n')}\n\n# Words: other words for the feelings, and their nouns.\n${words.join('\n')}\n` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.feelings', 'shards'), feelingShards());
  console.log(`${FEELINGS.length} feelings`);
}
