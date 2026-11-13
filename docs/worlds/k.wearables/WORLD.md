# k.wearables

What is worn where: the places on the body where things are worn, and 105 things people wear, joined to the
drawings of `k.objects`, the face slots of `k.faces`, the parts of `k.body` and what the roles of `k.people` wear.

## What it knows

- `k.wearables.place` (identity `name`): head, hair, eyes, ears, face, neck, body, back, waist, arms, wrist, hands,
  finger, legs, feet. `x`, `y`, `w`, `h`: its box on the drawing `person` of `k.objects` (the frame of that
  drawing), the anchor for a thing worn there; `pair=true` for ears, arms, wrist, hands, finger, legs, feet (the
  box is the one on the viewer's left; the other is its mirror image at x=50). `face_slot`: the `k.faces` slot that
  draws what is worn there (head: hat; eyes: glasses; ears: earrings; body: shoulders): the box of that slot is the
  anchor on a face. `body_part`: the `k.body` part. `named=model` (the boxes).
- `k.wearables.wearable` (identity `name`): `kind` (headwear, eyewear, neckwear, top, coat, whole, bottom,
  underwear, footwear, handwear, jewellery …), `worn_on` (a place), `covers` (many: the other places it covers),
  `layer` (under, main, over), `pair=true` (shoes, gloves, earrings), `drawing` (91 have a drawing in
  `k.objects`), `face_slot` and `face` (36 have a `k.faces` variant: bobble hat: hat, beanie; hoodie: shoulders,
  hoodie), `worn_for` (cold, rain, sun, sleep, swimming, sport, work, safety, party, looks). Other words are
  `core.word` facts (trousers: pants; jumper: sweater, pullover; trainers: sneakers).

## Shards

`places` (15 places and their words) and `wearables` (105 wearables and their words). Written by
`tools/wearables-core.mjs`.

## Looked at

The 15 boxes drawn in colour on the person drawing, one picture at 700 px: each lies where its name says (the
person is a stick figure, so body, back and waist are boxes around the line of the body).

## What it does not know

- No new drawing was made: 14 wearables have no drawing in `k.objects` (12 of them have a face variant); hood and
  cardigan have neither.
- A box says where a thing goes on the stick figure, not how to scale or turn the drawing of the thing.
- `k.layouts.joins` also has 16 `worn_on` facts between kinds (helmet: head; glasses: face); they are coarser
  (face, not eyes) and were left as they are.

## Questions it helps with

See `tests/k.wearables.questions.jsonl`: where a scarf is worn, what is worn on the eyes, what a coat covers,
which face variant shows a bobble hat, what is worn for rain.
