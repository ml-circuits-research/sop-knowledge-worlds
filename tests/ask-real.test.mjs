// Round 11 item 1: the demo's real questions answered from the catalog (tools/ask-real.mjs), and a word for every
// key (tools/key-words.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scanWorlds } from '../tools/lib/worlds.mjs';
import { loadCatalog, ask, run } from '../tools/ask-real.mjs';
import { withBlock, START } from '../tools/key-words.mjs';

const cat = loadCatalog();
const a = (q) => ask(cat, q);

test('a question finds a fact by its words: the thing, and the asked key, a value, or a scale', () => {
  let r = a('How many legs does a spider have?');
  assert.deepEqual([r.found, r.reading.key, r.answer], ['whole', 'k.animals.animal.legs', ['8']]);
  r = a('What is the capital of Kenya?');
  assert.deepEqual([r.found, r.answer], ['whole', ['Nairobi']]);
  r = a('Is a cake a fruit?');
  assert.deepEqual([r.found, r.reading.kind, r.reading.key], ['whole', 'value', 'k.food.food.kind']);
  r = a('Which is bigger, a train or a tent?');
  assert.deepEqual([r.found, r.reading.kind, r.answer], ['whole', 'scale', ['train: huge', 'tent: large']]);
  r = a('Which is longer, a kilometre or a mile?');
  assert.deepEqual([r.found, r.reading.kind], ['whole', 'units']);
  r = a('What does whisper mean?');
  assert.deepEqual([r.found, r.reading.key], ['whole', 'k.words.sense.gloss']);
  r = a('Why is Mars red?');
  assert.deepEqual([r.found, r.reading.key], ['whole', 'k.space.body.colour_why']);
  r = a('how many legs do insects have');
  assert.deepEqual([r.found, r.reading.key, r.answer], ['whole', 'k.animals.class.legs', ['6']]);
  r = a('draw a comet');
  assert.deepEqual([r.found, r.reading.key], ['whole', 'k.objects.object.*']);
  r = a('What is the longest river?');
  assert.deepEqual([r.found, r.reading.key], ['whole', 'k.geo.river.length_about']);
});

test('what is not found says why', () => {
  assert.deepEqual([a('what is a blorp').found, a('what is a blorp').cause], ['no', 'thing missing']);
  assert.equal(a('how many legs does a blorp have').found, 'no');
  assert.equal(a('What is the capital of the Sahara?').cause, 'key of another kind of thing');
  assert.equal(a('how many legs does a centipede have').cause, 'key missing');
  assert.equal(a('no, the other one').cause, 'needs the conversation');
  assert.equal(a('Where do penguins live, at the north pole?').found, 'part');
});

test('the real questions: at least 113 of the 132 Talk failures, 34 of the 40 knowledge and 28 of the 40 drawing questions find a fact; an invented noun finds none', () => {
  const { rows, counts } = run();
  assert.equal(rows.length, 292);
  assert.ok(counts['talk failures'].found >= 113, JSON.stringify(counts['talk failures']));
  assert.ok(counts['lookup set, knowledge'].found >= 34, JSON.stringify(counts['lookup set, knowledge']));
  assert.ok(counts['lookup set, drawings'].found >= 28, JSON.stringify(counts['lookup set, drawings']));
  const invented = rows.filter((r) => r.invented);
  assert.equal(invented.length, 80);
  // `snarf` is a word of WordNet, so three of the 80 are not invented for the catalog.
  assert.ok(invented.filter((r) => r.found === 'no').length >= 77);
});

test('a word for every key: each schema ends with the block of tools/key-words.mjs; every key of a named type has a word', () => {
  for (const w of scanWorlds().filter((x) => x.id.startsWith('k.'))) { // a grammar world's keys (lhs, rhs) are not what people ask for
    const text = readFileSync(join(w.dir, 'schema.sop'), 'utf8');
    assert.equal(text, withBlock(text), `${w.id}: run node tools/key-words.mjs`);
    assert.ok(text.includes(START), w.id);
  }
  const have = new Set([...cat.keyWords.values()].flat().map((k) => `${k.type}.${k.key}`));
  for (const [type, t] of cat.types) if (t.nameKey && type.startsWith('k.')) for (const [key, slot] of t.slots) if (key !== t.nameKey) assert.ok(have.has(`${slot.from ?? type}.${key}`), `${type}.${key} has no word`); // an inherited key has the word of the type that declares it
});
