# Worker log

One entry per task: what was done, numbers (wires, shards, bytes, load time, warnings), what is open.

## T1 (2026-11-13): pinned sopworld and validation

- `tools/sopworld/sopworld.mjs` = `docs/sopworld.mjs` of soplang-words-lib at c7247e2 (0.14.0, build ab7bc4ec2db6,
  426,896 bytes, sha256 d7240105...); `tools/sopworld/VERSION` names commit, build and sha256 (a test checks them).
- `package.json` (type module, no dependencies); `npm test` = `node --test tests/*.test.mjs`.
- `tools/validate.mjs` (helpers in `tools/lib/worlds.mjs`): for every `docs/worlds/k.*/schema.sop`, a World with all
  schemas as its library and `use(<world>)`; then each shard told into a fork of it (wires, bytes, load ms, warnings
  printed), and all shards of the world together (catches duplicate ids across shards). Errors: refused changes, parse
  errors, a shard without the `# sources:` / `# license:` / `# script:` header lines, a fact without `core.source`,
  a matrix wire in a shard, more than 2,000 wires or 300 kB.
- Numbers: 0 worlds yet; npm test 5/5 pass (fixture worlds check that each error kind is caught).

## T2 (2026-11-13): catalog and vocabulary builders

- `tools/build-catalog.mjs` validates everything (stops on any error), then writes `docs/worlds/index.json` (PLAN.md §2
  format; per world also `version` from the schema's `# version:` header line and `warnings`; per shard `license`,
  `nc: true` for NC licenses, `warnings`) and `docs/worlds/vocab.json`. `--check` exits 1 when the files are stale.
- Catalog `version`: a sha256 (12 hex) of every file under `docs/worlds` except the two generated ones, not the git sha
  (a commit cannot contain its own sha; see Q1).
- Vocabulary: lowercased `text=` of shard `core.word` wires -> that shard; identity-key values of shard wires -> that
  shard; schema `core.word` for a value (`of=`) -> the shards holding that value, for a type or key -> every shard of
  the world. Shard `keys` = its identity-key values, lowercased, sorted.
- Sorted output, 1-space JSON indent; a test rebuilds in memory and compares byte for byte with the files on disk.
- Numbers: 0 worlds, 0 shards, 0 words; npm test 10/10 pass.

## T3 (2026-11-13): Pages

- `docs/index.html`: one plain page: what this is, the files and the catalog fields, the list of worlds read from
  `index.json` at run time (shards, wires, licenses), and a minimal JS example in place of the numbered steps: fetch the
  catalog and vocab, fetch a schema (and those in `depends`) into the `library`, `use` it, tell the shards that
  `vocab['fish']` points to, `query`, and a soft issue. `tests/page.test.mjs` runs the example itself against
  `docs/worlds` with `fetch` served from disk (skipped until `k.commonsense` exists).
- `docs/worlds/README.md` explains the files, `index.json` fields and `vocab.json`. `.nojekyll` kept.
- Numbers: 0 worlds; catalog version changes with README (it hashes the folder); npm test 11 pass, 1 skipped.

## T4 (2026-11-13): k.commonsense core

- `docs/worlds/k.commonsense/schema.sop` (module `k.commonsense`, exports `thing`, `placed`; version 1 as a header line,
  Q3): `k.commonsense.thing` (shared, closed; `name` identity, `at`/`can`/`used_for`/`made_of` many, `size` enum
  tiny..huge, `usually_count` integer); `k.commonsense.placed` (`thing`, `at`, `scene`) for what an application puts in
  a scene; 4 soft denies: water thing in the sky, water thing on grass (each with `?thing` and `?place` in `why`), a
  thing that cannot fly and is not usually in the sky placed in the sky (`not=` twice), more than `usually_count` in one
  scene (`core.calc fn=count over=`, with `core.select=first` on the anchor so there is one issue per scene and thing,
  not one per placement); 5 schema words. Matrix ids fully qualified (Q4).
- `shards/core.sop`: 15 things + 15 `core.word` (forms such as fishes, airplane), every wire `core.source="hand-core 1"`.
- `sources/hand-core/SOURCE.md`; license CC0-1.0 provisional (Q2). `WORLD.md`.
- `tests/k.commonsense.questions.jsonl`: 20 lines (10 queries, 10 statements with their soft issues), run by
  `tests/questions.test.mjs` on a fork each; every statement must be accepted. The page example now runs too.
- Numbers: schema 37 wires, 5,095 bytes, load 18 ms; shard 30 wires, 3,963 bytes, load 10 ms; 0 warnings, 0 issues;
  vocab 45 words; npm test 33 pass.
- Found: an answer resting on a knowledge wire with a standing issue is `conflicting` (S50), so a scene with a fish in the
  sky makes "where does a fish live" conflicting (noted in WORLD.md). Order-dependent merge: a fact of a subtype told
  after a fact of its parent type with the same identity is not merged (two wires), told before it is (one wire); so
  `k.objects.object` does not extend `k.commonsense.thing` (joined by name instead).

## T5 (2026-11-13): k.objects core, with the T5 amendment (drawable parts)

- `docs/worlds/k.objects/schema.sop` (module `k.objects`, imports `k.commonsense`, exports object, part, point;
  version 1): `k.objects.object`; `k.objects.part` (identity `of` + `name`; `kind` for repeated parts; required `shape`
  from the closed enum rectangle/square/circle/oval/triangle/line/arc/polygon, required box `x y w h` 0..100, required
  integer `z`, required many `colour`; `pointing`/`opens` for triangles and arcs (Q5); `above below inside left_of
  right_of on` many, `centered` boolean); `k.objects.point` (`of` ref to the part, `n`, `x`, `y`). No `count`: one wire
  per instance (amendment). 4 schema words.
