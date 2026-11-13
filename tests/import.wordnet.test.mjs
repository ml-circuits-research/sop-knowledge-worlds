// tools/import/wordnet.mjs: a small fixture in the WordNet file format (made up for the test, not WordNet data), and,
// when the raw files are present (sources/wordnet/raw is git-ignored), that the shards on disk are what it gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { importWordnet, shortGloss, bucketOf, commonThings } from '../tools/import/wordnet.mjs';

const fixture = {
  'data.noun': [
    '  1 a licence line that is not data',
    '00000001 03 n 01 animal 0 001 ~ 00000002 n 0000 | a living creature; "an example sentence"',
    '00000002 05 n 02 dog 0 domestic_dog 0 002 @ 00000001 n 0000 #p 00000003 n 0000 | a pet that barks; "the dog barked"',
    '00000003 14 n 01 pack 0 000 | a group of dogs',
    '00000004 15 n 01 Paris 0 001 @i 00000005 n 0000 | the capital of France',
    '00000005 15 n 01 city 0 000 | a large town',
    '00000006 18 n 01 dog 0 000 | (ethnic slur) a made-up rude sense',
    '00000007 18 n 01 child 0 000 | a young person',
  ].join('\n'),
  'index.noun': [
    '  1 a licence line',
    'animal n 1 1 ~ 1 0 00000001',
    'child n 1 0 1 0 00000007',
    'city n 1 0 1 0 00000005',
    'dog n 2 2 @ #p 2 1 00000002 00000006',
    'pack n 1 0 1 0 00000003',
    'paris n 1 1 @i 1 0 00000004',
  ].join('\n'),
  'data.verb': '00000010 30 v 02 run 0 jog 0 001 @ 00000011 v 0000 01 + 02 00 | move fast on foot\n00000011 30 v 01 move 0 000 01 + 02 00 | change position',
  'index.verb': 'run v 1 1 @ 1 0 00000010\nmove v 1 0 1 0 00000011',
  'noun.exc': 'children child\nmice mouse',
  'verb.exc': 'ran run',
};
const freq = 'the 100\ndog 90\nrun 80\nparis 70\nchild 60\nit\'s 50\ncity 40\n';

test('the importer maps senses, synonyms, is-a, instance-of, part-of and irregular forms', () => {
  const { files, stats } = importWordnet(fixture, freq);
  assert.deepEqual(Object.keys(files), ['ch.sop', 'ci.sop', 'do.sop', 'pa.sop', 'ru.sop']);
  assert.deepEqual(stats, { listed: 6, words: 5, senses: 5, skipped: 1, forms: 2, spellings: 1, shards: 5 });
  const lines = (f) => files[f].split('\n').filter((l) => l.startsWith('@'));
  assert.deepEqual(lines('do.sop'), [
    '@k.words.dog.noun.1 k.words.sense word=dog pos=noun n=1 gloss="a pet that barks" synonym="domestic dog" is_a=animal part_of=pack core.source="wordnet 3.1"',
  ]);
  assert.deepEqual(lines('pa.sop'), [
    '@k.words.paris.noun.1 k.words.sense word=Paris pos=noun n=1 gloss="the capital of France" instance_of=city core.source="wordnet 3.1"',
    '@k.words.paris.spelling.Paris core.word text=paris means=Paris of=k.words.sense.word core.source="wordnet 3.1"',
  ]);
  assert.deepEqual(lines('ru.sop'), [
    '@k.words.run.verb.1 k.words.sense word=run pos=verb n=1 gloss="move fast on foot" synonym=jog is_a=move core.source="wordnet 3.1"',
    '@k.words.run.forms core.word text=ran means=run of=k.words.sense.word core.source="wordnet 3.1"',
  ]);
  assert.equal(lines('ch.sop')[1], '@k.words.child.forms core.word text=children means=child of=k.words.sense.word core.source="wordnet 3.1"');
  for (const text of Object.values(files)) for (const k of ['# sources:', '# license: WordNet-3.0', '# script: tools/import/wordnet.mjs']) assert.ok(text.includes(k));
});

test('the same input gives the same bytes; limits split a bucket into parts', () => {
  assert.deepEqual(importWordnet(fixture, freq).files, importWordnet(fixture, freq).files);
  const { files } = importWordnet(fixture, 'city 1\nchild 1\n', { limits: { maxWires: 1 } });
  assert.deepEqual(Object.keys(files), ['ch.sop', 'ci.sop']);
  const more = importWordnet({ ...fixture, 'index.noun': `${fixture['index.noun']}\nchin n 1 0 1 0 00000005` }, 'child 1\nchin 1\n', { limits: { maxWires: 1 } });
  assert.deepEqual(Object.keys(more.files), ['ch-1.sop', 'ch-2.sop']);
});

test('gloss and bucket helpers', () => {
  assert.equal(shortGloss('a pet; kept at home; "my dog"; "your dog"'), 'a pet; kept at home');
  assert.equal(bucketOf('dog'), 'do');
  assert.equal(bucketOf('x-ray'), 'x');
  assert.equal(bucketOf('a'), 'a');
});

const dict = join(REPO, 'sources/wordnet/raw/wordnet31');
const list = join(REPO, 'sources/frequency-words/raw/en_50k.txt');
test('the k.words shards on disk are what the importer gives from the raw files', { skip: !(existsSync(dict) && existsSync(list)) && 'raw files not downloaded' }, async () => {
  const names = ['index.noun', 'data.noun', 'index.verb', 'data.verb', 'noun.exc', 'verb.exc'];
  const { files } = importWordnet(Object.fromEntries(names.map((f) => [f, readFileSync(join(dict, f), 'latin1')])), readFileSync(list, 'utf8'), { extra: await commonThings() });
  const dir = join(WORLDS_DIR, 'k.words', 'shards');
  assert.deepEqual(readdirSync(dir).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
});

// Round 10, item 2: every common thing of tools/coverage.mjs has its sense in k.words, whatever its place in the
// frequency list (427 of the 1,500 come after the 20,000th line).
test('every common thing has the sense kept by the coverage rule in k.words, with a definition and a kind', { skip: !(existsSync(dict) && existsSync(list)) && 'raw files not downloaded' }, async () => {
  const { run } = await import('../tools/coverage.mjs');
  const { shortGloss: short } = await import('../tools/import/wordnet.mjs');
  const dir = join(WORLDS_DIR, 'k.words', 'shards');
  const lines = new Map();
  for (const f of readdirSync(dir)) for (const l of readFileSync(join(dir, f), 'utf8').split('\n')) {
    const m = / k\.words\.sense word=(\S+) pos=noun /.exec(l);
    if (m) { const w = m[1].toLowerCase(); if (!lines.has(w)) lines.set(w, []); lines.get(w).push(l); }
  }
  const { list: things } = run();
  assert.equal(things.length, 1500);
  for (const e of things) {
    const mine = lines.get(e.word) ?? [];
    assert.ok(mine.some((l) => l.includes(`gloss=${JSON.stringify(short(e.gloss)).slice(0, -1)}`) && / (is_a|instance_of)=/.test(l)), e.word);
  }
});
