# k.parts

The usual parts of common things, with or without a drawing, from the part relations of WordNet 3.1.

## What it knows

- `k.parts.whole` (identity `name`): a common thing, WordNet's `gloss` of the sense meant, and `has` (many): the
  parts WordNet lists for that sense (car: accelerator, air bag, automobile engine, bumper, car door, car mirror,
  car seat, car window, roof, window …; knife: blade, haft, point; chair: back, leg). 307 things, 816 parts.
- `k.parts.inherited` (identity `name`, `from`): the parts WordNet lists for what the thing is a kind of (`from`),
  one or two kind-of `steps` up (car, from motor vehicle: car wheel, chassis, windshield, speedometer; bicycle,
  from wheeled vehicle: axle, brake, wheel; violin, from stringed instrument: bridge, peg). 370 facts for 328
  things. **Usual, not certain**: a part of a kind holds for most of its kinds.
- Together 541 of the 1,500 common things have at least one part. `core.source="wordnet 3.1"` on every fact; a
  part is named by the first word of its set of synonyms ("car door", not "door").

## How it is made

`tools/import/parts.mjs`, from the list of common things of `tools/coverage.mjs` (the sense kept there) and
WordNet's part meronyms. Rules: a kind two steps up passes its parts on only if it is one of 13 kinds read for
that (wheeled vehicle, motor vehicle, building, vessel, aircraft, bird, seat, room, dwelling …); kinds too general
are not followed (whole, organism, structure, plant, artifact, device, food, clothing …); a part filed under foods
is not a part of a plant or an animal (a horse has no "horsemeat"); and `sources/coverage/not-parts.tsv` lists
the inherited parts that were read and mislead (26 kinds for every thing: dish, garment, insect, framework …; 51
single things: a lioness has no mane, a bugle no valve, a glider no engine; one single part: tableware of a table).

## What it does not know

- 959 common things have no part here: WordNet lists none for them or for their kinds (dog: only "flag" and, as a
  canine, "paw"; a house has rooms but no roof or wall: those are parts of "building", further up than the rule follows).
- The sense is the one the coverage rule keeps, which is not always the common one (`turtle` is the sweater,
  `lobster` the meat): the `gloss` says which. A host should read it before using the parts.
- WordNet's lists mix the usual with the rare (a building: elevator, cullis) and use its own names.
- Parts of drawings are in `k.objects.part`, joins between kinds in `k.layouts.joins`; nothing is copied here.

## Questions it helps with

See `tests/k.parts.questions.jsonl`: the parts of a knife and a chair, what a bicycle has as a wheeled vehicle,
which things have a handle.
