// w.lang.en discourse templates (blocks 14:45 item 2, 15:00 item 4, 17:05): rhetorical moves as compact templates with
// slots, in the library's template notation (std.morph realise: {slot}, {slot:num=pl}), one or more per move and
// register. Move names are those of k.genres (`k.genres.move name`), registers those of k.genres (`k.genres.register
// name`); story slots are the elements of k.story. Hand-written here (CC0); this tool only writes the shard.
//   node tools/lang-en-discourse.mjs      writes docs/worlds/w.lang.en/shards/templates-discourse.sop
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';

const SRC = 'hand-core 1';

// What fills a slot (w.lang.en.slot): `element` the k.story element it is, where it is one.
export const SLOTS = [
  ['topic', 'the topic, a noun phrase as the text names it (octopuses, the octopus)'],
  ['thing', 'the thing or kind a fact is about, a noun phrase with its determiner (the octopus)'],
  ['other', 'a second thing, for a comparison, a noun phrase with its determiner (the squid)'],
  ['kind', 'the kind of the thing, a noun (mollusc); in the plural where the template says num=pl'],
  ['attribute', 'an attribute, a noun (weight, length, number of hearts)'],
  ['value', 'the value of the attribute for the thing, with its unit (about 15 kg)'],
  ['other_value', 'the value of the same attribute for the other thing, with its unit (about 2 kg)'],
  ['usual', 'the usual value or range of the attribute for things of the kind, with its unit (one to three kg)'],
  ['fact', 'a fact as a clause, without a final stop (an octopus has three hearts)'],
  ['example', 'a thing that is an instance of what was said, a noun phrase (the giant Pacific octopus)'],
  ['question', 'an indirect question as a clause (why an octopus has three hearts, whether squids sleep)'],
  ['part', 'the title of the next part, a noun phrase (its food)'],
  ['parts', 'the titles of the parts that follow, joined with commas and "and" (its body, its food and its home)'],
  ['count', 'a number, in words or digits (three)'],
  ['thesis', 'the position the text argues for, a clause (zoos help wild animals)'],
  ['claim', 'one point, a clause (octopuses are good at solving problems)'],
  ['evidence', 'a fact that supports the claim, a clause (an octopus can open a jar)'],
  ['source', 'where a fact comes from, a short citation (Mather, 2008)'],
  ['method', 'what was done, a verb phrase in the past (compared the weights of 314 animals)'],
  ['action', 'what was done, a verb phrase in the past (counted the guests)'],
  ['time', 'when, an adverbial (on Monday, last week, one morning)'],
  ['problem', 'what went wrong, a clause (the map did not load)'],
  ['next', 'what will be done, a verb phrase in the base form (add the missing cities)'],
  ['limitation', 'what the work did not cover, a clause (only drawn animals were counted)'],
  ['setting', 'where the story happens, a noun (forest), a k.scenes scene', 'setting'],
  ['protagonist', 'who the story is about, a noun (fox)', 'protagonist'],
  ['trait', 'what the protagonist is like, an adjective (clever)'],
  ['goal', 'what the protagonist wants, a verb phrase in the base form (cross the river)', 'goal'],
  ['target', 'what the goal is about, a noun phrase with its determiner (the island)', 'target'],
  ['obstacle', 'what stands in the way, a noun (river)', 'obstacle'],
  ['attempt', 'one try, a verb phrase in the base form (jump over it)', 'attempt'],
  ['helper', 'who helps, a noun (heron)', 'helper'],
  ['means', 'what the helper has and the protagonist lacks, a noun (branch)', 'means'],
  ['overcome', 'how the obstacle is got past, a verb phrase in the base form (cross it)', 'resolution'],
  ['feeling', 'a feeling, an adjective (happy), a k.feelings feeling'],
];

