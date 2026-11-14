# k.commonsense

Everyday common sense, as soft knowledge: where things usually are, what they can do, what they are used for and
made of, and how many of a thing a scene usually has. The soft rules never refuse; they give advice
after the application acted ("Done! A fish is usually in water, not in the sky.").

## Schema (`schema.sop`, module `k.commonsense`, version 3, imports `k.animals` and `k.food`)

- `k.commonsense.thing` (shared, closed): `name` (identity, an English lemma), `at` (many: typical locations), `can`
  (many: capabilities), `used_for` (many), `made_of` (many) (the size class of a thing is in `k.scenes.thing`, Q32),
  `usually_count` (how many a scene usually has; given only for one-of-a-kind things: sun, moon), `cannot` (many),
  `is_a` (`liquid`, read by a soft rule).
- `k.commonsense.placed`: what an application tells when it puts a thing in a scene: `thing` (a name), `at` (where),
  `scene`, `on` (the placed thing of the same scene that carries it), `in` (what holds it). An application may
  extend it with a type of its own.
- `k.commonsense.lives`: `in` (a habitat word of k.animals, identity), `at` (many: the place words it gives:
  water, ground, indoors).
- Soft rules (`core.deny … soft=true`), each with a `why`:
  - a thing usually in water that cannot fly, placed in the sky: "A ?thing is usually in water, not in the ?place.";
  - a thing usually in water and not on land, placed on grass: "A ?thing is usually in water, not on the ?place.";
  - a thing that cannot fly and is not usually in the sky, placed in the sky on nothing that carries it: "A ?thing
    cannot fly, so it is not usually in the sky.";
  - a liquid placed with nothing to hold it: "?thing is a liquid: it needs something to hold it (a cup, a bottle, a
    lake).";
  - more of a thing in one scene than it usually has: "A scene usually has only ?usual ?thing, not ?n." (one issue per
    scene and thing).
- Rules about kinds (`core.rule`, Round 11 item 4): they make facts from the facts of other worlds, so a host that
  loads `k.animals` and `k.food` with this world gets common sense about every animal and every drink:
  - `k.commonsense.habitat`: what an animal lives in is where it usually is (`habitat=sea` gives `at=sea`);
  - `k.commonsense.habitat.place`: and the place word `k.commonsense.lives` gives for that habitat (`at=water`), so
    the soft rules about water and the sky reach every animal (a shark in the sky is an issue, a duck is not);
  - `k.commonsense.ability`, `k.commonsense.inability`: what an animal can and cannot do, the thing can and cannot;
  - `k.commonsense.drink`: a drink of `k.food` is a liquid;
  - `k.commonsense.carried`: a thing on a carrier is where the carrier is, and goes where it goes (a cat on a plane
    is in the sky, with no issue; when the plane is placed at the airport, so is the cat).
- What needs a function and is left to the library: that a carried thing moves with its carrier when positions are
  numbers (x, y: the space solver), that a container is big enough for what it holds (amounts and volumes), that a
  carrier that flies is itself in the sky only while it flies (a time line).
- Exports: `k.commonsense.thing`, `k.commonsense.placed`, `k.commonsense.lives`.

## Shards

- `shards/lives.sop`: 32 habitats and the place words they give. `shards/liquids.sop`: 15 everyday liquids.
- `shards/core.sop`: 15 things (fish, bird, sun, moon, cloud, tree, house, car, boat, plane, flower, grass, star, dog,
  cat) and one `core.word` per thing with its forms. Source `hand-core 1`, CC0-1.0.

## Questions it helps with

See `tests/k.commonsense.questions.jsonl`: where does a fish live (`water`), what can a bird do (`fly`, `sing`), which
things are usually in the sky, how many suns does a scene usually have (`1`); and soft issues for a fish in the sky, a
boat on the grass, a car in the sky, two suns in one scene; nothing is refused.

## Bulk import (not run yet)

`tools/import/conceptnet.mjs` will add ConceptNet 5.7 facts as shards `conceptnet-<letter>` (keys `at`, `can`,
`used_for`, `made_of`, and `is_a`, `part_of`, `has`, which the schema already declares). The dump is not reachable
from the workers' network; see `sources/conceptnet/SOURCE.md`.

## Notes

- A soft issue is advice: after a fish was put in the sky, "where does a fish live" still answers `water`
  (sopworld 0.15.0).

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: a bird is also on the ground.
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
