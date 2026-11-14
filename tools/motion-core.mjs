// k.motion (blocks "10:50" and "11:05"): how a drawn face moves over time, as facts for the library's std.motion
// (format: questions.md Q46).
//   node tools/motion-core.mjs     writes docs/worlds/k.motion/shards/{rules,mouth}.sop
// Two shards: `rules` (events, layers, the rules of blinking, glancing, saying a reply and showing how it came out,
// their conditions, steps and what they set) and `mouth` (the classes of mouth shapes joined to k.faces mouth
// variants, and one general rule from written text to those classes, with durations). Every value that names a
// part of a face is a k.faces name (slot, variant of the style plain); no coordinate is written here. Durations are
// milliseconds; where they come from is said next to each group below and in WORLD.md.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const STYLE = 'plain';

export const OUTCOMES = ['done', 'already', 'refused', 'not understood', 'answer', 'question', 'thinking'];
export const EVENTS = [
  ['reply', 'A reply begins: how it came out (outcome) and what is said (text).', [
    ['outcome', 'How the request came out: done, already so, refused, not understood, an answer, a question back, or still thinking.', OUTCOMES],
    ['text', 'What the reply says, as written text (may be empty).', []],
  ]],
  ['spoken', 'The text of a reply has been said (made by the rule that says it); it carries the fields of that reply.', [
    ['outcome', 'The outcome of the reply that was said.', OUTCOMES],
    ['text', 'The text that was said.', []],
  ]],
];

// name, priority, keys, about
export const LAYERS = [
  ['blink', 4, ['eyes', 'one_eye'], 'Blinking: above everything, so that the face blinks while it talks and while it shows an expression.'],
  ['talk', 3, ['mouth'], 'The mouth while a text is said: above the mouth of an expression.'],
  ['expression', 2, ['mouth', 'eyebrows', 'eyes', 'one_eye'], 'How a reply came out: a smile, raised or sad brows, eyes looking up.'],
  ['glance', 1, ['eyes', 'one_eye'], 'Small glances aside: below an expression that sets the eyes.'],
];

// Durations, by source (WORLD.md, "Where the numbers come from").
// Blinks: Bentivoglio et al. 1997: 17 blinks a minute at rest (a pause of 3.5 s on average), 26 in conversation
// (2.3 s); the pauses are log-normal (a long tail), here drawn from a range around the mean. The lid closes faster
// than it opens (Sforza et al. 2008: closing 40-47% faster); closing 70-215 ms and opening 200-320 ms in the
// studies reviewed by Kwon et al. 2013, shorter for a spontaneous blink than a voluntary one: here closing 60-100,
// closed 30-60, opening 110-200 (a whole blink 200-360 ms).
const BLINK = { onset: [60, 100], hold: [30, 60], back: [110, 200] };
// Glances: Lee, Badler and Badler 2002 ("Eyes alive", from recorded conversations): a saccade lasts 25 ms + 2.4 ms
// per degree (25-60 ms for the small glances of a face); while listening the eyes stay on the other 7.9 s on average
// (237.5 +- 47.1 frames at 30 a second) and look away for 0.43 s (13.0 +- 7.1 frames); while talking 3.1 s and
// 0.93 s (93.9 +- 94.9 and 27.8 +- 24.0 frames). Two rules per mode, one per side, each at half the rate.
const SACCADE = [25, 60];
// Expressions: Schmidt et al. 2006: a smile's onset lasts 0.555-0.591 s and its offset 0.555-0.643 s (deliberate
// and spontaneous smiles); an eyebrow flash lasts about a fifth of a second (Grammer et al. 1988). The other
// onsets, holds and ease-backs are chosen (no measurement for them was used): the same order as a smile for slow
// changes (sad brows), an eyebrow flash for quick ones, holds of half a second to a second and a half after the
// text is said.
const SMILE = { onset: [400, 700], back: [450, 750] };
const FLASH = { onset: [60, 120], hold: [150, 300], back: [100, 200] };

const both = (value, via) => [['eyes', value, via], ['one_eye', value, via]];
const blinkWhen = [{ key: 'eyes', of: 'state', feature: 'feel', value: ['closed'], not: true }];
const outcome = (o) => [{ key: 'outcome', of: 'event', value: [o] }];

