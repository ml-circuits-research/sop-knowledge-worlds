# k.animals

Common animals, as a child's encyclopedia describes them. Hand-written (`hand-core 1`, CC0-1.0): the facts were
written by a language model, only where sure, and carry `named=model`. The table is
`sources/hand-core/animals.tsv`; `tools/animals-core.mjs` writes the shards.

## What it knows

- `k.animals.animal` (identity `name`, the common English name): `class` (mammal, bird, fish, reptile, amphibian,
  insect, arachnid, crustacean, mollusc, worm, cnidarian, echinoderm, myriapod), `legs` (walking legs: a bird 2, a fish 0),
  `covering` (many: fur, hair, wool, feathers, scales, skin, shell, spines), `sound` (many: the verb, `bark`, `moo`),
  `habitat` (many: `farm`, `forest`, `sea`, `savanna`, `"coral reef"` …), `diet` (herbivore, carnivore, omnivore),
  `eats` (many: typical food), `baby` (the name of the young: `puppy`, `joey`, `tadpole`), `can` (many: `fly`, `swim`,
  `run`, `climb`, `jump`, `dig` …), `cannot` (many: what it does not do: penguin, ostrich, emu, kiwi and cassowary `fly`;
  every animal that is not a bird or an insect and is not said to fly has `cannot=fly`, so "can a cow fly" finds a
  fact), `size` (the size class of the grown animal, the classes of `k.scenes.thing`: tiny, small, medium, large,
  huge), `group` (the name of a group: herd, flock, pack, pride, school, swarm, colony, pod, troop, mob, covey, clan),
  `drawing` (the name of the `k.objects` object that draws it).
- A key is left out where animals of one name differ or the fact is not plain: the legs of a kangaroo or a monkey,
  the diet of a dog or a squirrel, the covering of an insect. A missing `can=fly` does not say "cannot fly";
  `cannot=fly` does. One fact never has the same verb in `can` and in `cannot` (a rule of the schema refuses it).
- `core.word` facts: plural forms (`mice`, `geese`, `wolves`) and other names (`chicken` for hen, `ladybug`, `hippo`).

## Shards

`mammals` (124 animals), `birds` (65), `fish` (35), `reptiles-and-amphibians` (28), `invertebrates` (62): 314 animals,
597 wires, 108,984 bytes. With a value: legs 284, covering 269, habitat 313, eats 283, young 261, sound 117, group 110.

## What was checked

A seeded sample of 200 of the 314 rows was read again (`sources/hand-core/animals-audit.tsv`): 186 right, 12 wrong
and corrected, 2 unclear with the value taken out. The other 114 rows were not read again. Where the drawing has
the name of the animal, the size class is the one `k.scenes.thing` gives (a test).

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (135 of 314 animals have one; `ladybird` is
drawn by `"lady beetle"`); the same `name` in `k.commonsense.thing` (fish, bird, dog, cat) gives everyday facts.

## Questions it helps with

See `tests/k.animals.questions.jsonl`: what sound a cow makes, what a baby kangaroo is called, how many legs a spider
has, which animals are amphibians, what a panda eats, where a camel lives, which mammal can fly.
