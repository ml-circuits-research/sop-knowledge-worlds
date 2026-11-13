// tools/import/wordnet.mjs: a small fixture in the WordNet file format (made up for the test, not WordNet data), and,
// when the raw files are present (sources/wordnet/raw is git-ignored), that the shards on disk are what it gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, fullWorld } from '../tools/lib/worlds.mjs';
import { importWordnet, shortGloss, bucketOf, commonThings, extraWords, coreNames } from '../tools/import/wordnet.mjs';

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
  const { files, stats } = importWordnet(fixture, freq, { commonLimit: 0 });
  assert.deepEqual(Object.keys(files), ['ch.sop', 'ci.sop', 'do.sop', 'pa.sop', 'ru.sop']);
  assert.deepEqual(stats, { listed: 6, words: 5, senses: 5, skipped: 1, forms: 2, spellings: 1, shards: 5, opposites: 0, nearOpposites: 0, chains: 0 });
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

test('Round 9: opposites, near opposites of adjectives, adjectives and adverbs and the chain of kinds for the common words', () => {
  const more = {
    ...fixture,
    // run ! (word 1 of 00000010) stand (word 1 of 00000012); jog, the second word of the synset, has no opposite.
    'data.verb': '00000010 30 v 02 run 0 jog 0 002 @ 00000011 v 0000 ! 00000012 v 0101 01 + 02 00 | move fast on foot\n00000011 30 v 01 move 0 000 01 + 02 00 | change position\n00000012 30 v 01 stand 0 001 ! 00000010 v 0101 01 + 02 00 | be upright',
    'index.verb': 'run v 1 2 @ ! 1 0 00000010\nmove v 1 0 1 0 00000011\nstand v 1 1 ! 1 0 00000012\njog v 1 1 @ 1 0 00000010',
    'data.adj': ['00000020 00 a 01 big 0 002 ! 00000021 a 0101 & 00000022 a 0000 | above average in size', '00000021 00 a 01 small 0 001 ! 00000020 a 0101 | limited in size',
      '00000022 00 s 01 huge 0 001 & 00000020 a 0000 | unusually great in size'].join('\n'),
    'index.adj': 'big a 1 2 ! & 1 0 00000020\nhuge a 1 1 & 1 0 00000022\nsmall a 1 1 ! 1 0 00000021',
    'data.adv': '00000030 02 r 01 fast 0 000 | quickly',
    'index.adv': 'fast r 1 0 1 0 00000030',
  };
  const list = 'dog 90\nrun 80\nbig 70\nhuge 60\nfast 50\njog 40\nsmall 30\n';
  const { files, stats } = importWordnet(more, list, { commonLimit: 5 });
  const lines = (f) => files[f].split('\n').filter((l) => l.startsWith('@'));
  assert.deepEqual(lines('do.sop'), ['@k.words.dog.noun.1 k.words.sense word=dog pos=noun n=1 gloss="a pet that barks" synonym="domestic dog" is_a=animal part_of=pack kind_of=animal core.source="wordnet 3.1"']);
  assert.equal(lines('ru.sop')[0], '@k.words.run.verb.1 k.words.sense word=run pos=verb n=1 gloss="move fast on foot" synonym=jog is_a=move opposite=stand kind_of=move core.source="wordnet 3.1"');
  // jog is not among the first five words: no chain; the opposite belongs to "run", not to "jog".
  assert.equal(lines('jo.sop')[0], '@k.words.jog.verb.1 k.words.sense word=jog pos=verb n=1 gloss="move fast on foot" synonym=run is_a=move core.source="wordnet 3.1"');
  assert.deepEqual(lines('bi.sop'), ['@k.words.big.adjective.1 k.words.sense word=big pos=adjective n=1 gloss="above average in size" opposite=small core.source="wordnet 3.1"']);
  assert.deepEqual(lines('hu.sop'), ['@k.words.huge.adjective.1 k.words.sense word=huge pos=adjective n=1 gloss="unusually great in size" near_opposite=small core.source="wordnet 3.1"']);
  assert.deepEqual(lines('fa.sop'), ['@k.words.fast.adverb.1 k.words.sense word=fast pos=adverb n=1 gloss="quickly" core.source="wordnet 3.1"']);
  // small is the seventh word: an adjective outside the common words is not kept.
  assert.equal(files['sm.sop'], undefined);
  assert.deepEqual({ opposites: stats.opposites, nearOpposites: stats.nearOpposites, chains: stats.chains }, { opposites: 2, nearOpposites: 1, chains: 2 });
});

test('the same input gives the same bytes; limits split a bucket into parts', () => {
  assert.deepEqual(importWordnet(fixture, freq).files, importWordnet(fixture, freq).files);
  const { files } = importWordnet(fixture, 'city 1\nchild 1\n', { commonLimit: 0, limits: { maxWires: 1 } });
  assert.deepEqual(Object.keys(files), ['ch.sop', 'ci.sop']);
  const more = importWordnet({ ...fixture, 'index.noun': `${fixture['index.noun']}\nchin n 1 0 1 0 00000005` }, 'child 1\nchin 1\n', { commonLimit: 0, limits: { maxWires: 1 } });
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
  const names = ['index.noun', 'data.noun', 'index.verb', 'data.verb', 'noun.exc', 'verb.exc', 'index.adj', 'data.adj', 'adj.exc', 'index.adv', 'data.adv', 'adv.exc'];
  const raw = Object.fromEntries(names.map((f) => [f, readFileSync(join(dict, f), 'latin1')]));
  const { files } = importWordnet(raw, readFileSync(list, 'utf8'), { extra: await extraWords(raw, WORLDS_DIR) });
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

// R11.1 left this cause to the importer: the one-word names of the hand-written worlds have a sense in k.words, the
// one under the root of their world (kilogram a unit, Mars the planet, crane the bird).
test('the one-word names of the hand-written worlds have their sense in k.words', { skip: !existsSync(dict) && 'raw files not downloaded' }, () => {
  const raw = Object.fromEntries(['index.noun', 'data.noun'].map((f) => [f, readFileSync(join(dict, f), 'latin1')]));
  const core = coreNames(raw, WORLDS_DIR);
  assert.ok(core.size >= 700);
  const words = fullWorld('k.words');
  const glossOf = (w) => words.ofType('k.words.sense').filter((s) => s.attrs.word[0].replace(/"/g, '').toLowerCase() === w && s.attrs.pos[0] === 'noun').map((s) => s.attrs.gloss[0]);
  for (const w of ['kilogram', 'litre', 'emu', 'pancreas', 'falafel']) assert.ok(glossOf(w).length, w);
  assert.ok(glossOf('mars').some((g) => /planet/.test(g)), 'mars');
  assert.ok(glossOf('crane').some((g) => /bird/.test(g)), 'crane');
});
