# k.music

The values of music notation, as typed values with their parts as keys (reviewer block 2026-11-15 03:20, item 2;
PSys2 Q15: a proposal "play the D major scale" was accepted for "Play the G's major scale" because the note letter
was no value a checker could bind). Written by rule (`tools/music-core.mjs`, `hand-core 1`, CC0-1.0) from what every
textbook of Western music theory gives: the seven letters and the semitones of the natural notes, the accidentals,
the intervals as letters and semitones, the interval patterns of the scales and chords, the order of sharps
(F C G D A E B) and flats (B E A D G C F) and the circle of fifths. No input but the tool; the test checks the rules
(a major scale is whole, whole, half, whole, whole, whole; a relative minor is a minor third below and shares the
signature; each scale uses each letter once).

## What it knows

- `k.music.note` (identity `name`): the 35 note names, written as the music world writes them (`C`, `F#`, `Bb`,
  `F##`, `Bbb`): `letter` (C to B), `accidental` (natural, sharp, flat, double sharp, double flat), `pitch_class`
  (semitones above C, 0 to 11), `enharmonic` (the other spellings: C# and Db and B##). Words: the spoken forms
  ("C sharp", "C-sharp", "C♯", "B flat", "F double sharp").
- `k.music.interval` (identity `name`): 16 intervals up to the octave: `semitones`, `number` (3 for a third),
  `quality` (perfect, major, minor, augmented, diminished); words "tritone", "fifth", "half step", "whole step".
- `k.music.key` (identity `name`, "G major", "F# minor"): the 15 major and 15 minor keys with up to seven sharps or
  flats: `tonic`, `mode`, `sharps` or `flats` (never both; C major and A minor have `sharps=0`), `signature` (the
  notes in the order they are written), `relative` ("E minor" for "G major"), `parallel` (the other mode on the
  same tonic, where it is one of the 30), `enharmonic` (F# major and Gb major), `scale`, `chord` (the seven triads
  in the order of the degrees: G Am Bm C D Em F#dim). Words: "key of G", "key of G major", "G major key",
  "F sharp minor". **The names are those of the music world of the first host** (its songs say `key="C major"`,
  `"G major"`, `"Eb major"`): a key a host reads there is a key here, by name.
- `k.music.scale` (identity `name`, "G major scale"): 90 scales: major on the 15 major tonics; minor (natural),
  harmonic minor, melodic minor (rising) on the 15 minor tonics; major and minor pentatonic: `tonic`, `type`,
  `note` (from the tonic up, in order, each once: G A B C D E F#), `key` (the key of its tonic and mode). Words:
  "scale of G major", "G natural minor scale", "F sharp major scale".
- `k.music.chord` (identity `name`, the chord symbol: `C`, `Dm`, `C7`, `Cmaj7`, `Bdim`, `F#m7b5`, `Gsus4`): 209
  chords: 12 qualities (major, minor, diminished, augmented, dominant seventh, major seventh, minor seventh,
  diminished seventh, half diminished seventh, suspended second, suspended fourth, major sixth) on 17 roots
  (C C# Db D D# Eb E F F# Gb G G# Ab A A# Bb B), and the 5 triads the keys name on other roots (B#dim, Cb, E#dim,
  E#m, Fb): `root`, `quality`, `note` (from the root up: C E G Bb). Words: "C major chord", "C chord", "D minor
  triad", "G seventh", "C sharp minor chord". **"G major" alone is the key**, never the chord: the chord's words
  all say chord, triad or a quality word other than major or minor.

Shards: `notes` (35 notes, 16 intervals, 36 word wires), `keys` (30 keys, 90 scales, 120 word wires), `chords`
(209 chords, 209 word wires). 745 wires, 189,912 bytes.

## Joins

`tonic`, `root`, `note`, `signature` and `enharmonic` name `k.music.note` facts; `relative`, `parallel`, `enharmonic`
of a key and `key` of a scale name keys; `scale` and `chord` of a key name scales and chords: all declared
(`type=k.music.<type> by=name`) and all met inside this world. The numbers have their measures in `k.units.measure`
(semitones, sharps, flats; the number of an interval is an ordinal).

## What is not here

- Which chord a set of notes makes ("what chord is C E G") is a match of the set of `note` values against the chords,
  which a host does (a query names one value per key). Inversions and slash chords (C/E) are not here.
- Modes other than major and minor (Dorian ...), the blues and chromatic scales, keys with more than seven
  accidentals (G# major), tempo and dynamics words (allegro, forte), durations (crotchet, quarter note).
- Words of other languages (Do, Re, Mi; G-Dur): translation is the application's layer.

## Questions it helps with

See `tests/k.music.questions.jsonl`: what notes are in a C major chord, play the G major scale, what key has five
sharps, what the relative minor of C major is, how many sharps E major has, the notes of a C7 chord, the triads of F
major, another name for C sharp, how many semitones a major third has, the key signature of B flat major.
