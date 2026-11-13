// tools/coverage.mjs: the list of common things and their drawings, on a small fixture in the WordNet file format
// (made up for the test, not WordNet data), and, when the raw files are present, that MISSING.md is what it gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { coverage, missingPage, wordsShard, WORDS_SHARD, plurals, run, objectNames } from '../tools/coverage.mjs';

const files = {
  'data.noun': [
    '00000001 03 n 01 object 0 000 | a physical thing',
    '00000002 06 n 02 car 0 automobile 0 001 @ 00000001 n 0000 | a vehicle with four wheels; "an example"',
    '00000003 05 n 01 dog 0 001 @ 00000001 n 0000 | an animal that barks',
    '00000004 05 n 01 puppy 0 001 @ 00000003 n 0000 | a young dog',
    '00000005 18 n 01 father 0 001 @ 00000001 n 0000 | a male parent',
    '00000006 15 n 01 town 0 001 @ 00000001 n 0000 | a place where people live',
    '00000007 09 n 01 idea 0 000 | a thought',
    '00000008 06 n 01 run 0 001 @ 00000001 n 0000 | a made-up thing called a run',
    '00000009 06 n 02 slug 0 bullet 0 001 @ 00000001 n 0000 | a made-up projectile',
    '00000010 05 n 01 slug 0 001 @ 00000001 n 0000 | a made-up animal without a shell',
    '00000011 13 n 01 grape 0 001 @ 00000001 n 0000 | a made-up fruit',
    '00000012 06 n 01 Mars 0 001 @ 00000001 n 0000 | a made-up proper name',
    '00000013 06 n 01 kettle 0 001 @ 00000001 n 0000 | a made-up pot',
  ].join('\n'),
  'index.noun': ['automobile n 1 1 @ 1 0 00000002', 'bullet n 1 1 @ 1 0 00000009', 'car n 1 1 @ 1 0 00000002', 'dog n 1 1 @ 1 0 00000003', 'father n 1 1 @ 1 0 00000005',
    'grape n 1 1 @ 1 0 00000011', 'idea n 1 0 1 0 00000007', 'kettle n 1 1 @ 1 0 00000013', 'mars n 1 1 @ 1 0 00000012', 'puppy n 1 1 @ 1 0 00000004',
    'run n 1 1 @ 1 0 00000008', 'slug n 2 1 @ 2 0 00000010 00000009', 'town n 1 1 @ 1 0 00000006'].join('\n'),
  'noun.exc': 'mice mouse',
  'index.sense': ['run%1:06:00:: 00000008 1 2', 'run%2:38:00:: 00000099 1 50', 'dog%1:05:00:: 00000003 1 9', 'slug%1:05:00:: 00000010 1 4', 'slug%1:06:00:: 00000009 2 1'].join('\n'),
};
const freq = 'the 900\nrun 800\ncar 700\nfather 600\ntown 500\nidea 400\ndog 300\nautomobile 200\npuppy 150\nbullet 120\ngrape 100\nmars 90\nkettle 80\nab 70\n';
const opts = { files, freq, objects: ['car', 'Dog', 'grapes', 'slug'], roots: ['00000001'] };

test('the list keeps nouns that name a physical thing; a drawing is an object of that name or of its plural', () => {
  const { list, stats, persons } = coverage(opts);
  assert.deepEqual(list.map((e) => e.word), ['car', 'dog', 'automobile', 'puppy', 'bullet', 'grape', 'kettle']);
  assert.deepEqual(list.map((e) => e.drawing), ['car', 'Dog', null, null, null, 'grapes', null]);
  assert.deepEqual(persons, ['father']);
  // run: mostly a verb; idea: not physical; town: a place; mars: a proper name; ab: too short.
  assert.deepEqual({ verbOrOther: stats.verbOrOther, abstract: stats.abstract, otherKinds: stats.otherKinds, persons: stats.persons }, { verbOrOther: 1, abstract: 1, otherKinds: 2, persons: 1 });
  assert.equal(stats.drawn, 3);
});

test('a word without a drawing is linked to a synonym, then to a direct hypernym, kept in the same sense', () => {
  const { list } = coverage(opts);
  const link = Object.fromEntries(list.map((e) => [e.word, e.link]));
  assert.deepEqual(link.automobile, { kind: 'synonym', word: 'car', drawing: 'car' });
  assert.deepEqual(link.puppy, { kind: 'hypernym', word: 'dog', drawing: 'Dog' });
  assert.equal(link.bullet, null, 'slug is first of all the animal');
  assert.equal(link.kettle, null);
  const refused = coverage({ ...opts, notLinks: '# word\tother\treason\npuppy\tdog\ta test\n', notThings: '# word\treason\nkettle\ta test\n' });
  assert.equal(refused.list.find((e) => e.word === 'puppy').link, null);
  assert.ok(!refused.list.some((e) => e.word === 'kettle'));
});

test('plurals, and the page', () => {
  assert.deepEqual(plurals('box', new Map()), ['boxes']);
  assert.deepEqual(plurals('cherry', new Map()), ['cherries']);
  assert.deepEqual(plurals('mouse', new Map([['mouse', ['mice']]])), ['mice', 'mouses']);
  const page = missingPage(coverage(opts));
  assert.ok(page.includes('| 3 | automobile | synonym car | a vehicle with four wheels |'));
  assert.ok(page.includes('| 4 | puppy | hypernym dog (drawing "Dog") | a young dog |'));
  assert.ok(!page.includes('| 1 | car |'));
});

const raw = existsSync(join(REPO, 'sources/wordnet/raw/wordnet31/index.sense')) && existsSync(join(REPO, 'sources/frequency-words/raw/en_50k.txt'));
test('MISSING.md on disk is what the tool gives; the list has 1,500 words', { skip: !raw && 'raw files not downloaded' }, () => {
  const result = run();
  assert.equal(result.list.length, 1500);
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.objects', 'MISSING.md'), 'utf8'), missingPage(result));
  const names = new Set(objectNames());
  for (const e of result.list) { if (e.drawing) assert.ok(names.has(e.drawing), e.word); if (e.link) assert.ok(names.has(e.link.drawing), e.word); }
});

test('the links are a shard of core.word facts with WordNet as the source', () => {
  const text = wordsShard(coverage(opts));
  assert.ok(text.includes('# license: WordNet-3.0'));
  assert.deepEqual(text.split('\n').filter((l) => l.startsWith('@')), [
    '@k.objects.wordnet.same.automobile core.word text=automobile means=car of=k.objects.object.name core.source="wordnet 3.1"',
    '@k.objects.wordnet.kind.puppy core.word text=puppy means=Dog of=k.objects.object.name core.source="wordnet 3.1"',
  ]);
});

test('words-wordnet.sop on disk is what the tool gives; every word names an object and is not an object name itself', { skip: !raw && 'raw files not downloaded' }, () => {
  const result = run();
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${WORDS_SHARD}.sop`), 'utf8'), wordsShard(result));
  const names = new Set(objectNames());
  const lower = new Set([...names].map((n) => n.toLowerCase()));
  const world = fullWorld('k.objects');
  const words = world.ofType('core.word').filter((w) => w.attrs['core.source']?.includes('"wordnet 3.1"'));
  assert.equal(words.length, result.stats.bySynonym + result.stats.byHypernym);
  for (const w of words) {
    const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
    assert.ok(names.has(tok(w.attrs.means[0])), w.id);
    assert.ok(!lower.has(tok(w.attrs.text[0])), w.id);
  }
  const puppy = words.find((w) => w.attrs.text[0] === 'puppy');
  assert.equal(puppy?.attrs.means[0], 'dog');
});
