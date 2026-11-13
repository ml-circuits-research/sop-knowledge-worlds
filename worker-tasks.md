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
