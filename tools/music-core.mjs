// k.music (reviewer block 2026-11-15 03:20, item 2; PSys2 Q15: "Play the G's major scale" was read as the D major
// scale): the values of music notation, written by rule from the facts of Western music theory every textbook gives:
//   - the seven letters and the semitones of the natural notes (C 0, D 2, E 4, F 5, G 7, A 9, B 11);
//   - an accidental moves a note by semitones (sharp +1, flat -1, double sharp +2, double flat -2);
//   - an interval is a number of letters and of semitones (a major third: 3 letters, 4 semitones);
//   - a scale or a chord is a list of intervals above its tonic or root, each spelt on its own letter;
//   - the order of sharps (F C G D A E B) and of flats (B E A D G C F) and the circle of fifths give the 30 keys.
//   node tools/music-core.mjs     writes docs/worlds/k.music/shards/*.sop
// Deterministic: no input but this file.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const ACCIDENTALS = [['double flat', -2, 'bb'], ['flat', -1, 'b'], ['natural', 0, ''], ['sharp', 1, '#'], ['double sharp', 2, '##']];
const SIGN = Object.fromEntries(ACCIDENTALS.map(([n, s, t]) => [s, [n, t]]));
const mod12 = (n) => ((n % 12) + 12) % 12;

// The spelling of the note `steps` letters and `semis` semitones above `note` (a "major third above E" is G#).
export function noteAt(note, steps, semis) {
  const letter = LETTERS[(LETTERS.indexOf(note.letter) + steps) % 7];
  let shift = mod12(note.pc + semis) - NATURAL[letter];
  if (shift > 6) shift -= 12;
  if (shift < -6) shift += 12;
  if (!SIGN[shift]) throw new Error(`no spelling of ${note.name} + ${steps}/${semis}`);
  return makeNote(letter, shift);
}
export const makeNote = (letter, shift) => ({ letter, shift, name: letter + SIGN[shift][1], pc: mod12(NATURAL[letter] + shift), accidental: SIGN[shift][0] });
export const parseNote = (name) => makeNote(name[0], ACCIDENTALS.find(([, , t]) => t === name.slice(1))[1]);
export const NOTES = LETTERS.flatMap((l) => ACCIDENTALS.map(([, s]) => makeNote(l, s)));

// [name, letters above (number - 1), semitones, number, quality]
export const INTERVALS = [
  ['perfect unison', 0, 0, 1, 'perfect'], ['minor second', 1, 1, 2, 'minor'], ['major second', 1, 2, 2, 'major'], ['minor third', 2, 3, 3, 'minor'],
  ['major third', 2, 4, 3, 'major'], ['perfect fourth', 3, 5, 4, 'perfect'], ['augmented fourth', 3, 6, 4, 'augmented'], ['diminished fifth', 4, 6, 5, 'diminished'],
  ['perfect fifth', 4, 7, 5, 'perfect'], ['augmented fifth', 4, 8, 5, 'augmented'], ['minor sixth', 5, 8, 6, 'minor'], ['major sixth', 5, 9, 6, 'major'],
  ['diminished seventh', 6, 9, 7, 'diminished'], ['minor seventh', 6, 10, 7, 'minor'], ['major seventh', 6, 11, 7, 'major'], ['perfect octave', 7, 12, 8, 'perfect'],
];
const IV = Object.fromEntries(INTERVALS.map(([n, l, s]) => [n, [l, s]]));
const INTERVAL_WORDS = { 'augmented fourth': ['tritone'], 'perfect fifth': ['fifth'], 'perfect fourth': ['fourth'], 'perfect octave': ['octave'], 'perfect unison': ['unison'], 'major third': ['third'], 'major second': ['second', 'whole step', 'whole tone', 'tone'], 'minor second': ['half step', 'semitone'] };

