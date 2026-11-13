# k.people

Kinds of person, and (from R7.5) roles and jobs. Hand-written (`hand-core 1`, CC0-1.0).

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

## Shards

`kinds` (8 kinds, 16 wires).

## Joins

By name, with no import: `drawing` is a `k.objects.object`; `face` is a `k.faces.preset` (style `plain`).

## Questions it helps with

See `tests/k.people.questions.jsonl`: how a grandfather is drawn, which face a grandmother has, how tall a child is
next to a grown man, which kinds are old.
