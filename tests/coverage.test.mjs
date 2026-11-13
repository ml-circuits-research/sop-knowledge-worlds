// tools/coverage.mjs: the list of common things and their drawings, on a small fixture in the WordNet file format
// (made up for the test, not WordNet data), and, when the raw files are present, that MISSING.md is what it gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { coverage, missingPage, wordsShard, standInsShard, WORDS_SHARD, STAND_INS_SHARD, HAND_WORDS_SHARD, HAND_STAND_INS_SHARD, handShards, handRows, objectWords, plurals, run, objectNames } from '../tools/coverage.mjs';

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

test('a synonym is a core.word, a hypernym is a k.objects.stand_in fact, both with WordNet as the source', () => {
  const text = wordsShard(coverage(opts));
  assert.ok(text.includes('# license: WordNet-3.0'));
  assert.deepEqual(text.split('\n').filter((l) => l.startsWith('@')), [
    '@k.objects.wordnet.same.automobile core.word text=automobile means=car of=k.objects.object.name core.source="wordnet 3.1"',
  ]);
  const standIns = standInsShard(coverage(opts));
  assert.ok(standIns.includes('# license: WordNet-3.0'));
  assert.deepEqual(standIns.split('\n').filter((l) => l.startsWith('@')), [
    '@k.objects.wordnet.kind.puppy k.objects.stand_in name=puppy drawing=Dog core.source="wordnet 3.1"',
  ]);
});

test('the sense check (Q22): a drawing of another physical WordNet sense counts; one of no WordNet sense does not', () => {
  const check = (instead, shown = '') => `# word\tdrawing\tverdict\tnote\tinstead\tshown\ncar\tcar\tright\t\t\t\ngrape\tgrapes\twrong\tthe drawing shows a made-up other thing\t${instead}\t${shown}\n`;
  const a = coverage({ ...opts, senseCheck: check('') });
  const grape = a.list.find((e) => e.word === 'grape');
  assert.equal(grape.drawing, null);
  assert.deepEqual(grape.wrong, { drawing: 'grapes', note: 'the drawing shows a made-up other thing' });
  assert.deepEqual({ drawn: a.stats.drawn, wrongSense: a.stats.wrongSense, otherName: a.stats.otherName }, { drawn: 2, wrongSense: 1, otherName: 0 });
  assert.ok(missingPage(a).includes('| 6 | grape | other sense: the drawing shows a made-up other thing | a made-up fruit |'));
  const b = coverage({ ...opts, senseCheck: check('slug') });
  assert.equal(b.list.find((e) => e.word === 'grape').drawing, 'slug');
  assert.deepEqual({ drawn: b.stats.drawn, wrongSense: b.stats.wrongSense, otherName: b.stats.otherName }, { drawn: 3, wrongSense: 1, otherName: 1 });
  // slug has two physical senses; the sense kept is the animal (00000010). A drawing of the projectile still counts.
  const slug = (shown) => `# word\tdrawing\tverdict\tnote\tinstead\tshown\nslug\tslug\twrong\tthe drawing shows the projectile\t\t${shown}\n`;
  const withSlug = { ...opts, freq: `${opts.freq}slug 60\n` };
  const c = coverage({ ...withSlug, senseCheck: slug('00000009') });
  const entry = c.list.find((e) => e.word === 'slug');
  assert.equal(entry.drawing, 'slug');
  assert.equal(entry.wrong, null);
  assert.equal(entry.other.shown, '00000009');
  assert.deepEqual({ otherSense: c.stats.otherSense, wrongSense: c.stats.wrongSense }, { otherSense: 1, wrongSense: 0 });
  assert.ok(!missingPage(c).includes('| slug |'));
  assert.equal(coverage({ ...withSlug, senseCheck: slug('') }).list.find((e) => e.word === 'slug').drawing, null);
  assert.throws(() => coverage({ ...withSlug, senseCheck: slug('00000007') }), /not a physical noun sense/);
  assert.throws(() => coverage({ ...withSlug, senseCheck: slug('00000003') }), /not a physical noun sense/);
});

test('a thing that is not drawable leaves the list and is named on the page', () => {
  const r = coverage({ ...opts, notDrawable: '# word\treason\nkettle\ta made-up reason\n' });
  assert.ok(!r.list.some((e) => e.word === 'kettle'));
  assert.equal(r.stats.notDrawable, 1);
  assert.ok(missingPage(r).includes('| kettle | a made-up reason | a made-up pot |'));
});