// The scale types: the intervals above the tonic.
export const SCALE_TYPES = {
  major: ['perfect unison', 'major second', 'major third', 'perfect fourth', 'perfect fifth', 'major sixth', 'major seventh'],
  minor: ['perfect unison', 'major second', 'minor third', 'perfect fourth', 'perfect fifth', 'minor sixth', 'minor seventh'],
  'harmonic minor': ['perfect unison', 'major second', 'minor third', 'perfect fourth', 'perfect fifth', 'minor sixth', 'major seventh'],
  'melodic minor': ['perfect unison', 'major second', 'minor third', 'perfect fourth', 'perfect fifth', 'major sixth', 'major seventh'],
  'major pentatonic': ['perfect unison', 'major second', 'major third', 'perfect fifth', 'major sixth'],
  'minor pentatonic': ['perfect unison', 'minor third', 'perfect fourth', 'perfect fifth', 'minor seventh'],
};
// The chord qualities: [quality, symbol suffix, intervals above the root, other words of the quality].
export const CHORD_TYPES = [
  ['major', '', ['perfect unison', 'major third', 'perfect fifth'], ['major', 'major triad', 'maj']],
  ['minor', 'm', ['perfect unison', 'minor third', 'perfect fifth'], ['minor', 'minor triad', 'min']],
  ['diminished', 'dim', ['perfect unison', 'minor third', 'diminished fifth'], ['diminished', 'diminished triad']],
  ['augmented', 'aug', ['perfect unison', 'major third', 'augmented fifth'], ['augmented', 'augmented triad']],
  ['dominant seventh', '7', ['perfect unison', 'major third', 'perfect fifth', 'minor seventh'], ['seventh', 'dominant seventh', '7']],
  ['major seventh', 'maj7', ['perfect unison', 'major third', 'perfect fifth', 'major seventh'], ['major seventh', 'major 7']],
  ['minor seventh', 'm7', ['perfect unison', 'minor third', 'perfect fifth', 'minor seventh'], ['minor seventh', 'minor 7']],
  ['diminished seventh', 'dim7', ['perfect unison', 'minor third', 'diminished fifth', 'diminished seventh'], ['diminished seventh', 'diminished 7']],
  ['half diminished seventh', 'm7b5', ['perfect unison', 'minor third', 'diminished fifth', 'minor seventh'], ['half diminished', 'half diminished seventh', 'minor seven flat five']],
  ['suspended second', 'sus2', ['perfect unison', 'major second', 'perfect fifth'], ['suspended second', 'sus2']],
  ['suspended fourth', 'sus4', ['perfect unison', 'perfect fourth', 'perfect fifth'], ['suspended fourth', 'sus4', 'sus']],
  ['major sixth', '6', ['perfect unison', 'major third', 'perfect fifth', 'major sixth'], ['sixth', 'major sixth', '6']],
];
// The roots of the chords: every natural note and the sharps and flats of the black keys (17 spellings).
export const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const spell = (tonic, intervals) => intervals.map((i) => noteAt(tonic, ...IV[i]).name);
// The 30 keys: tonics by the circle of fifths, with up to 7 sharps or flats.
const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'], FLAT_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];
export function keys() {
  const out = [];
  const majors = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'].map((t, i) => [t, i, 0]).concat(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].map((t, i) => [t, 0, i + 1]));
  for (const [tonic, sharps, flats] of majors) {
    const rel = noteAt(parseNote(tonic), 5, 9).name; // the relative minor: a major sixth up
    out.push({ tonic, mode: 'major', sharps, flats, rel });
    out.push({ tonic: rel, mode: 'minor', sharps, flats, rel: tonic });
  }
  const name = (t, m) => `${t} ${m}`;
  const all = new Set(out.map((k) => name(k.tonic, k.mode)));
  const pcOf = (k) => `${parseNote(k.tonic).pc} ${k.mode}`;
  for (const k of out) {
    k.name = name(k.tonic, k.mode);
    k.relative = name(k.rel, k.mode === 'major' ? 'minor' : 'major');
    const par = name(k.tonic, k.mode === 'major' ? 'minor' : 'major');
    k.parallel = all.has(par) ? par : undefined;
    k.enharmonic = out.find((o) => o !== k && pcOf(o) === pcOf(k))?.tonic;
    if (k.enharmonic) k.enharmonic = name(k.enharmonic, k.mode);
    k.signature = k.sharps ? SHARP_ORDER.slice(0, k.sharps) : FLAT_ORDER.slice(0, k.flats);
    k.notes = spell(parseNote(k.tonic), SCALE_TYPES[k.mode]);
    // the triads on the degrees of the scale, by the thirds of the scale itself
    k.chords = k.notes.map((root, i) => {
      const third = k.notes[(i + 2) % 7], fifth = k.notes[(i + 4) % 7];
      const r = parseNote(root), t = (parseNote(third).pc - r.pc + 12) % 12, f = (parseNote(fifth).pc - r.pc + 12) % 12;
      const suffix = t === 4 && f === 7 ? '' : t === 3 && f === 7 ? 'm' : t === 3 && f === 6 ? 'dim' : 'aug';
      return root + suffix;
    });
    // the key's scale notes are the signature's: a check on the rule
    const accidentals = k.notes.filter((n) => n.length > 1).sort();
    if (JSON.stringify(accidentals) !== JSON.stringify([...k.signature].sort())) throw new Error(`${k.name}: ${k.notes} against ${k.signature}`);
  }
  return out;
}