- 7 shards by category, 30 objects (the 19 asked + apple, butterfly, cup, chair, table, umbrella, ladder, lighthouse,
  moon, star, plane: all Quick, Draw! categories), 168 parts, 139 points, 30 object words + 20 part-kind words.
  Hand-chosen coordinates; boxes of lines and polygons computed from their points by a throwaway formatter (not
  committed; the .sop files are the source).
- `tools/render-svg.mjs` (about 110 lines): facts -> plain SVG (viewBox 0 0 100 100), shapes drawn in their boxes by z;
  writes 30 SVGs + `index.html` to `docs/worlds/k.objects/preview/` (30,128 bytes). Looked at by eye (contact sheet);
  the cup was white on white, now red first.
- Tests: `tests/k.objects.questions.jsonl` (14: parts of a house; roof above body; crown green; 2 windows by kind; wheels;
  common sense through the import; a soft issue), `tests/k.objects.render.test.mjs` (every object renders; boxes inside
  the frame; known shapes; circle/square w = h; points only and always for lines/polygons, numbered 1..n, box = their
  bounds; every relative position names a part of the same object and agrees with the boxes; `centered` is centred;
  previews on disk are up to date).
- Numbers: schema 32 wires, 4,502 bytes, 4 ms; shards (wires / bytes / load ms): animals 64 / 9,558 / 6, buildings
  39 / 5,842 / 4, figures 51 / 7,497 / 5, household 43 / 6,095 / 3, nature 33 / 4,726 / 2, sky 52 / 6,493 / 7,
  vehicles 110 / 14,774 / 7; total 392 wires, 54,985 bytes; 0 warnings, 0 errors. Catalog: 2 worlds, 8 shards, 238
  vocab words. npm test 80 pass.
- Questions Q5-Q8.

## T6 (2026-11-13): Round 1 report

**Numbers.** 2 worlds, 2 schemas (69 matrix wires), 8 shards, 422 fact wires, 58,948 bytes of shards; 0 errors, 0
warnings, 0 standing issues. Load: `k.commonsense` complete (schema + shard) 22 ms, `k.objects` complete (both schemas,
all 8 shards) 49 ms, single shards 2-10 ms. Catalog: 238 vocab words. npm test: 80 pass (validation, catalog,
page example, 34 world questions, render test for 30 objects).

**What worked.**
- Modules exactly as PLAN.md §2 says: a schema in the `library`, `use` or `imports=`, exports limiting reads; types
  `shared=true` so an application's facts in its own namespace join knowledge facts by value.
- Soft rules as `core.deny … soft=true` with variables in `why`; a count rule with `core.calc fn=count over=` and
  `core.select=first` on the anchor gives one issue per scene and thing. Nothing is refused.
- `query` answers the test questions directly (`value`, `values` for many keys, `list`, `count`, `check`).
- Drawable parts: a renderer with no knowledge of the objects draws all 30 from the facts (see `preview/`).
- The page's JS example is run by the tests, so it cannot drift from the sopworld API.

**What the schema could not say, or only with a workaround.**
- A world's schema version: `core.module` does not read `version=` (warning) → `# version:` header line (Q3).
- Short matrix ids clash with the application's ids under `imports=` (ids unchanged) → fully qualified ids (Q4).
- A subtype across modules (`k.objects.object extends k.commonsense.thing`) merges order-dependently → no `extends`,
  joined by name (Q8).
- "A water thing placed in the sky or on grass": no "one of" in a pattern → two soft denies with a `core.check fn=eq`
  each (no new syntax needed, but the rule is written twice).
- Orientation of triangles and arcs is not given by a box → `pointing` / `opens` keys (Q5). Repeated parts → unique
  names plus `kind` (Q6). Points name their part by reference (Q7).
- An answer that rests on a knowledge wire with a standing issue is `conflicting` (S50): once a fish is in the sky,
  "where does a fish live" is conflicting. Applications should ask knowledge questions on a fork without the scene,
  or read `alternatives`.
- The catalog version is a content hash, not a git sha (Q1). The hand-core license is provisionally CC0-1.0 (Q2).

**Not done in Round 1 (not asked in T1-T6):** `docs/worlds/LICENSES.md` (PLAN.md §5) and a CI workflow (M0); both are
small and can come with Round 2. `CHANGELOG.md` will start with the first breaking schema change.

**Questions for the reviewer:** Q1-Q8 in `questions.md`.

## R2.1 (2026-11-13): Q7 rename, rule 4, LICENSES.md, CI

- Q7: `k.objects.point` refers to its part with `part=$<part id>` (was `of=`); identity `part` + `n`. 139 point wires in
  7 shards, the renderer, WORLD.md. `k.objects` schema version 2; `CHANGELOG.md` started (breaking change).
- AGENTS.md rule 4: matrix ids fully qualified.
- `tools/build-catalog.mjs` also writes `docs/worlds/LICENSES.md`: per source of a published shard, the `What`,
  `Origin`, `License` and `Attribution` lines of `sources/<id>/SOURCE.md`, the shard terms and the worlds using it.
  It is a generated file (not part of the content hash); the catalog test compares it byte for byte.
- `.github/workflows/test.yml`: `npm test` and `build-catalog --check` on push and pull request (node 22).
- Numbers: unchanged facts (2 worlds, 8 shards, 422 fact wires, 58,948 shard bytes, 0 warnings); npm test 81 pass.

## R2.2 (2026-11-13): k.words from WordNet 3.1

- Sources: WordNet 3.1 from `nltk/nltk_data` on GitHub (`wordnet31.zip`, commit 550b662, sha256 in SOURCE.md; it has
  the `.exc` lists that npm `wordnet-db` lacks, the data files are the same); frequency list: FrequencyWords English
  2018 (`hermitdave/FrequencyWords` 525f9b5, `en_50k.txt`, CC BY-SA 4.0), its first 20,000 lines, used as a filter
  only (Q9). The Google-derived lists were not used (unclear terms).
