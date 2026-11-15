# Worker tasks

Written by the reviewer. The worker (a coding agent) follows [AGENTS.md](AGENTS.md) and [PLAN.md](PLAN.md), works one task
per commit, logs numbers in `worker-log.md`, and asks in `questions.md` (the reviewer answers here, never in
`questions.md`). Language and syntax questions: stop and ask. The reviewer decides under the owner's rule: simplest
option, never one sign or construct with two meanings.

## Round 1 (M0 + M1): infrastructure and two hand-written cores

**T1. Pinned sopworld and validation.**
- Copy `docs/sopworld.mjs` from `ml-circuits-research/soplang-words-lib` at commit `c7247e2` (0.14.0) into
  `tools/sopworld/sopworld.mjs`, and write `tools/sopworld/VERSION` with the commit and the build id.
- Add a `package.json` (type module, no runtime dependencies) and `npm test` (node:test).
- Write `tools/validate.mjs`: it loads every `docs/worlds/*/schema.sop` as a library module, plus each of the world's
  shards, into a fresh World, and fails on any error. It prints warnings, wires, bytes and load time per shard.

**T2. Catalog and vocabulary builders.**
- `tools/build-catalog.mjs` writes `docs/worlds/index.json` (format in PLAN.md §2) and `docs/worlds/vocab.json` (lemma → shard
  ids, from the `core.word` facts of the schema and from the identity-key values of the shard wires, lowercased).
- Deterministic output: the files are sorted and reruns give no diff.
- A test checks that every shard listed exists and loads, and that every vocab entry points to a listed shard.

**T3. Pages.**
- `docs/index.html` is one plain page: what this is, the contract of PLAN.md §2 with a minimal JS example (fetch the
  catalog, fetch a schema and one shard, load them into a sopworld World, run one `query`), and the list of worlds read
  from `index.json` at run time.
- `docs/worlds/README.md` explains the catalog.
- Add a `.nojekyll` file. The owner enables Pages on `main` /docs.

**T4. `k.commonsense` core (hand-written, about 40 facts, plus tests).**
- **Schema** (module `k.commonsense`, `core.module … exports=`): `k.commonsense.thing`, typical location (`at`),
  capability (`can`), use (`used_for`), material (`made_of`), size class, how many usually (`usually_count`, e.g.
  sun = 1 in a scene).
- **Soft rules** (`core.deny … soft=true why="… ?thing … ?place …"`): a thing whose typical location is water, placed
  in the sky or on grass; more than the usual count of a one-of-a-kind thing; a thing that cannot fly, placed in the sky.
- **Instances:** fish, bird, sun, moon, cloud, tree, house, car, boat, plane, flower, grass, star, dog, cat. One shard.
- `tests/k.commonsense.questions.jsonl` covers `query` answers and soft issues; nothing is refused.

**T5. `k.objects` core (hand-written, 30 objects, plus tests).**
- **Schema** (module `k.objects`, imports `k.commonsense`): `k.objects.object`, `k.objects.part` (`of`, `name`), the
  relative position of a part (`above`, `below`, `inside`, `left_of`, `right_of`, `on`, `centered`), a rough box
  (`x y w h` in a 0–100 frame of the object), typical colour (repeated values allowed), and count (`windows=2`).
- **Instances:** house (body, roof above, door bottom centre, two windows, chimney on roof), tree, car, boat, sun, flower,
  person (stick figure), cat, dog, fish, bird, cloud, mountain, rocket, robot, castle, bicycle, train, snowman, plus
  10 more of your choice from the Quick, Draw! categories.
- **Tests:** "what are the parts of a house", "where is the roof of a house" → `above body`, and "what colour is a
  tree's crown" → `green`.

**T5 amendment (reviewer, 2026-11-13 08:10): the parts must be drawable.** A renderer that has never seen the object must
be able to draw it from the facts alone, with basic shapes only. So every `k.objects.part` also has:
- `shape`: one of a small closed set of primitives declared in the schema: rectangle, square, circle, oval, triangle,
  line, arc, polygon. Nothing else.
- its box `x y w h` in the 0–100 frame of the object (required, not optional), a draw order (`z`), and a typical colour.
- for `polygon` and `line` only: its points as separate wires (`k.objects.point of=<part> n=<order> x= y=`), never a
  list inside one value.
- a repeated part is one wire per instance (two windows are two parts with their own boxes), not a count.
Add a test renderer `tools/render-svg.mjs` (world facts → a plain SVG, about 100 lines, no dependencies) and write the 30
SVG files to `docs/worlds/k.objects/preview/` so the reviewer and the owner can look at them. The test: every object
renders, every part is inside the frame, and no part has an unknown shape. The reviewer judges the pictures by eye.

**T6. Log and report.** Write `worker-log.md` with numbers per task. Close the round with a short report in
`worker-log.md`: what worked, what the schema could not say, and questions for the reviewer.

## Round 2 (M2 + M3): bulk import, to be detailed after Round 1

- ConceptNet 5.7 English edges with weight ≥ 2 for PartOf, HasA, AtLocation, UsedFor, CapableOf, MadeOf, IsA → `k.commonsense`
  and `k.objects`. Shard by first letter, or by category for objects. CC BY-SA 4.0, published with attribution.
- Quick, Draw! simplified strokes: per category, a layout skeleton (bounding boxes of stroke clusters, mapped to the parts
  of T5 where possible) → `k.objects`. CC BY 4.0. Report which categories give a usable skeleton.

## Reviewer 2026-11-13 08:30 — Round 1 accepted; answers Q1–Q8; Round 2

**Validated at 09d5244:** `npm test` 80/80, catalog rebuild gives no diff, no Romanian, SOP-only, every wire has a source.
The 30 previews were checked by eye: all are recognisable (weakest: plane, dog's head). Accepted.

**Answers.**
- Q1: yes, a content hash as catalog version.
- Q2: CC0-1.0 for hand-written facts stays until the owner chooses the repository licence (asked).
- Q3: yes, the `# version:` header; the catalog carries it. Passed to sopworld as a request (`version=` on core.module).
- Q4: yes, fully qualified matrix ids are the rule (add it to AGENTS.md rule 4). The misleading error is passed to sopworld.
- Q5: yes, `pointing` and `opens`, absent means up.
- Q6: unique `name` plus `kind`. No third key.
- Q7: a reference is right, but `of` now means two things (a name on a part, a reference on a point). Rename the
  point's key to `part=$…`. `of=` stays "the object, by name" everywhere.
- Q8: agreed, no cross-module subtype; join by name. The order-dependent merge is passed to sopworld as a bug.
- Conflicting answers after a soft issue: passed to sopworld as a bug (advice must not make knowledge conflicting). Keep the
  fork workaround in the page example until it is fixed.

**Round 2 (what this network allows: GitHub, npm, pip only).**
- **R2.1** Q7 rename, AGENTS.md rule 4, `docs/worlds/LICENSES.md` generated by the catalog builder, a CI workflow (npm test).
- **R2.2 `k.words`** from WordNet 3.1 (WordNet licence; take it from npm `wordnet-db` or the nltk_data GitHub repository):
  noun and verb lemmas, a short gloss, is-a, part-of, synonyms; only words in a 20,000 most-frequent English list (pick an
  openly licensed list on GitHub and record it). Shard by first two letters. Report wires, shards, bytes, load time.
- **R2.3 `k.geo`** from Natural Earth (public domain, GitHub `nvkelso/natural-earth-vector`) and `mledoze/countries` (ODbL):
  countries, capitals, continents, neighbours, population, area, largest cities, rivers and mountains with names. Shard by
  continent. No geometry beyond a centre point and a bounding box.
- **R2.4 `k.units` and `k.time`** hand-written: units with conversions as facts (factor to the base unit), months, weekdays,
  seasons, durations. Small, with tests.
- **R2.5 `k.objects` +30 objects**, same format, with previews. Fix the plane and the dog's head.
- **Not possible from this network** (ConceptNet on S3, Quick, Draw! on Google Storage, Wikidata): write the import scripts
  `tools/import/conceptnet.mjs` and `tools/import/quickdraw.mjs` with a small fixture test each, so that a machine with an
  open network only has to download and run them. Do not fake the data.
- Report as in Round 1.

## Reviewer 2026-11-13 08:35 — licence (owner) and R2.6: thousands of drawable objects

**Licence (owner: the most permissive one the sources allow).** `LICENSE` is added: MIT for code, CC0-1.0 for schemas and
hand-written facts, and each imported shard keeps its source's licence. When a fact is available from two sources, import
it from the more permissive one. Q2 is closed.

**R2.6 `k.objects` in bulk from Noto Emoji (pilot of 200, then all).** The owner wants thousands of common objects with a
decent shape. Hand-writing gives 30 a round, so shapes must be imported.
- **Source:** `googlefonts/noto-emoji` on GitHub, the SVG files (check the licence of the SVG folder; record it. If Twemoji,
  CC BY 4.0, converts better, compare both on 20 objects and choose). Names from Unicode CLDR English short names
  (`unicode-org/cldr-json` on GitHub, Unicode licence).
- **Keep only things:** animals, plants, food, vehicles, buildings, tools, clothes, furniture, household and nature
  objects. Drop faces, hands, people, flags, symbols, letters. Expect 1,200 to 1,800 objects.
- **Conversion** (`tools/import/noto-emoji.mjs`, deterministic): each SVG element becomes one part. Circles, ellipses and
  rectangles stay primitives. A path is flattened to a polygon and simplified (Douglas–Peucker) to at most 40 points;
  holes and gradients are dropped; the fill colour maps to the nearest name of a colour list declared in the schema, and the
  exact value is kept in a second key `rgb` (a plain string). At most 16 parts per object: drop the smallest ones beyond that.
  Coordinates scale to the 0–100 frame. Parts are named `part1…partN` in draw order; no invented part names.
- **Do not overwrite** a hand-written object of the same name: the hand-written one (named parts) wins; the imported one is
  stored as `k.objects.object name=<name> variant=noto`.
- **Shards:** one shard per 5 to 8 objects, grouped by CLDR category, inside the size gate. `vocab.json` maps each name and
  each CLDR keyword to its shard.
- **Pilot first:** 200 objects, previews as contact sheets (`docs/worlds/k.objects/preview/noto-*.png` are not needed; write
  the SVG previews and look at a montage yourself). Report: how many are recognisable at 160 px, wires and bytes per
  object, load time of one shard. Commit the pilot; then, if at least 85% are recognisable, run all and commit.

## Reviewer 2026-11-13 08:40 — R2.7: name the parts of the imported objects (owner: "not perfect, but more than nothing")

After R2.6, the imported parts are `part1…partN`. You (the agent) name them by looking at them.
- **How:** for each imported object, render a labelling picture: the object at 320 px with each part outlined and numbered
  (add a `--label` mode to `tools/render-svg.mjs`). Look at it (convert to PNG, read the image; contact sheets of 6 objects
  work) and write the names to `sources/noto-emoji/part-names.tsv`: `object <tab> part number <tab> name <tab> kind`.
  This file is committed; the import script reads it, so the build stays deterministic.
- **Names:** plain English nouns a child would use (body, head, wheel, roof, door, window, leaf, stem, handle, wing, tail,
  eye, ear, leg). Repeated parts get `left_`/`right_`/`front_`/`back_` or a number, plus `kind=` as in the hand-written
  objects. Shadows, highlights and outlines get `kind=detail` and keep their `partN` name.
- **Only when sure.** A part you cannot recognise keeps `partN`. Do not guess.
- **Mark the origin:** named parts carry `named=model` (hand-written ones have no such key), so applications and the
  reviewer can tell them apart. Add the key to the schema.
- **Order:** the 200 pilot objects first; report how many parts got a name and show 12 labelled examples in
  `docs/worlds/k.objects/preview/`. Then continue through all imported objects in batches of 100, one commit per batch.
- Tests: every named part exists; names are unique inside an object; "what are the parts of a <object>" answers with the names.

## Reviewer 2026-11-13 09:25 — R2.6, R2.7, R2.2 accepted; answers Q10–Q12

**Validated at d8473b3:** `npm test` 911 pass, catalog rebuild gives no diff. A contact sheet of 96 imported objects was
checked by eye: the shapes are good. 811 objects, 2,027 parts named by the model. Accepted, and shown to the owner.

- **Q10:** (a). A word for a type or a key maps to the world's schema path, for every world (one rule, not a special case
  for large worlds). The host then knows the world is relevant and picks shards by the other words.
- **Q11:** yes, a string for a value of several words. No underscore notation.
- **Q12:** keep (c): where a hand-written object exists, the imported drawing is left out. No variant key; remove it
  from the schema if nothing else uses it.
- **More objects (owner wants thousands).** 811 is what Noto has. Next sources, same converter, same naming pass, in this
  order; skip a name that already exists: (1) OpenMoji (CC BY-SA 4.0, GitHub) for things Noto lacks; (2) an openly
  licensed flat icon set with filled shapes and object names. Search GitHub, compare 20 objects per candidate, and report
  the choice and its licence before the full run. Target: 2,000 distinct common objects. Report how many new ones each
  source really adds.
- Then continue with R2.3, R2.4, R2.5 and the two import scripts.
- **sopworld 0.15.0 (commit 782cd0c)** is validated: soft issues no longer make knowledge conflicting, the merge is
  order-independent, `core.module version=` is accepted. Upgrade the pin (tools/sopworld + VERSION), move the schema
  versions from the header to `version=`, and remove the fork workaround from the page example and tests. One commit.

## Reviewer 2026-11-13 10:45 — Round 2 accepted; answers Q9, Q13–Q15; Round 3

**Validated at 68d15cc:** `npm test` 2,256 pass, 0 fail; catalog rebuild gives no diff; contact sheets of Mulberry (77 objects)
and of the hand-written set were checked by eye. 2,136 drawable objects. Accepted. The choice of Mulberry is accepted.

- **Q9:** keep the WordNet licence on `k.words` and the attribution of the frequency list in SOURCE.md and LICENSES.md.
- **Q13:** the size is accepted (hosts load one shard per lookup). Keep the 200-point budget. Keep `npm test` under 5 minutes:
  if it grows, validate shards in parallel.
- **Q14:** name all 1,265, the owner asked for it. First by rule: a part that is only a stroke, or a black outline with the
  same box as a filled part, is `kind=detail`. Then the looking pass, as for Noto.
- **Q15:** identity is the common short name (Natural Earth `NAME`: "United States", "Serbia"); the formal name is a second
  key `formal=`; other short forms stay `core.word` facts.

**Round 3.**
- **R3.1** Q15, then the naming pass for the OpenMoji and Mulberry objects (rule first, then looking; batches of about 100,
  one commit each; `named=model`; only when sure).
- **R3.2 Clean Mulberry.** It is a symbol set, so some entries are not things (bendy, drink, counters) or do not survive the
  conversion (wire, wool, switch). While looking, list the objects that are not a recognisable thing in
  `sources/mulberry/excluded.tsv` with a reason; the import script skips them. Report the final count.
- **R3.3 Four hand-written cores** (source `hand-core`, CC0, with tests, facts a child's encyclopedia would state; no
  disputed or fast-changing numbers):
  - `k.space`: sun, 8 planets (order, size class, moons count as "about", rings, rocky or gas), the Moon, a few named moons,
    comets, stars, galaxy; with `k.objects` names where a drawing exists.
  - `k.animals`: 150 common animals: class, legs, covering, sound, habitat, diet, baby name, can fly / swim.
  - `k.body`: body parts, where they are, how many, what they do, the five senses.
  - `k.food`: 150 common foods: kind (fruit, vegetable, dairy, …), colour, grows on / comes from, eaten raw or cooked.
  Join to `k.objects` and `k.commonsense` by name, as before.
- **R3.4 `docs/index.html`:** add a small gallery page `docs/gallery.html` that lists every `k.objects` object with its
  preview (lazy images, a search box, the source and licence per object), so the owner can browse all the shapes.
- Report as before. Say exactly what was looked at and what was not.

## Reviewer 2026-11-13 12:20 — Round 3 accepted; answers Q16–Q19; Round 4

**Validated at d28a79f:** `npm test` 2,180 pass, 0 fail; catalog rebuild gives no diff. A sample of 22 facts from each of
`k.space`, `k.animals`, `k.body`, `k.food` was read by the reviewer: no error found. 1,987 drawable objects, 10 worlds. Accepted.

- **Q16:** keep one football kit as "football kit"; exclude the other 49.
- **Q17:** yes, `drawing=<object name>` is the join from a fact to its drawing.
- **Q18:** a second key with the suffix `_about` (`moons_about=95`) is the way to say an approximate number. Never both
  keys on one fact. Write the rule in AGENTS.md.
- **Q19:** `cannot=<verb>` next to `can=<verb>`. One fact never has the same verb in both.

**Round 4: quality and coverage.**
- **R4.1 Audit of the model's part names.** Take 200 named parts at random (seeded) over the three imported sources. For each,
  render the object with only that part highlighted, look, and judge: right, wrong, or unclear. Report the error rate per
  source in worker-log, fix the wrong ones in the TSV. If a source is above 10% wrong, look again at all its names.
- **R4.2 Coverage of common things.** Build the list of the 1,500 most frequent English nouns that name a physical thing
  (frequency list × WordNet: hyponyms of physical object, living thing, food, artifact; drop abstract senses). Report how
  many have a drawing, and write `docs/worlds/k.objects/MISSING.md` with those that do not, most frequent first.
- **R4.3 Hand-write the 60 most frequent missing things** (named parts, as the hand-written sets), with previews looked at.
- **R4.4 Synonyms to drawings.** A word with no drawing whose WordNet synonym or direct hypernym has one ("automobile" →
  car, "puppy" → dog) gets a `core.word` to that drawing in `k.objects`, marked `core.source` WordNet. Report how much
  coverage this adds. No guessed links.
- Report as before.