export function scales(keyList = keys()) {
  const out = [];
  const keyNames = new Set(keyList.map((k) => k.name));
  const majors = keyList.filter((k) => k.mode === 'major').map((k) => k.tonic), minors = keyList.filter((k) => k.mode === 'minor').map((k) => k.tonic);
  for (const [type, tonics, mode] of [['major', majors, 'major'], ['minor', minors, 'minor'], ['harmonic minor', minors, 'minor'], ['melodic minor', minors, 'minor'], ['major pentatonic', majors, 'major'], ['minor pentatonic', minors, 'minor']])
    for (const tonic of tonics) {
      const key = `${tonic} ${mode}`;
      out.push({ name: `${tonic} ${type} scale`, tonic, type, notes: spell(parseNote(tonic), SCALE_TYPES[type]), key: keyNames.has(key) ? key : undefined });
    }
  return out;
}

// Every quality on the 17 roots, and the triads the keys name on other roots (E#dim in F# major, Cb in Cb major).
export function chords(keyList = keys()) {
  const make = (root, [quality, suffix, intervals, words]) => ({ name: root + suffix, root, quality, notes: spell(parseNote(root), intervals), words });
  const out = ROOTS.flatMap((root) => CHORD_TYPES.map((t) => make(root, t)));
  const have = new Set(out.map((c) => c.name));
  for (const name of [...new Set(keyList.flatMap((k) => k.chords))].sort()) if (!have.has(name)) {
    const m = name.match(/^([A-G](?:#|b)?)(m|dim|aug)?$/);
    out.push(make(m[1], CHORD_TYPES.find((t) => t[1] === (m[2] ?? ''))));
    have.add(name);
  }
  return out;
}

// Spoken forms of a note name: "C sharp", "E flat", "F double sharp"; the Unicode signs.
const spoken = (n) => (n.shift === 0 ? [] : [`${n.letter} ${n.accidental}`, `${n.letter}-${n.accidental.replace(' ', '-')}`, n.letter + ({ 1: '♯', '-1': '♭', 2: '𝄪', '-2': '𝄫' })[n.shift]]);
const word = (id, texts, means, of) => wire(id, 'core.word', [...[...new Set(texts)].map((t) => ['text', t]), ['means', means], ['of', of]], SRC);

export function musicShards() {
  const files = {};
  const shard = (id, about, body) => `${header({ id: `k.music/shards/${id}`, about, sources: ['hand-core 1 (written by rule: tools/music-core.mjs, from the note letters, semitone patterns and orders of sharps and flats of Western music theory)'], license: 'CC0-1.0', script: 'tools/music-core.mjs' })}\n${body}\n`;
  // Notes and intervals.
  {
    const lines = NOTES.map((n) => wire(`k.music.note.${seg(n.name.replace(/#/g, 's'))}`, 'k.music.note', [['name', n.name], ['letter', n.letter], ['accidental', n.accidental], ['pitch_class', n.pc],
      ...NOTES.filter((o) => o !== n && o.pc === n.pc).map((o) => ['enharmonic', o.name])], SRC));
    const words = NOTES.filter((n) => n.shift !== 0).map((n) => word(`k.music.word.note.${seg(n.name.replace(/#/g, 's'))}`, spoken(n), n.name, 'k.music.note.name'));
    const ivs = INTERVALS.map(([name, , semis, number, quality]) => wire(`k.music.interval.${seg(name)}`, 'k.music.interval', [['name', name], ['semitones', semis], ['number', number], ['quality', quality]], SRC));
    const ivWords = Object.entries(INTERVAL_WORDS).map(([n, ws]) => word(`k.music.word.interval.${seg(n)}`, ws, n, 'k.music.interval.name'));
    files['notes.sop'] = shard('notes', `the ${NOTES.length} note names (7 letters, each natural, sharp, flat, double sharp and double flat) with their pitch class and other spellings; the ${INTERVALS.length} intervals up to the octave; and the spoken forms ("C sharp", "B flat", "tritone").`,
      `${lines.join('\n')}\n\n${ivs.join('\n')}\n\n# Words: spoken forms of the notes and other names of the intervals.\n${words.join('\n')}\n${ivWords.join('\n')}`);
  }
  // Keys and scales.
  {
    const ks = keys(), ss = scales(ks);
    const lines = ks.map((k) => wire(`k.music.key.${seg(k.name.replace(/#/g, 's'))}`, 'k.music.key', [['name', k.name], ['tonic', k.tonic], ['mode', k.mode], k.flats ? ['flats', k.flats] : ['sharps', k.sharps],
      ...k.signature.map((n) => ['signature', n]), ['relative', k.relative], ['parallel', k.parallel], ['enharmonic', k.enharmonic], ['scale', `${k.tonic} ${k.mode} scale`], ...k.chords.map((c) => ['chord', c])], SRC));
    const keyWords = ks.map((k) => {
      const n = parseNote(k.tonic);
      const forms = [k.tonic, ...spoken(n)].flatMap((t) => [`${t} ${k.mode} key`, `key of ${t} ${k.mode}`, `${t} ${k.mode}`]).filter((t) => t !== k.name);
      if (k.mode === 'major') forms.push(`key of ${k.tonic}`, ...spoken(n).map((t) => `key of ${t}`));
      return word(`k.music.word.key.${seg(k.name.replace(/#/g, 's'))}`, forms, k.name, 'k.music.key.name');
    });
    const scaleLines = ss.map((s) => wire(`k.music.scale.${seg(s.name.replace(/#/g, 's'))}`, 'k.music.scale', [['name', s.name], ['tonic', s.tonic], ['type', s.type], ...s.notes.map((x) => ['note', x]), ['key', s.key]], SRC));
    const scaleWords = ss.map((s) => {
      const n = parseNote(s.tonic);
      const type = s.type === 'minor' ? ['minor', 'natural minor'] : [s.type];
      const forms = [s.tonic, ...spoken(n)].flatMap((t) => type.flatMap((ty) => [`${t} ${ty} scale`, `scale of ${t} ${ty}`])).filter((t) => t !== s.name);
      return word(`k.music.word.scale.${seg(s.name.replace(/#/g, 's'))}`, forms, s.name, 'k.music.scale.name');
    });
    files['keys.sop'] = shard('keys', `the ${ks.length} keys (15 major, 15 minor: up to seven sharps or flats) with their signature, relative, parallel and enharmonic keys, scale and triads; the ${ss.length} scales of their tonics (major, natural, harmonic and melodic minor, major and minor pentatonic) with their notes; and their spoken names ("key of G", "F sharp minor", "scale of D major").`,
      `${lines.join('\n')}\n\n${scaleLines.join('\n')}\n\n# Words: other names of the keys and scales.\n${keyWords.join('\n')}\n${scaleWords.join('\n')}`);
  }
  // Chords.
  {
    const cs = chords();
    const lines = cs.map((c) => wire(`k.music.chord.${seg(c.name.replace(/#/g, 's'))}`, 'k.music.chord', [['name', c.name], ['root', c.root], ['quality', c.quality], ...c.notes.map((x) => ['note', x])], SRC));
    const words = cs.map((c) => {
      const n = parseNote(c.root);
      // "X major" and "X minor" alone are the keys; a word that already says triad takes no "chord"
      const forms = [c.root, ...spoken(n)].flatMap((t) => c.words.flatMap((w) => [...(/triad/.test(w) ? [] : [`${t} ${w} chord`]), `${t} ${w}`, ...(w === c.words[0] && w === 'major' ? [`${t} chord`] : [])]));
      return word(`k.music.word.chord.${seg(c.name.replace(/#/g, 's'))}`, forms.filter((t) => t !== c.name && !/ (major|minor)$/.test(t)), c.name, 'k.music.chord.name');
    });
    files['chords.sop'] = shard('chords', `${cs.length} chords: ${CHORD_TYPES.length} qualities (${CHORD_TYPES.map((c) => c[0]).join(', ')}) on ${ROOTS.length} roots (${ROOTS.join(' ')}), and the ${cs.length - ROOTS.length * CHORD_TYPES.length} triads the keys name on other roots (${cs.slice(ROOTS.length * CHORD_TYPES.length).map((c) => c.name).join(', ')}), named by their chord symbols, with their notes from the root up and their spoken names ("C major chord", "D minor triad", "G seventh").`,
      `${lines.join('\n')}\n\n# Words: spoken names of the chords ("G major" alone is the key; "G major chord" the chord).\n${words.join('\n')}`);
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = musicShards();
  writeShards(join(WORLDS_DIR, 'k.music', 'shards'), files);
  console.log(Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n'));
}
