# k.body

The human body, as a child's encyclopedia describes it. Hand-written (`hand-core 1`, CC0-1.0).

## What it knows

- `k.body.part` (identity `name`): `kind` (whole, part, organ, bone, tissue), `part_of` (the larger part it belongs
  to: a finger is part of the hand), `inside` (where an inner part lies: the heart is inside the chest), `count` (how
  many an adult has: 2 eyes, 10 fingers, 32 teeth, 206 bones, 24 ribs), `child_count` (20 milk teeth), `does` (many:
  what it does: `sees`, `"pumps blood"`), `drawing` (the name of the `k.objects` object that draws it).
- `k.body.sense` (complete: exactly five): `name` (sight, hearing, smell, taste, touch) and `organ` (eye, ear, nose,
  tongue, skin).
- `core.word` facts: plural forms (`teeth`, `feet`) and other names (`tummy`, `backbone`).

One shard, `core`: 53 parts, 5 senses, words; 112 wires, 12,168 bytes.

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (brain, stomach, liver, kidney, intestine:
5 of 53 parts; the sources have no drawings of outer body parts).

## Questions it helps with

See `tests/k.body.questions.jsonl`: how many eyes, teeth and bones a person has, where the heart is and what it does,
what a finger is part of, which parts are in the chest, which part works for the sense of taste.
