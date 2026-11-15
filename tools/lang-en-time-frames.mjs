// Frames that state the date and the time, and ask them (reviewer block 2026-11-15 09:20 K7, PSys2 Q18; real row r0586
// "I should tell you, today is Friday"): "today is Friday", "today is the 5th of May", "we are in May", "it is spring",
// "the clock says half past 3", "it is 5 o'clock", "it's quarter to 4"; "what day is it", "what time is it". A statement
// is the act change in the mode set of the set acts.state, as the statements of facts are, with the thing fixed (today,
// now) and the attribute fixed (weekday, date, month, season, time); a question is ask, its topic fixed. The words come
// from their homes: weekdays, months, seasons, the hours of the clock and the clock phrases of k.time (shards calendar,
// clock, clock-words), the numerals of w.lang.en; `npm run build` reruns this tool.
//   node tools/lang-en-time-frames.mjs     writes docs/worlds/w.lang.en/shards/time-frames.sop
// tests/w.lang.en.time-frames.test.mjs reads the requests back and joins the values read to k.time.
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
const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));

export function lexicons() {
  const time = shards('k.time');
  const names = (type) => time.filter((w) => w.type === type).map((w) => one(w, 'name'));
  const hourWords = time.filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.time.hour.name').flatMap((w) => vals(w, 'text'));
  const hours = time.filter((w) => w.type === 'k.time.hour');
  const en = shards('w.lang.en');
  const numWords = en.filter((w) => w.type === 'w.lang.en.numeral' && Number(one(w, 'value')) >= 1 && Number(one(w, 'value')) <= 12).map((w) => one(w, 'text'));
  const sorted = (xs) => [...new Set(xs.map((x) => String(x).toLowerCase()))].sort();
  return {
    'time.weekday': { doc: 'The days of the week: the names of k.time.weekday; derived by tools/lang-en-time-frames.mjs.', items: sorted(names('k.time.weekday')) },
    'time.month': { doc: 'The months: the names of k.time.month; derived by tools/lang-en-time-frames.mjs.', items: sorted(names('k.time.month')) },
    'time.season': { doc: 'The seasons: the names of k.time.season; derived by tools/lang-en-time-frames.mjs.', items: sorted(names('k.time.season')) },
    'time.clock_phrase': { doc: "How the clock names a time by an hour (half past, quarter to, five past): the names of k.time.clock_phrase but o'clock, which follows the hour; derived by tools/lang-en-time-frames.mjs.", items: sorted(names('k.time.clock_phrase').filter((n) => n !== "o'clock")) },
    'time.hour.named': { doc: 'The hours of the clock said by a name, not a number: noon and midnight and their words (midday, twelve noon); derived from k.time by tools/lang-en-time-frames.mjs.', items: sorted([...hours.filter((h) => !/\d/.test(one(h, 'name'))).map((h) => one(h, 'name')), ...time.filter((w) => w.type === 'core.word' && one(w, 'of') === 'k.time.hour.name').flatMap((w) => vals(w, 'text')).filter((t) => !/\d+ (am|pm)$/.test(t))]) },
    'time.hour': { doc: "An hour as the clock says it: 0 to 23, the 12-hour numbers in words (one to twelve), the hours of k.time.hour by name (noon, midnight, 3 pm) and their words (midday, 12 am); derived by tools/lang-en-time-frames.mjs.", items: sorted([...hours.map((h) => String(one(h, 'n'))), ...numWords, ...hours.map((h) => one(h, 'name')), ...hourWords]) },
  };
}