- `docs/worlds/k.words/schema.sop` (version 1, exports `sense`): `k.words.sense` (shared, closed; identity `word` +
  `pos` + `n`; `gloss` string; `synonym`, `is_a`, `instance_of`, `part_of` many, atom or string). 10 matrix wires, no
  rules, no schema words (Q10).
- `tools/import/wordnet.mjs` (+ `tools/import/lib.mjs`: value, id, wire, header, split helpers): the 3 most frequent
  senses per word and part of speech; gloss without examples; first word of each hypernym / instance hypernym / part
  holonym synset; irregular forms and lower-case text for capitalised words as `core.word` facts; senses WordNet
  marks as slurs, offensive or vulgar left out (61). Shards by the first two letters, sorted by word; a bucket over
  1,800 wires / 270 kB would split into `xx-1`, `xx-2` (none does).
- Tests: `tests/import.wordnet.test.mjs` (a made-up fixture in WordNet's format; same input same bytes; splitting;
  and, when the raw files are there, the shards on disk are byte for byte what the importer gives; skipped in CI where
  raw is absent), `tests/k.words.questions.jsonl` (11).
- Numbers: 19,697 usable list words → 10,471 words with a noun or verb sense, 26,116 senses, 2,835 `core.word`
  wires (1,264 irregular forms); **28,951 wires, 318 shards, 5,610,059 bytes**; largest shard `co` 1,185 wires,
  229,974 bytes, load 21 to 35 ms; median shard under 2 ms; all 318 shards one after another 0.8 s of load (0.8 s for the
  whole world in one instance); schema 8 ms; 0 warnings, 0 errors. Catalog: 3 worlds, 326 shards, vocab 11,726 words
  (index.json 262 kB, vocab.json 484 kB). npm test 97 pass in about 10 s.
- Limits found: values are words, not senses (a reference to a sense in another shard would dangle), so chains
  (`dog` → `canine` → …) are followed by looking the value up as a word again; values of several words are strings
  (Q11); a capitalised word is its own value (`word=China` sense 1, `word=china` sense 2), found from lower case
  through a `core.word` fact.

## R2.6 pilot (2026-11-13): 200 drawable objects from Noto Emoji

(Done right after R2.1 as the reviewer asked at 08:35; R2.2 was already pushed when that message arrived.)
- Sources: `googlefonts/noto-emoji` 99701e0, folder `2D/svg` (Apache-2.0, `2D/svg/LICENSE`); names, keywords and
  groups from Unicode CLDR 48 (`cldr-json` 48.2.3 annotations, `emoji-test.txt` of `unicode-org/cldr` release-48;
  Unicode-3.0). Notices published as `k.objects/LICENSE.noto-emoji` and `LICENSE.cldr`. Shard licence
  `Apache-2.0 AND Unicode-3.0`. Twemoji was not compared: the first 20 Noto conversions were all recognisable next
  to the originals, and Apache-2.0 is the more permissive of the two.
- `tools/import/svg-parts.mjs` (SVG reader without dependencies: path flattening incl. curves and arcs, transforms,
  style and attribute fills, gradients to one flat colour, Douglas-Peucker, colour names by nearest CIE Lab distance)
  and `tools/import/noto-emoji.mjs`. Things kept: 861 emoji in the groups Animals & Nature, Food & Drink, Travel &
  Places, Activities, Objects; 32 dropped as not things (clock faces per half hour, card suits); 829 remain, of which
  18 have a hand-written object of the same name and are left out (Q12). **The 1,200 to 1,800 expected are not
  there**: without faces, people, hands, flags and symbols the emoji set has about 830 things.
- Schema additions (not breaking): `variant` (object, part), `rgb`, `named`, colour enum of 11 names, names may be
  strings. Renderer: exact colours drawn flat, names of several words, `--label` mode (parts outlined and numbered).
  Catalog: `part1…partN` are placeholders, not vocabulary words.
- Pilot = every 4th thing in list order (`sources/noto-emoji/limit.txt` = 200): **200 objects, 2,429 parts, 29,499
  points, 200 word wires; 32,328 wires, 53 shards, 3,937,882 bytes** = 162 wires and 19.7 kB an object on average
  (12.1 parts, 147 points). One shard (avg 610 wires, 74 kB) loads in about 20 ms; all 53 in 1.0 s; 0 warnings.
- **Looked at all 200 at 160 px (4 contact sheets): 197 recognisable (98.5%)**. Weak: abacus (beads lost to the
  16-part cap), computer disk and ring (holes dropped). Fixed after the first look: translucent highlights (opacity
  under 0.75) were drawn solid and hid the candy and the diya lamp; they are dropped now.
- Tests: `tests/import.noto.test.mjs` (made-up SVG and list; primitives, holes, overlays, gradients, names from the
  TSV, determinism; disk shards = importer output when raw files are present), render test for every object.
  npm test 300 pass, 24 s.

## R2.7 pilot (2026-11-13): names for the parts of the 200 pilot objects

- `tools/render-svg.mjs --label <dir> [object …]`: the object at 320 px, every part outlined and numbered in draw
  order (the number sits on a spot later parts do not cover, when there is one), names underneath once they exist.
- Looked at all 200 objects on 34 contact sheets of 6 and wrote `sources/noto-emoji/part-names.tsv`
  (`object, part number, name, kind`; 833 rows). The import script reads it; the build stays deterministic.
- **611 of 2,429 parts got a name (25%), 222 more are marked `kind=detail`** (highlights, veins, stripes, text
  lines) and keep `partN`; 181 of 200 objects have at least one row. Named parts carry `named=model`; repeated parts
  have `left_`/`right_`/`front_`/`back_` or a number and a `kind` (`eye`, `ear`, `wheel`, `window`, `whisker`).
