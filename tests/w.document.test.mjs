// w.document (block "15:15" item 1): a document as a world schema for the library's std.compose and std.summarize.
// Integration case the library can read in place: an essay and a presentation made by acts, every sentence with the
// wires of the facts it states (each checked against the catalog), the tree read back in order, the two denies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds } from '../tools/lib/worlds.mjs';
import { scanSchemas, describeSchema, actsWorld } from '../tools/lib/schemas.mjs';

const vocab = JSON.parse(readFileSync(join(WORLDS_DIR, 'vocab.json'), 'utf8'));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const wireIds = new Set(scanWorlds().flatMap((w) => w.shards.flatMap((s) => [...s.text.matchAll(/^@(\S+) /gm)].map((m) => m[1]))));

// The essay a composition of "penguin" could write: one chapter, one paragraph, three sentences with their facts.
export const ESSAY = {
  document: { title: 'Penguins', genre: 'essay', topic: 'penguin', register: 'essay', language: 'w.lang.en', seed: 7 },
  chapters: [{ title: 'A bird that swims', part: 'argument', sentences: [
    { text: 'A penguin is a bird, but it cannot fly.', move: 'surprising fact', fact: ['k.animals.animal.penguin'], interest: 0.46 },
    { text: 'Most birds that live by the sea can fly; the penguin swims instead.', move: 'compare', fact: ['k.animals.animal.penguin', 'k.animals.animal.seagull'], interest: 0.3 },
    { text: 'So a bird is not always a flier.', move: 'conclude', fact: [] },
  ] }],
};

test('w.document: loads with std.acts with no error and no warning; found by name; in the catalog', () => {
  const s = scanSchemas().find((x) => x.id === 'w.document');
  const d = describeSchema(s);
  assert.deepEqual(d.errors, []);
  assert.deepEqual(d.entry.warnings, []);
  for (const word of ['document', 'essay', 'presentation', 'slides', 'composition']) assert.ok(vocab[word]?.includes('w.document/schema.sop'), word);
  assert.deepEqual(d.entry.kinds.map((k) => k.kind ?? k.type ?? k.name).length, 10);
});

test('w.document: an essay made by acts; every sentence names the wires it states; read back in order', () => {
  const w = actsWorld(['w.document']);
  const act = (action, args) => { const r = w.act({ action, args }); assert.ok(r.ok, JSON.stringify(r.violations ?? r)); return r.result.thing; };
  const doc = act('make', { kind: 'w.document.document', ...ESSAY.document });
  ESSAY.chapters.forEach((c, i) => {
    const ch = act('make', { kind: 'w.document.chapter', title: c.title, part: c.part, document: `$${doc}`, n: i + 1 });
    const p = act('make', { kind: 'w.document.paragraph', chapter: `$${ch}`, n: 1 });
    c.sentences.forEach((s, j) => act('make', { kind: 'w.document.sentence', paragraph: `$${p}`, n: j + 1, text: s.text, move: s.move, ...(s.fact.length ? { fact: s.fact } : {}), ...(s.interest ? { interest: s.interest } : {}) }));
  });
  const sentences = w.ofType('w.document.sentence').sort((a, b) => Number(a.attrs.n[0]) - Number(b.attrs.n[0]));
  assert.deepEqual(sentences.map((s) => tok(s.attrs.text[0])), ESSAY.chapters[0].sentences.map((s) => s.text));
  assert.deepEqual(sentences[1].attrs.fact, ['k.animals.animal.penguin', 'k.animals.animal.seagull']);
  for (const s of sentences) for (const f of s.attrs.fact ?? []) assert.ok(wireIds.has(f), `${f} is a wire of the catalog`);
  // Every claim traces to a fact: the sentences that state something carry at least one; a conclusion may carry none.
  assert.ok(sentences.filter((s) => tok(s.attrs.move[0]) !== 'conclude').every((s) => s.attrs.fact?.length));
  assert.equal(w.act({ action: 'ask', args: { thing: 'w.document.sentence', nth: 1, attr: 'move' } }).result.value, '"surprising fact"'); // the value as written (a quoted string)
});

