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

## R3.1 naming, batch 8 (2026-11-13): Mulberry objects 601 to 700 of 1,151 looked at

- Looked at: the Mulberry objects 601 to 700 (in shard order) on contact sheets of 20 at 300 px. Kitchen items, meals and snacks, meat, nuts. Meals name by bowl, soup, spoon, bun; layered food (lasagne, quiche, ham) gets no name. Groups (banquet buffet, food cold, meat, nuts) are excluded; fish battered is drawn black.
- This batch: rows for 54 objects; 7 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1069 objects, 15195 parts, **817 named, 6938 details** (rule and eye); 430 objects
  with rows; 162 shards, 168792 wires, 20203136 bytes. Excluded so far: 82. k.objects: 2054 objects.
- catalog: worlds 6 shards 648 vocab 17488; 0 errors, 0 warnings. npm test 2183 pass, 0 fail.

## R3.1 naming, batch 9 (2026-11-13): Mulberry objects 701 to 800 of 1,151 looked at

- Looked at: the Mulberry objects 701 to 800 (in shard order) on contact sheets of 20 at 300 px. Nuts, pasta and rice, poultry, sweets and desserts, vegetables, the first grooming items. Vegetables made of many leaves or facets (cabbage, cauliflower, artichoke) get no name; pumpkin is drawn black and is excluded.
- This batch: rows for 51 objects; 4 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1065 objects, 15131 parts, **907 named, 6916 details** (rule and eye); 481 objects
  with rows; 162 shards, 167953 wires, 20105430 bytes. Excluded so far: 86. k.objects: 2050 objects.
- catalog: worlds 6 shards 648 vocab 17505; 0 errors, 0 warnings. npm test 2179 pass, 0 fail.

## R3.1 naming, batch 10 (2026-11-13): Mulberry objects 801 to 900 of 1,151 looked at

- Looked at: the Mulberry objects 801 to 900 (in shard order) on contact sheets of 20 at 300 px. Grooming items, medical items, holiday and travel, games, playground. Bottles and tubes name by bottle, cap, tube; faces used as a background for a product get a name only where clear. Excluded: groups, actions, places, sunscreen (drawn black), darts (the board is lost).
- This batch: rows for 66 objects; 11 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1054 objects, 14955 parts, **1004 named, 6842 details** (rule and eye); 547 objects
  with rows; 161 shards, 166148 wires, 19889936 bytes. Excluded so far: 97. k.objects: 2039 objects.
- catalog: worlds 6 shards 647 vocab 17502; 0 errors, 0 warnings. npm test 2168 pass, 0 fail.

## R3.1 naming, batch 11 (2026-11-13): Mulberry objects 901 to 1000 of 1,151 looked at

- Looked at: the Mulberry objects 901 to 1000 (in shard order) on contact sheets of 20 at 300 px. Playground, toys, money, music instruments, plants and trees, science. Science is mostly ideas and adjectives (bendy, float, friction, gravity, magnetic, opaque) and diagram parts (Earth crust, mantle, cores): excluded. Sand pit and water table are drawn black.
- This batch: rows for 47 objects; 29 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1025 objects, 14545 parts, **1092 named, 6652 details** (rule and eye); 594 objects
  with rows; 157 shards, 161264 wires, 19310561 bytes. Excluded so far: 126. k.objects: 2010 objects.
- catalog: worlds 6 shards 643 vocab 17498; 0 errors, 0 warnings. npm test 2139 pass, 0 fail.

## R3.1 naming, batch 12 (2026-11-13): Mulberry objects 1001 to 1080 of 1,151 looked at

- Looked at: the Mulberry objects 1001 to 1080 (in shard order) on contact sheets of 20 at 300 px. Science and astronomy, sport accessories, garden tools, workshop tools (objects 1001 to 1080). Adjectives and ideas (silence, smooth, transparent, waterproof) and game events are excluded. Planets get a name only for a plain disc; banded ones mostly stay partN.
- This batch: rows for 44 objects; 12 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1013 objects, 14378 parts, **1158 named, 6574 details** (rule and eye); 638 objects
  with rows; 155 shards, 159422 wires, 19091671 bytes. Excluded so far: 138. k.objects: 1998 objects.
- catalog: worlds 6 shards 641 vocab 17494; 0 errors, 0 warnings. npm test 2127 pass, 0 fail.

## R3.1 naming, batch 13 (2026-11-13): Mulberry objects 1081 to 1151 of 1,151 looked at

- Looked at: the Mulberry objects 1081 to 1151 (in shard order) on contact sheets of 20 at 300 px. Workshop tools, air, rail, road, space and water transport, stationery (objects 1081 to 1151): the last Mulberry objects. Vehicles name by wheels, windows, body; several-layer vans and trucks stay partN where numbers overlap.
- This batch: rows for 49 objects; 11 objects moved to `sources/mulberry/excluded.tsv` (R3.2).
- Mulberry now: 1002 objects, 14202 parts, **1237 named, 6520 details** (rule and eye); 687 objects
  with rows; 154 shards, 157504 wires, 18863450 bytes. Excluded so far: 149. k.objects: 1987 objects.
- catalog: worlds 6 shards 640 vocab 17496; 0 errors, 0 warnings. npm test 2116 pass, 0 fail.

## R3.1 and R3.2 done (2026-11-13): every OpenMoji and Mulberry object looked at; Mulberry cleaned

**What was looked at.** All 1,265 objects of the two sources, each one on a labelling picture (parts outlined and
numbered, 300 px) on 63 contact sheets of 20: the 114 OpenMoji objects (6 sheets) and the 1,151 Mulberry objects
(57 sheets). I read every sheet once. **What was not looked at:** the pictures after naming (the names were not
checked a second time against the drawings; the names test checks only that each row names an existing part); the
small blue numbers of rule-made details were mostly too small to read at this size, so a stroke that is a real part
(a mouth, a handle drawn as a line) was named only in a few clear cases and otherwise stays a detail; the previews
of the 1,002 kept Mulberry objects were not looked at again after the exclusions.

**Naming (R3.1).** By rule first (strokes, and black shapes with the box of a filled part: `kind=detail`), then by eye,
only when sure:

| Source | Objects | Parts | Named (`named=model`) | Details | Objects with a named part |
| --- | --- | --- | --- | --- | --- |
| OpenMoji | 114 | 1,322 | 153 (12%) | 652 | 78 |
| Mulberry | 1,002 | 14,202 | 1,237 (9%) | 6,520 | 687 |
| (Noto, Round 2) | 811 | 10,152 | 2,027 (20%) | 748 | 680 |

Of the parts that are not details, 23% (OpenMoji) and 16% (Mulberry) have a name. What kept parts unnamed: two
numbers on one place (a fill and its shade), drawings made of many like pieces (leaves, facets, stripes, keys), food
on plates, and scenes. Usually one to three names an object: the main body and the clear attachments (wheels,
handle, lid, cap, spoon, leaves).

**Cleaning (R3.2).** `sources/mulberry/excluded.tsv`: **149 names** with a reason, skipped by
`tools/import/mulberry.mjs`: 118 that are not one recognisable thing (22 groups of things, 13 ideas, 7 adjectives,
12 actions and activities, 8 places drawn by a symbol convention, parts pointed at with an arrow, sizes and
measures, kinds of programme, events) and 31 that do not survive the conversion (11 drawn black: lager, orange,
pumpkin, sunscreen, sand pit …; the rest are loose lines or pieces: wire, wool, tea towel, darts, bubble wrap).
**Final count: 1,002 Mulberry objects; k.objects has 1,987 objects** (60 hand-written + 811 + 114 + 1,002), 306
shards, 303,505 wires, 36,660,352 bytes; previews 8.3 MB. This is below the 2,000 target by 13.
Kept on purpose, for the reviewer to decide: the 50 club football kits (Q16); objects where a small picture of the
source (a cow, a chicken, a pig) or a hand sits next to the thing (milk, lamb, ham, deodorant).
OpenMoji: nothing excluded (no exclusion file was asked); weak as things: barcode, gps, intestine.

npm test: 2,117 pass, 0 fail (one test added: names of Mulberry and OpenMoji parts, details by rule).

## R3.3 (2026-11-13): four hand-written cores: k.space, k.animals, k.body, k.food

Source `hand-core 1`, CC0-1.0. Written from compact tables through a throwaway formatter (not committed; the `.sop`
files are the source), as in Rounds 1 and 2. Every fact was written from what I know a child's encyclopedia states;
none was looked up (no source is reachable) and a key was left out wherever I was not sure or animals or foods of
one name differ.

| World | Types | Facts | Wires | Shards | Bytes | With a `drawing` |
| --- | --- | --- | --- | --- | --- | --- |
| `k.space` | `body`, `kind` | 25 bodies (Sun, 8 planets, Pluto, 9 moons, Halley's Comet, 3 stars, 2 galaxies), 8 kinds | 48 | 3 | 6,783 | 18 |
| `k.animals` | `animal` | 156 animals (67 mammals, 35 birds, 13 fish, 9 reptiles, 4 amphibians, 28 invertebrates) | 294 | 5 | 46,944 | 113 |
| `k.body` | `part`, `sense` | 53 parts, 5 senses | 112 | 1 | 12,168 | 5 |
| `k.food` | `food` | 154 foods | 254 | 5 | 33,290 | 123 |

- **Schemas** (version 1 each; 29, 22, 18 and 16 matrix wires incl. words): closed shared types, enums for classes,
  coverings, diets, kinds, colours (the 11 colour names of `k.objects`), `many=true` for covering, sound, habitat,
  eats, can, colour, comes_from, eaten, does.
- **Joins by name, no imports:** `drawing=<name of a k.objects object>` on a fact (259 in all; `ladybird` →
  `"lady beetle"`, `grape` → `grapes`, `Sun` → `sun`). A drawing that shows something else under the same name is
  not joined (the metal `nail`, the tin of `tuna` for the fish, the bird for turkey meat, the heart shape for the
  organ). Names equal to `k.commonsense` things (fish, bird, dog, cat, sun, moon, star) join there by value.
- **Left out on purpose:** legs of kangaroo, monkey, apes, seal, walrus, octopus, snail; diet of dog, squirrel,
  hedgehog, bat, parrot and others where books differ; coverings of insects; colours of most dishes; distances,
  diameters and temperatures in space. Moon counts of the giant planets are `moons_about` (Jupiter 95, Saturn 270,
  Uranus 28, Neptune 16, as known in 2025), exact `moons` only for 0, 1, 2 and Pluto's 5 (Q18).
- **Tests:** `tests/k.{space,animals,body,food}.questions.jsonl` (15 + 15 + 13 + 14 questions, each world with one
  application fact that must be accepted), `tests/k.cores.test.mjs` (every `drawing` is an object of `k.objects`;
  150 animals and foods; planets numbered 1 to 8 by order and by size; `orbits`, `in`, `part_of`, `inside`, `organ`,
  `comes_from` name things that exist).
- **Numbers:** catalog 10 worlds, 654 shards, vocab 17,811 words; every new shard loads in under 15 ms; 0 errors,
  0 warnings. npm test 2,183 pass, 0 fail (108 s).
- Questions Q17 (the `drawing` join), Q18 (approximate numbers), Q19 ("cannot").

## R3.4 (2026-11-13): the gallery page

- `docs/gallery.html`: every `k.objects` object with its preview (`loading="lazy"`), a search box (every word of
  the text must be in the name), a source filter with counts, and under each picture the name, the source of the
  drawing, the licence of its shard and "n of m parts named". Linked from `docs/index.html`.
- It reads `docs/worlds/k.objects/preview/objects.json`, written by `tools/render-svg.mjs` with the previews
  (`objectList`: name, file, shard, source = the first `core.source` of the object fact, licence = the `# license:`
  line of its shard, parts, named), sorted by name; the existing "previews are up to date" test covers it.
- `tests/gallery.test.mjs`: the list has every object once, each picture exists, sources and licences are known
  ones; the page's own search function is run on the list (house and lighthouse for "HOUSE", 60 hand-written
  objects all CC0-1.0).
- Checked in headless Chrome against the local `docs` folder, served under the path `/sop-knowledge-worlds/` as on
  GitHub Pages (github.io itself is not reachable): the page shows "1987 of 1987 objects" and 1,987 figures; only 49
  pictures are fetched at first (lazy) and more on scrolling; all 1,987 picture addresses answer 200; typing "HOUSE"
  leaves 7 objects (house, lighthouse, ...), all drawn; the source filter lists the four sources with their counts
  and "hand-core 1" leaves 60; no script errors, no request outside the site (only the browser's own favicon.ico,
  404); 7 columns at 1200 px, 2 at 400 px, no sideways scrolling; the link on `index.html` resolves to the gallery.
  All addresses are relative; no build step, no external script, font or style.
- `objects.json` is deterministic: two runs of `tools/render-svg.mjs` into empty folders give the committed bytes;
  rebuilding the catalog gives no diff.
- Looked at by eye: three screenshots (the top at 1200 px in the first session; the top and the bottom at 400 px).
  Not looked at: the 1,987 pictures in the gallery one by one (they are the previews already published), other
  browsers than Chrome, the page on github.io.
- Numbers: 1,987 objects in the list (hand-core 60, noto-emoji 811, openmoji 114, mulberry 1,002); `objects.json`
  355,672 bytes; `gallery.html` 3,968 bytes.
- npm test: 2,185 pass, 0 fail (127 s), on the committed tree.

## Round 3 report (2026-11-13)

**Done, in order:** R3.1 (Q15, then the naming pass: 13 batches, one commit each), R3.2 (with the batches; summary
commit ed11f25), R3.3, R3.4.

**Worlds now** (sopworld 0.15.0 at 782cd0c; 0 errors, 0 warnings; catalog 10 worlds, 654 shards, vocab 17,811 words;
`docs/worlds` 53 MB):

| World | Shards | Wires | Bytes | What | Terms |
| --- | --- | --- | --- | --- | --- |
| k.commonsense | 1 | 30 | 3,963 | 15 things, 4 soft rules | CC0-1.0 |
| k.objects | 306 | 303,505 | 36,660,352 | 1,987 drawable objects (60 hand-written, 811 Noto, 114 OpenMoji, 1,002 Mulberry); 3,417 imported parts named, 7,920 details | CC0-1.0; Apache-2.0 AND Unicode-3.0; CC-BY-SA-4.0 |
| k.words | 318 | 28,951 | 5,610,059 | 10,471 words, 26,116 senses | WordNet licence |
| k.geo | 13 | 3,473 | 630,063 | 238 countries by common short name, 872 cities, 1,074 rivers, 627 mountains, 216 ranges | public domain; ODbL-1.0 |
| k.units | 1 | 96 | 12,585 | 8 quantities, 44 units | CC0-1.0 |
| k.time | 1 | 68 | 7,587 | months, weekdays, seasons, durations | CC0-1.0 |
| k.space | 3 | 48 | 6,783 | 25 bodies, 8 kinds | CC0-1.0 |
| k.animals | 5 | 294 | 46,944 | 156 animals | CC0-1.0 |
| k.body | 1 | 112 | 12,168 | 53 parts, 5 senses | CC0-1.0 |
| k.food | 5 | 254 | 33,290 | 154 foods | CC0-1.0 |

**Objects and named parts per source** (from `preview/objects.json`; a part counts as named when its name is not
`partN`):

| Source | Objects | Objects with a named part | Parts | Parts named |
| --- | --- | --- | --- | --- |
| hand-core 1 | 60 | 60 | 353 | 353 |
| noto-emoji 99701e0 | 811 | 668 | 10,152 | 2,027 |
| openmoji 3e01de5 | 114 | 78 | 1,322 | 153 |
| mulberry fa94a93 | 1,002 | 687 | 14,202 | 1,237 |
| all | 1,987 | 1,493 | 26,029 | 3,770 |

The other worlds have no drawable objects; their catalog totals are 654 shards, 336,831 wires, 43,023,794 bytes.

**Looked at, as the entries above say:** every one of the 1,265 OpenMoji and Mulberry labelling pictures, once, on
63 contact sheets of 20 at 300 px (R3.1, R3.2); the gallery in headless Chrome (counts, search, source filter, lazy
loading, all picture addresses) and three screenshots of it (R3.4). **Not looked at:** the named pictures a second
time; the previews of the kept Mulberry objects after cleaning; most of the small numbers of rule-made details; the
1,987 gallery pictures one by one; the gallery on github.io or in another browser; the previews of the Noto objects
(unchanged this round). The facts of the four cores were not checked against any book or site (none is reachable):
they are what I am sure a child's encyclopedia says.

**Below target:** k.objects has 1,987 objects, 13 under 2,000, after 149 Mulberry exclusions.

**What SOP Lang could not say, or only with a workaround:** an approximate number (two keys, Q18); "cannot" (a
missing value of a repeated key is not a no, Q19); a checked link to a fact in another world's shard (a name key
and a test, Q17); "a tomato is a vegetable in the kitchen and a fruit for a botanist" (two keys, `kind` and
`botanically`); a count that depends on age (`count` and `child_count`).

**Open questions** (`questions.md`, none blocking): Q16 (keep the 50 football kits of Mulberry?), Q17 (a name key
as the join from a fact to its drawing), Q18 (how to say an approximate number), Q19 (how to say "cannot").

**Not fetched, as before:** ConceptNet, Quick, Draw!, Wikidata (network: GitHub, npm and pip only).

**Tests:** npm test 2,185 pass, 0 fail (127 s) at 7da94f4.

## Round 4, answers Q16 to Q19 applied (2026-11-13)

- **Q16:** one football kit stays, named `"football kit"` (Mulberry's "football kit blank": a white shirt and blue
  shorts, looked at next to a club kit before choosing). `sources/mulberry/renamed.tsv` (Mulberry name, object name) is
  read by `tools/import/mulberry.mjs`; the club kits are rows of `excluded.tsv`. Mulberry has 45 football kits, not
  50 as I wrote in Q16: **44 excluded**, 1 kept. Their 68 rows left `part-names.tsv`.
- **Q17:** nothing to change (`drawing=<object name>` stays); the rule is now in AGENTS.md.
- **Q18:** AGENTS.md rule 10 (`_about` suffix, never both keys). `k.space`: a hard rule refuses a body with both
  `moons` and `moons_about`; a test checks every `_about` key of the four cores.
- **Q19:** `k.animals.animal.cannot` (many); `cannot=fly` on penguin, ostrich, emu (the three flightless birds the
  world has; there is no kiwi bird in it). A hard rule refuses the same verb in `can` and `cannot`. Question an-16.
- Numbers: Mulberry 958 objects, 13,498 parts (1,167 named, 6,334 details), 149 shards. **k.objects: 1,943 objects**,
  301 shards, 296,943 wires, 35,854,358 bytes. Catalog: 10 worlds, 649 shards, vocab 17,769 words; 0 errors,
  0 warnings. npm test 2,143 pass, 0 fail (141 s).
- Looked at: the previews of "football kit blank" and of one club kit. Nothing else.

## R4.1 (2026-11-13): audit of the model's part names

- **Tool:** `tools/audit-part-names.mjs` (seeded sample; `--all <source>` for every named part of a source; `--only`)
  and `renderHighlighted` in `tools/render-svg.mjs`: the object as drawn, and next to it the object faded with only
  the one part in full colour and outlined, the name underneath.
- **Sample:** seed 4, 200 named parts of the 3,347 at f33df47: at least 30 a source, the rest in proportion:
  Noto 100 of 2,027, OpenMoji 30 of 153, Mulberry 70 of 1,167. Looked at all 200 on 17 contact sheets of 12
  (408 px a pair). The sample with every verdict is `sources/part-names-audit.tsv`.

| Source | Sampled | Right | Wrong | Unclear | Wrong rate |
| --- | --- | --- | --- | --- | --- |
| Noto Emoji | 100 | 86 | 11 | 3 | **11%** |
| OpenMoji | 30 | 30 | 0 | 0 | 0% |
| Mulberry | 70 | 66 | 1 | 3 | 1.4% |
| all | 200 | 182 | 12 | 6 | 6% |

- **What was wrong.** Nearly always the same mistake: the name of the whole went to a layer under or over it. Noto
  draws a thing as a dark base shape with the lit shape on top, so `ball`, `fruit`, `sign`, `band`, `left_cherry` sat
  on the shade (softball, stop sign, yen banknote, cherries); dark gaps between columns were named columns (bank,
  classical building); a thin edge was named a jet (shower), a small mark a claw or a symbol (lobster, money with
  wings), the dial ring `centre` (compass), the tip of a straw `straw` (beverage box). Mulberry: `base` of lamp was
  one facet of the base.
- **Noto is above 10%, so all its names were looked at again:** all 2,027 named parts, each as a small highlight
  picture (156 px, number and name underneath), on 43 contact sheets of 48. Verdicts: **1,932 right, 57 wrong
  (2.8%), 38 unclear**. The first sample overstated the rate (11 of 100 against 57 of 2,027); the wrong names
  cluster in a few objects. Fixes in `sources/noto-emoji/part-names.tsv`, each decided on a labelling picture and,
  where a name moved to another part, checked on a highlight picture of that part:
  - 28 names moved to the right part: `ball` (baseball, basketball, softball, american football, rugby football),
    `fruit` (strawberry, tomato), `sign` (stop sign), `sun` (sunrise, sunrise over mountains), `band` (the four
    banknotes), `left_cherry`, four jets of the shower; or the part renamed to what it is: `head` → `eye` (guide
    dog), `body` → `head` (boar), `handle` → `spoon`, `stem` → `glass` (ice cream), `pupil` → `eye` (hamsa),
    `centre` → `dial` (compass), `stripe1`, `stripe2` → `left_panel`, `right_panel` (safety vest); one name added
    (`mountains`);
  - 29 names removed (no part is clearly the thing): columns of bank and classical building, body and claws of
    lobster, body of spider, squid, snake, T-Rex, sauropod, head of deer, hedgehog, hammer, hammer and wrench, and others.
  - The 38 unclear ones stay as they are (a part of the right thing whose extent is odd: the lower half of a plate,
    the belly of a bat named body, a wing drawn as a squiggle).
- **Check after the fixes:** a second seeded sample of Noto (seed 5, 100 of the 1,999 names), looked at on 9 sheets:
  96 right, **0 wrong**, 4 unclear.
- Mulberry: the lamp's `base` row removed (no single part is the base). OpenMoji: nothing to fix.
- **Not looked at:** the Mulberry and OpenMoji names outside the sample (1,097 and 123 names); the unnamed parts
  (whether a part that should have a name lacks one); in the all-Noto pass the pictures are small, so a name on a
  very small part (an eye, a button) was judged by its place only.
- Numbers: Noto 1,999 named parts (was 2,027), 666 objects with a named part; Mulberry 1,166; OpenMoji 153; wires
  unchanged (296,943), k.objects 35,853,917 bytes. Catalog 10 worlds, 649 shards, vocab 17,764 words; 0 errors,
  0 warnings. npm test 2,144 pass, 0 fail (150 s).

## R4.2 (2026-11-13): coverage of common things; `MISSING.md`

- **Tool:** `tools/coverage.mjs` (deterministic; `tests/coverage.test.mjs` with a made-up fixture, and "MISSING.md
  on disk is what the tool gives" when the raw files are present). It reads the frequency list (the word itself, in
  list order, no inflection), WordNet 3.1 (`index.noun`, `data.noun`, `noun.exc`, `index.sense`) and the object names.
- **The rule** (top of the tool): a noun lemma of at least three letters; noun is its main use (WordNet's tagged
  counts of its noun senses are at least those of its other parts of speech); it names a physical thing (its first
  noun sense, or the senses with at least half of its noun counts, are hyponyms of physical object, living thing,
  food or artifact); the sense kept is the physical sense with the most counts; that sense is filed by WordNet under
  animals, artifacts, food, natural objects, plants or the top concepts, and is not a proper name; the word is not
  the regular plural of a more frequent noun; no sense of it is marked offensive.
- **What the rule alone did not do, and what I did about it (Q20).** "Living thing" holds every person (man,
  father, guy: 2,298 words before the 1,500th thing) and "physical object" every place: both dropped by the
  lexicographer-file condition. WordNet also has a noun for most given names and many verb forms (john, sam, felt,
  spoke), and many nouns under "artifact" or "object" have no shape of their own (system, piece, equipment) or are
  rooms and scenes (kitchen, garden). I read the list (about 2,200 candidate words, with the start of each gloss) and
  wrote **`sources/coverage/not-things.tsv`: 695 words with a reason** (123 names, 103 verb forms and adjectives,
  283 general words and parts, 70 rooms and scenes, 69 rare WordNet words that are frequent as something else, 14
  kinds, 9 plurals, 24 left out of a general library); 633 of them fall before the 1,500th thing. This is a
  reading by a language model, not a rule; body parts (hand, head, eye) are outside the four roots and not in the list.
- **Coverage before Round 4's drawings** (1,943 objects): of the **1,500 common things, 522 have a drawing of their
  name (34.8%)**; 978 do not. Of those 978, a WordNet synonym has a drawing for 59 and the direct hypernym for 156
  (after the checks of R4.4, see there); 763 have no drawing at all.
- "Has a drawing" compares names only (the word, or its plural, with an object name, lower case). It does not check
  that the drawing shows the sense kept (the drawing `bank` is a building; the sense kept is the river bank). **Not
  looked at: the 522 drawings against the senses.**
- `docs/worlds/k.objects/MISSING.md`: the rule, the numbers, and the 978 words most frequent first with rank, link
  and WordNet's gloss. The page is under CC BY-SA 4.0 (the order is from FrequencyWords, the glosses from WordNet;
  both named on the page). Top of the list: gun, street, building, prison, wall, jail, island, suit, hole, restaurant.
- Numbers: catalog 10 worlds, 649 shards, vocab 17,764 words; no shard changed. npm test 2,148 pass, 0 fail (138 s).

## R4.3 batch 1 (2026-11-13): 34 of the 60 most frequent missing things, hand-written

- **Which 60.** The first 60 words of `MISSING.md` (as of R4.2) that have no drawing and no WordNet link, in list
  order: gun, street, building, prison, wall, jail, island, suit, hole, restaurant, tape, meat, bullet, sword, pool,
  fan, path, roof, sugar, hill, painting, airport, map, horn, temple, grave, trap, juice, screen, valley, library,
  tank, rope, theater, mask, shoe, museum, lane, orange, cave, sauce, doorbell, cage, cliff, pipe, pit, frame,
  underwear, shell, fort, alley, pole, whiskey, string, corn, warehouse, tube, pan, throne, pork. One word of that
  stretch is passed over: theatre (the same WordNet sense as theater; it gets a word in R4.4).
- **This batch** (grouped by kind, not by rank): shards `places` (street, building, prison, jail, restaurant,
  airport, temple, library, theater, museum, fort, warehouse, wall, roof, lane, alley, path, pool), `land` (island,
  hole, hill, valley, cave, cliff, pit, grave), `food` (meat, sugar, juice, orange, sauce, whiskey, corn, pork).
  Named parts with primitive shapes, kinds for repeated parts (window, bar, pillar, merlon, book, rung …), relative
  positions, boxes, z, typical colours; hand-chosen coordinates through a throwaway formatter that runs the checks
  of the render test before writing (not committed; the `.sop` files are the source), as in Rounds 1 and 2.
- **Looked at:** all 34 previews on three contact sheets (260 px each). Redrawn after the first look: prison (red
  tower roofs made it a castle: grey now), library (books in the windows and an open book on the sign), pit (it
  looked like a bucket: now a rim, a dark depth and a ladder coming out); these three looked at again. Verdict:
  all 34 recognisable with their name next to them; weakest without the name: lane (a brown strip between two green
  blocks), alley, valley, pork (a chop with a bone), street (the road is narrow).
- A theater is drawn as a stage with curtains (the sense kept is the building).
- Numbers: `places` 378 wires / 53,901 bytes, `land` 154 / 19,580, `food` 127 / 16,104. k.objects: **1,977 objects**
  (94 hand-written + 811 + 114 + 958), 304 shards, 297,602 wires, 35,943,502 bytes. Catalog: 10 worlds, 652 shards, vocab 17,930 words;
  0 errors, 0 warnings. Coverage now: 556 of 1,500 with a drawing of their name. npm test 2,182 pass, 0 fail (140 s).

## R4.3 batch 2 (2026-11-13): the other 26 hand-written things; 2,003 objects

- Shard `things`: gun, suit, tape, bullet, sword, fan, painting, map, horn, trap, screen, tank, rope, mask, shoe,
  doorbell, cage, pipe, frame, underwear, shell, pole, string, tube, pan, throne. Same form as batch 1. Words: each
  object's name and plural, and a few other names where the drawing is exactly that (pistol for gun, mousetrap for
  trap, seashell for shell, underpants, whisky, maize, twine, theatre); no word that is the name of another object.
- **Looked at:** all 26 previews on three contact sheets (260 px each), once; none redrawn. All recognisable with
  the name next to them; weakest without it: rope (rings like a target with a loose end), trap (a mousetrap seen
  from above), pole.
- Two drawings do not show the sense `MISSING.md` kept for the word: `shell` is a seashell (the sense kept was the
  ammunition), `frame` is a picture frame (the sense kept was the frame of a pair of glasses). Both are what the
  word names first for a child; the coverage count is by name.
- Four of the 60 already had a drawing under a longer name that the name-based count does not see: sugar ("sugar
  white"), corn ("ear of corn"), pork ("pork chop"), sauce ("sauce tomato"). Found only now, through the `drawing`
  keys of `k.food`; they are drawn again by hand here.
- `k.food`: `drawing=orange` on orange and `drawing=juice` on juice (125 of 154 foods have a drawing; 33,319 bytes).
- Three questions added (`ob-r4-1` to `-3`: bars of a jail, what is above the body of a restaurant, the colours of
  a sword's blade).
- Numbers: `things` 471 wires / 62,005 bytes. **k.objects: 2,003 objects** (120 hand-written + 811 + 114 + 958), 305
  shards, 298,073 wires, 36,005,450 bytes. Catalog: 10 worlds, 653 shards, vocab 18,022 words; 0 errors, 0 warnings.
- **Coverage after R4.3:** 582 of the 1,500 common things have a drawing of their name (38.8%; 522 before): the 60
  new drawings. npm test 2,211 pass, 0 fail (139 s).

## R4.4 (2026-11-13): synonyms and direct hypernyms to drawings

- `tools/coverage.mjs` now also writes the shard `k.objects/shards/words-wordnet` (source `wordnet 3.1`, licence
  WordNet-3.0, script `tools/coverage.mjs`): one `core.word text=<word> means=<object> of=k.objects.object.name` per
  common thing without a drawing whose WordNet synonym (ids `k.objects.wordnet.same.<word>`) or direct hypernym
  (`k.objects.wordnet.kind.<word>`) has one. **250 wires, 30,238 bytes: 63 synonyms** (couch → sofa, cellphone →
  "mobile phone", theatre → theater) **and 187 hypernyms** (puppy → dog, cathedral → church, skyscraper → building).
- **No guessed links, two guards.** (1) By rule: the other word must be kept by the same rule in that same synset
  (its physical sense with the most counts). This alone removed about 80 of the first 315 links (iris → flag, theater →
  house, penitentiary → pen, tire → ring). (2) By looking: I read all the links and looked at the drawings whose
  name can mean two things (26 previews on one sheet: construction, slug, motor, cereal, hose, plant, station,
  fabric, mints, poultry, bush, ring, toilet, tap, …); **`sources/coverage/not-links.tsv` refuses 41 links** with a
  reason: the drawing of that name is another thing (building → "construction", a roadworks barrier; wheat →
  "cereal", a bowl of breakfast cereal; stocking → "hose", a garden hose) or the word mostly means something else
  than the sense WordNet's counts keep (blade, grinder, bike, barrel, hammock, hydrant).
- **Not looked at:** the other drawings behind the links (the 250 words point to 159 distinct objects; about 135
  of them not looked at): for them I relied on the
  name and on the sense guard. A hypernym link gives the picture of the kind, not of the thing (every shop for
  bakery, pharmacy, bookstore; "herb" for basil, parsley, dill); a host can tell the two by the id.
- 35 of the 250 words were already a keyword of some object (emoji keywords: bike, store, photo, globe …); the
  WordNet word is added next to those.
- The scope is the 1,500 common things only (the list that was read); words further down the frequency list get
  no link.
- **Coverage of the 1,500 common things:**

| | Before Round 4 (R4.2) | After R4.3 | After R4.4 |
| --- | --- | --- | --- |
| a drawing of that name | 522 (34.8%) | 582 (38.8%) | 582 (38.8%) |
| a word to a synonym's drawing | 0 | 0 | 63 (4.2%) |
| a word to the hypernym's drawing | 0 | 0 | 187 (12.5%) |
| reach a drawing | 522 (34.8%) | 582 (38.8%) | **832 (55.5%)** |
| nothing | 978 | 918 | 668 |

  R4.4 adds 250 words (16.7 points). Had the links been made before the 60 drawings, they would have been 215.
- Tests: `tests/coverage.test.mjs` (the shard from the fixture; the shard on disk is what the tool gives; every
  word names an object and is not itself an object name; puppy → dog).
- Numbers: k.objects 2,003 objects, 306 shards, 298,323 wires, 36,035,688 bytes. Catalog: 10 worlds, 654 shards,
  331,649 wires, 42,399,192 bytes, vocab 18,102 words; 0 errors, 0 warnings. npm test 2,213 pass, 0 fail (159 s).

## Round 4 report (2026-11-13)

**Done, in order:** answers Q16 to Q19 (f33df47), R4.1 (bef5cc9), R4.2 (a09dde9), R4.3 in two batches (517b821,
1f12433), R4.4 (this commit).

**R4.1 audit error rates** (200 named parts, seed 4; `sources/part-names-audit.tsv`): Noto 11 wrong of 100 (11%, 3
unclear), OpenMoji 0 of 30, Mulberry 1 of 70 (1.4%, 3 unclear). Noto was above 10%, so all its 2,027 names were
looked at: 57 wrong (2.8%), 38 unclear; 28 moved or renamed, 29 removed; a second sample of 100 after the fixes: 0
wrong, 4 unclear. Named parts now: Noto 1,999, OpenMoji 153, Mulberry 1,166.

**Coverage of the 1,500 common things:** 522 with a drawing before (34.8%); 582 after the 60 hand-written objects
(38.8%); 832 reach a drawing with the WordNet words (55.5%); 668 have nothing (`MISSING.md`).

**k.objects:** 2,003 objects (120 hand-written, 811 Noto, 114 OpenMoji, 958 Mulberry after the football kits),
306 shards. The 2,000 target is passed.

**Looked at:** the 200 audit pictures (17 sheets); all 2,027 Noto names as small highlight pictures (43 sheets);
about 50 labelling and highlight pictures while fixing; the second Noto sample (9 sheets); the 60 hand-written
previews (6 sheets, three objects twice); 26 drawings behind doubtful links; two football kits. **Not looked at:**
Mulberry and OpenMoji names outside the audit sample; whether unnamed parts should have a name; the 522 drawings
that match a common thing by name against the sense kept; most drawings behind the WordNet links; the gallery page
with the new objects (its test passes; no browser run this round).

**Judgement that is mine, not a rule:** the 695 words of `not-things.tsv` and the 41 links of `not-links.tsv`
(Q20); which of the first missing words were passed over as not drawable (they are in `not-things.tsv`).

**What SOP Lang could not say, or only with a workaround:** whether a `core.word` link is "the same thing" or
"the kind of thing" (said by the id and by the order in the shard; `core.word` has no standard key for it). Q21.

**Open questions:** Q20 (is the list of common things right as built), Q21 (a key for the kind of a word link).

## R5.1 (2026-11-13): stand-in facts (Q21); the sense check of the 582 name-matched drawings

- **Q21.** New type `k.objects.stand_in` (`name` identity, `drawing` required; exported; schema version 3) and shard
  `stand-ins-wordnet`: the **187 hypernym links** are now `k.objects.stand_in name=puppy drawing=dog` (ids
  `k.objects.wordnet.kind.<word>` as before, source `wordnet 3.1`); `words-wordnet` keeps only the **63 synonyms** as
  `core.word`. The vocabulary still finds the 187 words (the catalog reads identity keys). Question `ob-r5-1`.
- **Sense check.** All 582 drawings that match a common thing by name, each at 160 px with the word and WordNet's
  gloss of the sense kept underneath, on 20 contact sheets of 30; all 20 sheets read. Verdicts in
  `sources/coverage/sense-check.tsv` (word, drawing, verdict, note, instead): **523 right, 29 wrong sense, 30 unclear.**
  - **Wrong sense (29):** bank, plant, cake, plate, chocolate, wing, chip, frame, hammer, shell, turtle, glove, tuna,
    hose, drone, cereal, dolphin, tablet, peacock, cruiser, cracker, lorry, stretcher, tram, cot, lollipop, steamer,
    barbeque, headstone. In all 29 the drawing shows a common meaning of the word (often the commoner one: Q22), so
    **no object was renamed**; the 29 list entries no longer count as drawn by that name.
  - For 7 of them an object of another name draws the sense kept (column `instead`; these 7 drawings were looked
    at on one sheet): plant → factory, chocolate → "hot chocolate", cruiser → "police car", tram → "aerial tramway",
    cake → soap, glove → "baseball glove", lollipop → "ice lolly". They count as drawn. The other **22 count as
    missing** ("other sense" in `MISSING.md`) and get no WordNet link (the word already finds the object of its name).
  - `bank`, `shell`, `frame`: wrong sense, kept names (a bank building, a seashell and a picture frame are common),
    entries missing; the river bank and the artillery shell are for R5.3.
  - **Unclear (30):** the sense is the meat and the drawing the animal or the reverse (chicken, beef, lamb, lobster,
    octopus, squid); the sense is the tree and the drawing its fruit (almond, pistachio, grapefruit, mango, kiwi);
    a near sense (toilet, bath, castle, hut, ribbon, visor, loudspeaker); a drawing that is hard to read (pocket,
    wire, necklace, berry, parachute, brooch, pate, lizard, freezer, dishwasher, sausage, dvd). They still count.
  - A vegetable or flower whose sense is "the plant" and whose drawing is the part one knows it by counts as right.
- `tools/coverage.mjs`: reads `sense-check.tsv` (and `not-drawable.tsv` for R5.3); `--limit N` prints the numbers
  for a longer list without writing. A test checks that the table has exactly one row for every name match.
- **Coverage of the 1,500 common things after the sense check:** 560 with a drawing in the sense kept (37.3%; it
  was 582 by name: minus 29, plus 7), 63 by a synonym, 187 by a stand-in: **810 reach a drawing (54.0%; 832
  before)**; 690 nothing.
- **Not looked at:** nothing new besides the 582 + 7 drawings; the size of a cell is 160 px, so small details were
  not judged. The stand-in and synonym drawings are R5.2.
- Question Q22 (should the kept sense be corrected by hand where WordNet's counts keep a rare one).
- Numbers: `stand-ins-wordnet` 187 wires / 19,889 bytes; `words-wordnet` 63 / 7,954. k.objects 2,003 objects, 307
  shards, 298,323 wires, 36,033,293 bytes. Catalog: 10 worlds, 655 shards, 331,649 wires, 42,396,797 bytes, vocab
  18,104 words; 0 errors, 0 warnings. npm test 2,217 pass, 0 fail (182 s).

## R5.3 batch 1 (2026-11-13): 25 hand-written things; pole, hole, lane, valley redrawn

- **Which.** The next words of `MISSING.md` (after R5.1) with no drawing and no WordNet link, in list order: motel,
  rifle, statue, pub, radar, nest, vodka, wagon, casino, tire, lance, pillow, dough, bin, embassy, cabinet, collar,
  cannon, ginger, rod, brandy, sweater, plug; and, for `bank` and `shell` (R5.1), **`"river bank"`** and
  **`"artillery shell"`**, which `sense-check.tsv` names as the drawings of the sense kept (column `instead`).
- **Passed over** in that stretch (ranks 33 to 311), not drawn: plate (the sense kept is the base of baseball), wing
  (of an aeroplane), chip (a wooden float), frame (of eyeglasses), hammer (of a gunlock), turtle (a sweater): "other
  sense" words whose kept sense is rare or a part (Q22); bike (the sense kept is the motor bike; the link to
  motorcycle was refused in R4.4), mall (a pedestrian walk), needle (of a conifer), barrel (of a gun), vault (a
  burial chamber): the sense kept is not the common one or is a part or a room; jewelry, aircraft: general words
  for many kinds of thing; pistol: the drawing `gun` already has the word `pistol`, which the count by name does not see.
- Shards: `things-2` (16 objects), `places-2` (4), `land-2` (1), `food-2` (4). Same form as before: named parts
  with primitive shapes, kinds for repeated parts, relative positions checked by the render test, typical colours.
  Words: the name and its plural, and tyre, waggon, tavern, pullover, stopper, riverbank, cognac.
- **Redrawn** (the reviewer's weakest four): pole (a red and white striped pole with a ball on top, in the ground),
  hole (a brown rim, a dark hole, a mound with a shovel), lane (a narrow track between two hedges and two trees,
  seen along it), valley (two slopes with trees and a house, a river between them, a mountain behind).
- **Looked at:** all 29 previews (25 new, 4 redrawn) on one contact sheet (160 px each, the name underneath).
  Redrawn after the first look: river bank (a dark blue sky read as water: sky removed, the river wider), pillow
  (it looked like a wrapped sweet: now a striped pillow on a mattress, drawn twice), dough (its two folds read as a
  smile). These three looked at again. Verdict with the name next to it: all recognisable; **weakest without the
  name: ginger (yellow lumps), rod, pillow, plug (a bath plug with a chain), radar (a dish on a mast).** The four
  redrawn ones are better than before; valley and lane are still scenes and not things.
- The 23 new name matches have a row in `sense-check.tsv` (right: hand-written for the sense kept).
- The new objects gave six new stand-ins by rule (applejack → brandy, baton → rod, wand → rod, bung → plug, cardigan
  → sweater, trident → lance); trident → lance refused in `not-links.tsv` (three prongs against one point).
- **Coverage of the 1,500 common things:** 585 with a drawing in the sense kept (39.0%), 63 by a synonym, 192 by a
  stand-in: **840 reach a drawing (56.0%)**; 660 nothing.
- Numbers: `things-2` 392 wires / 51,123 bytes, `places-2` 73 / 11,397, `land-2` 44 / 6,096, `food-2` 57 / 8,458.
  **k.objects: 2,028 objects** (145 hand-written), 311 shards, 298,910 wires, 36,113,498 bytes. Catalog: 10 worlds,
  659 shards, 332,236 wires, 42,477,002 bytes, vocab 18,257 words; 0 errors, 0 warnings. npm test 2,242 pass, 0 fail.

## R6.1, R6.2, R6.4 (2026-11-13): `k.faces`, schema and hand-written core; the questions

- **Order.** By the coordinator's instruction Round 6 comes after R5.1 and R5.3 batch 1; the rest of Round 5
  (R5.2, R5.3 batches 2 to 4, R5.4) follows it.
- **Schema** (`docs/worlds/k.faces/schema.sop`, module `k.faces` version 1, no imports): `k.faces.slot` (identity
  style + name: anchor box, draw order `z`, `mirror`, `optional`), `k.faces.variant` (identity slot + name: `style`,
  and the features `shape`, `size`, `length`, `feel` (many), `age` (many), `kind`, `named`), `k.faces.part` and
  `k.faces.point` (the keys of `k.objects.part` and `k.objects.point`, plus `tint`), `k.faces.colour` (of + name:
  `rgb`, `shade`, `natural`), `k.faces.preset`, `k.faces.expression`.
- **Decisions that are mine:**
  - Parts are in the frame of the face (0 to 100), not in a frame of their slot: a face is then just the parts of
    the chosen variants in the draw order of the slots, drawn by the `k.objects` part renderer with no transform;
    the test checks that every part lies inside the box of its slot. Resizing a part is a scale about its box.
  - Slots belong to a style (identity `style` + `name`), because an imported style places its parts elsewhere.
  - `tint` on a part says which face colour fills it (skin, hair, eyes, clothes, and `_shade` for the darker tone:
    a nose is drawn in the shade of the skin, so it shows on every skin). Hats, glasses and earrings keep their own
    colours.
  - `kind` (a free word: ponytail, goatee, "top hat") was added to the features asked: the enumerations alone
    cannot say what a hat or a beard is. The enumerations are exactly the reviewer's.
  - A wink needs one eye only: `one_eye` on the expression (the eye on the viewer's right). Talking is `mouth` +
    `mouth_alt`.
  - The preset's colour keys are `skin`, `hair_colour`, `eye_colour`, `clothes` (`eyes` is the slot key).
- **Core** (style `plain`, `tools/faces-core.mjs`, committed: the coordinates are hand-chosen, curved outlines are
  sampled from an ellipse by the script, so the shards say `script: tools/faces-core.mjs`): 16 slots, **134
  variants** (head 7, ears 6, neck 6, shoulders 8, hair_back 8, hair_front 12, eyebrows 9, eyes 11, nose 8, mouth
  14, cheeks 7, beard 8, moustache 6, glasses 8, hat 9, earrings 7), 45 colours (6 natural skins, 8 natural hair
  colours, 7 natural eye colours), **13 presets** (child, girl, boy, woman, man, old woman, old man, bearded man,
  woman with curly hair, robot, alien, clown, queen), 7 expressions.
- **Renderer** `tools/render-faces.mjs` (uses `renderPart` of `tools/render-svg.mjs`): `composeFace`, `presetFace`,
  `randomFace` (seeded), previews in `docs/worlds/k.faces/preview/` (134 variants alone with the slot box dashed, 13
  presets, 7 expressions on the preset woman, 40 random faces, `index.html`, `faces.json`): 196 files.
- **Looked at:** one sheet of the 13 presets and the 7 expressions (180 px each); one sheet of the 40 random faces
  (180 px); two sheets with all 134 variants alone (130 px, 70 and 64). Verdict: every preset and every one of the
  40 random combinations reads as a face; ears, hair, glasses, beard and hat sit where they should on all seven head
  shapes. Weak points seen: a fringe covers the eyebrows; the `grin` looks like the robot's `grille`; a red mouth
  has little contrast on a red beard; on the box head the pointed and round ears look stuck on; the `long curly`
  hair shows only its side curls behind a wide head. Nothing was redrawn after the look (two box sizes were
  corrected before it, by the script's check). **Not looked at:** every variant on every head shape (only what the
  40 random faces and the presets happen to combine); the expressions on presets other than `woman`; sizes below 130 px.
- **R6.4** (`tests/k.faces.questions.jsonl`, 12 questions, and `tests/k.faces.test.mjs`): "which mouths are there"
  (a list query); "a long face with small eyes and thick eyebrows" → `findVariants` (one sopworld query per wanted
  feature, variants ranked by the number of features matched: `thick arched` before `thick`, `bushy`, `arched`,
  `raised` for thick + arched); "what is the difference between preset A and B" → `presetDifference` (woman / old
  woman: hair colour, glasses, cheeks, …).
- Numbers: k.faces 19 shards, 1,368 wires, 211,471 bytes (largest shard 228 wires, 34,888 bytes). Catalog: 11
  worlds, 678 shards, 333,604 wires, 42,688,473 bytes, vocab 18,381 words; 0 errors, 0 warnings. npm test 2,266
  pass, 0 fail.
- Still to do in Round 6: R6.3 (import; the styles are now JSON definitions in `dicebear/styles`, not in
  `dicebear/dicebear`) and the faces in the gallery.

## R6.3 (2026-11-13): seven DiceBear styles imported into `k.faces`

- **Where the styles are.** `dicebear/dicebear` no longer holds them (its README points to
  `github.com/dicebear/styles`: one JSON definition per style, 78 files, with the licence in each `meta` block and in
  `LICENSE.md`). Cloned at commit 67f54a0 into `sources/dicebear/raw/styles` (git-ignored). `sources/dicebear/SOURCE.md`.
- **Licences checked** (the `meta` block of all 78 definitions printed and read): CC0 1.0 and CC BY 4.0 styles are
  eligible; `avataaars`, `avataaars-neutral`, `bottts`, `bottts-neutral` ("free for personal and commercial use")
  are skipped as unclear; `icons` is MIT but not faces. The importer refuses a definition whose licence is not the
  one written next to its name in `tools/import/dicebear.mjs`.
- **Importer** `tools/import/dicebear.mjs` (test `tests/import.dicebear.test.mjs`: a made-up definition, and "the
  shards on disk are what the importer gives"): a component is a slot of its style, placed where the definition
  places it (nested components too: the eyes inside the head); a variant is a `k.faces.variant` named `"<style>
  <variant>"`; its elements go through `tools/import/svg-parts.mjs` (the Noto converter: at most 14 parts, 32 points
  a polygon, 150 points a variant); a colour taken from the style's skin, hair or clothing list becomes `tint` with
  the first colour of the list as `rgb`; elements on the canvas itself become the slot `head`; `use` elements are
  replaced by what they refer to. The slot box is the bounds of its variants.
- **Imported, with the preview looked at for each** (16 random faces a style at 170 px on two sheets while
  building; the committed 12 a style at 110 px on one sheet; every variant alone at 120 px on 8 sheets):

| Style | Licence | Variants | Left out | Verdict of the look |
| --- | --- | --- | --- | --- |
| cutouts | CC0-1.0 | 38 in 7 slots | 0 | survives; paper-cut faces, all parts in place |
| pixel-art | CC0-1.0 | 132 in 8 slots | 8 beards (mask: a full square) | survives; blocky, every face reads; some long hair covers the sides of the face |
| miniavs | CC-BY-4.0 | 25 in 8 slots | 0 | survives; profile heads |
| personas | CC-BY-4.0 | 41 in 6 slots | 6 empty (hair `bald`, `buzzcut`, beard `shadow`, nose ×3: only strokes or translucent) | survives, but **without noses** |
| micah | CC-BY-4.0 | 40 in 11 slots | 0 | survives; thin strokes are drawn thicker than in the original |
| toon-head | CC-BY-4.0 | 33 in 9 slots | 2 mouths (mask) | survives; the rear hair has a black inner shape that the head covers |
| big-smile | CC-BY-4.0 | 38 in 5 slots | 0 | survives |

  No style had to be dropped. 347 variants, 1,063 parts.
- **What the conversion loses** (seen on the sheets): holes, masks and clips (hence the left-out variants), stroke
  widths (every line is drawn 2 units wide), gradients; curves are polygons. Elements that a definition draws after
  a nested component (micah: two strokes of the beard after the mouth, one of the detached ear) are drawn before it.
- **Features** (`sources/dicebear/features.tsv`, 232 rows, `named=model`): given by me from the 8 sheets of single
  variants, with DiceBear's variant name next to each (the names helped: `bobBangs`, `walrus`); `length` also from
  the `hairLength` tags. **Not named:** 115 variants: the single heads, and pixel-art except its glasses and hats
  (at 16 by 16 pixels a mouth is three squares). Not checked: the features against the drawing at a larger size; a
  second opinion on any of them.
- **Not tried:** adventurer, big-ears, croodles, lorelei, notionists, open-peeps and the other CC0 / CC BY styles
  (large definitions or line drawings with holes); the `-neutral` forms.
- Previews: `docs/worlds/k.faces/preview/` now has 627 files (481 variants alone, 13 presets, 7 expressions, 40 + 84
  random faces, `index.html`, `faces.json`), 3.0 MB.
- Numbers: k.faces 80 shards, 10,182 wires, 1,676,111 bytes (largest: `pixel-art-hair-front`, 1,265 wires, 214,907
  bytes). By style: cutouts 8 shards / 523 wires, pixel-art 9 / 2,663, miniavs 9 / 646, personas 7 / 1,124, micah 12
  / 1,016, toon-head 10 / 1,082, big-smile 6 / 1,760. Catalog: 11 worlds, 739 shards, 342,418 wires, 44,153,113
  bytes, vocab 18,702 words; 0 errors, 0 warnings. npm test 2,271 pass, 0 fail.

## Round 6, gallery (2026-11-13): `docs/faces.html`; Round 6 report

- `docs/faces.html` (a second page, linked from `docs/gallery.html` and `docs/index.html`): whole faces first (the
  presets, the expressions, the random faces of the chosen style), then every variant alone with its slot, its
  features, "named by a model" where that is so, its source and the licence of its shard; search over name, slot and
  features; filters by style and slot. It reads `worlds/k.faces/preview/faces.json` (which now carries the licence of
  each variant). Test in `tests/gallery.test.mjs` (the page's own functions run on the real list).
- **Not looked at:** the page in a browser (no browser run; only its script was run by the test).
- Numbers: catalog 11 worlds, 739 shards, vocab 18,702 words; 0 errors, 0 warnings. npm test 2,272 pass, 0 fail.

**Round 6 report.** Done: R6.1 schema, R6.2 core (134 variants, 16 slots, 13 presets, 7 expressions, 45 colours),
R6.4 questions (fe214ad); R6.3 import of seven DiceBear styles, 347 variants (e8a1c8c); the faces gallery (this
commit). k.faces: 481 variants in 8 styles, 80 shards, 10,182 wires, 1,676,111 bytes.
**Looked at:** presets and expressions (1 sheet), 40 random plain faces (1 sheet), the 134 plain variants alone (2
sheets), random faces of the seven imported styles (2 sheets while building, 1 sheet of the committed ones), the 347
imported variants alone (8 sheets; the first pixel-art sheet before its beards were removed). **Not looked at:** the
faces page in a browser; every variant on every head; imported variants larger than 120 px.
**What SOP Lang could not say, or only with a workaround:** nothing blocked. Two things are conventions that a host
must know and that no rule checks: that the parts of a mirrored slot are drawn twice (`mirror=true` on the slot), and
that a preset's slot keys hold names of variants of the same style (sopworld cannot check a value against the
identity of another type that has two identity keys; `tests/k.faces.test.mjs` does). No question written for
them; said here.

## R5.2 (2026-11-13): the synonym and stand-in drawings looked at; 25 stand-ins removed

- **Looked at:** all 255 links (63 synonyms, 192 stand-ins; 162 distinct drawings), each as the drawing at 160 px
  with "word = drawing" or "word < drawing" and WordNet's gloss of the word underneath, on 9 contact sheets of 30;
  all 9 read. So every drawing behind a link has now been looked at next to the word it serves, not only the about
  135 that R4.4 left.
- **Synonyms:** all 63 kept (couch = sofa, cellphone = mobile phone, tub = bathtub, zucchini = courgette, …). Weak
  but not wrong: palace = castle (a fortress), transporter = car transporter (a small drawing), chute = parachute.
- **Stand-ins removed: 25** (`sources/coverage/not-links.tsv`, each with its reason; 68 rows now):
  - the drawing of the kind shows something too particular: greenhouse, rink, observatory, gazebo, tavern →
    building (a block of flats); warship, shipwreck → ship (a passenger liner); vial → bottle (a wine bottle); gravy
    → sauce (a bottle of red sauce); cauldron → pot (looks like a flowerpot); gable → wall (a brick wall); beret →
    cap (a cap with a bill); lioness → lion (a mane); headset → telephone receiver; nut → seeds (a packet);
    photocopy → photographs (a camera);
  - the word mostly means something else than the sense kept: grill (the thing one cooks on), licorice (the sweet),
    sesame (the seeds), papaya and apricot (the fruit, not the tree), dahl (the dish), arbor (a garden shelter);
  - a flower drawn as a sprig of leaves: buttercup, dandelion → herb.
- **Kept although only the kind is shown** (that is what a stand-in says): morgue, mortuary, clubhouse,
  slaughterhouse, bathhouse, skyscraper → building; bakery, pharmacy, bookstore and nine other shops → shop; basil,
  parsley, rosemary, dill and other herbs → herb; altar, counter → table; bomber → airplane; missile → rocket;
  quill → pen; flask, jug → bottle; chalice → cup; silo → tower; bulldozer → tractor.
- One verdict of R5.1 changed by this look: `pot` is now unclear (the drawing looks like a flowerpot; the sense
  kept is a cooking pot). Sense check now: 522 right, 29 wrong, 31 unclear of the 582, plus the 23 hand-written.
- **Coverage of the 1,500 common things:** 585 drawn in the sense kept, 63 synonyms, 167 stand-ins: **815 reach a
  drawing (54.3%; 840 before this look)**; 685 nothing.
- Numbers: `stand-ins-wordnet` 167 wires. Catalog: 11 worlds, 739 shards, vocab 18,691 words; 0 errors, 0 warnings. npm test 2,272 pass, 0 fail.

## R5.3 batch 2 (2026-11-13): 25 more hand-written things; 2,053 objects

- **Which** (the next words of `MISSING.md` with no drawing and no link, in list order, that can be drawn in the
  sense kept): shotgun, cocktail, ditch, gin, bracelet, violet, armor, portrait, swamp, dice, hawk, pudding, dam,
  salmon, wig, iris, chapel, railway, peg, rum, stove, pumpkin, canyon, pine; and nut (its stand-in was removed in
  R5.2). Shards: `things-2` (+8), `places-2` (+3), `land-2` (+3), `food-2` (+6), `nature-2` (new: hawk, salmon,
  violet, iris, pine).
- **Passed over** in that stretch (ranks 95 to 401), with the reason: the sense kept is not the common one, or is a
  part, a room or a scene: bike, mall, needle (of a conifer), vault, barrel (of a gun), dock (of a court), runway
  (rails), cape (land), balcony (of an auditorium), marina, clip (of cartridges), brake, shutter (of a camera),
  delta, ridge, rack; general words: jewelry, aircraft, sketch; pistol (a word of `gun`); reed, marsh (drawn with
  the swamp: `marsh` is a word of `swamp`); laser and bark: for `not-drawable.tsv` in the last batch.
- **Looked at:** all 25 previews on one contact sheet (160 px, name underneath). Redrawn after the look: canyon (a
  white gap between the cliffs: the sky now reaches the river), peg (its hole sat above the ground). Not looked at
  again after these two fixes. Verdict with the name: all recognisable; **weakest without it: nut (reads as an
  acorn), ditch (a brown stripe with water in a field), hawk (a brown bird on a branch, not clearly a hawk), dam,
  peg (a tent peg).**
- Words: plurals, and armour, breastplate, railroad, "pine tree", die, marsh. Two words dropped because an object
  has that name: cooker, hazelnut.
- New stand-ins by rule from these drawings: falcon → hawk, grog → rum, margarita → cocktail, martini → cocktail,
  trench → ditch, weir → dam (kept; not looked at as links, the drawings are the ones above); refused: stinger →
  cocktail, nog = peg (the words mostly mean something else).
- **Coverage of the 1,500 common things:** 610 drawn in the sense kept (40.7%), 63 synonyms, 173 stand-ins: **846
  reach a drawing (56.4%)**; 654 nothing.
- Numbers: `things-2` 559 wires / 73,115 bytes, `places-2` 135 / 19,851, `land-2` 148 / 19,363, `food-2` 154 /
  21,550, `nature-2` 121 / 15,991. **k.objects: 2,053 objects** (170 hand-written), 312 shards, 299,442 wires,
  36,184,285 bytes. Catalog: 11 worlds, 740 shards, 342,950 wires, 44,223,900 bytes, vocab 18,831 words; 0 errors,
  0 warnings. npm test 2,297 pass, 0 fail.

## R5.3 batch 3 (2026-11-13): 25 more hand-written things; 2,078 objects

- **Which** (next in list order, drawable in the sense kept): saddle, yacht, pod, wheat, finch, hay, robe,
  mattress, supermarket, pier, porch, fortress, jewel, sherry, refrigerator, raven, tequila, mule, squirrel, gong,
  lens, shack, flour, shrine, timer. Shards: `things-2` (+9), `places-2` (+6), `food-2` (+6), `nature-2` (+4).
- **Passed over** (ranks 409 to 493): chili (a dish), continent, grill and grocery (see supermarket), salon,
  workshop (rooms), swine, steed, ape (kinds with no one shape; pig, horse and gorilla have drawings), magnum,
  laurel, bunker (of a golf course), rail, mustard (the sense kept is the plant), bunk (a trough), fax.
- Flour and hay are substances, drawn with what holds them (a sack with a scoop, a tied bale), as vodka, gin and
  the other drinks are drawn with a bottle.
- **Looked at:** all 25 previews on one contact sheet (160 px, name underneath), once; none redrawn. Verdict with
  the name: all recognisable; **weakest without it: timer (reads as an alarm clock), lens (a blue oval on a stand
  with rays), saddle, sherry and tequila (a bottle and a glass, told apart only by the label), wheat (thin).**
- Two hand words dropped, because WordNet makes them stand-ins (a kind, Q21): bathrobe (→ robe), veranda (→ porch).
  New links by rule: futon → mattress, bathrobe → robe, veranda → porch (stand-ins); icebox = refrigerator, wharf =
  pier (synonyms). Refused: cod = pod, solitaire → jewel (the words mostly mean something else).
- **Coverage of the 1,500 common things:** 635 drawn in the sense kept (42.3%), 65 synonyms, 176 stand-ins: **876
  reach a drawing (58.4%)**; 624 nothing.
- Numbers: `things-2` 776 wires / 101,321 bytes, `places-2` 296 / 41,693, `food-2` 338 / 44,750, `nature-2` 226 /
  29,403. **k.objects: 2,078 objects** (195 hand-written), 312 shards, 300,114 wires, 36,271,493 bytes. Catalog: 11
  worlds, 740 shards, 343,622 wires, 44,311,108 bytes, vocab 18,955 words; 0 errors, 0 warnings. npm test 2,322
  pass, 0 fail.

## R5.3 batch 4 (2026-11-13): the last 25 of the 100; `not-drawable.tsv`; 2,103 objects

- **Which** (next in list order, drawable in the sense kept): convent, rag, monastery, kitten, nightclub, mat,
  handkerchief, syrup, asteroid, coop, calf, courthouse, crib, muffin, ketchup, skate, maze, sculpture, manor,
  disc, cradle, sidewalk, leash, raft, monument. Shards: `places-2` (+8), `things-2` (+12), `food-2` (+3),
  `nature-2` (+2).
- **Passed over** (ranks 494 to 602): scooter (the sense kept is a motorboat), sewer, hull (of a seed), stitch, rib,
  insect (a general word), vanilla (the plant), cuff, doorstep, pike (a highway), gravy, marker, gem (the sense kept
  is "art highly prized"; `gem` is a word of the drawing `jewel`), colt, airline (a hose), gutter, jewellery,
  capsule, reef, shredder, bulb.
- **Not drawable** (`sources/coverage/not-drawable.tsv`, read by `tools/coverage.mjs`; they leave the list and are
  named at the end of `MISSING.md` with the reason): laser, bark, moss, soy, vent. Five words, only those reached
  while drawing; the list of common things is filled up to 1,500 again from the frequency list (five words entered
  at its end: they were not part of the reading of R4.2 beyond what `not-things.tsv` already holds).
- **Looked at:** all 25 previews on one contact sheet (160 px, name underneath). One fix before it (skate: a
  relation that the boxes did not bear out), none after. Verdict with the name: all recognisable; **weakest without
  it: rag (a grey patch), leash (a red line with two loops), handkerchief (a white diamond with a border), mat,
  sidewalk (a street scene), syrup.**
- One word dropped because an object has that name: "ice skate". New links by rule: molasses → syrup, precipice →
  cliff, sweatpants → trousers (stand-ins), cabaret = nightclub, hanky = handkerchief, labyrinth = maze
  (synonyms); refused: tombstone → monument (the drawing is an obelisk). `not-links.tsv` has 73 rows.
- **The 100 of R5.3:** 100 new objects in four batches (25 each), plus pole, hole, lane and valley redrawn. Two of the
  100 draw the sense kept under another name (`"river bank"`, `"artillery shell"`); 98 are name matches, each with
  a row in `sense-check.tsv` (right: hand-written for the sense kept). Previews looked at: 104 (4 sheets), 6
  redrawn after the look (river bank, pillow twice, dough, canyon, peg).
- Numbers: `things-2` 1,136 wires / 146,864 bytes, `places-2` 498 / 70,890, `land-2` 148 / 19,363, `food-2` 398 /
  52,350, `nature-2` 277 / 36,762. **k.objects: 2,103 objects** (220 hand-written), 312 shards, 300,793 wires,
  36,361,883 bytes. Catalog: 11 worlds, 740 shards, 344,301 wires, 44,401,498 bytes, vocab 19,118 words; 0 errors,
  0 warnings. npm test 2,347 pass, 0 fail.

## R5.4 (2026-11-13): coverage again; Round 5 report

**Coverage of the 1,500 most frequent common things** (`node tools/coverage.mjs`; the list lost five not-drawable
words and took the next five):

| | Before Round 5 (R4.4) | After R5.1 (sense check) | After R5.2 (links looked at) | Now |
| --- | --- | --- | --- | --- |
| a drawing, in the sense kept | 582 (38.8%, by name only) | 560 (37.3%) | 585 (39.0%, with batch 1) | **660 (44.0%)** |
| a word to a synonym's drawing | 63 | 63 | 63 | 68 |
| a stand-in (the drawing of its kind) | 187 | 187 | 167 | 179 |
| reach a drawing | 832 (55.5%) | 810 (54.0%) | 815 (54.3%) | **907 (60.5%)** |
| nothing | 668 | 690 | 685 | 593 |

Of the 660: 651 are an object of that name and 9 an object of another name (`sense-check.tsv`, column `instead`).
29 words have an object of their name that shows another sense; 20 of those still count as missing.

**The same for "the 3,000 most frequent"** (`node tools/coverage.mjs --limit 3000`): the frequency list of 50,000
words holds only **2,687** common things by the rule, so the count is over 2,687. Before Round 5: 655 by name, 103
synonyms, 484 stand-ins: 1,242 reach a drawing (46.1% of 2,692). **Now: 733 with a drawing (27.3%), 112 synonyms,
491 stand-ins: 1,336 reach a drawing (49.7%)**; 1,351 nothing. This is an upper estimate: after the 1,500th word
the list was not read (names and verb forms are still in it), its 73 name matches were not sense-checked, and its
356 links are counted by rule only (not published, not looked at). Q23.

**Round 5 report.** Commits: R5.1 c8b65cd; R5.3 batch 1 4381f02; (Round 6: fe214ad, e8a1c8c, 10fd8d3); R5.2 2f0ca53;
R5.3 batch 2 78a4d6f, batch 3 3b17125, batch 4 04eeec8; R5.4 this commit.
- **Sense check (R5.1):** 582 name-matched drawings looked at next to the gloss: 523 right, 29 wrong sense, 30
  unclear (after R5.2: 522 / 29 / 31). No object renamed: every wrong-sense drawing shows a common meaning. `bank`,
  `shell`, `frame`: wrong sense; `"river bank"` and `"artillery shell"` drawn; the frame of a pair of glasses not.
- **Links (R5.1, R5.2):** 187 hypernym links moved to `k.objects.stand_in`; all 255 links looked at; 25 removed.
- **Hand-written (R5.3):** 100 new objects (k.objects 2,103; 220 hand-written), 4 redrawn; 5 words not drawable.
- **Looked at in Round 5:** 20 sheets of the sense check (582 drawings) and 1 of the 7 replacements; 9 sheets of the
  links (255); 4 sheets of the new objects (104 previews) and 2 small sheets of redrawn ones. **Not looked at:** the
  17 new links that batches 2 to 4 produced, as links (their drawings are the new objects); the tail of the long list;
  the gallery page in a browser; whether an "unclear" drawing should be redrawn.
- **Judgement that is mine, not a rule:** the verdicts of `sense-check.tsv`; the 32 new rows of `not-links.tsv`;
  which missing words were passed over as not drawable in the sense kept (listed in the four batch entries); the
  five words of `not-drawable.tsv`.
- **What SOP Lang could not say:** nothing new. The sense of a word is not in the world: an object has a name, not
  a WordNet sense, so "the drawing `bank` shows the building" lives in a TSV beside the tool. If a host should know
  it, `k.objects.object` needs a key for the sense (a gloss, or a `k.words` synset): not asked for, not done.
- **Open questions:** Q22 (correct the kept sense by hand where WordNet's counts keep a rare one?), Q23 (the list
  has 2,687 words, and its tail is unread).

## Round 7, start (2026-11-13): sopworld 0.16.0

- Pin moved from 0.15.0 (782cd0c) to **0.16.0 at commit 1e18f1d** of `ml-circuits-research/soplang-words-lib`
  (`docs/sopworld.mjs`, build d41d73a9301a, sha256 a50efcb8…8507): `tools/sopworld/sopworld.mjs`, `VERSION`,
  AGENTS.md, the page example, `docs/worlds/README.md`, the pin test. The repository vendors this one file and
  depends on nothing else of the library.
- No world changed: every schema and shard loads as before, 0 errors, 0 warnings. The catalog differs only in its
  `sopworld` field and content hash. Nothing of the new standard pack (`std.numbers`, `std.order`, `std.boxes`) is
  used yet.
- Numbers: catalog 11 worlds, 740 shards, vocab 19,118 words. npm test 2,347 pass, 0 fail.

## Q22 (c) and Q23 applied (2026-11-13): coverage recounted

- **Rule (Q22 → c):** a common thing counts as drawn when the drawing of its name shows any physical sense of the
  word that WordNet has. `sense-check.tsv` has a sixth column `shown`: the WordNet 3.1 noun synset that the drawing
  shows, for the 29 rows with the verdict `wrong`. `tools/coverage.mjs` checks that it is a sense of the word and
  lies under physical entity (a bird's wing is a body part, not under physical object, so the check is against
  physical entity and not only the four roots of the list). No override of the sense kept, no new reading.
- **28 of the 29 count now** (bank, cake, plant, plate, chocolate, wing, chip, frame, hammer, shell, turtle, glove,
  tuna, hose, drone, cereal, dolphin, cracker, peacock, cruiser, lorry, tram, stretcher, cot, lollipop, steamer,
  barbeque, headstone). **One stays missing: `tablet`**: the drawing is a tablet computer, and WordNet 3.1 has no
  such sense (slab, pad of paper, cake of a substance, pill). The synset for each was picked by its gloss and
  printed; I did not look at the 29 drawings again (they were looked at in R5.1).
- **Links keep the sense kept:** a stand-in or synonym goes to the object that draws the sense kept (the column
  `instead`), not to the drawing of the other sense: winery stays a stand-in of `factory`, not of the green `plant`.
  Without this the recount moved that one link; both link shards are unchanged.
- **MISSING.md:** the baseball plate, the horse-drawn lorry, the block of soap, the sweater called turtle and the
  others have left it; 821 words without a drawing of their name (840 before), one of them "other sense" (tablet).
- **Coverage of the 1,500:** 679 with a drawing of their name (45.3%; 660 before), 68 synonyms, 179 stand-ins:
  **926 reach a drawing (61.7%; 907 before)**; 574 nothing (593). The long list (Q23, an estimate, tail not read):
  752, 112, 491: 1,355 of 2,687 (50.4%; 1,336 before).
- `questions.md` has sections Open (none) and Closed (Q1 to Q23).
- Numbers: catalog 11 worlds, 740 shards, vocab 19,118 words; 0 errors, 0 warnings.
- npm test 2,347 pass, 0 fail.

## Round 7 addendum, items 1 and 2 (2026-11-13): `k.scenes`, usual place and relative size of drawable things

- **New world `k.scenes`** (version 1, exports `thing`, `scene`, `has`; the scenes themselves come with R7.1).
  `k.scenes.thing` (identity `name` = the name of a `k.objects` object or stand-in): `place` (sky, ground, water,
  indoors, on_thing), `on` (many: what it is usually on), `size` (tiny, small, medium, large, huge; the five
  classes are defined by what one can do with the thing: fits in a closed hand, held in the hands, carried up to
  the size of a person, up to a truck, bigger), `named=model`. A deny refuses `place=on_thing` without `on` (written
  with `core.absent=on` on the pattern wire).
- **2,033 of the 2,103 objects have a fact** (27 shards `things-a` … `things-z`, `things-0`; 2,033 wires, 263,118
  bytes). Place: indoors 1,121, ground 477, on another thing 240, sky 105, water 60, none 30. Size: small 1,189,
  medium 251, huge 219, tiny 209, large 163, none 2. 624 facts say what the thing is on (table 604 of them for
  things indoors, then person, head, hand, foot, wall, tree …).
- **70 objects have no fact** (not sure, or no usual place and no size): symbols and charts (heart, barcode,
  "chart increasing", "olympic rings", "high voltage"), whole scenes (sunset, sunrise, "night with stars", wedding),
  faces ("dog face" and the eleven others), organs (liver, brain), a few things I could not place from the name
  (guy, backstop, "boccia chute", tripod).
- **How the labels were made:** by me (a language model) from the names: a default per category of the source
  (the 150 shard groups: "noto-food-fruit" indoors, on a table, small), then name by name where the default is
  wrong (about 900 names). The table is `sources/hand-core/place-size.tsv`; `tools/scenes-core.mjs` writes the
  shards from it.
- **Audit, as for the part names:** 200 rows drawn with seed 7, each looked at as the drawing at 150 px with its
  labels underneath (5 contact sheets of 40, all read): **195 right, 1 wrong, 4 unclear (0.5% wrong)**. Wrong:
  `collar` (I had it on a dog; the drawing is a shirt collar; corrected). Unclear: orangutan (ground or trees),
  "fruit tree" (large or huge), elevator (the drawing is a sign), "suspension railway" (hangs). Record:
  `sources/hand-core/place-size-audit.tsv`.
- **A second look, at names with several meanings** (85 drawings on 2 sheets: tank, fan, horn, pipe, bow, file,
  crane, bat, saw, letter, scales, dinosaur, lens, pool, pond, coach …): 3 more corrected: `dinosaur` (a
  dinosaur, not a toy: ground, huge), `pick` (a pickaxe: ground, medium), `motor` (an engine: medium, no place).
- **Not looked at:** the other about 1,750 labels next to their drawings. They rest on the name alone; where a
  name and its drawing differ (as with `collar`) the label can be wrong. The sample says this is rare.
- **Judgement that is mine:** the five size classes and where their borders are (an egg is small, a medal tiny, a
  bed large, a pond huge); birds and flying insects are `sky`, ducks and swans `water`, hens and penguins
  `ground`; food is `indoors` on a `table`; clothes are `on_thing` on a `person` (hats on a `head`, shoes on a
  `foot`).
- New tool `tools/contact-sheet.mjs` (the previews of a list of objects with captions, as PNG pages; needs
  rsvg-convert and ImageMagick).
- Numbers: catalog 12 worlds, 767 shards, vocab 19,122 words; 0 errors, 0 warnings. npm test 2,362 pass, 0 fail.

## Round 7 addendum, item 4 (2026-11-13): stand-ins written by hand; lake, river, sea, sandcastle drawn

- **The four of the owner's log:** `villa` → `house` and `puddle` → `pond` are stand-in facts of the new shard
  `stand-ins-hand`, with their own place and size in `k.scenes` (villa: ground, huge; puddle: ground, small).
  **Puddle goes to the pond, not to a lake:** there was no lake drawing at all; I drew one (below), but it is a
  lake with mountains and a tree, and the pond (an oval of water with reeds) reads as a puddle much better.
  `donkey` already had a drawing (the Noto object `donkey`; `k.animals` joins it with `drawing=donkey`; `k.scenes`
  now says ground, large): nothing was missing in the worlds for it. `grandfather` is a person, not an object:
  it comes with the person kinds of `k.people` (next commit).
- **Hand links** (`sources/coverage/hand-links.tsv`, read by `tools/coverage.mjs`, which writes the shards
  `words-hand` (17 `core.word`) and `stand-ins-hand` (73 `k.objects.stand_in`), source `hand-core 1`): 90 links for
  words that have no drawing and no WordNet link. Same thing: tombstone = headstone, hourglass = "hourglass done",
  streetcar = tram, faucet = tap, beet = beetroot … Kind: sparrow, lark, magpie … → bird; trout, cod, herring …
  → fish; hound, beagle, terrier … → dog; stallion, colt, mustang … → horse; cobra, python → snake; handgun,
  revolver → gun; hatchet → axe; tuxedo → suit; tiara → crown; cedar → "evergreen tree"; chateau → manor;
  citadel → fortress; saloon → pub …
- **Looked at:** all 104 links I first wrote, each as the drawing at 120 px with "word = drawing" or "word <
  drawing" underneath (3 sheets, all read). **8 dropped as misleading:** musket (the gun is a pistol), cheesecake
  (the cake looks like a pudding), lager (the beer is black), pendant and locket (the necklace is two strings of
  beads), iguana (the lizard is hard to read), lifeboat (the boat is a sailing boat), venison (the meat is hard
  to read). 2 changed: chateau → manor (not the small house), puddle → pond. 6 dropped because the word is
  already a `core.word` of that object in its hand-written shard (bike, gem, pavement, pistol, stronghold, tavern).
- **Coverage now also counts the words of hand-written objects** (marsh is a word of the drawing `swamp`: it was
  counted as "nothing" before). Only hand-written shards: the `core.word` facts of the imported shards are the
  search keywords of their source (CLDR gives "bike" for a lock), not names; counting them would be wrong (I
  tried it, saw `bike → "locked with key"`, and restricted it).
- **Four hand-written objects for scenes** (shard `scenery`, 64 wires, 9,206 bytes): lake, river, sea, sandcastle.
  Looked at on one sheet at 260 px next to pond, "water wave", house and beach: all four recognisable with the
  name; the river is seen from above (a blue band through green land), the sea is a blue field with white wave
  arcs and a sun. Not redrawn. k.objects: **2,107 objects** (224 hand-written).
- **Coverage of the 1,500 common things:** 679 with a drawing of their name, 68 WordNet synonyms, 179 WordNet
  stand-ins, 25 other words of an object (8 in hand-written shards, 17 in `words-hand`), 71 hand stand-ins:
  **1,022 reach a drawing (68.1%; 926 before)**. **478 have neither a drawing nor a stand-in** (574 before).
- **Judgement that is mine:** every hand link (a language model chose them; nothing but the look checks them);
  a general word is never linked to a particular thing (aircraft, jewelry, insect stay without).
- Numbers: catalog 12 worlds, 770 shards, vocab 19,168 words; 0 errors, 0 warnings. npm test 2,368 pass, 0 fail.

## Round 7 addendum, item 3 (2026-11-13): `k.people`, the kinds of person

- **New world `k.people`** (version 1, exports `kind`, `role`; the roles come with R7.5). `k.people.kind`: baby,
  child, boy, girl, man, woman, grandfather, grandmother, all with `drawing=person` (the one person drawing of
  `k.objects`), and what varies it: `age` (baby, child, adult, old), `sex`, `height_about` (per cent of the height
  of a grown man: 40, 65, 70, 70, 100, 93, 96, 89), `hair` (little, short, long, grey, white), `face` (the `k.faces`
  preset of style `plain`), `is_a`. Shard `kinds`: 8 facts and 8 `core.word` facts (16 wires).
- **Reachable by any name:** infant, newborn, kid, children, toddler, lad, lady, gentleman, grandpa, granddad,
  grandad, grandma, granny, nan, nana, "old man", "old woman" and the plurals are `core.word` facts; a test reads
  `vocab.json` and checks that each word leads to the shard.
- **`k.faces` has a 14th preset, `baby`** (round head, no hair, dot eyes, button nose, small mouth, round blush), so
  that every kind has a face. The random faces did not change (they are seeded per number).
- **Looked at:** the eight faces of the kinds on one sheet at 160 px (baby, child, boy, girl, man, woman, old man,
  old woman): each reads as its kind; the baby is the plainest (bald, two dots). **Not looked at:** a person drawn
  in the eight heights; the person drawing is a stick figure, and nothing here draws it scaled or with hair. The
  facts say how to vary it; a host has to do it.
- **Judgement that is mine:** the heights (they are round figures for drawing, not measurements; hence `_about`);
  `hair=long` for woman and girl and `short` for man and boy are the picture-book convention, nothing more.
- **What SOP Lang could not say:** nothing. That a word of a kind "is" the kind uses `core.word … of=`, as elsewhere.
- Numbers: catalog 13 worlds, 771 shards, vocab 19,183 words; 0 errors, 0 warnings. npm test 2,377 pass, 0 fail.

## R7.1 (2026-11-13): 61 scenes in `k.scenes`; each composed into a picture

- **Schema:** `k.scenes.scene` (name, kind: outdoors / indoors / underwater / space, ground, time, weather, season,
  happens, drawing) and `k.scenes.has` (scene + thing, count, where: sky / ceiling / background / wall / ground /
  water / foreground, side, on, fills, drawing). `fills=true` was added after the first look (below).
- **61 scenes** in four shards: `scenes-nature` (19: beach, farm, forest, mountains, meadow, river, lake, pond,
  desert, jungle, savanna, arctic, island, garden, park, orchard, campsite, field, picnic; 353 wires, 48,484
  bytes), `scenes-town` (15: city street, village, playground, market, harbour, airport, railway station,
  construction site, petrol station, zoo, fairground, football pitch, swimming pool, circus, castle; 292 / 42,689),
  `scenes-indoors` (17: kitchen, bedroom, living room, bathroom, classroom, office, supermarket, restaurant,
  library, hospital, workshop, theatre, museum, cafe, nursery, laboratory, birthday party; 363 / 53,642),
  `scenes-other` (10: space, underwater, night, winter, autumn, spring, rainy day, Christmas, Halloween, pirate
  ship; 202 / 30,015). 1,088 `has` facts (12 to 26 things per scene), 61 word facts. Written by
  `tools/scenes-core.mjs` from the data in `tools/scenes-data.mjs`.
- **Things with a drawing: 1,062 of 1,088 (97.6%)**; per scene in `docs/worlds/k.scenes/WORLD.md` (the table): 42
  scenes have a drawing for every thing; the lowest is the airport (12 of 15). Without a drawing: dune, iceberg,
  lamp post, street lamp, sandbox, stall, control tower, runway, windsock, diving board, trapeze, ring, moat, pipe,
  till, stage, seat, mobile, party hat, seaweed, shipwreck, firefly, snowball, pirate ship. People in a scene
  (farmer, teacher, pirate, swimmer) are drawn by `person`.
- **Looked at, the drawings behind the things:** (1) the 66 things I gave another object's drawing (`farmhouse` <
  house, `crow` < "black bird"), on 2 sheets: **19 drawings taken away as misleading** (lamp post and street lamp
  by the red and white pole, runway by the street, windsock by the flag, diving board by the bench, trapeze by the
  swing, moat by the river, till by the cash machine, stage by the table, mobile by the star, party hat by the party
  popper, shipwreck and pirate ship by the passenger liner, firefly by the star, snowball by the red ball, stall by
  the camping tent, control tower by the castle tower …). (2) All 497 distinct drawings matched by name, on 6 sheets
  of 84 at 100 px: **4 more taken away or changed**: `pipe` (the object is a pipe to smoke), `ring` (a finger ring),
  `seat` (an aeroplane seat, for the theatre), `scales` in the supermarket (bathroom scales; now `balance scale`).
  A thing can say `=-` in the data to refuse the object of its own name.
- **Looked at, the scenes:** new tool `tools/render-scenes.mjs` composes every scene from the facts alone (layers by
  `where`, the side, what a thing is on, the size class from `k.scenes.thing`, at most five of a thing; no
  randomness) and writes `docs/worlds/k.scenes/preview/` (61 SVG that refer to the object previews, and
  `index.html`; 440 kB). All 61 pictures looked at on 7 sheets of 9, twice for the first three sheets. What the
  first look changed in the **facts**: things on water now say on which water (`sailboat` on `sea`, `duck` on
  `pond`; a test requires it; before, the shark of the island lay on the sand); `fills=true` for the sea and the
  road (the sea object is a square picture: drawn as a block in the middle of the beach it read as a poster); moon
  and stars left the bedroom, snowflakes and the sleigh left the indoor Christmas; a size is looked up by the name
  of the thing before the name of its drawing (a puddle drawn by the pond is small, not huge).
- **Verdict by eye:** recognisable as the scene: beach, farm, field, forest, meadow, orchard, desert, savanna,
  arctic, campsite, harbour, island, mountains, garden, park, playground, village, city street, airport, railway
  station, construction site, space, underwater, night, winter, autumn, spring, rainy day, Halloween, pond, lake.
  **Weak:** the rooms (kitchen, bathroom, office, restaurant, supermarket, library, cafe, laboratory): small things
  on tables and shelves shrink to dots, and furniture has no depth; market and fairground (the stalls have no
  drawing); swimming pool (the pool sits on the horizon); zoo (crowded on one side); pirate ship (no ship: its
  crew and cannon stand in the sea). The river, path and lake objects are whole small pictures (seen from above,
  or with their own mountains) and stay blocks in a scene. These are limits of the composer and of the object
  drawings more than of the facts; the composer is a check, not the application's renderer.
- **Not looked at:** the published SVG files in a browser (I looked at the same layouts with the drawings copied
  in, rasterised by rsvg-convert); `index.html` of the previews.
- **Judgement that is mine:** which 61 scenes, what is in each and how many, where (a hand-written core); the
  refusals of drawings above.
- **What SOP Lang could not say:** "a thing on water must say on which water unless the ground of its scene is
  water" joins `has` with its scene and negates a value there; I wrote it as a test, not as a rule. That a thing's
  `on` names a thing of the same scene is a test too.
- Tests: the shards are what the tool gives; scene, drawing and `on` exist; every scene has at least 10 things and
  two things that happen; at least three quarters of a scene's things have a drawing; every scene lays out inside
  the frame and its preview file is what the composer gives; 10 new questions (sc-11 to sc-20).
- Numbers: k.scenes 31 shards, 3,249 wires, 438,609 bytes. Catalog 13 worlds, 775 shards, vocab 19,328 words; 0
  errors, 0 warnings. npm test 2,391 pass, 0 fail.

## R7.5 (2026-11-13): 60 roles and jobs in `k.people`

- **`k.people.role`**: 36 jobs, 8 family members, 16 figures of stories; keys `group`, `is` (a `k.people.kind`),
  `wears`, `holds`, `uses`, `works_at`, `does`, the face features `hat`, `glasses`, `beard`, `moustache`,
  `shoulders` (variants of `k.faces`, style `plain`), `face` (a preset), `drawing=person`. Shards `roles-jobs` (72
  wires), `roles-family` (16), `roles-story` (32), written by `tools/people-core.mjs`; each role has a `core.word`
  with its plural and other names (chef, fireman, cop, mum, santa).
- **Joins:** 238 of the 239 things worn, held or used are `k.objects` objects (not the astronaut's space suit);
  56 of 57 workplaces are `k.scenes` scenes (not the judge's courthouse, which is an object); every face feature
  is a variant that exists; every `is` is a kind.
- **Looked at:** (1) the 63 drawings of worn, held and used things that the scene sheets had not shown, on one
  sheet at 100 px: 3 taken out (astronaut `helmet`: a bicycle helmet; sailor `cap`: a baseball cap; postman `bag`:
  a red handbag). The other about 175 had been looked at with the scenes. (2) A face composed for every role (the
  preset of `face`, else of its kind, else `man`, with the role's features put on) on one sheet of 60 at 120 px:
  the family, king, queen, prince, princess, cowboy, magician, farmer, gardener, explorer, pilot, police officer,
  fisherman, painter, clown, Father Christmas, teacher, doctor, scientist, librarian read as different people;
  **about 25 jobs come out as the plain man** (nurse, dentist, vet, cook, baker, builder, carpenter, plumber …)
  because `k.faces` has no hat or clothes for them: only seven hats exist there. The pirate has no hat either.
  That sheet is mine, for the look: no such composer is in the repository.
- **Judgement that is mine:** which roles; what each wears, holds, uses and does (a hand-written core); that jobs
  say no `is` (a doctor is not a man or a woman); the family roles carry the kind.
- **What SOP Lang could not say:** nothing new. `grandmother` is the name of a kind and of a role; they are two
  types, so two facts, joined by `is`.
- Numbers: k.people 4 shards, 136 wires, 26,758 bytes. Catalog 13 worlds, 778 shards, vocab 19,416 words; 0 errors,
  0 warnings. npm test 2,402 pass, 0 fail.

## R7.4 (2026-11-13): `k.feelings`, 30 feelings

- **New world `k.feelings`** (version 1, exports `feeling`): `k.feelings.feeling` with `tone` (pleasant,
  unpleasant, neutral), `expression` (a `k.faces.expression`, style `plain`), `mouth`, `eyebrows`, `eyes`, `cheeks`
  (variants of those `k.faces` slots, put on after the expression or alone), `caused_by` (many), `opposite`,
  `reply` (a kind thing to say). Shard `feelings`: 30 facts and 30 `core.word` facts (scared, glad, mad, fear,
  anxious, thankful …), 60 wires, 12,966 bytes, written by `tools/feelings-core.mjs`.
- **Joins:** 20 feelings name an expression (happy, sad, angry, surprised, sleepy); 10 have none that fits and say
  the variants instead (shy, worried, calm, embarrassed, confused, curious, hopeful, nervous, disgusted,
  relieved); every expression and variant named exists in `k.faces`. `wink` and `talking` are not feelings and
  are not used.
- **Looked at:** all 30 feelings composed on two presets (child, woman), 60 faces on one sheet at 120 px. Read as
  the feeling without the name: happy, sad, angry, afraid, surprised, tired, excited, shy, calm, embarrassed,
  disgusted, ashamed, amused, bored. **Not told apart by the face:** sad, lonely, disappointed, guilty, hurt and
  homesick (all the sad expression); angry and frustrated; calm and relieved; curious and hopeful differ only by
  the eyes; jealous is a mild angry face; nervous (a straight wide mouth under worried brows) is weak. The world
  page says that the cause tells these apart, not the face.
- **Judgement that is mine:** which 30 feelings, their causes and replies (the replies are short, kind, and ask a
  question back where that fits; they are for a child's talk partner, not advice); opposites only where plain
  (11 feelings have one).
- **Order:** the reviewer's block "2026-11-13 17:40" (addendum 2: `k.layouts`, anchors, what joins what) asks for
  that work before `k.feelings`. My task for this session named the order scenes, people, feelings, actions,
  colours, shapes, so the feelings came first. Addendum 2 is not started.
- **What SOP Lang could not say:** nothing.
- Numbers: catalog 14 worlds, 779 shards, vocab 19,484 words; 0 errors, 0 warnings. npm test 2,413 pass, 0 fail.

## Correction (2026-11-13): the count of feelings with an expression

- The R7.4 entry, the world page and the commit message of 85e1bd6 said 21 feelings name a `k.faces` expression and
  9 do not. Counted from the shard it is **20 and 10**. The log entry above and `k.feelings/WORLD.md` are corrected;
  the commit message of 85e1bd6 keeps the wrong figure. A test now counts it.
- Numbers: catalog 14 worlds, 779 shards, vocab 19,484 words; 0 errors, 0 warnings. npm test 2,413 pass, 0 fail.

## Questions Q24 to Q26 (2026-11-13)

- Q24: puddle by the pond (published) or by the lake (as the task says)? Q25: `tablet` stays missing because
  WordNet has no tablet computer: count it? Q26: `k.feelings` came before addendum 2; addendum 2 is next. None
  blocks; each names what is done meanwhile.
- **Round 7 so far.** Done: sopworld 0.16.0; Q22 (c) and Q23; addendum 1 (place and size, person kinds, hand
  stand-ins); R7.1 `k.scenes` (61 scenes); R7.5 `k.people` (60 roles); R7.4 `k.feelings` (30). **Not started:**
  addendum 2 (`k.layouts`, anchors, what joins what), R7.2 `k.actions`, R7.3 `k.colours` and `k.shapes`.
- Numbers: catalog 14 worlds, 779 shards, vocab 19,484 words; 0 errors, 0 warnings. npm test 2,413 pass, 0 fail.

## Scene previews: the two defects; Q24, Q25, Q26 applied (2026-11-13)

- **Defect 1, the published page showed empty backgrounds.** Every scene picture is now one file with nothing
  outside it: the object drawings it uses are copied in once each as a `<symbol>` and placed with `<use>`. A test
  refuses any reference out of the file. New tool `tools/check-preview-page.mjs`, part of `npm run build`: it opens
  the pictures and `preview/index.html` in headless Chrome, reads the screenshot (a small PNG reader, no new
  dependency) and fails when a picture has under 3% of pixels that are not its background. Run on the pictures of
  28039fa it fails for all 61 (0 pixels each); on the new ones it passes. Without Chrome it says so and checks nothing.
- **Defect 2, heaps and white tiles.** The composer is rewritten and plain: one band per place (sky or ceiling;
  far ground or wall; a strip for what fills its layer, with what is on it; water; near ground or floor;
  foreground), each band packed in rows from left to right (at most 2, 2, 2, 3, 1 rows), sizes by the size class
  (20, 30, 46, 66, 96 px; 0.8 of that in the sky and far away), at most 3 of a thing (2 of a thing that is on
  another). When a band is too full it first draws one less of the thing drawn most often, then everything
  smaller. A thing that is on another stands above it (a cup above the table) or, on water, inside it (a duck on
  the pond); a water that carries much is drawn bigger. The tile of the object previews is not copied. The height
  of a picture follows from its rows (199 to 551 px). A test checks for every scene: inside the frame, nothing
  under 12 px, no two things overlap except a thing and what it is on.
- **Looked at:** the published `preview/index.html` in headless Chrome (the command of the task, window 1220 wide,
  the whole page in 7 crops): 5 of the 7 crops read at the first version (about 45 scenes), then after the last
  change the top of the page (kitchen, bedroom, living room, bathroom) in Chrome and lake, river, harbour,
  swimming pool, bathroom, zoo by rsvg-convert. Every picture read shows its drawings, no tile, rows, no heaps.
  **Not looked at** after the last change (water hosts drawn bigger): the other scenes with a pond or a river
  (farm, park, pond, jungle, savanna, zoo was) in Chrome; the test says nothing overlaps there.
- **Still weak, and left so** (the real placing is the application's): the `river` and `path` objects are small
  whole pictures and stay tiles in a scene; the road of the city street is the road drawing stretched to a strip
  (its car is stretched with it); a person is a small stick figure next to large animals; things in the sky row
  stand in a line.
- **Q24:** puddle stays by the pond. New hand-written object `lake` (an oval of water with three ripples, nothing
  else); the earlier one is `"mountain lake"` (words: mountain lake, tarn; place ground, size huge; the drawing of
  the scene `lake`). Looked at both next to pond and river on one sheet at 330 px: the plain lake reads as water
  seen from above. k.objects: **2,108 objects** (225 hand-written); shard `scenery` 76 wires.
- **Q25:** `tools/coverage.mjs`: an object written by hand counts for its own name whatever WordNet lists (the
  sense check cannot take it away); a test. No number changes: no hand-written object was held back by the sense
  check, and `tablet` is OpenMoji's drawing, which the rule does not reach. Asked as **Q27**; meanwhile it stays
  missing. Coverage as before: 1,022 of 1,500 reach a drawing, 478 have neither.
- **Q26:** nothing waits; addendum 2 is next. Q24 to Q26 are moved to Closed in `questions.md`.
- Numbers: scene previews 61 files and the page, 2,388 kB (440 kB when they referred to the object files).
  Catalog 14 worlds, 779 shards, vocab 19,487 words (19,484); 0 errors, 0 warnings. npm test 2,414 pass, 0 fail.

## Round 7 addendum 2 (2026-11-13): `k.layouts`: arrangements, anchors, what joins what

- **New world `k.layouts`** (version 1, exports `layout`, `slot`, `relation`, `anchor`, `joins`), three shards written
  by `tools/layouts-core.mjs`: `layouts` (175 wires, 30,812 bytes), `anchors` (117 wires, 20,096 bytes), `joins`
  (171 wires, 22,328 bytes).
- **1. Arrangements:** 17 `k.layouts.layout` facts: the 13 asked for (row, column, grid, ring, scatter, corners,
  stack, tree, flow, landscape, face, room, family photo) and pyramid, radial, nested, border. 50 places
  (`k.layouts.slot`: count, pair, optional, what it holds, the arrangement inside it, and for the fixed pictures a
  usual box in a 0 to 100 frame), 91 relations (`k.layouts.relation`: left_of, above, inside, around, on, behind,
  beside, aligned_row, aligned_column, same_size, smaller_than, evenly_spaced, apart, joined_to), `usual_for` (4
  to 6 phrases each), 17 `core.word` facts with other names (queue, pile, circle, flowchart, hierarchy, scenery,
  group photo …). In a place for many things a relation names the same place twice and says `among=neighbours` or
  `among=all` (a row: `item left_of item among=neighbours`); a grid is rows (`arranged=row`) one above the other.
- **The face** has the 16 places of `k.faces` (style plain) and their boxes, read from the k.faces shard by the tool
  (a test compares them), with 24 relations. I wrote no separate anchors for faces: a k.faces slot already is the
  place where a variant sits (box, draw order, mirror); the arrangement adds how the places sit to each other.
- **2. Anchors:** `k.layouts.anchor`, 117 places on 93 of the 225 hand-written objects: 35 openings (doors, gates,
  a mailbox slot, the opening of a shoe), 23 surfaces (table, shelves, stove, bridge deck, roads), 13 handles, 12
  insides (cup, pan, the crown of a tree, a nest, the cabin of a car), 7 waters (lake, mountain lake, river, sea,
  pool, swamp, under the bridge), 6 tops (head of the person, hill, mountain, tower, pole, train chimney), 5 seats
  (chair, sofa, throne, saddle, bicycle), 5 roofs, 4 hands (person, robot), 4 bases (hat, flag, house, tree), 3
  hooks. The table `sources/hand-core/anchors.tsv` names the object, a named part and where on the part's box
  (box, an edge, a corner, top_centre); the tool works out the box, so an anchor always lies on its part.
  `named=model`. They are in `k.layouts`, named by the object (as `k.scenes.thing` is), so `k.objects` did not change.
- **Audit of the anchors, all of them:** each of the 118 rows first written was drawn on its object (the box, line
  or point in colour over the preview), 3 sheets of up to 40 at 150 px, all read: **115 right, 2 wrong, 1 unclear**
  (1.7% wrong). Wrong and corrected: the umbrella handle (the part `handle` is the whole stick; now the hook), the
  top of the hill (a line over the whole width; now the point top_centre). Unclear and taken out: the clip of the
  leash. The two corrected ones were drawn and looked at again. Record: `sources/hand-core/anchors-audit.tsv`.
- **Not done for anchors:** the 132 hand-written objects without one (animals, food, bottles, most land forms,
  tools: no place I was sure of, e.g. the back of the mule, the ladder's rungs) and all 1,883 imported objects:
  their parts are mostly unnamed, so a rule from part names does not reach them. The swing of the reviewer's
  example is an imported drawing: no anchor.
- **3. What joins what:** `k.layouts.joins`, 171 facts between kinds: 79 part_of, 25 attaches_to, 19 sits_on, 16
  worn_on, 12 goes_in, 9 hangs_from, 6 grows_on, 4 connects, 1 held_in, with the side of the second kind where
  there is a usual one (roof attaches_to wall, side top; wheel part_of car, side bottom; hat sits_on head, side
  top; arrow connects box and attaches_to box, side edge). **All model-labelled** (`named=model`): `k.commonsense`
  has no `part_of` or `has` fact at all in its one shard, so nothing comes from there. The only check besides
  reading the table: of the 52 part_of facts whose whole is a hand-written drawing, 39 name a part of that drawing
  (the other 13 are parts the drawing does not show: the engine of the car, the root of the tree).
- **Judgement that is mine:** which arrangements beyond the 13, their places, boxes and relations (the boxes are
  round figures for a first layout; a test checks that they agree with the relations, 50 of them); which anchors
  and what each holds; every join.
- **What SOP Lang could not say:** that `among` is present exactly when `a` and `b` are the same place (a rule
  would have to compare two values of one fact): a test. That a relation's places belong to its arrangement, and
  that an anchor lies on a part of its object: tests (joins across facts, and across worlds by name).
- Tests: the shards are what the tool gives; places and relations; boxes against relations; the face against
  k.faces; anchors on their parts and the audit against the table; the joins asked for; 18 questions (la-01 to
  la-18); other names through the vocabulary index.
- Numbers: k.layouts 3 shards, 463 wires, 73,236 bytes. Catalog 15 worlds, 782 shards, vocab 19,600 words; 0 errors, 0 warnings. npm test 2,440 pass, 0 fail.

## Hats and work clothes; feelings that share a face (2026-11-13)

- **`k.faces`, style plain: 175 variants (134).** 20 new hats (chef hat, hard hat, fire helmet, police cap, pilot
  cap, nurse cap, sailor cap, military helmet, space helmet, knight helmet, pirate hat, witch hat, wizard hat,
  Santa hat, beret, fedora, swimming cap, judge wig, headscarf, flower wreath; 29 hats now) and 17 new kinds of
  clothes on the shoulders (lab coat, scrubs, chef jacket, apron, overalls, safety vest, uniform, fire jacket,
  sailor collar, space suit, robe, cloak, cape, fur coat, football shirt, bow tie, boiler suit; 25 now). For the
  feelings: eyes `downcast` and `looking up`, mouth `gritted`, cheeks `tear`. Drawn with primitives inside the box
  of the slot, as the rest of `tools/faces-core.mjs`.
- **`k.people`: 37 of the 60 roles changed their `hat` or `shoulders`** (cook: chef hat and chef jacket; builder:
  hard hat and safety vest; firefighter: fire helmet and fire jacket; nurse: nurse cap and scrubs; police officer:
  police cap and uniform; astronaut: space helmet and space suit; judge: wig and robe; knight, pirate, witch,
  wizard, fairy, detective, superhero, Father Christmas …). Of the 36 jobs, **4 still have no face feature of
  their own** (hairdresser, singer, dancer, photographer; about 25 before), and two pairs share a face (waiter and
  musician; hairdresser and singer). A test holds this (at most 5 plain jobs, at least 33 different faces).
- **Looked at:** every hat and every kind of clothes, each on the man or the woman preset (54 faces on 2 sheets at
  150 px): all 20 hats read as what they are (the space helmet least: a white helmet with a red stripe); after
  the look three clothes were changed because the neck covered their detail (bow tie, the clasp of the cloak, the
  fur collar). Then a face for each of the 60 roles on one sheet at 125 px (the preset of the role, else of its
  kind, else `man`, with its features): the jobs differ. Weak: the soldier's uniform takes the blue of the preset
  under a green helmet; farmer, gardener and explorer share the sun hat and differ only by clothes; the lab coat
  of doctor and vet is mostly hidden by the neck. That composer is a script of mine, not in the repository.
  **Not looked at:** the regenerated sheet of 40 random faces (the new variants change which faces the seeds give),
  the single-variant previews of the new variants, and the fur coat, cloak and bow tie alone after their change
  (seen only on the role sheet: Father Christmas, wizard, king, waiter, musician).
- **`k.feelings` version 2: `looks_like`.** A feeling whose face a face cannot tell from another says so: lonely,
  disappointed, guilty, homesick `looks_like=sad`; grateful `looks_like=happy`; relieved `looks_like=calm`. The
  other **24 feelings each have a face of their own** (23 different faces before, and the 7 feelings that shared
  one did not say so): hurt (sad with tears),
  frustrated (angry with gritted teeth), tired (sleepy, yawning mouth), proud (happy with a smirk), shy (looks
  down, blush), embarrassed (eyes closed, round blush), hopeful (looks up), nervous (gritted teeth, worried
  eyebrows). A test works out the face of every feeling (the expression, then its own variants) and requires that
  feelings with the same face name one of them by `looks_like`, and no others do.
- **Looked at:** all 30 feelings on the child and the woman preset (60 faces, one sheet at 125 px). Told apart by
  eye: all 24. Weakest: jealous (the angry eyes and brows with a small mouth), worried next to confused (only the
  eyebrows differ), bored next to tired (only the mouth). I first gave relieved raised eyebrows to part it from
  calm; on the sheet the two could not be told apart, so relieved says `looks_like=calm` instead.
- **Judgement that is mine:** which hat and clothes suit which role; which feelings a face can show (sad, guilty
  and lonely cannot be parted, as the reviewer said; I added disappointed, homesick, grateful, relieved).
- **What SOP Lang could not say:** "two feelings with the same face must say looks_like" compares several values
  across facts and through another world's expression: a test.
- Numbers: k.faces plain-hat 386 wires 56,411 bytes, plain-shoulders 455 wires 71,667 bytes; face previews 669
  files. Catalog 15 worlds, 782 shards, vocab 19,661 words; 0 errors, 0 warnings. npm test 2,447 pass, 0 fail.

## Round 8, item 1 (2026-11-13, second worker): `k.actions`, the words of the acts

- **Two workers.** This entry is by a second worker, who does the block "2026-11-13 19:35 — Round 8"; the first
  worker has the open items of Round 7. **For the first worker (R7.2, the 150 common verbs):** the world
  `k.actions` now exists; please add your types to `docs/worlds/k.actions/schema.sop` (and `exports=`) rather than
  making a second world. Taken here: the types `act`, `role`, `verb`, `marking`, the shards `acts` and `verbs-*`,
  `tools/acts-core.mjs`, `tests/k.actions.acts.test.mjs`, questions `ac-01` to `ac-10` in
  `tests/k.actions.questions.jsonl` (append yours). `k.actions.verb` is a verb as a word for an act; a fact about
  what people do with a verb (who cuts what with what) is another type.
- **New world `k.actions`** (version 1, exports `act`, `role`, `verb`, `marking`), 15 shards, 440 wires, 84,753
  bytes: `acts` (14 acts, 52 roles with their markers) and one shard of verbs per act: 291 verbs and phrasal verbs
  (make 15, remove 21, change 69, place 33, connect 18, group 19, take apart 23, pick 12, ask 19, copy 9, send 21,
  undo 6, save 12, load 14) and 83 markings.
- **From WordNet:** 269 verbs name 283 WordNet 3.1 verb senses (`sense`, many) and carry the gloss of the first;
  `core.source="wordnet 3.1"` and `named=model` (which act a sense means, and the roles, are my reading).
  **Hand-written:** 22 verbs that WordNet does not list in the meaning (`hand-core 1`): turn into, change into,
  make into, recolour, recolor, fill, scale, scale up, scale down, put together (as group), pull apart, ungroup,
  unlink, make a copy of, share, send over, take back, roll back, go back, hold on to, pull up, bring up. The
  phrasal verbs asked for: put on (place, and make: "add to something existing"), take off, get rid of (WordNet),
  turn into (hand-written; WordNet has no entry).
- **What a verb says:** the role of its object, of a complement after it (paint the door red), the attribute and
  the value the verb itself fixes (enlarge: size, larger; 47 verbs have an attribute), `separable=true` for 56
  phrasal verbs, `after_particle` for 7 (put the hat on the man). No notation: the markings are their own facts.
- **Read:** for about 390 candidate verbs I printed the first 4 or 5 WordNet verb senses (the other words of the
  synset and the gloss, cut at 85 characters) and read them all, about 1,500 senses, and chose each sense by its
  number. For make, set, turn, draw, flip, lighten, order, save, open, print, post, share, take, check, give,
  keep, cut, move, add, fill I read up to 40 senses, the later ones through a filter of words (computer, cause,
  select …). The 12 senses found through another verb of the same synset (colour by color 1, take by choose 1)
  were read again in the table of glosses. **Not read:** the later senses (after the 5th) of the other verbs; the
  example sentences; WordNet's verb frames (they are not imported; the roles are mine, not WordNet's).
- **Left out because I was not sure:** show and display as asking; lighten and brighten for a lighter colour;
  cancel and reset as undo; order as putting in an order; print; redo; start over; dress; wear (a state, not an
  act).
- **Judgement that is mine:** the roles of each act and their markers; the 23 place prepositions; which acts are
  opposites; which verbs are separable.
- **What SOP Lang could not say:** that a role named by a verb or a marking is a role of its act (a join across
  facts): a test. That `separable` is only for a text of two words: a test.
- Tests: the shards are what the tool gives; roles; the phrasal verbs asked for; 100 or more verbs join
  `k.words.sense` with the same gloss; the table of glosses against the raw files when they are there; 10
  questions; the vocabulary index.
- Numbers: k.actions 15 shards, 440 wires, 84,753 bytes. Catalog 16 worlds, 797 shards, vocab 19,769 words (before:
  15 worlds, 782 shards, 19,600 words at b705b3c; the first worker's hats are in between); 0 errors, 0 warnings.
  npm test 2,459 pass, 5 skipped, 0 fail.

## R7.2 (2026-11-13): `k.actions`, 187 common verbs

- **Two types added to `k.actions`** (now version 2, exports `act`, `role`, `verb`, `marking`, `action`, `similar`).
  The second worker published `k.actions` for the acts of Round 8 while I wrote this as a world of its own; on
  the rebase I merged the two as that worker's log entry asks: one module, their types and shards untouched, mine
  beside them (shards `actions-*`, questions ac-11 to ac-24, `tests/k.actions.test.mjs`). `k.actions.action`: the verb, `group` (move,
  hands, make, change, sense, mind, talk, body, social, nature), `who` (many), `object` (to what; many), `tool`
  (many), `where` (k.scenes scenes; many), `result`, `opposite`, `undone_by`, `example`. 187 actions (150 asked
  for), 5 of them phrases (pick up, put on, take off, put out, knock down). 82 have an opposite, 53 an action that
  undoes them. Five shards by group (117, 125, 197, 165, 212 wires; 124,219 bytes), written by
  `tools/actions-core.mjs` from `tools/actions-data.mjs`.
- **Words:** the other forms of each verb (third person, past, -ing) are `core.word` facts, by rule with 174
  forms of 118 verbs given by hand (irregular, doubled, or of a phrase). **All 187 lines of forms were read** (`--forms`): none wrong.
- **Near-synonyms are not words:** 442 `k.actions.similar` facts (stroll → walk, rub out → erase, grab → catch and
  take), the same choice as `k.objects.stand_in` (answer to Q21): a host that reads "stroll" as "walk" knows it has
  widened the word. A verb that is an action itself is not listed as similar to another.
- **Links to `k.commonsense`:** every verb used in `can` / `cannot` by `k.commonsense` and `k.animals` (14 verbs) is
  an action; a test holds it. Nothing was imported: ConceptNet is still not reachable.
- **Joins measured:** every `where` is a scene (a test); 243 of 268 tools are a drawing, a stand-in or a `k.body`
  part; 308 of 542 things done-to have a drawing.
- **Checked by test:** an opposite is said from both sides (the first table had 9 one-sided ones: run/walk,
  wash/dirty, win/lose …; removed); `undone_by` and `opposite` name other actions; the example sentence uses the
  verb.
- **Not looked at / not checked:** nothing here is drawn. The facts were written by a language model and read
  once in the table; the `who`, `object` and `result` values are short common-sense phrases with no second source.
- **Next to the acts:** `k.actions.verb` (second worker) says which act a verb means and how its roles are marked;
  `k.actions.action` says what people, animals and things do with a verb. 47 verbs are in both (cut, draw, erase,
  join …); nothing joins the two types yet but the verb's text.
- **Judgement that is mine:** which 187 verbs and everything said about them; "undone by" is said only where one
  plain action puts things back (break → mend, hide → show), not for cut, burn or eat.
- **What SOP Lang could not say:** that the opposite of an opposite is the action itself (a rule over two facts
  with the values crossed): a test.
- Numbers: k.actions 20 shards (5 of them `actions-*`: 816 wires, 124,219 bytes). Catalog 16 worlds, 802 shards, vocab 20,228 words; 0 errors, 0 warnings. npm test 2,482 pass, 0 fail.

## Round 8, item 3 (2026-11-13, second worker): `k.values`, the words for values

- **New world `k.values`** (version 1, exports `colour`, `scale`, `step`, `comparative`, `shape`, `direction`,
  `position`, `set_word`, `number`), 7 shards, 838 wires, 107,370 bytes, written by `tools/values-core.mjs`.
- **Colours:** 141 CSS colours with `rgb` ("#RRGGBB", the form `k.objects` and `k.faces` use) and the keyword as
  `css`. New source `css-colors 2.1.1` (`sources/css-colors/SOURCE.md`): the list of the package `color-name`
  (MIT), pinned by commit; the 7 keywords with "gray" are word facts of the "grey" colours. The name is the keyword
  written as words (a small word list splits it; all 141 read). 29 common names CSS lacks, hand-written, with
  `rgb_about` (a usual value, from memory of the usual tables; a schema rule refuses a colour with both).
  `basic` (one of the 11 colour names of `k.objects.part.colour`): 62 by the last word of the name, 25
  model-labelled (`named=model`), 20 of the common names; 54 CSS colours have none on purpose. I tried the
  nearest-name rule of `tools/import/svg-parts.mjs` (CIE Lab) first and read its 148 answers: it calls blue and
  navy purple and cyan white, so it is not used.
- **For the first worker (R7.3 `k.colours`):** no `k.colours` world existed when this was pushed. `k.values.colour`
  holds only name, RGB, CSS keyword, basic colour and other words; families, light and dark, mixing and typical
  things can join it by `name` instead of listing RGB values again. `k.values.shape` holds only the names, plurals
  and adjectives of 30 shapes and `solid`; sides, corners and things of a shape are left to `k.shapes`.
- **Scales:** 13 scales, 44 steps with ranks; `size` has the five sizes of `k.scenes.thing` (a test compares
  them); `amount` is none, a bit, some, a lot, all; `degree` is slightly … extremely. 82 comparatives and
  superlatives with the scale and the way. Other words for a step are `core.word` facts.
- **Also:** 30 shapes, 18 directions (opposite; a step x, y for the 12 in the plane of a picture), 13 positions
  (column, row, depth), 19 set words (`picks`, `manner`), 222 number words (cardinals and ordinals to 99 and the
  round ones above; times, multiples, groups, fractions; `third` as a fraction has `value_about=0.333`).
- **Read:** every CSS colour fact (name, RGB as printed, basic); the tables of scales, comparatives, shapes,
  directions, positions and set words as written in the tool; of the numbers the first, the fractions and four
  others in the shard. **Not looked at:** no colour was drawn, so the usual RGB values of the 29 common names were
  not seen as colours; the generated number words 21 to 99 were not read one by one (a test checks four).
- **Judgement that is mine:** which common colour names and their values; which steps a scale has and which words
  go to which step ("a few" as a word for "a bit"; fairly, rather and pretty as "quite"); what each set word picks.
- **What SOP Lang could not say:** that the ranks of a scale run from 1 to `steps` without a gap, and that a
  direction's opposite points back: tests.
- Tests: `tests/k.values.test.mjs` (5), 12 questions (`va-01` to `va-12`).
- Numbers: k.values 7 shards, 838 wires, 107,370 bytes. Catalog 17 worlds, 804 shards, vocab 20,496 words (19,769);
  0 errors, 0 warnings.
  npm test 2,477 pass, 5 skipped, 0 fail.
- After the rebase on the first worker's R7.2 (187 everyday actions in k.actions): catalog 17 worlds, 809 shards, vocab 20,954 words; npm test 2,495 pass, 5 skipped, 0 fail.

## R7.3 (2026-11-13): `k.colours` (33 colours, 25 mixes) and `k.shapes` (36 shapes)

- **New world `k.colours`** (version 1, exports `colour`, `mix`): `k.colours.colour` with `family` (the eleven basic
  colours), `tone` (light, medium, dark), `temperature` (warm, cool, neutral), `lighter`, `darker`, `complement`,
  `kind=metallic`, `thing` (typical things; many); `k.colours.mix` (`a`, `b` in the order of the alphabet, `gives`):
  25 pairs. Shard `colours`: 91 wires, 13,999 bytes. No RGB here (see Q28).
- **New world `k.shapes`** (version 1, exports `shape`): 21 flat shapes, 5 lines, 10 solids; `sides` and `corners`,
  or `faces`, `edges`, `corners` and the shape of the faces; `round`, `equal_sides`, `symmetric`, `flat` (the solid
  seen from the front), `is_a`, `thing`. Two rules refuse `sides` on a solid and `faces` on a flat shape. Shard
  `shapes`: 72 wires, 12,813 bytes. Both written by `tools/colours-shapes-core.mjs`.
- **Checked by test:** lighter and darker agree with the tone; a complement is said from both sides; every mix
  names three colours of the world; sides equal corners for straight-sided flat shapes; corners − edges + faces = 2
  for cube, cuboid, pyramid and prism; the eight part shapes of `k.objects` are shapes here.
- **Joins measured:** 123 of 126 typical things of colours and 124 of 128 of shapes are drawings or stand-ins. As
  a second check of the colours, the colour names on the parts of those drawings: 105 of 123 drawings carry the
  family of the colour said. I read the 21 that did not at the first count: four claims were taken out as doubtful
  of the real thing (a blue whale and dolphin, a silver key and coin); the others are true of the thing and the
  drawing is in another colour or lost colours in conversion (a brown plum, a green pond, a black-and-white nail).
- **Not looked at:** no drawing was opened for this; the typical things rest on their names and on the part
  colours. The numbers of the less common shapes (star 10 and 10, cross 12 and 12, arrow 7 and 7, cone 2 faces, 1
  edge, 1 corner) are mine and were checked only by counting once more.
- **Judgement that is mine:** which colours and shapes; tone and temperature (turquoise is filed under blue; lime
  is cool); the mixes are those of school paint boxes (purple and yellow give brown), not of light.
- **What SOP Lang could not say:** "a darker colour is not lighter in tone", "the complement of the complement is
  the colour", "a pair of a mix is in the order of the alphabet": comparisons across facts or of two values; tests.
- **Asked:** Q28 (these two worlds next to `k.values` of Round 8). Meanwhile both stay.
- **`k.values` arrived on the rebase** (second worker, R8.3: colour names with RGB, shape names). It is built as
  option (a) of Q28, so nothing was folded: a test now requires that every colour of `k.colours` is a
  `k.values.colour` by name or word (all 33 are); 28 of the 36 shapes are named by `k.values.shape` (not: polygon,
  drop, cloud shape, wavy line, hemisphere, egg shape, prism, torus). The generated files were rebuilt, not merged.
- Numbers: catalog 19 worlds, 811 shards, vocab 21,044 words; 0 errors, 0 warnings. npm test 2,529 pass, 0 fail.

## Round 8, item 2 (2026-11-13, second worker): `k.attributes`

- **New world `k.attributes`** (version 1, exports `attribute`, `found`, `kind`, `thing`), 6 shards, 828 wires,
  119,537 bytes, written by `tools/attributes-core.mjs`.
- **Attributes and where they are found:** 15 attributes; 26 `k.attributes.found` facts name the world, type and
  key that hold the values (size and place: `k.scenes.thing`; legs, habitat, food, covering, sound: 
  `k.animals.animal`; colour of foods: `k.food.food`). **Nothing is copied** from those worlds: an application
  reads the value where it is. A test checks that each world, type and key exists. 26 kinds of things with the
  attributes each usually has.
- **Usual values:** `k.attributes.thing`, 761 things from `sources/hand-core/attributes.tsv`, all `named=model`:
  kind 688, colour 256, material 423, wheels 47, can 242, used_for 459. The names are those of the 1,500 common
  things first (about 480 rows), then animals for their colour (69), then nature, materials, vehicles and
  household things. A key is given only where it is plain; I took the colour away again from about 90 rows of
  the first draft (a gun, a tank, a barn, a postbox, a pencil, a raincoat, a rocket, a statue, drinks).
- **Short of the task:** the reviewer asked for the usual colours of 2,000 things. There are 256 here and 254 in
  `k.food`. Most common things have no usual colour, and for the rest I stopped where I was no longer sure. No
  source was imported for this: ConceptNet is not reachable; WordNet glosses were not mined (a gloss rarely says a
  colour in a form a rule can trust). Number of legs, habitat and food exist only for the 294 animals of
  `k.animals`.
- **Audit:** a seeded sample of 90 rows read again: 87 right, 0 wrong, 3 unclear, all three corrected (temple:
  stone taken out; roller skate: kind taken out; one row with no value dropped, and with it 10 other rows that
  said nothing). `sources/hand-core/attributes-audit.tsv`. **Not read again:** the other 671 rows after writing
  them; the colours of the first 480 rows were read once more as a list.
- **Judgement that is mine:** every value; the kinds; which attributes a kind has.
- **What SOP Lang could not say:** that a `found` fact names a type and key that exist in another world: a test.
- Tests: `tests/k.attributes.test.mjs` (4), 10 questions (`at-01` to `at-10`).
- Numbers: k.attributes 6 shards, 828 wires, 119,537 bytes. Catalog 18 worlds, 815 shards, vocab 20,982 words (20,954); 0 errors, 0 warnings. npm test 2,510 pass, 5 skipped, 0 fail.
- After the rebase on R7.3 (k.colours, k.shapes): catalog 20 worlds, 817 shards, vocab 21,070 words; npm test 2,539 pass, 5 skipped, 0 fail.

## Q27 and Q28 applied (2026-11-13, first worker)

- **Q27 (yes):** a thing counts as drawn when any drawing in the catalog carries its name, whatever the source. It is
  now the one rule of `tools/coverage.mjs` and takes in the rule of Q25 (hand-written objects): the sense check takes
  no drawing away from its name. `sense-check.tsv` stays as the record of what each drawing shows; the links still
  use only the sense kept. The statistic `wrongSense` is gone; `unlistedSense` counts the drawings of a meaning that
  WordNet lacks (1: `tablet`).
- **Recount, 1,500 common things:** with a drawing of that name 680 (before 679); WordNet synonym 68; direct
  hypernym 179; another word of a hand-written object 25; hand stand-in 71; with no drawing at all 477 (before 478).
- **Q28 (keep both):** nothing to change; `k.values` holds the words and scales, `k.colours` and `k.shapes` the facts.
- Both questions moved to Closed in `questions.md`; no question is open.
- Not looked at: nothing was drawn or labelled here.
- Numbers: catalog 19 worlds, 811 shards, vocab 21,044 words; 0 errors, 0 warnings. npm test 2,529 pass, 0 fail.
- After the rebase on R8.2 (`k.attributes`, second worker): catalog 20 worlds, 817 shards, vocab 21,070 words; npm test 2,544 pass, 0 fail.

## Round 8, item 4 (2026-11-13, second worker): `k.wearables`

- **New world `k.wearables`** (version 1, exports `place`, `wearable`), 2 shards, 236 wires, 38,970 bytes, written
  by `tools/wearables-core.mjs`.
- **Places:** 15 places on the body (head, hair, eyes, ears, face, neck, body, back, waist, arms, wrist, hands,
  finger, legs, feet), each with its box on the drawing `person` of `k.objects` (the anchor on the body;
  `named=model`), `pair=true` for seven, the `k.faces` slot that draws what is worn there (head: hat; eyes:
  glasses; ears: earrings; body: shoulders: the anchor on a face is the box of that slot, not copied), and the
  `k.body` part.
- **Wearables:** 105, with `worn_on`, `covers`, `layer`, `pair`, `worn_for`; 91 name a drawing in `k.objects`, 36
  a `k.faces` variant (`face_slot`, `face`); hood and cardigan have neither. Everything the roles of `k.people`
  wear is a wearable here or a word of one (a test); four were added for that (police helmet, military helmet,
  football kit, and "hat Christmas" as a word of Christmas hat).
- **Looked at:** the 15 boxes drawn in colour over `preview/person.svg`, one picture at 700 px: all lie where the
  name says. The person is a stick figure: body, back and waist are boxes around the body line. **Not looked at:**
  the 91 drawings named (a test checks that each exists; whether each shows the wearable was not looked at
  again here, the names were taken from the object list); no wearable was composed onto the person.
- **Not done:** drawings for the common ones that have none. Every common wearable I listed already had a drawing
  except 14 (cowboy hat, sun hat, beret, party hat, chef hat, headscarf, hood, bow, monocle, cardigan, cape,
  cloak, overalls, space suit), and 12 of these are `k.faces` variants.
- **Judgement that is mine:** the places and their boxes; where each thing is worn, what it covers, its layer and
  what it is worn for.
- **What SOP Lang could not say:** that `worn_on` names a place, `drawing` an object of another world, `face` a
  variant of the named slot: tests.
- Tests: `tests/k.wearables.test.mjs` (4), 8 questions (`we-01` to `we-08`).
- Numbers: k.wearables 2 shards, 236 wires, 38,970 bytes. Catalog 21 worlds, 819 shards, vocab 21,209 words (21,070); 0 errors, 0 warnings. npm test 2,552 pass, 5 skipped, 0 fail.

## Aspects in `k.attributes` (reviewer block 2026-11-13 21:30; second worker)

- **Order:** the block asked for this before `k.wearables`; `k.wearables` was already pushed when the block
  arrived, so this comes right after it.
- **Aspects as facts:** `k.attributes.aspect`, 8 aspects (visual, spatial, relational, numeric, textual,
  geographic, temporal, social) with `shown_in` where plain (picture, diagram, chart, map, document, card; none
  for temporal and social: I was not sure which view). Every `k.attributes.attribute` now names its `aspect`.
- **Which kinds have which aspects, and where:** `k.attributes.family`, 16 families (common thing; animal; food;
  country, city, river, mountain, mountain range, continent; kind of person, role; month, weekday, season,
  duration; body in space) and `k.attributes.shows`, 129 facts: family, aspect, world, type, key, and `by` (the key
  of that type that names the thing). A test checks that every type and key exists. New shard `aspects` (153
  wires). No per-thing fact was written for the 1,500 common things: a thing has an aspect when a fact named by
  it has one of the keys, which is a lookup; the table counts it.
- **One generated table:** `docs/worlds/k.attributes/ASPECTS.md`, written by `tools/aspects-report.mjs` (needs the
  raw WordNet and frequency files for the row of the common things). Common things, of 1,500: visual 1,044,
  spatial 1,018, relational 1,280, numeric 45, textual 1,188. Animals (156): visual 152, spatial 155, numeric 144.
  Countries (238): relational, textual, geographic all, numeric 237. Rivers and mountain ranges have no number;
  continents have nothing but a name and the countries that name them; bodies in space: numeric 9 of 25.
  **The counts go stale when another world grows: rerun `node tools/aspects-report.mjs`** (the test checks only
  the rows and columns, so it does not break the other worker's runs).
- **Correction:** the `k.attributes` entry above and its world page said `k.animals` has 294 animals and `k.food`
  254 foods; those were wire counts with the word facts. Counted by type: 156 animals, 154 foods. The page is
  corrected.
- **Judgement that is mine:** which key belongs to which aspect (habitat and works_at as spatial; can and used_for
  as relational; sound and gloss as textual; orbit_years as temporal; material and covering as visual).
- **Not done:** the numeric aspect has no unit yet on my side (wheels is a count); `k.units` joins are the first
  worker's part. The kinds of `k.colours`, `k.shapes`, `k.body`, `k.feelings` are not families yet.
- Numbers: k.attributes 7 shards, 981 wires, 148,506 bytes (was 6 shards, 828 wires). Catalog 21 worlds, 820 shards, vocab 21,253 words (21,209); 0 errors, 0 warnings. npm test 2,559 pass, 5 skipped, 0 fail.

## Round 9, item 1 (2026-11-13, first worker): anchors for what people sit, stand, lie or put things on

- **98 new anchors as places in the frame** (`sources/hand-core/anchor-points.tsv`, shard `k.layouts/anchors-points`,
  98 wires, 17,771 bytes) on 68 objects, for drawings whose parts have no names (62 imported objects) and for
  places on hand-written objects that no part marks: swing, bench, stool, armchair, rocking chair, high chair,
  wheelchair, sun lounger (seat); bed, single bed, desk, coffee table, bookcase (four shelves), cupboard, chest of
  drawers, piano, cooker, fireplace, tray, plate, rug, blanket, trampoline, stairs, skateboard (surface); horse,
  camel, elephant, motorcycle, sled, sledge, sleigh, log, slide (seat); ship, sailboat, canoe, rowing boat, bus,
  tractor, lorry, hot air balloon, cart, wheelbarrow, shopping cart, basket, bowl, bucket, pot, sink, bathtub,
  treasure chest (deck or inside); pond (water); five kinds of tree (crown, foot, a branch to sit on, a branch to
  hang a swing from); door, window, vase, hook; on the person the feet and the hips (`kind=base`: what a standing
  and a sitting person rests on) and on the dog the neck (leash). `part` is absent on these; the schema comment says so.
- **10 new anchors on named parts** of hand-written objects (`anchors.tsv`, now 127): roof (roof, ridge), car
  (roof), raft (deck), ladder (two rungs), fence (top rail), wagon, cradle, plane (inside).
- **The list of the task:** swing, chair, bench, bed, table, shelf, boat, horse, bicycle, car, tree (branch), roof,
  head (the top of the person's head, as before), hand (the person's hands, as before): all have an anchor now.
- **Target, "every thing in `k.scenes` that another thing is usually on or in":** 56 different things are named
  by `on=` (1,045 facts). Before: 26 had an anchor on their drawing (919 facts). Now: 51 (1,019 facts). Without:
  pirate ship, stall, ceiling (no drawing in `k.objects`); cot and witch (looked at; the drawing shows no sure
  place). A test holds this list.
- **Looked at:** 99 drawings under a grid of ten units (9 sheets, `tools/anchor-sheet.mjs --grid`), from which the
  places were read; then every one of the 98 rows drawn in red on its object (70 pictures on 7 sheets at 330 px)
  and the 10 new part anchors (8 pictures). Verdicts in `anchor-points-audit.tsv`: 92 right, 6 wrong and
  corrected (horse and elephant back, cart, wheelchair seat, rug, log), the six looked at again. Left out as not
  sure: cot, donkey (it bucks), witch, broomstick, towel, beach towel, cow, turtle, cloud, cat, pillow, gate.
- **Not looked at:** the 117 older anchors again; how a figure placed by these anchors looks (nothing composes
  them here). A sloping seat (bench, sledge, ship deck) is given as a level line through its middle: off by up to
  five units at the ends.
- **Judgement that is mine:** every place and every `holds` list; the kind (a log and a slide top are `seat`).
- **What SOP Lang could not say:** that `of` names an object of another world and the box lies in its drawing: tests.
- Tests: `tests/k.layouts.test.mjs` (the audit of the new table, the target list), questions la-19 to la-23.
- Numbers: k.layouts 4 shards, 571 wires (was 3 shards, 463). Catalog 20 worlds, 818 shards, vocab 21,077 words; 0 errors, 0 warnings. npm test 2,550 pass, 0 fail.
- After the rebase on R8.4 (`k.wearables`, second worker): catalog 21 worlds, 820 shards, vocab 21,216 words; npm test 2,563 pass, 0 fail.

## Round 8, item 5 (2026-11-13, second worker): `k.parts`, usual parts of common things

- **New world `k.parts`** (version 1, exports `whole`, `inherited`), 24 shards by first letter, 677 wires, 145,908
  bytes, `core.source="wordnet 3.1"`, written by the new import `tools/import/parts.mjs` from the list of
  `tools/coverage.mjs` (the sense kept there) and WordNet's part meronyms. For that, a coverage entry now also
  carries its `sense` (one field added in `tools/coverage.mjs`; nothing it writes changes).
- **Own parts:** `k.parts.whole`, 307 things, 816 parts, with the gloss of the sense. **Inherited:**
  `k.parts.inherited`, 370 facts for 328 things, one or two kind-of steps up. **541 of the 1,500 common things
  have at least one part; 959 have none.** The reviewer's example holds in WordNet's names: a car has "car door",
  "automobile engine" and, as a motor vehicle, "car wheel".
- **What I read, and what it changed:** (1) a seeded sample of 70 facts of the first version (inherited up to
  three steps): the own parts were right as WordNet data, but about 20 of the 49 inherited facts misled (a bra
  with sleeves, a clam with a carapace, a pony with horsemeat, an accordion with a bell). So: at most two steps;
  the second step only for 13 kinds; kinds too general are not followed (28 names); parts filed under foods are
  not parts of a plant or animal. (2) Then **every inherited fact** of the second version (about 520 lines, each
  to 110 characters; the long lists are those of building, car, motor vehicle, garment and bird, read in full
  once): `sources/coverage/not-parts.tsv` refuses 26 kinds for every thing, 51 single things and one single
  part, each with a reason. (3) Every fourth own-part fact (77 of 307) with the start of its gloss.
  **Not read:** the other 230 own-part facts; the inherited facts after the refusals were not printed again
  (a test checks that nothing refused is left).
- **Known weak:** the sense is the one the coverage rule keeps (turtle the sweater, lobster the meat; the gloss
  says it); WordNet's own lists hold odd parts (a dog's only own part is "flag"; a building has an elevator and a
  cullis); a part is named by the first word of its synset ("car door"), so "door" does not find it; a house gets
  rooms but no roof (roof is a part of "building", further up than the rule follows). No model-labelled parts
  were added for the 959 things without one.
- `k.attributes`: the attribute `parts` is now also found in `k.parts` (2 `found` facts, 2 `shows` rows; 131 rows);
  `ASPECTS.md` regenerated (common things, relational: 1,326 of 1,500, was 1,280).
- **What SOP Lang could not say:** nothing new.
- Tests: `tests/k.parts.test.mjs` (4; the equality with the import when the raw files are there), 6 questions.
- Numbers: k.parts 24 shards, 677 wires, 145,908 bytes. Catalog 22 worlds, 844 shards, vocab 21,336 words (21,253); 0 errors, 0 warnings. npm test 2,570 pass, 5 skipped, 0 fail.
- After the rebase on R9.1 (anchors): catalog 22 worlds, 845 shards, vocab 21,343 words; npm test 2,576 pass, 5 skipped, 0 fail.

## Round 9, item 2 (2026-11-13, first worker): `k.animals`, 314 animals with size class, group name and what they cannot do

- **314 animals** (were 156): 158 new ones (30 birds, 22 fish, 34 invertebrates, 15 reptiles and amphibians, 57
  mammals) and, for all, two new keys: `size` (tiny … huge, the classes of `k.scenes.thing`) and `group` (herd,
  flock, pack, pride, school, swarm, colony, pod, troop, mob, covey, clan). New class `myriapod` (centipede,
  millipede). With a value: legs 284, covering 269, habitat 313, eats 283, young 261, sound 117, group 110.
- **Can it fly, swim, climb:** every animal that is not a bird or an insect and is not said to fly gets
  `cannot=fly` (225 animals with the five flightless birds and the flea), so "can a cow fly" finds a fact; `cannot=climb` is said for 36 hoofed
  and sea animals; `can=swim` and `can=climb` where sure. A missing value still says nothing.
- **Source:** all model-labelled. WordNet has no such facts in a form a rule can trust; a Wikidata dump of the
  needed properties is not on GitHub that I know of, and I did not search for one. The table is now
  `sources/hand-core/animals.tsv` and the shards are written by `tools/animals-core.mjs` (the 156 older rows were
  moved into the table by a script, value for value). **Every animal now carries `named=model`**, also the older
  ones: they were written the same way.
- **Which animals:** the frequency list × WordNet's animal senses gives many words that are not kinds of animal
  (tom, queen, chick, pet, beef, tail; 420 words read), so the 158 were chosen by hand with that list next to me:
  common kinds a child's book has. Words for the male, the female and the young (mare, stallion, calf) are not
  animals of their own here; breeds of dog are left out.
- **Audit:** a seeded sample of 200 of the 314 rows, each printed with all its values and read again
  (`animals-audit.tsv`): 186 right, 12 wrong and corrected (tuna: its size was that of the tin of tuna in
  `k.scenes`; swordfish and sturgeon: covering; piranha and pufferfish: diet; praying mantis: abilities;
  tarantula: size; leech, lemur, gibbon, baboon: legs or young; sea lion: climb), 2 unclear and taken out (the
  sound of the locust, an aardvark swimming). **Not read again:** the other 114 rows.
- **Drawings looked at:** one sheet of the 24 objects that carry the name of a new animal: 22 show the animal and
  are joined by `drawing`; `crane` is the machine and `kiwi` the fruit, so those two animals have no drawing.
  135 of 314 animals have a drawing.
- **Size in two places:** `k.scenes.thing` has a size class for drawable things, `k.animals.animal.size` for
  animals. A test requires that they agree where the drawing has the name of the animal (132 compared). For the
  second worker: `k.attributes.found` names `k.scenes.thing` for size; for animals without a drawing the value is
  now in `k.animals.animal.size`.
- **Natural questions (item 8):** new tool `tools/ask-sample.mjs` (domains in `tools/ask-domains.mjs`): all
  questions of a domain (a thing × a template), shuffled with a fixed seed, the first 100; a question finds a fact
  when its sopworld query is supported, by the name or by a `core.word` of it. Animals (314 animals × 11
  templates: legs, covering, size, habitat, food, sound, young, group, fly, swim, climb): **before 53 of 100,
  now 81**. The 19 without a fact: the sound (7) and the group (6) of animals that have none said, and single
  missing values. The coverage report of the common things (`tools/coverage.mjs`) is unchanged: 680 by name, 477
  with no drawing.
- **Judgement that is mine:** every value; the size classes of animals without a drawing; which group name.
- **What SOP Lang could not say:** "an animal that is not a bird or an insect cannot fly unless said" as a rule
  that adds the fact (the tool writes the facts instead).
- Tests: `tests/k.animals.test.mjs` (5), questions an-17 to an-22.
- Numbers: k.animals 5 shards, 597 wires, 108,984 bytes (was 294 wires, 46,944 bytes). Catalog 21 worlds, 821
  shards, vocab 21,510 words (21,260); 0 errors, 0 warnings.
- npm test: 2,580 pass, 1 fail on the first run (`can=glide` is not an action of `k.actions`); flying fish `glide` and gibbon `swing` were taken out and the failing file and the animal, catalog, validation and question tests run again: pass. After the rebase on R8.5 (`k.parts`): the same files again, pass.

## Round 8, item 6 (2026-11-13, second worker): coverage report of the common things

- **New generated page `docs/worlds/COVERAGE.md`**, written by `tools/coverage-report.mjs` (needs the raw WordNet
  and frequency files; run `tools/build-catalog.mjs` before it, for the vocabulary index, and after it). Counted
  from the shards, for the 1,500 common things, each "by its name" and "through its drawing" (the drawing of the
  word, or the one it reaches through a synonym or a stand-in).
- **Numbers (of 1,500):** a drawing of its own name 680, a synonym or stand-in with a drawing 343, neither 477.
  Place 637 by name + 350 through the drawing (none 513); size 650 + 365 (485); usual colour 203 + 46 (1,251);
  colours of the parts of a drawing 654 + 369 (477); parts from WordNet 541 + 57 (902); named parts of a drawing
  545 + 312 (643); joins between kinds 64 + 78; an anchor 133 + 102; material 303 + 104; what it can do 232 + 77;
  what it is used for 336 + 142; wheels 33 + 12; legs 100 + 32; a kind and a definition in `k.words` 1,072 + 116
  (none 312); where it is worn 37 + 21.
- **Per world** (a common thing is a word of the vocabulary index that leads to a shard of the world): k.objects
  1,094, k.words 1,075, k.scenes 677, k.parts 544, k.attributes 542, k.layouts 210, k.animals 113, k.food 111,
  k.wearables 62, k.faces 45; the others under 25.
- **What the gaps say for the next round:** (1) 312 common things have no sense in `k.words` (sunflower, raisin,
  teapot, locomotive, chimpanzee): `k.words` keeps the words of the first 20,000 lines of the frequency list and
  these come later; they have no definition and no kind. (2) The usual colour is the thinnest attribute (17%);
  dog, horse, fish, bird have none because they have no single colour, but many things with a plain colour are
  still missing. (3) 902 things have no part from WordNet; 643 have no named part in a drawing either.
  (4) 513 have no place and 485 no size: nearly all are the 477 without any drawing, since place and size were
  labelled for drawings. (5) What a thing can do and is used for: about 70% missing.
  A missing value is not always a gap (a car has no usual colour; wheels, legs and where a thing is worn belong
  to some kinds only): the page says so and prints no gap list for those three.
- **Looked at:** the page as generated (the tables and the gap lists). The counts were not checked by hand
  against the shards; a test checks that the three parts of every row add up to 1,500 and that every type and
  key named exists.
- **The counts go stale** when a world grows: rerun `node tools/coverage-report.mjs` and
  `node tools/aspects-report.mjs`, then `node tools/build-catalog.mjs` (both pages are under `docs/worlds`, so the
  catalog version changes with them). The tests check structure only, so a stale page does not fail them.
- Tests: `tests/coverage-report.test.mjs` (3).
- Numbers: catalog 22 worlds, 845 shards, vocab 21,343 words; 0 errors, 0 warnings. npm test 2,579 pass, 5 skipped, 0 fail.
- After the rebase on R9.2 (314 animals): both pages regenerated (animals 314 in ASPECTS.md; legs and what it can do change in COVERAGE.md); catalog 22 worlds, 845 shards, vocab 21,593 words; npm test 2,590 pass, 5 skipped, 0 fail.

## Questions Q29 and Q30 (2026-11-13, second worker)

- Q29: the usual colour for the rest of the 2,000 things (only where plain; from the drawing; or "any colour" as a
  fact). Q30: plain names and model-labelled parts next to WordNet's in `k.parts`. Neither blocks; meanwhile (a)
  in both. Round 8 of the second worker is done as far as the six items and the aspects go.

## Round 9, item 3 (2026-11-13, first worker): places beyond countries in `k.geo`; `k.units.measure` (the unit of every number)

- **Capitals:** "capital of X" was answered for 195 of 238 countries and territories. Now for 232: the 37 for which
  Natural Earth marks no capital get it from the country list (mledoze/countries, ODbL, in the `-borders` shards):
  South Sudan, Nauru, Greenland, Puerto Rico, Hong Kong … Still none: Macao, Northern Cyprus, Åland and three
  territories without inhabitants (neither source names one). A test holds: every independent country but those
  three answers.
- **Lakes, from Natural Earth (`ne_10m_lakes`, newly fetched):** `k.geo.lake`, the 100 largest natural lakes with
  the countries on their shores and `area_about` in square kilometres: the area of the 1:10m outline worked out on
  the sphere, three digits kept. Checked against the usual figures in a test: Superior 82,100 (82,100), Victoria
  67,300 (68,900), Baikal 31,400 (31,500), Titicaca 8,130 (8,370).
- **Deserts and seas, from Natural Earth:** `k.geo.desert` (58) and `k.geo.sea` (72: the 5 oceans, 45 seas, gulfs,
  bays, straits, channels of scale rank 0 to 3; `ne_10m_geography_marine_polys`, newly fetched), each with kind or
  continent, centre and box.
- **What the geometry does not give, and I did not take from it:** river lengths (Natural Earth names rivers
  piece by piece: its Nile line is 2,760 km, its Amazon 3,150 km) and the areas of deserts and seas (label
  outlines: its Mediterranean is 1.57 million km² because the Tyrrhenian and the others are cut out; its Libyan
  Desert is 3 million km²). I worked them out, read the first thirty of each, and dropped them.
- **Hand-written numbers instead (`tools/geo-numbers.mjs`, shard `numbers`, `hand-core 1`, `named=model`,
  `_about`):** the length of 54 well-known rivers, the area of the 5 oceans, 17 seas, 17 deserts and the 7
  continents, as usually given; 12 other names (Amazon for Natural Earth's "Amazonas", Yellow River for "Huang").
  Each fact names a thing of the imported shards (the tool refuses otherwise) and merges with it. Left out because
  the usual figures disagree: Yenisei, Brahmaputra, Irtysh, Salween, Madeira, Okavango, Ebro, Bay of Bengal, East
  China Sea, Chihuahuan and Libyan Desert. **These numbers are from memory, with no second source in reach**
  (Wikidata is not reachable); a test checks only their order of size.
- **Mountains:** 627 already had `elevation` in metres; nothing added.
- **`k.units.measure` (the reviewer's block of 21:30: numbers with units):** a new type in `k.units` and shard
  `measures` (50 wires): for every numeric slot of `k.geo` and `k.animals` the unit (`unit=metre`, a
  `k.units.unit`), what it counts (`counts=person`, `counts=leg`) or `ordinal=true`; `approximate=true` for
  `_about` keys. `tools/measures-core.mjs` reads the schemas and refuses a numeric slot without an entry, so a
  number cannot be published without its unit in the worlds listed; the other Round 9 worlds join the list with
  their items. New unit `year`. **A choice of mine, not asked for in this form:** the unit is said once per
  slot, not on every fact, and in `k.units`, not in each world. If the reviewer wants it elsewhere it is one tool.
- **Natural questions (item 8), geography:** 160 well-known places written down without looking at `k.geo`
  (`sources/hand-core/questions/geo.tsv`: 60 countries, 25 rivers, 20 mountains, 15 lakes, 10 deserts, 17 seas
  and oceans, the continents), 428 questions (capital, continent, population, area; length, countries; height;
  area …). The seeded sample of 100: **before 66, now 97**. All 428: before 299, now 405. Without a fact: Lake
  Chad, Lake Geneva and Lake Constance (not among the 100 largest), the Dead Sea, the Mojave and the Arabian
  Desert (not in Natural Earth's list), Kilimanjaro, Vesuvius, Mount Olympus, Mount Cook, Kangchenjunga (not
  under these names among the 627 summits). The coverage of common things is unchanged (680 by name).
- **Looked at:** the names of all 100 lakes, 58 deserts and 72 seas as printed; the 37 capitals from the list.
  **Not looked at:** the countries on the shores of the lakes beyond Lake Victoria (a test); the boxes.
- **Seen and left:** Natural Earth files Russia under Europe, so Lena, Ob and Amur are rivers "in Europe".
- Tests: `tests/k.geo.test.mjs` (5), `tests/import.geo.test.mjs` (one more, on a fixture), questions geo-17 to
  geo-24, un-12, un-13.
- Numbers: k.geo 15 shards, 3,858 wires, 695,907 bytes (was 13 shards, 3,473 wires, 630,063 bytes); k.units 2
  shards. Catalog 22 worlds, 848 shards, vocab 21,881 words; 0 errors, 0 warnings.
- After the rebase on R8.6 (the coverage report, second worker): `tools/coverage-report.mjs` run again; one line changes in `COVERAGE.md` (`k.units` now has a word for 2 of the common things). npm test 2,611 pass, 0 fail.

## Round 9, item 4 (2026-11-13, first worker): `k.space`: colours and why, days and years, widths, distances, stars, kinds

- **Planets:** every planet now has `colour` (Venus, Jupiter and Saturn had none) and `colour_why`, one plain
  sentence ("Its soil is full of iron that has rusted."); `day_hours_about` (one turn, in Earth hours),
  `orbit_days_about` for the four inner planets (the year in Earth years was there), `diameter_about` and
  `distance_about` in kilometres. Moons, rings and order were there.
- **Sun and Moon:** colour and why, width, the length of a turn; the Sun's surface temperature (5,500 degrees
  Celsius) and age (4,600,000,000 years); the Moon's distance from the Earth (384,000 km) and its trip around
  it (27 days). Six named moons have a width.
- **Stars:** three more (Alpha Centauri, Vega, Betelgeuse); `light_years_about` for Proxima Centauri (4.2),
  Alpha Centauri (4.4), Sirius (8.6), Vega (25) and the Andromeda Galaxy (2,500,000). No distance for Polaris and
  Betelgeuse: books differ.
- **Kinds:** `about`, one plain sentence saying what each kind is; three new kinds (constellation, meteor with
  the word "shooting star", black hole).
- **Units:** every number of `k.space` is in `k.units.measure` (12 slots: hour, day, year, kilometre, degree
  Celsius, light year, counts of moons, two ordinals); new unit `"light year"`.
- **The earlier page said "not here: distances, diameters"** because books give them differently. They are here
  now as `_about` values of at most three digits, where books agree. All values are from memory (`named=model`,
  now on every fact of the world), with no second source in reach; **I read the whole table once more after
  writing it**, and a test checks the columns against each other: distances and years grow with the order;
  years squared equal distances cubed (Kepler's third law) within 8% for all eight planets; the size rank is the
  order of the widths; days and years of one orbit agree within 5%.
- **Natural questions (item 8), space:** 27 things written down without looking at `k.space` (the planets, Pluto,
  the Sun, the Moon, 6 stars, 10 kinds), 126 questions. The seeded sample of 100: **before 45, now 95**. All 126:
  before 54, now 121. Without a fact: the distance of the North Star and of Betelgeuse; what a planet, a moon and
  a black hole are made of.
- `COVERAGE.md` and `ASPECTS.md` run again: one number changes in the first (`k.space` has a word for one more
  common thing) and the row "body in space" in the second (28 bodies, more of them with a numeric aspect).
- **Not looked at:** nothing is drawn here.
- **Judgement that is mine:** the sentences; that a day is the turn around the axis (Mercury's sunrise to sunrise
  is longer); the rounding.
- Tests: `tests/k.space.test.mjs` (4), questions sp-16 to sp-22, un-14.
- Numbers: k.space 3 shards, 57 wires, 11,544 bytes (was 48 wires, 6,783 bytes). Catalog 22 worlds, 848 shards,
  vocab 21,900 words; 0 errors, 0 warnings. npm test 2,623 pass, 0 fail.

## Round 10, item 1a (2026-11-13, second worker): Q29 applied: usual colour, any colour, drawn colour

- **Three facts, never mixed.** (1) `k.attributes.thing.colour` stays as it was: 256 things, only where plain.
  (2) `colour=any` on **116** things of the table that come in any colour (car, ball, shirt, bag, hat, cup, pen,
  shoe, towel, balloon, umbrella, book, door, suitcase, flower, gem, sofa …): model-labelled, chosen by reading
  the 505 rows without a colour and keeping those I am sure of; `any` is a new value of the enum and never stands
  next to a colour (test). (3) New type **`k.attributes.drawn`**: `drawn_colour` (the eleven basic colours) and
  `drawn_shade` (the nearest of the 170 colour names of `k.values.colour`) for **2,103 of the 2,108** drawings of
  `k.objects`, the largest first, at most three (one colour 1,151 things, two 830, three 122). Not model-labelled:
  computed by the new `tools/drawn-colour.mjs`; the source of each fact is the source of its drawing, and the four
  shards (`drawn-hand` 225 wires, `drawn-mulberry` 953, `drawn-noto` 811, `drawn-openmoji` 114; 354,567 bytes
  together) carry the licence of that source.
- **How it is computed:** the drawing is sampled on 60 × 60 places; the topmost filled part at each place gives its
  exact colour (`rgb`; for a hand-written part the value of its first colour name); lines and arcs do not count. The
  value is mapped to the nearest `k.values` colour (CIE Lab): that name is the shade, its `basic` the basic colour
  (for the 62 names without one, the basic of the nearest name that has one). A colour is kept from a fifth of the
  filled places. Five drawings have only lines (water, conical flask, tripod, backstop, goal) and get no fact.
- **Looked at:** two contact sheets, 80 drawings of a seeded sample of 120, each with its computed colours and
  shades under it. About 73 of 80 read right (ship red and white, wheel grey, tangerine orange, crocodile green,
  poodle grey). The weak ones are all of one kind: a pale cream or skin tone has no basic colour and comes out as
  yellow (mains socket, sandpaper, the face under a swimming cap, a hand on a touch screen) or brown (the pig,
  shade apricot); an orange-brown is brown (cricket bat). The first version, which used the colour name already on
  the part, was worse (elephant white, frog yellow, pig white) and was replaced before publishing.
  **Not looked at:** the third sheet (40 drawings) and the other 1,983; the 116 `any` rows were not read a second time.
- `k.attributes.found`: colour is now also found in `k.attributes.drawn` (27 facts); `k.attributes.shows`: 2 rows
  more (common thing, visual). `tools/attributes-core.mjs` now replaces only its own shards.
- **COVERAGE.md** (regenerated, two new rows): usual colour 203 + 46 as before; usual or any colour 290 by name +
  89 through the drawing (none 1,121, was 1,251); drawn colour 653 + 369 (none 478). ASPECTS.md regenerated (no
  count changes: the visual aspect already counted the part colours).
- **Judgement that is mine:** which things are `any`; the threshold of a fifth and the limit of three; that an
  outline does not count.
- **What SOP Lang could not say:** that `any` excludes the other values of the same key (a test).
- Tests: `tests/k.attributes.test.mjs` (1 more: `any` alone, the shards equal the tool's output, every shade is a
  `k.values` colour), questions at-16 to at-18.
- Numbers: k.attributes 11 shards (were 7), 3,091 wires. Catalog 22 worlds, 849 shards, vocab 21,598 words; 0 errors, 0 warnings.
- After the rebase on R9.3 (k.geo places): catalog 22 worlds, 852 shards, vocab 21,886 words; npm test 2,610 pass, 5 skipped, 0 fail.

## Round 9, item 5 (2026-11-13, first worker): `k.body`: parts of hand, eye, ear and mouth, counts, what each organ does

- **91 parts** (were 53). New: the hand (palm, index, middle, ring and little finger, knuckle, fingertip), the eye
  (pupil, iris, eyelid, eyelash, cornea, lens, retina, the white of the eye), the ear (outer ear, earlobe, ear
  canal, eardrum, middle ear, inner ear), the mouth (gum, palate, incisor, canine, premolar, molar, wisdom
  tooth, milk tooth, jaw), and throat, windpipe, gullet, small and large intestine, pancreas, spinal cord,
  vertebra; each with where it is, how many and what it does where that is plain.
- **Counts:** `count_per_part` (5 fingers on a hand, 5 toes on a foot); the four kinds of tooth add up to 32, the
  milk teeth are the 20 of `child_count`; 33 vertebrae; `count_about` for muscles (600) and hairs (100,000).
- **What each main organ does, in one plain sentence (`about`):** 23 parts (brain, heart, lung, stomach, liver,
  kidney, intestine, small and large intestine, bladder, skin, pancreas, windpipe, gullet, spinal cord, and eye,
  ear, nose, tongue, tooth, skeleton, muscle, blood where a sentence helps). 13 outer parts got a `does` they
  lacked (finger, thumb, toe, leg, arm, wrist, ankle, shoulder, hip, eyebrow, lip, head, chest).
- **Numbers with units** (`k.units.measure`, 8 slots of `k.body`): the body's temperature (37 degrees Celsius),
  the blood of an adult (5 litres), the length of the small and large intestine (6 and 1.5 metres), the weight
  of brain, heart and liver (1.4, 0.3, 1.5 kilograms), all `_about`.
- **All model-labelled:** `named=model` is now on every part; no source was imported. **I read the 38 new wires
  and the 23 sentences once more in the shard after writing them**; a test checks the counts against each other.
  Not checked against a second source.
- **Natural questions (item 8), body:** 66 parts written down without looking at `k.body`, 210 questions (how
  many, where, what it does, which parts it has, a sentence for organs). The seeded sample of 100: **before 59,
  now 95**. All 210: before 117, now 190. Without a fact: what the back, heel, chin, cheek, forehead, belly or
  face "does", where muscles, veins, nerves and blood are, how many veins, nerves, gums, knuckles there are.
- **Judgement that is mine:** the sentences; `jaw count=2` (upper and lower); `eyelid count=4`; 33 vertebrae
  (books also say 24 for the movable ones).
- Tests: `tests/k.body.test.mjs` (4), questions bd-14 to bd-20.
- Numbers: k.body 1 shard, 175 wires, 23,725 bytes (was 112 wires, 12,168 bytes). Catalog 22 worlds, 848 shards, vocab 21,963 words; 0 errors, 0 warnings.
- `COVERAGE.md` and `ASPECTS.md` run again: one number changes in the first, nothing in the second.
- npm test 2,634 pass, 0 fail.

## Round 9, item 6 (2026-11-13, first worker): `k.food`: what dishes and foods are made of, usual colours

- **`made_of` (new key, many):** what a dish or a made food is made of, by the names of other foods where they are
  foods, else one of 20 general words (water, yeast, spices, vegetables …; a test holds the list). 118 foods have
  it, among them every food of kind `dish`: bread (flour, water, yeast, salt), pizza (flour, tomato, cheese),
  pancake (flour, egg, milk), pesto (basil, olive oil, garlic, cheese, nuts).
- **75 new dishes and made foods** in a new shard `dishes`: soups, pasta and rice dishes, egg dishes, breads
  (croissant, bagel, pretzel, tortilla), sauces (mayonnaise, tomato sauce, pesto, guacamole, soy sauce), sweets
  (apple pie, cheesecake, brownie, custard, gingerbread). 43 older foods got `made_of`. 229 foods in all (154).
- **Kind:** every food had one (fruit, vegetable, grain, dairy, meat …); the new ones too.
- **Usual colour, joined to `k.colours`:** 169 foods have a colour (was 114); a test requires every colour value
  to be the name of a `k.colours.colour`. A food that comes in any colour (jam, cake, soup, ice cream) has none.
- **Drawings looked at:** one sheet of the 30 objects that carry the name of a new dish: all 30 show the food
  and are joined by `drawing` (the `pickle` is a gherkin, the `custard` a caramel custard).
- **All model-labelled:** `named=model` is now on every food. I read the table of 75 dishes once while writing
  it and the 43 patches once; **not read again after generation** beyond the questions and what the tests
  check. The ingredients are the usual household ones, not a recipe (a curry is "vegetables, spices, onion").
- **Natural questions (item 8), food:** 100 foods and dishes written down without looking at `k.food` (50 foods:
  kind, colour, where from; 50 dishes: made of, kind, raw or cooked), 300 questions. The seeded sample of 100:
  **before 59, now 92**. All 300: before 194, now 282. Without a fact: whether drinks, jam, ketchup and cereal
  are "eaten raw or cooked" (they are neither); the colour of tuna, chicken, bean; "fish" as a food.
- `COVERAGE.md` and `ASPECTS.md` run again: usual colour of the common things 225 by name (was 203); `k.food` has
  a word for 147 common things (111); the row "food" of the aspects table has 229 foods.
- **Judgement that is mine:** every ingredient list; the kind of the new foods (peanut butter is filed as a
  sauce; pickle and sauerkraut as vegetables).
- Tests: `tests/k.food.test.mjs` (3), questions fd-15 to fd-20.
- Numbers: k.food 6 shards, 347 wires, 51,883 bytes (was 5 shards, 254 wires, 33,319 bytes). Catalog 22 worlds,
  853 shards, vocab 22,017 words; 0 errors, 0 warnings. npm test 2,647 pass, 0 fail.


## Round 10, item 1b (2026-11-13, second worker): Q30 applied: plain part words and model-labelled usual parts in `k.parts`

- **The plain word next to WordNet's name:** new key `plain` (many) on `k.parts.whole` and `k.parts.inherited`.
  Rule (in `tools/import/parts.mjs`, no table): for a part whose name has several words, the last word, when
  WordNet says the part is a kind of what that word names ("car door" is a kind of "door"; "automobile engine" of
  "engine"; "car wheel" of "wheel"; a "heating system" is a kind of "utility", so it gets none). **450 plain
  words on 240 facts**; the commonest: door 44, stone 33, gear 30, wheel 24, brake 19, room 17, light 16, engine
  16, seat 14. "Does a car have a door" is now a lookup (`name=car plain=door`). `core.source` stays
  `wordnet 3.1`: the word is derived from WordNet by rule.
- **Usual parts, model-labelled:** new type `k.parts.usual` (`named=model`, `hand-core 1`), shard `usual`, 432
  wires, 51,417 bytes, 1,436 parts, from the new table `sources/hand-core/usual-parts.tsv` (tool
  `tools/parts-core.mjs`): 429 of the 959 common things that had no part, and dog, cat and house, whose WordNet
  parts miss the everyday ones. **970 of the 1,500 common things now have a part** (were 541); 530 have none:
  foods, drinks, materials, things with no plain parts, and the less frequent ones I was not sure of.
- **What I read:** the list of the 959 things once, writing parts for 461; a first reading took out 26 rows (a
  hole of a bagel, a twig of a nest, a point of a star; the words with two meanings iris, viola, colt, calf); then
  a seeded sample of **120 rows printed next to WordNet's gloss** of the sense the coverage rule keeps: 117 right,
  3 wrong and taken out (bank, boa: the word names two things; doorknob). Record: `usual-parts-audit.tsv`. All
  the 91 different plain words were read as a list with their counts (a few are not words a person would use
  for the part: accessory 12, sac 10, system 3, action 3; they stay, since the rule is WordNet's).
  **Not read again:** the other 315 rows of the table; the 450 plain words fact by fact.
- **Known weak:** the usual parts are given for the everyday meaning of the name, which is not always the sense
  the coverage rule keeps (the gloss kept for `cake` is a block of soap, for `plant` a factory, for `peacock` a
  butterfly; the parts are those of the cake, the plant and the bird). Animals get a general list (head, body,
  leg, tail and what stands out: horn, hump, mane, fin, shell), not anatomy.
- `k.attributes`: parts are now also found in `k.parts.usual` (28 `found` facts; 1 `shows` row more).
  COVERAGE.md: new row "parts (WordNet, or usual parts in plain words)": 970 by name + 44 through the drawing,
  none 486 (WordNet alone: 541 + 57, none 902). ASPECTS.md: common things, relational 1,374 of 1,500 (was 1,326).
- **Judgement that is mine:** every usual part; which things have plain parts at all.
- **What SOP Lang could not say:** that a `plain` word belongs to one of the `has` values of the same fact
  (repeated keys are two independent lists); a test checks that it is the last word of one of them.
- Tests: `tests/k.parts.test.mjs` (2 more), questions pa-7 to pa-9.
- Numbers: k.parts 25 shards, 1,109 wires (were 24 and 677). Catalog 22 worlds, 853 shards, vocab 21,936 words; 0 errors, 0 warnings.
- After the rebase on R9.5 (k.body): catalog 22 worlds, 853 shards, vocab 21,999 words; npm test 2,638 pass, 5 skipped, 0 fail.

## Round 10, item 2 (2026-11-13, second worker): the common things with no sense in `k.words`

- **Why they were missing:** one cause. `k.words` kept the words of the first 20,000 lines of the frequency
  list; **427** of the 1,500 common things stand later in it (sunflower, teapot, locomotive, chimpanzee, raisin).
  (COVERAGE.md said 312: that count let a word borrow the sense of its drawing; by name 428 were missing.) None
  was missing because of several words, a plural or the limit of three senses: the list of common things has
  single lower-case lemmas only, and the sense the coverage rule keeps is always among the first three. The 428th,
  `isle`, had its sense but WordNet gives it `instance_of=island`, not `is_a`.
- **Fixed by rule, no table:** `tools/import/wordnet.mjs` takes `extra`, the common things of
  `tools/coverage.mjs` with the sense kept there: such a word is kept wherever it stands in the frequency list,
  and that sense is kept even beyond the third (none needed it today). The coverage report counts `instance_of`
  as a kind next to `is_a`.
- **What remains: nothing.** Kind 1,500 of 1,500 by name (was 1,072 + 116 through the drawing, none 312);
  definition 1,500 (the same before). A test (when the raw files are there) checks for every common thing that
  the gloss of the sense kept is in `k.words` with a kind.
- **Looked at:** the counts by cause; the new senses of sunflower, teapot and turtle. **Not read:** the 689 new
  sense wires (they are WordNet's, written by the same rule as the other 26,116).
- `k.words`: 10,898 words (were 10,471), 26,805 senses (26,116), 319 shards (318), 29668 wires, 5767722 bytes; the
  largest shard is `co`, 1,205 wires, 233,632 bytes. Words beyond the 1,500 common things are as before.
- **Judgement that is mine:** none. **What SOP Lang could not say:** nothing new.
- Tests: `tests/import.wordnet.test.mjs` (1 more; the equality with the import now passes `extra`).
- Numbers: catalog 22 worlds, 855 shards, vocab 22,167 words; 0 errors, 0 warnings. npm test 2,648 pass, 5 skipped, 0 fail.

## Round 9, item 7 (2026-11-13, first worker): `k.words`: opposites and chains of kinds by lookup

- **Coverage checked first** (the 2,978 words in the first 3,000 lines of the frequency list): 2,001 had a sense in
  `k.words`; none had an opposite (no key for it, and no adjectives at all); 1,997 had a direct kind (`is_a`) but
  a chain needed one lookup per step and broke at kinds of several words or outside the list.
- **Opposites, from WordNet's antonyms:** new key `opposite` on a sense: the antonym of that word in that sense
  (the lexical pointer, so `run` has it and its synonym `jog` not). 1,372 senses of 1,024 words. **Adjectives and
  adverbs are now imported** for the words of the first 3,000 lines (first 3 senses: 757 adjectives, 285 adverbs),
  because most opposites people ask for are adjectives. New key `near_opposite` for an adjective with no antonym
  of its own: the antonym of the adjective WordNet files it as similar to (huge → small, by way of large); 998
  senses; a key of its own because it is weaker.
- **Chains of kinds:** new key `kind_of` on the noun and verb senses of the first 3,000 lines (6,459 senses):
  the first hypernym, its first hypernym, and so on to the top, nearest first. "Is a dog an animal" is one
  lookup. `is_a` (all direct kinds) is unchanged.
- **Coverage now:** 2,416 of the 2,978 words have a sense (the rest are function words and inflected forms);
  599 have an opposite, 953 an opposite or a near opposite; all 1,997 with a direct kind have the chain.
- **Read:** a sample of 40 senses with an opposite or a near opposite (every 60th), each with its gloss: the 22
  direct opposites are all right (remember: forget; succeed: fail; here: there; square: round); of the 18 near
  opposites 16 read well (desperate: hopeful; late: punctual) and 2 are noise from WordNet's odd adjectives (`d`,
  the Roman numeral: ordinal; `one`: different). **Not read:** the other 2,330; the chains beyond dog, car, apple,
  river, day, friend, man, war.
- **What WordNet does not give:** it pairs big with little and large with small; friend, war, day, top, north,
  entrance have no antonym among their first three senses. Nothing was added by hand.
- **Natural questions (item 8), words:** 146 common words written down without looking at `k.words` (61
  adjectives, 25 verbs, 20 nouns with a well-known opposite, 40 nouns), 292 questions (the opposite, the
  meaning, what kind of thing). The seeded sample of 100: **before 33, now 100**; the sample is lucky: of all
  292, before 85, now 267 (the first question without a fact is the 104th). Without a fact: the opposite of
  south, north, top, bottom, day, enemy, exit, entrance, start, take; and words beyond the first 3,000 lines
  (thick, narrow, shallow as adjectives; the kind of hammer, salmon, violin, pencil, potato, eagle, bee, oak,
  spoon: they have `is_a` but no chain).
- **For the second worker (Round 10 item 2, the common things with no sense in `k.words`):** I changed
  `tools/import/wordnet.mjs` (pointers now carry source and target word numbers; adjectives and adverbs; three
  new keys). The chain could be given to all 20,000 words by setting `commonLimit`; it adds about 3 MB.
- `COVERAGE.md` and `ASPECTS.md` run again: one number changes in the first.
- Tests: `tests/k.words.test.mjs` (3), `tests/import.wordnet.test.mjs` (one more, on a fixture), questions wd-13 to wd-18.
- Numbers: k.words 319 shards, 31,143 wires, 6,694,397 bytes (was 318 shards, 28,951 wires, 5,610,059 bytes);
  the largest shard is `co` (261,271 bytes). Catalog 22 worlds, 854 shards, vocab 22,459 words; 0 errors, 0 warnings.
- After the rebase on Q30 (`k.parts`, second worker): catalog 22 worlds, 855 shards, vocab 22,490 words. npm test 2,662 pass, 0 fail.
- **After the rebase on R10.2 (second worker: `k.words` keeps every common thing, 427 of them from beyond the
  20,000th line):** both changes to `tools/import/wordnet.mjs` merged by hand (theirs: `extra`; mine: opposites,
  adjectives and adverbs, chains) and the shards written again by the merged tool, not merged. The common words
  that get adjectives, adverbs and the chain are now the first 3,000 lines **and the common things** (so hammer,
  salmon, violin have their chain). k.words now: 11,313 words, 28,987 senses (1,648 adjective, 534 adverb), 1,377
  senses with an opposite (1,029 words), 1,044 with a near opposite, 9,342 with a chain; 321 shards (`co` is
  split in two), 31,926 wires, 7,258,687 bytes. Natural questions about words: the sample 100 of 100, all 292:
  275 (85 before). Catalog 22 worlds, 857 shards, vocab 22,610 words; 0 errors, 0 warnings.

## Round 9, item 8, summary (2026-11-13, first worker): natural questions that find a fact, per domain

- `node tools/ask-sample.mjs` (domains in `tools/ask-domains.mjs`; the things of each domain in
  `sources/hand-core/questions/*.tsv`, written down without looking at the world, or, for animals, the table of
  animals itself): a seeded sample of 100 questions per domain; a question finds a fact when its sopworld query
  is supported, by the name of the thing or by a `core.word` of it. Before = the worlds at 66d8653 (after item 1).

  | domain | sample of 100, before | now | all questions, before | now |
  | --- | --- | --- | --- | --- |
  | animals | 53 | 81 | not counted | not counted (3,454 questions) |
  | geo | 66 | 97 | 299 of 428 | 405 |
  | space | 45 | 95 | 54 of 126 | 121 |
  | body | 59 | 95 | 117 of 210 | 190 |
  | food | 59 | 92 | 194 of 300 | 282 |
  | words | 33 | 100 | 85 of 292 | 275 |

- **What the numbers are not:** the questions are templates over lists I wrote, not the 301 questions of the
  demo's Talk tab (they are not in this repository), and the templates ask for keys that exist. A question in
  other words, or about another property, is not counted. The samples of geo and words are luckier than the
  whole (95% and 94% of all questions).
- **Anchors (item 1)** have no domain here: the measure is the target of the item (51 of the 56 things that
  another thing is on in `k.scenes` have an anchor; 26 before).
- The coverage reports (`MISSING.md`, `COVERAGE.md`, `ASPECTS.md`) were run again after each item; the common
  things with a drawing are unchanged by Round 9 (680 by name, 477 with none).
- README: a paragraph on Round 9.
- npm test on the pushed state of item 7 (7a4f373): 2,663 pass, 0 fail.

## Questions Q31 and Q32 (2026-11-13, first worker)

- Q31: where the unit of a number is said (`k.units.measure`, one fact per numeric slot, is published; meanwhile kept).
- Q32: the size class of an animal in `k.scenes.thing` and in `k.animals.animal` (meanwhile both, with the test that they agree).
- Not taken up: the reviewer blocks of 21:55 (Round 10, second worker) and 22:40 (reusable `w.*` worlds, a README section on what belongs here): they are not part of Round 9.
- Correction: the size classes compared with `k.scenes.thing` are 132, not 117 as the entry of item 2 said (counted now; corrected there and in Q32).

## Q31 and Q32 applied (2026-11-13, first worker; reviewer block "2026-11-13 23:10")

- **Q31 (the unit of a number):** `k.units.measure` now has one fact for every numeric slot of **every** world:
  135 slots of 21 worlds (were 70 slots of 4). `tools/measures-core.mjs` reads the schema of every world of the
  catalog and refuses a numeric slot without an entry, also in a world its table does not name (a test adds such
  a world and expects the refusal). Two new keys, because most of the new numbers are neither a unit nor a count:
  `frame` (a position or a length in a 0 to 100 frame: `object`, `face`, `arrangement`, `"person drawing"`; 51
  slots) and `plain=true` (the value of a number word; 2 slots). Draw orders, sense numbers, month numbers and the
  ranks of the `k.values` scales are `ordinal=true`; sides, corners, wheels, steps are counts; a month's days are
  in `day`. `k.attributes` has one number today (`wheels`); the second worker's new numeric slots (Round 10 item
  5) will be refused until they have an entry, which is what the answer asks for.
- **Q32 (one home for place and size):** `k.animals.animal` has no `size` any more (the column stays in
  `animals.tsv` as the source). `tools/scenes-core.mjs` adds a `k.scenes.thing` row for each of the 176 animals
  that had none: the size of the table, and the place by rule (`tools/animals-core.mjs`, `usualPlace`): water for a
  fish and for an animal that is not a bird whose first habitat is water (56), indoors where the first habitat is
  the house (2), sky for a bird that flies and does not live on water only (30), ground for what cannot fly (70),
  no place for the flying insects and the water birds (20). Checked against the 138 animals the hand table
  already had: the rule agrees with 113 of them; where it does not, the table says something finer (hen and
  turkey on the ground, a koala on a tree, a seal in the water), and the table wins there because the rule is
  used only for animals with no row.
- **Two names taken by another thing of another size:** `crane` (the machine, huge) and `tuna` (the tin, small).
  The animals get the rows `"crane bird"` and `"tuna fish"`, and the new key `k.animals.animal.thing` names them.
  Known weak: `kiwi` (the fruit and the bird are both small, so the rule sees no clash; the place of the fruit
  stays; Round 11 item 3 draws the bird). Herring, sardine, cod now have a place as fish, which the food of the
  same name inherits in ASPECTS.md (food, spatial 148 to 151): a sense question for the joins table.
- **Also dropped:** `k.commonsense.thing.size` (15 facts; 7 of them disagreed with `k.scenes.thing`, written
  earlier with other class limits). **Kept and said so in the test:** `k.space.body.size`, a planet's class among
  the planets (no `tiny`), not the size class of things.
- **Test for one home:** no slot `size` or `place` of any world but `k.scenes.thing` may have its enum; every
  animal has exactly one `k.scenes.thing` with the size of the table. A general "same key, same name, two worlds"
  test was measured and not written: 30 key and world pairs share names today (`kind` in six worlds with six
  meanings, `can` in three); that needs the joins table of Round 10.
- Versions: `k.animals` 2, `k.commonsense` 2 (a slot removed is breaking; CHANGELOG). Questions an-17 and cs-06
  moved to `k.scenes` (sc-21 to sc-24).
- **Looked at:** the 176 new rows as a list by place (one correction: canary indoors); the 25 disagreements of the
  rule with the hand table. **Not looked at:** nothing else changed in content.
- **Judgement that is mine:** the place rule; `frame` and `plain`; dropping the size of `k.commonsense`.
- Numbers: `k.units` measures 135 wires, 18,473 bytes; `k.scenes` things 2,218 (were 2,042), 31 shards 461,813
  bytes, largest `things-s` 281 wires; `k.animals` 597 wires, 105,814 bytes. COVERAGE.md: place 693 by name (637),
  size 710 (650). Natural questions about animals: 81 of 100 (the same). Catalog 22 worlds, 857 shards, vocab
  22,632 words; 0 errors, 0 warnings. npm test 2,667 pass, 0 fail.

## Round 10, item 0 (2026-11-13, second worker): what the PSys2 tab worlds knew and ours lacked

- **New import `tools/import/psys2.mjs`** (`--from` a PSys2 checkout, read only) and the generated page
  **`docs/worlds/FROM-PSYS2.md`**: for each of the eight files named by the reviewer a table of what it has and
  ours lacked, what was taken into which world, what was left and why, and where the two disagree. The facts are
  18 shards named `psys2*` in ten worlds, 1,042 wires, 190 kB; the facts of one thing merge with those already
  there. Source cited: PSys2 commit `6b63b2ba`, the last one that changed a file read (the copy at `/tmp/wt2`
  moved from `6c3f38c5` to `dd18a937` while I worked; none of those commits touched these files).
- **Taken** (numbers from the tool):
  - `k.geo`: `code2`, `currency`, `language` for 234 countries; 15 missing territories; 42 more names of
    countries; 518 more cities (353 we had by name; 123 lie within a quarter of a degree of a city we have and
    were left as suburbs or other spellings); new type `k.geo.group`, 8 groups with members as of 2024.
  - `k.animals`: 72 foods, 8 sounds (woof, baa), 7 legs, 10 diets, 2 coverings, 1 young, 2 swims; 3 names.
  - `k.shapes`: rhombus, quadrilateral, 7 `is_a`, 4 things of a shape. `k.colours`: primary, secondary, neutral
    for 9 colours, 2 things. `k.time`: weekend. `k.commonsense`: 1 place. `k.scenes`: 3 `on`. `k.layouts`: 7
    joins with the new relation `around`. `k.values`: skin, 13 colour words, 6 shade words (new type
    `k.values.shade`), yes and no with 40 words (new type `k.values.reply`), 3 shape names. `k.parts`: new type
    `k.parts.called`, 91 parts of 23 things with their other names.
- **Licences.** The reviewer's ruling (CC0, `psys2-worlds <commit>`) covers the hand-written knowledge.
  `geo.map/kb.sop` is not hand-written: PSys2 generated it from mledoze/countries (ODbL-1.0), country-json (MIT)
  and GeoNames (CC BY 4.0). So the country shard keeps `countries 5.1.0` and ODbL-1.0, the city shards a new
  source `geonames` and CC-BY-4.0 (`sources/geonames/SOURCE.md`), each with `psys2-worlds` as a second source;
  nothing was taken from country-json (no population). All three licences allow open reuse.
- **Left, with the reason on the page:** values we have from our own sources; negative shape facts; articles;
  sentences a host can make from a fact; the demo's layout numbers for a face; its palette values, drawings and
  default colours; the phrases of its lexicon; no-words that are refusals to act; country search keys that are a
  name with its ending cut ("barbado") or a word of another country ("korea"): two rules in the tool, found by
  reading the 80 words of the first version.
- **Disagreements:** ours kept everywhere; the real ones are **Q33** (independent for 14 countries, three
  capitals, the population of the United Kingdom in PSys2, the continent of Cyprus, the young of a rabbit, fur or
  hair) together with two facts our keys cannot hold (a square is a rhombus; a year has 52 weeks).
- **Looked at:** the generated page in full; every fourth animal fact; the list of the country names taken (three
  times, until the cut names were gone); every ninth `k.parts.called` fact; the whole `k.values` shard; one
  group (Balkans). **Not looked at:** the 518 cities one by one (their country is checked by a test to be one of
  ours; that none is a suburb of a city we lack is not checked); currencies and languages (the source's values,
  two read: Japan, Switzerland); the other 7 groups' members; three quarters of the animal facts.
- **Other workers' files touched, and why:** tests of the hand-written worlds asserted `hand-core 1` as the only
  source of every fact; six now use `handSources` (`tools/lib/worlds.mjs`: hand-core, and psys2-worlds where a
  fact was laid next to it). Four question expectations changed with the knowledge (a bird is also on the
  ground; 14 countries and territories in South America; Genoa and Palermo among the cities of Italy; rhombus
  and quadrilateral among the four-sided shapes). `tests/k.layouts.test.mjs`: `road` joins the things without an
  anchor; a join from PSys2 has no `named`. `tools/measures-core.mjs`: `k.geo.group.as_of` is a place in an
  order. `tools/import/lib.mjs`: `writeShards` never removes a `psys2*` shard for another tool.
- **Judgement that is mine:** the eight name pairs of countries spelt differently in the two lists; that chicken,
  hippo and worm are our hen, hippopotamus and earthworm; the quarter of a degree; which no-words are refusals;
  that a shape without a kind gets quadrilateral before polygon.
- **What SOP Lang could not say:** that a word for a part holds only for one thing (`k.parts.called` is a type of
  its own for that, since `core.word` names a value for every fact); "a square is a rhombus" next to "a square is
  a rectangle" with a single-valued key.
- Tests: `tests/import.psys2.test.mjs` (4; the equality with the import when the checkout is at the commit of the
  page), 9 new questions.
- Numbers: catalog 22 worlds, 873 shards, vocab 22,755 words; 0 errors, 0 warnings. npm test 2,660 pass, 5 skipped, 0 fail (one run before the last change of the cited commit; then the psys2, catalog and question tests again: 396 pass).
- After the rebase on the first worker's Q31 and Q32 (measures for every world; the size of an animal in `k.scenes`): my question is **Q33**; `k.values.shade` got its two measures; the import was run again. Catalog 22 worlds, 875 shards, vocab 23,215 words; npm test 2,675 pass, 5 skipped, 0 fail.

## Round 11, item 1 (2026-11-13, first worker): the demo's real questions, answered from the catalog; gaps filled by cause

- **The questions** (`sources/psys2-eval/real-questions.jsonl`, from PSys2 at `0bd36ec0`, SOURCE.md): 132 failed
  questions of the Talk tab (`failures.jsonl`, rows with E-T1 or E-T3; 3 rows that are counts left out) and 160 of
  the lookup set (80 drawing and 80 knowledge messages; half of each with an invented noun, where the right
  outcome is "not found"; the 40 control rows are commands, not questions).
- **`tools/ask-real.mjs`:** it finds the words of a question in the catalog and nothing more: a thing (a name or
  a `core.word` of a fact), an asked key (a word a schema gives to a slot or a type), a value of a key of the
  thing's type ("is a cake a fruit": `kind`), a comparative or a step of a `k.values` scale (the keys of the scale
  come from `k.attributes.found`), two units of one quantity. No grammar; function words are a list in the tool.
  A question finds a fact when a fact of the thing has the key; with no key it asks what the thing is (`gloss`,
  `about`, else its kind). Words of the question the reading does not use make it "found in part"; a word the
  catalog does not know at all makes it "not found".
- **Before and after, same tool** (before = the catalog at 29b55f1):

  | set | before | now |
  | --- | --- | --- |
  | Talk failures (132): found | 103 | 115 |
  | found in part | 5 | 3 |
  | not found: key missing | 15 | 7 |
  | not found: key of another kind of thing | 2 | 2 |
  | not found: word for the asked key not in vocabulary | 3 | 1 |
  | not found: no thing named / needs the conversation | 4 | 4 |
  | lookup set, knowledge, real nouns (40): found, answer as the demo expects | 27 | 35 |
  | lookup set, drawings, real nouns (40): found | 0 (33 in part) | 28 (12 in part) |
  | invented nouns (80): rightly not found | 77 | 77 |

  The Talk failures were recorded against an older catalog: Round 9 had already filled most of them (103 found
  before this item). The 12 drawing questions "in part" are "a diagram / a box shaped like a X": the drawing of X
  is found, the words diagram and box are left over (they are the demo's own things). `snarf` is a word of
  WordNet, so 3 of the 80 invented questions find something.
- **Gaps filled, by cause:**
  1. *The asked word is no key* (the largest cause): 241 of the 337 keys of the named types had no `core.word`.
     `tools/key-words.mjs` writes a block at the end of every schema: for each key its own name as a word, and the
     everyday words of a small table (can, do, find, where, made from, kind of, draw, sketch, show, define; 60
     lines, each a way of asking, not a question). 439 word wires in 22 schemas; a test requires a word for every
     key and the block to be what the tool gives.
  2. *A scale with no key*: `k.attributes.found` now says where the numbers of the scales are: size (the area of
     countries, continents, lakes, deserts, seas; the width of bodies in space), and five new attributes named as
     the scales: length, height, distance, temperature, weight. "Is Brazil big", "the longest river", "the biggest
     country" find the numbers.
  3. *A fact about a whole class*: new type `k.animals.class` (shard `classes`, 13 classes): legs and covering only
     where they hold for the whole class (bird 2, fish 0, insect 6, arachnid 8; feathers, scales).
- **What remains, by cause** (not filled; none is a single question to patch):
  - no definition: `kilogram`, `litre`, `noun`, `verb` and about 340 names of the hand cores (animals, foods,
    units, wearables) have no sense in `k.words`, which keeps frequent single words; needs the WordNet import to
    take the names of the cores (the second worker's tool; not done here);
  - no number for a scale: speed (horse or cow), the size of parts of the body (hand or foot): Round 10 item 5;
  - legs of things that are not animals (a table), of an octopus and a centipede (left out on purpose: arms, many);
  - what rice is made of; what is inside an eye (`inside` says where a part is, not what is in it); eyes of a spider;
  - "the healthiest food", "why do we sleep": no key anywhere; "the capital of the Sahara": rightly none.
- **Read:** every answer of the 132 Talk questions and of the 80 knowledge questions, after each change of the
  tool (the lists are long; I read them for wrong readings, not for wrong facts). **Known wrong or weak readings
  that count as found:** "What has a roof and a door" (answers the parts of a roof); "How many fingers does a hand
  have" (10, the count in the body, not 5); "Is the moon a planet" (answers what a moon orbits); "Which planet has
  rings" lists all planets with a `rings` fact, true or false; a definition lists every sense (dolphin: the fish
  first). **Not read:** the 80 drawing rows one by one (two patterns); the 439 word wires beyond the table.
- **Sense clash** was asked for as a cause: the tool has no way to see one (the joins table is not there yet);
  by reading, the definitions with several senses are the place where it shows.
- **Judgement that is mine:** the list of function words; the ranking of readings (most words used, then an
  asked key before a value before a search before "what is it"); the table of everyday words.
- **What SOP Lang could not say:** that a `core.word` asks for a key (a word that means a slot) as opposed to
  naming a value; both are `core.word` with `means`, told apart by whether `means` is a slot id.
- COVERAGE.md and ASPECTS.md run again (the words of the schemas count as vocabulary: a few counts rise by 1 to 3).
- Numbers: `k.animals` 7 shards; `classes` 24 wires, 2,934 bytes; `k.units` measures 136; `k.attributes`
  attributes shard 20 attributes, 43 found facts. Catalog 22 worlds, 858 shards, vocab 22,706 words; 0 errors,
  0 warnings. npm test 2,671 pass, 0 fail.
- **After the rebase on R10.0 (second worker: 18 `psys2` shards):** schemas with a conflict were taken as theirs
  and the key-word block written again (443 wires); measures, catalog and reports generated again, not merged.
  The octopus now has `legs=8` (theirs), so the knowledge set finds 36 of 40. `tests/import.geo.test.mjs` failed
  on main where the raw files are present (it compared the directory with the importer's files; the `psys2-`
  shards are not the importer's): the comparison now leaves them out. Catalog 22 worlds, 876 shards, vocab 23,291
  words; 0 errors, 0 warnings. npm test 2,684: 2,683 pass, 1 skipped, 0 fail.

## Round 10, items 3 and 7 (2026-11-13, second worker): one name, one thing across worlds; a test for stale pages

- **New tool `tools/joins.mjs`**, new type **`k.attributes.same`** (27 shards `same-<letter>`, 3,201 wires,
  621,471 bytes) and the generated page **`docs/worlds/JOINS.md`**. For every name that facts of more than one
  world carry (3,130 names, compared in lower case): its `sense` and the types (`in`) whose facts with that name
  are about that one thing; `only=true` when the name has one sense in the whole catalog (3,063 names),
  `only=false` and one fact per sense when it has several (**67 clashes**, all listed on the page).
- **How a sense is found (a rule, not a reading of each name):** each type that names things gives a sense (an
  animal of `k.animals`, a colour of `k.colours` and `k.values`, a place of `k.geo`, a body part, a wearable …);
  a drawing has the sense of the group its source filed it in (animals, food and drink, plants, clothes;
  any other group: a thing; a mixed hand-written shard: unknown); facts about a drawing (place, size, drawn
  colour, anchor) follow the drawing; a `k.attributes.thing` follows its kind. A plain "thing" is the same thing
  as a body in space, a body part, a plant, a person or a wearable of that name (the drawing sun is the Sun of
  `k.space`), and another thing than an animal, a food, a colour, a shape, a time or a place. `k.words.sense`
  and `k.parts` are keyed by the word whatever it means: listed apart as `by_word`.
- **The reviewer's examples:** duck is one thing in `k.objects`, `k.animals`, `k.scenes`, `k.attributes`
  (`k.words`, `k.parts` by word). orange: food, colour and a river. crane: the animal of `k.animals`, and the
  drawing (with its place, size and drawn colour) is the machine. kiwi and tuna: the drawing is the food.
  **bat and mouse are not clashes in this catalog**: their drawings show the animals and no world has the bat of
  a game or the mouse of a computer as a thing; `k.words` has those senses (`by_word`).
- **Looked at:** the whole clash list three times while the rule was made (133, then 96, then 67 names): the
  first versions reported a scene and its drawing (beach), a container filed under drinks (teapot), a wearable
  drawn in a general group (apron), the Sun and its drawing; each was removed by a rule above, not by a table.
  Of the 67 left: 29 are a common word that is also a river, a city or a country of `k.geo` (bear, fox, red,
  turkey, peru): true for a host that compares in lower case; 22 a food or a plant and a colour; 13 an animal
  and its meat; then heart, ring, pyramid, star, palm, skin, crane. Wrong or doubtful, left in and named here:
  **mount fuji** (the drawing is the mountain of `k.geo`: one thing), **feather** and **bug** (animal only
  because of the group of the drawing), **toast**, **hay**, **mushroom** (food in one world, thing or plant in
  the other: the same thing). A seeded sample of 70 of the 3,063 "one thing" names read: all plausible.
  **Not looked at:** the other 2,990; a clash is missed where a drawing's group says nothing.
- **Item 7:** `tests/coverage-report.test.mjs` now fails when COVERAGE.md or ASPECTS.md is stale (a fresh run
  must give the page on disk; needs the raw WordNet and frequency files, skipped without them); the joins test
  fails when the `same` shards or JOINS.md are stale, with no raw files needed. `npm run build` now runs
  `tools/joins.mjs`; the new `npm run reports` regenerates the two pages. **For the first worker:** after a
  change to any world run `npm run build && npm run reports` before `npm test`.
- **Judgement that is mine:** the sense of each type and which senses a plain thing may share.
- **What SOP Lang could not say:** the rule itself (a sense from the shard a drawing lies in): the tool computes
  the facts; nothing in a world can refer to the shard of a fact.
- Tests: `tests/joins.test.mjs` (3), questions at-19, at-20, the stale test.
- Numbers: k.attributes 38 shards, 6,293 wires. Catalog 22 worlds, 902 shards, vocab 23,205 words; 0 errors, 0 warnings.
- **A defect of item 0 found and closed here:** the PSys2 copy at `/tmp/wt2` moved on (commit `c311c86c` changed
  the files read: the demo has begun to delete its knowledge), and a rerun of `tools/import/psys2.mjs` took facts
  away again (the colour words; every shard changed its commit). The psys2 shards and FROM-PSYS2.md were put back
  as pushed at 4e02e97, and the tool now writes only from the commit the page cites (`6b63b2ba`) unless `--force`
  is given. Nothing wrong was pushed. The equality test is skipped while the copy is at another commit.
- After that: catalog 22 worlds, 902 shards, vocab 23,217 words; npm test 2,680 pass, 6 skipped, 0 fail.

## Round 10, item 4 (2026-11-13, second worker): reuse inside this repository (proposal only)

- The library's detector exists: `tools/reuse.mjs` of soplang-words-lib at `01d29cd`, run as
  `node tools/reuse.mjs --top 25 docs/worlds` on the 22 schemas (not on the shards). **16 candidates**: 12 type
  shapes, 1 rule shape, 3 word overlaps; reuse per world is 0 everywhere (no world uses a type of another).
- Held up on reading: drawing primitives (`k.faces.point` = `k.objects.point`, score 1.00; `k.faces.part` ~
  `k.objects.part`, 0.66); the box x, y, w, h (three candidates; nine declarations); the rule "never the exact
  number and the approximate one" in three worlds (0.89). Chance: seven candidates that share only the number
  of keys. Added by reading, which the detector does not look for (it compares whole types): the enum of eleven
  colours written out in eight slots; `named` 20 times and `drawing` 11 times; five kind-of chains;
  `can` / `cannot` in three worlds; `thing` lists in two.
- **Proposal: Q34**, seven shared shapes with what each needs (three need something from the library: a group
  of slots a type can take in, a rule over key names, `named` as a core key). Nothing refactored.
- **Looked at:** the detector's table in full; the 22 schemas by grep of the slot declarations, not line by
  line. **Not looked at:** reuse between shards (same facts in two worlds): `k.attributes.same` and the first
  worker's test "no key for the same thing in two worlds" cover that side.

## Defect found and closed (2026-11-14, second worker): `k.attributes.same` was not declared in the schema

- The R10.3 commit (a4e2e46) published 27 shards of `k.attributes.same` (3,202 facts) but not the type: the
  change of `docs/worlds/k.attributes/schema.sop` is not in any commit (lost in a rebase on R11.1, which took
  that schema from the other side). sopworld takes facts of an undeclared type in an open world without an error
  or a warning, so the build and npm test passed; the catalog listed no export `k.attributes.same`, and the test
  "a word for every key" did not see its keys.
- **Fixed:** the type and its six slots (name, sense, only, in, unsure, by_word) declared, exported; the key-word
  block written again (`tools/key-words.mjs`, 448 wires, were 443 + 5 new). **New check:** `tools/validate.mjs`
  refuses a fact whose type no schema declares (core types aside), with a fixture test. Run on the whole
  catalog it found only these 3,202 facts.
- Regenerated: joins (3,130 names, 68 clashes: one more than the log of R10.3 said, from R11.1's changes; the
  shards were already at 68), catalog, COVERAGE.md (`k.attributes` reaches 1,027 common things through the
  vocabulary, was 744: the names of the joins are now words of a known type), ASPECTS.md unchanged.
- New file **`docs/lessons.md`** (standing direction): a few lines per item on what it taught about reuse.
- Numbers: catalog 22 worlds, 903 shards, vocab 23,293 words; 0 errors, 0 warnings. npm test 2,690: 2,684 pass,
  6 skipped, 0 fail.

## Round 11, item 2 (2026-11-13, first worker): reusable worlds `w.*` and the README section

- **README**: the section "What belongs here, what belongs to the library, what stays in an application"
  (block 22:40). `docs/worlds/README.md` says what `w.<name>/schema.sop` is and where the catalog lists it.
- **Three reusable worlds written from scratch** in the library's `std.schema` format, data only (no rule, no
  function; the catalog builder refuses one), source `hand-core 1`, CC0-1.0, each with WORLD.md:
  `w.list` (list, item: 27 wires, 4,023 bytes), `w.seating` (table, seat, guest: 35 wires, 5,513 bytes),
  `w.timeline` (timeline, event: 33 wires, 5,428 bytes). Kinds with their acts (`std.schema.kind`), limits
  (`std.schema.limit`), a `core.word` for the world, every kind and every key.
- **Catalog**: `index.json` has `schemas` (id, version, names, kinds with acts, attributes and words, wires,
  bytes, warnings) and `sopworld_schemas`; the words go to `vocab.json` with the schema's path ("seating plan"
  -> `w.seating/schema.sop`). `tests/catalog.test.mjs` now accepts a vocabulary entry that points to a schema.
- **Engine**: `std.schema` and `std.acts` are not in the pinned 0.16.0, so a second build is pinned in
  `tools/sopworld/w/` (0.26.0 at 4c33e81, the library's current release; the sessions passed on 0.25.0 too),
  used only by `tools/lib/schemas.mjs`; a test checks its sha256. The `k.*` worlds stay on 0.16.0. **Q35**.
- **Tests** `tests/w.schemas.test.mjs` (6): each world loads with std.acts with no error or warning, all three
  together without a clash, the catalog entry is what the builder gives, a host finds each by six names, the
  pin; one session per world (make, ask, change by a step and back with undo, pick, copy, connect, remove;
  refusals: an act not allowed, a value outside an enum with the allowed values, a reference to the wrong kind).
- **Seen in the library and not worked around** (in Q35 for the library's session): `make` accepts a thing
  without a `required` attribute; `undo` right after `remove` undoes the step before it, not the remove.
  Checked again on 0.26.0 by a script outside the repository.
- **Looked at:** the three schemas and WORLD.md files in full; the `schemas` part of `index.json`; the vocab
  entries of five words (seating plan, table, list, timeline, history). **Not looked at:** the other 26 new
  vocabulary words one by one. COVERAGE.md changed by one line: `w.seating` reaches 2 common things (table,
  seat words), which is the vocabulary, not knowledge.
- **Judgement that is mine:** the keys of each kind and the words (for example "schedule" and "history" find
  the timeline); the limits (20 lists, 500 items, 50 tables, 1,000 events).
- The previous worker of this clone was stopped by a usage limit with this work uncommitted; it was taken over,
  rebased on R10.3, R10.4 and the R10.3 defect, the pin moved from 0.25.0 to 0.26.0, the question renumbered
  from Q33 (taken by the second worker) to Q35.
- Numbers: catalog 22 worlds, 903 shards, 3 schemas; vocab 23,293 to 23,325 words; 0 errors, 0 warnings.
  npm test 2,696: 2,695 pass, 1 skipped, 0 fail.
## Round 10, item 5 (2026-11-14, second worker): the numeric aspect of common things

- **New type `k.attributes.number`** (3 shards `numbers-a-f`, `-g-o`, `-p-z`; 990 wires, 163,488 bytes), written by
  the new `tools/numbers-core.mjs` from the new table `sources/hand-core/numbers.tsv` (975 rows, model-labelled,
  `named=model`, from the everyday meaning of the name): `size_about` (longest side, metres) 975, `weight_about`
  (kilograms) 855, `speed_about` (usual top speed, km/h, for what moves by itself or carries people, animals
  among them) 232, `legs` of things that are not animals 14 (a test forbids it on a name of `k.animals`), `sides` 8,
  `price_class` 645. **Classes computed, not labelled:** `weight_class` (light under 2 kg, heavy over 30 kg) and
  `speed_class` (slow under 10 km/h, fast over 60 km/h) come from the number in the tool, so they never disagree with
  it. All three classes are steps of `k.values` scales: weight and speed existed; **new scale `price`** (cheap,
  medium, expensive) with comparatives cheaper, dearer, more expensive and their superlatives.
- **Joins, which is the point of the item:** `k.units.measure` for the five numbers (metre, kilogram, kilometre
  per hour, counts leg, counts side); `k.attributes.found` for size, weight (number and class), speed (number and
  class), legs, sides (also `k.shapes.shape.sides`), price; three new attributes (speed, sides, price; `holds`
  gets the value `class`); kinds name weight, speed, price where usual; `k.attributes.shows` rows for common
  thing, animal and food; `tools/joins.mjs` knows the type (sense from the name, unknown), so `k.attributes.same`
  now covers 3,330 names (68 clashes, as before). So "which is heavier, a horse or a cow" goes comparative ->
  scale weight -> found -> `weight_about` of both.
- **k.body:** `length_about` for 21 more parts of an adult (hand, foot, arm, leg, head, the face parts, heart, brain,
  stomach, kidney, liver, tooth ...) and `weight_about` for kidney, stomach, eye; `k.attributes.found` size ->
  `k.body.part.length_about`. "Which is bigger, a hand or a foot" was a gap the first worker left for this item.
- **A defect of `tools/ask-real.mjs` found by these numbers and fixed by cause:** a comparison took for each thing
  the first key it had, so "a train or a tent" compared the size class of the train with the metres of the tent.
  Now two things are compared under one key both have, and only a thing without it falls back. The demo's real
  questions (same tool): Talk failures found **115 -> 117** of 132 (horse or cow, hand or foot); knowledge 36 of 40.
- **Audit** (`sources/hand-core/numbers-audit.tsv`): a seeded sample of 100 rows read against what I know: 97 right,
  1 wrong (the speed of an ant), 2 unclear and left (a bell, a bale: which one); then every row whose weight over
  the cube of its size is below 0.1 or above 1,000 kg per cubic metre (50 read): 3 wrong (caviar, spider, bug, all
  too heavy), corrected. **Not read again:** the other ~820 rows; the price classes beyond the sample (they are the
  coarsest and the most dependent on the reader); the 21 body lengths were written once.
- **Left out on purpose:** substances and drinks, places and landforms with no one size (street, island), bodies
  in space (k.space has them), the weight of buildings. COVERAGE.md has four new rows (size in metres 975 + 66
  through the drawing, weight 855 + 38, speed 232 + 18, price 645 + 42); the gap lists are those substances and places.
- **ASPECTS.md:** common thing numeric **45 (3%) -> 1,042 (69%)**; animal 291 -> 299; food – -> 87.
- **Known weak:** a number is keyed by the name; for the 68 clash names (turkey, crane) it is the everyday sense
  (the bird, the machine), and `k.attributes.same` does not say which sense a number has.
- **Judgement that is mine:** every number and price class; the thresholds of the classes; what to leave out.
- **What SOP Lang could not say:** that `weight_class` is a function of `weight_about` (a test checks it), and that
  the values of a class slot are the steps of a named scale (an enum repeated; a test checks it).
- Tests: `tests/k.attributes.test.mjs` (1 more), questions at-21 to at-23, at-08 and at-09 changed with the facts.
- Numbers (after the rebase on R11.2): k.attributes 44 shards, 7,515 wires; `k.units` measures 144; `k.values` scales 186 wires. Catalog 22
  worlds, 906 shards, 3 schemas, vocab 23,351 words; 0 errors, 0 warnings. npm test 2,700: 2,694 pass, 6 skipped, 0 fail.

## Round 10, item 6 (2026-11-14, second worker): temporal and social aspects of the things of `k.scenes`

- **New type `k.attributes.usage`** (shard `usage`, 338 wires), written by the new `tools/usage-core.mjs` from the
  new table `sources/hand-core/usage.tsv` (368 rows, model-labelled, only where plain): `season` 100, `time` of day
  177, `weather` 58, `age` 107, `used_by` 121 rows (69 facts after the rule below).
- **Joins, by value, not by new words:** `season`, `time` and `weather` take exactly the values of
  `k.scenes.scene` (a test compares the enums), so a host fills a winter night scene with things whose usage says
  winter and night; `age` takes the ages of `k.people.kind`; `used_by` names a `k.people.role`. **One fact, one
  place:** where a role already lists the thing in its own `uses` (the farmer and the tractor), the tool drops
  that role from `used_by` (52 dropped; 30 rows then had nothing left and give no fact); who uses a thing is read
  from both, and `k.attributes.shows` has a social row for `k.people.role` by `uses`.
- **Attributes and aspects:** five new attributes (season, time, weather, age, user; `holds` gets `time` and
  `person`) with `found` facts in `k.attributes.usage`, `k.scenes.scene` and `k.people.kind`; the aspects temporal
  and social are reworded to cover things (when a thing is used or seen; who it is for). A new family **scene
  thing** (the 2,218 things of `k.scenes`) has its row in ASPECTS.md: visual 92%, spatial 100%, relational 34%,
  numeric 26%, temporal **257 (12%)**, social **256 (12%)**. Common things: temporal – -> 89 (6%), social – -> 148 (10%).
- **Audit** (`sources/hand-core/usage-audit.tsv`): a seeded sample of 60 rows read: 55 right, 5 unclear (bath in
  the evening, a baguette and a briefcase in the morning: those two times removed; a shower cap in the morning;
  a bonfire in autumn, which holds where bonfire night is kept). **Not read again:** the other 308 rows.
- **What was left out:** most things of `k.scenes` have no plain season, time or user and get no fact (a chair, a
  bowl): 12% is the honest share, not a gap to fill by guessing. Animals active at night got `time=night` only
  where I am sure (owl, bat, hedgehog, moth, fox, raccoon, firefly); a full "active at" for animals belongs in
  `k.animals` and was not done.
- **Judgement that is mine:** every row; that weather is a temporal aspect.
- **What SOP Lang could not say:** that the enum of a slot is the enum of a slot of another world (a test compares them).
- Tests: `tests/k.attributes.test.mjs` (1 more), questions at-24 to at-26.
- Numbers: k.attributes 45 shards; catalog 22 worlds, 907 shards, 3 schemas, vocab 23,358 words; 0 errors, 0 warnings.
  npm test 2,704: 2,698 pass, 6 skipped, 0 fail.

## Round 11, item 3, part 1 (2026-11-14, first worker): animals drawn as another thing; 47 common things drawn

- **Animals whose name shows another thing** (the joins table, JOINS.md): `crane` (the drawing is the machine),
  `kiwi` (the fruit), `tuna` (the tin). New drawings `"crane bird"`, `"kiwi bird"`, `"tuna fish"`; the animals
  name them with `drawing=` (`sources/hand-core/animals.tsv`). `bat`, `seal` and `mouse` were looked at and show
  the animals already (Noto Emoji); nothing done for them. The rule of Q32 in `tools/animals-core.mjs` now also
  gives an animal its own `k.scenes.thing` row when it is drawn under the name `<name> bird|fish|animal`: the kiwi
  gets `"kiwi bird"` (ground, small) although the fruit is small too (the case named as weak in the Q32 entry).
- **47 common things with no drawing**, by frequency (MISSING.md, from rank 602): eel, jaguar, cougar, dingo,
  jackal, possum, alligator, newt, flea, grasshopper, mantis, leech, clam, fern, seaweed, raspberry, stump,
  iceberg, glacier, crater, plateau, hive, dungeon, curb, capitol, caviar, tonic, salsa, cinnamon, destroyer,
  chariot, intercom, dryer, harness, reel, typewriter, bandage, rook, canteen, napkin, boiler, cone, knob,
  sphere, scalpel, telegraph, heater. The 13 animals among them also get `drawing=` in k.animals (opossum and
  praying mantis name `possum` and `mantis`).
- **Passed over** in that stretch, with the reason: cloak (a general word), dairy, sauna (a farm, a room), slope,
  consulate (as the embassy), rouge (the drawing `blusher` exists: a hand link is the right thing, next part),
  bumper (a full glass), panther (WordNet makes it the jaguar: now a synonym by rule).
- **How:** `tools/objects-hand.mjs` with the table `tools/objects-hand-data.mjs`: one line per part (shape, box or
  points, z, colours, relations), checked (frame, w = h for circles and squares, relations name parts, keys of
  the schema) and written as the same SOP Lang as the hand-written shards before. New shards `animals-2` (the
  name gives the joins the sense animal), `plants`, `land-3`, `places-3`, `food-3`, `vehicles-2`, `things-3`.
- **Sense check:** 47 rows in `sense-check.tsv`: right, except eel (the drawing is the living fish; the sense kept
  is its flesh) and raspberry (the berries on a stem; the sense kept is the bramble), both `wrong` with the
  WordNet offset shown. New links by rule: `panther` = jaguar, `puma` = cougar (synonyms), `mesa` -> plateau,
  `tourniquet` -> bandage (stand-ins). A word was dropped where an object or a link has it (plaster, flask,
  water bottle, puma as a hand word, keep, knobs).
- **Joins:** three new clashes, all true: `cone` and `sphere` (a shape of k.shapes and a drawn thing), `eel` now
  drawn. Two scenes of k.scenes now have a drawing where they had none (`arctic`: iceberg, `underwater`:
  seaweed).
- **Looked at:** every new drawing on contact sheets (150 px, name underneath), 25 then 26, and the redrawn ones
  again (salsa: the chips stood behind the bowl like ears; harness: read as scissors; iceberg and seaweed: a
  water background that tiled as blue squares in the two scenes, which were looked at before and after);
  `crane`, `kiwi`, `tuna`, `bat`, `seal`, `mouse` as they were. Verdict with the name: all recognisable;
  **weakest without it: cougar (a bear's head), clam (white on white), eel (a green ribbon), knob, chariot
  (four wheels in the sense kept, two drawn), sphere (a blue ball).** Not looked at: the new drawn colours of
  `k.attributes.drawn` one by one (computed from the parts).
- **Judgement that is mine:** what each thing looks like; which senses are drawable; the extended rule for the
  kiwi.
- Numbers: k.objects 2,158 objects (275 hand-written; were 2,108 and 225); 7 new shards, 1,126 wires, 148,250
  bytes. Coverage of the 1,500 common things: a drawing of its name 680 to 727 (48%), neither 477 to 426. Joins:
  68 to 70 clashes. Catalog 22 worlds, 914 shards, vocab 23,605 words; 0 errors, 0 warnings. npm test 2,754:
  2,753 pass, 1 skipped, 0 fail.
## PSys2 hand-overs to this repository (2026-11-14, second worker): `k.actions-missing.md` and `knowledge-out/catalog-lacks.md`, by cause

The reviewer's block "01:00" lists these two hand-overs under Round 12 ("also in this round"); the task given to
me named them, so I took them and nothing else of Round 12 (`w.lang.en` is not started here).
- **k.actions (cause: acts and verbs the act readers of the demo still keep in temporary tables):** two new acts,
  **redo** (opposite undo; verbs redo, do again, put back, bring back, get back) and **deselect** (opposite pick;
  "nothing picked" is deselect with no thing; verbs deselect, unselect, unmark, unhighlight, untick, uncheck);
  undo and pick now name them as opposites. New verbs: make doodle (WordNet 1), scribble, whip up; place shove
  (WordNet 3), nudge (WordNet 1), scoot; remove wipe; pick click, tap (both marked `on`), touch; undo step back;
  save export (WordNet 2). **download moves from load to save** (the hand-over: for a drawing and for a file it is
  the other direction), and save gets the role **format** (marked by as, in: "export as png"). The role place
  of ask takes `by`, and every place role takes `close to`. `k.values.fill` (new type, shard `fills`): solid,
  outline, striped, dotted, checked with their other words (filled in, hollow, stripy ...), the fill values of
  change the demo listed by hand. The senses were read in the raw WordNet files; where the only sense is another
  meaning (scribble: write; redo: remodel; download: from a central computer) the verb is hand-written.
  **Left for Round 12 (`w.lang.en`)**, by cause: frames ("undo that change", "clear the selection", "nothing
  selected", "give me" as a wish form) and discourse fillers are grammar, not verbs.
- **Cities (cause: the rule of R10.0 that dropped every PSys2 city within a quarter of a degree of ours):** the
  rule now decides by distance and spelling. Within 5 km and spelt alike (a quarter of the letters, an article or
  "Saint" aside, or the shorter name the first words of the longer, never across a direction word): another name
  of our city, a `core.word` in the new shard `psys2-city-words` (15: Saint Petersburg, Sevilla, Ulan Bator,
  Frankfurt am Main, New York City, Andorra la Vella ...). Within 5 km and spelt otherwise: left and listed on
  FROM-PSYS2.md (29: districts such as Kowloon, Manhattan, Çankaya, and names in another language such as
  Copenhagen, Mecca, Chittagong, Astana: no rule tells an exonym from a district). Farther than 5 km: a city of
  its own, **79 more** (597 in all): Mississauga, Guarulhos, Foshan, Puente Alto, Santa Cruz de la Sierra, the
  boroughs of New York and Mexico City (GeoNames files them as cities; they stay). The import ran from the cited
  commit `6b63b2ba`, extracted with `git archive` into /tmp (nothing in /tmp/wt2 was changed); `--commit` no
  longer needs a git checkout. The first reading of the rule (letters within three) made Çankaya a name of
  Ankara and Santo Domingo Este a name of Santo Domingo; both were caught by reading the 23 words and the rule was
  tightened (they are now left).
- **Countries:** the 16 name variants of the hand-over were already words since R10.0 (Türkiye, DR Congo, Ivory
  Coast ...). **Kids facts:** `class` on every animal and `cannot=fly` for the flightless birds are there (first
  worker, R9.2 and R11.1). **Face parts:** answered by a join, not a new flag: a slot of the layout face holds a
  part of the face when its `holds` names a `k.body.part` with `part_of=face` (eyes, nose, mouth; not neck, not
  hat); a test shows the lookup. **Not done:** the bounding boxes of the 38 map regions (the hand-over says the
  map keeps its own generated data; a union of the country boxes would be a rule, but crosses the antimeridian
  for Oceania and Russia; left), "February has 28 days, 29 in a leap year" (k.time has `days` and `leap_days`).
- **Looked at:** the 15 city words and the 29 left (all); the 79 new cities as a list of names and countries;
  the WordNet glosses of the 14 verbs with senses. **Not looked at:** the population of the new cities.
- **What SOP Lang could not say:** that `deselect` with no thing means "nothing picked" (the role is optional;
  the reading is in `about`).
- Tests: `tests/k.actions.acts.test.mjs` (1 more), `tests/import.psys2.test.mjs` (2 more), questions ac-25,
  ac-26, va-f1. Numbers: k.actions 16 acts, 56 roles, 314 verbs, 89 markings; k.geo +80 wires; k.values fills 10
  wires. Catalog 22 worlds, 911 shards, vocab 23,476 words; 0 errors, 0 warnings. npm test 2,710: 2,704 pass,
  6 skipped, 0 fail. The demo's real questions: unchanged (117 of 132 Talk failures found). After the rebase on R11.3 part 1:
  catalog 22 worlds, 918 shards, vocab 23,723 words; npm test 2,760: 2,754 pass, 6 skipped, 0 fail.

## The names of the hand-written worlds in `k.words` (2026-11-14, second worker; a cause R11.1 left to the WordNet importer)

- **Cause:** "What is a kilogram?", "What is a litre?" found no definition: `k.words` keeps the words of the first
  20,000 lines of the frequency list and the common things, so about 340 names of the hand-written worlds
  (animals, foods, units, body parts, shapes, wearables) had no sense.
- **Rule** (`coreNames` in `tools/import/wordnet.mjs`): for each type that names things, the WordNet synsets its
  things fall under (`CORE_ROOTS`: animal; food and solid food; unit of measurement; body part; celestial body;
  the two senses of shape; colour; person; clothing, jewelry, covering; time period). A one-word name with no sense
  yet is kept with its first noun sense under one of them, through is-a or instance-of, wherever it stands in the
  frequency list and even beyond the third sense: emu, heron, kilogram, litre, millimetre, pancreas, cornea,
  falafel, borscht, rhombus, octagon, turquoise; Mars is the planet, not the god. The common things keep the sense
  the coverage rule chose (they win where both name a word). 734 names have a sense under their root.
- **Numbers:** `k.words` 11,313 -> 11,481 words, 28,987 -> 29,310 senses, 321 shards (largest `re`, 186,781 bytes).
  The demo's real questions (`tools/ask-real.mjs`): Talk failures found **117 -> 119** of 132 (kilogram, litre).
- **Left:** names of several words (manta ray, light year, top hat, small intestine, police officer: `k.words`
  keeps single words; taking multiword lemmas changes the word key of the world) and the feelings (adjectives:
  happy, sad; their adjective senses are there for the common ones). Remaining one-word misses per type are in
  the test's reach (a test checks kilogram, litre, emu, pancreas, falafel, Mars the planet, crane the bird).
- **Looked at:** the list of the 734 names with a sense; the glosses of Mars, crane, kiwi, venus. **Not looked at:**
  the 323 new senses one by one (WordNet's, kept by the same rule as the others).
- Tests: `tests/import.wordnet.test.mjs` (1 more; the equality with the import now passes the core names).
- Numbers: catalog 22 worlds, 918 shards, vocab 23,739 words; 0 errors, 0 warnings. npm test 2,761: 2,755 pass,
  6 skipped, 0 fail.

## Questions Q36 and Q37 (2026-11-14, second worker)

- Q36: names of several words in `k.words` (about 170 names of the cores). Q37: a `sense` on the numbers and
  usage facts of the 70 names with two senses. Neither blocks; meanwhile nothing changes.
- WORLD.md of `k.words` says which words have senses (the frequent words, the common things, the names of the cores).

## Catalog freshness (2026-11-14, second worker): the catalog on main rebuilt

- The reviewer's run at 5ae0fb1 had one failure, the catalog freshness test: the `version` of `index.json` (a
  content hash of `docs/worlds`) was the hash of an earlier state, because two workers pushed generated files in
  turn. `npm run build` gives `25e7964c3393` (was `cc8b68a74b53`); nothing else in `index.json` or `vocab.json`
  differs. Numbers: 22 worlds, 918 shards, vocab 23,739 words; 0 errors, 0 warnings. npm test 2,761: 2,755 pass,
  6 skipped, 0 fail.

## Round 11, item 3, part 2 (2026-11-14, first worker): 53 more common things drawn (100 in all); three hand links

- **Which** (MISSING.md, next by frequency after part 1, ranks 705 to 943): graffiti, windshield, antenna, gavel,
  helm, tofu, greenhouse, tile, ashtray, locket, risotto, aquarium, basin, portfolio, buggy, trifle, binoculars,
  cello, stocking, chime (as tubular bells, the sense kept), blindfold, radiator, mortar (the gun), bugle,
  billboard, clockwork, bellows, meatball, cider, barricade, freighter, observatory, chainsaw, slab, tanker,
  pendant, harmonica, vial, grinder (the sandwich), cheesecake, battleship, burr, machete, jukebox, doorknob,
  mainframe, scuba, mast, shawl, caddy (the tea tin), schnapps, brig, seatbelt. Shards `places-3`, `food-3`,
  `vehicles-2`, `things-3` grew.
- **Found while drawing, a drawing already there under another name:** `tram` (Noto) for trolley, `"nazar
  amulet"` for amulet (I had drawn the same eye), `blusher` (Mulberry) for rouge. They became hand links in
  `hand-links.tsv` (`trolley` same tram, `rouge` same blusher, `amulet` kind `"nazar amulet"`), not drawings;
  looked at all three. A test that would have found them before drawing: a word of the missing list that is a
  tag of an imported drawing (the check script of this part, not in the repository).
- **Passed over** (ranks 705 to 943): sonar, detonator, ledge, throttle, arcade, rye, rung, cockpit, archive, casing,
  hub, sesame, wreckage, pollen, mound (of baseball), peninsula, myrtle, rink, bog, rudder (of an aircraft), hoop
  (of a skirt), talisman (a word of the amulet), crypt, snowball (a plant), viola (a plant), wick, brewery, fender,
  cowl, muzzle (parts or rooms or places with no one shape, or plants with no drawable form in the sense kept),
  barley (a grain), trolley, amulet (above).
- **Place and size** in `k.scenes.thing` for the 100 new drawings and the two animals drawn under another name
  (`sources/hand-core/place-size.tsv`, 90 rows, named=model): without them 159 objects had no place or size (the
  test allows 5%). Three `on` values were changed after the anchor test (no anchor for drawer, floor, leg). The
  iceberg now stands in the water band of the arctic scene, not on the snow.
- **The ships and the iceberg carry no water of their own** (destroyer redrawn): a drawing is the thing alone.
- **Looked at:** the 53 new drawings and the three linked ones on two contact sheets (140 px, name underneath);
  burr (its hooks made a face) and seatbelt (a grey tower) redrawn and looked at again; the arctic scene. Verdict
  with the name: all recognisable; **weakest without it: stocking (a brown boot), cheesecake (a box), buggy (a
  black hood), clockwork, harness, tile (a chequer).** Not looked at: the 90 place and size rows one by one after
  writing them (written from the name, as the table's other rows).
- New links by rule: `hoarding` = billboard, `windscreen` = windshield (WordNet synonyms; my hand words for them
  were dropped).
- **The 100 of Round 11 item 3:** 100 common things drawn (98 in the sense kept; eel and raspberry show another
  physical sense), three linked, three animals drawn under their own name.
- Numbers: k.objects 2,211 objects (328 hand-written); the four shards grown: `places-3` 116 wires / 16,109 bytes,
  `food-3` 292 / 37,931, `vehicles-2` 204 / 26,831, `things-3` 1,175 / 151,156. Coverage of the 1,500 common
  things, before item 3 and now: a drawing of its name 680 to 780 (52%), a link 343 to 352, neither 477 to 368
  (25%); place 693 to 782 by name, size 710 to 799. Joins: 70 clashes (68 before item 3). Catalog 22 worlds, 918
  shards, vocab 23,739 to 24,035 words; 0 errors, 0 warnings. npm test 2,814: 2,813 pass, 1 skipped, 0 fail.

## Round 11, item 4 (2026-11-14, first worker): common-sense rules about kinds, as SOP Lang rules

- **Six rules (`core.rule`) and one new soft rule** in `docs/worlds/k.commonsense/schema.sop` (version 3, now
  importing `k.animals` and `k.food`), source `hand-core 1`:
  - *lives in implies the usual place:* `k.commonsense.habitat` (an animal's habitat is where it usually is) and
    `k.commonsense.habitat.place` (through the new type `k.commonsense.lives`, shard `lives`: 32 habitats give
    water, ground, both for ponds and marshes, or indoors);
  - `k.commonsense.ability`, `k.commonsense.inability`: what an animal can and cannot do, the thing can and cannot
    (new key `cannot`), so the existing soft rules about flying reach every animal;
  - *liquids need a container:* `k.commonsense.drink` (a drink of k.food is a liquid), shard `liquids` (15 everyday
    liquids), and the soft rule `k.commonsense.liquid`: a liquid placed with nothing to hold it (new key
    `placed.in`);
  - *a thing on a carrier moves with it:* `k.commonsense.carried`: a placed thing `on` a carrier of the same scene
    is where the carrier is, and when the carrier is placed elsewhere the derived place follows (the rule's
    conclusion is withdrawn and made again);
  - *things that cannot fly are not in the sky unless on something:* the soft rule `nofly` now reads only a placed
    thing with no `on` (`core.absent=on`).
- **Existing soft rules corrected** because the animals now reach them: a thing usually in water that can fly is
  no issue in the sky (a duck); one that is also on land is no issue on grass.
- **Need a function, left to the library** (said in WORLD.md): moving with a carrier when places are numbers (the
  space solver), whether a container is big enough (amounts, volumes), that a flying carrier is in the sky only
  while it flies (time).
- **Where the rules are: Q38.** Asked for in "a rules shard"; shards hold facts only (the validator), and a host
  imports modules. Meanwhile the rules are in the schema and the facts they read in two shards.
- Tests: `tests/k.commonsense.rules.test.mjs` (5: each rule in a small world, and with the whole catalog: every
  animal with a habitat has a usual place; 22 liquids); questions cs-20, cs-21; cs-09 and cs-10 changed with the
  knowledge (the swift is in the sky; the world knows 349 things, not 15).
- **Looked at:** the issues of the small worlds (texts read); the places of dolphin and penguin in the whole
  catalog. **Not looked at:** the places of the other 330 animals one by one (a test requires one for each).
- **Judgement that is mine:** which habitats are water, ground or both; the 15 liquids; that a pond animal is on
  land too.
- **What SOP Lang could not say:** "the carrier flies, so the rider is in the air" over time, and anything about
  sizes of containers; the rule names in issues come prefixed with the module (`k.commonsense.k.commonsense.nofly`)
  when the world is loaded with `use`.
- Numbers: k.commonsense 4 shards (`lives` 33 wires, `liquids` 15); schema 7 rules more. COVERAGE: common things
  reached by k.commonsense words 17 to 35. Catalog 22 worlds, 920 shards, vocab 24,039 words; 0 errors, 0 warnings.
  npm test 2,821: 2,820 pass, 1 skipped, 0 fail.

## Round 12, part 1 (2026-11-14, second worker): `w.lang.en`, PSys2's English hand-over imported as a reusable world

- **Source:** PSys2 `handover/lang.en` read from /tmp/wt2 at `78f45863` (`git -C /tmp/wt2 log --oneline -1`:
  "78f45863 worker-tasks: smoke green at 04d46cd9; LANG-EN slice 2, arbitration, bridge accepted; next"; the files of
  the hand-over were last changed at `9b025e05`), with `git show` (nothing in /tmp/wt2 changed; its `git status` is
  empty). Source `psys2 78f45863`, CC0 (`sources/psys2/SOURCE.md`). Tool `tools/import/psys2-lang-en.mjs`,
  deterministic; a test regenerates the shards from the checkout and compares.
- **This repository's rules, applied** (what changed is generated into `docs/worlds/w.lang.en/IMPORT.md`): types and ids
  under `w.lang.en` (the hand-over used `lang.en.*`); keys with `_`; core.source on every wire (the hand-over had none on
  its rules, categories, ellipsis and clause facts); a complete slot line for every key (the hand-over's schema lacked
  `many=true`, the set `acts.data`, the types relpron, copula, partitive, other, choice, the keys `time`, `order`, `span`,
  `read`, the params' `name`/`value`/`doc` ...). **No notation inside values:** lists in one value
  (`case=subject,object`) -> repeated keys; ranges `2..5` -> min, max; regular expressions -> an ending and the words it
  stands for (`n't`, and the 16 negations written without apostrophe); grammar rules with `? * + [a|b]` -> 84 plain
  productions of 64 constructions (optional part: a second production; repeated part: a helper category; a set of
  words: a category with `w.lang.en.word` facts); frame patterns -> one `w.lang.en.part` per part (1,244), `lit.<role>=`
  -> `w.lang.en.fixed` (30); "_" for a space -> spaces and apostrophes ("i'd like to"). References to PSys2 code
  (`from=`, `read=`) became comments. A production may not name a category twice (a repeated key is a set: the second
  NP of `NP OF NP` was lost when told); five are written with a helper (NP -> NP OFNP).
- **Left out** (one application's): `tab-only` / `tab-priority` (5 frames), the 5 frames of the "act" `own` (routing to a
  world's own reader). **Taken in besides the hand-over** (named by its frames, missing from it): the lexicons
  `space.amounts`, `acts.dir`, `acts.layout`, `lang.ordinal` and the phrase groups `undo`, `redo`, from PSys2's worlds at
  the same commit. The verb groups `V.set` / `V.apart` are the acts change / take apart of k.actions.
- **Catalog:** `w.lang.en` is a world of facts (types and 12 shards, validated with the pinned 0.16.0 like the k.*
  worlds): `scanWorlds` now takes a `w.*` directory whose schema has no `std.schema.world`; `scanSchemas` the others.
  Its vocabulary comes from the keys that hold English words (`text`, `singular`, `ending`), not from the names of
  frames and constructions (538 such names would have entered vocab.json). Numbers have their measure (Q31, 20 slots).
  The key-word test covers k.* only (a grammar's keys, lhs and rhs, are not asked about).
- **What the library reads** (`tests/w.lang.en.test.mjs`, build 0.33.0 pinned in `tools/sopworld/grammar/` for this check
  only): the options of `parseText` come from the world's own `w.lang.en.cat` facts (`tools/lib/lang-en.mjs`), nouns and
  adjectives from k.words through vocab.json; 23 noun phrases (det-n, count, ordinal, all, possessive of and 's, PP,
  pronoun, that one, some of, two of, relative, the other, or, except, and) and 4 question shapes parse with the expected
  construction and head; `grammarView` / `viewDiff` on the views. Not read by the library: commas (its tokenizer drops
  them), frames (not yet in std.grammar).
- **Joins:** numerals, ordinals and numeral determiners = `k.values.number` values; QALL words are k.values set words
  except `every`; irregular singulars and noun exceptions are k.words nouns; every frame act is a k.actions act; 20 frame
  role names are not k.actions role names (listed in `tests/w.lang.en.roles.json`).
- **Looked at:** every shard of the hand-over and every production, construction and category written; the 23 parses;
  the first 30 frames with their parts. **Not looked at:** the other 203 frames part by part (converted by one parser,
  checked by the test that parts are 1..n and name existing phrases, lexicons and acts), the 1,394 phrase items.
- Question Q39 (the expected structure of the grammar tests; the third build). Lessons in docs/lessons.md.
- Numbers: w.lang.en 12 shards, 2,180 wires, 392,128 bytes (largest frames-acts-more, 630 wires, 115 kB), schema 243
  wires; 0 errors, 0 warnings. After the rebase on R11.3 part 2 and R11.4: catalog 23 worlds, 932 shards, vocab
  24,184 words. npm test 2,833: 2,827 pass, 6 skipped, 0 fail. The type `time_line` I had declared for the order in
  time of the temporal prepositions was taken out again: the reviewer's block "02:15" gives `k.time` an order in time
  (first worker); the join from `w.lang.en.prep.time` to it comes after.

## Round 12, fix (2026-11-14, second worker): the shards of `w.lang.en` cite the commit they come from

- The pushed shards of 66b228a said `core.source="psys2 a019aa1e"` while the header comments, SOURCE.md and this log say
  `78f45863`: the PSys2 checkout at /tmp/wt2 moved on during the work (to `a019aa1e`, not by me) and the import took
  its HEAD as the default commit. Reimported with `--commit 78f45863`: every fact is the same but for its source (a
  diff with the sources masked is empty; between the two commits only `worlds/lang.common/lexicon.sop` changed, 52 lines
  added, none in the two phrase groups taken). The tool now takes by default the commit its IMPORT.md cites, and
  keeps the shards `hand-*` and `core-*` that other tools write. npm test 2,833: 2,827 pass, 6 skipped, 0 fail.
- (ce7e166 left out the regenerated `docs/worlds/LICENSES.md`, which names the source by its commit; committed next.
  `build-catalog --check` does not compare LICENSES.md, so nothing failed: worth a check of its own.)

## Q35 applied (2026-11-14, first worker): one sopworld build, 0.30.0 at 42b3456, for every world

- **One build:** `tools/sopworld/sopworld.mjs` is now sopworld **0.30.0** (build 52e26c40644d) at commit
  `42b3456` of `soplang-words-lib` (was 0.16.0 at 1e18f1d for `k.*`); the second build `tools/sopworld/w/`
  (0.26.0 at 4c33e81, used for `w.*`) is gone, `tools/lib/schemas.mjs` loads the reusable worlds with the one
  build, `index.json` drops `sopworld_schemas` (its `sopworld` names the one commit). The third build that came
  with `w.lang.en` while this was under way (`tools/sopworld/grammar/`, 0.33.0, used only by
  `tests/w.lang.en.test.mjs` for std.grammar) is gone too: its 12 tests pass on 0.30.0 (parseText, nounPhrase,
  grammarView, viewDiff are there), and `w.lang.en` was already validated with the main build. AGENTS.md, README,
  `docs/worlds/README.md`, `docs/index.html` and the headers of the three `w.*` schemas say so. The library's main is
  at 0.35.0 by now; the reviewer named 0.30.0, so that is the pin.
- **What changed for the knowledge worlds: nothing.** `node tools/validate.mjs`: 942 files, 0 errors, 0 warnings
  before and after, the same output line for line apart from load times (sum of load times 8,420 -> 9,083 ms).
  `npm run build` and `npm run reports`: the 2,211 drawings, 61 scenes, JOINS (3,402 names, 70 clashes), COVERAGE,
  ASPECTS and vocab.json byte-identical. `tools/ask-real.mjs`: identical (119 of 132 Talk failures found).
- **What changed for the reusable worlds:** since 0.27.0 the act `make` reads `amount` as how many things to make,
  so `w.list.item` with `amount="a litre"` was refused ("how many? (a litre)"). The key is now `quantity`
  (`w.list` version 2; "amount", "how many", "how much" stay words for it); the session test makes two items at
  once with the act's `amount` and undoes it. Of the two library defects of Q35, **undo right after remove is
  fixed** in 0.30.0 (now asserted in the session); `make` still accepts an item without its required `text`.
- Numbers (after the rebase on `w.lang.en`): catalog 23 worlds, 932 shards, vocab 24,184 words; validate 955 files,
  0 errors, 0 warnings; vocab.json unchanged by this commit. npm test 2,833: 2,832
  pass, 1 skipped, 0 fail.

## Round 12, part 2 (2026-11-14, second worker): holes of `w.lang.en` and its joins to k.actions, k.layouts, k.words

- **Frames joined to k.actions** (Round 12 item 4): new type `w.lang.en.role_map` (act, role, act_role, `marker=yes`, and
  an exception by `frame` or by what the part `takes`); 23 maps in `shards/hand-joins.sop` (make.thing is the kind,
  make.amount the number, rel that takes a preposition marks the place, rel that takes a direction word is the
  direction, save.value the name or, in two frames, the format ...). A test: every role of every frame is a role of
  its act in k.actions (64 through a map, 270 by name). The list of 20 unjoined roles is gone.
- **Prepositions joined to k.layouts and to the markers of k.actions** (item 6): `layout` (a k.layouts.relation rel) and
  `inverse=yes` on 15 prepositions of the hand-over (facts that merge with the imported ones); 8 spatial prepositions
  the hand-over lacked (left of, to the left of, right of, to the right of, in front of, on top of, underneath, beneath)
  and the 12 markers of k.actions roles that were no preposition here (close to, in the middle of, out of, off, among,
  through, via, using, by means of, according to, instead of, rather than). Tests: every layout is a k.layouts
  relation; every marker of a k.actions role is a preposition here, except "and".
- **Holes filled** (items 1, 5, 7; `shards/hand-grammar.sop`): statements with be (`s.copula`), the tag question (the
  hand-over's hole `q.tag`: 14 negated auxiliaries as words of AUXNEG; the import no longer copies its status, said
  in IMPORT.md), relative clauses with have, conditions (`clause.if`: if ... then, and if ... with no then), standing
  rules after a frame lead (`clause.standing`: from now on, by default), was and were. Each parses with the library
  (a test of 8 sentences). Left as a hole: temporal prepositions (they wait for the order in time of k.time, the first
  worker's next item; I took my `time_line` type out again for that reason).
- **Plurals joined to k.words** (item 1): `tools/lang-en-core.mjs` writes `shards/core-plurals.sop` from WordNet 3.1
  noun.exc: 184 plurals of k.words nouns that the rules of w.lang.en do not read (mice, feet, children, vertebrae,
  potatoes); 138 of them classical or foreign and `read_only=yes` (a new key: read, not written: antennae -> antenna,
  but antenna -> antennas); 6 left out because the plural is a word of its own (cola, crying, dive, gas, signore,
  soles); `shards/hand-morphology.sop`: people, women and five -man plurals (WordNet makes them by a rule), and the
  plurals that are the singular (sheep, deer, fish, moose, salmon, trout, bison, aircraft, series, species).
- **every** is a word of the k.values set word `each`: the test now accepts a set word's words (no k.values change).
- **Looked at:** the 184 WordNet plurals as one list (the six left out and the read-only split are from that reading),
  the 23 role maps against the examples of their frames, the 8 parses. **Not looked at:** every frame's roles one by one
  (the test checks that each lands on a k.actions role, not that the map is the best one).
- Numbers: w.lang.en 16 shards, 2,484 wires, 432,807 bytes, schema 250 wires; 0 errors, 0 warnings. Catalog 23 worlds,
  936 shards, vocab 24,210 words. npm test 2,837: 2,831 pass, 6 skipped, 0 fail; the same after the rebase on Q35 (one
  build, 0.30.0: the w.lang.en tests run on it; Q39 loses its part about a third build).

## Order in time for `k.time` (2026-11-14, first worker; reviewer block "02:15")

- **k.time version 2.** A parent type `k.time.ordered` (`cycle`, `n` the position, `next` the successor, cyclic)
  that month, weekday, season and two new types extend: `k.time.part_of_day` (morning, afternoon, evening, night;
  `starts_about` / `ends_about` 5, 12, 17, 21 hours after midnight) and `k.time.hour` (the 24 hours of the clock,
  `midnight`, `"1 am"` ... `noon` ... `"11 pm"`; `n` 0 to 23, `hour12`, `am_pm`, `part`). `k.time.cycle` (week,
  year, seasons, day, clock) says where each round starts and ends, its length and what one round lasts.
- **Before / after by one rule** (`k.time.order`): of two times of one cycle, the smaller `n` is earlier; the facts
  `k.time.before cycle earlier later` (complete: a pair that is not there is "no"): 375 (week 21, year 66, seasons
  6, day 6, clock 276). "After" is the same fact read backwards. The cyclic case is `next`: after December comes
  January, after Sunday Monday, after winter spring, after 11 pm midnight.
- **Seasons with the hemisphere said:** `k.time.season_in season hemisphere first last`, 8 facts made by four rules
  from the months' `season_north` / `season_south` and `next` (winter in the north December to February, spring in
  the south September to November). The season's `after` (the season before it) is dropped: it was `next` read
  backwards (one home). The order of the seasons is the same in both hemispheres.
- **Durations in several units (Q33, the part in this block):** `name` and `unit` are the identity of a
  `k.time.duration`, new key `count_about`; 14 more facts (a week 168 hours; a day 1,440 minutes and 86,400 seconds;
  an hour 3,600 seconds; a fortnight 2 weeks; a month about 30 days, about 4 weeks; a year about 52 weeks, about 365
  days; a common year 12 months, about 52 weeks; a leap year 12 months; a century 10 decades; a millennium 10
  centuries). The PSys2 import pairs name and unit per fact now: FROM-PSYS2.md says 9 lengths of time we had and
  **0 left** (were 2: "a year has 52 weeks", "a leap year has 12 months"); rerun from the cited commit 6b63b2ba,
  extracted with `git archive` into /tmp (nothing in /tmp/wt2 changed). The second worker's Q33 work (is_a many,
  capitals, continents) is not touched.
- **Holidays:** k.time has none, so none has a place in time (said in WORLD.md).
- Tools: units of the new numbers (`tools/measures-core.mjs`, 171 measures), families "part of the day" and "hour"
  and the temporal keys in `tools/attributes-core.mjs` (aspects), the new names in the joins table (time 35 -> 42
  names), key words (`am`, `pm`, `position`, `order`).
- Tests: `tests/k.time.test.mjs` (5: cycles go round once with positions in order; one rule, n(n-1)/2 facts per cycle,
  none across cycles, every one by the rule; seasons by hemisphere agree with the months; every hour in its part
  of the day; durations agree across units), questions tm-13 to tm-29 ("Monday is before Friday", "December is
  after November", "spring comes after winter", "after December comes January", "Friday is not before Monday in
  one week"); tm-07, tm-08, tm-12 name the unit or ask `next`.
- **Looked at:** the 8 season spans and the counts of the before facts printed; the 24 hour rows. **Judgement that
  is mine:** the hours of the parts of the day, the hour names.
- **What SOP Lang could not say:** that `next` of the last member is the first is said by the data, not by a rule
  (no modular arithmetic in a rule without a function); "before" across rounds (next Monday) needs a date, which is
  the library's time functions.
- Numbers: k.time schema 117 wires (version 2); shards calendar 88 wires / 10,475 bytes, clock 34 / 4,598, psys2 1;
  derived when loaded: 375 before facts, 8 season spans. Catalog 23 worlds, 933 shards, vocab 24,184 -> 24,229
  words; 0 errors, 0 warnings. After the rebase on the w.lang.en holes: catalog 937 shards, vocab 24,255
  words; npm test 2,859: 2,858 pass, 1 skipped, 0 fail.

## Q34 (a) items 1, 4, 6 and the Q33 schema change of shapes (2026-11-14, second worker)

- **Item 1, `k.drawing`** (new module, schema only, WORLD.md): `k.drawing.part` (shape, x, y, w, h, z, colour, rgb,
  pointing, opens) and `k.drawing.point` (n, x, y). `k.objects.part` / `k.faces.part` extend `k.drawing.part`,
  `k.objects.point` / `k.faces.point` extend `k.drawing.point`; the 13 slots each world wrote again are gone from its
  schema (k.objects version 4, k.faces version 2, both `imports=k.drawing`). No fact changed type. The measures of
  k.units name the frame of k.drawing (`drawing`: that of the object or face that extends it).
- **Item 4, the basic colours:** `k.values.coloured` declares the eleven once; `k.food.food` and `k.space.body` extend it
  (their own `colour` slots removed; both import k.values). The five slots that differ (required in k.drawing, `any`
  more in k.attributes.thing, other keys: `basic`, `drawn_colour`, `family`) keep the list; a test keeps all equal.
  Eight lists became five; Q40 asks for an enum taken by name.
- **Item 6, `k.kinds`** (new module, schema only, WORLD.md): `k.kinds.kind` (name, is_a many, kind_of) and two rules
  (is_a gives kind_of; a kind_of of a kind_of is a kind_of). `k.commonsense.thing`, `k.people.kind`, `k.shapes.shape`
  extend it and lose their own `is_a`. The derived `kind_of` lands on the world's own fact: square -> polygon,
  quadrilateral, rectangle, rhombus; grandfather -> man; milk -> liquid (through the drink rule of k.commonsense).
  k.words keeps WordNet's own is_a and kind_of; k.parts its `from`.
- **Q33, schema of shapes:** `is_a` of a shape holds many (from k.kinds); the square is a rectangle and a rhombus
  (`tools/colours-shapes-core.mjs`, which may now name the shapes of the PSys2 shard as kinds). Questions sh-08 and the
  PSys2 import test say both. **The duration in several units** is in the first worker's k.time item (block 02:15)
  and was left to it; the fact changes of Q33 (capitals, independence, Cyprus, kit) were not done by me.
- Tests: `tests/shared-modules.test.mjs` (3), and four tests that read the old places (the shape enum now in k.drawing,
  the frame of k.drawing in k.units, square is_a twice). Q40. Lessons.
- Numbers: catalog 25 worlds (k.drawing, k.kinds: schemas, no shards), 936 shards, vocab 24,211 words; 0 errors, 0
  warnings. npm test 2,840: 2,834 pass, 6 skipped, 0 fail. After the rebase on k.time version 2 (first worker): 25
  worlds, 937 shards, vocab 24,256 words; npm test 2,862: 2,856 pass, 6 skipped, 0 fail.

## Round 12, part 3 (2026-11-14, second worker): the temporal prepositions joined to the order in time of k.time

- k.time version 2 (first worker) has `k.time.before` (cycle, earlier, later) derived by one rule. `w.lang.en.prep.time`
  gets `relation` (the fact type) and `first_is` (earlier or later: which key the first thing of "X before Y" is);
  before, after, earlier than, later than say them (`shards/hand-joins.sop`, facts that merge with the imported ones).
  The hand-over's hole `pp.time` is filled (the import no longer copies its status; IMPORT.md says why). A test reads
  "Monday is before Friday" (true), "Friday before Monday" (false), "December after November", "spring earlier than
  summer" from the facts of k.time. during, until, since: k.time has no fact for them yet (left).
- npm test 2,863: 2,857 pass, 6 skipped, 0 fail.

## Q36 (2026-11-14, second worker): names of several words in `k.words`

- Finished the change a stopped worker had left in the tree (importer, schema, 59 shards; the rest of the tree was
  clean). `k.words.sense.word` is `kind=atom kind=string` (k.words version 2): a name of several words is a string
  with spaces (`word="manta ray"`), as WordNet writes it with underscores (manta_ray); its id keeps the underscore
  (`k.words.manta_ray.noun.1`), its shard is that of its first two letters. Only the names of the hand-written worlds
  are taken (Q36 option (a)); the frequent words of the list are single words, so the phrasal nouns of option (b)
  would need another list (not done).
- Fixed in the half-done importer: the header of a shard and the `means` of irregular forms still wrote the lemma
  with underscores (`"flying_fish"`).
- Of the 150 names of several words of the cores, 94 had a sense under their world's root; six roots more (edible
  fat and topping for food; galaxy, solar system and black hole for space; operator for people roles, each with its
  WordNet chain read) bring it to **102**. Two are in WordNet but not under the root, left so: `chilli pepper` (only
  the plant), `right angle` (an angle shape, not a unit). 46 are not in WordNet (`tomato soup`, `light green`,
  `bobble hat`, `square kilometre`, `Halley's comet`): their own world says what they are. `galaxy` became a name
  of a core and got its chain of kinds.
- Joins: with a sense in k.words, 45 more names are carried by more than one world (JOINS: 3,409 -> 3,454 names,
  one thing everywhere 3,339 -> 3,384; food 497 -> 519, body part 72 -> 84); 70 clashes, unchanged. The textual
  aspect of the animals 297 -> 313 of 314, of food 181 -> 212 of 229 (ASPECTS.md). The vocabulary keys are the same
  24,256 (the names were keys already); they now also lead to their k.words shard.
- Test: manta ray, light year, small intestine, top hat, police officer, olive oil, milky way, black hole, bus
  driver have a noun sense; light year's is a distance.
- Looked at: the WordNet chains of the 10 names outside a root, and the diff of every changed wire that is not a new
  multiword sense (only galaxy's three senses). Not looked at: the glosses of the 102 senses one by one.
- Numbers: k.words 321 shards, 32,282 -> 32,404 wires (115 senses and 10 spellings added; galaxy's 3 senses changed), 7,445,092 -> 7,491,718 bytes;
  the largest shard `re` 899 wires, 187,344 bytes. Catalog 25 worlds, 937 shards, vocab 24,256 words.
  `node tools/validate.mjs`: 962 files, 0 errors.

## Q37 (2026-11-14, second worker): number and usage facts say which sense, for names with several senses

- Q37 option (a): `k.attributes.number.sense` and `k.attributes.usage.sense` (`id=true`, not required; the values of
  `k.attributes.same.sense`), only on the facts of names that have several senses in `k.attributes.same`: 29 number
  facts, 5 usage facts (k.attributes version 2; key words "sense" by tools/key-words.mjs).
- Which sense: my judgement from the values, in `sources/hand-core/senses.tsv` (type, name, sense), read by
  `tools/lib/senses.mjs` for `tools/numbers-core.mjs` and `tools/usage-core.mjs`. Animal: bug, chicken, cod, crab,
  eel, feather (the joins file the drawn feather under animal), fox, herring, lobster, moose, oyster, porcupine,
  salmon, sardine, snake, swan, turkey; food: apricot, kiwi, lemon, orange, peach, tomato; plant: lilac, mushroom,
  rose, violet; thing: bell, cone. Usage: fox animal, hay and wheat food, toast thing, star body in space (at night).
  Each is the sense of the drawing of the name (the numbers were labelled for the common things, which are drawings);
  the numbers agree (turkey 9 kg and 40 km/h: the bird; kiwi 7 cm: the fruit; lilac 4 m: the shrub).
- `tools/joins.mjs` reads `sense` on these two types: the 34 facts are filed under their sense (`in`) and no longer
  `unsure` under every sense of the name (JOINS.md: 29 names lost "unsure: k.attributes.number").
- Test (k.attributes): a fact of a name with one sense has no `sense`; a fact of a name with several has one, that
  sense exists for the name, the fact's type is `in` it and `unsure` under none; every row of the table is used.
- Not done: option (b), `sense` on every fact. Looked at: the 34 rows with their values. Not looked at: whether a
  number of a one-sense name was labelled for another meaning (the joins see one sense there).
- Numbers: k.attributes schema +4 wires (2 slots, 2 key words); numbers shards 975 facts, usage 338 facts (34 with
  `sense`). Catalog 25 worlds, 937 shards, vocab 24,256 words; validate 962 files, 0 errors.
  npm test 2,864: 2,859 pass, 5 skipped, 0 fail (the catalog test failed once on a stale index.json after a WORLD.md
  edit; rebuilt and rerun).

## Q33 facts (2026-11-14, second worker): capitals of today, independence by sovereign, Cyprus, kit and bunny

- The fact changes of the reviewer's answer to Q33 ((b) + (c)); the schema part was done before (shapes: Q34 (a)
  commit; durations: the first worker's k.time). Raw data fetched again as SOURCE.md says (Natural Earth v5.1.2,
  mledoze/countries f931d9c); before any change the import gave the committed shards byte for byte.
- **Independent, by one rule instead of a list:** Natural Earth's `SOVEREIGNT` (the country is its own sovereign),
  not its `TYPE` (which says `Country` for Aruba, Greenland, Hong Kong, Jersey and `Sovereignty` / `Disputed` for Cuba,
  Kazakhstan, Israel). Cuba, Israel, Kazakhstan now true; Aruba, Åland, Curaçao, Guernsey, Greenland, Hong Kong, Isle
  of Man, Jersey, Macao, Sint Maarten now false (the 11 read one by one: all ten territories of another state; the
  eleventh is Taiwan). The rule agrees with the country list for every country it has but four that govern themselves
  without general recognition (Natural Earth notes another state's claim, or the list does not say independent):
  Taiwan, Kosovo, Somaliland, Northern Cyprus: `independent` not said (was true, false, true, true). Q41 asks.
- **Capitals of today:** Burundi Gitega (not Bujumbura), Kazakhstan Astana (Natural Earth's Nur-Sultan, renamed; Natural
  Earth itself gives Astana as `namepar`, so the city is `Astana` in the Natural Earth shard with `Nur-Sultan` as a
  `core.word`), Palau Ngerulmud (not Melekeok). Named in `tools/import/geo.mjs` (`CAPITAL_FROM_LIST`: a rename cannot
  be told from a spelling by the data); the import checks that the list names them. What only the list says goes
  into its ODbL borders shards (the capital, and `capital_of` of Gitega and Astana as a `k.geo.city` wire that merges
  by name and country), so the public-domain shards still cite Natural Earth alone (a first try put two sources on
  the Natural Earth wires: LICENSES.md then showed two shards under ODbL terms; undone).
- **Cyprus:** new key `k.geo.country.political_continent` (k.geo version 3), from the list's region where it names
  another real continent than Natural Earth's: only Cyprus (Asia; politically Europe). Islands in the open ocean and
  the sub-Antarctic territories keep ours, as the answer says.
- **Animals:** `@k.animals.word.baby.kit core.word text=bunny text=bunnies means=kit of=k.animals.animal.baby` in the
  schema; the rabbit's baby stays `kit`; hair / fur ours, UK population ours (nothing to do).
- FROM-PSYS2.md rerun from the cited commit 6b63b2ba (`git archive` into /tmp; /tmp/wt2 untouched): capital
  disagreements 10 -> 7 (the spellings), independent 14 -> 0; one PSys2 city (Astana) is now one we have by name.
- Tests: k.geo (Q33: capitals, capital_of, the renamed city, independent for 5 + 10 countries, the four unsaid,
  Cyprus); the old test "every independent country but three has a capital" now has none without (the three were
  Macao, Northern Cyprus, Åland: not independent); k.animals (bunny).
- Numbers: k.geo 15 shards (Natural Earth and list), 3,858 -> 3,861 wires, 695,907 -> 696,264 bytes; geo import
  stats: capitals from the list 37 -> 40. Catalog 25 worlds, 937 shards, vocab 24,256 -> 24,258 words (astana,
  political continent). validate 962 files, 0 errors. npm test 2,866: 2,861 pass, 5 skipped, 0 fail.

## Reviewer 06:00 (2026-11-14, second worker): the names of the three kinds of worlds in the READMEs

- README.md and docs/worlds/README.md: one paragraph each (the same text) with the owner's names: world schema
  (`w.seating`), knowledge world (`k.animals`; `w.lang.en` a knowledge world about English), live world (one running
  instance in a session, shown through a view), and the library's `std.*` modules as mechanisms, not worlds; this
  repository holds world schemas and knowledge worlds, never live worlds. The first sentence of README no longer uses
  "world schemas" for the schema file of a knowledge world.
- Only docs and the regenerated index.json (its content hash covers docs/worlds/README.md). tests/catalog.test.mjs:
  6 pass; the full suite was 2,866 / 2,861 pass / 0 fail on the commit before, and no test reads the READMEs.

## Derived facts visible to tools (2026-11-14, first worker; reviewer block "02:45", item 3)

- **`tools/derive.mjs`** (in `npm run build`, before the joins): for each module whose world runs rules (its own
  `core.rule`, or one of a module it imports: k.commonsense, k.time, and since the second worker's `k.kinds` of Q34
  also k.people, k.shapes, k.objects), loads the module with the told facts of it and of its imports (not its own `derived`
  shards), reads from each wire which values a rule of the module made (`meta.via` of the wire, `meta.fills` of the
  values added later), leaves out every value a told shard states for the same thing and every `core.*` key, and
  writes, for the wires of the module's own types, one wire per thing and rule into
  `docs/worlds/<world>/shards/derived.sop`: the identity keys, the derived
  values, `derived=true`, `core.source="rule <rule id>"`. Licence: that of the facts read (CC0-1.0; a mix is refused).
  New source `sources/rule/SOURCE.md`. Slot `derived` declared on `k.kinds.kind` (one line in the second worker's
  new module: it covers k.commonsense.thing, k.people.kind and k.shapes.shape, which extend it), `k.time.before`,
  `k.time.season_in`.
- **Output:** `k.commonsense/shards/derived` 1,148 wires, 164,395 bytes (ability 271, inability 225, habitat 311,
  habitat.place 312 for 330 animals; drink 7: drinks are liquids; k.kinds.up.direct 22: kind_of from is_a);
  `k.time/shards/derived` 391 wires, 55,292 bytes (375 before, 16 season spans); `k.shapes/shards/derived` 12
  (a square is a kind of rectangle, rhombus, quadrilateral, polygon); `k.people/shards/derived` 4 (a boy is a kind
  of child). A rerun gives byte-identical files.
- **Found while writing it:** reading "made by a rule" from the wire's maker alone was wrong: k.commonsense's own told
  facts (cat at house, dog can run, `core.source="hand-core 1"`) merged into wires the rules had made first from
  k.animals, and came out as derived. Fixed by checking every value against the told shards; a test keeps a told
  value out. A rule-made wire of identity keys only (k.time.before) was dropped at first; kept now.
- **What the tools see now:** COVERAGE: common things reached by k.commonsense 35 -> **189** (13%); JOINS: 3,409 ->
  3,411 names in more than one world, and 330 animals' names now also in `k.commonsense.thing`; the joins tool
  gives a derived wire the sense of the one typed thing its rule reads (`ruleSenses`: habitat reads
  k.animals.animal: an animal), so they join as animals, not "unsure"; ASPECTS: the place of k.commonsense is a
  spatial row of common things now (no count changed: those things had a place in k.scenes already); the temporal
  rows read `k.time.before` (counts unchanged, the months were covered by `n`). `tools/ask-real.mjs`: unchanged.
- Tests: `tests/derived.test.mjs` (4: fresh against the tool; every wire marked, one source, a rule of its own
  module; loaded with the rules nothing is made twice and no value changes; told values never written as derived,
  and the tools see dolphin at sea, the swift flying, lemonade a liquid, Monday before Friday, winter in the north
  from December, the dolphin joined as an animal).
- **The merge seen in two tests:** loaded with `fullWorld`, the wire of the shape cube and of the kind boy now carry
  `core.source="rule k.kinds.up.direct"` next to `hand-core 1` (the derived `kind_of` merged in), and
  `tests/k.colours-shapes.test.mjs` and `tests/k.people.test.mjs` refused it. `handSources` (tools/lib/worlds.mjs)
  now accepts a `rule <id>` source beside a told one, never alone; the k.people test filters it the same way.
- **Not done / open:** a derived wire merges in a host with a told wire of the same identity, and `derived=true`
  then stands on the merged wire (Q42; Q41 is taken by the second worker). The four
  `ambiguous-key` warnings of the catalog (key `name` declared by k.kinds and by k.commonsense, k.people,
  k.shapes) came with `k.kinds` and are not changed here. w.* worlds have no rules, so no derived shard.
- **Looked at:** the derived lines of dolphin, swift, duck, cat, dog and the 7 drinks; the counts per rule.
  **Not looked at:** the other 1,100 lines one by one (the same rules, read by a test against a run with the rules).
- Numbers: catalog 23 worlds, 939 shards, vocab 24,256 words; 0 errors, 0 warnings. npm test 2,863: 2,862 pass,
  1 skipped, 0 fail.
- After the rebase on Q34 (a) (second worker: k.kinds, k.drawing) and on the temporal prepositions of w.lang.en, the
  build rerun (index.json taken from either side and rebuilt; worker-log kept both entries): derived shards as above
  (k.commonsense 1,148, k.time 391, k.shapes 12, k.people 4 wires). Catalog 25 worlds, 941 shards, vocab 24,257
  words; validate 966 files, 0 errors. npm test 2,867: 2,866 pass, 1 skipped, 0 fail. (A first run lost
  `tests/catalog.test.mjs` to SIGKILL while the second worker's build ran beside it; the rerun passed.)
- Rebased again on Q36 and Q37 (second worker): generated files taken from main and rebuilt; numbers unchanged
  (25 worlds, 941 shards, vocab 24,257 words; JOINS 3,454 names, the same as main: the derived animals' names were
  already joined). The 16 test files that read generated files: 108 pass; the full run was on the base before Q37.
- And on the Q33 facts (second worker): my question renumbered Q42 (Q41 is the second worker's); vocab 24,259
  words; the 18 test files that read generated files or k.geo, k.animals: 117 pass.
## Round 12, part 4 (2026-11-14, second worker): during, until and since joined to k.time

- The reviewer's block 02:15 names five temporal prepositions the demo reads (before, after, during, until, since);
  before and after were joined (part 3), the other three had nothing in k.time to compare.
- **k.time version 3: `k.time.during`** (time, span, hemisphere; complete, derived): three rules make it from the hours'
  `part` and the months' `season_north` / `season_south`: 24 hours within their part of the day, 12 months within
  their season in each hemisphere (48 facts). "3 pm during the morning" is "no" (complete). Key words by
  tools/key-words.mjs (`time`, `span`, `hemisphere`).
- **w.lang.en:** `second_is` (new slot) next to `first_is` (which now may be `time`) on the joined temporal
  prepositions, so a host knows both keys of the relation; until (`first_is=earlier second_is=later`) and since
  (`later` / `earlier`) name `k.time.before`, and their `span` (end, start; from the hand-over) says the end or start
  itself counts ("Friday until Friday"); during names `k.time.during` (`time` / `span`). All 7 temporal prepositions
  are joined (hand-joins.sop, facts that merge with the imported ones).
- Tests: w.lang.en (every joined preposition's keys are keys of its relation; Monday until Friday, Friday until
  Friday, not Saturday until Friday; Friday since Monday; January during winter in the north and summer in the south,
  not summer in the north; 9 am during the morning, not 3 pm); k.time (the 48 facts are exactly the hours' parts and
  the months' seasons).
- k.time is the first worker's world by history; this adds a type and three rules and changes no fact. If the
  derived-facts shard (first worker, Round 11 next item 3) lands first, its generator has to be rerun on a rebase.
- Not done (still open in w.lang.en WORLD.md): imperative clauses as productions, possessive "of" beyond parts.
- Numbers: k.time schema 117 -> 132 wires (version 3; derived when loaded: 48 during facts); w.lang.en schema 252 ->
  253 wires, hand-joins 62 -> 65 wires, 10,198 bytes. Catalog 25 worlds, 937 shards, vocab 24,258 words; validate
  962 files, 0 errors. npm test 2,867: 2,862 pass, 5 skipped, 0 fail.
- After the rebase on the derived-facts commit (5a9f1a1, first worker): `k.time.during` declares `derived` (boolean,
  as the other derived types; the catalog refused the derived wires without it), `node tools/derive.mjs` rerun: the
  k.time shard `derived` 391 -> 439 wires (the 48 during facts); joins, reports and catalog rebuilt. k.time schema on
  main 121 -> 138 wires; catalog 25 worlds, 941 shards, vocab 24,259 words; validate 966 files, 0 errors. npm test
  after the rebase: 2,860 pass, 5 skipped, and tests/catalog.test.mjs killed (SIGKILL, not an assertion); that file
  alone: 6 pass.


## The seven weakest drawings redrawn (2026-11-14, first worker; reviewer block "02:45", item 4)

- **Redrawn by hand** (`tools/objects-hand-data.mjs`; no imported drawing of these exists in our sources: Noto has a
  lion, a leopard, an oyster, socks and a shortcake, none of them these things): **cougar** (was a bear's head: now a
  sleek tawny cat, small head with pointed ears and a white muzzle, long tail hanging down with a dark tip, paws; 13 ->
  19 parts), **clam** (was white on white with radial ribs, a scallop: now an outlined shell with five growth lines
  round the hinge and the closed edge; 7 -> 8), **eel** (was a green ribbon: now a thick S body tapering to a point,
  a fin along the back, a blunt head, a side fin, an eye and a mouth; 4 -> 7), **stocking** (was a brown boot: now a
  long pink stocking with a white lace top, a back seam and darker heel and toe; 4 -> 10), **cheesecake** (was a
  yellow box: now a slice, white filling on a brown crust, red sauce dripping over the top, a strawberry; 6 parts),
  **buggy** (was a black hood on brown discs: now spoked wheels with black tyres, a box body, a folding hood, a
  red seat, a dashboard and shafts; 9 -> 19), **harness** (was read as scissors: now a climbing harness, a blue waist
  belt with a buckle, two leg loops, an orange belay loop, a carabiner hanging from it and two gear loops; 9 -> 14).
  Two helpers in the data file: `ribbon` (a band along a centre line: the eel's body and fin, the cougar's tail)
  and `spokes`.
- Rerun: `tools/objects-hand.mjs`, `tools/drawn-colour.mjs` (the drawn colours of buggy, cheesecake, cougar, harness,
  stocking changed with the drawings), `tools/attributes-core.mjs` (no change), build and reports.
- **Looked at:** the seven before (one sheet, 200 px) and after, at each step of drawing (scratch sheets) and on the
  final sheet made by `tools/contact-sheet.mjs` from the previews (180 px, name underneath). Verdict, mine: with the
  name all seven are recognisable; without it the buggy, the cheesecake (a cake slice), the clam and the stocking
  read as what they are; the cougar reads as a big cat (could be taken for a lynx or a lioness); the eel as an eel
  or a sea snake; the harness as climbing gear, the leg loops still a little like goggles. **Not looked at:** the
  seven in the scenes (none of them is drawn in a scene preview: no scene file changed) and the labelled pictures.
- Numbers: k.objects 2,211 objects (unchanged); shards animals-2 443 -> 480 wires (57,518 -> 61,928 bytes), food-3
  292 -> 290 (37,931 -> 37,695), things-3 1,175 -> 1,224 (151,156 -> 157,626), vehicles-2 204 -> 235 (26,831 ->
  30,848). Catalog 25 worlds, 941 shards, vocab 24,259 -> 24,280 words (part names: carabiner, belay loop, tyre,
  rim ...); validate 0 errors. COVERAGE: k.objects carries 1,190 -> 1,191 of the common things (a new part name;
  which one not checked).
  npm test 2,871 with item 4 and the preview rule together: 2,869 pass, 1 fail (`drawn-hand` stale: I had not rerun
  `tools/drawn-colour.mjs`), 1 skipped; after the rerun the failing file and the five others that read drawings
  pass (42 tests).

## One rule for the file of a preview; README: shards hold facts, modules hold rules (2026-11-14, first worker; block "02:45")

- **The preview file of a multiword name** (the reviewer's sheet missed "crane bird", whose preview is
  `crane_bird.svg`): every reader already used `fileOf` of tools/render-svg.mjs (gallery through `objects.json`,
  contact sheets, scene previews, anchor sheets), but a host had no rule to follow and a reader that kept the SOP
  token (`"crane bird"`, with its quotes) got `_crane_bird_`. Now `fileOf` reads a quoted token as its string and
  drops "_" at either end; no file name changed (no name begins or ends with another character). The rule is said
  once, for hosts, in `k.objects/WORLD.md`, with its JavaScript line; a test (`tests/gallery.test.mjs`) evaluates
  that line against all 2,211 objects, checks `objects.json`, the token form, the gallery's image for crane bird,
  that no two objects share a file (case ignored), and that every scene's preview is found by the same rule.
- **README:** a paragraph "Shards hold facts, modules hold rules" (Q38): rules in the module, a separate
  `k.commonsense.rules` module when they grow, and the derived shards as facts written back, marked.
- Looked at: nothing drawn changes here. Numbers: catalog 25 worlds, 941 shards, vocab 24,280 words; 0 errors.
  npm test: the full run of the previous entry included this change; gallery and catalog tests after it: pass.

## Lessons of items 3 to 5; the state after the rebases (2026-11-14, first worker)

- `docs/lessons.md`: three lessons (the cue a thing alone has; a documented rule a test reads; rebasing generated
  files between two workers).
- The two commits before this one (bc16d37 drawings, ac676e5 preview rule and README) were rebased on the second
  worker's during / until / since: index.json taken from main and rebuilt; `k.time/shards/derived` (439 wires now,
  with `k.time.during`) was already fresh. On the pushed state, the 30 test files that read drawings, the catalog,
  coverage, attributes, derived facts, joins, k.time and w.lang.en: 2,398 tests, 2,397 pass, 0 fail, 1 skipped.
  Catalog 25 worlds, 941 shards, vocab 24,280 words; 0 errors.
- Next for the first worker (block 08:00): block 06:55 item 3 (w.seating acts, w.timeline range, w.face, w.map),
  then the two open w.lang.en holes; not started here.
## Q41 (2026-11-14, second worker): recognition=limited for Taiwan, Kosovo, Somaliland, Northern Cyprus

- The reviewer's answer (block "08:00"): say what is true and neutral. New key `k.geo.country.recognition`
  (`enum=limited`; k.geo version 4; key words "recognition", "recognised", "recognized" by tools/key-words.mjs).
  `independent` stays unsaid for the four.
- Said from Natural Earth alone, so it stays in the public-domain continent shards (`core.source="natural-earth
  5.1.2"`): `recognitionOf` in `tools/import/geo.mjs` is `limited` for a country that is its own sovereign and that
  Natural Earth marks "Self admin.; Claimed by ..." (Taiwan by China, Somaliland by Somalia, Northern Cyprus by Cyprus)
  or as `TYPE` Disputed with `FCLASS_ISO` Unrecognized (Kosovo). Israel (Disputed, with an ISO class) and Norway (ISO
  class Unrecognized, a quirk of the data) are not marked. The import throws if `recognition` and an unsaid
  `independent` ever disagree (they come from two rules over two fields; today they mark the same four).
- Raw data: `ne_50m_admin_0_countries.geojson` was missing in this clone's `sources/natural-earth/raw` and was fetched
  as SOURCE.md says; before the change the import gave the committed shards byte for byte.
- Tests: k.geo (the four and no other carry `recognition=limited`); import.geo (`recognitionOf` and `independentOf` on
  Taiwan, Kosovo, Israel, Norway, Falkland Islands). Q41 moved to Closed in questions.md.
- Numbers: k.geo 4 wires changed (africa, asia 2, europe), schema +2 wires; catalog 25 worlds, 941 shards, vocab
  24,259 -> 24,261 words.
- After the rebase on the first worker's drawings, preview names and lessons (bc16d37, ac676e5, 3045bdb): index.json
  taken from main, `npm run build` rerun; vocab 24,282 words (main 24,280 + the two words). npm test 2,873: 2,868
  pass, 5 skipped, 0 fail.

## Block 07:40 item 1 (2026-11-14, second worker): the frames and the joiner PSys2 wrote after the import

- Took block 07:40 items 1-4 (the reviewer's split of 08:00); this is item 1. Read in /tmp/wt2: questions.md "w.lang.en
  vs the hand-over", "geo.map switch: frames and a joiner fact", the [KNOW] lines of "Q12 ... lessons to forward",
  and `src/lang/en.local.mjs` (read as data: its strings are parsed as JSON, never run). Cited at the last commit that
  changed it, `447a5f9a` (IMPORT.md); the hand-over stays at 78f45863 (it was deleted from PSys2 after that).
- **118 frames, not 84:** the file has grown since the reviewer's count: 27 `acts.text`, 62 `acts.facts` (38 ask, 20
  layer, 3 clear, 1 view; the reviewer counted 7 + 28 + 17), 24 `acts.media` (play, loop, add a melody: new since the
  block) and the 5 of the act `own`. All are published, by the import, as the hand-over's frames are: shards
  `frames-acts-text` (27 frames, 159 parts, 7 fixed), `frames-acts-facts` (62, 409, 34), `frames-acts-media` (24, 121,
  6), `frames-acts-own` (5, 18), `joiners-keep` (`w.lang.en.joiner.keep text=its`, new type).
- **The notation kept as facts, not as values:** a one-word set (`[have]`) is `listed=yes` on its part, and
  `{value:rest(quotes)}` is `quotes=yes`; a test writes the pattern of each of the 118 frames back from its parts as
  PSys2's `patternOf` does and gets the pattern as written (whitespace aside), and every part of every frame reads
  back to the same parts. 16 parts of the hand-over's frames gained `listed=yes` (the `[have]` loss PSys2 reported).
- `after` (new slot) on the 5 frames of `own` (a test: it names a frame of the same set); `own` frames name no act of
  k.actions (tests changed: `own` needs `reader` and is of the set `acts`); `tab-only` / `tab-priority` of 6 frames
  still left out (one application's interface; IMPORT.md).
- 4 role maps (hand-joins) for the roles the new frames use that k.actions names otherwise: pick kind and value ->
  thing ("A C major chord please"), place value -> place ("move the last list to the top"), undo amount -> number.
- **Documentation:** the constructions of the hand-over's question frames, joiner, correction, negation and imperative
  rules (13) and the 6 contraction endings carry `documentation=yes` (new slots); they stay complete, and the
  library still parses the question shapes (test unchanged).
- w.lang.en version 2: schema + `after`, `quotes`, `listed`, two `documentation` slots, `joiner.keep`, the three sets.
- Numbers: w.lang.en 16 -> 21 shards (+898 lines of facts, 163,181 bytes; the largest new shard `frames-acts-facts`
  510 wires, 91,099 bytes), schema version 2; frames 233 -> 351. Catalog 25 worlds, 941 -> 946 shards, vocab 24,282
  words. npm test 2,875: 2,870 pass, 5 skipped, 0 fail.

## World schemas for the library's corpus and the demo (2026-11-14, first worker; block "06:55" item 3)

- Took block "06:55" item 3 (reviewer 08:45: next for the first worker). All four parts, on the pinned build 0.30.0;
  what needs a later release is a skipped test naming it and questions.md **Q43**.
- **`w.seating` version 2:** tables take `place` (new `x`, `y`), `connect`, `group`; guests take `copy` and `place`
  (a guest is placed on a seat through its slot `seat type=w.seating.seat`: `place at=<seat>` is sopworld 0.33; with
  0.30 `change attr=seat`). A table holds at most its `seats` seats (`std.schema.capacity`; a table with no `seats`
  takes any number), which WORLD.md had listed as needing the library. Not said: one guest per seat (a copied guest
  keeps its seat, so the deny would refuse every copy: a question for the library, in Q43).
- **`w.timeline` version 2:** every number (`from`, `to`, `at`, `until`) in -10000..10000; four denies: an event is
  not before its timeline's `from`, not after its `to`, does not last past `to`, and does not end before it begins.
  Refused from both sides (moving an end of the timeline past an event too), with the reason.
- **`w.face` (new):** one kind per slot name of k.faces (18: the 16 of `plain`, `accessories`, `clothes`), all
  extending `w.face.part` (`face`, `variant`, `colour`, `size` 0.6..1.5 default 1 step 0.1, `x`, `y` -50..50); the
  face (`w.face.face`: `name`, `style`, `preset`, `skin`, `hair_colour`, `eye_colour`, `clothes` = the keys of
  `k.faces.preset`, and `expression` as a mode drawn over the parts, which keep their variants); one deny: one part
  of each kind on a face. No value list of k.faces is written again (variant, colours, expression, style are open
  names); a test keeps the kinds equal to the k.faces slot names. Read PSys2's ui.avatar schema and face logic
  (read-only) for what an application needs (per slot variant, colour, scale, dx/dy; an expression; presets).
- **`w.map` (new):** a view schema over k.geo places: `w.map.place` (`name`, `sort` country or city, `highlight`,
  `colour`), `w.map.pin` (`on`, `sort`, `label`, `colour`), the view's state `w.map.view` (`zoom` 1..10 default 3,
  `layer` borders, rivers, none, `centre`), `std.schema.view name=w.map shows=w.map.shown state=w.map.view`. Acts:
  show (make a place, centre the view), highlight, pin, remove the pins (`remove set=all`), zoom, layer, show. 0.30
  ignores `state=`, so the view kind also allows `make` (at most one) and acts name it; on 0.37+ "zoom in" needs no
  thing. Read PSys2's geo.map schema (read-only).
- `tools/lib/schemas.mjs`: a world schema may hold denies and rules (the library's kinds-of-worlds), not a
  function; the patterns and checks a deny names carry no `core.source` (it would be matched), the deny does; a
  kind's catalog attributes follow `extends` inside the schema (the w.face parts had none).
- Tests (`tests/w.schemas.test.mjs`, 13, 2 skipped on 0.30): five schemas in the catalog; found by face, avatar, map,
  world map; sessions for w.seating (placed, linked, grouped tables; copied guests; the capacity refusal), w.timeline
  (range and the four denies from both sides), w.face (the k.faces preset robot made into a face key for key, every
  variant a k.faces variant of its slot, size and place refusals, a second hat refused, an expression set and undone),
  w.map (France, Peru, Paris, Lima checked in k.geo; pins removed and undone; zoom and layer within their values; one
  view); skipped: a guest placed `at` a seat (0.33), "zoom in" with no thing (0.37).
- **Checked in a scratch copy, not committed:** with sopworld 0.45.0 all 13 tests pass, the two skipped ones too; the
  library's case corpus (55 cases) passes on 0.45 with the new w.seating and w.timeline as with the published ones;
  its 17 inline face and map cases pass when they name w.face and w.map.
- Docs: WORLD.md for w.face and w.map, w.seating and w.timeline updated; README paragraph; lessons (seven).
- Numbers: w.face 113 wires, 16,303 bytes, 19 kinds; w.map 39 wires, 6,830 bytes, 3 kinds; w.seating 35 -> 40 wires,
  6,606 bytes; w.timeline 33 -> 46 wires, 7,546 bytes; 0 errors, 0 warnings, all five in one world. Catalog 25
  worlds, 946 shards, vocab 24,307 words; COVERAGE lists w.face (7 common things by name) and w.map (3). npm test
  2,882: 2,878 pass, 3 skipped, 1 fail (COVERAGE.md stale before `npm run reports`); after the reports the six test
  files that read generated files: 39 pass, 2 skipped.
## Block 07:40 item 2 (2026-11-14, second worker): spans of time on top of k.time.during

- k.time version 4: `k.time.span` (name; `cycle`, many: every time of that cycle lies within the span; `within`:
  the span lies within another; `starts_about`, `ends_about`), complete. Facts (hand-core): week (cycle week), year
  (cycles year and seasons), weekend, dawn (within morning, about 5 to 7), dusk (within evening, about 18 to 20);
  words daybreak, "first light", nightfall, span, during.
- Three rules make `k.time.during` from them: a time of a cycle a span names; a span within another; a weekday whose
  `weekend` is true is during the weekend (one home: the weekend is not listed twice). Derived shard (tools/derive.mjs)
  439 -> 466 facts: 7 weekdays in the week, 12 months and 4 seasons in the year, Saturday and Sunday in the weekend,
  dawn, dusk.
- "The day" is left out on purpose: English "the day" is the 24 hours and the daytime, so a span holding every hour
  would say midnight is during the day. "Is the evening during the night" is "no" (complete), as before.
- The derived `before` facts were already shipped by the first worker's derived shard (block 02:45 item 3): nothing to do.
- Tests: k.time (the during set is exactly the 75 expected pairs); w.lang.en ("Saturday during the weekend", not
  Monday; Monday during the week; March and spring during the year; dawn during the morning, dusk during the
  evening; not the evening during the night).
- Not done: a week that starts on Sunday, holidays (PSys2 named them; not in the reviewer's item).
- `tools/measures-core.mjs`: the hours of a span (`starts_about`, `ends_about`) count hours after midnight, as those of
  a part of the day (the k.units.measure test asked for them); `k.units/shards/measures` 163 -> 165 wires.
- Numbers: k.time schema version 4 (+25 wires), calendar +3 wires, clock +4 wires, derived 439 -> 466 facts; catalog
  25 worlds, 946 shards, vocab 24,282 -> 24,284 words (daybreak, nightfall). npm test 2,875: 2,870 pass, 5 skipped,
  0 fail (a first run was cut off by a session restart and rerun).
- Rebased on the first worker's world schemas (2b5505e) and two reviewer blocks: index.json taken from main and rebuilt;
  vocab 24,309 words. npm test 2,882: 2,875 pass, 7 skipped, 0 fail.

## k.procedures, the format first (2026-11-14, first worker; block "09:10")

- Took block "09:10" (reviewer 09:55: next for the first worker). Read the library's Round 29 (`std.plan`): its
  questions.md has no design note yet, so the format of methods is written here as **Q44** for it to answer: seven
  types (method, goal, binding, match, step, arg, condition), alternatives chosen by world, preconditions, rank and
  name; decomposition to depth 3, at most 200 acts; four points left to the library (role -> argument map, history
  and answer keys, the order `of` is looked up, kind-chain matching).
- Nothing built yet in this commit; the world follows in the next ones. No test run (questions.md and the log only).
## Block 07:40 item 3 (2026-11-14, second worker): the kind of each vocabulary word; other names of places

- **`docs/worlds/vocab-kinds.json`** (new generated file, `tools/build-catalog.mjs`): every word of vocab.json with
  its shards grouped by what the word names there: the type of the wire whose identity value it is (back:
  `k.geo.river`, `k.body.part`, ...), the type of the key a `core.word` gives another word for (`of=`), the type or
  key a schema word means (capital: `k.geo.country.capital`), or the reusable world (`w.seating`). Every word has a
  kind (a test), the shards agree with vocab.json; one line per word, 2.9 MB (vocab.json 2.0 MB), loaded only by a
  host that wants it. vocab.json itself is unchanged in format. README, docs/index.html say so; the catalog test
  checks it is fresh.
- **Aliases (Peking), two sources, each in the shard of its licence:** (1) Natural Earth's `namepar` in the geo
  import: 30 `core.word` (Bombay, Madras, Calcutta, Rangoon, Bangalore, Mecca, Wien, Copenhagen, Gothenburg ...);
  (2) `tools/geo-aliases.mjs` (in `npm run build`, freshness test), a join of k.geo to k.words: the synonyms of the
  WordNet sense of a country or city that are proper names, into `k.geo/shards/aliases` (WordNet-3.0): 70 places, 103
  words (Peking and Peiping for Beijing, Persia for Iran, Holland, Siam, Constantinople, Bharat).
- **Three wrong joins found in the dry run, fixed by rule, each with a test:** "state" in the country pattern took the
  US states (Georgia got "Peach State", Jersey "New Jersey"): only country or nation now; a sense one of whose other
  names is another place of k.geo is that place (Congo got Zaire, the other Congo; now French Congo); a sense about
  a former state is not the place (Russia got Soviet Union and USSR).
- Looked at: all 109 names of the dry run (above). Not done: GeoNames alternate names (no language tags in the
  packages the network reaches, so English could not be told from other languages); short names (Cluj) PSys2
  handles by a rule of its own.
- Tests: catalog (vocab-kinds fresh; every word has a kind; back is a river and a body part; peking a city in the
  aliases shard; capital the key; "seating plan" w.seating); k.geo (aliases fresh; Peking, Bombay, Calcutta, Persia;
  not Zaire, Soviet Union, Peach State; no alias is a place of its own); import.geo leaves aliases.sop out.
- Numbers: k.geo 15 -> 16 shards of its own (3,861 -> 3,961 wires; words 249 -> 279 from namepar; aliases 70 wires,
  11,605 bytes); catalog 25 worlds, 947 shards, vocab 24,309 -> 24,427 words; vocab-kinds.json 2,917,230 bytes.
  npm test 2,884: 2,877 pass, 7 skipped, 0 fail (a first run failed on a stale index.json after a WORLD.md edit
  and on the import test not knowing the new shard; both fixed).
- Rebased on Q44 (first worker) and three reviewer blocks: index.json rebuilt; vocab 24,427 words. npm test 2,884:
  2,877 pass, 7 skipped, 0 fail.


## k.procedures: methods as knowledge (2026-11-14, first worker; block "09:10")

- **The world** (`docs/worlds/k.procedures`, hand-core, CC0): the format of Q44 (seven types) plus three keys found
  while writing the methods: `binding.together` (the values of several bindings: "parts with a kind or named by the
  model"), `match.not` (not `detail`), and `history` read as it was before the plan began. 23 methods, all general
  (none for one sentence), written by `tools/procedures-core.mjs`:
  from knowledge (16): compose a scene (k.scenes), arrange in a layout (k.layouts slots), put / make a thing on the
  anchor of another (k.layouts anchors: the seat of a swing, the top of a table), put on (a new) wearable
  (k.wearables), a wearable on a face (w.face), a person of a role (k.people: wears, holds), a face of a role (w.face),
  a feeling on a face (k.feelings on w.face), take apart a drawn thing (k.objects parts with a name), into named parts
  (k.parts), a group, build from parts (k.layouts joins), a country / a city on the map (k.geo on w.map);
  named tasks (7): a family photo (the people there, or a new family: alternatives by precondition), set a table
  (picture, or w.seating), a chart of the things there (w.list), a report about what was done (w.timeline or w.list).
  `core.word` facts name the tasks (family photo, set the table, chart, report).
- **Reference reader** `tools/lib/plan.mjs` (330 lines): a test oracle that reads the facts as Q44 says (fit,
  world, preconditions, rank; bindings, matches up the chain of kinds; each, after, expand, sub-goals to depth 3, no
  method inside its own expansion, budget 200 acts; a toy live world with things, groups, history), not a planner for
  hosts. Things made are named as the library names them (`swing1`).
- **Tests** (`tests/k.procedures.test.mjs`, 15): structure (acts and roles of k.actions, one source per binding, every
  name bound, knowledge types and keys exist, world schemas exist, no circle in the order; a plan in a world makes
  only its kinds with its attributes); goal -> expected acts for draw a farm, a person sitting on a swing (and on an
  existing swing, a man on a bench, a cup on a table), a family photo (both alternatives), set a table for four
  (picture, existing table, w.seating, default four), take apart a car / a piano / a group / an idea (refused), build a
  house from parts, a chart of the things in the picture, a report about what we did (timeline, list, refused when
  nothing was done), a doctor, a pirate face, a shy and a hurt face, a hat on a man, a scarf on a girl, a cap on a
  face, Peru and Lima on the map (and a country already shown), a row, a needed role asked. Coverage over all the
  knowledge read: 61/61 scenes (1,261 acts, at most 35), 60/60 roles in a picture, 60/60 on a face, 105/105 wearables,
  30/30 feelings, 17/17 layouts, 50/50 joined wholes, 1,643/1,643 drawings with named parts; 7 s.
- Found on the way (fixed in the format, not in the facts): a pond, a field and a barn inside a farm were expanded as
  the scenes of that name (now: no method inside its own expansion); kinds compared both ways let "person" fit every
  role (now one way); a role the goal did not say vs a filler knowledge did not give (now told apart); the farmer lost
  his number and place under the role method (the method now takes the goal's number and place). Lessons in
  docs/lessons.md. **Q45**: unnamed drawing parts have no mark (take apart leaves the body), no `w.chart`, "about" is no
  marker of make.
- Numbers: k.procedures schema 127 wires (with 54 key words by tools/key-words.mjs); shards from-knowledge 299 wires,
  53,738 bytes, tasks 117 wires, 21,497 bytes; validate 0 errors. Catalog 26 worlds, 949 shards (after the rebase on the second worker's aliases), vocab 24,470 words; k.units.measure says the 10 numeric keys of k.procedures (orders and plain numbers).
  COVERAGE: k.procedures 3 of the common things by word. npm test 2,897: 2,893 pass, 3 skipped, 1 fail (k.units.measure:
  no unit for the numbers of k.procedures); after tools/measures-core.mjs and the reports, the 7 test files that read
  generated files: 464 pass, 0 fail.

## k.procedures: the full run on the pushed commit (2026-11-14, first worker)

- On 1d4f120 (k.procedures rebased on the second worker's vocabulary kinds and aliases): npm test 2,899: 2,896 pass,
  3 skipped, 0 fail. The reviewer's block "11:05" says Q44 is forwarded to the library and to go on in this format
  (a script converts the facts if the library amends it). No file but this log changes here.
## Block 07:40 item 4 (2026-11-14, second worker): relatives, friend, shapes by their things, drop, reset, switches

- **Relatives as kinds of person:** k.people version 3: kinds `person` (above all) and `relative` (is a person);
  baby, child, man, woman `is_a=person`; `age` and `height_about` no longer required (person and relative have no
  one age). `k.people.role` now extends `k.kinds.kind` (its own `name` slot dropped: inherited, so no new
  ambiguous-key warning): family roles `is_a=relative`, every other role `is_a=person` but the fairy; new group
  `social`: friend, neighbour. The rules of k.kinds give the chain (derived shard 4 -> 78 facts): sister kind of
  relative and person; friend, doctor, king a person. `tools/derive.mjs` now takes the identity keys of the type a
  type extends when it declares none (k.people.role); it refused the role otherwise.
- **`k.shapes.shape.thing` reachable:** build-catalog adds the values of the key `thing` of a knowledge world (the
  typical things of a shape or a colour, the thing placed) to the vocabulary, with the key as kind: "stop sign" ->
  `k.shapes.shape.thing` in `k.shapes/shards/shapes`, banana -> `k.colours.colour.thing`.
- **k.actions:** `drop` is a verb of remove (WordNet senses 16 "get rid of" and 19 "leave out"), `reset` a verb of
  change with `value=default` (senses 1 "set anew", 2 "set to zero"); glosses table regenerated from the raw files.
  The act a sense means is my reading (`named=model`, as the other verbs); audit: both rows read against all 23
  senses of drop and 3 of reset (listed with tools/import/wordnet.mjs).
- **k.attributes version 3:** `k.attributes.switch` (9: visible, stacked, highlighted, selected, locked, pinned,
  grouped, switched_on, bold; `on`, `off` verbs, `default`), and `default_type` / `default_key` on colour
  (k.objects.part colour) and size (k.scenes.thing size): where "reset" goes back to. Hand-core.
- Tests: k.people (ten kinds; every role but the fairy a person, family roles relatives); shared-modules (boy:
  child, person; grandfather: man, person, relative); k.attributes (switch verbs are verbs of k.actions or k.words,
  by base or head, but bold, embolden, unbold; defaults name a real type and key); k.actions.acts (drop, reset);
  catalog (stop sign, banana).
- Not done: verbs of text editing (bold, embolden, unbold) in k.actions or k.words; a switch per world schema (the
  w.* schemas may take these by name later).
- Generated again: k.words shard `ne` (the importer takes the names of the cores: neighbour's senses now carry their
  chains), COVERAGE.md (common things reached by k.colours 8 -> 71 and k.shapes 8 -> 66: their typical things now
  find them), JOINS.md, catalog. Numbers: k.people 5 -> 6 shards (kinds 16 -> 20 wires, roles-social 4, derived 4 ->
  78 facts); k.attributes attributes shard +9 switches; k.actions verbs 314 -> 316; catalog 25 worlds, 948 shards,
  vocab 24,427 -> 24,447 words. npm test 2,888: 2,881 pass, 7 skipped, 0 fail (a first run failed on the two stale
  generated files above).
- Rebased on k.procedures (first worker, 1d4f120): its reference reader `tools/lib/plan.mjs` merged facts by the
  identity keys a type declares itself, so the 62 roles (whose `name` is now inherited from k.kinds.kind) became one
  fact and every role wore everything; it now takes the identity keys of the type a type extends, as derive.mjs does
  (4 k.procedures tests failed, 15 pass now). Catalog 26 worlds, 950 shards, vocab 24,490 words. npm test 2,903: 2,896 pass, 7 skipped, 0 fail.

## Block 06:55 item 2, first step (2026-11-14, second worker): the one build moved to sopworld 0.52.0 (b44d444)

- The block asks for 0.34+; the library's current release is 0.52.0 (b44d444), and the reviewer's block "11:35" asks
  for 0.52 (Q43). `tools/sopworld/sopworld.mjs` is that release's `docs/sopworld.mjs`; VERSION with commit, build
  c1f4d8ca7c1f and sha256 349ad76a...; index.json `sopworld: b44d444`; README, docs/index.html, docs/worlds/README.md,
  w.lang.en WORLD.md and the version test say 0.52.0. AGENTS.md still names 0.30.0 at 42b3456: an instruction file
  for agents, left for the reviewer to change.
- **What changed on 0.52:** validate 976 files, 0 errors, the same 4 `ambiguous-key` warnings as on 0.30 (k.kinds'
  `name`; removed in the next step). No shard, generated file or test result changed but the two tests of
  `tests/w.schemas.test.mjs` that were skipped as "needs sopworld 0.33 / 0.37 or later" (Q43): both now run and pass
  (the guest placed into a seat through its slot; acts on the map view with no thing). The derived shards, catalog
  and reports rebuild byte-identical (only the catalog's `sopworld` field changed).
- Skips: 5 here (4 imports whose raw files this clone lacks: DiceBear, Noto, OpenMoji, Mulberry; the PSys2 page at its
  commit). Without any raw file and without a PSys2 checkout, 20 tests skip: 17 that need raw files (coverage 4,
  WordNet 3, act glosses 1, coverage report 2, k.geo 1, k.parts 1, DiceBear, Noto, OpenMoji, Mulberry 4, plus the
  PSys2 page 1) and 2 that need /tmp/wt2 (w.lang.en import and local frames); none needs a newer sopworld.
- npm test 2,903: 2,898 pass, 5 skipped, 0 fail (was 2,896 pass, 7 skipped on 0.30).
## k.motion: rules of a natural face over time (2026-11-14, first worker; blocks "10:50" and "11:05")

- **The world** (`docs/worlds/k.motion`, hand-core, CC0; ranges from published measurements cited in WORLD.md): ten
  types (event, field, layer, rule, when, step, set, viseme, splitter, letters), facts only, for the library's
  `std.motion` (not released yet: format proposed as **Q46**, following its block "10:50"). 2 events (`reply` with
  outcome and text, `spoken`), 4 layers (blink 4, talk 3, expression 2, glance 1), 17 rules: blink at rest / while
  talking (Bentivoglio 1997: 17 and 26 a minute; closing faster than opening, Sforza 2008, Kwon 2013), glances left
  and right while listening / talking (Lee, Badler and Badler 2002), say the reply (one mouth per letter, emits
  `spoken`), and the seven outcomes (done, already, refused, not understood, answer, question, thinking) as k.faces
  brows / eyes / mouths with onset, hold (or hold until spoken) and ease back (smile onset and offset from Schmidt
  2006, eyebrow flash about 1/5 s); 7 classes of mouth shapes joined to k.faces mouths; one rule from written text to
  them (`latin letters`: vowels open, o/u rounded, m/b/p closed, f/v lip-teeth, t/d/n/l tongue, spaces and punctuation
  rest; marks folded, case ignored; durations give 184 words a minute against 164-214 measured in conversation,
  Yuan, Liberman and Cieri 2006). Nothing in w.lang.en or w.lang.ro (a test checks it).
- **k.faces**: 6 variants added to the style plain for this world (mouths `half open`, `pressed`, `lip bite`,
  `tongue tip`; eyes `looking out`, `looking in`, since the eyes are a mirrored slot): 175 -> 181 variants; previews
  regenerated. **k.units**: the unit `millisecond` (47 units); k.units.measure says the 15 numeric keys of k.motion.
- **Reference reader** `tools/lib/motion.mjs` (a test oracle, ~190 lines): `planMotion(motion, { events, seed, end,
  base, features })` -> segments, changes `[{t, key, value}]`, `stateAt(t)`; seeded, priorities, `via`, holds until an
  event, cancel, emitted events, repeated rules with during / not_during and state conditions.
- **Tests** (`tests/k.motion.test.mjs`, 10): shards fresh and load with no warning; every k.faces name exists (set
  values and `via` in the slot of their key, viseme mouths, layer keys are k.faces.expression keys; a step that sets the
  eyes sets `one_eye`); layers, events, fields and features exist; ranges sane and checked against their sources; the
  owner's text rule (with capitals, marks, digits, symbols, French and German samples, 120-220 words a minute); the
  sample plan "Done, I moved it." (letters in order, spoken at the end, smile after it, back to the face; seed
  determinism); priorities (talking mouth over the expression's, sad brows while talking, blinks over a thinking face,
  no blink on closed eyes); rates over time (16.4 blinks a minute at rest in 10 min, 24.4 while talking, 7 glances a
  minute listening); a new reply cancels the last; the strip frames render; no mouth knowledge in w.lang.*.
- **Strip**: `node tools/motion-strip.mjs /home/claude/shot/k-motion-strip.png` (27 faces of the sample reply over
  5.7 s, preset man, seed 3: each letter's mouth, a blink while talking, the smile after "spoken", its ease back, a
  blink at rest) and `--outcomes` (`/home/claude/shot/k-motion-outcomes.png`, one face per outcome). Not published.
- Numbers: k.motion schema 130 wires (18,988 bytes, with the key words of tools/key-words.mjs); shards rules 80 wires
  (15,971 bytes), mouth 19 wires (4,262 bytes); validate 0 errors, 0 warnings. k.faces plain-eyes 77 wires, plain-mouth
  131. Catalog 27 worlds, 951 shards, 24,542 words.

## Block 06:55 item 1 (2026-11-14, second worker): w.lang.en `many` and `priority`

- `many=true` on `rhs` and on every `in` was already in this repository's schema (the import of Round 12 wrote it;
  the library's Q33 was about the hand-over's schema). New test: the schema loads with every shard on 0.52 with no
  violation, and `rhs` / `in` are many.
- **Where order matters, found by parsing:** every construction's own examples parsed with the library; three tie at
  the same size with another construction: "the legs of the crocodile" (np.possessive-of vs np.pp), "and two big
  ones" (ellipsis.one-count vs ellipsis.one), "and one yellow" (ellipsis.one-bare vs ellipsis.fragment, which won).
  `w.lang.en.rule.priority` (new slot, integer) = 10 on their 4 productions (the import, `PRIORITY`, with a second
  source hand-core 1; IMPORT.md says so). The questions and the statements of the tests all rank right already.
- **For the library:** sopworld 0.52's `parseText` ranks by size and depth only and does not read `priority` (its
  grammar.mjs has no such key), though its Q33 answer says it would be honoured first. The test ranks by priority
  before size itself and checks the three ties; a library that honours it needs no change here.
- Not found by the scan: 13 construction examples do not parse at all (commas, which the tokenizer drops, Q39;
  "guest ann", "after tuesday", "is there a circle", "why is table 2 blue": known holes and the imperative
  clauses); "all of the tables" reads as np.quant-of, as the noun-phrase test expects.
- `tools/measures-core.mjs`: a rule's `priority` is a place in an order, as a frame's (`k.units/shards/measures`
  175 wires).
- npm test 2,904: 2,899 pass, 5 skipped, 0 fail.
- Rebased on k.motion (first worker, 43cb081): measures regenerated (190 wires), catalog 27 worlds, 952 shards, vocab
  24,562 words; npm test 2,914: 2,909 pass, 5 skipped, 0 fail.
## k.faces proportion rules: an experiment, measured, not switched (2026-11-14, first worker; block "10:35")

- **Tool** `tools/faces-canon.mjs` (121 lines): canons as lines and sizes of the head box (child, adult, old; the
  block's rules: eyes on the middle line, one eye apart, brows one eye above, nose bottom halfway between eyes and chin,
  mouth a third from nose to chin, ears between brow and nose lines); each slot's hand drawings are moved and scaled
  from the anchor the hand used to the canon's (glasses with the eyes, moustache between nose and mouth, beard from the
  mouth to the chin, ears and earrings between brow and nose lines; hair, hat, head, neck, shoulders unchanged). Writes
  the plain shards placed by a canon to a directory, and the contact sheet of the same 41 faces for a tree of worlds.
  `tools/faces-core.mjs`: `coreShards` takes the slot and variant tables (no change to its output, same 402 lines).
- **Exact maps:** the canon read off the drawing ("plain as drawn": eyes 0.44, nose 0.63, mouth 0.79 of the head box,
  1.6 eye widths apart, brows 1.1 eye widths above) gives every shard byte for byte (test).
- **Measures, adult canon vs hand placement:** sheets `/home/claude/shot/faces-before.png` and
  `/home/claude/shot/faces-after.png` (presets, the expressions on the woman, random faces 1-20): eyes larger and
  closer, longer noses; moustaches and noses on the mouth, brows close to lashes. Overlapping pairs of variants:
  moustache/mouth 0 -> 40 of 114, nose/mouth 0 -> 37 of 152 (eyebrows/eyes 0 -> 0). Bytes of the plain shards and
  slots 304,984 -> 307,575 (+2,591 with the canon facts). Generator 402 -> 523 lines. findVariants and the face cases
  pass on both (with the canon output swapped in: k.faces 9/11, the 2 failures only the freshness checks of shards
  and previews; w.schemas 13/13, k.feelings, k.wearables, k.people, questions 424, validate, k.motion all pass).
- **Decision (block rule "keep the absolute output if the rules lose on any of these"): kept.** Nothing published
  changes; **Q47** asks whether to publish the fitted canon, draw a style for the classical one, or stop.
- Tests: `tests/k.faces.canon.test.mjs` (3: exact maps; the adult canon keeps every part in its slot and follows its
  rules; the overlap measure that decided).

## 2026-11-14 — first worker: one build moved to sopworld 0.56.0 (1d1c3c6); plans and motion through the library (blocks 12:25, 13:00 item 1, 13:15)

- **Pin:** `tools/sopworld/sopworld.mjs` is the library's `docs/sopworld.mjs` at 1d1c3c6 (0.56.0, build dd893aeaf6c0;
  0.55 asked first, 0.56 by block 13:15), VERSION and the validate test follow; README, docs/index.html,
  docs/worlds/README.md and w.lang.en WORLD.md name it. `npm run build`: every generated file byte-identical but the
  catalog's `sopworld` field and content hash.
- **std.plan:** `tools/lib/plan.mjs` (384 lines) deleted. `tests/k.procedures.test.mjs` plans through the library's
  `factStore` (every published world, k.* and w.*), `planner` (the chain of kinds as data: is_a, kind_of, is, age,
  and drawing for people), `PlanLive` and `readMethods`; the checks of the facts keep a 12-line `schemaKinds` and a
  circle check of their own. All 15 tests pass with the same expected act lists; the coverage report is identical
  (61/61 scenes, 1,261 acts; 62/62 roles; 105/105 wearables; 30/30 feelings; 17/17 layouts; 50/50 wholes; 1,643/1,643
  drawings taken apart). No difference to report to the library.
- **std.motion:** `tools/lib/motion.mjs` (188 lines) deleted. `tools/motion-strip.mjs` gives the host's two settings
  (keys in listing order; `one_eye` shows the eyes) to `planMotionFacts`; `tests/k.motion.test.mjs` reads with the
  library's `readMotion` and `splitText`: 10/10 pass. A scratch comparison of the deleted reader and the library on
  252 plans (6 seeds, 7 outcomes, a cancelled reply, two base faces, 20 s each): 0 differ. No difference to report.
- `npm test` (in a worktree of this commit): 2,917 tests, 2,916 pass, 1 skipped, 0 fail.

## 2026-11-14 — first worker: k.faces plain placed by its published proportion canon (Q47, block 13:00 item 2)

- **Facts:** `k.faces.canon` (new type, 9 slots, words for its keys; `k.units.measure` says what each number counts):
  one fact, `plain-canon.sop` (938 bytes, 1 wire): eye line 0.4412 and nose line 0.6324 and mouth line 0.7941 of the
  head box's height, eye width 0.1786 of its width, 1.6 eye widths between the eyes, the brow line 1.1 eye widths above
  the eye line. Four decimals are enough: each anchor lands within 0.004 of where the hand drew it.
- **Generator:** `tools/faces-core.mjs` writes the fact, reads it back from that text (sopworld `parse`) and places
  every slot's drawings by it (`slotMaps`, `placeByCanon`, moved from the experiment): x' = anchor + (x - drawn anchor)
  * scale per slot. A slot's box is rounded outwards to within 0.01 (the tolerance the parts were already checked
  with; at 1e-6 one box, the earrings', came out 0.1 taller). Output: every shard byte-identical (test:
  `coreShards()` against `coreShards({ canon: null })`, the drawings where drawn, and against the published files).
  `tools/faces-canon.mjs` keeps only the classical canons and the sheet (121 -> 59 lines); faces-core 402 -> 489 lines.
- Measured: plain shards +938 bytes (303,565 with the canon); validate 0 errors; k.faces, canon, catalog, questions,
  joins, w.schemas tests pass; the adult canon still moves eyes and mouths (and still overlaps: the test kept).
- `npm test` (in a worktree of this commit): 2,917 tests, 2,916 pass, 1 skipped, 0 fail.

## Block 06:55 item 2 (2026-11-14, second worker): slot group k.named, excludes, the four warnings, joins to drawings

- **`k.named`** (new module, no shards; WORLD.md): `k.named.labelled` with the one slot `named` (`enum=model`). The
  21 types that declared it take it by `extends=k.named.labelled` (a second `extends`, a slot group, where the type had
  a parent: `k.objects.part` extends `k.drawing.part` and `k.named.labelled`); their 13 modules import `k.named` (each
  version + 1). `k.parts.usual` keeps its own slot: `named` is required there, which a shared slot cannot say.
- **The four `ambiguous-key` warnings are gone:** `k.commonsense.thing`, `k.people.kind` and `k.shapes.shape` no longer
  declare `name` again (it is `k.kinds.kind.name`, the same flags). validate: 980 files, 0 errors, 0 warnings.
- **`excludes=`** on the five approximate keys that have an exact twin on their type (`k.body.part.count_about`,
  `k.space.body.moons_about`, `k.values.colour.rgb_about`, `k.values.number.value_about`,
  `k.time.duration.count_about`); the three `core.deny` copies that said it are gone (`k.body.both`, `k.values.both`,
  `k.space.both`). `k.animals.both` (can / cannot: values, not keys) and `k.units.measure.both` (unit / counts) stay.
- **Joins to drawings: tried, then not declared (Q48).** Declared as `type=k.objects.object by=name` on the 10
  `drawing` slots of 8 worlds, they held when the k.objects shards were told first (no violation over all of them),
  but sopworld checks a `by=` join when a fact is told, as soon as the type is declared: `fullWorld('k.objects')`
  tells the animals and foods of its imports (k.commonsense imports them) before any object and refused them, and
  the in-world join of a stand-in cannot load shard by shard. A test now checks every `drawing=` of every world
  against the objects (all hold); docs/worlds/README.md says why; Q48 asks the library for a check after a load.
- Tests: shared-modules (only k.named and k.parts declare `named`; 21 types take it and import k.named; the five
  pairs exclude each other and a colour with rgb and rgb_about is refused with `excludes`; no `both` deny but the
  two kept; every drawing join holds); the k.drawing test knows the new lineage of `k.objects.part`.
- Two readers of schema text missed the inherited keys (`name` now only on k.kinds.kind, `named` on k.named.labelled):
  `tools/ask-real.mjs` (a type now takes the slots of every type it extends, and its parent's identity key when it
  has none; an inherited key's word is that of the declaring type) and the bindings test of k.procedures (its
  `slotsOf` read only the first `extends`). The real-question counts are back above their thresholds.
- Numbers: 28 worlds (k.named new), 952 shards, vocab 24,564 words; 13 schemas changed (each version + 1) and the
  three that no longer redeclare `name`; validate 980 files, 0 errors, 0 warnings (were 4). npm test 2,916: 2,911
  pass, 5 skipped, 0 fail (a first run was killed while two other workers' suites ran on the machine).
- Rebased on the first worker's 0.56.0 build move (377ee17) and k.faces canon (96cbe0d): the k.faces module line
  merged by hand (canon exported, k.named imported, version 3); my question renumbered Q48 (Q47 is the first
  worker's); generated files rebuilt (28 worlds, 953 shards, vocab 24,578 words); validate on 0.56: 981 files, 0
  errors. npm test 2,916: 2,910 pass, 5 skipped, tests/catalog.test.mjs killed (SIGKILL, under the load of other
  suites); that file alone: 8 pass.

## The two w.lang.en holes (2026-11-14, second worker): imperative clauses and "of" beyond parts

- Taken on the coordinator's word (the reviewer's 08:45 gave them to the second worker; the first brief had said not).
- **Imperative clauses** (hand-grammar, hand-core): `clause.imperative` S -> IMP | LEADS IMP and
  `clause.imperative-neg` S -> NEGIMP IMP, with IMP -> V NP | V NP PP | V PP and LEADS -> IMPLEAD | IMPLEAD LEADS;
  IMPLEAD and NEGIMP are the hand-over's own imperative lead and negated-request words (`type=`).
- **A category from another world:** new slots `w.lang.en.cat.from_type` / `from_key`: V takes the texts of
  `k.actions.verb`, POSN the names of `k.values.position` (a join by value); `tools/lib/lang-en.mjs` `hostLexicon`
  fills them from the catalog and still gives a word its k.words reading.
- **"of" beyond parts:** `np.attribute-of` (NP -> ATTRNP OFNP, ATTRNP -> DET ATTRN) and `np.position-of` (POSNP), each
  `priority=20` over np.possessive-of; ATTRN has 15 English attribute nouns of its own (colour, size, height ...):
  joined to k.attributes first, it took "legs" (an attribute there: how many) and read "the legs of the crocodile"
  as an attribute. The attribute question gets a production with ATTRN (q.wh-of).
- Tests (w.lang.en): 11 sentences read with the expected construction first; the categories' sources exist.
  Not read: "the left of the table" ("left of" is a preposition the tokenizer takes first), "a cup of tea".
- Numbers: w.lang.en hand-grammar +40 wires (2 constructions of clauses, 2 of "of", 4 helpers, 9 categories, 15
  ATTRN words, 1 question production); schema +2 slots. Catalog 28 worlds, 953 shards, vocab 24,578 words. npm test
  2,920: 2,915 pass, 5 skipped, 0 fail.

## 2026-11-14 — first worker: w.lang.ro, a first draft in the library's std.morph notation (block "13:00" item 3)

- **World** (`docs/worlds/w.lang.ro`, generator `tools/lang-ro-core.mjs`, all hand-written, `hand-core 1`, CC0): schema
  (13 types renamed from the library's m.* plus det, pron, prep, numeral, particle; 79 wires) and four shards:
  morphology 401 wires (44 classes: 15 noun, 8 adjective, 21 verb; 341 cells; vowels, 14 folds, the hyphen), irregular
  213 (fi, avea with its conditional and perfect auxiliaries, vrea, da, lua, veni, vedea, împărți; fă, refă, du, mergi,
  treci; the plurals of zi, ou, om, pește, cal, copil, băiat, femeie, pasăre, fereastră, zăpadă; nou), closed 240 (69
  det, 65 pron, 30 prep, 32 numerals, 44 particles), templates 3. 936 wires, 138 kB (14.3 kB gzip), load and morphOf
  80 ms, 0 errors, 0 warnings. A reading of every paradigm found 9 lemmas whose plural stem no class gives (made
  irregular) and 4 with no fitting class (vechi, iarbă, cuvânt, centru: left out).
- **Dictionary:** 255 lemmas in 21 files `dictionary/<folded first letter>.tsv` (lemma, class, gender, sense), sorted by
  folded lemma, header with source and licence; 14.8 kB (36 bytes a lemma). Senses: 41 joined to k.actions verbs (among them
  the app's commands: make.draw, make.add, place.put, place.move, remove.remove, make.make, change.show, change.change,
  change.colour, remove.delete, load.open, change.close, undo.undo), 205 to k.words senses; 9 have none (k.words lacks
  the adjectives italic, horizontal, vertical, bold, numbered, sandy, anterior, thick and the verb thicken).
- **Measured** (`tests/w.lang.ro.test.mjs`): round trip in exact spelling 2,898 / 2,904 cells (every class and cell
  with its first lemma 544 / 544; the 6 others are Q52); through the folds 2,249 / 2,904 (Q51, test marked todo).
  Coverage on PSys2's Romanian commands (`sources/psys2-eval-ro`: 240 messages of art.draw, docs.editor, ui.shell,
  data.charts at dccd3239, 1,191 words, gold lemmas by hand): 99.5% in exact spelling (first reading 99.2%), 92.4%
  through the folds, casual variants 92.2%. A Romanian session loads the 138 kB world once and 4.6 dictionary files
  (3.8 kB) a message. Templates realise "am desenat casă roșie", "mașina este acum galbenă" (no article: Q53).
- **Questions:** Q51 [LIB] (folded suffix index), Q52 [LIB] (optional undo of alternations; two-letter anchored targets;
  deletions), Q53 [LIB] (feature names chosen; articles in templates; variant forms). No external source used, so no
  licence question.
- Also: `k.units.measure` entries for its numbers; README and lessons.
- `npm test` (in a worktree of this commit, after the rebase): 2,929 tests, 2,927 pass, 1 skipped, 1 todo (Q51), 0 fail.

## 2026-11-14 — first worker: the missing English senses in k.words; w.lang.ro fully linked (block "16:10")

- **k.words** (`tools/import/wordnet.mjs`): a list `ASKED` (anterior, bold, horizontal, italic, sandy, thick, thicken,
  vertical) is kept with every part of speech whatever its place in the frequency list; 25 new WordNet senses in 7
  shards (adjectives italic 1, horizontal 1, vertical 1-3, bold 1-3, sandy 1-2, anterior 1-2, thick 1-3; verb thicken
  1-3; the nouns of italic; the chain of kinds on the nouns now that the words are common). `numbered` is no adjective
  in WordNet 3.1 (only the verb *number* 2, "give numbers to"): one hand sense (`HAND_SENSES`, with why) in a shard of
  its own, `hand.sop`, CC0, so no WordNet wire shares its licence; the importer refuses a hand sense of a word WordNet
  has in that part of speech. 322 shards, 32,432 wires, 7,498,386 bytes; the importer stays byte-identical.
- **w.lang.ro:** the 9 lemmas joined: cursiv italic.adjective.1, orizontal horizontal.adjective.1, vertical
  vertical.adjective.1, îngroșat bold.adjective.2 ("clear and distinct; bold handwriting"), numerotat
  numbered.adjective.1, nisipiu sandy.adjective.1 (the colour), anterior anterior.adjective.2 ("earlier in time": PSys2
  says "ecranul anterior"), gros thick.adjective.1, îngroșa thicken.verb.1. 255 of 255 lemmas have a sense; the test
  now requires all.
- Tests: `tests/k.words.test.mjs` (the asked glosses; hand senses CC0 and alone in their shard),
  `tests/import.wordnet.test.mjs` (asked words and hand senses on the fixture; the shards on disk equal the import),
  `tests/w.lang.ro.test.mjs` (no lemma without a sense). `npm test`: 2,931 tests, 2,929 pass, 1 skipped, 1 todo (Q51), 0 fail.

## 2026-11-14 — first worker: k.interest, what makes a fact or a passage interesting (blocks "14:45" item 1, "15:00")

- **World** (`docs/worlds/k.interest`, generator `tools/interest-core.mjs`, `hand-core 1`, CC0): schema (4 types, 61
  wires with the key words) and two shards: `sources` (23 published works: reference, year, DOI where sure, the one
  finding taken) and `features` (4 appraisals, 20 measures, 21 features; 45 wires). 68 shard wires, 26 kB; load 8 ms,
  0 warnings.
- **Format:** a feature = appraisal + measure + shape (rising, falling, peak, step with start_at/peak_at/full_at) +
  weight range + sources + `own` (the numbers are always own choice). Score = novelty x coping x relevance - penalty
  (Silvia 2005/2008: interest needs both a novelty-complexity and a coping appraisal; relevance after Sperber and
  Wilson, Hidi and Renninger, Garner's seductive details; penalties after Grice, Berlyne, Labov). Measures say what
  the library must compute and which types they read: world_distance (joins), sibling_contrast (what most of the
  kind do), rule_exception (k.commonsense), range_distance (typical range), sibling_rank, word_band, known_share
  (Loewenstein, Kang: peak at a half), concreteness, topic_distance, animacy, said_before, same_move_run,
  obviousness, items_without_point, ends_without_point and others.
- **Integration case** (`tests/k.interest.test.mjs`, 5 tests): measured from the catalog by hand and scored by the
  reference arithmetic (`share`, `score`): "a penguin cannot fly" 0.462 (sibling_contrast: most birds that say it can
  fly) > "an elephant weighs about 5,000 kg" 0.400 (far above the interquartile range of animal weights) > "a dog is
  a mammal" -0.400 (obvious); a repeat <= 0; three joins off topic < a third; the order holds at both ends of every
  weight range; each score explained by feature.
- `npm test`: 2,936 tests, 2,934 pass, 1 skipped, 1 todo (Q51), 0 fail.
## Q45 (i) (2026-11-14, second worker): unnamed imported parts say named=no

- The reviewer's block "11:35" item 2 (i). `k.named.labelled.named` takes `enum=no` beside `model` (nobody named it:
  the name is a placeholder). The importers (tools/import/objects.mjs for OpenMoji and Mulberry, noto-emoji.mjs)
  write `named=no` on a part with no name from part-names.tsv; the 21,654 such parts of 291 k.objects shards (the
  reviewer counted 13,920 earlier; the drawings grew) were given it in the importers' key order (after `kind` where
  the model gave one: 7,734), since the raw files of three sources are not in this clone; the import fixtures say so.
- Tests: k.objects.names (every placeholder part and only those say named=no; the TSV test reads `no` for unnamed
  parts); import fixtures (objects, noto).
- k.procedures (first worker's world) read "has `named`" as "has a name": the take-apart method's binding now matches
  `named=model` (tools/procedures-core.mjs, shard from-knowledge regenerated) and its coverage test picks labelled
  drawings by `named=model`; 15 pass, labelled drawings taken apart as before.
- Numbers: 21,654 part wires + ` named=no` in 291 k.objects shards (about +195 kB in all; the size gate holds);
  k.named schema +1 enum value. Catalog 28 worlds, 953 shards, vocab 24,578 words. npm test 2,921: 2,916 pass,
  5 skipped, 0 fail.
- Rebased on w.lang.ro (first worker, 2e6ef36): catalog 29 worlds, 957 shards, vocab 24,581 words; npm test 2,930:
  2,924 pass, 5 skipped, 0 fail (1 todo of w.lang.ro, Q51).
- Rebased again on k.words for w.lang.ro (8d81a16): catalog 29 worlds, 958 shards, vocab 24,586 words; npm test
  2,932: 2,926 pass, 5 skipped, 0 fail.
- Rebased on k.interest (first worker, 5e39ba0): 30 worlds, 960 shards, vocab 24,661 words. Pushed after the build
  and the 10 test files that read generated files or k.objects / k.procedures (57 pass, 0 fail): three full runs
  in a row were overtaken by pushes of the other worker; the full run follows the push.

## Reviewer 16:30 (2026-11-14, second worker): sopworld 0.63.0 and the 10 drawing joins declared

- Build moved from 0.56.0 (1d1c3c6, the first worker's) to the library's current release 0.63.0 (b89215e, build
  1d09dbca9e71, sha256 326fa339...): VERSION, README, docs/index.html, docs/worlds/README.md, w.lang.en WORLD.md, the
  version test. validate: 990 files, 0 errors, 0 warnings.
- `type=k.objects.object by=name` on the 10 `drawing` slots of k.animals, k.body, k.food, k.people (2), k.scenes (2),
  k.space (2), k.wearables; not on the stand-ins of k.objects (their objects are in other shards of the same world,
  and a stand-in shard told between object shards would be refused). `fullWorld` of k.objects (its imports' animals
  and foods first), k.animals, k.scenes, k.people, k.wearables: loaded, 0 open joins by `check()`. The shared-modules
  test stays as the second check.
- Found: 0.60's deferred check keeps a join open only while no object is loaded at all; a reference told after one
  object shard and before its own is refused (a three-line test with the 0.63 build). Q49; docs/worlds/README.md
  tells hosts the order.
- Checked before the push: the 8 test files of the build, the catalog and the joining worlds pass (catalog and derived
  were killed for memory when run in parallel beside two other workers' suites; alone 8 and 4 pass). The full run
  follows the push.
## 2026-11-14 — third worker: k.genres, document types as structure, moves and register (blocks "15:00" item 1, "17:05")

- **World** (`docs/worlds/k.genres`, generator `tools/genres-core.mjs`, `hand-core 1`, CC0): schema (6 types: source,
  move, register, genre, part, step) and eight shards: `sources` (24 works), `moves` (43 rhetorical moves with what a
  composer fills each with: fact, facts, outline, question, story, topic, none), `registers` (5), and one per genre
  (`scientific-article`, `presentation`, `essay`, `story`, `report`): 26 parts in order with counts, 72 steps.
  160 shard wires, 51 kB; 0 warnings.
- **Format:** a genre = parts in order (`n`, `min`..`max` times; `heading`, slide `layout`, `tense` override) and per
  part steps in order (`n`, a `move`, `min`..`max` sentences; several steps at one `n` are alternatives: CARS Move 2
  indicate a gap / raise a question / counter-claim); a register per genre: person (+ also), tense, passive, sentence
  length min/typical/max in words, sentences per paragraph, vocabulary band 1-5, formality, and booleans for
  contractions, hedging, citations, units, definitions, direct speech, questions. The names are those w.document
  (first worker) uses for `genre`, `register`, `part` and sentence `move`.
- **Sources:** IMRaD (Sollaci and Pereira 2004; APA 2020), Swales' CARS (1990, 2004), Hyland's abstract moves (2000),
  hedging (1998), metadiscourse (2005) and essay stages (1990), Toulmin (1958), Yang and Allison (2003), Swales and
  Feak (2012), Alley (2013), Alley and Neeley (2005), Mayer (2009), Cowan (2001), ANSI/NISO Z39.18, Labov and
  Waletzky (1967), Freytag (1863), Aristotle, Mandler and Johnson (1977), Stein and Glenn (1979), Biber and Conrad
  (2009), Flesch (1948), Cutts (2013). Every number is marked `own`.
- **Integration case** (`tests/k.genres.test.mjs`, 7 tests): hand-traced shortest outline per genre; 1,000 seeded
  outlines per genre all satisfy the structure (parts in order within counts, every required place made, sentences
  within counts); distinct outlines of 1,000: scientific article 1,000, presentation 999, essay 981, story 589,
  report 687. Reference reading `outline(facts, genre, rnd)` (twenty lines).

## 2026-11-14 — third worker: k.story, how a story is built (blocks "15:00" item 2, "17:05")

- **World** (`docs/worlds/k.story`, generator `tools/story-core.mjs`, `hand-core 1`, CC0): schema (5 types: source,
  element, goal, obstacle, constraint) and three shards: `sources` (12 works), `structure` (11 elements in the order
  told, each with its part and move of the story genre of k.genres, the types that fill it, its Propp function, story
  grammar node and place in Freytag's arc; 21 constraints, 18 hard and 3 soft), `goals-obstacles` (4 goals as acts of
  k.actions; 16 obstacles: a k.scenes thing as it blocks one goal, how, the acts that get past it, their tools as the
  means, the acts tried in vain). 64 shard wires, 27 kB; 0 warnings.
- **Nothing invented but the structure:** characters are k.people kinds and roles and k.animals; places k.scenes
  scenes; obstacles k.scenes things with k.objects drawings; means tools of k.actions acts with drawings; helpers the
  roles whose holds/uses have the means (sailor, cowboy, firefighter, builder, carpenter, knight, king, prince,
  pirate). Constraints: the protagonist can reach the goal (who of its act up the chain of kinds), the target fits
  the goal, the obstacle blocks the goal, the setting has it, the protagonist lacks the means, the helper has it,
  1-3 attempts that fail, the helper before the turning point, the turning point gives the means, the resolution
  uses it (Chekhov), the ending reaches the goal; soft: protagonist, helper and target belong in the setting.
- **Sources:** Propp (1928/1968), Rumelhart (1975), Mandler and Johnson (1977), Stein and Glenn (1979), Thorndyke
  (1977), Trabasso and van den Broek (1985), Freytag (1863), Field (1979), Labov and Waletzky (1967), Olrik (1909),
  Chekhov (1889), Aristotle. Own choices marked `own`.
- **Integration case** (`tests/k.story.test.mjs`, 5 tests): every reference resolves; two hand-traced plans hold every
  hard constraint (a girl, the castle's dragon, the knight's sword; a boy, the river, the sailor's sailboat), broken
  plans are refused by the constraint they break; **642,752 plans** over the catalog hold every hard constraint;
  1,000 sampled (seeded) and checked again from the facts: 0 broken; uniform samples hold each soft constraint in
  only 1-2 of 100 (a composer weights). Reference reading: `storyKb`, `storyPlans`, `checkPlan`.
- **Corpus check** (`tests/k.story.corpus.test.mjs`, TinyStories 1,000 stories, CDLA-Sharing-1.0, read in place from
  PSys2's data/external, not copied): setting before complication in 571/605 stories, complication before resolution
  in 130/139 (94% each).

## 2026-11-14 — third worker: k.genres checked against 2,000 arXiv abstracts (reviewer 19:00 [DATA])

- `tests/k.genres.corpus.test.mjs` reads `arxiv-metadata/abstracts-2000.jsonl` (CC0) in place from PSys2's
  data/external (nothing copied; skipped where absent) and finds the abstract's moves by surface cues per sentence:
  purpose in 1,353, method 804, result 1,050, introduction 590, conclusion 174 abstracts; purpose before result
  674/756 (89%), result before conclusion 95/109 (87%), introduction before purpose 281/395 (71%, weak cue); "we" or
  "our" in 1,732/2,000 (the register's first plural); mean sentence 23.7 words (register typical 22), 78% within its
  12-32. The test also checks that the abstract steps of k.genres are in the order measured. WORLD.md says it.
- The move and register names of k.genres are final from this side (the fourth worker's Q55 asked).