- What kept parts unnamed (only-when-sure rule): drawings made of many overlapping layers of one thing (a part and
  its shade or outline at the same place: which is "the body"?), facets (diamond, pretzel, bacon, tamale), and
  numbers that sit on top of each other. Animals, faces, vehicles and buildings name well; food and tools less.
- 12 labelled examples in `docs/worlds/k.objects/preview/label-*.svg` (dog face, frog, baby chick, mouse face, taxi,
  hut, saxophone, teddy bear, hot dog, hammer, office building, full moon face), shown on the preview page.
- Tests: `tests/k.objects.names.test.mjs` (every TSV row is a part that exists with that name, kind and
  `named=model`; names unique inside an object; "parts of a dog face" answers head, eyes, ears, nose, mouth, tongue,
  patch; "which objects have a wheel" now also finds taxi, minibus, skateboard). Vocabulary: part names are words
  (`wheel` → the shards with wheels); 12,210 words. npm test 302 pass.

## R2.6 full run (2026-11-13): all things of Noto Emoji

- The pilot passed the 85% bar (197 of 200), so `sources/noto-emoji/limit.txt` is 0 (all).
- **811 objects** (861 listed − 32 not things − 18 with a hand-written object of the same name), 10,188 parts
  (12.6 an object), 121,764 points (150 an object), 802 word wires; **133,565 wires, 124 shards, 16,236,240 bytes**:
  165 wires and 20.0 kB an object, 6.5 objects a shard; largest shard 1,696 wires / 205,273 bytes (inside the gate).
  A shard loads in 32 ms on average; all 124 in 4.0 s; 0 warnings, 0 errors.
- `k.objects` now has 841 objects (30 hand-written + 811). Previews: 841 SVGs + 12 labelled, 3.6 MB.
- Catalog: 3 worlds, 450 shards, vocab 12,994 words (index.json 327 kB, vocab.json 716 kB).
- npm test: 913 pass in 60 s (one render test per object; validation loads every shard twice).
- The 611 objects outside the pilot are looked at one by one during R2.7 (labelling pictures); what is found
  unrecognisable there is reported with those batches.

## R2.7 batch 1 (2026-11-13): 108 more objects looked at (308 of 811)

- Animals (birds, bugs, mammals, marine, reptiles) and the first arts and book objects, on 9 sheets of 12.
- part-names.tsv now has rows for 278 objects: **1,002 parts named, 268 marked detail** (this batch: +391 names,
  +46 details, 97 of 108 objects got at least one row). Faces name almost completely (cat face 12 of 16, cow face
  11 of 11); whole animals mostly body, head, tail, legs, eyes.
- Seen while labelling, not recognisable after conversion: spider web (the holes of the web are dropped: a dark
  blob), gorilla, panda (dark shapes cover the face), lizard (head and legs lost to the 16-part cap). 4 of 108.
- npm test 913 pass; 133,565 wires, 124 shards (unchanged); vocab 13,022 words.

## R2.7 batch 2 (2026-11-13): 108 more objects looked at (416 of 811)

- Books and paper, clothes, shoes, hats, computer things, dishware, drinks, events, Asian food, first fruits.
- part-names.tsv: rows for 361 objects; **1,205 parts named, 387 marked detail** (this batch: +203 names, +119
  details, 83 of 108 objects with a row). Clothes, food and drinks name less than animals: often only the main part
  (cup, bottle, shirt) and a few details are sure.
- Not recognisable: optical disk, dvd (plain discs; the hole and the shine are lost). 2 of 108.
- npm test 913 pass; shards unchanged in number and wires; vocab 13,088 words.

## R2.7 batch 3 (2026-11-13): 108 more objects looked at (524 of 811)

- Fruit, bread, meat, prepared food, sweets, vegetables, games, household, cameras and lights, locks.
- part-names.tsv: rows for 451 objects; **1,416 parts named, 541 marked detail** (this batch: +211 names, +154
  details, 90 of 108 objects with a row). (The commit message of this batch, 98d38ce, gives 458 / 1,444 / 558 /
  +239 / 97: those were written before the build finished and are wrong; these are the measured numbers.)
- Not recognisable: piñata, mirror ball, nesting dolls. 3 of 108.
- npm test 913 pass; shards unchanged in number and wires.

## R2.7 batch 4 (2026-11-13): converter fix for frames and rings; 113 objects looked at (601 of 811)

- **Converter fix found while labelling** (the three charts were grey boxes): a path that is mostly hole (a frame, a
  ring, a disc with a hole) was filled solid once its hole was dropped, and hid everything drawn before it. Such a
  shape (holes at least half of its area) is now a closed `line` along its outer edge; holes are found whatever
  the order of the subpaths. 129 objects changed; charts, ring, discs, panda, mirror ball, package, abacus are
  recognisable now. Noto shards after the fix: 811 objects, 10,152 parts, 120,941 points, **132,706 wires, 124
  shards, 16,153,844 bytes**.
- 70 of the changed objects were renumbered (part numbers moved); the 36 of them that had names lost their rows
  and were looked at again in this batch, so no name points at a wrong part (the names test checks row by row).
- Looked at: the 70 renumbered ones again, then mail, medical, money, music, office, phones, first buildings.
  part-names.tsv: rows for 509 objects; **1,537 parts named, 641 marked detail**.
- Not recognisable so far (of 601 looked at): spider web, gorilla, lizard, piñata, nesting dolls, brick. 6.
- npm test 913 pass; vocab 13,186 words.

## R2.7 batch 5 (2026-11-13): 108 more objects looked at (709 of 811)

- Buildings, places, scenes, flowers, plants, science, moons, weather, sound, balls.
- part-names.tsv: rows for 592 objects; **1,767 parts named, 708 marked detail** (measured). Scenes (cityscape, national park, desert) get only a sun or
  a sky; weather and flowers name well (sun, cloud, rays, stem, petals).
- Not recognisable: foggy, fog (plain grey areas). 8 so far of 709.