test('w.document: a presentation as slides with bullets; the denies; places from 1', () => {
  const w = actsWorld(['w.document']);
  const act = (action, args) => w.act({ action, args });
  assert.ok(act('make', { kind: 'w.document.document', title: 'Penguins', genre: 'presentation', topic: 'penguin' }).ok);
  const slides = [['Penguins', 'title'], ['What we will see', 'agenda'], ['A bird that cannot fly', 'content'], ['What to remember', 'summary']];
  slides.forEach(([title, layout], i) => assert.ok(act('make', { kind: 'w.document.slide', title, layout, document: '$w_document_document1', n: i + 1 }).ok));
  assert.ok(act('make', { kind: 'w.document.sentence', slide: '$w_document_slide3', n: 1, text: 'Penguins are birds that cannot fly.', move: 'surprising fact', fact: 'k.animals.animal.penguin' }).ok);
  assert.equal(w.ofType('w.document.slide').length, 4);
  assert.equal(w.ofType('w.document.slide').find((s) => s.attrs.n[0] === '2').attrs.layout[0], 'agenda');
  // A sentence on a slide and in a paragraph at once is refused with the reason; so is a place 0 and an unknown layout.
  assert.ok(act('make', { kind: 'w.document.chapter', document: '$w_document_document1', n: 1 }).ok);
  assert.ok(act('make', { kind: 'w.document.paragraph', chapter: '$w_document_chapter1', n: 1 }).ok);
  const both = act('make', { kind: 'w.document.sentence', slide: '$w_document_slide3', paragraph: '$w_document_paragraph1', n: 2, text: 'x' });
  assert.equal(both.ok, false);
  assert.match(JSON.stringify(both.violations), /in a paragraph or on a slide, not both/);
  assert.ok(act('make', { kind: 'w.document.section', chapter: '$w_document_chapter1', n: 1 }).ok);
  const twice = act('make', { kind: 'w.document.paragraph', chapter: '$w_document_chapter1', section: '$w_document_section1', n: 2 });
  assert.equal(twice.ok, false);
  assert.match(JSON.stringify(twice.violations), /in a section or straight in a chapter, not both/);
  assert.equal(act('make', { kind: 'w.document.sentence', slide: '$w_document_slide3', n: 0, text: 'x' }).ok, false);
  assert.equal(act('make', { kind: 'w.document.slide', document: '$w_document_document1', n: 5, layout: 'poster' }).ok, false);
  assert.equal(act('make', { kind: 'w.document.sentence', slide: '$w_document_slide3', n: 3, text: 'x', interest: 2 }).ok, false);
});

test('w.document for an editor: blocks in order, list items, table cells and marks; taking a block away takes what it holds; one code per kind', () => {
  const w = actsWorld(['w.document']);
  const act = (action, args) => w.act({ action, args });
  const made = (args) => { const r = act('make', args); assert.ok(r.ok, JSON.stringify(r.violations ?? r)); return r.result.thing; };
  const doc = made({ kind: 'w.document.document', title: 'Notes', code: 'text1' });
  const p = made({ kind: 'w.document.block', code: 'b1', document: `$${doc}`, n: 1, form: 'paragraph', text: 'The quick brown fox' });
  const list = made({ kind: 'w.document.block', code: 'b2', document: `$${doc}`, n: 2, form: 'list', style: 'task' });
  const item = made({ kind: 'w.document.item', block: `$${list}`, n: 1, text: 'milk', checked: false });
  const table = made({ kind: 'w.document.block', code: 'b3', document: `$${doc}`, n: 3, form: 'table', header: true });
  const cell = made({ kind: 'w.document.cell', block: `$${table}`, row: 1, column: 1, text: 'fruit' });
  made({ kind: 'w.document.mark', block: `$${p}`, from: 4, to: 9, form: 'bold' });
  made({ kind: 'w.document.mark', block: `$${list}`, item: `$${item}`, from: 0, to: 4, form: 'highlight', colour: '#fff2a8' });
  assert.equal(act('ask', { thing: p, attr: 'align' }).result.value, 'left', 'a block is left aligned unless said');
  assert.equal(act('make', { kind: 'w.document.block', code: 'b1', document: `$${doc}`, n: 4, form: 'quote', text: 'x' }).ok, false, 'one block per code');
  assert.equal(act('make', { kind: 'w.document.block', code: 'b9', document: `$${doc}`, n: 4, form: 'poem' }).ok, false, 'a form of the five');
  assert.equal(act('make', { kind: 'w.document.mark', block: `$${table}`, item: `$${item}`, cell: `$${cell}`, from: 0, to: 1, form: 'bold' }).ok, false, 'a mark is in an item or a cell, not both');
  assert.ok(act('remove', { thing: list }).ok);
  assert.deepEqual([w.ofType('w.document.item').length, w.ofType('w.document.mark').length], [0, 1], 'a list goes with its items and their marks');
  assert.ok(act('remove', { thing: doc }).ok);
  assert.deepEqual(['w.document.block', 'w.document.cell', 'w.document.mark'].map((t) => w.ofType(t).length), [0, 0, 0], 'a document goes with all it holds');
});