// A rule: { name, layer, on, repeat, chance, during, not_during, until, emits, when, steps }; a step: { about,
// onset, hold, back, hold_until, with, per, splitter, key, set: [[key, value, via]] }.
export const RULES = [
  { name: 'blink at rest', layer: 'blink', repeat: [1500, 5500], not_during: ['talk'], when: blinkWhen,
    about: 'Blink every few seconds while nothing is said (17 blinks a minute at rest); not when the eyes are already closed.',
    steps: [{ about: 'close both eyes and open them again', ...BLINK, set: both('closed', 'sleepy') }] },
  { name: 'blink while talking', layer: 'blink', repeat: [1000, 3600], during: ['talk'], when: blinkWhen,
    about: 'Blink more often while saying a reply (26 blinks a minute in conversation).',
    steps: [{ about: 'close both eyes and open them again', ...BLINK, set: both('closed', 'sleepy') }] },
  ...[['left', 'looking out', 'looking in'], ['right', 'looking in', 'looking out']].flatMap(([side, eyes, other]) => [
    { name: `glance ${side} while listening`, layer: 'glance', repeat: [10000, 22000], not_during: ['talk'],
      about: `Look a little to the viewer's ${side} now and then while nothing is said, and back.`,
      steps: [{ about: `look to the ${side}`, onset: SACCADE, hold: [190, 670], back: SACCADE, set: [['eyes', eyes], ['one_eye', other]] }] },
    { name: `glance ${side} while talking`, layer: 'glance', repeat: [3000, 12000], during: ['talk'],
      about: `Look a little to the viewer's ${side} more often while saying a reply, and back.`,
      steps: [{ about: `look to the ${side}`, onset: SACCADE, hold: [300, 1500], back: SACCADE, set: [['eyes', eyes], ['one_eye', other]] }] },
  ]),
  { name: 'say the reply', layer: 'talk', on: 'reply', until: ['reply'], emits: 'spoken',
    about: 'Move the mouth through the text of the reply, letter by letter, by the classes of mouth shapes; when it is said, the event spoken comes.',
    steps: [{ about: 'one mouth shape per letter', per: 'text', splitter: 'latin letters', key: 'mouth' }] },
  { name: 'done: smile', layer: 'expression', on: 'spoken', until: ['reply'], when: outcome('done'),
    about: 'After saying that it is done, smile, then ease back.',
    steps: [{ about: 'smile', ...SMILE, hold: [800, 1600], set: [['mouth', 'smile']] }] },
  { name: 'already: eyebrow flash', layer: 'expression', on: 'reply', until: ['reply'], when: outcome('already'),
    about: 'When it was already so, a quick raise of the brows as the reply begins.',
    steps: [{ about: 'raise the brows quickly', ...FLASH, set: [['eyebrows', 'raised']] }] },
  { name: 'already: small smile', layer: 'expression', on: 'spoken', until: ['reply'], when: outcome('already'),
    about: 'After saying it was already so, a short smile.',
    steps: [{ about: 'smile shortly', ...SMILE, hold: [400, 900], set: [['mouth', 'smile']] }] },
  { name: 'refused: sad brows', layer: 'expression', on: 'reply', until: ['reply'], when: outcome('refused'),
    about: 'When it cannot be done, sad brows while saying so and a little after.',
    steps: [{ about: 'sad brows', onset: [300, 600], hold_until: 'spoken', hold: [300, 800], back: [400, 800], set: [['eyebrows', 'sad']] }] },
  { name: 'refused: sad mouth', layer: 'expression', on: 'spoken', until: ['reply'], when: outcome('refused'),
    about: 'After saying it cannot be done, a sad mouth, then ease back.',
    steps: [{ about: 'sad mouth', onset: [300, 600], hold: [500, 1000], back: [400, 800], set: [['mouth', 'sad']] }] },
  { name: 'not understood: raised brows', layer: 'expression', on: 'reply', until: ['reply'], when: outcome('not understood'),
    about: 'When the request was not understood, raised brows while saying so and a little after.',
    steps: [{ about: 'raise the brows', onset: [100, 200], hold_until: 'spoken', hold: [300, 700], back: [200, 400], set: [['eyebrows', 'raised']] }] },
  { name: 'not understood: small mouth', layer: 'expression', on: 'spoken', until: ['reply'], when: outcome('not understood'),
    about: 'After saying it was not understood, a small puzzled mouth.',
    steps: [{ about: 'small mouth', onset: [150, 300], hold: [500, 1000], back: [200, 400], set: [['mouth', 'small']] }] },
  { name: 'answer: eyebrow flash', layer: 'expression', on: 'reply', until: ['reply'], when: outcome('answer'),
    about: 'An answer: attentive, a quick raise of the brows as it begins, otherwise the face as it is.',
    steps: [{ about: 'raise the brows quickly', ...FLASH, set: [['eyebrows', 'raised']] }] },
  { name: 'question: raised brows', layer: 'expression', on: 'reply', until: ['reply'], when: outcome('question'),
    about: 'A question back: raised brows while asking and a little after, while the other may answer.',
    steps: [{ about: 'raise the brows', onset: [100, 200], hold_until: 'spoken', hold: [400, 900], back: [200, 400], set: [['eyebrows', 'raised']] }] },
  { name: 'thinking: look up', layer: 'expression', on: 'reply', until: ['reply'], when: outcome('thinking'),
    about: 'While a reply is being made, the eyes look up and the mouth is small, until the next reply.',
    steps: [{ about: 'look up', onset: [150, 300], hold_until: 'reply', hold: [0, 0], back: [150, 300], set: [...both('looking up'), ['mouth', 'small']] }] },
];

