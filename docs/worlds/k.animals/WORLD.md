# k.animals

Common animals, as a child's encyclopedia describes them. Hand-written (`hand-core 1`, CC0-1.0): the facts were
written by a language model, only where sure, and carry `named=model`. The table is
`sources/hand-core/animals.tsv`; `tools/animals-core.mjs` writes the shards.

## What it knows

- `k.animals.animal` (identity `name`, the common English name): `class` (mammal, bird, fish, reptile, amphibian,
  insect, arachnid, crustacean, mollusc, worm, cnidarian, echinoderm, myriapod), `legs` (walking legs: a bird 2, a fish 0),
  `covering` (many: fur, hair, wool, feathers, scales, skin, shell, spines), `sound` (many: the word for the sound, a noun and a verb, `bark`, `moo`; a typed relation:
  declared join to `k.words.sense` by `word`, and every value is a word there),
  `habitat` (many: `farm`, `forest`, `sea`, `savanna`, `"coral reef"` …), `diet` (herbivore, carnivore, omnivore),
  `eats` (many: typical food), `baby` (the name of the young: `puppy`, `joey`, `tadpole`), `can` (many: `fly`, `swim`,
  `run`, `climb`, `jump`, `dig` …), `cannot` (many: what it does not do: penguin, ostrich, emu, kiwi and cassowary `fly`;
  every animal that is not a bird or an insect and is not said to fly has `cannot=fly`, so "can a cow fly" finds a
  fact), `group` (the name of a group: herd, flock, pack, pride, school, swarm, colony, pod, troop, mob, covey, clan),
  `drawing` (the name of the `k.objects` object that draws it), `thing` (see below).
- **Size and place are not here** (Q32, Round 11): the size class of the grown animal and its usual place are the
  `size` and `place` of the `k.scenes.thing` of the same name; every animal has one (`tools/scenes-core.mjs` adds a
  row for an animal without a drawing, with the size of the table of animals and, by rule, the place). Where the
  name is there the name of another thing of another size (`crane` the machine, `tuna` the tin), the animal's row
  is `"crane bird"`, `"tuna fish"`, and `thing` on the animal names it.
- A key is left out where animals of one name differ or the fact is not plain: the legs of a kangaroo or a monkey,
  the diet of a dog or a squirrel, the covering of an insect. A missing `can=fly` does not say "cannot fly";
  `cannot=fly` does. One fact never has the same verb in `can` and in `cannot` (a rule of the schema refuses it).
- `core.word` facts: plural forms (`mice`, `geese`, `wolves`) and other names (`chicken` for hen, `ladybug`, `hippo`).

## Shards

`classes` (Round 11): `k.animals.class`: the 13 classes, with what holds for the whole class only: `legs` (bird 2,
fish 0, insect 6, arachnid 8) and `covering` (bird, fish, reptile); so "how many legs do insects have" is a lookup.

`mammals` (124 animals), `birds` (65), `fish` (35), `reptiles-and-amphibians` (28), `invertebrates` (62): 314 animals,
597 wires, 105,814 bytes. With a value: legs 284, covering 269, habitat 313, eats 283, young 261, sound 117, group 110.

`sounds` (block 03:20 item 1, `tools/animal-sounds.mjs`, WordNet 3.1, licence WordNet-3.0): the sounds WordNet's
glosses name for an animal of this world ("moo: the sound made by a cow or bull", "hoot: utter the characteristic
sound of owls", "bees were buzzing around the hive"), one wire per animal that merges with its other wires, each after
a comment with the glosses it rests on. 32 animals, 51 pairs: 28 confirm a sound the table already had, 23 are new
(whinny, yelp, caw, chirr ...), and the magpie and the seagull get their first sound. A gloss that compares ("a loud
laugh that sounds like a horse neighing"), a call made to an animal, and a word for any sound (cry) are left out; the
tool says which glosses count. With the table and the PSys2 words, 123 of 314 animals have a sound. **No sound** for
191, listed by `node tools/animal-sounds.mjs --report`: most fish and invertebrates (no sound a child names) and
birds and mammals no source here names (penguin, swan, peacock, fox, giraffe, rabbit ...): a fact to add with a source,
never a guess. Every sound word is a word of `k.words` (the sound words are asked words of the WordNet import; `maa`,
the goat's sound in the PSys2 words, is a hand sense there).

## What was checked

A seeded sample of 200 of the 314 rows was read again (`sources/hand-core/animals-audit.tsv`): 186 right, 12 wrong
and corrected, 2 unclear with the value taken out. The other 114 rows were not read again. The size classes of
the table of animals are published only as `k.scenes.thing` facts (a test: every animal has exactly one, and no
other world states a size class or a usual place).

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (135 of 314 animals have one; `ladybird` is
drawn by `"lady beetle"`); the same `name` in `k.commonsense.thing` (fish, bird, dog, cat) gives everyday facts.

## Questions it helps with

See `tests/k.animals.questions.jsonl`: what sound a cow makes (and what noise a magpie makes, what a seagull says), what a baby kangaroo is called, how many legs a spider
has, which animals are amphibians, what a panda eats, where a camel lives, which mammal can fly.

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: for 55 animals, foods ours did not name (72), the sound as a child says it (woof, baa, hee-haw), legs, diet, covering, young and swimming where ours had none; chicken, hippo and worm as words of hen, hippopotamus and earthworm.
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
