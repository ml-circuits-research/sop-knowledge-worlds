# k.objects

Drawable objects: their parts, how the parts sit relative to each other, and for every part a primitive shape, a box,
a draw order and typical colours, so that a renderer that has never seen an object can draw it from the facts alone.
`tools/render-svg.mjs` is such a renderer; its pictures are in [`preview/`](preview/index.html).

## Schema (`schema.sop`, module `k.objects`, imports `k.commonsense`, version 2)

- `k.objects.object` (shared, closed): `name` (identity, an English lemma; the same name in `k.commonsense.thing` is the
  same thing, joined by value); `variant` (identity, optional: a second drawing of the same name).
- `k.objects.part` (shared, closed), identity `of` + `name`:
  - `of`: the object's name; `name`: unique within the object (`left_window`); `kind`: for a part that occurs several
    times, what each one is (`window`). A repeated part is one wire per instance, each with its own box.
  - `shape` (required): rectangle, square, circle, oval, triangle, line, arc, polygon; nothing else.
  - `x`, `y`, `w`, `h` (required): the box in the frame of the object: 0 to 100 on both axes, x to the right, y
    downwards. A circle and a square have `w = h`. For a line or a polygon the box is the bounds of its points.
  - `z` (required): draw order, lower first. `colour` (required, many): typical colours, the most usual first.
  - `pointing` (triangle: where its apex is; up when absent): up, down, left, right. A triangle fills its box: apex at
    the middle of that side, base along the opposite side.
  - `opens` (arc: the open side; up when absent): an arc is half the ellipse that fills its box; `opens=up` is a smile.
  - relative position: `above`, `below`, `inside`, `left_of`, `right_of`, `on` (many; names of other parts of the same
    object), `centered=true` (centred left to right in the frame).
- `k.objects.point` (shared, closed), identity `part` + `n`: a point of a line or polygon part: `part` (a reference to the
  part), `n` (1, 2, ...: drawing order), `x`, `y` (in the frame of the object). Lines are open, polygons closed.
- Exports: `k.objects.object`, `k.objects.part`, `k.objects.point`.

## Shards (by category)

| Shard | Objects |
| --- | --- |
| `buildings` | house, castle, lighthouse |
| `sky` | sun, moon, cloud, star |
| `nature` | tree, flower, mountain, apple |
| `animals` | cat, dog, fish, bird, butterfly |
| `vehicles` | car, boat, plane, rocket, train, bicycle |
| `figures` | person (stick figure), robot, snowman |
| `household` | table, chair, cup, umbrella, ladder |

30 hand-written objects, 168 parts, 139 points, words for every object and part kind. Source `hand-core 1`, CC0-1.0.

## Imported objects (shards `noto-<subgroup>-<nn>`)

Everyday things converted from the Noto Emoji drawings by `tools/import/noto-emoji.mjs`, named by the Unicode CLDR
English short names (`"dog face"`, `teapot`, `"sport utility vehicle"`; a name of several words is a string), with
the CLDR keywords as `core.word` facts. Same format as the hand-written objects, with these differences:

- every visible element of the drawing is one part, in draw order (`z` = 1, 2, …); at most 16 parts an object (the
  largest), at most 40 points a part and about 200 points an object;
- shapes: `polygon` (most), `line`, and `circle`, `oval`, `rectangle`, `square` where the drawing has them;
- `colour` is the nearest name of the schema's list (black, white, grey, red, orange, yellow, green, blue, purple,
  pink, brown); `rgb` keeps the exact colour as a string (`"#D27856"`). A renderer may use either;
- parts are named `part1…partN` unless `sources/noto-emoji/part-names.tsv` names them; such a part carries
  `named=model` (a language model named it by looking at a numbered picture). Shadows, highlights and outlines have
  `kind=detail`. No relative positions (`above`, `inside`, …) are given;
- a hand-written object of the same name wins: the imported drawing is left out (questions.md Q12 asks how a second
  drawing should be stored; the schema already has `variant` on objects and parts for it);
- shards hold up to 8 objects of one emoji subgroup (`noto-animal-mammal-01`, `noto-food-fruit-02`). Sources
  `noto-emoji 99701e0` (Apache-2.0) and `cldr 48` (Unicode-3.0); the notices are `LICENSE.noto-emoji` and
  `LICENSE.cldr` in this folder.

## Questions it helps with

See `tests/k.objects.questions.jsonl`: the parts of a house; where the roof of a house is (`above` → `body`); the
colour of a tree's crown (`green`); how many windows a house has (2, by `kind`); which objects have wheels. And
`tests/k.objects.render.test.mjs`: every object renders, every part is inside the frame, shapes are known, relative
positions agree with the boxes.

## Using it to draw

Ask for the parts of an object (`ofType('k.objects.part')` or `ask('k.objects.part of=house name=?n shape=?s ...')`),
sort by `z`, and draw each shape in its box, scaled to the size wanted; for lines and polygons read the points
(`k.objects.point part=$<part id>`). A diagram can use the boxes alone as a skeleton.
