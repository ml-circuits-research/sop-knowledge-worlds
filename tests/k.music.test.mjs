// k.music (block 03:20 item 2): the values of music notation, written by rule (tools/music-core.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { musicShards, keys, scales, chords, parseNote, NOTES } from '../tools/music-core.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const all = (type) => factsOf('k.music', type, worlds);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const many = (w, k) => (w.attrs[k] ?? []).map(tok);

test('the shards are what tools/music-core.mjs gives', () => {
  for (const [name, text] of Object.entries(musicShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.music', 'shards', name), 'utf8'), text, name);
});

test('every note of a scale, a chord, a signature or a key names a note; every key, scale and chord a key, scale or chord names exists', () => {
  const notes = new Set(all('k.music.note').map((w) => one(w, 'name')));
  const keyNames = new Set(all('k.music.key').map((w) => one(w, 'name')));
  const scaleNames = new Set(all('k.music.scale').map((w) => one(w, 'name')));
  const chordNames = new Set(all('k.music.chord').map((w) => one(w, 'name')));
  assert.equal(notes.size, 35);
  assert.equal(keyNames.size, 30);
  for (const k of all('k.music.key')) {
    for (const n of [one(k, 'tonic'), ...many(k, 'signature')]) assert.ok(notes.has(n), `${k.id} ${n}`);
    for (const r of ['relative', 'parallel', 'enharmonic']) if (one(k, r)) assert.ok(keyNames.has(one(k, r)), `${k.id} ${r}`);
    assert.ok(scaleNames.has(one(k, 'scale')), k.id);
    assert.equal(many(k, 'chord').length, 7, k.id);
    for (const c of many(k, 'chord')) assert.ok(chordNames.has(c), `${k.id} ${c}`);
  }
  for (const s of all('k.music.scale')) { for (const n of many(s, 'note')) assert.ok(notes.has(n), `${s.id} ${n}`); if (one(s, 'key')) assert.ok(keyNames.has(one(s, 'key')), s.id); }
  for (const c of all('k.music.chord')) for (const n of many(c, 'note')) assert.ok(notes.has(n), `${c.id} ${n}`);
});

test('music theory holds: each scale and chord has one note per letter step, the semitones of its type; keys and signatures agree', () => {
  const pc = (n) => parseNote(n).pc;
  // a major scale is whole, whole, half, whole, whole, whole (then half to the octave); every scale uses each letter once
  for (const s of scales()) {
    const letters = s.notes.map((n) => n[0]);
    assert.equal(new Set(letters).size, letters.length, s.name);
    if (s.type === 'major') assert.deepEqual(s.notes.map((n, i) => (pc(n) - pc(s.notes[0]) + 12) % 12), [0, 2, 4, 5, 7, 9, 11], s.name);
  }
  // the relative minor of a major key is a minor third below its tonic and shares its signature
  for (const k of keys().filter((k) => k.mode === 'major')) {
    const rel = keys().find((o) => o.name === k.relative);
    assert.equal((pc(k.tonic) - pc(rel.tonic) + 12) % 12, 3, k.name);
    assert.deepEqual(rel.signature, k.signature, k.name);
  }
  const chord = (name) => chords().find((c) => c.name === name).notes;
  assert.deepEqual(chord('C'), ['C', 'E', 'G']);
  assert.deepEqual(chord('Dm'), ['D', 'F', 'A']);
  assert.deepEqual(chord('C7'), ['C', 'E', 'G', 'Bb']);
  assert.deepEqual(chord('F#m7b5'), ['F#', 'A', 'C', 'E']);
  assert.deepEqual(chord('Bbmaj7'), ['Bb', 'D', 'F', 'A']);
  assert.equal(NOTES.length, 35);
});

test('the PSys2 music world\'s key names are keys here, and a note letter is a value of its own ("G\'s major scale" is the scale of G)', () => {
  // the keys the music world of the first host writes on its songs (key="C major", "G major", ...)
  const keyNames = new Set(all('k.music.key').map((w) => one(w, 'name')));
  for (const k of ['C major', 'G major', 'D major', 'F major', 'A minor', 'E minor', 'Eb major', 'Bb major']) assert.ok(keyNames.has(k), k);
  const g = all('k.music.scale').find((w) => one(w, 'name') === 'G major scale');
  assert.equal(one(g, 'tonic'), 'G');
  assert.equal(one(g, 'type'), 'major');
  // the spoken names of the keys, scales and chords are words of their names; "G major" alone is the key
  const words = factsOf('k.music', 'core.word', worlds);
  const meaning = (text) => words.filter((w) => many(w, 'text').includes(text)).map((w) => `${one(w, 'of')} ${one(w, 'means')}`);
  assert.deepEqual(meaning('key of G'), ['k.music.key.name G major']);
  assert.deepEqual(meaning('G major chord'), ['k.music.chord.name G']);
  assert.deepEqual(meaning('F sharp minor'), ['k.music.key.name F# minor']);
  assert.deepEqual(meaning('C sharp'), ['k.music.note.name C#']);
  assert.deepEqual(meaning('G major'), []);
});