const lead = ['lead'], det = ['det'];
const role = (r, takes = 'words', more = {}) => ['role', r, takes, more];
const word = (words, optional = false) => ['word', words, optional];
// what a person says before telling something (r0586 "I should tell you, today is Friday")
const TELL = ['i should tell you', 'i need to tell you', 'i have to tell you', 'i want to tell you', 'just so you know', 'fyi', 'by the way', 'btw', 'remember', 'note that', 'you should know'];
const TODAY = ['today is', 'today it is', 'today its', 'it is', 'its', 'it s'];
const STATE = 'acts.state';
// [name, act, mode, set, priority, example, parts, fixed, about]
export const FRAMES = [
  ['time.state.today', 'change', 'set', STATE, 16, 'I should tell you, today is Friday.',
    [lead, word(TELL, true), word(TODAY), role('value', 'lexicon', { lexicon: 'time.weekday' })], { thing: 'today', attribute: 'weekday' }, 'the day of the week today'],
  ['time.state.date.dm', 'change', 'set', STATE, 16, 'Today is the 5th of May.',
    [lead, word(TELL, true), word([...TODAY, 'the date is', 'todays date is', 'today s date is']), det, role('day', 'words', { max: 1 }), word(['of']), role('month', 'lexicon', { lexicon: 'time.month' })], { thing: 'today', attribute: 'date' }, 'the date today, day first'],
  ['time.state.date.md', 'change', 'set', STATE, 16, 'Today is May 5.',
    [lead, word(TELL, true), word([...TODAY, 'the date is', 'todays date is', 'today s date is']), role('month', 'lexicon', { lexicon: 'time.month' }), role('day', 'words', { max: 1 })], { thing: 'today', attribute: 'date' }, 'the date today, month first'],
  ['time.state.month', 'change', 'set', STATE, 16, 'We are in May.',
    [lead, word(TELL, true), word(['we are in', 'were in', 'we re in', 'it is', 'its', 'it s', 'this month is', 'the month is', 'now it is']), role('value', 'lexicon', { lexicon: 'time.month' })], { thing: 'now', attribute: 'month' }, 'the month it is'],
  ['time.state.season', 'change', 'set', STATE, 16, 'It is spring.',
    [lead, word(TELL, true), word(['we are in', 'were in', 'we re in', 'it is', 'its', 'it s', 'the season is', 'now it is']), role('value', 'lexicon', { lexicon: 'time.season' })], { thing: 'now', attribute: 'season' }, 'the season it is'],
  ['time.state.clock', 'change', 'set', STATE, 16, 'The clock says half past 3.',
    [lead, word(TELL, true), word(['the clock says', 'the clock shows', 'the clock is at', 'the time is', 'the time now is', 'my clock says', 'my watch says']), role('phrase', 'lexicon', { lexicon: 'time.clock_phrase', optional: true }), role('hour', 'lexicon', { lexicon: 'time.hour' }), role('minutes', 'number', { optional: true }), word(["o'clock", 'oclock', 'o clock', 'am', 'pm', 'in the morning', 'in the afternoon', 'in the evening', 'at night'], true)], { thing: 'now', attribute: 'time' }, 'the time the clock shows'],
  ['time.state.clock.past', 'change', 'set', STATE, 16, "It's quarter to 4.",
    [lead, word(TELL, true), word(['it is', 'its', 'it s', 'it is now', 'its now', 'now it is']), role('phrase', 'lexicon', { lexicon: 'time.clock_phrase' }), role('hour', 'lexicon', { lexicon: 'time.hour' }), word(['am', 'pm', 'in the morning', 'in the afternoon', 'in the evening', 'at night'], true)], { thing: 'now', attribute: 'time' }, 'the time, said by a clock phrase'],
  ['time.state.clock.oclock', 'change', 'set', STATE, 16, "It is 5 o'clock.",
    [lead, word(TELL, true), word(['it is', 'its', 'it s', 'it is now', 'its now', 'now it is']), role('hour', 'lexicon', { lexicon: 'time.hour' }), role('minutes', 'number', { optional: true }), word(["o'clock", 'oclock', 'o clock', 'am', 'pm', 'in the morning', 'in the afternoon', 'in the evening', 'at night'])], { thing: 'now', attribute: 'time' }, "the time, an hour with o'clock, am or pm"],
  ['time.state.clock.named', 'change', 'set', STATE, 16, 'It is noon.',
    [lead, word(TELL, true), word(['it is', 'its', 'it s', 'it is now', 'its now', 'now it is']), role('hour', 'lexicon', { lexicon: 'time.hour.named' })], { thing: 'now', attribute: 'time' }, 'the time, an hour by its name'],
  ['time.ask.day', 'ask', 'what', 'acts', 15, 'What day is it today?',
    [lead, word(['what day is it', 'what day is today', 'which day is it', 'what day of the week is it', 'what is the day today', 'whats the day today']), word(['today', 'now'], true)], { thing: 'today', topic: 'weekday' }, 'asks the day of the week'],
  ['time.ask.date', 'ask', 'what', 'acts', 15, "What's the date today?",
    [lead, word(['what is the date', 'whats the date', 'what date is it', 'what is todays date', 'whats todays date', 'what is the date today']), word(['today', 'now'], true)], { thing: 'today', topic: 'date' }, 'asks the date'],
  ['time.ask.time', 'ask', 'what', 'acts', 15, 'What time is it?',
    [lead, word(['what time is it', 'whats the time', 'what is the time', 'what time is it now', 'do you know what time it is', 'what does the clock say', 'what time do you have'])], { thing: 'now', topic: 'time' }, 'asks the time'],
  ['time.ask.month', 'ask', 'what', 'acts', 15, 'What month is it?',
    [lead, word(['what month is it', 'which month is it', 'what month are we in', 'which month are we in', 'what is the month'])], { thing: 'now', topic: 'month' }, 'asks the month'],
];
// Role maps: the parts of a time and of a date are the value.
export const ROLE_MAPS = [
  ...['time.state.date.dm', 'time.state.date.md'].flatMap((f) => [['day', 'value'], ['month', 'value']].map(([r, a]) => [`change.${r}.${f.split('.').pop()}`, 'change', r, a, f, `${f}: the ${r} is part of the date (the value)`])),
  ...['time.state.clock', 'time.state.clock.past', 'time.state.clock.oclock', 'time.state.clock.named'].flatMap((f) => ['phrase', 'hour', 'minutes'].map((r) => [`change.${r}.${f.replace(/\./g, '_')}`, 'change', r, 'value', f, `${f}: the ${r} is part of the time (the value)`])),
].filter(([, , r, , f]) => FRAMES.find((x) => x[0] === f)[6].some((p) => p[0] === 'role' && p[1] === r));