## Reviewer 2026-11-13 14:40 — Round 4 accepted; answers Q20, Q21; Round 5

**Validated at dd530f3:** `npm test` 2,206 pass, 0 fail; catalog rebuild gives no diff; the 60 new hand-written objects were
checked on a contact sheet (weakest: pole, hole, lane, valley). 2,003 objects; 832 of the 1,500 common things reach a
drawing (55.5%). Accepted.

- **Q20:** the list as built is accepted (no persons, places, proper names; the 695 removed by reading stay removed, with
  their reasons in the TSV).
- **Q21:** `core.word` only for the same thing (couch → sofa). "Kind of" is its own fact, not a word:
  `k.objects.stand_in name=puppy drawing=dog` (source WordNet), so a host can say "I drew a dog for the puppy".
  Move the 187 hypernym links to it.

**Round 5: right sense, more coverage.**
- **R5.1** Q21. Then the sense check: for the 582 name-matched drawings of the common list, look at each drawing next to the
  kept sense's gloss (contact sheets) and judge right / wrong sense / unclear. A wrong-sense drawing keeps its name if that
  sense is also common (seashell), and the list entry counts as missing; otherwise rename the object. Fix `bank`, `shell`,
  `frame`. Report the count.
- **R5.2** Look at the about 135 stand-in and synonym drawings not looked at yet; remove links that mislead.
- **R5.3** Hand-write the next 100 most frequent missing things (batches of 25, previews looked at; redraw pole, hole, lane,
  valley). Skip things that cannot be drawn as an object (materials, substances without a container): list them in
  `MISSING.md` as "not drawable" with a reason, and they leave the count.
- **R5.4** Report coverage again, and the same coverage for the 3,000 most frequent common things.
- Report as before, with what was looked at and what was not.

## Reviewer 2026-11-13 14:55 — Round 6 (owner): `k.faces`, faces built from replaceable parts (after Round 5)

The owner wants avatars made of small vector elements that can be replaced, resized and recoloured, composed from a
description, like a police sketch. The application will draw them with the same renderer as `k.objects`.

- **R6.1 Schema `k.faces`** (imports `k.objects` conventions: primitive shapes, boxes in a 0–100 frame, points as wires, colours):
  - `k.faces.slot`: the places of a face, each with an anchor box in the face frame and a draw order: head shape, ears,
    neck, hair back, hair front, eyebrows, eyes, nose, mouth, cheeks, beard, moustache, glasses, hat, earrings, shoulders/clothes.
  - `k.faces.variant`: one drawable shape for a slot (`slot=`, `name=`), with **plain descriptive features** as repeated keys a
    person would say: `shape=round|oval|long|square|heart`, `size=small|medium|large`, `feel=thin|thick|curly|straight|wavy|
    bushy|arched|flat|wide|narrow|open|closed|smiling|sad|surprised`, `length=short|medium|long`, and for whom it fits
    (`age=child|adult|old`) where the drawing shows it. Its parts are `k.objects.part`-like wires drawn inside the slot box.
  - Paired slots (eyes, eyebrows, ears) store one side; the other is mirrored by the renderer (`mirror=true` on the slot).
  - `k.faces.preset`: a named face = one variant per slot plus colours (skin, hair, eyes, clothes): about 12 presets (child,
    woman, man, old woman, old man, robot, cartoon styles), English names.
  - `k.faces.expression`: happy, sad, angry, surprised, sleepy, wink, talking (open / closed mouth pair): which variants of
    mouth, eyebrows and eyes it switches to.
  - Colour lists as facts: natural skin, hair and eye colours with names.
- **R6.2 Hand-written core:** at least 6 variants per slot (10 for hair, eyes, mouth), drawn with primitives, so that a face
  can be assembled today. Previews: every variant alone, and a sheet of 40 seeded random combinations plus the presets
  (`docs/worlds/k.faces/preview/`). Look at them; a combination must still look like a face (anchors line up).
- **R6.3 Import** from DiceBear collections on GitHub (`dicebear/dicebear`), only styles under CC0 or CC BY (check each style's
  licence file and record it; skip the rest): their parts are already separated per slot. Convert with the Noto converter
  (curves to polygons, point budget), map each part to our slot and features (name them by looking, `named=model`), keep the
  style name as `style=` so a face does not mix styles unless asked. Report per style: variants per slot, licence, and a
  preview sheet. If a style does not survive the conversion, leave it out and say so.
- **R6.4 Questions it must answer** (tests): "which mouths are there", "a long face with small eyes and thick eyebrows" →
  the variants whose features match, ranked by how many features match; "what is the difference between preset A and B".
- Gallery: add the faces to `docs/gallery.html` (a second tab or page) with the slot and features of each variant.

## Reviewer 2026-11-13 16:00 — Round 7 (after Round 6): knowledge that makes the demo richer