// The mouth. class, k.faces mouth variant of the style plain, about.
export const VISEMES = [
  ['rest', 'neutral', 'Lips together and relaxed: between words and at a pause.'],
  ['open', 'talking', 'The jaw down, the mouth open: a vowel such as a.'],
  ['mid', 'half open', 'The mouth a little open, the teeth showing: the consonants that have no class of their own (s, k, r, h ...).'],
  ['rounded', 'open', 'The lips rounded and pushed forward: o, u.'],
  ['closed', 'pressed', 'The lips pressed together: m, b, p.'],
  ['lip-teeth', 'lip bite', 'The upper teeth on the lower lip: f, v.'],
  ['tongue', 'tongue tip', 'The tip of the tongue behind the upper teeth: t, d, n, l.'],
];

// The rule from text to mouth shapes (owner, 11:05): an approximation for any text in Latin letters, not a model of
// the sounds of one language. name, class, letters or kind, duration range (ms).
// Durations: a reply is said at about the speed of conversation, 164-214 words a minute in the English corpora
// measured by Yuan, Liberman and Cieri 2006; the test checks that sample texts come out between 140 and 220.
// Vowels are longer than consonants, a pause at a comma or a full stop longer than a space between words.
export const SPLITTER = { name: 'latin letters', fold: true, ignore_case: true, default: 'other letters',
  about: 'One unit per character of a text in Latin letters: vowel letters open the mouth, o and u round it, m, b and p close the lips, f and v put the teeth on the lip, t, d, n and l show the tongue, other letters a half-open mouth; spaces and punctuation rest. A letter with a mark counts as the letter without it; capitals as small letters.' };
export const LETTERS = [
  ['vowels', 'open', { letter: ['a', 'e', 'i', 'y'] }, [60, 100]],
  ['rounded vowels', 'rounded', { letter: ['o', 'u'] }, [70, 110]],
  ['lip closers', 'closed', { letter: ['m', 'b', 'p'] }, [60, 90]],
  ['lip-teeth letters', 'lip-teeth', { letter: ['f', 'v'] }, [60, 90]],
  ['tongue letters', 'tongue', { letter: ['t', 'd', 'n', 'l'] }, [45, 70]],
  ['other letters', 'mid', {}, [45, 75]],
  ['digits', 'mid', { kind: 'digit' }, [150, 300]],
  ['spaces', 'rest', { kind: 'space' }, [30, 60]],
  ['clause marks', 'rest', { letter: [',', ';', ':'] }, [150, 300]],
  ['sentence marks', 'rest', { letter: ['.', '!', '?'] }, [300, 500]],
  ['symbols', 'rest', { kind: 'symbol' }, [0, 30]],
];

const R = (pair, name) => (pair ? [[`${name}_min`, pair[0]], [`${name}_max`, pair[1]]] : []);
const many = (key, list) => (list ?? []).map((v) => [key, v]);