## R2.7 batch 6 (2026-11-13): the last 102 objects looked at (811 of 811)

- Sport, clocks, tools, weapons, air, rail and road vehicles, ships, pens.
- **R2.7 done for every imported object.** part-names.tsv: rows for 680 of 811 objects; **2,027 of 10,152 parts
  named (20%), 748 more marked `kind=detail`**; 131 objects have no sure name at all (layered food, facets, scenes).
  Vehicles name best (wheels, windows, lights, mirrors with `kind`), then animals and faces.
- **Recognisable after conversion: 801 of 811 (98.8%)**, judged on the 320 px labelling pictures. Not recognisable:
  spider web, gorilla, lizard, piñata, nesting dolls, brick, foggy, fog, link, parachute.
- npm test 913 pass; 132,706 wires, 124 shards; vocab 13,269 words.

## R2.3 (2026-11-13): k.geo from Natural Earth and mledoze/countries

- Sources: Natural Earth 5.1.2 (`nvkelso/natural-earth-vector` v5.1.2, five GeoJSON files, public domain) and
  mledoze/countries 5.1.0 (ODbL-1.0). Following the owner's rule (the more permissive source when a fact is in
  both), everything Natural Earth has comes from it; the country list gives only neighbours, area and landlocked.
- Two shards per continent: `<continent>` (public domain) and `<continent>-borders` (ODbL-1.0). The borders shard
  names each country again; told together the two wires of a country merge into one (identity `name`), so
  "neighbours of Moldova" and "capital of Moldova" are answered from one fact, and an application can leave the
  ODbL shards out.
- Schema (version 1): `k.geo.continent`, `country`, `city`, `river`, `mountain`, `range`; 65 matrix wires incl. 11
  words. `capital_of` on a city names the country (no key means two things). Points and boxes only.
- `tools/import/geo.mjs`: country of a point by point-in-polygon on the 1:50m outlines (rivers: countries their
  line passes through; mountains: the country of the summit); river pieces of one name that touch within half a
  degree are one river; English names where Natural Earth has them; capitalised names (ALPS) written Alps.
- Numbers: 238 countries and territories (233 with borders facts), 872 cities, 1,074 rivers, 627 mountains, 216
  ranges, 206 word wires; **3,473 wires, 13 shards, 634,408 bytes**; largest shard `asia` 811 wires / 140,448 bytes
  / about 60 ms; all 13 in 0.25 s; 0 warnings, 0 errors. Import runs in 6 s.
- Tests: `tests/import.geo.test.mjs` (a made-up two-country world; determinism; disk = importer when raw is there),
  `tests/k.geo.questions.jsonl` (14). Catalog: 4 worlds, 463 shards, vocab 16,215 words. npm test 931 pass.
- Limits: boxes across the 180th meridian span −180..180; a query for a value with several wires (`capital_of` a
  country with two capitals) is `conflicting` in `value` mode, use `list`; names are Natural Earth's `ADMIN`
  ("United States of America", "Republic of Serbia"), other names are `core.word` facts.

## Reviewer's answers of 09:25 applied (2026-11-13): Q10, Q12

- Q10 (a): in `vocab.json` a word for a type or a key of a world points to the world's schema path
  (`"capital": ["k.geo/schema.sop"]`), for every world; words for values still point to shards. `k.words` now has
  schema words too (word, meaning, definition, synonym, kind, part). README and the page example say so.
- Q12: `variant` removed from the `k.objects` schema (never used in a shard); imported drawings of the 18 names
  with a hand-written object stay left out.
- Numbers: 4 worlds, 463 shards, vocab 16,218 words; facts unchanged; npm test 931 pass.

## sopworld 0.15.0 (2026-11-13): pin upgraded to 782cd0c

- `tools/sopworld/sopworld.mjs` = `docs/sopworld.mjs` at 782cd0c (0.15.0, build 694081ad7e6f, sha256 in VERSION).
  AGENTS.md, README, page and the VERSION test name the new pin; the catalog says `"sopworld": "782cd0c"`.
- Schema versions moved from the `# version:` header line to `core.module … version=` (no warning any more); the
  catalog reads it from the module wire.
- Fork workaround: the page example had none in its code (it asked before it placed the fish); it now asks again
  after the soft issue and the test expects `supported`. The note in k.commonsense/WORLD.md is replaced. The
  per-question `fork()` in `tests/questions.test.mjs` stays: it keeps the questions independent of each other.
- Everything loads unchanged: 4 worlds, 463 shards, 0 errors, 0 warnings; shard bytes unchanged. Load times under
  0.15.0: noto shards 4.6 s for 124 (was 4.0), k.words 0.95 s for 318, k.geo 0.36 s for 13; validation 15 s;
  npm test 931 pass in 84 s (60 s before k.geo).

## More objects (2026-11-13): OpenMoji and Mulberry Symbols; k.objects has 2,106 objects

- **OpenMoji** (`hfg-gmuend/openmoji` 3e01de5, CC BY-SA 4.0): 1,059 candidates in the groups of things; 816 names
  already exist (hand-written or Noto), 129 are not things (signs, people, actions, complaints, local in-jokes);
  **114 new objects** (extras: goldfish, narwhal, lawn mower, trowel, moka pot, washing machine, drone, crutches,
  stretcher, eiffel tower, submarine, …), 1,322 parts, 11,022 points; 12,530 wires, 18 shards, 1,515,483 bytes.
- **Second set: comparison and choice.** Candidates found on GitHub with filled shapes and object names:
  Mulberry Symbols (`mulberrysymbols/mulberry-symbols`, CC BY-SA 4.0, 3,444 coloured pictograms for communication
  aids, with a category and grammar table) and game-icons (`game-icons/icons`, CC BY 3.0, 4,239 one-colour icons).
  20 everyday names converted from each and looked at side by side: Mulberry had 17 of the 20, in colour, all 17
  recognisable; game-icons had 11, white on black with no typical colour, and a fantasy-game vocabulary. Not
  candidates: Twemoji and Fluent Emoji (the same emoji names as Noto, nothing new), Material and Phosphor (one
  colour), Papirus (GPL, not in the allowed list), ARASAAC (not on GitHub as SVG). **Chosen: Mulberry Symbols.**
