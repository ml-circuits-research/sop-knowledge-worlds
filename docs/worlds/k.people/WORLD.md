# k.people

Kinds of person, and 60 roles and jobs. Hand-written (`hand-core 1`, CC0-1.0).

## What it knows

- `k.people.kind` (identity `name`): baby, child, boy, girl, man, woman, grandfather, grandmother. All are variants of
  the one person drawing of `k.objects` (`drawing=person`): `age` (baby, child, adult, old), `sex` (male, female;
  left out for baby and child), `height_about` (the usual height in per cent of the height of a grown man: baby 40,
  child 65, boy and girl 70, woman 93, man 100, grandmother 89, grandfather 96; approximate, hence `_about`), `hair`
  (many: little, short, long, grey, white), `face` (the `k.faces` preset of style `plain` with such a face: `baby`,
  `child`, `boy`, `girl`, `man`, `woman`, `"old man"`, `"old woman"`), `is_a` (boy and girl are a child, a
  grandfather is a man).
- `core.word` facts give the other names: infant, kid, children, toddler, lad, lady, gentleman, grandpa, granddad,
  grandma, granny, "old man", "old woman", and the plural forms. The vocabulary index sends each of them to the shard.

- `k.people.role` (identity `name`): 36 jobs (doctor, nurse, teacher, farmer, cook, firefighter, pilot, astronaut,
  builder, gardener …), 8 members of a family (mother, father, grandmother, grandfather, sister, brother, aunt,
  uncle) and 16 figures of stories (king, queen, knight, pirate, witch, wizard, fairy, clown, cowboy, detective,
  magician, explorer, Father Christmas …). `group` (job, family, story); `is` (the kind of person, where the role
  says it: a king is a `man`, a princess a `girl`, a grandmother a `grandmother`); `wears`, `holds`, `uses` (many:
  things, named as their drawing in `k.objects`: a doctor wears a `"lab coat"`, holds a `stethoscope`, uses a
  `syringe`); `works_at` (many: where the role is found; a scene of `k.scenes` in all cases but one, the judge's
  courthouse, which is an object); `does` (many: `teach`, `"put out fires"`); `hat`, `glasses`, `beard`, `moustache`,
  `shoulders` (the variant of that `k.faces` slot, style `plain`, that suits the role: a king `hat=crown
  beard=full`, a pilot `hat=cap glasses=sunglasses shoulders=suit`); `face` (a `k.faces` preset, where one is the
  role: `clown`, `queen`, `"old woman"`); `drawing=person`.
- 238 of the 239 things worn, held or used have a drawing (not the astronaut's space suit). `k.faces` has few hats
  (cap, beanie, top hat, crown, cowboy hat, party hat, sun hat), so most jobs have no face feature of their own: a
  host tells a doctor from a baker by what they wear and hold, not by the face.

## Shards

`kinds` (8 kinds, 16 wires), `roles-jobs` (36 roles, 72 wires), `roles-family` (8, 16), `roles-story` (16, 32); the
role shards are written by `tools/people-core.mjs`.

## Joins

By name, with no import: `drawing`, `wears`, `holds`, `uses` are `k.objects.object` names; `face` is a `k.faces.preset`
and `hat`, `glasses`, `beard`, `moustache`, `shoulders` are `k.faces.variant` names (style `plain`); `works_at` is a
`k.scenes.scene`; `is` is a `k.people.kind`.

## Questions it helps with

See `tests/k.people.questions.jsonl`: how a grandfather is drawn, which face a grandmother has, how tall a child is
next to a grown man, which kinds are old; what a doctor wears and holds, where a teacher works, who holds a sword,
which hat suits a king, who works on a farm.
