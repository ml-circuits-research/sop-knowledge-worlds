// k.words coverage of the content words of the first host's failing paraphrases (block "21:05" item 3,
// tools/paraphrase-words.mjs): every content word reaches a sense of k.words, or is a miss with a known cause (a
// name, a notation, a misspelling, a closed-class word w.lang.en does not list yet); the list of causes holds no word
// that reaches a sense, so a fixed word cannot hide in it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverage, NOT_WORDS, stems } from '../tools/paraphrase-words.mjs';

test('the regular endings give the stems a reader tries', () => {
  assert.deepEqual(stems('marbles').slice(0, 2), ['marbles', 'marble']);
  assert.ok(stems('buying').includes('buy'));
  assert.ok(stems('bought').includes('bought'));
  assert.ok(stems('berries').includes('berry'));
  assert.ok(stems('stopped').includes('stop'));
  assert.ok(stems('calling').includes('call'));
});

test('every content word of the failing paraphrases reaches a sense or is a miss with a known cause', () => {
  const r = coverage();
  console.log(`${r.rows} paraphrases, ${r.words} content words, ${r.reached} reach a sense, ${r.misses.length} do not: ${r.misses.map((m) => `${m.word} (${m.cause})`).join(', ')}`);
  assert.equal(r.rows, 71);
  assert.deepEqual(r.misses.filter((m) => m.cause === 'no sense').map((m) => m.word), [], 'content words with no sense and no cause');
  assert.deepEqual(r.listedButReached, [], 'listed as not words, but they reach a sense now: take them off NOT_WORDS');
  const missed = new Set(r.misses.map((m) => m.word.replace(/'s$/, '')));
  assert.deepEqual(Object.values(NOT_WORDS).flat().filter((w) => !missed.has(w)), [], 'listed words that are no longer misses');
  assert.ok(r.reached / r.words >= 0.9, `${r.reached} of ${r.words}`);
});
