# k.body

The human body, as a child's encyclopedia describes it. Hand-written (`hand-core 1`, CC0-1.0); the facts were
written by a language model, only where sure (`named=model`).

## What it knows

- `k.body.part` (identity `name`): `kind` (whole, part, organ, bone, tissue), `part_of` (the larger part it belongs
  to: a finger is part of the hand), `inside` (where an inner part lies: the heart is inside the chest), `count` (how
  many an adult has: 2 eyes, 10 fingers, 32 teeth, 206 bones, 24 ribs), `child_count` (20 milk teeth), `does` (many:
  what it does: `sees`, `"pumps blood"`), `drawing` (the name of the `k.objects` object that draws it).
- Round 9: the parts of the hand (palm, the five fingers by name, knuckle, fingertip), of the eye (pupil, iris,
  eyelid, eyelash, cornea, lens, retina, the white), of the ear (outer ear, earlobe, ear canal, eardrum, middle and
  inner ear) and of the mouth (gum, palate, the four kinds of tooth, wisdom and milk teeth); `about`, one plain
  sentence on what a main organ or part does (23 parts: "The kidneys filter waste out of the blood and make urine.");
  `count_per_part` (5 fingers on a hand); approximate numbers with their units in `k.units.measure`: `count_about`
  (600 muscles, 100,000 hairs), `temperature_about` (the body, 37 degrees Celsius), `amount_about` (5 litres of
  blood), `length_about` (the small intestine, 6 metres), `weight_about` (the brain, 1.4 kilograms). A part never
  has both `count` and `count_about`.
- `k.body.sense` (complete: exactly five): `name` (sight, hearing, smell, taste, touch) and `organ` (eye, ear, nose,
  tongue, skin).
- `core.word` facts: plural forms (`teeth`, `feet`) and other names (`tummy`, `backbone`).

One shard, `core`: 91 parts, 5 senses, words; 175 wires, 23,725 bytes.

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (brain, stomach, liver, kidney, intestine:
5 of 91 parts; the sources have no drawings of outer body parts).

## Questions it helps with

See `tests/k.body.questions.jsonl`: how many eyes, teeth and bones a person has, where the heart is and what it does,
what a finger is part of, which parts are in the chest, which part works for the sense of taste.
