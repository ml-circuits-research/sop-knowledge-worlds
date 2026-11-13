# k.faces

Faces built from small replaceable parts, like a police sketch: an application picks one variant for each place of a
face, gives four colours, and draws the result with the renderer it already has for `k.objects` (the same primitive
shapes, boxes in a 0 to 100 frame, points as wires). Parts can be replaced, resized and recoloured one by one.

## Schema (`schema.sop`, module `k.faces`, version 1)

- `k.faces.slot` (identity `style` + `name`): a place of a face in one style: `x`, `y`, `w`, `h` (its anchor box in
  the frame of the face, x to the right, y downwards), `z` (draw order of the slots, lower first), `mirror=true` (a
  pair: the box and the variants are the side on the viewer's left; the renderer draws the other side mirrored at
  x = 50), `optional=true` (a face may leave it empty).
- `k.faces.variant` (identity `slot` + `name`): one drawable shape for a slot, with `style` and plain features:
  `shape` (round, oval, long, square, heart), `size` (small, medium, large), `length` (short, medium, long), `feel`
  (many: thin, thick, curly, straight, wavy, bushy, arched, flat, wide, narrow, open, closed, smiling, sad,
  surprised), `age` (many: child, adult, old; only where the drawing shows it) and `kind` (what a person calls it:
  `ponytail`, `goatee`, `"top hat"`). `named=model` when a language model gave the features by looking.
- `k.faces.part` (identity `slot` + `of` + `name`): a part of a variant, with the keys of `k.objects.part` (`shape`,
  `x`, `y`, `w`, `h`, `z`, `colour`, `rgb`, `kind`, `pointing`, `opens`), in the frame of the face and inside the box
  of its slot. `tint` names the colour of the face that fills it: `skin`, `hair`, `eyes`, `clothes`, or the darker
  tone `skin_shade`, `hair_shade`, `clothes_shade`; without `tint` the part keeps its own colour.
- `k.faces.point` (identity `part` + `n`): the points of a line or polygon part.
- `k.faces.colour` (identity `of` + `name`): a named colour of `skin`, `hair`, `eyes` or `clothes`: `rgb`, `shade`
  (the darker tone for lines on it), `natural` (true for colours people have).
- `k.faces.preset` (identity `name`): a named face: `style`, one key per slot holding the name of a variant (a slot
  left out is empty), and `skin`, `hair_colour`, `eye_colour`, `clothes` (names of colours).
- `k.faces.expression` (identity `name`): the variants of `mouth`, `eyebrows` and `eyes` a face switches to;
  `one_eye` is the variant for the eye on the viewer's right only (wink); `mouth_alt` is the second mouth of a pair
  that alternates (talking).

## How a face is drawn

For each slot of the style, in the order of `z`: take the parts of the chosen variant in the order of their own `z`,
give each its colour (the face colour its `tint` names, else `rgb`, else the colour name) and draw it as a
`k.objects` part. For a slot with `mirror=true` draw the parts a second time with `x` replaced by `100 - x - w` (and
left and right swapped for `pointing` and `opens`). `tools/render-faces.mjs` does exactly this.

## The hand-written core (style `plain`)

Sixteen slots, in draw order: `hair_back`, `shoulders`, `neck`, `ears`, `head`, `cheeks`, `beard`, `mouth`,
`moustache`, `nose`, `eyes`, `eyebrows`, `glasses`, `hair_front`, `earrings`, `hat`. One shard per slot
(`plain-<slot>`), plus `slots`, `colours` and `presets` (presets and expressions). Written by `tools/faces-core.mjs`
(hand-chosen coordinates; curved outlines are sampled from an ellipse). Source `hand-core 1`, CC0-1.0.

| Slot | Variants |
| --- | --- |
| head | round, oval, long, square, heart, wide, box |
| ears | round, small, large, pointed, long, square |
| neck | medium, thin, thick, tapered, necklace, pipe |
| shoulders | t-shirt, v-neck, shirt, suit, hoodie, tank top, small, metal plate |
| hair_back | long straight, long wavy, long curly, bob, ponytail, pigtails, bun, afro |
| hair_front | short, fringe, side parting, curly, spikes, bald on top, receding, centre parting, long sides, wavy, mohawk, tuft |
| eyebrows | straight, thick, arched, thick arched, angry, sad, bushy, raised, short |
| eyes | round, dot, large, oval, narrow, closed, happy, surprised, sleepy, lashes, square |
| nose | small, medium, long, wide, button, pointed, round, bolt |
| mouth | smile, big smile, neutral, sad, open, talking, small, wide, smirk, full lips, grin, tongue out, frown, grille |
| cheeks | blush, round blush, freckles, dimple, wrinkles, scar, mole |
| beard | full, short, chinstrap, goatee, long, soul patch, sideburns, stubble |
| moustache | thin, thick, handlebar, walrus, pencil, chevron |
| glasses | round, square, small round, large, sunglasses, cat-eye, monocle, visor |
| hat | cap, beanie, top hat, crown, cowboy hat, party hat, bow, antenna, sun hat |
| earrings | stud, hoop, drop, pearl, large hoop, star, bolt |

134 variants. Colours: 11 skin (6 natural), 13 hair (8 natural), 10 eyes (7 natural), 11 clothes. Presets: child,
girl, boy, woman, man, old woman, old man, bearded man, woman with curly hair, robot, alien, clown, queen.
Expressions: happy, sad, angry, surprised, sleepy, wink, talking.

## Previews

`preview/`: every variant alone with the box of its slot dashed (`variant-<style>-<slot>-<name>.svg`), the presets,
the expressions on the preset `woman`, and 40 seeded random faces of the style `plain`; `index.html` shows them all.

## Questions it helps with

See `tests/k.faces.questions.jsonl` and `tests/k.faces.test.mjs`: which mouths there are, which eyebrows are thick,
which slots come in pairs, what a preset has in a slot, which mouth a sad face switches to, the skin colours people
have. `findVariants` in `tools/render-faces.mjs` ranks the variants of a slot by how many wanted features they have
(one sopworld query per feature: "a long face with small eyes and thick eyebrows"); `presetDifference` lists the
keys where two presets differ.