export function timeFrameShard() {
  const lex = Object.entries(lexicons()).map(([name, { doc, items }]) => wire(`w.lang.en.lex.${name}`, 'w.lang.en.lex', [['name', name], ['doc', text(doc)], ...items.map((i) => ['item', text(i)])], SRC));
  const frames = FRAMES.flatMap(([name, act, mode, set, priority, example, parts, fixed, about]) => [`# ${about}`, ...frameLines(name, { act, mode, set, priority, roles: rolesOf(parts), example }, parts, fixed, SRC)]);
  const maps = ROLE_MAPS.map(([n, act, r, actRole, frame, doc]) => wire(`w.lang.en.role_map.${n}`, 'w.lang.en.role_map', [['name', n], ['act', act], ['role', r], ['act_role', actRole], ['frame', frame], ['doc', text(doc)]], SRC));
  return `${header({ id: 'w.lang.en/shards/time-frames', about: `frames that state and ask the date and the time (block 09:20 K7, PSys2 r0586): ${FRAMES.filter((f) => f[1] === 'change').length} statements (change set, set acts.state, the thing and attribute fixed) and ${FRAMES.filter((f) => f[1] === 'ask').length} questions, with the ${Object.keys(lexicons()).length} lexicons they name, derived from k.time (weekdays, months, seasons, hours, clock phrases) and w.lang.en's numerals.`,
    sources: ['hand-core 1 (written in this repository: tools/lang-en-time-frames.mjs; the lexicons derived from k.time and w.lang.en)'], license: 'CC0-1.0', script: 'tools/lang-en-time-frames.mjs' })}\n# Lexicons (derived).\n${lex.join('\n')}\n\n${frames.join('\n')}\n\n# Role maps of these frames.\n${maps.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = timeFrameShard();
  writeFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'time-frames.sop'), t);
  console.log(`time-frames.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
}