function rulesShard() {
  const out = [];
  out.push('# Events and their fields');
  for (const [name, about, fields] of EVENTS) {
    out.push(wire(`k.motion.event.${seg(name)}`, 'k.motion.event', [['name', name], ['about', text(about)]], SRC));
    for (const [f, fabout, values] of fields) out.push(wire(`k.motion.field.${seg(name)}.${seg(f)}`, 'k.motion.field', [['event', name], ['name', f], ...many('value', values), ['about', text(fabout)]], SRC));
  }
  out.push('', '# Layers');
  for (const [name, priority, keys, about] of LAYERS) out.push(wire(`k.motion.layer.${seg(name)}`, 'k.motion.layer', [['name', name], ['priority', priority], ...many('key', keys), ['about', text(about)]], SRC));
  for (const r of RULES) {
    const id = seg(r.name);
    out.push('', `# ${r.name}`);
    out.push(wire(`k.motion.rule.${id}`, 'k.motion.rule', [['name', r.name], ['about', text(r.about)], ['layer', r.layer], ['on', r.on], ...R(r.repeat, 'repeat'), ['chance', r.chance],
      ...many('during', r.during), ...many('not_during', r.not_during), ...many('until', r.until), ['emits', r.emits]], SRC));
    for (const w of r.when ?? []) out.push(wire(`k.motion.when.${id}.${seg(w.key)}`, 'k.motion.when', [['rule', r.name], ['key', w.key], ['of', w.of], ...many('value', w.value), ['feature', w.feature], ['not', w.not ? 'true' : undefined]], SRC));
    r.steps.forEach((s, i) => {
      const n = i + 1;
      out.push(wire(`k.motion.step.${id}.${n}`, 'k.motion.step', [['rule', r.name], ['n', n], ['about', text(s.about)], ['with', s.with], ...R(s.onset, 'onset'), ...R(s.hold, 'hold'), ['hold_until', s.hold_until], ...R(s.back, 'back'),
        ['per', s.per], ['splitter', s.splitter], ['key', s.key]], SRC));
      for (const [key, value, via] of s.set ?? []) out.push(wire(`k.motion.set.${id}.${n}.${key}`, 'k.motion.set', [['rule', r.name], ['step', n], ['key', key], ['value', value], ['via', via]], SRC));
    });
  }
  return out.join('\n');
}

function mouthShard() {
  const out = ['# Classes of mouth shapes and the k.faces mouth that shows each in the style plain'];
  for (const [cls, mouth, about] of VISEMES) out.push(wire(`k.motion.viseme.${STYLE}.${seg(cls)}`, 'k.motion.viseme', [['style', STYLE], ['class', cls], ['mouth', mouth], ['about', text(about)]], SRC));
  const s = SPLITTER;
  out.push('', '# From written text to mouth shapes: one general rule for any text in Latin letters');
  out.push(wire(`k.motion.splitter.${seg(s.name)}`, 'k.motion.splitter', [['name', s.name], ['about', text(s.about)], ['fold', s.fold ? 'true' : undefined], ['ignore_case', s.ignore_case ? 'true' : undefined], ['default', s.default]], SRC));
  for (const [name, cls, { letter, kind }, [min, max]] of LETTERS) out.push(wire(`k.motion.letters.${seg(s.name)}.${seg(name)}`, 'k.motion.letters', [['splitter', s.name], ['name', name], ['class', cls], ...(letter ?? []).map((l) => ['letter', text(l)]), ['kind', kind], ['min', min], ['max', max]], SRC));
  return out.join('\n');
}

export function motionShards() {
  const head = (id, about) => header({ id: `k.motion/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository: tools/motion-core.mjs; the duration ranges from the measurements named in k.motion/WORLD.md)'], license: 'CC0-1.0', script: 'tools/motion-core.mjs' });
  return {
    'mouth.sop': `${head('mouth', `${VISEMES.length} classes of mouth shapes joined to k.faces mouth variants of the style plain, and the rule from written text to them (${LETTERS.length} groups of characters with durations).`)}\n${mouthShard()}\n`,
    'rules.sop': `${head('rules', `${EVENTS.length} events, ${LAYERS.length} layers and ${RULES.length} rules of a face over time: blinking, glancing, saying a reply, and how a reply came out (${OUTCOMES.join(', ')}).`)}\n${rulesShard()}\n`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = motionShards();
  writeShards(join(WORLDS_DIR, 'k.motion', 'shards'), files);
  console.log(`${Object.keys(files).length} shards, ${RULES.length} rules, ${VISEMES.length} visemes, ${LETTERS.length} letter groups`);
}
