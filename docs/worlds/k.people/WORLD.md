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
  beard=full`, a pilot `hat="pilot cap" glasses=sunglasses shoulders=uniform`); `face` (a `k.faces` preset, where one is the
  role: `clown`, `queen`, `"old woman"`); `drawing=person`.
- 238 of the 239 things worn, held or used have a drawing (not the astronaut's space suit). Most jobs show on the
  face: a cook has `hat="chef hat" shoulders="chef jacket"`, a builder `hat="hard hat" shoulders="safety vest"`, a
  firefighter `hat="fire helmet" shoulders="fire jacket"`, a nurse `hat="nurse cap" shoulders=scrubs`. Four jobs
  have no feature of their own (hairdresser, singer, dancer, photographer): a host tells them by what they hold.
  Waiter and musician share one face (waistcoat and bow tie), hairdresser and singer another.

## Shards

`kinds` (10 kinds, 20 wires), `roles-jobs` (36 roles, 72 wires), `roles-family` (8, 16), `roles-story` (16, 32),
`roles-social` (2, 4); the role shards are written by `tools/people-core.mjs`.

**Kinds of person** (block 07:40 item 4): `person` is above every kind (a man, a woman, a child, a baby is a person)
and `relative` is a person. A role is a kind of k.kinds too (`extends=k.kinds.kind`): a member of a family `is_a`
relative, every other role a person (a fairy is a figure of stories, not a person), and the rules of k.kinds give the
whole chain as `kind_of` (the shard `derived`): a sister is a relative and a person, a friend and a neighbour (the
new group `social`) and a doctor are persons. A role and a kind of the same name (grandmother) are one thing to
k.kinds: the grandmother is a woman, a relative and a person.

## Joins

By name, with no import: `drawing`, `wears`, `holds`, `uses` are `k.objects.object` names; `face` is a `k.faces.preset`
and `hat`, `glasses`, `beard`, `moustache`, `shoulders` are `k.faces.variant` names (style `plain`); `works_at` is a
`k.scenes.scene`; `is` is a `k.people.kind`.

## Questions it helps with

See `tests/k.people.questions.jsonl`: how a grandfather is drawn, which face a grandmother has, how tall a child is
next to a grown man, which kinds are old; what a doctor wears and holds, where a teacher works, who holds a sword,
which hat suits a king, who works on a farm.

## Given names (Q62)

`k.people.given_name` (shards `given-names-<letter>`, 2,990 names, written by `tools/import/given-names.mjs` from
Wikidata's given-name items with a sex class, CC0; see `sources/given-names/SOURCE.md`): the name as spelled, its
sexes (female, male, both for a unisex name), `holders` (Wikidata humans whose given name it is), a `band` computed
from the holders (very common 123, common 934, frequent 1,441, rare 492) and its Wikidata items. A reader that meets
"Zoe", "Ana", "Tom" or "Leo" learns that the word is a given name (the vocabulary leads the word to its letter's
shard), so it can fill a `name` argument or a person instead of a dictionary sense. It says nothing of a person who
bears the name; the holder counts lean to notable people. Checked by `tests/k.people.given-names.test.mjs`.