test('words-wordnet.sop on disk is what the tool gives; every word names an object and is not an object name itself', { skip: !raw && 'raw files not downloaded' }, () => {
  const result = run();
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${WORDS_SHARD}.sop`), 'utf8'), wordsShard(result));
  const names = new Set(objectNames());
  const lower = new Set([...names].map((n) => n.toLowerCase()));
  const world = fullWorld('k.objects');
  const words = world.ofType('core.word').filter((w) => w.attrs['core.source']?.includes('"wordnet 3.1"'));
  assert.equal(words.length, result.stats.bySynonym);
  const tok = (t) => (t.startsWith('"') ? JSON.parse(t) : t);
  for (const w of words) {
    assert.ok(names.has(tok(w.attrs.means[0])), w.id);
    assert.ok(!lower.has(tok(w.attrs.text[0])), w.id);
  }
  assert.equal(words.find((w) => w.attrs.text[0] === 'couch')?.attrs.means[0], 'sofa');
  // The hypernyms: stand-in facts, never a word (Q21).
  assert.equal(readFileSync(join(WORLDS_DIR, 'k.objects', 'shards', `${STAND_INS_SHARD}.sop`), 'utf8'), standInsShard(result));
  const allStandIns = world.ofType('k.objects.stand_in');
  const standIns = allStandIns.filter((w) => w.attrs['core.source']?.includes('"wordnet 3.1"'));
  assert.equal(standIns.length, result.stats.byHypernym);
  for (const w of allStandIns) {
    assert.ok(names.has(tok(w.attrs.drawing[0])), w.id);
    assert.ok(!lower.has(tok(w.attrs.name[0])), w.id);
    assert.ok(!words.some((x) => x.attrs.text[0] === w.attrs.name[0]), w.id);
  }
  assert.equal(standIns.find((w) => w.attrs.name[0] === 'puppy')?.attrs.drawing[0], 'dog');
});

test('links written by hand (Round 7): a word of an object in a hand-written shard, then hand-links.tsv', () => {
  const o = { ...opts, freq: `${opts.freq}hound 60\nmutt 50\n`, files: { ...files,
    'data.noun': `${files['data.noun']}\n00000014 05 n 02 hound 0 mutt 0 001 @ 00000001 n 0000 | a made-up dog`,
    'index.noun': `${files['index.noun']}\nhound n 1 1 @ 1 0 00000014\nmutt n 1 1 @ 1 0 00000014` } };
  assert.equal(coverage(o).list.find((e) => e.word === 'hound').link, null);
  const r = coverage({ ...o, words: new Map([['kettle', 'car']]), handLinks: '# word\tlink\tdrawing\nhound\tkind\tDog\nmutt\tsame\tDog\npuppy\tkind\tcar\n' });
  const link = Object.fromEntries(r.list.map((e) => [e.word, e.link]));
  assert.deepEqual(link.hound, { kind: 'hand stand-in', word: 'Dog', drawing: 'Dog' });
  assert.deepEqual(link.mutt, { kind: 'hand synonym', word: 'Dog', drawing: 'Dog' });
  assert.deepEqual(link.kettle, { kind: 'word', word: 'car', drawing: 'car' });
  assert.equal(link.puppy.kind, 'hypernym', 'the WordNet link comes first');
  assert.deepEqual({ byWord: r.stats.byWord, byHandSame: r.stats.byHandSame, byHandKind: r.stats.byHandKind }, { byWord: 1, byHandSame: 1, byHandKind: 1 });
  assert.ok(missingPage(r).includes('| hound | hand stand-in Dog |'));
  const shards = handShards('hound\tkind\tDog\nmutt\tsame\tDog\n', ['Dog', 'car']);
  assert.ok(shards[`${HAND_STAND_INS_SHARD}.sop`].includes('@k.objects.hand.kind.hound k.objects.stand_in name=hound drawing=Dog core.source="hand-core 1"'));
  assert.ok(shards[`${HAND_WORDS_SHARD}.sop`].includes('@k.objects.hand.same.mutt core.word text=mutt means=Dog of=k.objects.object.name core.source="hand-core 1"'));
  assert.throws(() => handRows('hound\tkind\twolf\n', ['Dog']), /no object/);
  assert.throws(() => handRows('car\tkind\tDog\n', ['Dog', 'car']), /is an object itself/);
  assert.throws(() => handRows('hound\tsame\tDog\n', ['Dog'], new Map([['hound', 'Dog']])), /already a word/);
});

test('the hand-link shards on disk are what the tool gives; no word is linked twice', { skip: !raw && 'raw files not downloaded' }, () => {
  const text = readFileSync(join(REPO, 'sources/coverage/hand-links.tsv'), 'utf8');
  const shards = handShards(text, objectNames(), objectWords());
  for (const [name, content] of Object.entries(shards)) assert.equal(readFileSync(join(WORLDS_DIR, 'k.objects', 'shards', name), 'utf8'), content, name);
  const result = run();
  const byRule = new Set(result.list.filter((e) => e.link && ['synonym', 'hypernym'].includes(e.link.kind)).map((e) => e.word));
  for (const [word] of handRows(text, objectNames())) assert.ok(!byRule.has(word), `${word} has a WordNet link already`);
  const standIn = fullWorld('k.objects').query({ type: 'k.objects.stand_in', where: { name: 'villa' }, seek: 'drawing' });
  assert.equal(standIn.value, 'house');
});

test('sense-check.tsv has one verdict for every common thing with an object of its name, and no other row', { skip: !raw && 'raw files not downloaded' }, () => {
  const rows = readFileSync(join(REPO, 'sources/coverage/sense-check.tsv'), 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));
  const names = new Set(objectNames());
  const result = run();
  const matched = new Map(result.list.filter((e) => e.wrong || (e.drawing && !e.link)).map((e) => [e.word, e.wrong ? e.wrong.drawing : e.drawing]));
  assert.deepEqual(rows.map((r) => r[0]).sort(), [...matched.keys()].sort());
  assert.equal(result.stats.wrongSense, rows.filter((r) => r[2] === 'wrong' && !r[5]).length);
  assert.equal(result.stats.otherSense, rows.filter((r) => r[2] === 'wrong' && r[5]).length);
  for (const [word, drawing, verdict, note, instead, shown] of rows) {
    if (shown) { assert.equal(verdict, 'wrong', word); assert.match(shown, /^\d{8}$/, word); }
    assert.equal(drawing, matched.get(word), word);
    assert.ok(['right', 'wrong', 'unclear'].includes(verdict), word);
    if (verdict !== 'right') assert.ok(note, `${word}: a note says what the drawing shows`);
    if (instead) { assert.equal(verdict, 'wrong', word); assert.ok(names.has(instead), `${word}: ${instead}`); }
  }
});
