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