// [register, move, text]: the move names of k.genres; one line per template.
export const T = [
  // ---- introduce topic ----
  ['scientific', 'introduce topic', 'Many studies of {kind:num=pl} have described {topic}.'],
  ['scientific', 'introduce topic', 'This article is concerned with {topic}, a group of {kind:num=pl} that has been studied widely.'],
  ['presentation', 'introduce topic', 'Today we are going to talk about {topic}.'],
  ['presentation', 'introduce topic', 'Let us look at {topic} together.'],
  ['essay', 'introduce topic', 'Few subjects are as rewarding to think about as {topic}.'],
  ['essay', 'introduce topic', 'Everyone has heard of {topic}, yet few know the details.'],
  ['narrative', 'introduce topic', 'It all began with {topic}.'],
  ['report', 'introduce topic', 'This report is about {topic}.'],
  ['report', 'introduce topic', 'The work described here concerned {topic}.'],
  // ---- compare ----
  ['scientific', 'compare', 'The {attribute} of {thing} is {value}, whereas that of {other} is {other_value}.'],
  ['scientific', 'compare', 'Compared with {other} ({other_value}), {thing} has a {attribute} of {value}.'],
  ['presentation', 'compare', '{thing} has a {attribute} of {value}, and {other} only {other_value}.'],
  ['presentation', 'compare', 'Put {thing} next to {other}: {value} against {other_value}.'],
  ['essay', 'compare', 'Consider the {attribute}: {thing} has {value}, while {other} has {other_value}.'],
  ['narrative', 'compare', '{thing} had a {attribute} of {value}, but {other} had only {other_value}.'],
  ['report', 'compare', 'The {attribute} of {thing} was {value}, against {other_value} for {other}.'],
  // ---- surprising fact ----
  ['scientific', 'surprising fact', 'Unexpectedly, {fact}.'],
  ['scientific', 'surprising fact', 'The {attribute} of {thing} is {value}, far outside the usual range for {kind:num=pl} ({usual}).'],
  ['presentation', 'surprising fact', 'Here is a surprise: {fact}.'],
  ['presentation', 'surprising fact', 'Did you know that {fact}?'],
  ['essay', 'surprising fact', 'It may come as a surprise that {fact}.'],
  ['essay', 'surprising fact', 'Most {kind:num=pl} have a {attribute} of {usual}, yet {thing} has {value}.'],
  ['narrative', 'surprising fact', 'And then, to everyone\'s surprise, it turned out that {fact}.'],
  ['report', 'surprising fact', 'An unexpected result was that {fact}.'],
  ['report', 'surprising fact', 'The {attribute} of {thing} was {value}, well outside the usual {usual}.'],
  // ---- give example ----
  ['scientific', 'give example', 'A well-known example is {example}.'],
  ['scientific', 'give example', 'This is seen, for instance, in {example}.'],
  ['presentation', 'give example', 'Take {example}, for example.'],
  ['presentation', 'give example', 'One example is {example}.'],
  ['essay', 'give example', 'Consider, for example, {example}.'],
  ['narrative', 'give example', 'There was {example}, for one.'],
  ['report', 'give example', 'An example is {example}.'],
  // ---- raise a question ----
  ['scientific', 'raise a question', 'This raises the question of {question}.'],
  ['scientific', 'raise a question', 'It remains to be explained {question}.'],
  ['presentation', 'raise a question', 'Have you ever wondered {question}?'],
  ['presentation', 'raise a question', 'So the question is: {question}.'],
  ['essay', 'raise a question', 'One may well ask {question}.'],
  ['essay', 'raise a question', 'But why does this matter, and {question}?'],
  ['narrative', 'raise a question', 'Nobody could say {question}.'],
  ['report', 'raise a question', 'One question remained open: {question}.'],
  // ---- conclude ----
  ['scientific', 'conclude', 'Taken together, these results suggest that {fact}.'],
  ['scientific', 'conclude', 'In conclusion, the evidence indicates that {fact}.'],
  ['presentation', 'conclude', 'So remember: {fact}.'],
  ['presentation', 'conclude', 'To sum up, {fact}.'],
  ['essay', 'conclude', 'In the end, it is clear that {fact}.'],
  ['essay', 'conclude', 'All in all, I am convinced that {fact}.'],
  ['narrative', 'conclude', 'And that was how it came to be that {fact}.'],
  ['report', 'conclude', 'In conclusion, {fact}.'],
  // ---- transition ----
  ['scientific', 'transition', 'The next section turns to {part}.'],
  ['scientific', 'transition', 'We now consider {part}.'],
  ['presentation', 'transition', 'Now let us move on to {part}.'],
  ['presentation', 'transition', 'Next up: {part}.'],
  ['essay', 'transition', 'This brings us to {part}.'],
  ['essay', 'transition', 'Turning now to {part}, the picture changes.'],
  ['narrative', 'transition', 'But that was not the end of it.'],
  ['narrative', 'transition', 'Meanwhile, something else was happening.'],
  ['report', 'transition', 'The following section describes {part}.'],
  // ---- scientific article ----
  ['scientific', 'claim centrality', 'In recent years, {topic} has become a subject of considerable interest.'],
  ['scientific', 'generalise', 'In general, {fact}.'],
  ['scientific', 'review previous work', 'Earlier work has shown that {fact} ({source}).'],
  ['scientific', 'indicate a gap', 'However, it is not yet known {question}.'],
  ['scientific', 'counter-claim', 'Contrary to a common belief, {fact}.'],
  ['scientific', 'state purpose', 'The aim of this article is to describe {topic}.'],
  ['scientific', 'announce findings', 'We show that {fact}.'],
  ['scientific', 'outline structure', 'The article has {count} parts: {parts}.'],
  ['scientific', 'define', 'Here, {thing} denotes a {kind} that {fact}.'],
  ['scientific', 'describe method', 'We {method}.'],
  ['scientific', 'report result', 'The {attribute} of {thing} was {value}.'],
  ['scientific', 'report result', 'We found that {fact}.'],
  ['scientific', 'interpret result', 'This may indicate that {fact}.'],
  ['scientific', 'state limitation', 'One limitation of this work is that {limitation}.'],
  ['scientific', 'recommend', 'Future work should examine {question}.'],
  ['scientific', 'summarize', 'In summary, {fact}.'],
  // ---- essay ----
  ['essay', 'state thesis', 'In this essay I argue that {thesis}.'],
  ['essay', 'state claim', 'First of all, {claim}.'],
  ['essay', 'give evidence', 'For instance, {evidence}, as {source} reports.'],
  ['essay', 'give evidence', 'This is shown by the fact that {evidence}.'],
  ['essay', 'counterargument', 'It could be objected that {claim}.'],
  ['essay', 'rebut', 'Yet this objection does not hold, because {evidence}.'],
  ['essay', 'restate thesis', 'For all these reasons, I maintain that {thesis}.'],
  ['essay', 'outline structure', 'I will first discuss {parts}.'],
  ['essay', 'generalise', 'As a rule, {fact}.'],
  ['essay', 'summarize', 'To summarise, {fact}.'],
  ['essay', 'define', 'By {thing} I mean a {kind} that {fact}.'],
  // ---- presentation ----
  ['presentation', 'outline structure', 'We will look at {count} things: {parts}.'],
  ['presentation', 'state claim', '{claim}.'],
  ['presentation', 'give evidence', 'Look at this: {evidence}.'],
  ['presentation', 'state takeaway', 'The one thing to remember: {fact}.'],
  ['presentation', 'summarize', 'So we have seen that {fact}.'],
  ['presentation', 'thank audience', 'Thank you for listening.'],
  ['presentation', 'invite questions', 'Do you have any questions?'],
  // ---- report ----
  ['report', 'state purpose', 'The purpose of this work was to look at {topic}.'],
  ['report', 'report action', '{time}, we {action}.'],
  ['report', 'report result', 'The {attribute} of {thing} was {value}.'],
  ['report', 'report result', 'We found that {fact}.'],
  ['report', 'report problem', 'One problem was that {problem}.'],
  ['report', 'next step', 'Next, we will {next}.'],
  ['report', 'summarize', 'In short, {fact}.'],
  // ---- story ----
  ['narrative', 'set the scene', 'Once upon a time, there was a {setting}.'],
  ['narrative', 'set the scene', '{time}, in a {setting} far away, everything was quiet.'],
  ['narrative', 'introduce character', 'In the {setting} lived a {trait} {protagonist}.'],
  ['narrative', 'introduce character', 'One day the {protagonist} met a {helper}.'],
  ['narrative', 'state goal', 'More than anything, the {protagonist} wanted to {goal}.'],
  ['narrative', 'state goal', 'The {protagonist} had to {goal}, and soon.'],
  ['narrative', 'complicate', 'But a {obstacle} stood in the way.'],
  ['narrative', 'complicate', 'Between the {protagonist} and {target} lay a {obstacle}.'],
  ['narrative', 'attempt', 'The {protagonist} tried to {attempt}, but it was no use.'],
  ['narrative', 'attempt', 'First the {protagonist} tried to {attempt}, and failed.'],
  ['narrative', 'turning point', 'Then the {helper} came by with a {means}.'],
  ['narrative', 'turning point', 'Just then, the {protagonist} remembered the {means}.'],
  ['narrative', 'resolve', 'With the {means}, the {protagonist} could {overcome} at last.'],
  ['narrative', 'resolve', 'So the {protagonist} used the {means} to {overcome}.'],
  ['narrative', 'evaluate', 'The {protagonist} felt {feeling}.'],
  ['narrative', 'evaluate', 'It had been a long day, and the {protagonist} was {feeling}.'],
  ['narrative', 'end', 'And so the {protagonist} was able to {goal}, and was {feeling} ever after.'],
  ['narrative', 'end', 'From that day on, the {protagonist} and the {helper} were friends.'],
];

