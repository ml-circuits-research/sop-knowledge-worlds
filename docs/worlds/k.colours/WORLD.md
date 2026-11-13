# k.colours

33 colours and what is known about them: the family, light or dark, warm or cool, a lighter and a darker colour,
the opposite on the colour wheel, typical things; and what 25 pairs of colours mix into. Hand-written (`hand-core
1`, CC0-1.0). It does not give the value of a colour (RGB).

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
