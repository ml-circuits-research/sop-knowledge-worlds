# k.objects

Drawable objects: their parts, how the parts sit relative to each other, and for every part a primitive shape, a box,
a draw order and typical colours, so that a renderer that has never seen an object can draw it from the facts alone.
`tools/render-svg.mjs` is such a renderer; its pictures are in [`preview/`](preview/index.html). The gallery
[`../../gallery.html`](../../gallery.html) shows them all with a search box; it reads `preview/objects.json` (every
object with the file of its picture, its shard, its source, the licence of its shard, and how many parts are named).

## Schema (`schema.sop`, module `k.objects`, imports `k.commonsense`, version 3)

- `k.objects.object` (shared, closed): `name` (identity, an English lemma; the same name in `k.commonsense.thing` is the
  same thing, joined by value).
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
- `k.objects.stand_in` (shared, closed), identity `name`: a thing without a drawing of its own (`name`) and the object
  of its kind that is drawn for it (`drawing`, an object name): `name=puppy drawing=dog`.
- Exports: `k.objects.object`, `k.objects.part`, `k.objects.point`, `k.objects.skeleton`, `k.objects.stand_in`.

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
| `structures` | bridge, windmill, well, fence, gate, igloo, barn, tower, pyramid, kennel, mailbox |
| `home` | sofa, shelf, oven, bottle, box, suitcase, bag, phone, computer, book |
| `more` | truck, hen, bee, planet, heart, flag, hat, boot, sock |
| `places` | street, building, prison, jail, restaurant, airport, temple, library, theater, museum, fort, warehouse, wall, roof, lane, alley, path, pool |
| `land` | island, hole, hill, valley, cave, cliff, pit, grave |
| `food` | meat, sugar, juice, orange, sauce, whiskey, corn, pork |
| `things` | gun, suit, tape, bullet, sword, fan, painting, map, horn, trap, screen, tank, rope, mask, shoe, doorbell, cage, pipe, frame, underwear, shell, pole, string, tube, pan, throne |
| `things-2` | artillery shell, rifle, statue, radar, nest, tire, lance, pillow, bin, cabinet, collar, cannon, rod, sweater, plug, wagon |
| `places-2` | motel, pub, casino, embassy |
| `land-2` | river bank |
| `food-2` | vodka, dough, ginger, brandy |

145 hand-written objects (30 of Round 1, 30 of Round 2, 60 of Round 4 and 25 of Round 5: the most frequent common
things that had no drawing, see `MISSING.md`), words for every object and part kind. Source `hand-core 1`, CC0-1.0.

## Imported objects (shards `noto-…`, `openmoji-…`, `mulberry-…`)

Everyday things converted from open drawings, in the same format as the hand-written objects. A name belongs to the
first source that has it: hand-written, then Noto Emoji, then OpenMoji, then Mulberry Symbols.

| Source | Objects | Shards | Licence | Names from |
| --- | --- | --- | --- | --- |
| hand-written | 145 | 18 | CC0-1.0 | this repository |
| Noto Emoji (`noto-<emoji subgroup>-<nn>`) | 811 | 124 | Apache-2.0 AND Unicode-3.0 | Unicode CLDR short names (`"dog face"`, `teapot`) |
| OpenMoji (`openmoji-<group>-<nn>`) | 114 | 18 | CC-BY-SA-4.0 | OpenMoji annotations (`goldfish`, `"lawn mower"`) |
| Mulberry Symbols (`mulberry-<category>-<nn>`) | 958 | 149 | CC-BY-SA-4.0 | Mulberry symbol names (`kettle`, `"arm chair"`) |

2,003 objects in all (193 Mulberry symbols are left out: 149 that are not a recognisable thing and 44 club football kits, see
`sources/mulberry/excluded.tsv`). A name of several words is a string. The keywords or tags of a source are `core.word` facts.
Differences from the hand-written objects:

- every visible element of the drawing is one part, in draw order (`z` = 1, 2, …); at most 16 parts an object (the
  largest), at most 40 points a part and about 200 points an object;
- shapes: `polygon` (most), `line` (strokes, and outlines: a shape that is mostly hole becomes a closed line), and
  `circle`, `oval`, `rectangle`, `square` where the drawing has them;
- `colour` is the nearest name of the schema's list (black, white, grey, red, orange, yellow, green, blue, purple,
  pink, brown); `rgb` keeps the exact colour as a string (`"#D27856"`). A renderer may use either;
- parts are named `part1…partN` unless `sources/<source>/part-names.tsv` names them; such a part carries
  `named=model` (a language model named it by looking at a numbered picture). Shadows, highlights and outlines have
  `kind=detail`; for OpenMoji and Mulberry (outline styles) a part that is only a stroke, and a black shape with the
  box of a filled part, is a detail by rule unless the names file says otherwise. No relative positions (`above`,
  `inside`, …) are given. Named so far: Noto 1,999 of 10,152 parts, OpenMoji 153 of 1,322, Mulberry 1,166 of 13,498
  (and 748, 652 and 6,334 details). The names were audited once (`sources/part-names-audit.tsv`, `tools/audit-part-names.mjs`);
- shards hold up to 8 objects of one group. The licence notices are `LICENSE.noto-emoji`, `LICENSE.cldr`,
  `LICENSE.openmoji` and `LICENSE.mulberry` in this folder; see `../LICENSES.md`.

## Coverage of common things

Two shards generated by `tools/coverage.mjs` (source `wordnet 3.1`, WordNet licence, text in `../k.words/LICENSE`)
help common things that have no drawing of their own:

- `words-wordnet`: a `core.word` for a word that is the same thing as an object (WordNet synonyms: `couch` → `sofa`;
  ids `k.objects.wordnet.same.<word>`). The word finds that drawing as its own.
- `stand-ins-wordnet`: a `k.objects.stand_in name=<word> drawing=<object>` fact for a thing that is a kind of something
  with a drawing (its direct hypernym in WordNet: `puppy` → `dog`; ids `k.objects.wordnet.kind.<word>`). The object
  shows the kind, not the thing, so a host can say "I drew a dog for the puppy". A stand-in is never a `core.word`.

A link is made only when WordNet keeps both words in the same sense; the links refused after a look at the drawing
are in `sources/coverage/not-links.tsv`.

`MISSING.md` (generated by `tools/coverage.mjs`) lists the common things that have no drawing of their name: the 1,500
most frequent English nouns that name a physical thing (frequency list × WordNet), most frequent first, with the
WordNet synonym or direct hypernym that has a drawing where there is one. Every drawing that matches a common thing
by name was looked at next to the gloss of the sense kept (`sources/coverage/sense-check.tsv`: right, wrong sense,
unclear); a drawing of another sense keeps its name and the word counts as missing.

## Questions it helps with

See `tests/k.objects.questions.jsonl`: the parts of a house; where the roof of a house is (`above` → `body`); the
colour of a tree's crown (`green`); how many windows a house has (2, by `kind`); which objects have wheels. And
`tests/k.objects.render.test.mjs`: every object renders, every part is inside the frame, shapes are known, relative
positions agree with the boxes.

## Using it to draw

Ask for the parts of an object (`ofType('k.objects.part')` or `ask('k.objects.part of=house name=?n shape=?s ...')`),
sort by `z`, and draw each shape in its box, scaled to the size wanted; for lines and polygons read the points
(`k.objects.point part=$<part id>`). A diagram can use the boxes alone as a skeleton.