- **Mulberry** fa94a93: 3,435 symbols; nouns of the thing categories only (1,930 others dropped), first drawing of
  a thing (118 variants dropped), 237 names already taken; **1,151 new objects**, 16,361 parts, 162,338 points;
  180,604 wires, 174 shards, 21,519,843 bytes (157 wires and 18.7 kB an object). A sample of 100 looked at on a
  contact sheet at 120 px: about 95 recognisable (weak: thin things such as a string of lights; dark drinks are
  near black).
- Converter: outlines (a shape that is at least 30% hole, for these two outline styles; 50% for Noto) are closed
  lines; a closed line now keeps its closing point (it was dropped; Noto: +11 points, no part moved).
- `tools/import/objects.mjs` (shared: name precedence, shard building), `openmoji.mjs`, `mulberry.mjs`;
  `tests/import.objects.test.mjs` (fixtures, precedence, disk = importer when raw is present).
- **k.objects: 2,106 objects** (30 hand-written + 811 + 114 + 1,151), 323 shards, about 326,000 wires, 39 MB of
  shards; largest shard 1,696 wires / 205 kB. Load: 12 s for all 316 imported shards one after another (about 38 ms
  a shard). Catalog: 4 worlds, 655 shards, vocab 17,182 words (index.json 492 kB, vocab.json 980 kB).
  0 errors, 0 warnings. npm test 2,201 pass in 170 s (one render test per object).
- **Naming pass for the 1,265 new objects: not done yet** in this commit; they are `part1…partN`. The files
  `sources/openmoji/part-names.tsv` and `sources/mulberry/part-names.tsv` exist and are read by the importers.
- Size note for the reviewer: `docs/worlds` is now 56 MB (previews 9 MB). If that is too much for Pages or for the
  tests, the point budget per object (200) is the knob.

## R2.4 (2026-11-13): k.units and k.time, hand-written

- `k.units` (version 1): `k.units.quantity` (name, base) and `k.units.unit` (name, symbol, quantity, `factor` and
  `offset` to the base unit, system). A value in the unit × factor + offset is the value in the base unit; the
  arithmetic is left to the application. Shard `core`: 8 quantities, 44 units (length, mass, time, volume, area,
  temperature, speed, angle; metric and imperial), 44 word wires (plurals, American spellings, symbols):
  96 wires, 12,585 bytes, load 1 ms. Schema 15 wires.
- `k.time` (version 1): `k.time.month` (n, days, leap_days, season_north, season_south), `weekday` (n from Monday,
  weekend), `season` (n, after), `duration` (count × unit); months, weekdays and seasons are `complete=true`, so
  "is there a 13th month" answers `no`. Shard `calendar`: 12 + 7 + 4 + 13 facts and 32 word wires: 68 wires, 7,587
  bytes, load 1 ms. Schema 26 wires. No holidays (PLAN.md: names only, with a later import).
- Tests: `tests/k.units.questions.jsonl` (11), `tests/k.time.questions.jsonl` (12).
- Catalog: 6 worlds, 657 shards. 0 errors, 0 warnings. npm test: 2,226 tests, all pass except that the full run
  was disturbed by my own edit of two schemas for the next task while it ran (the catalog freshness test saw them);
  after setting those edits aside and rebuilding, the catalog, validation, question and page tests pass (99).
  The next commit runs the whole suite again.

(Correction: the R2.4 commit message, b4be692, says 132 for the catalog, validation, question and page tests; the
measured number is 99.)

## Import scripts for sources this network cannot reach (2026-11-13): ConceptNet and Quick, Draw!

- **No data of either source is in the repository.** Both scripts are tested on fixtures invented for the tests,
  in the formats of the real files; `sources/conceptnet/SOURCE.md` and `sources/quickdraw/SOURCE.md` say NOT
  FETCHED and give the download and run commands for a machine with an open network.
- `tools/import/conceptnet.mjs`: streams `conceptnet-assertions-5.7.0.csv(.gz)`; English edges of weight 2 or more;
  AtLocation → `at`, CapableOf → `can`, UsedFor → `used_for`, MadeOf → `made_of`, IsA → `is_a`, PartOf →
  `part_of`, HasA → `has`; one `k.commonsense.thing` per start term, values by weight; things of the hand-written
  core are left to it; shards `conceptnet-<letter>` split inside the size gate; CC-BY-SA-4.0.
  For it, `k.commonsense.thing` got three more keys (`is_a`, `part_of`, `has`, many) and its keys take strings for
  names of several words (additive; version stays 1). Part-of facts go to `k.commonsense`, not to `k.objects`,
  whose parts must be drawable.
- `tools/import/quickdraw.mjs`: reads `<category>.ndjson` (first 2,000 recognised drawings); the skeleton rests on
  the drawings with the most common stroke count; stroke n = the median box of their n-th strokes, with the spread
  of the stroke centres; usable when at least 20 drawings and 15% of them agree on the count and the mean spread is
  15 or less; each stroke names the hand-named part of the `k.objects` object it overlaps most (at least 0.3 of the
  union), if any. New type `k.objects.skeleton` (of, n, x, y, w, h, part, drawings, spread; additive). The script
  prints which categories are usable, which is the report the plan asks for. CC-BY-4.0.
- Tests: `tests/import.conceptnet.test.mjs`, `tests/import.quickdraw.test.mjs` (filtering, mapping, determinism,
  and that the output loads in sopworld with the schemas and answers a query).

## R2.5 (2026-11-13): 30 more hand-written objects; plane and dog redrawn

