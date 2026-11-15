// KR2 (reviewer 14:45): the plurals of every noun the catalog draws and names, in w.lang.en. For every head noun of a
// k.objects or k.animals name that is a noun of k.words, the reference reading (tools/lib/lang-en.mjs `inflect`, the
// rules of w.lang.en and its irregulars) reads the noun as itself and its plural back as the noun. PSys2 read "bus"
// as "bu" with rules of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { inflect } from '../tools/lib/lang-en.mjs';
import { catalogPluralsShard, catalogNouns } from '../tools/lang-en-catalog-plurals.mjs';

const dir = join(WORLDS_DIR, 'w.lang.en', 'shards');
const en = readdirSync(dir).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')));
const facts = { inflect: en.filter((w) => w.type === 'w.lang.en.inflect'), irregular: en.filter((w) => w.type === 'w.lang.en.irregular'), exceptions: en.filter((w) => w.type === 'w.lang.en.noun.exception') };
// WordNet lists a classical plural (read only) for these singulars, and one singular has one irregular fact: the
// English plural the rules write does not read back (questions.md Q78)
const KNOWN = ['forceps', 'hippopotamus', 'iris', 'macaroni', 'mantis', 'plateau'];
const sg = (w) => inflect(facts, w, 'singular', 'lemma'), pl = (w) => inflect(facts, w, 'plural');

test('catalog-plurals: the shard is what the tool gives', () => {
  assert.equal(readFileSync(join(dir, 'catalog-plurals.sop'), 'utf8'), catalogPluralsShard().text);
});

test('catalog-plurals: every head noun of k.objects and k.animals reads as itself, and its plural back as itself', () => {
  const heads = catalogNouns();
  let checked = 0;
  const bad = [];
  for (const [h] of heads) {
    // a head the rules read as the plural of another noun is that plural (hearts, glasses, trousers as worn)
    if (!facts.irregular.some((x) => x.attrs.singular[0] === h) && sg(h) !== h && heads.nouns.has(sg(h))) continue;
    if (KNOWN.includes(h)) continue;
    checked += 1;
    if (sg(h) !== h || sg(pl(h)) !== h) bad.push(`${h}: ${sg(h)}, ${pl(h)} -> ${sg(pl(h))}`);
  }
  console.log(`# ${checked} head nouns read both ways, ${bad.length} not`);
  assert.deepEqual(bad, []);
  assert.ok(checked > 1300);
  for (const [w, s] of [['bus', 'bus'], ['buses', 'bus'], ['lens', 'lens'], ['lenses', 'lens'], ['caves', 'cave'], ['axes', 'axe'], ['gloves', 'glove'], ['mice', 'mouse'], ['scissors', 'scissors'], ['ibises', 'ibis']]) assert.equal(sg(w), s, w);
  for (const [w, p] of [['cave', 'caves'], ['mouse', 'mice'], ['scissors', 'scissors'], ['emu', 'emus']]) assert.equal(pl(w), p, w);
});
