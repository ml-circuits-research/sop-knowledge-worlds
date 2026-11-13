# k.values

The words for values: what a person says where a request names a colour, a size, an amount, a shape, a direction,
a place in the picture, which of several things, or a number.

## What it knows

- `k.values.colour` (identity `name`): 141 CSS colours (`css-colors 2.1.1`, MIT) with `rgb` as "#RRGGBB" and the
  CSS keyword as `css` (name "dark olive green", `css=darkolivegreen`), and 29 common names CSS does not have
  (cream, mustard, scarlet, burgundy, emerald, lilac, charcoal …; hand-written) with `rgb_about`, a usual value.
  A fact with both is refused. `basic`: the basic colour it is a kind of (black, white, grey, red, orange, yellow,
  green, blue, purple, pink, brown: the names of `k.objects.part.colour`), on 87 CSS colours: 62 by the last word
  of the name (dark green), 25 where it is plain (crimson, navy, gold: `named=model`); and on 20 common names.
  Colours between two basic colours have none (teal, cyan, turquoise, maroon, indigo, coral, khaki, beige).
- `k.values.scale` and `k.values.step` (identity `scale`, `name`; `rank` from 1, the least): size (tiny, small,
  medium, large, huge: the sizes of `k.scenes.thing`), length, width, height, thickness, amount (none, a bit, some,
  a lot, all), degree (slightly, somewhat, quite, very, extremely), brightness, speed, weight, temperature,
  distance, loudness: 13 scales, 44 steps. Other words for a step are `core.word` facts (big: large; little: small).
- `k.values.comparative` (identity `text`, `scale`): 82 comparatives and superlatives with `way` (up: towards the
  most) and `degree` (bigger: size, up; shortest: length and height, down; more, fewer, least).
- `k.values.shape`: 30 shape names, `solid=true` for the six with depth; plurals and adjectives as words (round:
  circle). Sides, corners and things of a shape are not here.
- `k.values.direction`: 18 directions with `axis`, `opposite`, and for those in the plane of a picture the step `x`,
  `y` (x to the right, y downwards, as `k.objects`; north is up). `k.values.position`: 13 positions in a picture
  with `column`, `row`, `depth` (top left, centre, bottom, front).
- `k.values.set_word`: all, each, both, either, any, some, most, half, none, other, another, random, same,
  different, alternating, first, last, next, previous: `picks` (how many of the things meant) and `manner`.
- `k.values.number` (identity `text`, `kind`): cardinals zero to ninety-nine, hundred, thousand, million, billion;
  ordinals first to ninety-ninth, hundredth, thousandth, millionth; once, twice, thrice; single to quadruple; pair,
  couple, trio, half a dozen, dozen; half, third (`value_about`), quarter, three quarters: 222 facts.

## Shards

`colours-css` (233 wires), `colours-common` (44), `scales` (171), `shapes` (60), `directions` (61), `sets` (37),
`numbers` (232): 838 wires. Written by `tools/values-core.mjs`.

## What it does not know

- Which things have which colour, what mixes into what, light and dark families: a colour world can join here by
  the colour name.
- Numbers above ninety-nine as phrases ("two hundred and five"): a host composes them from the words here.
- The order within a step: "big" and "large" are the same step.

## Questions it helps with

See `tests/k.values.questions.jsonl`: the RGB value of crimson, the basic colour of navy, where large stands on
the size scale, which way smaller moves, the two scales of shorter, the opposite of clockwise, what each picks,
the value of twenty-three and of fifth.

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: the colour skin; 13 more words for colours (ginger, light-blue, and short spellings: grn, blu, blk); `k.values.shade`, 6 shade words with how they change a colour (light, pale, soft, bright, dark, deep); `k.values.reply`, yes and no with 25 and 15 other ways of saying them; the shape names polygon, quadrilateral and rhombus.
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