- New shards `structures` (bridge, windmill, well, fence, gate, igloo, barn, tower, pyramid, kennel, mailbox),
  `home` (sofa, shelf, oven, bottle, box, suitcase, bag, phone, computer, book), `more` (truck, hen, bee, planet,
  heart, flag, hat, boot, sock): 30 objects with named parts, kinds for repeated parts, relative positions, boxes,
  z, typical colours; names chosen among common things no imported source has, so no imported drawing is displaced.
  Hand-chosen coordinates through a throwaway formatter, as in Round 1.
- Plane redrawn (side view to the right: body, swept wings, tail fin, engine, cockpit, six windows); dog's head
  redrawn (head, snout, nose, mouth, hanging ear, eye).
- Previews looked at on one contact sheet (32 pictures): all recognisable; the igloo (white on white) and the
  kennel door (an arc drawn as a line) were redrawn after the first look.
- Numbers: `structures` 153 wires / 20,942 bytes, `home` 101 / 14,446, `more` 99 / 13,743; load 3 to 7 ms each;
  `animals` now 68 wires, `vehicles` 115. k.objects: **2,136 objects** (60 hand-written + 811 + 114 + 1,151),
  326 shards. Catalog: 6 worlds, 660 shards, vocab 17,417 words. 0 errors, 0 warnings.
- npm test: 2,261 tests; the full run had 2 failures (bag button and sock toe a unit outside their `inside` part),
  fixed; the render, catalog, validation and names tests then pass (2,152 tests, which include every object).

## Round 2 report (2026-11-13)

**Done, in the order the reviewer's messages set:** R2.1; R2.2 (pushed before the reorder arrived); R2.6 pilot;
R2.7 pilot; R2.6 full; R2.7 batches 1 to 6 (all 811 Noto objects); R2.3; answers Q10 and Q12; sopworld 0.15.0;
OpenMoji and Mulberry; R2.4; the ConceptNet and Quick, Draw! scripts; R2.5.

**Worlds now** (0 errors, 0 warnings, sopworld 0.15.0 at 782cd0c):

| World | Shards | What | Sources and terms |
| --- | --- | --- | --- |
| k.commonsense | 1 | 15 things, 4 soft rules | hand-core, CC0-1.0 |
| k.objects | 326 | 2,136 drawable objects | hand-core CC0-1.0; Noto Apache-2.0 + CLDR Unicode-3.0; OpenMoji and Mulberry CC-BY-SA-4.0 |
| k.words | 318 | 10,471 words, 26,116 senses | WordNet 3.1, WordNet licence |
| k.geo | 13 | 238 countries, 872 cities, 1,074 rivers, 627 mountains, 216 ranges | Natural Earth public domain; borders shards ODbL-1.0 |
| k.units | 1 | 8 quantities, 44 units | hand-core, CC0-1.0 |
| k.time | 1 | months, weekdays, seasons, durations | hand-core, CC0-1.0 |

**Not fetched (network: GitHub, npm, pip only):** ConceptNet (S3) and Quick, Draw! (Google Storage): scripts with
fixture tests only, no data. Wikidata was not attempted.

**Not done:** the naming pass for the 1,265 OpenMoji and Mulberry objects (Q14). 131 Noto objects have no named
part. Ten Noto conversions are not recognisable (listed under R2.7 batch 6).

**What SOP Lang could not say, or only with a workaround:** a value of several words (strings, Q11, accepted); a
list of points (one wire per point: 80% of the wires of k.objects, Q13); "no value for this key" in a query (Q12:
second drawings left out); a reference to a fact in another shard (k.words values are words, not senses); a
country's facts under two licences (two shards whose wires merge by identity: works); "one of several values" in a
`value` query answers `conflicting` (use `list`).

**Open questions:** Q9 (terms of the k.words shards, given the CC BY-SA frequency list used as a filter), Q13 (size
of k.objects), Q14 (naming pass for the new sources), Q15 (country names).

## R3.1 part 1 (2026-11-13): Q15, country names

- `tools/import/geo.mjs`: the identity of a country is its common short name: Natural Earth's `NAME` or `NAME_LONG`,
  whichever is shorter and written in full (`"United States"`, `Serbia`, `Russia`, `Laos`, `Czechia`); where both are
  abbreviated or hold a slash (`Falkland Is.`, `Heard I. and McDonald Islands`) the `ADMIN` name. The reviewer named
  `NAME`; `NAME` alone is abbreviated for 33 countries (`Dem. Rep. Congo`, `Bosnia and Herz.`), and for the United
  States the short form is in `NAME_LONG`, hence this rule. 238 names, all distinct.
- The formal name is the key `formal` (was `official`). The other names (ADMIN, NAME, NAME_LONG, NAME_EN, the formal
  name) stay `core.word` facts. `country`, `capital_of` and `neighbour` values follow. `k.geo` version 2, CHANGELOG.
- Numbers: 13 shards, 3,473 wires (unchanged), 630,063 bytes (was 634,408), 206 word wires; 0 errors, 0 warnings.
  Two questions added (capital of the United States, formal name of Serbia): 16. npm test 2,264 pass, 0 fail (175 s).

## R3.1 naming, batch 1 (2026-11-13): details by rule; the 114 OpenMoji objects looked at

- **Rule (Q14)**, in `tools/import/objects.mjs` (`detailByRule`, used by the OpenMoji and Mulberry importers, not by
  Noto): a part that is only a stroke (`line`, `arc`), and a black filled part with the same box (within 2 units) as
  a filled part of another colour, is `kind=detail`. A row of `part-names.tsv` for a part replaces the rule (a
  stroke can still be named). By rule: **8,060 of 17,683 parts** are details (OpenMoji 639 of 1,322, Mulberry 7,421
  of 16,361).
