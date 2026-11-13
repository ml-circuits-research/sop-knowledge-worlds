# k.scenes

Where things usually are and how big they are, and (from R7.1) typical scenes. Hand-written (`hand-core 1`,
CC0-1.0); the place and size labels were given by a language model (`named=model`).

## What it knows

- `k.scenes.thing` (identity `name`: the name of a `k.objects` object or stand-in): `place`, where one usually
  sees the thing: `sky` (also: in the air), `ground` (outdoors), `water` (on or in it), `indoors`, or `on_thing`
  (on another thing); `on` (many), what it is usually on (`hat` on `head`, `roof` on `house`, `cup` indoors on
  `table`); `size`, the size of the real thing among five classes:

  | Class | Means | Examples |
  | --- | --- | --- |
  | `tiny` | fits in a closed hand | coin, bee, berry, button |
  | `small` | held in one or two hands | cup, book, cat, shoe |
  | `medium` | carried in both arms, up to the size of a person | chair, dog, bicycle, person |
  | `large` | bigger than a person, up to a truck | car, horse, bed, tent |
  | `huge` | bigger than a truck | house, tree, ship, mountain, sun |

- A key is left out where a thing has no usual place (a rope, a sword, a feather) or no plain size (grass). Objects
  that are symbols, whole scenes, faces or parts (heart, sunset, "dog face", liver) have no fact. A fact with
  `place=on_thing` and no `on` is refused.
- The labels come from `sources/hand-core/place-size.tsv`: written by a language model from the names of the
  objects, only where sure. A seeded sample of 200 was looked at next to the drawings
  (`sources/hand-core/place-size-audit.tsv`).

## Shards

`things-a` … `things-z` and `things-0` (names that start with a digit): one fact per thing, by the first letter of
its name. The vocabulary index maps the name of a thing to its shard.

## Joins

By name, with no import: `name` is the `name` of a `k.objects.object` (its drawing) or of a `k.objects.stand_in`;
the same name in `k.commonsense.thing`, `k.animals.animal` and `k.food.food` gives more facts.

## Questions it helps with

See `tests/k.scenes.questions.jsonl`: where the sun, a duck, a goat or a swing usually is; how big a house, a cow
or a bee is; what a hat is usually on; what is usually on a horse.