const slug = (s) => s.replace(/[^a-z0-9]+/g, '_');
const q = (s) => JSON.stringify(s);

export function shard() {
  const lines = [
    '# w.lang.en/shards/templates-discourse: rhetorical moves as templates (blocks 14:45 item 2, 15:00 item 4, 17:05): one or',
    '# more sentences per move of k.genres and register of k.genres (scientific, presentation, essay, narrative, report), in the',
    '# library\'s template notation, for std.compose; and the slots they name, with what fills each (a story slot is an element',
    '# of k.story).',
    '# sources: hand-core 1 (written in this repository; the moves and registers are those of k.genres, the story elements those',
    '#   of k.story, with the works they cite)',
    '# license: CC0-1.0',
    '# script: tools/lang-en-discourse.mjs',
    '',
    '# ---- slots ----',
  ];
  for (const [name, about, element] of SLOTS) lines.push(`@w.lang.en.slot.${name} w.lang.en.slot name=${name} about=${q(about)}${element ? ` element=${q(element)}` : ''} core.source=${q(SRC)}`);
  const n = new Map();
  let move = null;
  for (const [register, mv, text] of T) {
    if (mv !== move) { lines.push('', `# ---- ${mv} ----`); move = mv; }
    const key = `${register}.${slug(mv)}`;
    n.set(key, (n.get(key) ?? 0) + 1);
    const slots = [...new Set([...text.matchAll(/\{([\w.]+)(?::[^}@]*)?(?:@\w+)?\}/g)].map((m) => m[1]))];
    lines.push(`@w.lang.en.discourse.${key}.${n.get(key)} w.lang.en.discourse name=${key}.${n.get(key)} move=${/[^\w-]/.test(mv) ? q(mv) : mv} register=${register}${slots.map((s) => ` slot=${s}`).join('')} text=${q(text)} core.source=${q(SRC)}`);
  }
  return `${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = shard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en/shards/templates-discourse.sop'), out);
  console.log(`${T.length} templates, ${SLOTS.length} slots, ${Buffer.byteLength(out)} bytes`);
}
