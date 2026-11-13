# k.layouts

Named arrangements of things in a picture, the places on a drawable thing where another thing sits or attaches,
and which kinds of thing join which. Hand-written (`hand-core 1`, CC0-1.0). For a host that lays out a picture or a
diagram and puts things on or next to each other from knowledge.

## What it knows

- `k.layouts.layout` (identity `name`): 17 arrangements. Repeating (any number of like things): row, column, grid,
  ring, scatter, stack, pyramid, flow, nested. Fixed (named places): corners, tree, radial, border, landscape, room,
  `"family photo"`, face. Each with `about` (one sentence), `ordered=true` where the order means something,
  `usual_for` (many: `"people in a queue"`, `"the days of a calendar"`). Other names are `core.word` facts (queue,
  pile, circle, flowchart, hierarchy, scenery, `"group photo"`).
- `k.layouts.slot` (identity `layout`, `name`): the places of an arrangement: `count` (one, many), `pair=true` (once
  on each side of the middle line), `optional=true`, `holds` (what usually goes there; many), `arranged` (the
  arrangement inside the place: every row of a grid is a `row`; the sky of a landscape is a `scatter`), and for the
  fixed pictures the usual box `x`, `y`, `w`, `h` in a 0 to 100 frame (the sky of a landscape is `0 0 100 50`).
- `k.layouts.relation` (identity `layout`, `a`, `rel`, `b`): what is in `a` is `left_of`, `above`, `inside`,
  `around`, `on`, `behind`, `beside`, `aligned_row`, `aligned_column`, `same_size`, `smaller_than`, `evenly_spaced`,
  `apart` or `joined_to` what is in `b`. In a place for many things, `a` and `b` are the same place and `among`
  says `neighbours` (from each thing to the next) or `all`: a row is `item left_of item among=neighbours` and
  `item aligned_row item among=all`.
- The **face** has the places of `k.faces` (style `plain`) with the same boxes (the tool reads them there), and says
  how they sit: the eyebrows above the eyes, the eyes above the nose, the nose above the mouth, the hat on the head,
  the glasses around the eyes, the ears beside the head. The k.faces slots are the anchors of a face.
- `k.layouts.anchor` (identity `of`, `name`): 117 places on 93 hand-written `k.objects` objects: `kind` (seat,
  surface, top, handle, hand, opening, inside, water, roof, hook, base), the box `x`, `y`, `w`, `h` in the frame of
  the object (a line when `w` or `h` is 0, a point when both are), the `part` it lies on, and `holds` (what goes
  there) or, for a base, `on`. The seat of a chair is `x=25 y=55 w=50 h=0`; the top of a person's head holds a hat;
  the hands of the person are two points; the water of a lake, river, sea and pool is a box; 35 doors and gates are
  openings. `named=model`.
- `k.layouts.joins` (identity `a`, `rel`, `b`): 171 facts between kinds of thing: `part_of` (wheel, car),
  `attaches_to` (roof, wall), `sits_on` (hat, head), `hangs_from` (earring, ear), `goes_in` (key, lock), `worn_on`
  (scarf, neck), `grows_on` (leaf, branch), `held_in` (string, hand), `connects` (arrow, box; bridge, bank), with the
  `side` of `b` where there is a usual one (top, bottom, side, front, back, end, edge, corner, centre, inside,
  around). `named=model`.

## Shards

`layouts` (17 arrangements, 50 places, 91 relations, 17 word facts; 175 wires), `anchors` (117 wires), `joins` (171
wires), written by `tools/layouts-core.mjs` from its own data, `sources/hand-core/anchors.tsv` and
`sources/hand-core/joins.tsv`.

## Joins

By name, with no import: `k.layouts.anchor.of` is a `k.objects` object and `part` a part of it; the places of the
arrangement `face` are `k.faces.slot` names. The kinds of `k.layouts.joins` are common English nouns; many are also
objects or parts in `k.objects` (39 of the 52 `part_of` facts whose whole is a hand-written object name a part of
that drawing).

## What was checked

- The boxes of the fixed arrangements agree with the relations said between their places (a test works it out for
  50 relations).
- Every anchor was drawn on its object and looked at (`sources/hand-core/anchors-audit.tsv`: 118 rows, 115 right, 2
  wrong and corrected, 1 unclear and taken out).
- The joins were not checked against anything but the part names of the drawings; `k.commonsense` has no part facts
  yet, so none comes from there.

## Questions it answers

"Which places does a landscape have?", "What goes in the sky?", "How do the things of a row sit to each other?",
"What is above the eyes in a face?", "Where does a person sit on a chair?", "What goes on top of a head?", "Which
things have a water surface?", "What does a hat sit on?", "On which side of a wall does a roof attach?", "What is a
wheel part of?", "What does an arrow connect?" (`tests/k.layouts.questions.jsonl`).
