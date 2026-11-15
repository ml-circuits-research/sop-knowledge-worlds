# k.colours

The home of every colour name (KR2, reviewer 14:45): 33 colours and what is known about them (the family, light or
dark, warm or cool, a lighter and a darker colour, the opposite on the colour wheel, typical things; hand-written,
`hand-core 1`, CC0-1.0), what 25 pairs of colours mix into, and the value of each colour name: the 141 CSS colours with
their exact RGB (shard `colours-css`, `css-colors 2.1.1`, MIT) and 29 common names with a usual one (shard
`colours-common`, CC0), moved here from k.values.colour, which is gone. The 11 basic colour terms of English (Berlin
and Kay 1969) carry `basic=true`; the type `k.colours.basic` is their view, one fact each by rule (shard derived), and
a slot that takes only a basic colour joins it (`type=k.colours.basic by=name`: k.values.coloured, k.drawing.part,
k.attributes.drawn, k.colours.colour.family).

A colour's facts stand in several shards (colours, colours-css, colours-common, psys2) and merge by name. `css`,
`rgb` (exact, "#RRGGBB"), `rgb_about` (usual; never both), `family` (the basic colour it is a kind of, where it has
one: on 87 CSS colours by the last word of the name or plainly, `named=model` where a language model labelled it),
`basic=true`. Where the hand-written family and the CSS shard's family both exist they agree (checked when moved);
the 7 names the CSS shard left without family (amber, beige, cream, magenta, maroon, peach, turquoise) take the
hand-written one, so their drawn colours in k.attributes moved with it (95 lines of the drawn-* shards).

## What it knows

- `k.colours.colour` (identity `name`): red, scarlet, crimson, maroon, orange, peach, amber, yellow, cream, mustard,
  gold, green, light green, lime, dark green, olive, turquoise, blue, light blue, navy, purple, lilac, magenta, pink,
  brown, beige, chestnut, black, grey, light grey, dark grey, silver, white. `family` (the eleven basic colours: red,
  orange, yellow, green, blue, purple, pink, brown, black, white, grey; a basic colour is its own family); `tone`
  (light, medium, dark); `temperature` (warm, cool, neutral); `lighter` and `darker` (blue: `"light blue"` and
  navy); `complement` (red and green, blue and orange, yellow and purple); `kind=metallic` (gold, silver); `thing`
  (many: yellow: sun, banana, lemon, chick, sunflower, cheese, corn, `"rubber duck"`).
- `k.colours.mix` (identity `a`, `b`, in the order of the alphabet): red and yellow give orange; blue and yellow
  green; blue and red purple; red and white pink; black and white grey; green and red brown; black and blue navy.
- `core.word` facts: other names (gray, burgundy, `"sky blue"`, teal, golden, violet for purple).

## Shards

`colours` (33 colours, 25 mixes, 33 word facts; 91 wires), written by `tools/colours-shapes-core.mjs`.

## Joins

By name, with no import: every colour here is a `k.values.colour` by its name or one of its words (a test), which
gives its RGB. 123 of the 126 typical things are `k.objects` drawings or stand-ins. The parts of 105 of
those drawings carry the family of the colour among their own colour names (the others are drawn in another
colour, or their conversion kept few colours: a brown plum, a green pond).

## Questions it answers

"What do red and yellow make?", "What is a darker blue?", "What kind of colour is maroon?", "Which colours are
greens?", "Which colour does a banana have?", "Which colours give brown?" (`tests/k.colours.questions.jsonl`).

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: `kind` primary (red, yellow, blue), secondary (orange, green, purple) and neutral (black, white, grey); fire truck and ocean as things of a colour.
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