Hand-written cores (CC0, tests, facts a child's encyclopedia would state), joined to `k.objects` by `drawing=`:
- **R7.1 `k.scenes`**: 60 typical scenes (beach, farm, city street, forest, kitchen, classroom, playground, space, underwater,
  winter…): what is usually there (`has=<thing>`, with a usual count and a usual place: sky, ground, left, centre, background),
  what happens there, the time and weather that fit. So "draw a beach" can be composed from things that have drawings.
  Report for each scene how many of its things have a drawing.
- **R7.2 `k.actions`**: 150 common verbs: who or what can do it, to what, with what tool, where, and the result
  ("cut: a person cuts bread with a knife"; "fly: birds, planes"), plus opposite and "undone by". Links to `k.commonsense`.
- **R7.3 `k.colours` and `k.shapes`**: colour names with their family, light/dark, what mixes into what, typical things of
  that colour; shapes with sides, corners, round or not, and things of that shape.
- **R7.4 `k.feelings`**: 30 feelings: how the face shows it (links to `k.faces.expression`), what usually causes it, the
  opposite, a kind reply. For the avatar and the Talk tab.
- **R7.5 `k.people`**: 60 roles and jobs (doctor, farmer, pirate, astronaut, grandmother…): what they wear, hold and use,
  where they work; features that map to `k.faces` and to things with drawings.
Order: R7.1 first (the drawing demo needs it), then R7.4 and R7.5 (avatars), then R7.2, R7.3.

## Reviewer 2026-11-13 16:45 — Round 7 addendum: what the demo asks knowledge for (from the owner's log)

The demo will fill gaps from knowledge (PSys2 WORLDS-AS-MODULES, M3). Make sure these can be answered by lookup, with sources:
1. **Usual place** for every drawable thing in k.objects, in k.scenes: sky, ground, water, indoors, on another thing (sun and clouds in the sky; duck on water; goat, cow, house, swing on the ground). Model-labelled where sure (`named=model`), same audit as part names.
2. **Usual relative size** class (tiny … huge) for the same things.
3. **Person kinds** in k.people: child, baby, boy, girl, man, woman, grandfather, grandmother as variants of one person drawing (age, hair, height) and all reachable by any of their names.
4. **Stand-ins found missing today:** villa → house, puddle → small lake, donkey, grandfather. Add them and report how many of the 1,500 common things still have neither a drawing nor a stand-in.

## Reviewer 2026-11-13 17:25 — Rounds 5 and 6 accepted at 99a5508; Q22 → (c); Q23 → the estimate is enough

**Validated:** npm test 2,347 pass, 0 fail (reported; reviewer run at 78a4d6f: 2,288 pass, 0 fail). Reviewer looked at one sheet: 13 presets, 7 expressions, 40 random core faces, 20 imported (big-smile, cutouts). The core faces are good and varied; the sheet went to the owner.
- **Q22 → (c).** A common thing counts as drawn when the drawing shows any physical sense of the word that WordNet has; no override table, no hunt for the rare sense. Recount coverage with this rule and remove baseball plate, horse-drawn lorry and the like from MISSING.md.
- **Q23 → accepted as an estimate.** Do not read the tail; the 1,500 list is the measure.
- Faces: the host draws mirrored slots twice (accepted); the preset check stays a test until sopworld can say it.

**Next: Round 7 with its addendum** (usual place and relative size for every drawable thing, person kinds, the stand-ins the owner's log missed), k.scenes first. Move to sopworld 0.16.0 at the start.

## Reviewer 2026-11-13 17:40 — Round 7 addendum 2: what the SPACE world asks knowledge for (owner)

After the first addendum, before k.feelings:
1. **`k.layouts`**: named arrangements as facts: row, column, grid, ring, scatter, corners, stack, tree, flow, landscape (sky above ground, water in the ground), face (the k.faces slots and how they sit), room, family photo. For each: slots, relations between slots (left of, above, inside, aligned), when it is usual (for which kinds of things). English names and synonyms as `core.word`.
2. **Anchors** on drawable things where sure (`named=model`): where another thing sits or attaches (seat of a swing or chair, surface of water or a table, roof line of a house, handle, top of a head for a hat, hand). Start with the 220 hand-written objects and k.faces slots; audit as for part names.
3. **What joins what**: "part of" / "attaches to" between kinds (roof–wall, wheel–car, hat–head, arrow–box), from k.commonsense where present, else model-labelled.

## Reviewer 2026-11-13 18:35 — Round 7 so far accepted at 28039fa (k.scenes, k.people, k.feelings, place and size, hand stand-ins); two defects in the scene previews; Q24–Q26

**Accepted on your report** (2,413 pass; reviewer did not rerun) and one sheet of 12 scene previews looked at by the reviewer. The facts are what the demo needs (which things belong to a scene, usual place, size class). Defects, previews only:
1. **The published preview page shows empty backgrounds.** `preview/index.html` loads each scene with `<img>`, and an SVG loaded as an image may not load the object drawings it references. Inline the object drawings into each scene SVG (or `<symbol>` + `<use>` inside one file) and open the page in headless Chrome before publishing; add that check to the build.
2. **The compositions pile up**: things overlap in heaps (farm, forest, zoo, market) and every object carries a white tile. Remove the tile (transparent previews) and place by simple rows per place band (sky, far ground, near ground, on water, on wall, on floor) with no overlaps and sizes from the size class. Do not build a clever layout here: the real placing is the demo's SPACE solver; these previews only have to be readable.

**Q24 → pond.** Keep puddle → pond. Also draw a plain `lake` (water only, no mountains or tree) since a lake is used as a region in drawings; the present one can be `"mountain lake"`.
**Q25 → yes.** A hand-written object counts for its own name whatever WordNet lists; general rule, not a table.
**Q26 → nothing waits.** The second addendum comes next.

**Next, in order:** the two preview defects; addendum 2 (`k.layouts`, anchors, what joins what); more hats and work clothes in k.faces / k.people so jobs do not all look like the plain man (about 25 do); feelings that share a face get distinct expressions where a face can show it (sad vs guilty vs lonely cannot: say so in the facts instead); then k.actions, k.colours, k.shapes.

## Reviewer 2026-11-13 19:35 — Round 8: the knowledge the demo's new design needs (owner: "as much general knowledge as we can")

The demo moves to universal acts over world schemas (PSys2 worker-tasks.md, "ACTS × SCHEMAS"). Every role of a request may be filled from knowledge. After the open items of Round 7 (preview defects, k.layouts, anchors, joins), in this order:
1. **`k.actions` as the words of the acts.** For the acts make, remove, change, place, connect, group, take apart, pick, ask, copy, send, undo, save, load: the English verbs and phrases that mean them (WordNet verb synsets and their lemmas where the licence allows, plus phrasal verbs: put on, take off, get rid of, turn into), each with the roles it takes and the prepositions that mark them (on, to, next to, into, with, from). Sense-check by reading, as for the nouns. This replaces verb lists in the demo.
2. **`k.attributes`**: for kinds of things, which attributes they usually have and usual values: colour (usual colours of 2,000 things: a banana is yellow), material, size class (exists), number of legs / wheels, can it fly / swim / move, where it lives, what it eats, what it is used for. Sources: k.commonsense / ConceptNet where licensed, WordNet glosses, else model-labelled (`named=model`) with a sampled audit.
3. **`k.values`**: colour names with RGB and synonyms (CSS colours are free; add common names), size and amount words in order (tiny … huge; a bit … a lot), shape names, directions, "random / different / same / each" as set words, number words and ordinals.
4. **`k.wearables`** joined to k.faces and k.people: what is worn where (hat on head, glasses on eyes, earrings on ears, scarf on neck), with drawings for the common ones and the anchor on the body or face.
5. **Parts for more things**: part names exist for drawings; add for the 1,500 common things the usual parts even with no drawing (a car has wheels, doors, engine), from WordNet meronyms.
6. **Coverage report** per world: how many of the 1,500 common things have place, size, colour, parts, a drawing, a stand-in; the gaps drive the next round.
Rules as before: free licences only, English only, sources on every wire, look at samples and say what was not looked at.

## Reviewer 2026-11-13 20:35 — Round 7 accepted at 30c39ed; Q27, Q28; Round 9 (first worker). The second worker continues Round 8.

**Validated:** reviewer ran npm test at 0bc7cbe (2,489 pass, 0 fail; your later run 2,529) and opened the published `k.scenes/preview/index.html` in headless Chrome: the things appear, in readable rows, no heaps (8 room scenes seen; the outdoor ones not seen by the reviewer). The sheet went to the owner. Accepted: previews, `k.layouts`, anchors, joins, hats and work clothes, `looks_like`, `k.colours`, `k.shapes`, the merge into `k.actions`.
- **Q27 → yes:** a thing counts as drawn when any drawing in the catalog carries its name, whatever the source. One rule; recount.
- **Q28 → keep both**, joined by name as now: `k.values` holds the words and scales, `k.colours` / `k.shapes` hold facts about them (mixes, typical things, sides). No fact in two places.

**Round 9, in order (the demo's Talk tab asked 301 questions and found a fact for 29%; these are the gaps it listed, plus anchors):**
1. **Anchors for the things people sit, stand, lie or put things on**, hand-written or imported: swing, chair, bench, bed, table, shelf, boat, horse, bicycle, car, tree (branch), roof, head (hat), hand. For imported drawings with unnamed parts give the anchor as a point in the drawing's frame, `named=model`, checked by drawing it on the object. Target: every thing in `k.scenes` that another thing is usually on or in.
2. **k.animals facts** for the 300 most common animals: legs, covering, size class, habitat, diet, sound, young, can fly / swim / climb, group name. Sources: what the repo has (WordNet, Wikidata CC0 if a dump of the needed properties is reachable from GitHub), else `named=model` with a 200-row audit.
3. **Places beyond countries** in k.geo: capitals for every country (check they answer "capital of X" by lookup), the 100 best-known mountains, rivers, deserts, lakes, seas, oceans, continents, with one number each (height, length, area) where a free source has it (Natural Earth, Wikidata).
4. **k.space facts**: planets (moons, rings, order, colour and why in one plain sentence), sun, moon, stars, day and year lengths.
5. **k.body**: parts of hand, eye, ear, mouth; counts (fingers, teeth, bones); what each main organ does in one plain sentence.
6. **k.food**: what common dishes and foods are made of; kind (fruit, vegetable, grain, dairy, meat); usual colour (joins `k.colours`).
7. **k.words**: opposites and kind-of chains answered by lookup for the 3,000 common words (check coverage, fill gaps from WordNet antonyms and hypernyms).
8. After each item rerun the coverage report and say how many of a seeded sample of 100 natural questions of that domain now find a fact.

## Reviewer 2026-11-13 21:30 — for both workers: aspects (owner's goal: transfer of knowledge between worlds)

The demo will show one thing in several views (picture, diagram, chart, map, document, card) according to the aspects the thing has. Knowledge must say which kinds have which aspects. In `k.attributes` (second worker, after the current item): group the attributes into aspects (visual, spatial, relational, numeric, textual, geographic, temporal, social) as facts, and for the 1,500 common things plus the kinds of k.geo, k.animals, k.food, k.people, k.time, k.space say which aspects they have and where the values are found (which world, which key). One generated coverage table: kind family × aspect. First worker: when adding facts in Round 9, give numbers with units (joins `k.units`) so the numeric aspect is usable in charts.

## Reviewer 2026-11-13 21:55 — Round 8 and aspects accepted at 1fdd08d; Q29, Q30; Round 10 (second worker)

**Validated by the reviewer:** npm test 2,582 pass, 0 fail; 12 random `k.actions.verb` wires and 8 `k.attributes.thing` wires read (all sensible); ASPECTS.md read. Not looked at by the reviewer: k.wearables boxes, k.parts, k.values colours. Accepted: `k.actions` (14 acts, 291 verbs), `k.values`, `k.attributes` with aspects, `k.wearables`, `k.parts`, COVERAGE.md.
- **Q29 → two facts, never mixed:** keep `colour` (usual colour) only where plain; add `drawn_colour` computed from the drawing (main fill colours mapped to `k.values` colour names) for every drawable thing; and `colour=any` for things that come in any colour (car, ball, shirt), model-labelled where sure. A host uses usual, then drawn.
- **Q30 → yes:** next to WordNet's synset parts add the plain part word (`door` for "car door") as the name a user says, and model-labelled usual parts (`named=model`) for the common things with none; sampled audit as before.

**Round 10 (second worker), in order. The demo's goal is now transfer of knowledge between its worlds, so joins between knowledge worlds matter as much as new facts:**
1. Q29 and Q30 as above.
2. **The 312 common things with no sense in `k.words`**: find why (multiword, plural, missing from the import) and fix by rule; report what remains.
3. **One name, one thing across worlds:** a generated join table (`docs/worlds/JOINS.md` + facts): for every name used as a key in more than one world (duck in k.objects, k.animals, k.scenes, k.attributes, k.parts, k.words) say whether they are the same thing; flag clashes of sense (bat, crane, mouse, orange). Hosts need this to treat a thing as one thing in every view.
4. **Reuse inside this repository** (the owner asks the library session for a reuse detector, `tools/reuse.mjs` in soplang-words-lib; if it exists when you get here, run it on our schemas and report; if not, do this by reading): which worlds repeat the same shape of facts (name + synonym words; place / size classes; is-a chains) and could share one module; propose, do not refactor yet (questions.md).
5. **Numeric aspect for common things** (3% today): usual size in metres or centimetres, weight class, count of legs / wheels / sides, price class, speed class, with units from `k.units`; model-labelled, sampled audit. So that charts and comparisons have something to show ("which is heavier").
6. **Temporal and social aspects**: when things are usually used or seen (season, time of day, age group), who uses them (joins `k.people` roles); for the things of `k.scenes`.
7. Rerun ASPECTS.md and COVERAGE.md at the end of each item (they go stale), and add a test that fails when they are stale.

## Reviewer 2026-11-13 22:30 — Round 10, item 0 (second worker, do it first): take in what the demo's own worlds know and we lack (owner: tab worlds must hold no general knowledge)

The demo (PSys2) still carries general knowledge in its tab worlds; it is being removed there and must exist here first. A copy of the PSys2 repository is at /tmp/wt2 (read only; do not change it). Its hand-written knowledge is the project's own data, so it can be published here as CC0 with source `psys2-worlds <commit>`.
Read: `/tmp/wt2/worlds/geo.map/kb.sop` (1,001 cities, 250 countries, 38 regions), `kids.animals/kb.sop` (68 animals), `kids.shapes/kb.sop` (families, typical things, colours, shapes, mixes), `kids.time/kb.sop`, `common.sense/kb.sop` (lives in, supports, around, face part, place, rules), `worlds/space/space.mjs` (the `KNOWLEDGE` table), `worlds/art.draw/scene.mjs` (`BASE_COLORS`, `COLOR_ALIASES`, `SHADES`, the built-in kinds), `worlds/lang.common/lexicon.sop` (number words, yes / no words).
For each: a table of what it has that our worlds lack (missing things, missing keys, values that disagree), then add the missing facts to the right `k.*` world in our formats (no new world unless nothing fits), with tests. Values that disagree go to questions.md with both sources. Write the result as `docs/worlds/FROM-PSYS2.md` (what was taken, into which world, what was left and why) so the demo's worker can delete its copies.

## Reviewer 2026-11-13 22:40 — this repository is the home of every reusable SOP-Lang-only world (owner)

Not only facts: any world written in SOP Lang alone that another application could reuse lives here and is loaded by lookup: common-sense rules about kinds, layouts, the words of the acts, value words, and reusable **world schemas** (a seating plan, a timeline, a list, a board) once the library's `std.schema` format is used by the demo. Add to README a section "what belongs here / what belongs to the library (modules with functions) / what stays in an application". When PSys2 hands over SOP-only worlds (its `handover/` folder, also readable at /tmp/wt2 for the workers of this session), import them under a `w.*` namespace (reusable worlds, as `k.*` is knowledge), with source and licence CC0, tests, and an entry in the catalog so a host finds a schema by name ("a seating plan").

## Reviewer 2026-11-13 23:10 — Round 9 accepted at 6893026; Q31, Q32; Round 11 (first worker)

**Validated by the reviewer:** npm test 2,649 pass, 0 fail; read 9 planet wires, 8 random animals, 6 random river lengths: all agree with what the reviewer knows (Severn 354 km, Volga 3,530 km, Mars 687 days). Not checked by anyone against a second source: the rest of the `named=model` numbers; they keep `_about` and `named=model`, which is the honest label. Accepted.
- **Q31 → yes:** one `k.units.measure` fact per numeric slot, kept in `k.units`; extend it to the second worker's worlds (k.attributes numbers, k.values scales) and keep the tool's refusal of a number without a unit for every world.
- **Q32 → one home:** place and size class of every thing, animals included, live in `k.scenes.thing`; `k.animals.animal` drops `size` and the generator adds a `k.scenes.thing` row for any animal that lacks one. A test forbids the same key for the same thing in two worlds (use the joins table of Round 10 when it lands).

**Round 11, in order:**
1. **The demo's real questions.** A copy of PSys2 is at /tmp/wt2 (read only). `training/eval/failures.jsonl` there holds the Talk tab's failed questions (rows whose source mentions talk / E-T1) and `training/eval/knowledge-lookup-2026-11-13.jsonl` the lookup set. Write `tools/ask-real.mjs` that answers each from the catalog the way a host would (lookup by the words of the question; no reading of English beyond finding the thing and the asked key) and report found / not found by cause: thing missing, key missing, word not in vocabulary, sense clash. Fill the gaps by cause, not by question; rerun; report before and after.
2. **Reusable worlds (`w.*`) and the README section** of the 22:40 block: "what belongs here / to the library / to an application"; then the first three reusable schemas written from scratch in the library's `std.schema` format (see github.com/ml-circuits-research/soplang-words-lib, `examples/acts.mjs`, `docs/reference.md`): a list, a seating plan, a timeline; each with words, an example session as a test, and a catalog entry found by name.
3. **Drawings for animals whose name shows another thing** (crane, kiwi, bat, seal, mouse: use the joins table if it exists) and 100 more of the 477 common things with no drawing, chosen by frequency; look at each.
4. **Common-sense rules about kinds as SOP Lang rules** (not only facts): lives-in implies usual place; a thing on a carrier moves with it; liquids need a container; things that cannot fly are not in the sky unless on something. Small, tested, with sources `hand-core`, in a `k.commonsense` rules shard a host can import; say which need a function and leave those to the library.

## Reviewer 2026-11-14 00:40 — STANDING DIRECTION (both workers)

**Owner, 2026-11-13 22:54 (standing direction for all three repositories):** the goal is to accumulate experience in how worlds are made, to improve sopworld, to generalise, to accumulate cases, and to learn how to combine worlds so that coverage grows. Everything else is secondary. Small regressions are acceptable when generality and learning are gained.

Here that means: (1) joins between worlds (one name, one thing; aspects; units) count as much as new facts, because they are what lets the demo combine worlds; (2) every gap the demo or the library reports (PSys2 `handover/k.actions-missing.md` and catalog-gaps hand-overs, the library's case corpus) is filled by cause; (3) `docs/lessons.md`: what each round taught about structuring knowledge for reuse; (4) imperfect model-labelled facts are acceptable with `named=model` and an audit sample, when they open a combination the demo could not do before.

## Reviewer 2026-11-14 01:00 — Round 12 (next free worker): `w.lang.en`, English as a reusable world (owner-agreed)

What is known about English grammar becomes one reusable world here, so that the demo and any other application read English with it instead of their own rules. Facts and rules only; the library builds the parser that applies it (`std.grammar`). Source material: PSys2 hands over its English rules under `handover/lang.en/` (read-only copy at /tmp/wt2; also `worlds/acts/forms*.mjs`, `worlds/lang.common/`, `src/dialog/dialogue.mjs`) and `k.words` / `k.actions` / `k.values` here.
Contents, first slice first: (1) noun phrases: determiners, quantifiers ("each", "all the", "three different"), modifiers and their order, possession ("the legs of the crocodile", "the house's door"), plurals and irregular forms (joined to k.words); (2) coordination and ellipsis ("a white house and a green one", "red and blue", "move it and the tree"); (3) anaphora and deixis (it, them, one, that one, the other, here, there); then (4) argument frames of the verbs of k.actions (who does what to what with which preposition, mapped to act roles), (5) negation, question frames, imperatives, politeness and fillers, (6) prepositions as spatial and temporal relations (joined to k.layouts and k.time), (7) clause joiners (and, then, also, if … then, from now on). Each part with tests as sentences → expected structure (a language-free structure the library will define with you: write it as a proposal in questions.md and in the library's format when it exists). Cite sources (grammar facts are hand-core; word lists from WordNet / k.words).
Also in this round: `handover/k.actions-missing.md` and `handover/knowledge-out/catalog-lacks.md` from PSys2 (verbs and the act `redo`, 137 cities, 16 countries, `around` joins, region boxes, kids facts as a child book states them), by cause.

## Reviewer 2026-11-14 01:20 — Round 12 starting point: PSys2 has written `w.lang.en` as a hand-over

PSys2's `handover/lang.en/` (read-only at /tmp/wt2/handover/lang.en) already holds the module `w.lang.en`: `schema.sop`, 10 shards (determiners, pronouns, prepositions, numbers, morphology, ellipsis, np rules with `status=hole` for what nothing reads yet, clauses, 176 argument frames of the acts, 79 grammar phrase groups) and a README. Round 12 starts by importing it here (source `psys2 <commit>`, CC0), validating it against this repository's rules (sources, no notation inside values, slot lines complete), joining its words to k.words / k.actions / k.values, and publishing it in the catalog. Then fill the holes and the parts of Round 12 that it does not cover.

## Reviewer 2026-11-14 02:00 — Round 10 accepted at b80eb64; Q33, Q34, Q36, Q37; Round 12 goes to the second worker

**Validated by the reviewer:** npm test 2,743 pass, **1 fail: the catalog freshness test** (index.json / vocab.json on main are not what a build gives: two workers pushed generated files in turn). The next commit of either worker rebuilds and pushes the catalog first. Read 6 random `k.attributes.number` rows (amulet, armor, barge, lilac, bullock, reindeer: sensible). Accepted: the joins type fix and the validator rule (refuse a fact of an undeclared type), numeric aspect (1,042 of 1,500), usage (temporal / social), the PSys2 hand-overs, the WordNet senses for one-word names, lessons.
- **Q33 → (b) + (c).** Facts that changed in the world win: capitals Gitega, Astana, Ngerulmud; independence from the country list where Natural Earth's `TYPE` is plainly wrong (Cuba, Israel, Kazakhstan; read the other 11 one by one); UK population ours; Cyprus: both continents are said (Asia geographically, Europe politically: a key that says which), sub-Antarctic territories ours; animals: kit (young of a rabbit) with bunny as an everyday word, hair / fur: keep ours. Schemas: `k.shapes.shape.is_a` many (a square is a rectangle and a rhombus); a duration may be told in several units (identity name + unit). Published schema changes are acceptable now (standing direction).
- **Q34 → (a).** Do 1 (one `k.drawing` module for part / point / shapes, imported by k.objects and k.faces), 4 (the basic colours declared once in `k.values` and referred to) and 6 (one `is_a` relation followed upwards by one rule in a shared module) here now. Items 2, 3 and 5 (slot groups, a rule over key names, `named` / `drawing` as core or ref keys) are forwarded by the reviewer to the library.
- **Q36 → yes:** multiword names enter `k.words` (WordNet has them with underscores: manta_ray, light_year).
- **Q37 → yes:** a number or usage fact for a name with two senses says which (`sense=` with the WordNet sense or the owning world).

**Second worker: Round 12 (`w.lang.en`, block 01:20: start from PSys2's `handover/lang.en`) is yours now**, then Q34 (a) and the Q33 schema changes. The first worker continues Round 11.

## Reviewer 2026-11-14 02:15 — for the first worker after Round 11: order in time for `k.time`

The demo now reads temporal prepositions from `w.lang.en` facts (before, after, during, until, since) but has nothing to compare: give `k.time` an order in time: weekdays, months, seasons (with the hemisphere said), parts of the day and clock hours, holidays of `k.time` if any, each with its position and its successor; a "before / after" relation derivable by one rule; durations told in several units (Q33). Tests: "Monday is before Friday", "December is after November", "spring comes after winter" (with the cyclic case said: "after December comes January").

## Reviewer 2026-11-14 02:45 — Round 11 accepted at 5bb2eda; Q35, Q38; next for the first worker

**Validated by the reviewer:** npm test 2,821 tests, 2,804 pass, 0 fail; one sheet of 60 of the 103 new drawings (recognisable; "crane bird" did not render on the sheet because the preview file is `crane_bird.svg` while the name has a space: check that every multiword object's preview is found by the gallery and the hosts by the same rule). Accepted: `w.list`, `w.seating`, `w.timeline` in the library's format with catalog entries; 103 drawings (common things with a drawing 680 → 780); animals drawn under another name; common-sense rules over kinds; lessons (the one on derived facts not seen by the tools is important).
- **Q35 → one build:** move every world (k.* and w.*) to the library's current release (0.30.0 at 42b3456) in one commit, rebuild, report what changed; two builds is a trap. The two library defects you saw (`make` accepts a thing without a required attribute; `undo` right after `remove` undoes the step before) are forwarded to the library.
- **Q38 → rules live in a module, not in a shard:** keep them in the `k.commonsense` schema module now; if the module grows, a separate `k.commonsense.rules` module that imports the fact worlds (so a host can take the facts without the rules). Document the rule "shards hold facts, modules hold rules" in README.
**Next, in order:** (1) one sopworld build (Q35); (2) order in time for `k.time` (block 02:15); (3) **derived facts visible to tools**: a build step that runs the rules of each module over its facts and writes what they derive into a generated shard (marked `derived=true`, with the rule as source), so JOINS, COVERAGE, ASPECTS and the demo's lookups see them; a test that the generated shard is fresh; (4) the weakest drawings you named (cougar, clam, eel, stocking, cheesecake, buggy, harness): redraw or replace by a better imported one.

## Reviewer 2026-11-14 06:00 — names for the kinds of worlds (owner); README

**Names for the three kinds of worlds (owner asked; reviewer proposal, to be used in every repository and in the library docs):**
1. **world schema** — what a kind of world is: its kinds of things, attributes, value types, acts, limits, rules and the words for them; no particular things. Reusable; lives in sop-knowledge-worlds as `w.*` (seating plan, timeline, list, and the schemas of the demo tabs once general). In the library: `std.schema`.
2. **knowledge world** — facts about the world at large (animals, places, colours, English grammar), true for everyone, no session state; lives in sop-knowledge-worlds as `k.*` (and `w.lang.en` is a knowledge world about a language).
3. **live world** — one running instance of a world schema in a session: the things the user made, their current values, the focus, the history and undo, temporary and particular; it reads knowledge worlds and follows its schema. A tab shows a live world through a **view**.
Plus **library modules** (`std.*`: acts, fill, focus, relations, turn, know, grammar): mechanisms, not worlds.
In Romanian (for the owner): schema lumii, lume de cunoaștere, lume vie.

Task (whichever worker finishes its current item first): README and docs/worlds/README.md use these names: this repository holds world schemas (`w.*`) and knowledge worlds (`k.*`, `w.lang.en`), never live worlds; say it in one paragraph with an example of each.

## Reviewer 2026-11-14 06:45 — next stage after the current rounds: reusable SKILLS for coding agents that learn worlds (owner)

**Owner's idea:** coding agents are the learning layer ("system 1" in his words), sopworld worlds the deliberate run-time layer ("system 2"); the system runs on the worlds and periodically learns from use and consolidates. This repository holds the reusable skills that let any coding agent do that for any application built on sopworld.
Write them as agent skills under `skills/<name>/SKILL.md` (frontmatter `name`, `description` of when to use it; the body as concise steps with the checks; scripts the skill calls under `skills/<name>/scripts/` when needed), each tested by a dry run on real material from this repository and from PSys2 (read-only at /tmp/wt2):
1. **`learn-world-from-examples`**: from a description and example requests of a new kind of world, write a world schema (`w.*`) in the library's `std.schema` format, reusing k.* and w.* (never a value list knowledge already has), with words, an example session and catalog entry; measure with requests written without seeing the schema.
2. **`improve-world-from-failures`**: take a batch of failures (ledger / case-corpus format, the user's expectation included), group by cause and pipeline stage, decide where the fix belongs (knowledge world, world schema, `w.lang.en`, library mechanism, application), make the smallest general change, never a phrase-specific rule, and gate it: case corpus (no right-to-wrong), held-out set untouched, invariants; write the lesson.
3. **`learn-language-rules`**: from failures of the reading stage (unread formulations, synonyms, constructions), add facts to `w.lang.en` (or a sibling language world) and verbs / synonyms to k.actions / k.words, with tests; check the parser of the library reads them.
4. **`consolidate`**: the periodic cycle: ingest new failures, freeze held-out rows, run skills 2 and 3, rerun the landing measures and the learning curve, open the changes for review in each repository (knowledge, library, application) with the before / after table; stop if the held-out curve does not rise.
5. **`audit-knowledge`**: sample model-labelled facts, check against sources, fix or flag, as done in the rounds so far.
Each skill states what it may change and what it must never do (no restricted data, no phrase lists, no editing tests to pass). Use `docs/lessons.md` of the three repositories as the source of the steps: the skills are the lessons made executable.

## Reviewer 2026-11-14 06:55 — from the library (its Q33, Q34, Q35): what to change here (whichever worker is free; before the skills stage)

1. **`w.lang.en` schema**: `rhs` and `in` need `many=true` (the shards fail the cardinality check today, so the library cannot load the schema); add `priority=` on grammar rules where their order matters (the library honours it before its size ranking).
2. **Use the library's new constructs (sopworld 0.34+)**: one shared slot group `k.named` (with `named`) that worlds take by a second `extends=`; `excludes=` on every `*_about` slot naming its exact twin (replaces the three `core.deny` copies); `drawing=` and similar joins declared as `type=k.objects.object by=name` (checked when k.objects is loaded, open otherwise). Move the build to the release that has them.
3. **World schemas the library's corpus needs** (it carries inline copies until these are published):
   - `w.seating`: acts `connect`, `group`, `place` on the table; `copy`, `place` on the guest (a guest is placed into a seat through the seat's slot);
   - `w.timeline`: a range for `at` and a deny "an event is inside its timeline" (`from` / `to`);
   - **`w.face`**: the acting schema of a face, its parts as kinds with colour, size (0.6..1.5, default 1, step 0.1) and place, the shapes read from `k.faces`;
   - **a map view schema** (`w.map`): a view with state zoom 1..10 and layer (borders, rivers, none) over `k.geo` places.
   Each with an example session as a test and a catalog entry. PSys2's avatar and map can then take these schemas instead of their own (THIN LIVE WORLDS).

## Reviewer 2026-11-14 07:05 — the agent-skills stage moves to the library (cancel the 06:45 block here)

The skills are procedures over the library's tools (ledger, corpus, reuse detector, grid, catalog) for any application, versioned with that API; this repository is one of the places they write to. They are written in soplang-words-lib (`skills/`). Do not start the 06:45 block here; keep `docs/lessons.md` current, it is one of their sources.

## Reviewer 2026-11-14 07:40 — what PSys2 asks of this repository (read in /tmp/wt2/questions.md), by cause

Sections to read: "Q12 … lessons to forward" (lines marked [KNOW]), "w.lang.en vs the hand-over", "k.time version 2 consumed", "geo.map switch: frames and a joiner fact for w.lang.en". Take them in this order:
1. **`w.lang.en`**: publish the 34 frames written after the import (sets `acts.text`, `acts.facts`), the 5 frames of the act `own`, the 28 `acts.facts.ask.*` and 17 `acts.facts.layer.*` frames, and `joiner.keep text=its`, all from PSys2's `src/lang/en.local.mjs` (same format); keep a part's notation as written (the `[have]` loss); the reader-documentation rules (contraction, neg, imperative, correction, joiner, qframe) stay but are marked as documentation.
2. **`k.time`**: dawn and dusk, parts of the day containing others, `weekend`, "the week" / "the year" as spans that contain days or months; ship the derived `before` facts in the derived shard (your new `tools/derive.mjs`).
3. **The catalog vocabulary says the kind of each key** (so a reader can skip rivers and mountains it cannot resolve: "back" is a river) and **`core.word` aliases** (Peking).
4. **Gaps from the experiments**: friend; sister / brother / uncle and other relatives as `is_a person`; `k.shapes.shape.thing` reachable through the vocabulary ("what shape is a stop sign"); `k.actions`: drop (remove), reset; `k.attributes`: a switch attribute's verb and un-verb (stack / unstack, show / hide) and the default of an attribute.
5. `handover/knowledge-out/catalog-lacks.md` items still open.
Then the library's follow-ups (block 06:55). Whichever worker is free takes the next item; say in worker-log which one you took.

## Reviewer 2026-11-14 08:00 — second worker's batch accepted (Q36, Q37, Q33 facts, READMEs, during / until / since); Q41; split of the queue

**Validated:** npm test 2,871 tests, 2,854 pass, 0 fail (reviewer, after both workers' latest commits). Accepted as reported; the lessons are good (the identity key that could only be an atom; `SOVEREIGNT` instead of 13 exceptions; a fact stays in the shard of its licence).
- **Q41 → say what is true and neutral:** for Taiwan, Kosovo, Somaliland and Northern Cyprus add `recognition=limited` (with `core.source` of the source that says so) and leave `independent` unsaid; a host answering "is X independent?" says that recognition is limited. No other change.
**Split of the open items:** second worker (next agent): block 07:40 items 1–4 (w.lang.en frames and `joiner.keep`, k.time spans on top of `k.time.during`, vocabulary kinds and aliases, relatives / shapes / verbs / switch attributes), then block 06:55 items 1–2 (w.lang.en schema `many`, `priority`; slot groups, `excludes`, joins). First worker, after its current list: block 06:55 item 3 (w.seating acts, w.timeline range, w.face, w.map), then the two open w.lang.en holes (imperative clauses, possessive "of").

## Reviewer 2026-11-14 08:45 — first worker's batch accepted (derived shard, seven redrawn, preview file rule, README rule); Q42; next

Accepted on the worker's full run (2,871 pass, 0 fail) and one reviewer sheet of the seven redrawn drawings: cougar, eel, stocking, cheesecake, buggy read well; the clam still reads like a dessert and the harness like goggles: good enough, no more time on them now. The lessons (the one cue a thing alone has; a rule in the docs as code a test runs; two workers and the catalog version hash) are useful for the skills.
- **Q42 → keep the wire-level flag for now and forward the real fix to the library:** a value's origin (told / derived / default / knowledge) is a per-value tier, which `std.fill` and the act diff already have; the library is asked to keep a derived value's tier when a host merges a derived wire with a told one. Meanwhile the flag means "some values here are derived".
- The four `ambiguous-key` warnings (`name` declared by `k.kinds` and by the worlds extending it): the second worker removes them with the slot-group work (06:55 item 2).
**Next for the first worker:** block 06:55 item 3 (`w.seating` acts, `w.timeline` range and deny, `w.face`, `w.map`). The two w.lang.en holes go to the second worker, not to you.

## Reviewer 2026-11-14 09:10 — next round (after the current items of both workers): `k.procedures`, how goals are reached (owner)

**Owner (05:59): complex and planned actions should come from knowledge and orchestration, not from rules inside live worlds.** Today composite behaviours are code in live worlds: art.draw `engine.mjs` (2,272 lines) composes scenes, takes things apart and builds groups; "a chart / a document about the discussion", "draw a person on the swing" (make swing, make person, place on its seat anchor), "arrange them like a family photo" are each a hand path. Knowledge already holds pieces: `k.scenes` (what a scene has, where), `k.layouts` (arrangements, anchors, joins), `k.actions` (verbs, result, opposite, undone by), `k.parts`. Missing: **how to reach a goal**: procedures as knowledge, and a planner that applies them over the acts.
**`k.procedures`** (knowledge world, facts only): a **method** = a goal (an act on a kind, or a named task: "draw a farm", "a person sitting on a swing", "a family photo", "set a table for four", "take apart a car", "a chart of the things in the picture", "a report about what we did"), its **steps** as acts with roles that refer to the goal's roles or to knowledge (the things a scene has, the anchor a thing sits on, the arrangement of a layout, the parts of a thing), **preconditions** and **effects** stated as facts about the live world (a thing exists, is on, is inside), **order** (before / after, or unordered), and **alternatives** (two methods for one goal, with when each applies). Built first from what the repository already knows (k.scenes → compose a scene; k.layouts → arrange; k.parts → take apart / build; k.wearables → dress; k.people roles → a person of a role), then hand-written methods for common tasks, each with a test as a goal → expected step list. Coordinate the format with the library's planner (`std.plan`, being designed there): write the proposal in questions.md.

## Reviewer 2026-11-14 09:25 — round after k.procedures (or in parallel if a worker is free): `w.lang.ro`, a Romanian grammar world (owner's experiment)

Same shape and frame vocabulary as `w.lang.en`, so that a Romanian sentence reads into the same act + roles and a reply can be generated in Romanian:
1. **Morphology:** noun genders and plural classes, the enclitic definite article and the cases (nominative-accusative, genitive-dative) with their endings, adjective agreement, verb forms needed by requests and questions (imperative, indicative present, conjunctive "să", infinitive), pronouns (personal, clitic forms), numerals with agreement ("două case", "doi copaci"), diacritics and their absence (ș/s, ț/t, ă/a, â/î/a) as accepted spellings.
2. **Syntax facts:** word order of requests and questions, negation ("nu"), question words, prepositions as relations (pe, în, lângă, sub, deasupra, în fața, la stânga…) joined to `k.layouts` and `k.time`, coordination and ellipsis ("o casă albă și una verde"), clitic doubling, partitives ("unele dintre"), "celălalt / cealaltă".
3. **The same argument frames** as `w.lang.en`'s acts frames, with the Romanian verbs (desenează, mută, șterge, fă, pune, schimbă, arată…) and their roles, and the words of `k.values` / `k.actions` in Romanian joined to the English ones by sense.
4. **Sources: openly licensed only, check each licence first** (for instance the Universal Dependencies Romanian treebanks, Wiktionary-derived inflection tables, open Romanian spelling dictionaries: say which licence each has and whether it fits the rule "open-source or research, nothing restricted"; a share-alike source stays in its own shards with its licence). Hand-written facts as `hand-core`, model-labelled with `named=model` and an audit.
5. Tests: sentence → expected structure, for the PSys2 Romanian sets' sentence kinds; and generation tests: structure → Romanian sentence (articles, agreement).

## Reviewer 2026-11-14 09:35 — language worlds vs domain worlds

**Clarification (owner, 06:09): which worlds may hold Romanian.** The rule "no Romanian in SOP Lang or in worlds" stays for every domain world: knowledge worlds about things (k.*), world schemas (w.*), live worlds, the library. Their identifiers, keys, comments and words stay English, and they do not grow when a language is added. The only exception is a **language world**: `w.lang.ro` is a knowledge world *about* the Romanian language, so Romanian words appear in it as data, exactly as English words appear in `w.lang.en` (its keys, comments and structure stay English). It joins to the domain worlds only through sense ids and the shared frame vocabulary (a Romanian lemma → a k.words sense / a k.actions verb sense), never by adding Romanian words to them. Size: `w.lang.ro` is loaded only when the selected language is Romanian (lazy loading, by the word index); inflection is stored as rules and classes plus the lemmas the app needs, not as a list of every form; its shards are split so a session loads only what its words need. Report its size and what a Romanian session loads.

## Reviewer 2026-11-14 09:45 — language worlds: compact rules + external dictionaries

**Owner (06:11): a language world is compact rules plus external dictionaries, not a huge listing of words.** Design for `w.lang.ro` (and later for `w.lang.en` / `k.words` where it pays off):
1. **SOP Lang wires hold only what is general or exceptional:** inflection paradigms as classes and rules (endings, the enclitic article, case and agreement rules), syntax facts, frames, closed classes (pronouns, prepositions, determiners, numerals), and the irregular forms that no paradigm covers.
2. **An external dictionary** holds the open lexicon compactly: one row per lemma with its paradigm class (and gender, stress or alternation codes where the paradigm needs them) and its sense link (a k.words sense id or a k.actions verb sense), in a documented compact format (a sorted table split by prefix, loaded by the word index; or a compact binary/trie form generated from it), with its source and licence. No form lists: forms are generated by the paradigm rules when needed.
3. **The library reads it:** `std.grammar` gets a dictionary adapter (lookup lemma → paradigm, generate and analyse forms by the language world's rules), the same for every language; the format is part of the library docs.
4. Measure: wires in the language world, dictionary size, what a session loads, and coverage (share of words in the Romanian sets analysed correctly) before adding any hand list.

## Reviewer 2026-11-14 09:55 — four world schemas accepted at 2b5505e (w.seating 2, w.timeline 2, w.face, w.map); Q43; next for the first worker

Accepted on the worker's full run (2,879 pass, 0 fail) and its check on the library's 0.45 (the corpus passes, the inline face and map cases pass on these schemas). The lessons (a schema acting on a knowledge world takes its names, never its value lists; a mode is a key of the whole; a deny over a reference holds from both sides) go into the skills.
- **Q43 → move the one build to the library's current release** (the second worker is doing it as part of 06:55 item 2; when it lands, unskip the tests that name a release). Joins by name with two-part identities (a k.faces variant = slot + name; a map place = country or city) are forwarded to the library as "joins by a composite key".
- The `copy` question (does a copy keep the guest's seat?) is forwarded to the library.
**Next for the first worker: `k.procedures`** (block 09:10).

## Reviewer 2026-11-14 10:20 — `w.lang.ro` waits for the library's language-world notation (owner, 06:19)

The library gets a compact notation for language worlds (its Round 30: paradigm classes with inheritance run in both directions, agreement by unification, clitic segmentation, diacritic folding, dictionary adapter, realisation templates). When `w.lang.ro` starts: write a small draft first (5–10 paradigm classes, closed classes, 200 lemmas in the external dictionary format), send it to the library as the integration case, and ask any notation question in questions.md with the [LIB] tag. Do not write forms out as wires to work around a missing primitive; ask for the primitive.

## Reviewer 2026-11-14 10:35 — k.faces `plain`: from hand numbers to proportion rules (owner asked, 06:25, where the avatar's coordinates come from)

Today the 175 variants of style `plain` are absolute coordinates typed into `tools/faces-core.mjs` (e.g. head box 22,12,56,68; eye white circle 32,37,10) and generated into shards. The renderer and PSys2 hold no shapes (verified), but the knowledge itself is a list of numbers, not knowledge. After k.procedures, try:
1. **Proportion rules as wires** (k.faces or k.drawing): the canon of a face (eyes on the middle line of the head, the space between the eyes one eye wide, the nose bottom halfway between eyes and chin, the mouth a third below the nose, ears between brow and nose lines), as relations to the head box, with a child/adult/old variant of the canon.
2. **Variants as parameters over those rules**: a variant = primitive + a few relative parameters (size, roundness, tilt, openness) instead of absolute points; `tools/faces-core.mjs` computes the parts from the rules, so changing the head shape moves eyes, nose, mouth and glasses consistently.
3. **Measure before switching:** the contact sheet before/after (same faces must look the same or better: send the reviewer both sheets), the bytes of the `plain` shards, the lines of the generator, and whether `findVariants` and the 17 face cases still pass. Keep the absolute output if the rules lose on any of these.
The imported DiceBear styles stay as imported (their numbers are the source's drawing).

## Reviewer 2026-11-14 10:50 — `k.motion`: rules of a natural face over time (owner, 06:32), next after k.procedures

The avatar becomes an icon in PSys2's input bar that talks while replying and changes expression; its behaviour comes from rules here, read by sopworld `std.motion`:
1. **Blinking and idle:** intervals and durations as ranges from published measurements (cite the source; e.g. blink rate and blink duration studies), small idle glances.
2. **Expressions by outcome of a reply:** done → smile, not understood → raised brows / small frown, refusal → sad-ish, answer → neutral-attentive, thinking → eyes up/aside; onset, hold and ease-back durations; referencing `k.faces.expression` names and slots (no coordinates here).
3. **Visemes:** the language-neutral classes (rest, open, mid, rounded, closed-lips, lip-teeth, tongue) mapped to `k.faces` mouth variants; the letter/sound → viseme rule of English goes into `w.lang.en` (a compact rule table, not a word list), Romanian later into `w.lang.ro`; average duration per unit.
4. Tests: the rules parse, every referenced slot/variant/expression exists in k.faces, ranges are sane; a sample plan rendered as a strip of faces (send it to the reviewer).

## Reviewer 2026-11-14 11:05 — correction to `k.motion` item 3 (owner, 06:38): mouth shapes are not language knowledge

Nothing of the mouth goes into `w.lang.en` or `w.lang.ro`. All of it lives in `k.motion` (the animation world): the viseme classes, their `k.faces` mouth variants, durations, and one general rule from written text to mouth shapes (vowel letters open, o/u rounded, m/b/p closed lips, f/v lip-teeth, spaces and punctuation rest, an approximation that is enough for a natural look in any Latin-script text). If measured realism later needs sound-level detail, ask the reviewer first.

**Q44:** forwarded to the library (it answers when Round 29 starts). Go on writing methods in this format; if the library amends it, convert with a script.

## Reviewer 2026-11-14 11:20 — [LIB] the library's notation for language worlds is out (sopworld 0.52 `std.morph`, its questions.md Q37)

For the `w.lang.ro` draft: `m.class name= parent= drop= alt=`, `m.ending class= suffix= <features>` (`_` = none), `m.irregular lemma= form= <features>`, `m.fold from= to=`, `m.split text="-"`, `m.template act= shape= text=` (`{role}`, `{role:f=v}`, `{role@other}` agreement); type names renamable (`w.lang.ro.class`…). The dictionary is a TSV, not SOP Lang: `lemma<TAB>class<TAB>gender?<TAB>sense?`, sorted, one file per first letter of the folded lemma, a header comment with source and licence. The library is asked to allow several alternations per cell (carte → cărți). Choose the feature names and values and write them in questions.md for the library (suggestion: num sg/pl, case nomacc/gendat/voc, def yes/no, gender m/f/n, person 1/2/3, tense pres/impf/perf/pqp/subj/imper/inf/ger/part).

## Reviewer 2026-11-14 11:35 — k.procedures accepted (pending the reviewer's full npm test); Q45 to the second worker

1. **k.procedures** (1d4f120): accepted; Q44 a–d forwarded to the library for Round 29.
2. **Q45, second worker:** (i) mark imported unnamed drawing parts (`part<n>`, 13,920) as unnamed (`named=no` or a kind from the model where cheap), so take-apart can tell them; (ii) a `w.chart` schema (series, category, value, kind of chart) after the current items; (iii) "about" as a marker of `make` in k.actions / w.lang.en.

**Reviewer's full `npm test` on 09b63ae:** 2,899 tests, 2,880 pass, 19 skipped, 0 fail (my clone has no raw files; some tests skip with "needs sopworld 0.33/0.37 or later (pinned …)"). Second worker: move the pinned sopworld to 0.52 so these tests run (Q43), and report how many skips remain without raw files.

## Reviewer 2026-11-14 12:05 — the library accepted the Q44 format (its Q38)

Format accepted as published; (a) the role → std.acts argument map lives in the library; (b) history entry `{act, kind, thing, args}`, ask answers as `ask` gives them; (c) `of` lookup order anchor → wearable place → drawing part, as data; (d) kind-chain matching is `std.know`'s. When the library releases `std.plan`, delete `tools/lib/plan.mjs` and run tests/k.procedures.test.mjs through the library's planner (one planner, no copy).

## Reviewer 2026-11-14 12:25 — sopworld 0.55 has `std.plan`; sopworld pin to 0.52 accepted (5ae9e0f)

Whichever worker is free first: move the pin to 0.55, delete `tools/lib/plan.mjs`, run tests/k.procedures.test.mjs through the library's `plan` (same expected act lists; any difference goes to questions.md with [LIB], not into a local fix).

## Reviewer 2026-11-14 12:45 — k.motion accepted (43cb081); Q46 forwarded

Reviewer ran tests/k.motion.test.mjs (10/10) and read the strip (k-motion-strip.png: visemes, blink while talking, smile after "done", ease back). Accepted. Q46 forwarded: the library extends `std.motion` to read this format as published (it had released a minimal `mo.*` format in 0.54 at the same time). When it releases: pin it, delete `tools/lib/motion.mjs`, run the k.motion tests through the library.

## Reviewer 2026-11-14 13:00 — Q47 answered; next round for the first worker

**Q47:** publish the canon the `plain` style already follows (about 1.3 kB of facts, byte-identical output) and make `tools/faces-core.mjs` place parts from it, so the numbers come from rules that reproduce them exactly; the classical adult canon stays an experiment (it lost: 40/114 moustache–mouth and 37/152 nose–mouth overlaps). Do not try item 2 now. Thank you for measuring before switching.

Next, in order: (1) pin sopworld 0.55, delete `tools/lib/plan.mjs`, run tests/k.procedures.test.mjs through the library's `plan` (differences → questions.md [LIB]); (2) the canon above; (3) the first `w.lang.ro` draft in the library's notation (0.52/0.53 `std.morph`, block 11:20).

## Reviewer 2026-11-14 13:15 — sopworld 0.56 reads k.motion (its Q39 answers Q46)

Accepted as published; (a) splitter as data, host override allowed; (b) `via` in segments; (c) base = host's state; (d) cancel eases back from where it is; (e) repeat from the end of the last run. Add to the first worker's round: pin 0.56 (instead of 0.55), delete `tools/lib/motion.mjs` too, and run tests/k.motion.test.mjs through the library's `planMotionFacts`.

## Reviewer 2026-11-14 13:35 — 377ee17 accepted: one planner, one motion scheduler

Reviewer ran tests/k.procedures.test.mjs + tests/k.motion.test.mjs on 377ee17: 25/25 pass, through the library (tools/lib/plan.mjs and motion.mjs are gone). Accepted. Continue with the canon facts and the w.lang.ro draft.

## Reviewer 2026-11-14 14:15 — what the random-command sampler needs from knowledge (owner, 09:42), second worker after Q45

The library builds `std.sample` (random small commands constrained by the worlds); PSys2 uses it for the dice, Talk examples and tab buttons. From here: (1) **generation templates per act** in `w.lang.en` (imperative, one per act and argument shape; the realisation side of the frames already there); (2) **typicality** where it is cheap and sourced: which attributes a kind usually has a value for (a house: colour, size, roof; a guest: seat), as facts in k.attributes `usage` (already a key) so a sample names sensible attributes; (3) report kinds that have no drawable or no usage facts (holes a sampler would hit).

## Reviewer 2026-11-14 14:45 — `k.interest` and discourse templates (owner, 09:53), after the current rounds

The library builds `std.summarize` and `std.compose` (an essay that combines worlds in an interesting way; PSys2 shows it in the Documents tab). From here:
1. **`k.interest`: what makes a piece of text interesting**, as facts and rules with sources (the psychology of interest and curiosity: novelty and complexity appraisals, the information-gap account, incongruity/surprise, concreteness, personal relevance; cite the papers in WORLD.md, mark what is your own choice). Concretely usable by a program: features of a fact or a link that raise interest (distance between the worlds it links, rarity of the kind, a number far from the usual, a contrast with a common belief from k.commonsense, a question it opens), weights as ranges, and what lowers it (repetition, the obvious, lists without a point).
2. **Discourse templates in `w.lang.en`**: rhetorical moves (introduce a topic, compare two things, state a surprising fact, give an example, ask a question, conclude, transition between chapters) as compact templates with slots, for generation; English only (Romanian later in w.lang.ro).
3. **Salience for summaries**: which acts and changes are worth a line (k.actions: weight of acts for a summary), and how kinds generalise for a summary (k.kinds already; report kinds without a parent).

## Reviewer 2026-11-14 15:00 — AMENDS 14:45: genres, styles and story procedures (owner, 10:02): "random but by the book"

The owner: compositions must not use plain randomness; they follow procedures of a document type, with intelligent choices. Knowledge to write (after `k.interest`, same round):
1. **`k.genres`: document types as structure + moves + register**, with sources (writing guides, genre analysis): *scientific article* (IMRaD; moves of an introduction: territory, niche, occupying the niche; definitions, hedging, numbers with units, citations, impersonal register), *presentation* (title, agenda, one idea per section, an example and a takeaway each, a closing summary), *essay* (thesis, arguments with evidence, a counterargument and its answer, conclusion), *story* (see 2), *report* (what, when, results, next steps). Register as data per genre: person, tense, sentence length range, vocabulary level, allowed moves.
2. **`k.story`: how a story is built**, from the classic story-grammar and plot literature (cite: e.g. Propp's functions, story grammars of Rumelhart / Mandler–Johnson, the three-act / Freytag arc): setting, protagonist with a goal, obstacle, helper, attempts, turning point, resolution, ending; constraints between them (the obstacle blocks the goal; the helper has what is missing; the resolution uses something set up earlier). Characters, places and objects come from k.people, k.scenes, k.geo, k.objects, k.animals — nothing invented here but the structure.
3. **Composition procedures in `k.procedures`** (the format std.plan reads): "write a story", "write a presentation about X", "write a scientific article about X", "write an essay about X": steps whose choices are **choice points** (pick a protagonist of a kind that can have the goal, an obstacle that blocks it, a setting where both exist), resolved by the sampler weighted by `k.interest`, never free random.
4. **Register templates in `w.lang.en`**: the discourse templates of 14:45 item 2 in variants per register (scientific, narrative, presentation, essay).

## Reviewer 2026-11-14 15:15 — for the library's composition mechanisms (provisional): `w.document`, word register, typical ranges

The library lists what it expects to need for compose/summarize (its block 15:15). From here, with the 15:00 round: (1) **`w.document`**, a world schema for a document: title, chapters, sections, paragraphs, slides, sentences with a source wire each; (2) **register of words** in w.lang.en / k.words where sourced and cheap (a frequency band or a formal/informal mark), for lexical choice by genre; (3) **typical ranges** of numeric attributes in k.attributes (so "a number far from the usual" can be computed), at least for the kinds the samples hit. Write them as integration cases for the library (tests it can read in place).

## Reviewer 2026-11-14 15:30 — Q48 answered: joins are checked when their target is there, not when the fact is told

(b) plus a full check on request: a `by=` join stays open while its target's facts are not loaded (lazy loading makes order arbitrary), is checked when a target fact with that key arrives, and `world.check()` reports every join still open (a report, not a refusal). Forwarded to the library. When it releases, declare the 10 `drawing` joins and keep the shared-modules test as a second check.

## Reviewer 2026-11-14 16:10 — 377ee17, 96cbe0d, 2e6ef36 accepted; Q51–Q53 forwarded

Reviewer ran tests/w.lang.ro.test.mjs (8 pass, 1 todo = Q51, 0 fail) and read the dictionary format. Accepted: the canon as one fact with byte-identical output; the first w.lang.ro draft (936 wires, 255 lemmas, 99.5 % / 92.2 % coverage on PSys2's Romanian commands). Q51–Q53 forwarded to the library. Missing senses (italic, horizontal, vertical, bold, numbered, sandy, anterior, thick, thicken): add them to k.words (English senses), not to w.lang.ro.

## Reviewer 2026-11-14 16:30 — sopworld 0.60 has deferred join checks (Q48)

Second worker: pin ≥0.60 and declare the 10 `drawing` joins (`type=k.objects.object by=name`); keep tests/shared-modules.test.mjs as a second check.

## Reviewer 2026-11-14 16:50 — sopworld 0.63 answers Q51–Q53 (its Q40)

Folds and alternations fixed in the library (round trip 2,904/2,904 exact and without diacritics); features accepted; the enclitic article is a noun cell (`{thing:def=yes}`); two irregular facts for one cell are the way to give variants (generate takes the first). For the next w.lang.ro step (whoever is free after the current round): pin ≥0.63, remove the Q52 exception list and the Q51 todo, re-measure coverage without diacritics, write the article into the templates ("am desenat o casă roșie", "mașina este acum galbenă").

## Reviewer 2026-11-14 17:05 — composition round in parallel (owner, 11:28: the library waits for these worlds)

Split across workers, each in its own clone, rebasing often:
- **First worker (skw-worker):** k.interest (done, 5e39ba0), `w.document` (in progress), then the word register mark (15:15 item 2) and the w.lang.ro step of 16:50.
- **Third worker (skw-worker3, new):** `k.genres` and `k.story` (15:00 items 1–2), then the composition procedures in k.procedures (15:00 item 3).
- **Fourth worker (skw-worker4, new):** register and discourse templates and act generation templates in `w.lang.en` (14:45 item 2, 15:00 item 4, 14:15 item 1), then typical numeric ranges in k.attributes (15:15 item 3) and attribute typicality (14:15 item 2).
- **Second worker (skw-worker2):** its current list (07:40, Q45, the drawing joins).
Publish each world as soon as it passes (one commit per world) so the library can start `std.compose` on k.genres/k.story/k.interest while the rest arrives.

## Reviewer 2026-11-14 17:55 — datasets come through PSys2's machine

Your sandbox reaches only package registries and GitHub. When you need a dataset or examples, write it in questions.md tagged **[DATA]** (what, why, size, licence constraints); the reviewer asks PSys2's machine to fetch it into psys2 `data/external/<name>/` with a SOURCE.md and licence, and you read it in place from a psys2 checkout (/tmp/wt2 is the reviewer's; clone your own read-only copy if needed). Already requested: BillSum 200 (summaries), Wikidata typical numbers (CC0), arXiv metadata 2,000 (CC0), UniMorph Romanian (CC-BY-SA), English word frequencies, a permissive short-story set, ConceptNet English relations (CC-BY-SA). Import only what you use, keeping the source licence (share-alike data in its own shard with its licence).

## Reviewer 2026-11-14 18:20 — w.lang.ro needs a syntax/frames layer and a bigger dictionary (PSys2's Q13 measurement)

PSys2 measured the published w.lang.ro (morphology only) on 9,328 Romanian meaning rows: 12.2 % kept by the grammar path (right 81.8 % when it answers). Next w.lang.ro round (first worker, after its current list): (1) **frames and syntax** like w.lang.en's (productions, frames from verbs to k.actions acts with roles, clitic placement, word order, prepositions to roles), compact, same frame vocabulary as English; (2) **a bigger dictionary** derived, not typed: when PSys2 has fetched UniMorph Romanian (CC-BY-SA, psys2 data/external/), classify its lemmas into your paradigm classes by matching their forms (a script; report how many fit a class exactly), keep the sense link empty where unknown, the TSV in its own licence folder; (3) re-measure coverage on psys2 training/eval/ro-en-meaning (read-only).

## Reviewer 2026-11-14 19:00 — [DATA] datasets landed in psys2 `data/external/` (read in place from a psys2 checkout)

- `unimorph-ron` (CC BY-SA 3.0, 2.9 MB): for the w.lang.ro dictionary derivation (18:20 item 2).
- `arxiv-metadata` (CC0, 2.7 MB): scientific-genre moves in abstracts (k.genres).
- `tinystories` (CDLA-Sharing-1.0, 1 MB): check k.story's structure.
- `wordfreq-en` (data CC BY-SA 4.0, 1.5 MB): word register / frequency bands for k.words.
- `conceptnet-en` (CC BY-SA 4.0, 16 MB): candidate facts (UsedFor, CapableOf, HasPrerequisite, HasSubevent, AtLocation, MadeOf), import only with review.
Wikidata typical numbers not yet there. Share-alike data stays in its own shards with its licence.

## Reviewer 2026-11-14 19:20 — Q49 answered (a); k.story accepted; Wikidata numbers landed

**Q49:** (a): a join stays open until a target with *that value* arrives; forwarded to the library as a correction of 0.60 (it was meant so in Q48). Keep the README note and the second check meanwhile. **k.story** (d98a837): reviewer ran its tests (6/6), accepted; **k.genres** (366975e) 7/7, accepted. **[DATA]** `wikidata-typical-numbers` (CC0) is now in psys2 `data/external/` for the fourth worker's typical ranges.

## Reviewer 2026-11-14 19:35 — where the fetched data goes: no new big world, no dozens of small ones (owner asked, 13:18)

Rule: **one home per fact by topic; imported data becomes shards of the world that owns the topic**, with share-alike data in its own shards (own `core.source`, licence file), loaded lazily by the word index like every shard. Data that is an example set, not knowledge, stays a source/evaluation set and only its distilled patterns enter a world.
- `wikidata-typical-numbers` (CC0, 416 KB, 10,878 rows) → typical ranges: per-kind values as shards of k.animals / k.geo (countries, cities) / k.objects or k.space (buildings, structures) / a planets home, and the derived ranges in k.attributes (fourth worker). Not a world "k.wikidata".
- `unimorph-ron` (CC BY-SA, 84,679 forms) → the w.lang.ro dictionary TSV (lemma → class) in its own licence folder; forms are not stored, only lemma + class (first worker).
- `wordfreq-en` (CC BY-SA) → a frequency-band shard of k.words (or w.lang.en) for register, share-alike shard.
- `conceptnet-en` (CC BY-SA, 136,623 assertions) → candidate facts for k.commonsense / k.procedures, imported only after review, filtered to kinds the catalog already has, share-alike shards; expect a few thousand facts, not all.
- `arxiv-metadata`, `tinystories`, BillSum → **evaluation and example sets** (genre moves, story structure checks, summary measurement); not imported as knowledge.
Report per import: rows read, facts written, bytes of the shards, what a typical session loads.

## Reviewer 2026-11-14 19:45 — k.story checked against real stories; decide by the numbers

PSys2 is fetching human-written public-domain tales (Grimm, Andersen, Aesop) into psys2 `data/external/tales-pd/`; TinyStories (synthetic, GPT-generated) is already there. Third worker, after the composition procedures: annotate a sample of each (e.g. 40 tales, 40 TinyStories; by hand or by a documented rule, say which) with k.story's elements and check each constraint: how often it holds, in what order elements appear. Report both columns. Keep a constraint that holds in the human tales; relax or mark soft one that does not; take candidate goals/obstacles/helpers only where they map to existing kinds. TinyStories is used for statistics only, never as a style reference; if it adds nothing over the tales, say so and it can be dropped.

## Reviewer 2026-11-14 20:15 — [FROM PSYS2] w.lang.en frame for the named add with a place verb

PSys2 (questions.md, "catalog frame: place-verb form of the named add with a place"): `acts.make.name.place` ("Add a guest called Ann at table 1.") takes only `acts.verb.make` verbs; `acts.make.name.p` ("Place a guest named Ann.") takes the place verbs with `value=rest`, so "Put a guest named Maria at table 1." names the guest "Maria At Table 1". Add the place-verb variant with a place (`acts.make.name.place` over the place verbs, the name ending before the place preposition), with a test on that sentence; PSys2 deletes its local `patterns.extra.sop` copy when it lands. Fourth worker (w.lang.en templates) after its current item.

## Reviewer 2026-11-14 20:45 — accepted: w.document, k.story vs tales, act and discourse templates, typical ranges

Reviewer ran the tests of w.document, k.story, w.lang.en and k.attributes: 56/56 pass. Accepted 6414cd9, ff0c58f, cb5d6dd, b22ef9b, 4448b9e (and ea39442 k.genres vs arXiv). The library is told to pin them.

## Reviewer 2026-11-14 21:05 — ABSTRACTION ROUND: what the knowledge side must give (owner, 14:45), after the current items

The library builds type-driven reading, alternations once, lexical generalisation, induction from cases and transfer by analogy (its 21:00 block). From here: (1) **selectional restrictions**: the argument types of every k.actions role and of every knowledge relation used in questions (sound of an animal, capital of a country, legs of an animal…), as facts the reader can type-check; (2) **canonical frames only** in w.lang.en: mark which frames are variants that general alternations will cover, so they can be retired after the library lands (do not delete before the curve says so); (3) **k.words coverage** of the words in PSys2's failing paraphrases (psys2 training/eval/failures.jsonl, class `paraphrase:`): every content word should reach a sense; report the misses; (4) **structural descriptions of world schemas** for alignment (each w.* schema says it is "items in slots under constraints", "a whole with parts", "a sequence in time"…), so analogies are computed, not hand-paired; (5) PSys2's old asks: a w.lang.en class of words a request skips (politeness, filler, desire, the copula, reflexives) and the negation/removal words (no, without, never, lose, minus); comparatives `together`/`apart` in k.values.

## Reviewer 2026-11-14 21:20 — second worker's round accepted; AGENTS.md pin line fixed

Accepted af4b6c4, 4c35443, 3e07002, d6c7984, 204d32f, 0a22936, 1dc48e2, d05fd61, 633afae, 7be89c8, 53b002b, 4995e46 (full run 2,964 pass, 0 fail; memory kills rerun alone). AGENTS.md now points at tools/sopworld/VERSION instead of the stale 0.30 line. Library told: `priority` on grammar rules is not read yet. Next for a second worker: publish the drafted `w.chart` (draft in /tmp/w2s/w.chart, key `form`), then the knowledge side of the ABSTRACTION ROUND (21:05 block).

## Reviewer 2026-11-14 21:55 — compositions accepted; the abstraction graph for cousins (owner, 15:03)

Accepted (third worker): 8f51548 five composition methods (28 methods in all; 100 seeded stories hold every hard constraint), ea39442, ff0c58f (tales check: 17 hard / 4 soft; TinyStories adds nothing over the tales — keep it out of imports). Q57 forwarded to the library. Follow-up: switch the four topical methods to the `make` role `about` (53b002b).
**For the library's cousins (layered graph, not a tree):** the knowledge must expose every "up" edge it has, as facts: k.kinds with **several parents** where true (a cow: farm animal, mammal, animal with legs), act families in k.actions, aspects of values, alternation families in w.lang.en (as facts `w.lang.en.alternation`), structure kinds of world schemas (second worker's item 4), argument types of relations (its item 2). Report kinds with a single parent where a second is plain, and kinds with none.

## Reviewer 2026-11-14 22:30 — fourth worker's round accepted; frames that do not read their own examples

Accepted cb5d6dd, b22ef9b, 4448b9e, 585afaf (34 act templates read back 68/68; 116 discourse templates checked against registers; 56 ranges, 143 typicality weights; named-add place frame). **Q56:** a separate type `k.attributes.typical` is fine. **Q54 (yours):** forwarded to the library. Next round for whoever is free (do not start a fourth parallel worker while memory kills are frequent): a general test that **every w.lang.en frame reads its own examples** (and every template its own output), then fix what it finds, starting with `acts.change.add1` / `acts.change.less1` ("Add a seat to table 1"), "take the tables apart" vs move apart, "red house" as a noun compound; and the 28 k.actions roles without a general frame (list in WORLD.md) as frame asks.

## Reviewer 2026-11-14 23:45 — w.chart, act families, word register accepted; TEST SPEED (owner, 16:35)

Reviewer ran tests of w.chart, k.actions, k.words: 23 pass, 1 skipped, 0 fail. Accepted f0254e1, a523fa4, fa8a629.
**Test speed:** the full `npm test` (≈2,950 tests) with several workers is killed by memory and takes long. From now on, per push: `npm run build` + the tests of the worlds the commit touches + the catalog/validate tests (add an npm script `test:changed` that picks them from the changed paths); the full suite once per round (the last push of a worker's round), files run one at a time. Report the 10 slowest test files with seconds; split or shrink any over 30 s.

## Reviewer 2026-11-15 00:05 — for compositions: which keys are narratable, and how each attribute is said

PSys2's first compositions narrate metadata ("Chad has a code of TCD, a formal of Republic of Chad, a code2 of TD") and say every attribute as "has a X of Y". Needed (whoever is free next): (1) a mark on k.* keys that are identifiers or metadata (`narrate=no`: codes, ids, formal names, sources, internal numbers) and a salience per key for compositions; (2) **attribute phrasing templates** in w.lang.en per aspect/key family ("the capital of {country} is {city}", "{animal} eats {food}", "{thing} is {colour}", "{thing} has {n} legs"), checked to read back. Also accepted: 8741e52 (w.lang.ro on 0.63, round trip 2,916/2,916).

## Reviewer 2026-11-15 00:20 — first worker's round accepted

Reviewer ran tests/w.lang.ro.test.mjs on main. Accepted 8d81a16, 5e39ba0, 6414cd9, fa8a629, 8741e52, 19ca312 (UniMorph-derived dictionary: 3,466 lemmas, class fit 82 %, words read on the ro-en-meaning set 75.6 → 81.7 % hand-written, 51.8 → 59.8 % machine; a reading count, not meaning kept). Next round (first worker): `test:changed` npm script + the 10 slowest test files; narratable keys + attribute phrasing (00:05); the general "every frame reads its own examples" test and its fixes (22:30); then the w.lang.ro frames/syntax layer (18:20 item 1). The helper scripts in /tmp/skwscripts belong in the repo's tools/ if they help everyone.

## Reviewer 2026-11-15 00:40 — third worker's round accepted; Q59 answered; move the pin

Accepted 37b83b5, bb61a21 (8,389 up edges over 6 dimensions, licence shards kept), a523fa4 (act families), a52dbec (368 alternation rules, 17 families). Q58 forwarded to the library. **Q59:** (1) yes, part-of and food origin as dimensions (part-of matters for cousins: a wheel → part of a car → other parts of vehicles); (2) no hand copies: `k.kinds.parent` may hold *derived* edges generated at build with `from=` naming the source fact (as now), the source stays the one home; (3) yes, `sense=` on edges of names with two senses. **Pin:** the catalog builds with sopworld 0.63 while the library is at 0.89; move to the current release (one build), delete the test's copy of `normalise`, and run the touched tests.

## Reviewer 2026-11-15 01:20 — second worker's abstraction facts accepted; Q60–Q62

Accepted d9b0de9 (18 argument classes, 919 typed relations), 73c4f2b (k.words coverage: 128 of 138 failing-paraphrase words reach a sense), f85a3af (6 structures, 33 forms of 17 worlds), 9e0e1eb (45 of 352 frames marked as variants). **Q60** forwarded to the library (it decides cardinality/direction/constraint mapping when `alignWorlds` needs them). **Q61:** declared joins are the source: a `joins=<type>` on schema slots, `k.kinds.relation` read from them; the value-share computation stays as a **report** that flags undeclared or broken joins (a test that warns, never one that fails because another world grew). **Q62:** asked PSys2's machine for the US Social Security baby-names data (public domain); it lands in psys2 data/external/.

## Reviewer 2026-11-15 02:00 — pin 0.90 accepted (364c1a4); [LIB] role facts for k.kinds.structure

Accepted 364c1a4 (one build on 0.90, normalise copy deleted). The library (its Q61) accepts the argument/relation/variant formats and asks, per structure role: `refers` (direction), `many` (cardinality), `required`, and constraint facts (capacity, distinct, order) — formats proposed in its worker-log ("answer to Q60"). Third worker, after its current item: add them to k.kinds.structure for the 17 worlds.

## Reviewer 2026-11-15 02:15 — supersenses for type signatures (owner, 18:10)

The library will compute a type signature per word (its 02:15 block). From here, small: every k.words sense carries its **WordNet supersense** (the lexicographer file: noun.animal, noun.artifact, verb.motion, …) if not already, and every closed-class word of w.lang.en its class; report senses without a supersense. Whoever is free first.

## Reviewer 2026-11-15 02:55 — w.lang.en regular inflection rules (from PSys2's thinning audit)

PSys2 keeps its own English `plural` because the regular rules (`w.lang.en.inflect`: -s, -es, -ies, and the verb -s/-ed/-ing) are not published as facts in the std.morph notation; only irregulars are. Publish them (paradigm classes for English nouns and verbs, like w.lang.ro's), with a round-trip test; then PSys2 deletes its plural. Whoever is free first (with the supersenses of 02:15).

## Reviewer 2026-11-15 03:05 — third worker's round accepted

Accepted 364c1a4, 0f0aa59 (part_of 5,156 and origin 148 edges; sense= on 287 edges; 13,698 edges in all), f8a9c5e (pin 0.97; Q65 recorded), 4cdbc09 (role facts and constraints for alignment), 193238c. The library is told the role/constraint facts live on `k.kinds.role` and `k.kinds.constraint`. Next third-worker round: supersenses on k.words senses (02:15) and the English regular inflection rules (02:55).

## Reviewer 2026-11-15 03:20 — knowledge gaps from PSys2's Q15 (≈38 % of the failing paraphrases)

Accepted 27e3ee5 (every frame reads its own example: 333 best, 10 tie, 14 listed), d7fa086 and aba40b2 (declared joins, step 1–2a). Next knowledge items (first free worker): (1) **animal sounds as a typed relation for every k.animals kind** (13/13 sound questions fail even in the original wording) — sourced, with the sound word in k.words; (2) **music notation as typed values** (note names, accidentals, chord and scale names) so "G's major scale" cannot become D; (3) **currency words** as typed values with synonyms (dollar/buck, euro, pound…); (4) drawable shapes for frequent catalog lemmas that have none (ship, cottage, thermometer, arrow: a k.objects drawing or the nearest drawable by k.kinds parent, said as such).

## Reviewer 2026-11-15 03:45 — first worker's round accepted; Q63, Q64

Accepted e5c6497 (test speed: full suite 1,039 → ~380 s, no check dropped; test:changed by import graph), 593e141 (narration marks + phrasing), 27e3ee5 (every frame reads its own example; fixes), 6c46b13 (w.lang.ro frames: hand-written Romanian one-request rows read with the same act and roles 39.9 %, machine Romanian 25.3 %). Note: a push without the tests first is not allowed even when main moves fast; push smaller and run test:changed on the rebased tip. **Q63:** forwarded — the library reads narration and phrasing. **Q64:** general frames for the 29 roles are language knowledge: written **here** from each role's markers; PSys2's 9 failing local frames are fixed **here** and PSys2 deletes its local copies (one home; tell PSys2 in worker-log which ones). Next first-worker round: Q15 knowledge gaps (block 03:20: animal sounds, notation, currency, drawables), then the 29 role frames.

## Reviewer 2026-11-15 04:10 — second worker's joins round accepted; the gaps the exact check found

Accepted d7fa086, aba40b2, b25a030, 016402f, 12f3f52 (166 declared joins in 28 worlds, 97.1 % of 5,564 values meet a target, none broken), 20cdace (2,990 given names, CC0), 9c2ae59, b6b8ba0, 55ff6ea. Q66 forwarded (index the join check; quoted = bare). Next second-worker round, from the report: (1) the 89 k.scenes things with no drawing of that name (map each to a drawing or the nearest drawable parent, marked); (2) the 10 country capitals that are not k.geo cities (add the cities from Natural Earth, keeping its licence); (3) k.units month, decade, century; (4) given names that are also common words (rose, cliff): mark the name reading as needing a person context so the vocabulary does not send common words to the names shard first; (5) the k.objects `of` joins once the library indexes the check.

## Reviewer 2026-11-15 04:40 — DIAGRAM KINDS as knowledge (owner, 19:41)

The owner finds the diagram world dumb ("a random diagram" draws circles; arrangements not understood). Knowledge to write (third worker after its current item, or whoever is free): (1) a world schema **`w.diagram`** (nodes with role and shape, edges with direction and label, groups, layout) aligned with k.kinds.structure (graph, sequence, whole with parts, cycle); (2) **`k.diagrams`**: diagram kinds as facts with sources (flowchart, tree/hierarchy, cycle, timeline, mind map, Venn, org chart, network, process/pipeline, comparison table): their structure, their layout (top-down, left-right, radial, circular, grid), shape conventions (start/end oval, process rectangle, decision diamond, data parallelogram), what knowledge fills each (parts → tree, order → timeline, cycle facts → cycle, procedures → flowchart, kinds → Venn/tree, relations → network); (3) **cycle facts** where sourced (seasons, water cycle, life cycles of frog/butterfly) if the catalog lacks them; (4) arrangement words in w.lang.en (in a circle, in a grid, in a row/column, evenly, left to right, top to bottom) linked to k.layouts.

## Reviewer 2026-11-15 05:25 — naming review (owner, 20:13)

Accepted 2808dc0 (k.music notation), a04b993 (raw-file skip). The library adopts established terms (relatedCases, delexicalise, learnRanking, resolveEllipsis…; HTN for procedures, NLG pipeline for genres/narration/phrasing, structure mapping for k.kinds.structure). In WORLD.md files of k.procedures (HTN methods), k.genres / k.story / k.interest (NLG content determination and document planning; story grammars), k.kinds.structure (structure mapping), w.lang.en alternations (transformations) and templates (surface realisation), name the established concept with one reference each. No renames of world names or types.

## Reviewer 2026-11-15 06:00 — third worker's round accepted; design choices confirmed

Accepted 04b767d, e8c4f0b + d3aaed2 (English inflection: round trip 36,059/36,059), ebb2aa5 (w.diagram, k.diagrams, cycle structure, k.time stages), 7c7738f (58 arrangement phrases), 90265fc. Confirmed: cycles of nature in k.time (the ordering rule applies); closed-class words and irregular-plural copies as derived indexes with `from=`; the w.lang.en dictionary as a TSV folder under WordNet-3.0. Reminder for all workers: a command chain must stop at a failing test (`set -e` or `&&`); twice today main went red for minutes. Library items forwarded (inflectBy irregulars per op; a `read_only` flag in std.morph; `make` refusing a missing required key). Next third-worker round: (1) the diagram edit frames PSys2 measured ("make the arrows go left to right" = layout direction, "call/label the arrow yes" = edge label) in w.lang.en with k.diagrams words; (2) the literature mentions of block 05:25 in the WORLD.md files of k.procedures, k.genres, k.story, k.interest, k.kinds.structure, w.lang.en.

## Reviewer 2026-11-15 07:05 — Q67, Q68 answered; accepted c9572dd, 8f41bae, f45f12c, 9916600, 0b0f1af

**Q67:** (b) — a keyword is not a synonym: move the imported CLDR/OpenMoji/Mulberry keywords to their own relation (`k.objects.keyword` or `core.word … role=keyword`, as the library's word reading supports; ask it in questions.md [LIB] if neither exists), used by hosts only after names and stand-ins fail; the importers write it; a test that no keyword resolves before a name. PSys2 and the library will follow (forward the schema change in worker-log). **Q68:** one home per fact: drop `k.geo.country.currency` and keep `k.units.currency.country`; if a host needs "the currency of a country", it is that join read backwards (derived index with `from=` if a shard is wanted). Accepted: arrow drawn + 20 hand words fixed (c9572dd), given names that are common words marked `context=person` (8f41bae), diagram edit frames (f45f12c), all capitals are cities (9916600), the 89 scene things mapped (0b0f1af).

## Reviewer 2026-11-15 07:15 — first worker's round accepted; next round

Accepted e6d0cc9 (sounds as a typed relation; 123 of 314 animals), a04b993, 2808dc0 (k.music: notes, keys, 90 scales, 209 chords; "G major scale" keeps its tonic), 06b4358 (153 CLDR currencies + slang and minor units), 7855ca2 (29 role frames; 9 PSys2 frames fixed here), c9572dd, c387cc3, 99b3b46 (full run 3,109 pass, 0 fail). Next first-worker round: (1) Q67 (b): keywords as their own relation, importers write it, a test that no keyword wins over a name; (2) Q68: drop `k.geo.country.currency`; (3) sounds for more of the 191 kinds where a source names them (penguin, swan, fox, giraffe, rabbit, …: cite each; leave fish/invertebrates without).

## Reviewer 2026-11-15 07:30 — OWNER DECISION: knowledge asks only when a real row needs them; PSys2's Q17 diagram items

Owner (22:10): priorities from real problems, not synthetic oddities (the animal-sound questions dominated synthetic counts). For this repository: work only on asks backed by a real row (owner logs, live checks, the owner's own complaints — diagrams are one). So: **drop the "more animal sounds" item** (07:15 item 3) unless a real row asks. From PSys2's Q17 (diagrams): (1) `k.diagrams.fill` for the parts of a thing from k.parts (a tree of the parts of a car); (2) ordered sets as timeline fills (planets by distance from k.space) and a few everyday procedures a person asks a flowchart of (making tea, washing hands, planting a seed — sourced or marked own), separate from PSys2's drawing methods; (3) mark which k.procedures methods are user-facing; (9) the words of diagram facts as known words for the speller ("tea" read as "sea").

## Reviewer 2026-11-15 07:45 — third worker's round accepted; two diagram follow-ups (real: the owner's diagram complaint)

Accepted f45f12c (9 diagram frames: layout direction, edge labels, kind-about-topic; 40 requests read back), c7333aa (established terms in six WORLD.md files, with how we differ), fa1cbc7 (full run 3,103 pass, 0 fail). Forwarded to PSys2: the five arrangement rows are read by w.lang.en's layout frame; their failure is PSys2's routing to the avatar. Next (third worker): (1) an order criterion role for `make` ("a timeline of the planets **by distance**", "sorted by size") in k.actions + a w.lang.en frame, joined to the attributes it can sort by; (2) the kind-after-topic form ("draw the planets in order of distance from the sun on a timeline"); (3) single-letter node names ("connect A to C") in the reference reader.

## Reviewer 2026-11-15 08:00 — second worker's round accepted; Q69: move the pin

Accepted 0b0f1af (595/595 scene things meet; drawings 1,081/1,088), 9916600 (262/262 capitals), 1e5c723 (month, decade, century), 8f41bae (context=person by rule; names shard last for such words), 561ec03 (skeleton.of declared; part.of measured). Declared joins 190 in 30 worlds, 99.1 % meet. **Q69:** yes — move the one pin to the library's current release (0.113 or newer), then declare `part.of` (measured 16.3 → 17.6 s on 0.113). Also: the joins report must not suggest enum keys (`context`) as joins.

## Reviewer 2026-11-15 08:15 — real rows for w.lang.ro (PSys2's real set: 77 of 190 real failures are Romanian)

PSys2's real failures (psys2 training/eval/real-failures-2026-11-15.md, real-2026-11-15.jsonl) are led by Romanian turns not read (46) and translation residue (31): "muta crocodilii mai jos", "pune si un lac", "muta capra mai jos", "mai jos, sta pe leagan nu pe el", "muta si mai la stinga", "nu prima casa, cea din mijloc", typos without diacritics ("stinga"). Next w.lang.ro work (first free worker): the words and frames these real turns need (lemmas, relative directions "mai jos / mai la stânga / mai sus", ordinal/set phrases "prima, cea din mijloc, ultima", corrections "nu pe el"), measured on the real Romanian turns (act + roles), not on synthetic sets.

## Reviewer 2026-11-15 08:45 — from PSys2's kids worlds to general worlds (owner, 22:54)

PSys2 will delete its kids.* worlds once general worlds answer their sentences (real rows exist for them: shop, tasks, arithmetic, time questions in the owner logs and the real set). Knowledge side (first free worker): (1) `w.list` with quantity, unit and price items (k.units.currency, k.food) if not already; (2) a `w.tasks` world schema (task, status, due, owner, order) with acts and WORLD.md; (3) colour mixing as rules (k.colours / k.commonsense: red + yellow = orange, sourced or marked own); (4) whatever PSys2's sentence-by-sentence audit lists as missing (it will write [KNOW] asks in its questions.md).

## Reviewer 2026-11-15 09:00 — [LIB] Q69: what limits Romanian on PSys2's real turns (real rows)

The library's `readFrames` (0.115) on 161 real glossed Romanian turns: 93 read by a frame, 74 right act, 38 right act and thing. Missing facts of w.lang.ro (first free worker, real-row work): (1) nouns of the real turns: crocodil, minge, capră, rață, iarbă, fetiță, bunic, vilă, leagăn, masă, pește, pământ, baltă (check the UniMorph-derived dictionary has them with senses; add the senses); (2) "și" meaning "too/also" before the object ("pune și un lac", "mută și mai la stânga") as a skip/focus word; (3) the old spelling î for â ("stînga") as a fold; (4) "mai" + direction ("mai la stânga", "mai în dreapta", "mai jos") as a relative direction phrase. Measure with the library's `tools/bench-ro-frames.mjs` (read-only clone). Accepted: ab3b2ab (keywords as their own relation), ca5d4aa (order criterion), c9864d6 (kind after topic).

## Reviewer 2026-11-15 09:15 — third worker's round accepted; Q69 assigned

Accepted ca5d4aa (order criterion), c9864d6 (kind after topic), 009dc3f (single-letter names), a1d1d11 (full suite 3,110 pass, 0 fail) and 4719034 (Q68: k.geo.country.currency dropped; reviewer ran k.geo, import.psys2, k.units and questions tests: 463 pass, 0 fail). Open answers: keep the capital-letter rule; "link A with D" (tool outranks target) is noted, not changed now; layout vs diagram for "put the parts in a tree" is the host's choice. Q69 (block 09:00) goes to the third worker; measure with the library's bench-ro-frames.mjs before and after.

## Reviewer 2026-11-15 09:20 — PSys2 Q18 [KNOW] (kids audit, real rows); Q70 answered

PSys2's audit (`docs/kids-generalisation-plan.md` in psys2, questions.md Q18) replaces the 08:45 block's items (1)–(3) with exact asks. Real rows first (owner decision 22:10); every item names the real rows it must make right.
- **K1 `w.list`** world schema: list (name, kind shopping / to-do / any); entry (item typed by k.food / k.objects / free text, quantity, unit from k.units, price as a k.units quantity with a currency, status, order, list). Real: r0598, r0599, r0622–r0627.
- **K2 `w.tasks`** world schema: task (text, status open/done, due, owner, order, list, reminder); "done" a state that acts change. Real: r0590.
- **K6 act frames for lists, tasks and the wallet** in w.lang.en, bound to K1/K2 acts ("add X to my list", "take X off my list", "is X on my list", "what is left to do", "I finished X", "set a reminder to X", "how much do N X cost", "can I buy N X", "what is the change", "I start with N lei", "how much money is left"). Real: r0590, r0598, r0599, r0622–r0627.
- **K3 conversation frames** (greet, thank, bye, introduce "my name is X" / "you can call me X", ask own name, ask who the assistant is, how are you) in w.lang.en. Real: r0148, r0166, r0216, r0588–r0612 (thanks ×8), r0630.
- **K4 arithmetic words and frames** in w.lang.en: operators to core.calc names (plus, minus, times, divided by, double, half, twice, "share N between M"), comparisons (N more / fewer than, N times as many as), aggregates (in total, altogether), "left", "at first"; frames "what is N op M", "how many X does O have", "who has the most X", "how many more X than". Real: r0194, r0195, r0201, r0543.
- **K5 typed possession effects on k.actions**: `holds=add|remove|give|set` and `money=add|remove` for find, get, receive, buy, lose, eat, break, give, spend, pay, get back, fly away / leave, hold, have (the free-text `result` stays as the gloss). The library's storyState takes its verbs from these. Real: r0194, r0195, r0201, r0542.
- **K7 clock and calendar words**: o'clock, half past, quarter past / to, half an hour, noon, midnight as values of k.time; frames that state the date ("today is X", "we are in X", "the clock says X"). Real: r0586.
- **K10 question frames in other word orders** over existing facts ("how many legs has a cow", "April has how many days", "which months are in summer"). Real: r0244.
- K8 (shapes / colours of things) and K9 (pets) are not real: later. The black + red colour conflict is the host's taught tier, no catalog change.
Order: K1+K2+K6 (fourth worker, now), K5+K4 (next free worker, the library needs K5 for L1), K3, K7, K10.

**Q70 answer:** keep keywords as the dedicated type `k.objects.keyword` (one home, read last by hosts after names, words and stand-ins). No library relation unless a real row needs one.

## Reviewer 2026-11-15 09:50 — OWNER: overnight ARCHITECTURE REVIEW (knowledge); Q69 item 1 accepted

Accepted 54b88fa (14 Romanian nouns with senses; real turns act+thing 38 → 55 of 161, worker's bench) and 0801bbc (pin to 0.113). Owner (23:40): review the architecture in all three zones, fix every mistake, unify, generalise, widen the general knowledge; work all night. A review agent of mine is reading this repository (/tmp/review-know.md); its findings become numbered tasks here. Every worker, when its current round ends, takes the next unowned item and writes its part of `docs/architecture-review-2026-11-15.md`:
- A. Facts with two homes (attributes, words, parts, currencies were one): find the rest, keep one.
- B. One schema convention across worlds (names of keys for name/label, is_a, quantity + unit, source, licence); list and fix departures.
- C. Undeclared joins and free text that should be typed.
- D. Mechanism in tools/ (the reference reader, lang-en.mjs rules) that should be facts or the library's job: [LIB] asks.
- E. Coverage: general knowledge the demo's worlds need next (lists, tasks, time, arithmetic, shapes and outlines of objects for arrangements, everyday procedures), then what other applications would need; widen by import with clean licences ([DATA] asks to DGX).
- F. Real case tonight (owner): "a diagram in the shape of a house" drew one circle. Knowledge side: outlines of k.objects drawings as ordered point paths usable as arrangement shapes (house, star, heart, tree, arrow …), and the frames "in the shape of X" / "shaped like X" / "X-shaped" in w.lang.en and w.lang.ro.

## Reviewer 2026-11-15 10:50 — ARCHITECTURE REVIEW findings (36): `reviews/architecture-review-2026-11-15-reviewer.md`; Q69 item 2 and Q17 fills accepted

Accepted e0b67e7 ("și" as focus; real turns 100 / 83 / 63 of 161), a4b31f4, 66e839f (parts as a tree, ordered sets as timelines, everyday procedures as flowcharts). The review agent's file is committed (7 serious, 23 structural, 6 cosmetic; path:line and a fix each). I checked in the tree: test-run.mjs:144-156 logs `ok` for a file killed five times; Oranjestad and The Bottom are `capital_of` Caribbean Netherlands in two shards; UniMorph is in neither LICENSES.md nor index.json; AGENTS.md and PLAN.md allowed NC (I corrected both lines in this commit: NC is never imported). Tasks, in order:

**KR1 (serious, a fifth worker starts now):** (1) the runner fails a file that was killed on every try or ran 0 tests; make `derived.test.mjs` run (it was killed 5 times and shown ok) by splitting it or cutting its load; (2) capitals: one home (`country.capital`; `city.capital_of` derived or dropped), the two wrong Caribbean Netherlands facts gone, a test that a country has one capital unless the source says otherwise; (3) size: one home (metres in k.attributes; the k.scenes size class derived from it), the 8 conflicts resolved by the source; (4) `material` / `made_of` and "can move" / "can drive": one key and one value set, k.commonsense or k.attributes as the home, the other joins; (5) the time-of-day join: k.scenes and k.attributes use k.time's parts of the day (`day` becomes a k.time value or is renamed); (6) licence: UniMorph in index.json and LICENSES.md; an allowlist in tools/validate.mjs (CC0, MIT, BSD, Apache, MPL, WordNet, CC BY, ODbL, CC BY-SA, CDLA; anything else fails), with the share-alike shards checked to be in their own folders.
**KR2 (one home per idea):** colours (k.colours; k.values joins), shapes (k.shapes; four vocabularies today), number words (w.lang.en), verb forms (w.lang.en inflection; k.words and k.actions join; the English rule in tools/actions-core.mjs goes). Enums joined, not copied (11 basic colours ×6, 12 senses ×4, season, weather, age, the k.diagrams / w.diagram enums); declare the undeclared joins that meet 100 %.
**KR3 (language out of neutral worlds):** k.feelings replies, the `why` texts of deny rules, k.values word lists and `core.word` blocks of the 40 worlds: English wording lives in w.lang.en (or a per-world `lang.en` shard that w.lang.en owns), so a second language adds one shard and no world changes. Romanian in tools/lang-ro-core.mjs and lang-ro-frames.mjs becomes data of w.lang.ro. AGENTS.md rule 2 is reworded (English is the language of ids and keys; words of any language live in its language world).
**KR4 (mechanism out):** tools/lib/lang-en.mjs and tools/lib/choose.mjs re-implement library exports; the 9 tests that check the local copies run on the pinned library instead; what the library lacks is a [LIB] question with the case. Facts in `*-data.mjs` tables move to hand-written shards (the shard is the home; generators only derive).
**KR5 (tests, docs):** k.objects loaded once and shared (four files pay 44 s each); the triple "every drawing names an object" check kept once; freshness tests for objects-hand, lang-en-core, lang-en-discourse; counts in README and WORLD.md generated, not typed.
**KR6 (coverage, real rows first, then general):** usual colour, material and abilities for the 1,500 common things (82 %, 73 %, 77 % missing) by import with clean licences ([DATA] asks); which chart fits which data; time zones and dates; administrative regions; plus the 09:20 items (K5+K4, K3, K7, K10) and the outlines of objects as arrangement paths (09:50 F).

## Reviewer 2026-11-15 10:55 — [PSYS2] Q19: `w.person` (30 real turns)

Q19 accepted (PSys2): a general person/session profile. The deleted Profile tab carried 30 real turns ("I have two kids", "I like cats, dogs and horses", "what do you know about me", "I am 40", "my name is …"). Next free worker, before K3: a `w.person` world schema on k.people (name, age, family members with relation and count, likes / dislikes as typed relations over catalog kinds, occupation, language), and w.lang.en frames for first-person statements ("I have two kids", "I am 40", "I like X, Y and Z", "my name is X") and questions about the user ("what do you know about me", "how many kids do I have", "how old am I"). Statements, not acts: the frames carry mood=declarative. K3 (introduce, ask own name) binds to the same schema.

## Reviewer 2026-11-15 11:55 — accepted: runner, capitals, w.list v3, w.tasks, list/shop frames, î fold, diagram topics

Reviewer ran k.geo (8 pass) and w.schemas tests, and checked the runner now fails a file with 0 tests. Accepted 704d9f5 (KR1 item 1), the capitals commit (KR1 item 2), c35b5b1 (w.list v3 with prices and money), 297e8ef (w.tasks), the list / task / shop / wallet frames (K6), the î → â stem folds (Q69 item 3) and 922a864 (k.diagrams.topic, 3,045 topics, one shard per licence). The queue for a worker that ends its round is unchanged, in order: w.person (10:55), K5 + K4, outlines of objects as arrangement paths + "in the shape of X" frames (the owner's diagram case, 09:50 F), K3, K7, K10, KR2 … KR6. Say in worker-log which item you took, before starting, so two workers do not take the same.

## Reviewer 2026-11-15 12:10 — correction to 11:55; restart

My mistake: the 11:55 block accepted four commits that were only in workers' clones, not on main: capitals (skw-worker5), K6 frames 5d9615c (skw-worker4), î fold 1bb153d (skw-worker3) and part.of 8df2d5d (skw-worker2). They are accepted when they are on main and their tests pass here. An environment restart stopped all five workers at 00:40 UTC; each is resumed with its unpushed commit. Assignments now: skw-worker w.person + outlines as arrangement paths; skw-worker2 push part.of, then K5 + K4; skw-worker3 push the fold, Q69 item 4, then K3 + K7; skw-worker4 push K6, then K10 + KR2; skw-worker5 KR1 items 2–6.

## Reviewer 2026-11-15 12:30 — on main and accepted: K6 frames, î fold, K10; Q71 answered

Reviewer ran list-frames, question-frames and w.lang.ro tests on main: 19 pass. Accepted 974cbd9 (K6: 31 frames, real rows 9 of 9 by the reference reader), b6b0f1d (î → â folds), 9cce8e1 (K10 word orders, r0244). Capitals (skw-worker5) and part.of (skw-worker2) are still not on main.
**Q71:** (1) The wallet: money a person has is a quantity changed by events, so its home is the story state / the person (library L1, `money=` effects of K5), not a list. A shopping list keeps only `budget` as a planned limit; `tendered` goes (paying is an event); the frames keep their readings and name the moved key. (2) Keep `n` in every w.* schema, with the words order, position, place. (3) Clause splitting is the library's: forwarded as [LIB] (its one splitter reads `w.lang.en.joiner` and `w.lang.en.wh`); `clauseReader` in tools/ stays as the reference until the library's passes the same rows, then goes (KR4). (4) Not by priority. Typed slots and specificity decide: the item of `acts.shop.price.of` must be a thing or a list entry, so "7 plus 5" does not fit it and the arithmetic frame (number, operator, number) reads; "I should tell you something" is read by the K3 frame because it has more literal words. If a case is left where two frames fit equally, write it with the row; a priority number is the last resort and needs a comment saying why types could not decide.

## Reviewer 2026-11-15 12:55 — part.of accepted on main

Reviewer ran tests/k.objects.names.test.mjs on main: 6 pass. Accepted f15117d (`k.objects.part.of` declared, 2,212 of 2,212 meet). The library (0.126) is pinned at b20eeeb and reads w.list v3: its `listSums` gives total, change, short and left; when Q71 (1) moves `tendered` out of the list, say so in questions.md as [LIB] with the old and new key. Capitals (skw-worker5) is still not on main.

## Reviewer 2026-11-15 13:15 — Q69 item 4 and joins report accepted; [PSYS2] Q20 / Q21 asks

Reviewer ran tests/w.lang.ro.test.mjs on main (see counts in the commit). Accepted f489a55 ("mai" + direction as a relative move) and fea0fec (joins report without enum keys: 116 → 50 suggestions). Q69 is complete: skw-worker3 reports the final bench numbers and takes K3 + K7. New asks from PSys2 (its questions.md Q20, Q21), for the next free workers after the current queue items, real rows first:
- **Sensitivity of drawable things** (real: the owner got the chip "Add a weapon." after a sunny scene): a key on k.kinds that reaches every world, e.g. `sensitive=weapon|violence|…`, derived from WordNet (everything under weapon.n.01, firearm, explosive device …) by a generator with a freshness test; hosts leave such things out of suggestions and random choices by default. Goes with KR6.
- **`w.lang.en.fn` with views** (filler, politeness, desire/wish, hesitation: please, pls, just, um, kindly, want, would like, need, wanna, "i mean"): about 30 hand-written lists in the host become one read; the library's `moodOf` needs the wish verbs (its L2). Goes with KR3.
- **Irregular plurals** of every k.objects / k.animals noun in `w.lang.en.irregular` (the host has ~45 plural rules that disagree; "bus" → "bu" in four). Goes with KR2 (verb forms / inflection have one home).
- **`k.scenes.next`** (optional): a typed "goes with" relation to rank next things; later.

## Reviewer 2026-11-15 13:35 — KR1 accepted on main (all six serious findings); Q72–Q75 answered

Reviewer ran k.geo, k.scenes, test-run and k.commonsense.rules tests on main: 29 pass; no told `capital_of` for Caribbean Netherlands except the derived Kralendijk. Accepted 704d9f5, 11fbb69, 6535d9b, ffecb9d, 1f41082, e3b81a1. The commit trailer names the model that wrote the commit: a worker on Opus 5.5 signs as Opus 5.5 (correct as done).
**Q75:** the country list decides the capital. A seat of government that differs (La Paz, The Hague) is a different fact: a key `seat_of_government` on the country when a source gives it; not a second capital. Low priority. **Q72:** forwarded to PSys2 and the library as a rename note. **Q73:** yes, `k.space.kind.made_of` becomes `material` with the same value set where the values are materials (KR2, fourth worker). **Q74:** (1) Unicode-3.0 is a permissive licence: add it to the allowlist, not pending. (2) One licence per file is the rule for SOP shards; no move to folders.
Next for the fifth worker: (a) the **sensitivity key** on k.kinds (block 13:15, real: "Add a weapon." chip), derived from WordNet with a freshness test; (b) **KR5** (k.objects loaded once and shared by the four test files, the triple drawing-name check kept once, freshness tests for objects-hand, lang-en-core, lang-en-discourse, counts in README and WORLD.md generated); (c) a full `npm run test:all` on main at the end, with every file that is "not run" named.

## Reviewer 2026-11-15 13:50 — sensitivity key accepted

Reviewer ran tests/k.kinds.sensitive.test.mjs on main: 11 pass. Accepted 690baaf (`k.kinds.sensitivity`: 86 words; weapon, drug, alcohol, tobacco; knife, axe, hammer not marked). Q76 forwarded to PSys2. Four workers each hold one unpushed commit (skw-worker, 2, 3, 4): push by the rule with a fetch just before the push; a commit that sits unpushed for an hour is lost work when the environment restarts.

## Reviewer 2026-11-15 14:10 — KR5 on main; push rule changed (five workers, two cores)

db16219 (KR5) is on main; its acceptance waits for the fifth worker's full suite. Four finished commits have sat unpushed for one to two hours (w.person, K5, K7, KR2 step 1) because five `test:changed` runs fight for two cores and main moves under each. New push rule, for every worker, from now:
1. Before committing: run the tests of the files YOUR commit touches (`node tools/test-run.mjs <files>` or the test files named after the worlds you changed), plus `tests/catalog.test.mjs` and validate when you changed a schema or an index.
2. To push: `git fetch && git rebase origin/main`; if the incoming commits touch files or worlds yours touches, rerun step 1's tests; if not, push at once: `git push origin HEAD:main && git fetch && git rev-list --count origin/main..HEAD` (0).
3. No full `test:changed` loop before a push. The fifth worker runs `npm run test:all` on main at the end of each of its rounds and reports any red file with the commit that caused it; the author fixes it first thing.
Push the four waiting commits now, in this order to avoid races: skw-worker (w.person), skw-worker2 (K5), skw-worker3 (K7), skw-worker4 (KR2 step 1).

## Reviewer 2026-11-15 14:25 — on main and accepted: K5, K7, K3, Q69 complete; next for the third worker

Reviewer ran k.actions, k.time, talk-frames and time-frames tests on main: 18 pass, 1 skipped (waits for w.person). Accepted ba96aad (K5 typed possession effects), 6e1ad74 (K7 clock and calendar words, r0586), 0188a7b (K3 greet / thank / farewell, 11 real rows). Q69 final bench (worker, library's bench): 104 read / 83 act / 64 act + thing of 161 (from 93 / 74 / 38). Confirmed: greet, thank and farewell are acts of k.actions (dialogue acts in the DAMSL / ISO 24617-2 sense; mark them `class=dialogue` so hosts can tell them from acts on things). The three bench scoring faults go to the library as [LIB].
Third worker, next: (1) the two Romanian shapes still unread on real turns: "fa si o fetita" (focus word before the thing in the make frame) and two directions in one turn ("mai la stânga și mai jos"); (2) **Romanian reply templates** in w.lang.ro (real: the owner read "6 nod-zi pe schița sa, s-a alăturat în ordine" from the machine translator): the templates and morphology a host needs to compose its own replies in Romanian — made / added / moved / removed / changed N things (count agreement, plural of the thing, gender agreement of the adjective), "in the shape of a X", not-understood naming the unread words, did-you-mean; informal singular, first person; mirror the English act and discourse templates one to one so a host picks by language; (3) **KR3**: English wording out of the language-neutral worlds (k.feelings replies, deny-rule `why` texts, k.values word lists, `core.word` blocks) into w.lang.en-owned shards, `w.lang.en.fn` with views (filler, politeness, wish, hesitation), Romanian in tools/lang-ro-*.mjs as data of w.lang.ro, AGENTS.md rule 2 reworded. Small commits, each pushed by the 14:10 rule.

## Reviewer 2026-11-15 14:45 — KR2 step 1 accepted; colours: one home decided

Accepted 1646850 (enums joined, not copied: declared joins 196 → 220, 0 broken) and the K10 frames. **Colour names:** `k.colours` is the home of every colour name with its value (the 171 of k.values.colour move there, with their source and licence); the 11 basic colour terms (Berlin and Kay) carry `basic=true`; a slot that wants only basic colours joins the `basic` view. k.values.colour goes. The copied value lists on the w.* colour, shape and direction slots stay until the library can refuse a value that meets no join target (asked as [LIB] `strict` joins); the join is declared now, the list is deleted then. Fourth worker, next, one small commit each: colours as above, shapes to k.shapes, number words and verb forms + irregular plurals of every k.objects / k.animals noun into w.lang.en, `k.space.kind.made_of` → `material`. Note: two questions carry the number Q76 (sensitivity note, colour home): the colour one is answered here.

## Reviewer 2026-11-15 15:00 — K4 accepted on main; second worker: pin to the current library, KR4

Reviewer ran k.actions.effects and the arithmetic tests on main: 6 pass. Accepted 8f3b35f (K4: 48 calculation words, 9 question frames, 19 of 19 requests), and noted on main: 705b8fe (w.list v4, `tendered` out), fe48255 (the two Romanian shapes), 76251ee (class=dialogue). Answers: the joins report folds a quoted name and the same bare name as the engine does (your own tool: do it); `holds` and `money` are machinery: narrate=no.
Second worker, next: (1) **move the pin to the library's current release** (0.130 or newer; the pin is 0.113 and the library has since unified its readers, `choose`, the kit, `listSums`, storyState on real word problems): no test may change behaviour silently — list every test that changes and why; (2) **KR4** on the new pin: tools/lib/lang-en.mjs and tools/lib/choose.mjs re-implement library exports — the 9 tests that check the local copies run on the pinned library instead (readFrames / readText / realise / inflectBy / solveChoices), and what the library lacks is a [LIB] question with the failing case; the `clauseReader` stays until the library's `clauses()` passes the list-frames rows; (3) facts in `*-data.mjs` tables move to hand-written shards (start with tools/actions-data.mjs: the shard is the home, generators only derive), one table per commit.

## Reviewer 2026-11-15 15:15 — [PSYS2] Q25: Romanian reply and request templates; generated files and rebases

For the third worker (already on Romanian reply templates, block 14:25 item 2): PSys2 now composes replies in Romanian from `w.lang.ro.template act= text=` with roles realised by morphology, and keeps three templates and a lemma in a local file until the catalog has them (psys2 questions.md Q25, read it): `diagram.shaped`, `diagram.shaped.placed`, `draw.scene`; wanted: these, a count frame (`{n} {noun:num=pl}` with "de" from 20, `un` / `o` agreeing for one), lemmas with senses (nod, diagramă, contur, scenă), **request templates** per act (`act=change mode=request`: "schimbă culoarea {thing:def=yes} în {colour}", remove, ask attribute …) so suggestion chips are composed, and a template per act family for acknowledgements (added, drew, connected, moved, removed, not understood). Use PSys2's key shape (`w.lang.ro.template act= mode= text=` with `{role:num=,case=,def=}`) unless the English templates already fix another: one shape for both languages.
For the fifth worker, with KR5: the first worker's w.person commit has been rebased for two hours because generated files (index.json, COVERAGE.md, vocab.json, vocab-kinds.json, JOINS-REPORT.md, README counts) conflict on every rebase. Make them not conflict: either they leave git and are built in CI / by `tools/sync.sh` before publish, or a merge rule regenerates them (`.gitattributes` merge driver or sync.sh as the documented step) — choose the one that keeps the published site correct, document it in AGENTS.md, and tell every worker in worker-log.

## Reviewer 2026-11-15 15:35 — w.person and outlines accepted on main; sync.sh loses changes (serious)

Reviewer ran w.person, k.layouts and k.layouts.outlines tests on main: 15 pass, 1 skipped (arrange waits for the pin). Accepted 4d70c88 (w.person: person, relative with relation and count, taste typed by the catalog; `mood` on frames; 16 person frames; 28 turns read back) and baacdad (50 outlines in k.layouts: 17 shapes, 33 drawing silhouettes by licence; `outline` layout, `arrangement` role, "in the shape of X" frames).
**Serious, found by the first worker and confirmed in tools/sync.sh:27:** on a conflict in a file that is not generated, sync.sh takes main's side (`checkout --ours` during a rebase) and goes on: a worker's change is dropped silently (it dropped the w.person build step from package.json). Fifth worker, first, before the generated-files task of 15:15: sync.sh never chooses a side for a hand-written file — it stops with the list of conflicted files; only generated files are regenerated; a test with a toy repository shows a hand-written conflict stops the script. Every worker: after a rebase that went through sync.sh, check `git show --stat HEAD` against what your commit changed before pushing; look back at your own rebased commits of tonight for a lost change and say so in worker-log.
First worker, next: **KR6 coverage** — usual colour, material and abilities for the 1,500 common things (82 %, 73 %, 77 % missing): what derives from sources already in data (WordNet glosses and relations, ConceptNet if its importer can run on a local copy, Wikidata `made from material` / `color` if fetched) with clean licences and an audit sample of 50 per attribute checked by hand; what needs new data is a [DATA] ask to DGX in questions.md (source, licence, size, the columns wanted). Then: which chart fits which data (k.charts selection rules, from the visualisation literature: Mackinlay's expressiveness / effectiveness, Cleveland and McGill's ranking), time zones and dates.

## Reviewer 2026-11-15 15:55 — accepted on main: Romanian reply and request templates, w.lang.en.fn, colours in k.colours

Reviewer ran the ten touched test files on main: 59 pass, 0 fail. Accepted fd5a13b (w.lang.ro request templates mirroring w.lang.en's 42 act templates, replies in both languages under the same 15 names, CLDR plural classes: "Am desenat o casă." / "3 case" / "20 de case"), 7e31925 (`w.lang.en.fn`: 61 function words by view), ccf47d7 (k.colours the home of every colour name; k.values.colour gone). The first worker checked tonight's commits for changes lost by sync.sh: none left. Third worker continues KR3 (English wording out of neutral worlds; Romanian in tools/ as data) and adds the `fn` views for w.lang.ro; fourth worker continues KR2 (shapes, number words, verb forms + irregular plurals, k.space material).

## Reviewer 2026-11-15 16:10 — main is red on k.kinds.relations (my acceptance missed it); Q78 answered

**Red on main:** tests/k.kinds.relations.test.mjs fails ("make.arrangement holds arrangement": no argument class in k.kinds), from baacdad's new `arrangement` role. I accepted that commit on its own tests; the cross-world test was not among them. The first worker fixes it now. Rule added to 14:10: a change to k.actions roles, to a schema's keys or to a declared join also runs the k.kinds tests (relations, joins-report) and tests/catalog.test.mjs; the fifth worker's full suite on main stays the net.
Third worker's round accepted on main (the two Romanian shapes, class=dialogue, fn, k.feelings replies moved to `w.lang.en.feeling_reply`, AGENTS.md rule 2). **Q78:** (1) yes: one words shard per world owned by the language world (`w.lang.en` words of world X in a shard named after X; a second language adds its own shard of the same shape; build-catalog reads words from there; vocab.json is built from them). Do it world by world, the vocab.json diff empty at each step except for ordering; start with three small worlds and report the diff before the other 37. (2) forwarded as [LIB]: an issue carries the rule's bindings, so a host or the language world can word the `why`; until then the 17 texts stay in the rules. Then Romanian data out of tools/lang-ro-*.mjs into w.lang.ro shards, and `fn` views for w.lang.ro (și, te rog, vreau, aș vrea, păi, ăă …) with the real Romanian turns as the test.

## Reviewer 2026-11-15 16:45 — accepted: sync.sh, generated files, lost-change check, KR5, full suite, KR2 parts, w.lang.ro.fn; two red tests

Reviewer ran sync and colours-shapes tests on main (pass) and confirmed two red tests from baacdad: w.lang.en.arrangement (no phrase for the `outline` arrangement) and w.lang.en.templates (the arrangement role has no template). The first worker fixes them first. Accepted on main: cdb83d7 (sync.sh stops on a hand-written conflict), 363d321 (128 generated paths with a merge driver, logs `union`), 12fa83b (lost-change check of 138 commits: one loss found and restored, K7's build step), db16219 (KR5: k.objects view 51 → 8.6 s; five heavy files 4.6–24 s; generator freshness tests; counts generated), the full suite at db16219 (3,131 pass, 0 fail, 20 skipped, 631 s; one file over 30 s), 705b8fe, ccf47d7, 2a3edf3 (shapes: k.values.shape gone), a5f7da2 (k.space material), 77f1294 (catalog plurals: 1,356 of 1,362 head nouns read both ways), eb4b83e (w.lang.ro.fn).
**[LIB] from the library (its Q79):** the plural rules of each language as facts: `w.lang.ro.count class= rule=` (one: `i = 1 and v = 0`; few: `v != 0 or n = 0 or n % 100 = 2..19`) and `w.lang.en.count` (one: `i = 1 and v = 0`), CLDR rule syntax, source CLDR (Unicode licence, on the allowlist); a kind's word in each language (w.seating.table → "table" / "masă") so a host needs no `wordOf`; reply facts with the article chosen by gender from `w.lang.ro.det` rather than a role the caller gives. Third worker, with the Romanian data move.
**Next:** fifth worker — `npm run test:all` on main now and after each hour; tests/questions.test.mjs under 30 s; then help KR6 (abilities for the common things from WordNet / k.actions). Fourth worker — number words into w.lang.en; verb forms after the second worker's pin move (check each form with the library's `inflectBy` before deleting); two plurals per singular: allow `plural` to repeat with `register=classical|common` (your Q79) and ask the library as [LIB] only if its reader cannot take it.

## Reviewer 2026-11-15 17:15 — accepted on main; Q80 [DATA] forwarded; abilities: error rate

The two red tests of 16:45 are green (reviewer ran them: 11 pass). Accepted on main: c3403b8 (phrases and templates for the arrangement role), e0b6238 (`w.lang.en.count`, `w.lang.ro.count` with CLDR rules), ea17cf5 (article by gender in the Romanian templates), d76b239 (the Romanian word of each kind of the 10 published schemas), 085bc0d (two plurals with a register), 58dbc95 (questions test under 30 s; Q81 the red-file record), 40b2c2b, f4fcb4f (KR6 from glosses: 66 things, each value hand-checked), 7904ce4 (abilities for 56 things). Q81's third red file (generators: core-plurals stale after 77f1294, `ax/axes`): fourth worker, regenerate and push now if not done.
**KR6 quality bar:** the hand check found 11.7 % wrong among proposed abilities and 14–23 % among gloss values; only the checked values were written, which is right. Derived knowledge that is not checked by hand value by value is not published unless its sampled error rate is under 5 %; say the rate in the shard header (`core.note`), and keep the audit file.
**Q80 [DATA]** forwarded to DGX (PSys2 worker-tasks): Wikidata colour / material / use for items with a WordNet 3.1 synset id (CC0), ConceptNet 5.7 English CapableOf / MadeOf / HasProperty / UsedFor (CC BY-SA 4.0, own shard), Visual Genome attributes (CC BY 4.0). They arrive in psys2 `data/external/<name>/` with a SOURCE.md. Until then the first worker does chart selection rules and time zones.

## Reviewer 2026-11-15 17:35 — fourth worker's round accepted; Q82 (seating v3): yes

Reviewer ran tests/w.lang.en.forms.test.mjs on main (pass). Accepted 3e9aa5a (number words only in w.lang.en; k.values.number gone), 085bc0d (all 1,362 catalog head nouns read both ways), 26ddd3f (verb forms: 1,459 of 1,507 in k.words and 569 of 570 in k.actions confirmed by the pinned library and dropped; the English rule in tools/actions-core.mjs gone; FORMS-REPORT.md for the 48 left). The pin is at 0.130 (second worker).
**Q82: yes, build w.seating version 3** as proposed (a guest has `table` and an optional `seat`; a capacity that counts guests per table; a guest's seat is at the guest's table; no schema default for seats; `colour` on table and guest joined to k.colours; `needs` a list), with the frames "add a guest called X at table N", "make table N blue", "add a table for N", and their Romanian mirrors; the library's examples/seating-app.mjs lists exactly these as refused today. A [PSYS2] note with the differences left, if any. Then the same reading for **w.timeline** against PSys2's worlds/plan.timeline/schema.host.sop.
**Red:** question at-07 "which things are usually pink" fails on main since the KR6 glosses commit f4fcb4f added rhubarb: first worker, fix the expectation or the fact (rhubarb stalks are pink-red: decide by the source) and run tests/questions.test.mjs before pushing a k.attributes change from now on.

## Reviewer 2026-11-15 17:55 — accepted: chart selection rules, KR4 step 1, words shards; [PSYS2] Q27 words; reply names for the kit

Accepted on main: 86d4b5c (k.charts: 9 kinds, 14 encodings in 4 rankings, Cleveland and McGill 1984, Mackinlay 1986; reviewer ran its tests), 519d0bf (KR4 step 1: `articleFor` is the library's; the same article for 8,886 nouns), the words shards of k.body, k.colours, k.commonsense (vocab.json byte-identical each). The library has strict joins since 0.138 (`core.slot by= strict=true`): when the pin moves there, the copied value lists on the joined colour / shape / direction slots go (KR2's last step, fourth worker).
**[PSYS2] Q27** (psys2 questions.md): 24 English words its deleted reader route knew and the catalog lacks, with the act each meant: alphabetise / alphabetize (sort), beautify, declutter, neaten (improve / tidy), condense, respace, equalise / equalize / normalize / unify, recenter / recentre (fit), uncross (untangle), checkboxes, unfinished, cursor, stats, wordcount, deactivate, unmute, handsfree, compute, everybody. As w.lang.en lemmas with inflections (British / American as one lemma with two spellings) and as verbs of the act where k.actions has it. Third worker, after the words shards.
**Reply names the library's kit still says in English** (PSys2's probe): the question for a missing required key ("What name?"), no such thing ("There is no 4 here."), a value a slot cannot take ("A table cannot be square."), nothing to undo, a statement is not a request, shall I make it. Add them to `w.lang.en.reply` and `w.lang.ro.reply` under the same names (the library will say which names it reads). Third worker.

## Reviewer 2026-11-15 18:10 — fifth worker's round accepted; main red in four files (Q86); the lighter push rule needs its net

Accepted: two full-suite runs with each red file bisected to its commit, tests/questions.test.mjs at 22 s, KR6 abilities (137 proposals all hand-checked, 16 wrong, 121 written for 56 things; and the right remark that for things that do nothing by themselves `used_for` is the attribute, so COVERAGE counts `can` only where it applies — make COVERAGE say that).
**Red on main (Q86):** k.actions.effects and k.words.paraphrase from 26ddd3f (fourth worker, told); questions at-07 and a crashing k.attributes.glosses test from f4fcb4f (first worker, told). I accepted both commits on their own tests: the 14:10 rule lets a deletion or a new fact break a reader elsewhere. Addition to the rule: **a commit that deletes or moves facts of a world, or adds facts that questions may list, runs every test file that names that world's types** (`grep -l "<world>\." tests/*.test.mjs`) and tests/questions.test.mjs. The fifth worker keeps the hourly full suite and writes the red files with their commits; an author fixes a red file before any other work. After a rebase, rebuild the generated catalog files (the merge driver keeps main's side): `npm run regenerate` or tools/sync.sh, in every worker's push script.
Fifth worker, next: hourly full suite; `used_for` for the common things that do nothing by themselves, by the same method (k.actions instruments / objects of use, WordNet, each value hand-checked, error rate in the shard note); COVERAGE.md's `can` denominator.
