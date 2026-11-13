# k.animals

Common animals, as a child's encyclopedia describes them. Hand-written (`hand-core 1`, CC0-1.0).

## What it knows

- `k.animals.animal` (identity `name`, the common English name): `class` (mammal, bird, fish, reptile, amphibian,
  insect, arachnid, crustacean, mollusc, worm, cnidarian, echinoderm), `legs` (walking legs: a bird 2, a fish 0),
  `covering` (many: fur, hair, wool, feathers, scales, skin, shell, spines), `sound` (many: the verb, `bark`, `moo`),
  `habitat` (many: `farm`, `forest`, `sea`, `savanna`, `"coral reef"` …), `diet` (herbivore, carnivore, omnivore),
  `eats` (many: typical food), `baby` (the name of the young: `puppy`, `joey`, `tadpole`), `can` (many: `fly`, `swim`,
  `run`, `climb`, `jump`, `dig` …), `cannot` (many: what it is well known not to do: penguin, ostrich and emu `fly`),
  `drawing` (the name of the `k.objects` object that draws it).
- A key is left out where animals of one name differ or the fact is not plain: the legs of a kangaroo or a monkey,
  the diet of a dog or a squirrel, the covering of an insect. A missing `can=fly` does not say "cannot fly";
  `cannot=fly` does. One fact never has the same verb in `can` and in `cannot` (a rule of the schema refuses it).
- `core.word` facts: plural forms (`mice`, `geese`, `wolves`) and other names (`chicken` for hen, `ladybug`, `hippo`).

## Shards

`mammals` (67 animals), `birds` (35), `fish` (13), `reptiles-and-amphibians` (13), `invertebrates` (28): 156 animals,
294 wires, 46,944 bytes.

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (113 of 156 animals have one; `ladybird` is
drawn by `"lady beetle"`); the same `name` in `k.commonsense.thing` (fish, bird, dog, cat) gives everyday facts.

## Questions it helps with

See `tests/k.animals.questions.jsonl`: what sound a cow makes, what a baby kangaroo is called, how many legs a spider
has, which animals are amphibians, what a panda eats, where a camel lives, which mammal can fly.
