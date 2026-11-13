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
  part is named by the first word of its set of synonyms ("car door").
- `plain` (many) on both types: the plain word a person says for a part with a name of several words: its last
  word, when WordNet says the part is a kind of what that word names (`has="car door"`, `plain=door`; "automobile
  engine": engine; "car wheel": wheel; "camera lens": lens). 450 plain words on 240 facts. A part is asked for by
  `has` or by `plain`. Not every plain word is one a person would use (accessory, system, action).
- `k.parts.usual` (identity `name`): the usual parts of 432 common things in plain words, given by a language
  model from the name (`named=model`, `core.source="hand-core 1"`): dog: head, body, leg, tail, ear, paw, nose,
  fur; kettle: handle, spout, lid; pizza: crust, topping, cheese, sauce. For common things with no part from
  WordNet (and for dog, cat and house). The name is taken in its everyday meaning. With these, 970 of the 1,500
  common things have at least one part.

## How it is made

`tools/import/parts.mjs`, from the list of common things of `tools/coverage.mjs` (the sense kept there) and
WordNet's part meronyms. Rules: a kind two steps up passes its parts on only if it is one of 13 kinds read for
that (wheeled vehicle, motor vehicle, building, vessel, aircraft, bird, seat, room, dwelling …); kinds too general
are not followed (whole, organism, structure, plant, artifact, device, food, clothing …); a part filed under foods
is not a part of a plant or an animal (a horse has no "horsemeat"); and `sources/coverage/not-parts.tsv` lists
the inherited parts that were read and mislead (26 kinds for every thing: dish, garment, insect, framework …; 51
single things: a lioness has no mane, a bugle no valve, a glider no engine; one single part: tableware of a table).

## Audit of the usual parts

A seeded sample of 120 rows was printed next to WordNet's gloss of the sense that the coverage rule keeps and
read again: 117 right, 3 wrong and taken out (bank and boa: the word names two things; doorknob). Before that, 26
rows were taken out on a first reading (a hole of a bagel, a twig of a nest). Record:
`sources/hand-core/usual-parts-audit.tsv`. The other 315 rows were read once, when written.

## What it does not know

- 530 common things have no part here: WordNet lists none for them or for their kinds, and they were not
  labelled: foods and drinks, materials and many things with no plain parts (honey, rock, wire), and the less
  frequent things I was not sure of.
- The sense is the one the coverage rule keeps, which is not always the common one (`turtle` is the sweater,
  `lobster` the meat): the `gloss` says which. A host should read it before using the parts.
- WordNet's lists mix the usual with the rare (a building: elevator, cullis) and use its own names.
- Parts of drawings are in `k.objects.part`, joins between kinds in `k.layouts.joins`; nothing is copied here.

## Questions it helps with

See `tests/k.parts.questions.jsonl`: the parts of a knife and a chair, what a bicycle has as a wheeled vehicle,
which things have a handle.
