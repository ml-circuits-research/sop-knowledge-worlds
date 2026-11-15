// The plurals of the nouns the catalog draws and names (reviewer block 2026-11-15 14:45, KR2: "verb forms + irregular
// plurals of every k.objects / k.animals noun into w.lang.en"; PSys2 kept about 45 plural rules of its own that disagree,
// "bus" read as "bu"). For the head noun (the last word) of every name of k.objects.object and k.animals.animal that is
// a noun of k.words (a WordNet lemma, so a singular form), the morphology of w.lang.en is checked both ways: the singular
// of the noun itself is the noun, and the singular of its plural is the noun again. Where either fails ("gas" read as
// "ga", "caves" as "caf", "brie" as "bry"), the pair singular / plural is written as a `w.lang.en.irregular` fact, so a
// host reads both forms by lookup: the plural is the rule's (gases, caves, bries) unless WordNet's exceptions already
// give one to write (those stay in core-plurals; a read-only classical plural, abaci, is read, the rule's abacuses written). A reader treats the singular of a listed pair as a singular (tools/lib/lang-en.mjs
// `inflect`). Deterministic; `npm run build` reruns it after tools/lang-en-core.mjs.
//   node tools/lang-en-catalog-plurals.mjs     writes docs/worlds/w.lang.en/shards/catalog-plurals.sop
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { header, wire, seg } from './import/lib.mjs';
import { inflect } from './lib/lang-en.mjs';

const OUT = join(WORLDS_DIR, 'w.lang.en/shards/catalog-plurals.sop');
// Plural-only nouns (pluralia tantum): one form for one and many ("a pair of scissors"); own list, checked by hand.
export const PLURAL_ONLY = ['binoculars', 'clothes', 'forceps', 'goggles', 'jeans', 'knickers', 'pants', 'pliers', 'schnapps', 'scissors', 'shorts', 'sunglasses', 'tights', 'tongs', 'trousers'];
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);

// the head nouns of the catalog's drawn things and animals that are nouns of k.words
export function catalogNouns(worlds = scanWorlds()) {
  const nouns = new Set();
  for (const s of worlds.find((w) => w.id === 'k.words').shards) for (const m of s.text.matchAll(/ k\.words\.sense word=([^\s"]+) pos=noun /g)) nouns.add(m[1]);
  const heads = new Map(); // head -> the first name it is the head of
  for (const [id, re] of [['k.objects', / k\.objects\.object name=("[^"]*"|\S+)/g], ['k.animals', / k\.animals\.animal name=("[^"]*"|\S+)/g]]) {
    for (const s of worlds.find((w) => w.id === id).shards) for (const m of s.text.matchAll(re)) {
      const head = tok(m[1]).toLowerCase().split(' ').pop();
      if (/^[a-z]+$/.test(head) && nouns.has(head) && !heads.has(head)) heads.set(head, `${id} ${tok(m[1])}`);
    }
  }
  heads.nouns = nouns;
  return heads;
}

export function catalogPluralsShard(worlds = scanWorlds()) {
  const lang = worlds.find((w) => w.id === 'w.lang.en');
  const wires = lang.shards.filter((s) => !s.id.endsWith('/catalog-plurals')).flatMap((s) => parse(s.text));
  const of = (t) => wires.filter((w) => w.type === `w.lang.en.${t}`);
  const facts = { inflect: of('inflect'), irregular: of('irregular'), exceptions: of('noun.exception') };
  const rows = [];
  // a singular WordNet already lists (identity: one pair per singular) keeps its pair; read with the reader's rule that
  // the singular of a listed pair is a singular
  const listed = new Set(of('irregular').map((w) => tok(w.attrs.singular[0])));
  const heads = catalogNouns(worlds);
  for (const [head, from] of [...heads].sort(([a], [b]) => (a < b ? -1 : 1))) {
    // a head that the rules read as the plural of another noun is that plural (hearts, drawers, glasses): no pair
    if (listed.has(head)) continue;
    const sg = inflect(facts, head, 'singular', 'lemma');
    if (sg !== head && heads.nouns.has(sg)) continue;
    const plural = PLURAL_ONLY.includes(head) ? head : inflect(facts, head, 'plural'); // WordNet's everyday irregulars (mice) or the rule (a read-only abaci is not written)
    if (inflect(facts, head, 'singular', 'lemma') === head && inflect(facts, plural, 'singular', 'lemma') === head) continue;
    rows.push([head, plural, from]);
  }
  const lines = rows.map(([singular, plural]) => wire(`w.lang.en.irregular.catalog.${seg(singular)}`, 'w.lang.en.irregular', [['singular', singular], ['plural', plural]], 'hand-core 1'));
  return { text: `${header({ id: 'w.lang.en/shards/catalog-plurals', about: `${rows.length} nouns of the catalog (the head nouns of k.objects and k.animals names that are nouns of k.words) that the morphology rules of w.lang.en do not read both ways, with their plural: "gas" is no plural of "ga", "caves" is the plural of "cave". A reader takes them by lookup before the rules.`, sources: ['hand-core 1 (computed by tools/lang-en-catalog-plurals.mjs from k.objects, k.animals, k.words and the rules of w.lang.en; own)'], license: 'CC0-1.0', script: 'tools/lang-en-catalog-plurals.mjs' })}\n${lines.join('\n')}\n`, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { text, rows } = catalogPluralsShard();
  writeFileSync(OUT, text);
  console.log(`catalog-plurals.sop: ${rows.length} pairs, ${Buffer.byteLength(text)} bytes`);
}