- `tools/render-svg.mjs --label`: a detail without a name gets no pink outline; its number is small and blue, and is
  left out when the detail has the box of a filled part.
- `sources/mulberry/excluded.tsv` (name, reason; empty so far) is read by `tools/import/mulberry.mjs` (R3.2).
- **Looked at: all 114 OpenMoji objects** on 6 contact sheets of 20 (300 px each). 78 objects got at least one row:
  **153 parts named, 13 more marked detail by eye** (shades of a named part). Not named: anything where two numbers
  sit on one place, layered drawings, small blue stroke numbers (not readable at this size).
- Not recognisable as the named thing after conversion (OpenMoji, reported only): none found; weak ones are
  intestine, barcode and gps (symbols more than things).
- Numbers: OpenMoji 114 objects, 12,530 wires, 18 shards, 1,525,908 bytes; Mulberry 1,151 objects, 180,604 wires,
  174 shards, 21,608,895 bytes (the `kind=detail` keys add bytes, no wires). Catalog: 6 worlds, 660 shards, vocab
  17,441 words. 0 errors, 0 warnings. npm test 2,265 pass, 0 fail.

## R3.1 naming, batch 2 (2026-11-13): Mulberry objects 1 to 100 of 1,151 looked at

- Looked at: the Mulberry objects 1 to 100 (in shard order) on contact sheets of 20 at 300 px. Birds, sea animals, mammals, reptiles, insects, art making, building contents. Animals name well (body, head, wings, tail); household things mostly one main part.
- This batch: rows for 69 objects; 5 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1146 objects, 16281 parts, **154 named, 7407 details** (rule and eye); 69 objects
  with rows; 174 shards, 179745 wires, 21509675 bytes. Excluded so far: 5. k.objects: 2131 objects.
- catalog: worlds 6 shards 660 vocab 17466; 0 errors, 0 warnings. npm test 2260 pass, 0 fail.

## R3.1 naming, batch 3 (2026-11-13): Mulberry objects 101 to 200 of 1,151 looked at

- Looked at: the Mulberry objects 101 to 200 (in shard order) on contact sheets of 20 at 300 px. Furniture, garden, public buildings, rooms, shops, structure, celebration items. The room symbols (a square with a door) and parts of a room pointed at with an arrow are excluded.
- This batch: rows for 64 objects; 16 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1130 objects, 16035 parts, **294 named, 7318 details** (rule and eye); 133 objects
  with rows; 171 shards, 177917 wires, 21289240 bytes. Excluded so far: 21. k.objects: 2115 objects.
- catalog: worlds 6 shards 657 vocab 17476; 0 errors, 0 warnings. npm test 2244 pass, 0 fail.

## R3.1 naming, batch 4 (2026-11-13): Mulberry objects 201 to 300 of 1,151 looked at

- Looked at: the Mulberry objects 201 to 300 (in shard order) on contact sheets of 20 at 300 px. Celebration items, accessories, clothes, jewellery, the first football kits. Groups of clothes are excluded. The 50 club football kits are kept (shirt and shorts named where one number is clear); see Q16.
- This batch: rows for 70 objects; 7 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1123 objects, 15930 parts, **425 named, 7291 details** (rule and eye); 203 objects
  with rows; 170 shards, 176880 wires, 21167300 bytes. Excluded so far: 28. k.objects: 2108 objects.
- catalog: worlds 6 shards 656 vocab 17494; 0 errors, 0 warnings. npm test 2237 pass, 0 fail.

## R3.1 naming, batch 5 (2026-11-13): Mulberry objects 301 to 400 of 1,151 looked at

- Looked at: the Mulberry objects 301 to 400 (in shard order) on contact sheets of 20 at 300 px. Football kits, sport clothes, drink measures and drinks, computer things, electrical things, media. Sizes and measures shown with arrows, ideas, actions and software are excluded; so are drinks whose liquid is drawn black (lager, orange juice, squash).
- This batch: rows for 61 objects; 25 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1098 objects, 15627 parts, **526 named, 7110 details** (rule and eye); 264 objects
  with rows; 166 shards, 173622 wires, 20778347 bytes. Excluded so far: 53. k.objects: 2083 objects.
- catalog: worlds 6 shards 652 vocab 17479; 0 errors, 0 warnings. npm test 2212 pass, 0 fail.

## R3.1 naming, batch 6 (2026-11-13): Mulberry objects 401 to 500 of 1,151 looked at

- Looked at: the Mulberry objects 401 to 500 (in shard order) on contact sheets of 20 at 300 px. Media, phones, television, breads and baking, dairy, eggs. Phone ideas (ring tone, silent, text message), kinds of television programme and groups (food, grains, dairy products) are excluded; cream and sour cream lost all but a corner.
- This batch: rows for 50 objects; 17 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1081 objects, 15355 parts, **609 named, 6998 details** (rule and eye); 314 objects
  with rows; 163 shards, 170747 wires, 20432676 bytes. Excluded so far: 70. k.objects: 2066 objects.
- catalog: worlds 6 shards 649 vocab 17476; 0 errors, 0 warnings. npm test 2195 pass, 0 fail.

## R3.1 naming, batch 7 (2026-11-13): Mulberry objects 501 to 600 of 1,151 looked at

- Looked at: the Mulberry objects 501 to 600 (in shard order) on contact sheets of 20 at 300 px. Fish, fruit, ingredients, kitchen items. Apricot and orange are drawn black and are excluded; groups (fruit, ingredients) too. Kitchen tools name well (handle, blade, bowl, lid).
- This batch: rows for 62 objects; 5 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1076 objects, 15307 parts, **722 named, 6971 details** (rule and eye); 376 objects
  with rows; 162 shards, 170081 wires, 20355346 bytes. Excluded so far: 75. k.objects: 2061 objects.
- catalog: worlds 6 shards 648 vocab 17478; 0 errors, 0 warnings. npm test 2190 pass, 0 fail.
