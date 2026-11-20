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


## 2026-11-14 — first worker: w.document, a written document as a world schema (block "15:15" item 1)

- **Schema** (`docs/worlds/w.document/schema.sop`, std.schema format, `hand-core 1`, CC0): document (title, genre,
  topic, register, language, seed, about), chapter, section, paragraph (in a section or straight in a chapter),
  slide (headline, layout title/agenda/content/summary/closing, part, speaker note), sentence (text, in a paragraph
  or on a slide, n, move, template, `fact` many: the wire ids of the facts it states, interest 0-1). Two denies (one
  place for a paragraph and for a sentence), limits, words for the world, kinds and keys; no function. Loads with
  std.acts with 0 errors and 0 warnings.
- **Integration case** (`tests/w.document.test.mjs`, 3 tests): an essay on the penguin made by acts with three
  sentences whose `fact` ids are checked against every wire of the catalog and read back in order; a presentation of
  four slides with a bullet; the two denies refuse with their reasons; place 0, an unknown layout and interest 2 are
  refused. `tests/w.schemas.test.mjs` now expects six schemas. k.interest's sentence and passage measures read
  w.document.sentence and w.document.paragraph.
- `npm test`: 2,939 tests, 2,937 pass, 1 skipped, 1 todo (Q51), 0 fail (one earlier run caught COVERAGE.md stale:
  `npm run reports` after adding a world).
## 2026-11-14 — third worker: k.story checked against tales annotated by hand (block "19:45")

- `sources/story-check/` (CC0 annotations, no story text): 40 public-domain tales of PSys2's `tales-pd` (every 4th
  Grimm, every 4th Andersen, every 14th Aesop; fables read whole, long tales from their opening and well-known plot)
  and 40 TinyStories (every 25th), annotated by hand with k.story's elements and constraints; `SOURCE.md` gives the
  fields and the rule. `tests/k.story.check.test.mjs` prints both columns.
- Tales / TinyStories: obstacle blocks the goal 33/33 / 25/26; failed attempts 23/33 / 14/26, never more than three;
  a helper 13/33 (12 of 15 Grimm, 1 of 19 Aesop) / 15/26; the helper has what is missing 12/13 / 15/17; the
  protagonist lacks it 13/13 / 16/17; resolution 19/33 / 19/26; set-up used by the resolution 13/20 / 3/21; goal
  reached 17/33 / 19/26; goal told before the obstacle 18/33 / 20/26.
- Decisions: kept hard what holds in nine in ten tales (blocks, at most three attempts, helper has it, protagonist
  lacks it); attempts, helper, means, turning point and resolution made optional (min 0, the numbers in `own`);
  "the ending reaches the goal" made soft (now 17 hard, 4 soft); goal and obstacle stay unordered by any constraint.
  No new goals, obstacles or helpers (those of the tales map to kinds k.story already uses). TinyStories adds nothing
  over the tales (close on every measure but set-up, 3/21): it can be dropped. Plans over the catalog: still
  642,752; the reference reader allows stories without attempts.

## Block 17:05 task 1 (2026-11-14, fourth worker): act generation templates in w.lang.en

- **Format** (`w.lang.en.template`, schema section "generation"): `name`, `act`, `shape`, `mode`, `attribute`, `role`
  (many), `frame` (many), `needs`, `text`, `example`; `text` in the library's template notation (std.morph
  `realise`: `{role}`, `{role:num=pl}`), so `morphOf(world, { types: { template: 'w.lang.en.template' } })` and
  `templateFor(act, shape)` read it. Slots are the roles of k.actions (`kind`, `thing`, `place`, `value`, ...); a
  `thing` is filled with the host's referring expression ("the house", "table 1"), a `place` with relation + thing.
  `shape` = the roles in k.actions order, then the mode, then a fixed attribute (`kind.value.name`), unique per act.
- **Shard** `templates-acts` (hand-written, CC0): 34 templates for all 16 acts (make 7, change 5, ask 4, place 3,
  remove 2, send 2, undo 2, one each for connect, group, take apart, pick, deselect, copy, redo, save, load); the
  article forms (`w.lang.en.det before=vowel|consonant`) and 19 onsets (an hour, a unicorn, a European). 55 wires,
  11.0 kB, load 66 ms, 0 warnings. `hand-joins`: 2 `w.lang.en.mode_map` (frame group/apart is the act take apart,
  pick/none is deselect).
- **Read back** (`tests/w.lang.en.templates.test.mjs`, 4 tests): every template, realised with two filler sets (68
  sentences), is read by w.lang.en's frames (reference reader `frameReader` in `tools/lib/lang-en.mjs`: the frames
  a general world meets plus the template's `needs`; priority, literal words, fewer captured words) to the same act,
  mode and roles; a kind's noun phrase is split by w.lang.en's productions with k.words ("3 red tables": kind table,
  value red). `realiseEn`: plural by w.lang.en's inflection, `a`/`an` by onset. 28 of the 56 k.actions roles have
  no template because no general frame reads them (listed in WORLD.md).
- Found: acts.change.add1 / less1 do not read their own examples ("Add a seat to table 1": no determiner before the
  attribute); "take the tables apart" reads as a move apart where the direction frames apply; "red house" also parses
  as a noun compound (a host takes the reading with most modifiers). Q54 ([LIB]): how std.morph `realise` should give
  English plurals and the article.
- The no-notation test of w.lang.en exempts `text` of templates (the library's notation, asked for by the reviewer).

## Block 17:05 task 2 (2026-11-14, fourth worker): discourse templates per move and register in w.lang.en

- **Format**: `w.lang.en.discourse` (`name`, `move` a k.genres move name, `register` scientific / presentation /
  essay / narrative / report, `slot` many, `text` in the library's notation) and `w.lang.en.slot` (`name`, `about`
  what fills it, `element` the k.story element for a story slot). Several templates of one move and register are
  alternatives for std.compose.
- **Shard** `templates-discourse` (written by `tools/lang-en-discourse.mjs` from one hand table, CC0): 116 templates
  (scientific 30, presentation 21, essay 23, narrative 26, report 16) of 43 moves, 35 slots; 151 wires, 33.8 kB,
  load 96 ms, 0 warnings. The seven moves of block 14:45 (introduce topic, compare, surprising fact, give example,
  raise a question, conclude, transition) in all five registers; the story moves (set the scene, introduce
  character, state goal, complicate, attempt, turning point, resolve, evaluate, end) in the narrative register;
  every move of every k.genres genre in its register.
- **Move names**: those of k.genres (third worker, published in 366975e while this was written, read from its
  facts): "raise a question", "give example", "introduce character" + "state goal", "complicate", "resolve"; the test
  also checks every genre's steps and also_move in its register.
- **Tests** (3 new in tests/w.lang.en.templates.test.mjs): moves and registers known, slots declared and used, story
  slots are k.story elements; coverage; register kept by the words outside the slots (persons by the pronouns'
  person and number, no direct question where the register has none, no contraction where it has none, no present
  verb in a narrative) and filled sentences no longer than the register's sentence_max. The no-notation test of
  w.lang.en treats `about` as prose.

## Block 17:05 task 3 (2026-11-14, fourth worker): typical ranges and typicality in k.attributes

- **`k.attributes.range`** (identity type, key, kind; low, high, median, count, basis catalog / source / own, cite,
  own): 56 ranges over 34 kinds. 41 computed from the catalog by `tools/ranges-core.mjs` (interquartile range and
  median of at least 8 numbers, the quartile rule of k.interest's test): size of 13 kinds of common things, weight of
  11, speed of 2, each also for mammals and birds (k.animals class); length of body parts; k.geo population of
  countries and cities (Natural Earth, public domain; the GeoNames populations, CC BY, left out), elevation of
  mountains, length of rivers, area of lakes, seas, deserts; the area of countries from ODbL numbers in a shard of
  its own (`ranges-odbl`, ODbL-1.0). 7 sourced: heights of men, women, persons (NCD-RisC 2016, eLife 5:e13410),
  babies, children, boys, girls (WHO Child Growth Standards 2006; de Onis et al. 2007). 4 own: house 5-12 m, skyscraper
  150-350 m (from CTBUH's storey height and classes), table seats 4-10, list item quantity 1-6.
- **`k.attributes.typical`** (identity of, attribute; weight in (0, 1], own choice): 143 facts over 35 kinds and types:
  18 kinds of common things (drawings), all 12 kinds of the world schemas w.seating, w.map, w.list, w.timeline, w.face
  (face parts through w.face.part), 5 types of k.geo (country, city, river, mountain, lake). Not in `usage`: Q56.
- Shards: ranges 51 wires 12.7 kB, ranges-odbl 1 wire, typical 143 wires 18.5 kB; load 21 / 8 / 17 ms, 0 warnings.
  k.units.measure: the range's low, high, median are in the unit of its type and key, count counts numbers, weight is
  a plain share (tools/measures-core.mjs). Schema +2 types, key words by tools/key-words.mjs.
- Tests (`tests/k.attributes.ranges.test.mjs`, 5): the shards are the tool's output; every range names numbers that
  exist with a unit, a known kind, low < median < high, a basis with cite / own; the animal weight range is the
  quartiles of the animals' weights, an elephant (5,000 kg) is more than 10 widths above it, a dog inside, a man of
  2.72 m far from the men's range; every typicality names a kind and attribute or a type and key; coverage of the
  kinds std.sample hits (schema kinds all; 18 of 26 k.attributes kinds; ranges for geo, people, tables, list items).
- **Wikidata** (landed at 19:20, CC0, read from psys2 data/external/wikidata-typical-numbers, copied to the git-ignored
  sources/wikidata-typical/raw, SOURCE.md written): 10,878 rows read; 4 ranges written (shard ranges-wikidata, 4
  wires, 2.1 kB, basis=source, identity now includes `basis`): species mass (1,405 items) and length (288), building
  height (1,435), country area (210). Not used, with reasons in SOURCE.md: heights, lifespans and speeds of taxa,
  structures, city population/area/elevation (no keys; Natural Earth's populations kept), country population and
  elevation (23 and 7 items), exoplanets. No per-item values imported per block 19:35: 5 of 314 k.animals match.
  A session loads ranges (12.7 kB) and ranges-wikidata (2.1 kB) only when a number's interest is scored.
- Full run after the push: 2,920 tests, 2,912 pass, 5 skipped; tests/catalog.test.mjs and tests/coverage.test.mjs
  killed (SIGKILL). The shell of this session now runs in a memory cgroup of about 1.6 GB (dmesg: "Memory cgroup out
  of memory"); coverage.test.mjs loads the k.objects world twice (1.3 GB each, the same on 0.56 and 0.63: measured)
  and is killed even alone, on the commit before the move as well (a worktree at 633afae); catalog alone: 8 pass.

## Q45 (iii) (2026-11-14, second worker): "about" marks the topic of make

- `tools/acts-core.mjs`: the act make has a role `topic` (holds a thing, "what the new thing is about") marked by
  `about` (a story about a dragon, a chart about sales); `k.actions/shards/acts` 56 -> 57 roles. In w.lang.en,
  `about` was already a preposition with `role=topic`, so the existing join test (every marker of k.actions is a
  preposition of w.lang.en) now covers it; a test says both.
- Full run of this commit's tree before a restart: 2,908 tests, 2,898 pass, 5 skipped, 4 files killed by the shared
  memory limit (catalog, coverage, derived, k.attributes; no assertion failed); rerun after the rebase below.
- Rebased on k.genres, k.story and four reviewer blocks: catalog 32 worlds, 971 shards, vocab 24,811 words. Serial
  run (one file at a time): 2,931 tests, 2,922 pass, 5 skipped, 3 files killed by the shared memory limit; alone:
  derived 4 pass, k.attributes 11 pass, catalog 8 pass (second try). No assertion failed.
- Rebased on the first worker's k.attributes ranges and w.lang.en templates (4448b9e): catalog 32 worlds, 977 shards,
  vocab 24,837 words. npm test, one file at a time: 2,970 tests, 2,964 pass, 0 fail.

## Lessons (2026-11-14, second worker)

- docs/lessons.md: a section for Q41, block 07:40 and block 06:55 (nine lessons). Only docs/lessons.md and this log
  change; no test reads them, and the full run (2,970 tests, 2,964 pass, 0 fail) was on the tree just before.
## 2026-11-14 — third worker: compositions in k.procedures, choice points as data (blocks "15:00" item 3, "17:05")

- **Methods** (shard `k.procedures/shards/compose`, 5 methods, 236 wires, 47 kB, all in `w.document`): write a story
  (every element of k.story a binding of its name, chosen together under k.story's constraints: goal, goal_act,
  obstacle, setting, means, resolution, helper, protagonist, attempt 0-3 (counts read from k.story), target; then
  the document and one chapter per part of the story genre); write a presentation (3-5 points read from k.genres:
  statements about the topic on different keys; title, agenda, summary, closing and one content slide per point); an
  essay (2-4 arguments, a counterargument on another key); a scientific article (2-5 results; methods = their
  types; the required IMRaD chapters); a report (1-6 acts of the history, 1-4 things there, 1-3 acts not yet done).
  Plus words for the four new task names. 28 methods in all.
- **Format addition proposed** (questions.md Q57 [LIB], six optional keys, schema of k.procedures updated, 0 warnings):
  `binding.choose`, `binding.choose_min` (number or binding), `binding.about` (statements about a thing),
  `match.differs`, `match.soft`, `match.n`. Existing facts unchanged.
- **Reference reader** `tools/lib/choose.mjs` (160 lines, to delete when std.plan reads `choose`): joint
  depth-first solving in a seeded weighted order; the chosen values go to std.plan as value bindings (`fixChoices`),
  so the acts come from the one planner. `tests/k.procedures.test.mjs` counts `about` as a source and finds the
  compose methods' goals in `tests/k.compose.test.mjs`.
- **Tests** (`tests/k.compose.test.mjs`, 6): every genre, part, count and binding named exists; the hand-traced story
  (girl, castle, dragon, knight, sword, shout and hide, friend) is a solution, holds k.story's constraints and expands
  to `make document title=friend genre=story register=narrative` and five chapters; a knight protagonist or a beach
  setting has no solution; 100 seeded stories each hold every hard constraint of k.story (4 goals, 7 obstacles, 63
  protagonists, 8 helpers); the presentation about penguins (class, legs, covering, habitat, diet) and its ten slides;
  20 seeded presentations, essays and articles keep keys apart; a report's next steps are acts not yet done, and no
  report without a history.

## 2026-11-14 — third worker: the topical compositions take the role topic of make (reviewer 21:55 follow-up)

- `tools/procedures-core.mjs`: write a presentation / an essay / a scientific article about a topic take the topic in
  the goal role `topic` of make (marked by about, 53b002b), needed, instead of `value`; their binding `topic` reads
  it. Write a story takes an optional `topic` ("tell me a story about a dragon"), preferred by soft matches (Q57) as
  the obstacle, setting, helper, protagonist or target; a hard "one of them is the topic" is a disjunction the format
  cannot say. Without a topic the seeded stories are the same as before (a soft match on an empty binding weighs 1).
- `k.procedures/shards/compose`: 236 -> 243 wires, 48,532 bytes; 28 methods. `tests/k.compose.test.mjs` 6 -> 8:
  the four methods' goals (topic needed for three, optional for the story; a goal that still says value gets no
  presentation), and the dragon is an element of 10 of 40 seeded stories with the topic, 7 without (x2 weight only).
- Catalog 32 worlds, 978 shards, vocab 24,876 words. Tests run one file at a time: k.compose 8/8, k.procedures 15/15,
  k.genres 7, k.interest 5, k.story 5, w.document 3, catalog 8, validate 5; 0 fail.



## Block 20:15 (2026-11-14, fourth worker): w.lang.en frame for the named add with a place verb (from PSys2)

- `shards/hand-frames.sop` (new, hand-written, CC0): `acts.make.name.place.p` (act make, priority 15, needs in): a
  place verb, the thing, called/named, the name as words, a preposition, the place. "Put a guest named Maria at table
  1." now reads kind guest, value Maria, place at table 1 (acts.make.name.p, priority 14, read the name as "Maria At
  Table 1"); "Place a guest named Ann." still reads by acts.make.name.p. 10 wires, 2.1 kB. Test in
  tests/w.lang.en.templates.test.mjs (two sentences and the one without a place). PSys2 can drop its local
  patterns.extra.sop copy.



## 2026-11-14 — first worker: the register of words in k.words (block "15:15" item 2; data of block "19:00")

- **usage** on a sense, from WordNet's usage-domain pointers (`;u` to colloquialism, slang, archaism, formality,
  euphemism, disparagement): informal 115, slang 33, archaic 14, euphemism 7, formal 1, disparaging 1 (171 marks on 170 of the
  kept senses; the other usage domains, trade name, plural, combining form, are not registers). WordNet's licence, in the
  WordNet shards (93 shards changed).
- **k.words.frequency** (new type, module version 3): `zipf` (the word's Zipf value in wordfreq 3.1.1's merged English
  list, read from psys2 `data/external/wordfreq-en` at a7b34da3, copied to `sources/wordfreq/raw`) and `band` computed
  from it (1 very common Zipf >= 6, 2 common >= 5, 3 familiar >= 4, 4 uncommon >= 3, 5 rare): 11,278 words with
  senses here (62, 828, 3,800, 5,790, 798). 26 shards `frequency-<letter>.sop`, 1.18 MB, CC BY-SA 4.0 with wordfreq's
  attributions (`sources/wordfreq/SOURCE.md`); no WordNet shard changes its terms. Rows read 50,000; facts written
  11,278. A session that asks about a word loads its letter's shard (45 kB on average).
- Joins: every k.genres register's `vocabulary_band` is a band k.words gives, with at least 800 words up to it;
  k.interest's `word_band` and `share_beyond_band` now read k.words.frequency.
- k.words: 348 shards, 43,710 wires, 8,676,705 bytes. Tests: tests/import.wordnet.test.mjs (usage and frequency on
  the fixture; shards on disk equal the import), tests/k.words.test.mjs (bands computed from Zipf, CC BY-SA, every
  banded word has a sense, the k.genres join).

## 2026-11-14 — third worker: k.kinds, the up edges of the catalog with several parents (reviewer 21:55)

- New type `k.kinds.parent name= is_a= dimension= from= key= value= group=` (k.kinds version 2, exports kind and
  parent): one up edge per fact, with the fact it is read from and that fact's source. Generated by
  `tools/kinds-core.mjs` (added to `npm run build` before the catalog), nothing typed per thing. Dimensions: `kind`
  (k.animals class, k.attributes kind, k.food / k.body / k.space / k.wearables kind, k.people role is and group; the
  WordNet hypernyms of the name's sense in k.words and the chain above; the group a drawing's source filed it in; the
  head of a name of several words), `place` (habitat), `feature` (legs, covering, wheels, an engine or motor: a
  machine, wings), `use` (used_for, worn_on), `material`, `diet`. The kinds made here (farm animal, thing with wheels,
  road vehicle) get parents of their own (shard `classes`). The `is_a` of k.commonsense, k.people and k.shapes stay in
  their worlds (not copied); the report counts them.
- Owner's examples: cow -> mammal, cattle (WordNet), animal (k.attributes), farm animal (place), animal with legs,
  animal with hair (feature), herbivore (diet); car -> vehicle, motor vehicle (WordNet), machine (k.parts: automobile
  engine), thing with wheels (wheels=4), thing for travelling, thing made of metal.
- Numbers: 8,389 edges over 3,776 names, 15 shards, 1,456,534 bytes (largest `kind` 1,503 wires / 216 kB); per
  dimension kind 5,961, place 484, feature 641, use 564, material 455, diet 284. Licences kept: `wordnet-1/2`,
  `feature-wordnet` WordNet-3.0; `group-noto` Apache-2.0 AND Unicode-3.0; `group-mulberry`, `group-openmoji`
  CC-BY-SA-4.0; the rest CC0 (hand-core and the CC0 psys2-worlds facts). Loads with 0 errors, 0 warnings (1.3 s).
- Report (`docs/worlds/k.kinds/PARENTS.md`, generated): of 2,769 things of the catalog, 935 have parents on two or more
  dimensions, 761 several parents on one, 1,009 one parent, 64 none. None: emoji names that are no word and whose
  group names no kind (cloud with lightning and rain, hourglass done, globe showing Americas, speaker high volume),
  three shapes (arrow, cross, egg shape). One parent where a second is plain: 919 drawings with only a group kind or a
  head (a k.attributes class or the WordNet sense of a Mulberry name's head would be the second); 21 shapes with only
  their WordNet sense (k.shapes says no is_a); 37 foods whose k.food kind and WordNet hypernym are the same word
  (beef: meat; the plain second is where it comes from or grows, k.food comes_from / grows_on, not taken yet); 9 body
  parts (the second is what they are part of, a part-of edge not taken); 5 named space bodies (their system).
- Decisions: the WordNet sense of a name is the first noun sense under the root of the catalog's sense of it (animal,
  food, person, body part, thing...); a chain word's edge is kept only where that word's sense has that parent (the
  chain of "carriage", a railway car, made "car" a wheeled vehicle before the check); wheels are the wheels a thing
  runs on (not a clock's balance wheel). Head of a name: a sample of 100 had 6 wrong (teddy bear, Komodo dragon,
  carousel horse...), now an exception list; Mulberry names (qualifier last: "chair computer") get no head edge.
  Names are words: two senses of one name share a node (bat), left to the schemas' filters.
- Tests `tests/k.kinds.test.mjs` (6): byte-identical regeneration of shards and report; the examples; every edge's
  fact exists (7,000+ checked); licences per shard; every made parent has a parent and a cow reaches animal,
  vertebrate and bovid in 3 layers; siblings down again (cow on place: 17 farm animals; on diet 77 herbivores; car:
  33 things with wheels, 35 machines).
- Full run, one file at a time (61 files): 2,960 pass, 0 fail but catalog (index rebuilt after, rerun below) and
  k.wearables (SIGKILL, memory; rerun alone below).
- Rerun alone: catalog 8/8, k.wearables 4/4, k.kinds 6/6.

## 2026-11-14 — third worker: act families in k.actions (reviewer 21:55)

- New types `k.actions.family name= dimension= about= parent=` and `k.actions.member act= family= why=` (exports family,
  member); shard `k.actions/shards/families` (52 wires, 9,892 bytes), written by `tools/acts-core.mjs`.
- What it does (`dimension=does`, 15 families in three layers): creation (make, copy) and destruction (remove) under
  existence; change of a value (change); change of place (place, send); joining (connect, group) and separating (take
  apart) under structure (the grouping acts); all four under change of the world. Question (ask) and view (pick,
  deselect) under no change of things; history (undo, redo) and keeping (save, load, send) under the work itself.
  17 memberships, each with its reason; send is in two families. Keeping is a family the reviewer's list does not
  name (save and load are neither history nor a change of the things).
- What it needs (`dimension=takes`, read off the needed roles, not by hand): acts on a kind (make), acts on a thing
  (10 acts), acts that need no filler (ask, undo, redo, save, deselect): a cousin can swap the act and keep the filler.
- Tests `tests/k.actions.families.test.mjs` (5): byte-identical shard; every act in a `does` family and one `takes`
  family, every family and parent exists, each reason given; every family reaches a root in at most 3 layers, no
  cycle; opposites are siblings or cousins under one parent; the `takes` families follow the roles.
- Tests one file at a time: k.actions.families 5, k.actions.acts 8, k.actions 4, validate 5, w.lang.en 21,
  templates 8, k.procedures 15, joins 3, questions 424, shared-modules 5, ask-real 4, catalog 8 (alone after a
  SIGKILL); 0 fail. Catalog 32 worlds, 1,021 shards.

## Block 21:20 task 1 (2026-11-14, second worker): `w.chart` published

- `docs/worlds/w.chart/` (schema.sop 41 wires, 6.2 kB, WORLD.md): a world schema in the `std.schema` format, no rule
  and no function: `w.chart.chart` (title, `form` = bar / line / pie / scatter / area, default bar; x_label, y_label,
  unit), `w.chart.series` (name, chart, colour, n), `w.chart.point` (category, value required number, series, n);
  acts make, remove, change, pick, ask, copy (no copy on values); limits 20 charts, 100 series, 2,000 values; words
  for the world, its kinds and every key (three key words added to the draft: the build refused `series.chart`,
  `series.n`, `point.series` without a word). The chart's type key is `form`, not `kind` (an argument of `make`).
- Catalog: `index.json` lists 7 schemas (w.chart added); vocab 24,852 words ("bar chart", "pie chart", "line graph"
  lead to w.chart/schema.sop). 0 of the 1,500 common things lead to it, so COVERAGE.md is unchanged (checked with
  the coverage list alone; `npm run reports` is killed by the memory limit, as the fourth worker logged).
- `k.procedures`: the second method of "a chart of the things there" (Q45 item 2), `world=w.chart`: count the things of
  each kind, make a bar chart titled chart, a series named count, one value per kind with its count. 24 methods
  (29 with the five compositions of the third worker; tasks shard 145 wires, 27.2 kB); WORLD.md's known limit "no w.chart" removed.
- Tests: `tests/w.schemas.test.mjs` (seven schemas; found by "bar chart", "pie chart", "line graph"; a session: make a
  bar chart, a series and three values, change the form to line, refuse "donut", change and ask a value, pick by
  category, refuse a value "many", remove) 14 pass; `tests/k.procedures.test.mjs` (the chart in w.chart expanded by
  std.plan to the expected five acts) 15 pass; k.interest 5, page 2, catalog 8 pass.
- Full run of this commit before the last rebase (one file at a time, `/home/claude/w2tools/runall.sh` in a worktree):
  2,979 tests, 2,974 pass, 5 skipped, 0 fail, no file killed (15 minutes). Rebased on k.words register (fa8a629): catalog 32 worlds, 1,005 shards,
  vocab 24,894 words; then on k.kinds up edges and k.actions families (a523fa4): 1,021 shards, vocab 25,713 words; catalog 8, w.schemas 14, k.procedures 15 pass after the rebase.


## 2026-11-14 — first worker: w.lang.ro on sopworld 0.63: no exceptions left, the article in the templates (block "16:50")

- The pin is already ≥0.63 (second worker, 7be89c8). The Q52 exception list (uriaș, englez, îngroșa) and the Q51 todo
  are gone from tests/w.lang.ro.test.mjs: round trip 2,916 / 2,916 cells in exact spelling and 2,916 / 2,916 typed
  without diacritics (were 2,898 / 2,904 and 2,249 / 2,904); every class and cell with its first lemma 556 / 556.
- The indefinite article: a class `det.art` (extends a.inv, every form irregular: un, o, niște; unui, unei, unor) and
  the lemma `un` in the dictionary (256 lemmas; the article needs no sense). The make template is
  `am desenat {art@kind} {kind:...} {colour@kind}`: "am desenat o casă roșie", "am desenat un copac verde", "am desenat
  un desen albastru"; "am șters steaua", "mașina este acum galbenă" as before (the definite article is a noun cell).
- Re-measured on PSys2's 240 Romanian commands: exact spelling 99.5% (first reading 99.2%), through the folds 99.7%,
  the casual variants typed without diacritics 99.7% (1,163 of 1,167; was 92.2%).
- w.lang.ro: 949 wires (morphology 402, irregular 225, closed 240, templates 3, schema 79). Tests 9 / 9.

## 2026-11-14 — first worker: w.lang.ro, a dictionary derived from UniMorph (blocks "18:20" item 2 and item 3, "19:35")

- **Import** (`tools/lang-ro-unimorph.mjs`; `sources/unimorph-ron`, CC BY-SA 3.0, psys2 ea2b29e7, copied to the
  git-ignored raw folder): 84,679 rows read, 4,388 lemma and part-of-speech pairs. Each lemma goes to the paradigm class
  whose generated forms contain every comparable UniMorph form (at least 3), compared as sets of forms because the
  file's noun labels are wrong in places (casa labelled plural; "niște case" singular); article words, să, a and the
  vocative, past tenses, gerund and negative imperative left out; label noise ("definite articulation") dropped.
- **Result:** a class fits 3,612 (82%: nouns 2,012 / 2,308, verbs 951 / 1,205, adjectives 649 / 875; 1,339 with a second
  class generating the same forms, the fewest extra forms then the first class win); none for 753 (alternations no
  class has yet: sc > șt, ea > e; irregulars; noise), 23 with fewer than 3 forms. The hand class fits for 144 of the 156
  lemmas both have (92%). 3,466 rows written (hand lemmas left out: the hand row wins), lemma + class + gender, empty
  sense; `docs/worlds/w.lang.ro/dictionary-unimorph/` 23 files, 67.7 kB, CC-BY-SA-3.0 headers; no form stored.
- **Re-measured** (`tools/lang-ro-coverage.mjs`, PSys2's ro-en-meaning rows at a4357c2e read in place; a word counts
  when some reading exists): hand Romanian 28,752 words, 75.6% read with the hand dictionary, 81.7% with UniMorph
  added; machine Romanian 17,855 words, 51.8% and 59.8%. Meaning-kept needs the frames layer (18:20 item 1, not done).
- Tests: tests/w.lang.ro.test.mjs 10 / 10 (the derived folder: licence, classes exist, genders follow the class, no
  hand lemma, no sense guessed; files equal the tool's output when the raw file is here; fit >= 75%, agreement >= 90%;
  derived lemmas read back with both dictionaries).

## 2026-11-14 — third worker: alternations of w.lang.en as facts (reviewer 21:55; the library's Q54 item 2)

- New types in w.lang.en: `w.lang.en.alternation name= n= family= from= to= mode=` (the library's format, with the
  order `n` and the family), `w.lang.en.alternation_family name= about= parent=`, `w.lang.en.alternation_case text=
  canonical= applied= mode=`. Shard `w.lang.en/shards/alternations` (tools/lang-en-alternations.mjs): 368 rules in
  11 families under 5 parents (request wrapper: polite word 3, ability question 4, desire 7, suggestion 3, sequence
  lead 3; question form: question vs command 55, embedded question 41, wh in situ 42; voice: passive 144; argument
  order: dative shift 57; context: ellipsis 9), 17 families and 35 test sentences; 420 wires, 82,424 bytes.
- `from` / `to` in the library's pattern notation (words and `{x}` spans) without `[a|b]` (hard rule 3): each
  alternative a fact, generated from tables. The passive is one rule per participle of 24 common verbs (a span for the
  verb read "the cat is sitting by the door" as a passive); the dative shift covers pronoun recipients only and not
  tell / show ("tell me the capital of Japan" asks); the canonical form is the one the frames use (send X to Y).
- Checks: the 35 sentences come back to their canonical forms with the rules named, by a copy of the library's 0.75
  reading in the test (the pin, 0.63, has no `normalise`; delete the copy at the next pin) and, once, by the
  library's own `normalise` from its source (35 of 35). Canonical forms are fixpoints. Of the 352 frame examples, 17
  are changed by an alternation (12 with "please", "Draw me a nice picture.", "Tell me how many houses there are.",
  "Can you tell me if Bolivia is landlocked?"...): the variants the second worker marks; the family names here are the
  ones a variant frame can name. Two loops / wrong orders were found by these checks and fixed (Lessons).
- tests/w.lang.en.test.mjs: the notation check allows `{x}` spans in an alternation's from / to (not `|`, `[`, `]`)
  and a question mark in a test sentence. Questions: Q58 [LIB] (mode precedence, order by n, a word class instead of
  [a|b], typed spans for double objects), Q59 (part-of and origin edges, one home for told is_a, senses of names).
- Tests one file at a time: w.lang.en.alternations 4, w.lang.en 21, templates 8, validate 5, questions 424, ask-real
  4, catalog 8; 0 fail. Catalog 32 worlds, 1,022 shards, vocab 25,736 words.
## Block 21:05 item 1 (2026-11-14, second worker): selectional restrictions in k.kinds

- `k.kinds.argument` (shard `arguments`, 18 wires, 4.9 kB, hand-written in `tools/relations-core.mjs`): the classes of
  arguments (thing, kind, place, direction, value, attribute, amount, number, name, person, group, topic, means: every
  value of `k.actions.role holds`; and act, time, word, text, boolean for the objects of relations), each with the
  catalog types that fill it, `live=true` where a live thing fills it, its senses (those of tools/joins.mjs) and examples.
- `k.kinds.relation` (31 shards `relations-<world>`, one per knowledge world, 919 wires, about 170 kB in all, the
  largest 13.5 kB; computed by `tools/relations-core.mjs`, now in `npm run build` after kinds-core): every key of every
  type of every knowledge world as a relation: subject (the type's kind in a word, `word` / `thing` for types keyed by a
  word / a drawing), subject_sense, object class (by rule from the slot: type=, boolean, number / amount by
  k.units.measure, enum value with its k.values scale, free string text, kind and place keys; else joined by value to
  the types whose naming key holds half the key's distinct values, regular plurals read as singulars, at most 3 within
  nine tenths of the best), object_type, object_sense. By class: 182 word, 151 number, 142 value, 120 thing, 84 text,
  77 amount, 50 boolean, 38 kind, 24 place, 24 time, 22 act, 3 group, 2 person. Examples: sound of an animal (a word,
  k.words), capital of a country (a place, k.geo.city), legs (a number), colour of a thing (a value, k.colours /
  k.values colours), can (an act, k.actions.action), size of a scene thing (a value on the scale size).
- k.kinds schema version 3 (two types, words by tools/key-words.mjs). The first worker's `tools/kinds-core.mjs`
  (k.kinds.parent, landed during this item) wrote every shard of k.kinds and removed the others: `writeShards` takes a
  `keep` list of prefixes now, kinds-core keeps arguments / relations- / structures, and tests/k.kinds.test.mjs checks
  only its own shards.
- Tests (`tests/k.kinds.relations.test.mjs`, 5): the shards are the tool's output and load; every role of k.actions
  holds a class, every value of `holds` is a class, every class names declared types and known senses; every key of
  every knowledge type has a relation with a known object class and declared object types; 28 relations of the first
  host's question frames (sound, capital, capital_of, legs, colour, made_of, habitat, at, place, can, cannot, baby,
  covering, eats, used_for, parts has, neighbour, continent, size, next month, colour mix, sides, class, kind_of,
  part_of, worn_on) take the subject and object they must; the 74 keys the readings of the 292 real questions reach
  (tools/ask-real.mjs) all have a relation and none of a named class lacks its object type. ask-real's counts are the
  same with and without the new shards. Catalog: 32 worlds, 1,052 shards, vocab 25,851 words (the keys' names lead
  to their world's relation shard, as for k.units.measure). k.kinds 6, shared-modules 5, validate 5 pass.
- COVERAGE.md regenerated (`node tools/coverage-report.mjs`, `node tools/aspects-report.mjs`; ASPECTS.md unchanged):
  the worlds table gains `k.kinds` with 958 of the 1,500 common things, nearly all through the first worker's
  k.kinds.parent shards (the page was stale on origin/main since bb61a21); 8 lead to a relation shard (world, person,
  key, hat, mirror, frame, continent, marker: names of keys).

## Block 21:05 item 3 (2026-11-14, second worker): k.words coverage of the words of failing paraphrases

- `sources/psys2-eval/paraphrase-failures.jsonl`: the 71 rows of psys2 failures.jsonl (c1175ee1) with class
  `paraphrase:` (text, class, source). `tools/paraphrase-words.mjs` (`node tools/paraphrase-words.mjs`): content words
  are the words that are no closed-class word of w.lang.en and no number; a word reaches a sense through itself, a
  k.words form, its regular stems, or without a possessive / contraction ending.
- Before: 138 content words, 126 reach a sense, 12 do not (anah, c3, g's, hey, if, myself, subhead, um, wat, yourself,
  zoe, zoe's; g's and zoe's were tool gaps: the possessive). Added `subhead` to the WordNet importer's ASKED words:
  `node tools/import/wordnet.mjs` (raw WordNet 3.1 and, since fa8a629, sources/wordfreq/raw/en-top50k.tsv copied from
  psys2 data/external, sha256 cf894ee6... as its SOURCE.md says) rewrote one line of `k.words/shards/su.sop` (WordNet
  shard, licence unchanged); the other 347 shards are byte-identical.
- After: 128 of 138 reach a sense; the 10 misses have causes: names (zoe, zoe's, anah), notation (c3), misspelling
  (wat), closed-class words w.lang.en lacks (if, myself, yourself, hey, um; item 5). Reached but not the meant sense:
  Ana, Tom, Leo, lei, G (WORLD.md). k.kinds relations unchanged by the new sense (rerun gives no diff).
- Tests: `tests/k.words.paraphrase.test.mjs` (2): the stems; every content word reaches a sense or has a cause, no
  listed word reaches a sense, every listed word is a miss, at least 90 % reach. k.words 4 pass.
- The w.chart commit (f0254e1) carried six conflict-marker lines in this log from its rebases (the markers only, no
  text lost); removed here. Lesson: grep for markers before `git add -A` after a rebase that stopped on this log.

## Block 21:05 item 4 (2026-11-14, second worker): structures of worlds for alignment

- k.kinds version 4: `k.kinds.structure` (6: assignment = items in slots under constraints, whole with parts, sequence,
  graph, placement, values by category; roles in order, the first two needed), `k.kinds.role` (39), `k.kinds.form`
  (33: world, structure, how) and `k.kinds.cast` (153: role -> a type, a type.key or an act of k.actions), for the 7
  world schemas and 10 knowledge worlds a live world makes or reads (k.layouts, k.objects, k.faces, k.parts,
  k.scenes, k.time, k.story, k.genres, k.procedures, k.geo). Shard `structures` (231 wires, 40.8 kB), hand-written
  table in `tools/structures-core.mjs` (in `npm run build`); kinds-core keeps it (the `keep` list of item 1).
- Tests (`tests/k.kinds.structures.test.mjs`, 4): the shard is the tool's output and loads; every world schema has a
  structure; every form casts its structure's needed roles and only its roles; every filler is a type of its world,
  a key of one (inherited keys too) or an act; analogies computed from the facts (guest ~ event ~ layout slot thing;
  seat ~ layout slot; table ~ layout; drawing part ~ chapter; face ~ drawing; chart series ~ chapter; list item ~
  event ~ method step), and transfer candidates (a timeline's end, start, finish missing from a list; nothing the
  other way). Measured: 96 world pairs share a structure, 343 filler pairs aligned, 174 roles offered for transfer.

## Block 21:05 items 2 and 5 (2026-11-14, second worker): w.lang.en variants, skipped words, removal; together / apart

- `w.lang.en.variant` (w.lang.en version 3; shard `variants`, 48 wires, 27.7 kB, `tools/lang-en-variants.mjs` by rule
  from the frames' parts, nothing named by hand): 45 of 352 frames marked, none deleted; `alternation` names a family
  of the third worker's alternation rules (a52dbec, landed during this item; my first draft had its own
  `w.lang.en.alternation` type and a wh_fronting class, both dropped on the rebase: a fronted wh-word is the canonical
  form there): request wrapper 17, passive 3, verb ellipsis 27 (a family added under context), dative shift 0 (the
  oblique pronoun is optional in every "draw me" frame); 39 with canonical frames (same act and mode, no alternation,
  all roles of the variant). Kept out by rule: naming participles, "I don't want X" (removal), a role followed by a
  determiner (the value as verb), catch-all frames.
- `w.lang.en.skip` (7 classes in the new hand-written shard `hand-request`, CC0): politeness, desire, filler,
  conjunction, copula, reflexive, request_preposition: every word of the first host's ask (please pls plz; want like;
  also now just too very really then; and; be; yourself myself; of on to for with) and a few more (um, hey, thanks,
  ourselves). `w.lang.en.neg` gets `means=removal` (without, lose, minus, no); copula be, am, been, being; joiner if
  (condition, no cut). The first host can drop its local `w.lang.en.fn` and `w.lang.en.neg` facts.
- k.values: comparatives together (distance and width, down) and apart (up): 94 comparatives (scales.sop by
  `node tools/values-core.mjs`).
- The named add with a place verb (block 20:15) was done by the fourth worker (585afaf): not repeated.
- Paraphrase coverage with the skip class (tools/paraphrase-words.mjs reads it, desire words stay content words):
  127 content words, 122 reach a sense, 5 misses (zoe, zoe's, anah, c3, wat); the `closed` cause is empty.
- Tests: `tests/w.lang.en.abstraction.test.mjs` (5): the shard is the tool's output and loads; every variant names a
  frame that is there and a family of the alternations, canonical frames agree in act, mode, roles and carry no alternation; the rule's examples
  (and three non-variants); the asked skip words by class, skipped prepositions and copulas are of the grammar; the
  negation and removal words; together / apart. w.lang.en 21, templates 8, k.words.paraphrase 2, k.values 5,
  ask-real 4, questions 424, joins 3 pass; k.kinds relations unchanged by k.values (rerun gives no diff).
- Full run of the round (items 1 to 5 at 89959a5, before the alternation facts were added), one file at a time:
  64 files, 3,009 tests, 3,004 pass, 5 skipped, 0 fail (catalog killed once by the memory limit, passed on the rerun;
  17 minutes). After the amend (w.lang.en.alternation): w.lang.en.abstraction 5, w.lang.en 21, templates 8, validate 5,
  catalog 8 pass.

## Questions and lessons (2026-11-14, second worker)

- questions.md Q60 [LIB] (the facts the type-driven reader, the analogy and the alternations read), Q61 (relation
  facts that depend on every world: generated or declared joins), Q62 [DATA] (English given names); numbered after
  the third worker's Q58 and Q59, which landed meanwhile. docs/lessons.md:
  a section for this round (seven lessons).
- Rebased on w.lang.ro's dictionary (19ca312, 1af5ad8): generated files taken from upstream at each stop and rebuilt at
  the tip (relations, structures and variants rerun with no diff; COVERAGE.md k.kinds 956 -> 958; catalog 32 worlds,
  1,055 shards, vocab 25,951 words). After the rebase: catalog 8, validate 5, coverage-report 4, k.kinds.relations 5,
  k.kinds.structures 4, k.kinds 6, w.lang.en.abstraction 5, w.lang.ro 10, k.words.paraphrase 2 pass.
- Rebased on the third worker's alternations (a52dbec, 2f54678): my `w.lang.en.alternation` and wh_fronting dropped
  (above), my questions renumbered Q60-Q62; `tools/measures-core.mjs` gives `w.lang.en.alternation.n` its measure (an
  order: the new numeric slot had none, so measures-core and relations-core threw; k.units measures.sop +1 wire).
  Generated files rebuilt at the tip (catalog 32 worlds, 1,056 shards, vocab 25,989 words; COVERAGE.md unchanged);
  the intermediate commits of this push carry stale or conflicted generated files (index, vocab-kinds, LICENSES),
  the tip none. Tests after the rebase: catalog 8, validate 5, coverage-report 4, k.kinds.relations 5,
  k.kinds.structures 4, k.kinds 6, w.lang.en.abstraction 5, w.lang.en 21, w.lang.en.alternations 4, templates 8,
  k.words.paraphrase 2, k.values 5, k.cores 6, w.schemas 14, k.procedures 15, ask-real 4, k.attributes 11, k.geo 7,
  w.lang.ro 10, k.interest 5 pass.

## 2026-11-15 — third worker: the one build moved to sopworld 0.90.0 (reviewer 00:40)

- `tools/sopworld/sopworld.mjs` is the library's `docs/sopworld.mjs` at 7f3c31a (release 0.90.0, build e3dabf08a71f,
  sha256 33e3ef4c…); `tools/sopworld/VERSION`, `tests/validate.test.mjs`, AGENTS.md, README.md, docs/index.html,
  docs/worlds/README.md and w.lang.en/WORLD.md name it. `npm run build`: 32 worlds, 1,022 shards, 25,751 words; no
  shard, warning or derived fact changed (the catalog differed in its `sopworld` commit and content hash only).
- `tests/w.lang.en.alternations.test.mjs`: the test's copy of `normalise` / `alternationsOf` is deleted; it reads
  the pinned build's `normalise(world, text, { rules })`. The library's `alternationsOf` carries no `n` and keeps the
  world's order, so the test now checks that the world's order is `n`. 35 / 35 sentences as before, same rules, same
  modes, canonical forms fixpoints, 17 of 352 frame examples changed.
- No test changed behaviour with the new build: nothing for questions.md [LIB].
- Found red on main before the move (not the pin): `tests/k.geo.test.mjs` "every number has its unit" failed on
  `w.lang.en.alternation.n` (my a52dbec); fixed upstream at the same time (9e0e1eb), so no change of mine is left there.
- Full suite one file at a time (61 files) on the new build: 2,981 pass, 1 fail (that k.geo test, then fixed and
  rerun: 7 / 7), 17 skipped; after the fix validate 5 / 5, catalog 8 / 8. Slowest files (s): k.compose 229,
  catalog 150, k.attributes 91, validate 72, k.cores 42, k.wearables 42, k.colours-shapes 40, derived 39,
  k.objects.names 39, k.objects.render 34.
- After rebasing onto 04bd420 (k.kinds relations and structures, w.lang.en variants): `npm run build` at the tip
  with 0.90.0 changes nothing but the catalog's version (32 worlds, 1,056 shards, 25,989 words). The new and changed
  tests on 0.90.0: k.kinds.relations 5, k.kinds.structures 4, k.kinds 6, k.words.paraphrase 2, w.lang.en.abstraction
  5, w.lang.en 21, w.lang.en.alternations 4, templates 8, k.values 5, k.words 6, k.geo 7, coverage-report 2, validate
  5, catalog 8 (killed once by memory, rerun alone) pass.


## 2026-11-15 — first worker: test speed (block 23:45; round "00:20" item 1)

- **Runner** `tools/test-run.mjs` (npm scripts): `test:changed` = the build, then the test files the changed paths
  touch against origin/main (committed, staged, unstaged, new) + catalog, validate and repository tests;
  `test:all` = every file one at a time; `test:slow` = the 10 slowest files of the last runs with seconds and peak
  memory; `--plan` prints the files and why. A change touches: its own test file; every test importing a changed
  module, directly or through other modules (an import graph); the tests of a world (named after it or naming it,
  its questions only, the worlds importing it) for a path under docs/worlds/<world>/ or a tool its shard headers name
  as their script. Each file runs as one process; it starts when its last peak memory + 600 MB are free; a file killed
  by SIGKILL runs again alone (5 tries). Timings in `.test-timings.json` (git-ignored). AGENTS.md: per push
  `test:changed`, full suite once per round.
- **Measured** (one file at a time, other workers running): before 60 files, 2,995 tests, 1,039 s; after 62 files,
  2,999 tests, about 410 s. The ten slowest before: k.compose 144 s, catalog 91, validate 80, k.wearables 73,
  k.attributes 69, coverage 61, derived 46, questions 43, k.scenes 39, k.objects.names 39. After: catalog 5 s (with
  the validation cache; 59 s when every world is validated), validate 0.3, k.compose 9, k.wearables 3, k.attributes
  25, coverage 12, k.scenes/k.people/k.actions/k.colours-shapes no longer load k.objects. Still over 30 s: derived
  (46–51 s: runs every rule of the catalog), questions (38–53 s in a full run; `test:changed` asks only the touched
  worlds' questions).
- **What made it slow, and the general fix for each** (no check dropped): (1) `factsOf(world, types)` in
  tools/lib/worlds.mjs parses only the lines of the asked types: the names of k.objects' drawings in 0.08 s instead of
  loading 46 MB into sopworld (44 s), used by k.actions, k.attributes, k.colours-shapes, k.people, k.scenes,
  k.wearables and coverage; (2) `validateWorlds` keeps a world that passed with its inputs (sopworld build, validator,
  every schema, the world's shards) in `.validate-cache.json` (git-ignored) and does not load it again; a fresh clone
  or `SKW_NO_CACHE=1` validates everything; test: a changed shard is validated again and fails, a failing world is
  not cached; (3) the catalog test built the catalog twice (the second build checked nothing the comparison with the
  files on disk did not) and the validate test validated the whole catalog again (buildCatalog validates first):
  one validation per run now; (4) `solveChoices` (tools/lib/choose.mjs) memoises the values of a binding per state of
  the choices: same stories (hash of 8 seeded solutions equal), 1.8 s to 0.05 s a story after warm-up; (5)
  questions.test.mjs takes `SKW_WORLDS` and test:changed sets it to the touched worlds.
- **Helpers in tools/**: `tools/sync.sh` (rebase on origin/main; logs keep both sides of a conflict, other files
  main's side; the generated files regenerated with memory waits and retries; stops if markers remain), the memory
  waits and retries of my /tmp scripts folded into the runner. New `tests/repo.test.mjs`: no tracked file holds a
  conflict marker; it found six in worker-log.md (a rebase of three workers' logs), removed.
- Main was red for a while (`w.lang.en.alternation.n` had no unit in tools/measures-core.mjs, k.geo test 4); fixed
  upstream meanwhile (an order), my copy of the fix dropped at the rebase.
- Tests: tests/test-run.test.mjs 2 (plan by names, imports and worlds; questions scoped), validate 5, repo 1.
  `npm run test:changed` after the rebase on sopworld 0.90 (364c1a4): build, then 66 files (every file: the shared
  loader changed), 3,017 tests, 3,016 pass, 1 skipped, 0 fail, 394 s.

## 2026-11-15 — first worker: narratable keys and attribute phrasing (block 00:05; round "00:20" item 2)

- **k.attributes.narration** (k.attributes version 5; shard `narration`, 972 facts, computed by
  `tools/narration-core.mjs`, now in `npm run build` and in tools/sync.sh): one fact per slot of every k.* type.
  narrate=no 754 with `why` (machinery types 600+: k.faces, k.motion, k.procedures, k.genres, k.layouts, k.objects,
  the catalogue types of k.attributes, k.actions' act words...; the naming key 43; coordinates 44; joins to drawings,
  senses, catalog entries 22; internal numbers 11; face-drawing joins 9; codes, formal names, sources, colour codes,
  catalog-id values). narrate=yes 218 with `form` (relation 127, measure 41, kind 15, text 14, count 11, state 10) and
  `salience` (typicality weight where k.attributes.typical has one, else measured from asked questions, k.attributes.shows
  and coverage). PSys2's examples: k.geo.country code, code2, formal, lat: no; capital 1, population 0.9, continent 0.8,
  region 0.4, independent 0.1.
- **w.lang.en.phrasing** (shard `templates-phrasing`, `tools/lang-en-phrasing.mjs`; w.lang.en schema: type phrasing,
  frame set acts.state): 7 form templates, 53 key templates; 5 frames of the set acts.state (needs=state) read a statement
  as change (set) with thing, attribute, value; the lexicons attribute.verb (22 verbs) and attribute.phrase (16 phrases)
  are derived from the templates. 190 narrated keys said from their first fact and read back (thing, value, attribute).
- `k.attributes.narration.salience` is a plain number in tools/measures-core.mjs (k.units measures 238 wires).
- Tests: tests/k.attributes.narration.test.mjs 3, tests/w.lang.en.phrasing.test.mjs 3, w.lang.en 21 (templates may
  be phrasings), templates 8, alternations 4. Q63 [LIB]: std.compose to read both.
- `npm run test:changed` (build 133 s, 33 files, 273 tests) found the variants shard stale: the five acts.state frames
  are canonical frames for 17 verb-ellipsis and wrapper variants of change (tools/lang-en-variants.mjs reads every
  frame). Regenerated, and the tool is now in `npm run build` (0.3 s) so a frame change regenerates it; then catalog,
  abstraction, repo pass; the other 30 files passed in that run.

## 2026-11-15 — third worker: Q59 answers in k.kinds.parent: part_of and origin dimensions, `sense=` (reviewer 00:40)

- Two new dimensions of `k.kinds.parent`, derived at build by tools/kinds-core.mjs (no hand copy; `from`, `key`,
  `value` name the source fact, which stays the one home), added after every kind edge and only for pairs no other
  edge relates: **part_of** 5,156 edges (k.parts whole / inherited / usual `has` and `plain`, k.parts called `part`,
  k.body `part_of`: wheel, car wheel, door, bumper -> car; leg -> ant; eyebrow -> face; a car has 66 parts and 5+
  other vehicles have a wheel) and **origin** 148 edges (k.food `comes_from` and `grows_on`: beef -> cow; cheese,
  butter, yogurt -> milk; apple -> tree; carrot -> underground). k.parts inherited is taken because WordNet files the
  car wheel under motor vehicle, which has no part list of its own (without it a wheel was no part of a car).
- **`sense=`** (schema: slot `k.kinds.parent.sense`, id=true, the enum of k.attributes.same) on the edges of the 70
  names with two senses (k.attributes.same only=false): 287 of their 371 edges (61 names) carry it — the sense whose
  `in` types hold the fact the edge is read from, or for a WordNet edge the sense that chose the WordNet sense; the
  other 84 come from facts keyed by word (k.parts, 73) or from types no single sense holds. The sense is part of the
  edge's id, so a pair can hold for both senses (cod, herring, salmon, sardine, tuna are fish as animals and as foods:
  5 new kind edges). Bat is one sense in the catalog (no club), so it has none.
- Numbers: 13,698 edges (was 8,389) over 4,513 names; things with parents on 2+ dimensions 1,181 (was 935), one
  parent 946 (was 1,009), none 64. New shards: part_of 1,556 wires / 233,185 B (CC0), part_of-wordnet-1..3 1,217 /
  1,199 / 1,184 wires, 198,281 / 200,600 / 192,957 B (WordNet-3.0), origin 148 wires / 23,795 B (CC0); 0 warnings.
  Catalog 32 worlds, 1,061 shards, 26,455 words. PARENTS.md and k.kinds WORLD.md say both; relations-kinds gains the
  sense key.
- tests/k.kinds.test.mjs 8 / 8 (two new: Q59 (1, 2) part_of / origin examples, cousins through a car, derived only
  and one edge per pair, shards of their own; Q59 (3) sense examples, sense from the fact's types, unique ids).
- Full suite of the round, 65 files one at a time on 0.90.0: 3,000 pass, 0 fail, 17 skipped (catalog killed by
  memory once in the touched run and rerun alone: 8 / 8).
- Rebased onto 8972c83 (narration, phrasing, test-run): `npm run build` again (k.attributes narration gains
  `k.kinds.parent.sense` narrate=no; catalog 32 worlds, 1,063 shards, 26,471 words); after it k.kinds 8,
  k.kinds.relations 5, k.kinds.structures 4, k.attributes.narration 3, w.lang.en.phrasing 3, k.interest 5, repo 1,
  questions 424, shared-modules 5, validate 5, catalog 8 pass.

## 2026-11-15 — first worker: every w.lang.en frame reads its own example (block 22:30; round "00:20" item 3)

- **Test** `tests/w.lang.en.frames.test.mjs`: pass 1, each frame alone reads its example (a host lexicon it names
  takes any 1–3 words; the words taken become that kind of world's lexicon); pass 2, in its world (frames with no needs
  or its needs, those lexicons) the best reading is the frame or one with the same act, mode and roles. First run:
  357 frames, 320 best, 9 tie, 14 other, 9 not read alone (and with closed sample lexicons 227 of 352 best: most
  "failures" were missing host words, hence the two passes). Now: 333 best, 10 tie, 14 listed with reasons (KNOWN:
  9 of PSys2's local media/text/facts frames, 5 chart frames); the test fails on a new failure and on a listed frame that
  passes. Second test: 29 of 57 roles of k.actions no general frame reads (frame asks, WORLD.md, Q64).
- **Reader fixes** (tools/lib/lang-en.mjs, general): `rest` takes at least one word (empty values: 5 frames);
  apostrophes dropped inside words ("don't" = "dont"); the `thing` capture does not end in a preposition or determiner;
  separable phrasal verbs of k.actions (61) also read with the particle moved back ("take the tables apart");
  `openLexicons` and the words each lexicon part took (`lexicons`) for the test.
- **Data fixes**: `V.place`, `V.make`, `V.set` inside word lists (5 parts, the hand-over's notation) are `act=` on the
  part (the import tool does it; the 07:40 pattern test writes them back); at the import (`FRAME_FIXES`,
  `FRAME_PRIORITY`, IMPORT.md says so; the import stays reproducible from the cited commit): acts.change.add1 gets a
  determiner ("Add a seat to table 1"), acts.make.self "give", acts.more.ask.options the verb after "can I",
  acts.more.ask.options.short "please", acts.apart.2 priority 14 over the direction frames; the template of take apart
  says "take {thing} apart." (read by acts.apart and acts.apart.2 in the general world). hostLexicon: an adjective
  right before a noun is its modifier ("red house" no longer a compound; "apple pie" still is); the templates test's
  "most modifiers" workaround removed. Variants shard regenerated.
- Tests: w.lang.en 22 (red house), templates 8, phrasing 3, frames 2, alternations 4, abstraction 5.
## 2026-11-15 — second worker: Q61 declared joins, step 1 of 3: k.kinds.relation reads declared joins first; the join report

- Coordination: the declared joins go into the slot declarations of the k.* and w.* schemas in the next commits, one
  small group of worlds per commit; nothing but `type=T by=k` is added to existing `core.slot` lines (owners: no fact,
  no other key changes; a rebase conflict on a slot line is resolved by keeping both).
- Form: the library's own join `type=T by=k` (sopworld 0.60+, deferred per value since 0.70; `match=own:target` for
  a second key), not a new `joins=`: the library reads and checks it (open-join issues, refused only by a strict check
  or `world.closeType`), and its sampler already fills a `by` slot from the target type. No [LIB] question needed.
- `tools/relations-core.mjs`: a declared join is the object type (`found=declared`, `object_by` its key; a kind or
  place key keeps its class); a slot's own type, kind or enum `found=schema`; the value share only where nothing is
  declared (`found=value`, a suggestion). k.kinds schema: slots `found` (enum declared, schema, value) and `object_by`,
  two words.
- `tools/joins-report.mjs` (in `npm run build` after relations-core) writes `docs/worlds/k.kinds/JOINS-REPORT.md`: every
  declared join checked over all shards of all worlds (distinct values, values meeting a target token for token as
  sopworld compares, open values), broken joins (under half meet, or a target type / key no schema declares), the
  undeclared keys the value share joins to a type, and the keys left undeclared on purpose with the reason (k.objects
  part/skeleton `of`: a scan per value would add 21 s to loading k.objects, measured 28 s -> 49 s; k.time `next`: a
  join to the fact's own type cannot be declared once on the shared parent). Now: 10 declared (the drawing joins),
  978 values, 0 open, 0 broken; 256 undeclared; 6 kept.
- Tests: new `tests/k.kinds.joins-report.test.mjs` (3): fails only on a malformed declaration or a relation that does
  not follow a declared join; WARNS (t.diagnostic) on broken, open, undeclared joins and a stale report.
  `tests/k.kinds.relations.test.mjs` test 1: declared and schema facts must be the tool's output; a value-share fact
  that differs is a warning, so another world growing no longer turns it red.

## 2026-11-15 — third worker: the one build moved to sopworld 0.97.0 (04fc35e; coordinator: to the current release if newer than 0.90)

- `tools/sopworld/sopworld.mjs` = the library's `docs/sopworld.mjs` at 04fc35e (release 0.97.0, build a7e78da88c45);
  VERSION, validate test, AGENTS.md, README.md, docs/index.html, docs/worlds/README.md and w.lang.en/WORLD.md name it.
  `npm run build`: nothing changed but the catalog's commit and content hash (32 worlds, 1,063 shards, 26,471 words).
- One test changed behaviour: `normalise` gives "can you tell me where the cat is" the mode `question` (0.91: the
  innermost rule's mode wins; our Q58 item 1), not `request`. The test's exception for the old reading is taken out
  (every case checked against its own published mode); recorded as questions.md Q65 [LIB]. Canonical texts and rules
  applied unchanged (35 / 35).
- Full suite (`node tools/test-run.mjs`, 69 files one at a time): 3,009 pass, 0 fail, 17 skipped, 318 s. Slowest:
  derived 34.6, questions 33.7, k.attributes 27.7, k.objects.render 26.9, k.objects.names 25.3, k.cores 17.5,
  gallery 17.0, k.kinds.relations 12.5, k.procedures 10.1, w.lang.en.templates 9.6 s.
- Rebased onto d7fa086 (frames read their examples, declared joins): build again (catalog hash only; 26,475 words);
  on 0.97 k.kinds.joins-report 3, k.kinds.relations 5, w.lang.en.frames 2, phrasing 3, templates 8, w.lang.en 22,
  alternations 4, abstraction 5, k.actions 4, k.kinds 8, questions 424, repo 1, validate 5, catalog 8 pass. My
  question is Q65 (Q64 was taken by the first worker meanwhile).
## 2026-11-15 — second worker: Q61 step 2a: declared joins in k.geo, k.time, k.units, k.values (slot lines only)

- 29 joins added as `type=T by=name` to existing slot lines (nothing else changed): k.geo 15 (city country,
  capital_of; country capital, continent, political_continent, neighbour; group member; continent / country of
  desert, lake, mountain, range, river), k.time 8 (before cycle, `k.time.ordered.cycle` once for its five children,
  cycle lasts, duration unit, season_in first / last, span cycle / within), k.units 3 (measure unit, quantity base,
  unit quantity), k.values 3 (comparative / step scale, direction opposite). Left: k.time `next` (own type on the
  shared parent), `before` earlier / later (mixed cycles).
- JOINS-REPORT: 39 declared in 11 worlds, 2,426 values, 2,413 meet (99.5 %), 13 open: 10 capitals that are no
  k.geo city (City of Victoria, Cockburn Town, Diego Garcia, El Aaiún, King Edward Point, Fakaofo...: territories'
  capitals below the city list's threshold) and 3 units k.units lacks (month, decade, century); 0 broken; 223
  undeclared. Load: k.geo 0.79 -> 1.1 s with every shard together (the join scan); k.time, k.units, k.values unchanged.
- Fix of step 1's test: a join declared on a parent type (k.time.ordered) holds for its children's relations.
- Tests: `npm run test:changed` (build 123 s; 33 files, 376 tests): 374 pass, 1 skipped, 1 fail (the parent-type case
  above), fixed and rerun: k.kinds.joins-report 3 pass.

## 2026-11-15 — third worker: role facts and constraints for k.kinds.structure (block 02:00; the library's Q61)

- `k.kinds.role` gains, for all 39 roles of the 6 structures: `refers` (the role it points to: slot -> container,
  assigned -> slot, part_of -> whole, element_of -> sequence, from / to -> node, next -> element; 21 roles), `of` (the
  role whose key a key role is; 27), `many` (a key role: several values or one, so an item has one slot; a role that
  is a thing: one thing of the role it refers to, else one world, holds several) and `required` (= the structure's
  `needs`). A key role that refers is single-valued (tested). The 153 casts stay the map from a world's types to roles
  (the library's proposed `structure_of`); 71 cast keys are keys of the type the world casts to their `of` role.
- New type `k.kinds.constraint structure= name= kind=capacity|distinct|order on=<role> about= world= by=` (k.kinds
  version 5, exported; the commit message of 4cdbc09 says 6 by mistake): capacity of a container (w.seating, by w.seating.room), within (w.timeline, by its three
  inside denies), one_of_each_kind (w.face, by w.face.one), ends_after_start (w.timeline, by w.timeline.order.ends),
  distinct_positions (k.genres, k.procedures, k.story) and no_self_link (k.geo), the last two held by the facts and
  checked by the test. Not given: a constraint no world holds by a rule or by its facts (one guest per seat is not a
  rule of w.seating; one value per category not of w.chart).
- Names: the library wrote `k.kinds.structure.role` / `k.kinds.structure.constraint`; `k.kinds.structure.role` is
  already the slot `role` of k.kinds.structure, so the keys go on the existing type `k.kinds.role` and the
  constraint is `k.kinds.constraint` (same keys).
- Shard structures 237 wires, 43,824 bytes (was 231 / 40,792); relations-kinds and narration gain the new keys
  (narrate=no); catalog 32 worlds, 1,063 shards, 26,480 words; 0 warnings. WORLD.md says it.
- Tests: k.kinds.structures 6 / 6 (two new: roles' direction, cardinality and required, the library's examples;
  constraints' kinds, roles, worlds, rules and the facts that hold them), k.kinds.relations 5, joins-report 3,
  k.kinds 8, narration 3, shared-modules 5, questions 424, repo 1, validate 5, catalog 8.
## 2026-11-15 — second worker: Q61 step 2b: declared joins in k.actions, k.animals, k.attributes, k.body, k.colours, k.commonsense, k.faces, k.feelings, k.wearables (slot lines only)

- 50 joins added to existing slot lines: k.actions 13 (act / action opposite, undone_by, where -> k.scenes.scene, tool
  -> k.objects.object; family parent; marking / member / role / verb act; member family; similar action; marking role
  -> k.actions.role `by=name match=act:act`, the library's two-key join), k.animals 4 (habitat -> k.commonsense.lives
  by `in`, can / cannot -> k.actions.action, thing -> k.objects.object), k.attributes 8, k.body 3, k.colours 7
  (lighter, darker, complement, mix a / b / gives -> k.colours.colour; thing -> k.objects.object), k.commonsense 2
  (can, cannot), k.faces 5 (expression / preset style -> k.faces.canon by `style`; preset clothes; part / variant slot
  -> k.faces.slot), k.feelings 2, k.wearables 5 (worn_on, covers -> k.wearables.place; body_part; face_slot ->
  k.faces.slot). Left undeclared (under three quarters meet, or the target is not one type): eats, made_of, comes_from,
  who, object, at, material, the face presets' skin / hair / eye colours (blond, pale, tan are no k.colours colour).
- JOINS-REPORT: 89 declared in 17 worlds, 3,726 values, 3,666 meet (98.4 %), 60 open (tool: 30 body parts and
  compound names without a drawing; k.attributes.thing can: 10 verbs k.actions lacks: bounce, erupt, explode...;
  habitat hair, sky; colour things fire truck, traffic light, night, ocean), 0 broken, 174 undeclared.
- tests/k.commonsense.rules.test.mjs: `world.check()` issues now include the open joins of a world loaded without
  its targets (k.actions here); the test reads the soft rules' issues (kind other than `open-join`). Test only.
- Tests: `npm run test:changed` (build 178 s; 53 files, 2,735 tests): 2,728 pass, 5 skipped, 2 fail (that rules
  test), fixed and rerun 5 pass.

## 2026-11-15 — second worker: Q61 step 2c: declared joins in k.genres, k.interest, k.layouts, k.motion, k.objects, k.people, k.procedures, k.scenes, k.shapes, k.space, k.story (slot lines only)

- 64 joins on existing slot lines: k.genres 10 (register, move, source, genre), k.interest 4, k.layouts 3 (layout,
  arranged), k.motion 13 (event, splitter, layer, rule; set via -> k.faces.expression; viseme style -> k.faces.canon),
  k.objects 1 (stand_in drawing: the old comment said every shard must load alone, which a deferred join allows since
  0.70; the comment now says so), k.people 7 (kind / role face -> k.faces.preset, role is -> k.people.kind, wears ->
  k.wearables.wearable, holds / uses -> k.objects.object, works_at -> k.scenes.scene), k.procedures 6 (method),
  k.scenes 2 (has scene, has thing), k.shapes 3 (face, flat -> k.values.shape; thing), k.space 3 (kind, orbits, in),
  k.story 12. Not declared: k.objects part / skeleton `of` (cost, in the report), k.people is_a / kind_of (inherited
  from k.kinds.kind, shared by three worlds), the k.procedures and k.layouts keys that name keys or words.
- JOINS-REPORT: 153 declared in 25 worlds, 5,451 values, 5,292 meet (97.1 %), 159 open, 0 broken, 110 undeclared.
  The exact comparison finds what the folded value share hid: scenes hold 89 things without a drawing of that name
  (beach ball, cable car, control tower, fallen apple), "magnifying glass" is drawn only as "magnifying glass tilted
  left / right", a role works at a courthouse that is no scene, wears "hat Christmas" (a word-order slip).
- Tests: `npm run test:changed` (build 120 s; 47 files, 2,629 tests): 2,625 pass, 4 skipped, 0 fail.

## 2026-11-15 — second worker: Q61 step 2d: declared joins in the world schemas w.document, w.face, w.lang.en (slot lines only)

- 13 joins: w.document 3 (document genre -> k.genres.genre, register -> k.genres.register, sentence move ->
  k.genres.move), w.face 3 (style -> k.faces.canon by `style`, preset -> k.faces.preset, expression ->
  k.faces.expression), w.lang.en 7 (frame / part / role_map / template / mode_map act -> k.actions.act, role_map
  act_role -> k.actions.role `by=name match=act:act`, discourse move -> k.genres.move). In a world schema a `by`
  slot is not a reference to a live thing: the library's acts take the value as said, report the join open while
  the knowledge is not loaded, and its sampler fills the slot from the target type's names (src/sample.mjs).
  Not declared: w.face part variant (k.faces.variant is slot + name and the slot is the part's kind, not a key: no
  `match` can say it), w.map / w.chart colours (free names), w.map pin on (a country, a city or a sea).
- tools/joins-report.mjs also reads the world schemas without facts (w.face, w.document: tools/lib/schemas.mjs).
- JOINS-REPORT: 166 declared in 28 worlds, 5,564 values, 5,404 meet (97.1 %), 160 open (w.lang.en frame act `own`:
  the first host's act of reading by a world's own reader, which k.actions does not have), 0 broken, 110 undeclared.
- Tests: `npm run test:changed` (build 176 s; 35 files incl. w.schemas, w.document, the 8 w.lang.en files, k.compose,
  k.procedures, questions): 266 pass, 1 skipped, 0 fail; after the report fix k.kinds.joins-report 3, catalog 8 pass.


## 2026-11-15 — first worker: w.lang.ro frames and order (block 18:20 item 1; round "00:20" item 4)

- `shards/frames.sop` (`tools/lang-ro-frames.mjs`; schema: types frame, part, phrase, lex, syntax, exported): 39
  frames (make 7, remove 3, change 8, place 2, connect 2, group 2, pick 2, copy, send, undo, redo, save, load, ask 7),
  5 phrase groups, 3 lexicons, 6 order facts; 276 wires, 41,950 bytes. Each frame names its English frame (`en`) with
  the same act, mode and needs, its roles among the English roles: w.lang.en's frame vocabulary, read by w.lang.en's
  reference reader (`tools/lib/lang-ro.mjs` gives it the Romanian words: 434 verb forms of the lemmas whose sense
  reaches an act, directly or through the k.words verb's English word; dets, prepositions, numerals, phrases folded;
  joined clitics split; politeness words skipped; kind phrase by adjective.after.noun; the English frame's fixed
  arguments and frame role maps inherited).
- **Measured** on PSys2's ro-en-meaning (read in place at /tmp/wt2; a request counts when its reference reading is one
  request whose action ends in a frame act; roles compared as roles of k.actions through w.lang.en's role maps):
  hand Romanian 2,294 requests: read 69.3 %, act and mode 54.3 %, act and roles 39.9 %; machine Romanian 3,597:
  41.3 / 28.3 / 25.3 %. Unread are mostly fragments without a verb, arithmetic and talk questions, verbs with no sense
  (conecta, încărca: words of their frames meanwhile), multi-request sentences.
- Tests: tests/w.lang.ro.frames.test.mjs 4 (shard = tool; every frame says an English frame; every frame reads its
  example with and without diacritics; clitics, prepositions, adjective order; the corpus measure with floors 35 % /
  20 %, skipped without the corpus), w.lang.ro 10. The frame keys priority, at and max_words are orders and word counts in
  tools/measures-core.mjs. `npm run test:changed`: build 140 s, 12 files, 99 tests, 0 fail.
- Full suite for the round (`npm run test:all`, after the rebase on sopworld 0.97): 72 files, 3,036 tests, 3,034 pass,
  1 skipped, 1 fail: COVERAGE.md stale after the third worker's k.kinds part_of edges (k.kinds 958 -> 1,238 of the
  common things); `npm run reports` rerun. `test:changed` had not run that test: a change of any world now also runs
  the tests that recompute a page of every world (COVERAGE, ASPECTS, JOINS). Slowest: derived 53 s, questions 31,
  k.attributes 29, gallery 25, k.objects.render 20, k.cores 18, k.objects.names 16; 362 s in all.

## 2026-11-15 — second worker: given names (Q62) in k.people, from Wikidata (CC0)

- The reviewer's first route (SSA via a GitHub mirror) worked and was set aside when PSys2's Wikidata set landed:
  hadley/babynames (CC0 R package, the SSA file 1880-2017) was read by a 60-line reader of R's serialization (xz +
  XDR; 1,924,665 rows, 97,310 names, 10,570 with at least 1,000 births); SOURCE.md names it as the alternative.
- **k.people.given_name** (k.people version 4, exports given_name; 26 shards `given-names-<letter>`, 2,990 wires,
  489,605 bytes; `tools/import/given-names.mjs` from psys2 `data/external/given-names/given-names.tsv`, commit
  0a24284f, copied to sources/given-names/raw/): name, sex (female / male; both for the 184 unisex names), holders
  (Wikidata humans with that given name), band computed from holders (very common 123 >= 10,000, common 934,
  frequent 1,441, rare 492), wikidata items. 3,000 items -> 2,990 names: 9 labels of two items merged (Anna, Pavel,
  Vladimir: other scripts of one name; holders added), 1 label with no Latin letter left out; ids collide for 47
  accented / plain pairs (José, Jose) and the accented one takes its first item (`Jose_Q...`). Measures: holders
  counts humans (k.units measures 242 wires). Narration (generated): sex and holders narrated, band and wikidata not.
- Zoe (female, frequent, 985 holders), Ana (female, very common), Tom (male, very common), Leo (male, common) are given
  names. Cost: vocab.json 26,480 -> 29,089 words; 15 common things now also lead to a k.people shard (COVERAGE.md
  k.people 2 -> 17: names that are words, Rose, Cliff...).
- Tests: new tests/k.people.given-names.test.mjs (3: the four names with sex and band; every fact's band computed,
  items, unique ids; shards = the import's output, under the size gate). `npm run test:changed` (build 140 s; 29
  files, 235 tests): 233 pass, 1 skipped, 1 fail (COVERAGE.md stale: `npm run reports` regenerated it), rerun
  coverage-report 4, catalog 8, k.people.given-names 3, k.people, repo pass.


## 2026-11-15 — third worker: supersenses on k.words senses; the class of every closed-class word of w.lang.en (block 02:15)

- `k.words.sense.supersense` (k.words version 4): the WordNet lexicographer file of the sense's synset (second field
  of a data line, by the 45 names of WordNet 3.1's `lexnames`; `LEXNAMES` in tools/import/wordnet.mjs, checked
  against the raw file). **Senses without a supersense: 0 of 29,449** (29,448 WordNet senses, and the hand sense
  `numbered`, written `adj.ppl`). Most frequent: noun.person 3,484, noun.artifact 2,846, noun.act 2,173,
  noun.communication 1,733, adj.all 1,621, verb.contact 1,188, verb.communication 929, noun.cognition 900;
  rarest: adj.ppl 5, noun.motive 17, noun.Tops 47, verb.weather 48. Rerun: `node tools/import/wordnet.mjs` (raw
  files copied from the first worker's clone; sha256 of wordnet31.zip, en_50k.txt, en-top50k.tsv equal SOURCE.md's).
  k.words shards 8,676,956 -> 9,377,608 bytes (348 shards; largest re.sop 208,260 bytes, 899 wires); 0 warnings.
  The key is narrate=no in k.attributes.narration (a class of the dictionary, for type signatures).
- `w.lang.en.closed text= class= from=` (new type, exported; shard closed-classes, 274 facts, 37,976 bytes, CC0):
  260 closed-class words of the word lists, each with its class (determiner 32, pronoun 39, preposition 64,
  conjunction 8, auxiliary 49, numeral 13, ordinal 11, adverb 26, particle 3, interjection 29 facts: the closed
  parts of speech of Universal Dependencies, in English words). Derived by `tools/lang-en-closed.mjs` (in `npm run
  build`): one-class lists give their class with exceptions by word (numeral determiners, locative there, question
  words, negation words); marker lists (answers, corrections, leads, skipped words) class their single words from one
  table. 45 open-class words of the lists get none (want, think, like, lose, new, the 15 attribute nouns ...).
- Tests: `npm run test:changed` (build + 42 files, 332 tests): 330 pass, 1 skipped, 1 fail (COVERAGE.md stale:
  `npm run reports` rerun; k.kinds coverage 958 -> 1,238 of the common things was already stale on main). New:
  import.wordnet "supersenses" (every sense of the shards, of its own part of speech; the list = lexnames),
  w.lang.en.closed 3 tests (shard = tool output; every single word of the lists classed or named open; the usual
  words get the usual classes).
  After rebasing on 6c46b13 and rebuilding: `npm run test:changed` 43 files, 336 tests, 335 pass, 1 skipped, 0 fail;
  rebased again on 20cdace (k.people.given_name), rebuilt (catalog 32 worlds, 1,091 shards, 29,129 words): catalog 8,
  k.attributes.narration 3, w.lang.en.closed 3, repo 1, validate 5 pass.
## 2026-11-15 — second worker: Q66 [LIB], lessons, k.kinds numbers; full suite of the round

- questions.md Q66 [LIB]: the `by=` check scans the target type per value (k.objects part `of` would add 21 s), and
  `"horse"` / `horse` do not meet. docs/lessons.md: a section for Q61 / Q62 (seven lessons). k.kinds/WORLD.md: 938
  relations (158 declared, 463 schema, 317 value).
- Full suite of the round (`npm run test:all`, one file at a time, at 20cdace + this commit): 73 files, 3,041 tests,
  3,035 pass, 5 skipped, 1 fail: ask-real "a word for every key" (the given-name keys had no word: tools/key-words.mjs
  not rerun after the import). Rerun it (4 key words in k.people), narration, relations, report, catalog; then
  ask-real 4, k.people, k.people.given-names 3, catalog 8, validate 5, repo, coverage-report 4, k.kinds.relations 5 pass.
- Main was red after 04b767d (supersenses): ask-real "a word for every key" (the k.words schema's key-word block was
  not the output of tools/key-words.mjs: the supersense words were written into the block by hand). Rerunning the
  tool dropped them, so they are now in its EXTRA (`k.words.sense.supersense`: supersenses, lexicographer file,
  semantic class) and the block is the tool's output again (one wire moved). ask-real 4, k.words, catalog 8, validate,
  repo pass.


## 2026-11-15 — first worker: animal sounds as a typed relation (block 03:20 item 1; PSys2 Q15)

- `k.animals.animal.sound` is a typed relation: declared join `type=k.words.sense by=word` (k.kinds.relation for
  the key now `found=declared`), and **every sound value is a word of k.words** (57 distinct values, 0 open).
- New shard `k.animals/shards/sounds` (WordNet 3.1, licence WordNet-3.0; 32 wires, 6,495 bytes; written by the new
  `tools/animal-sounds.mjs`): the sounds WordNet's glosses name for an animal of k.animals ("moo: the sound made by a
  cow or bull", "hoot: utter the characteristic sound of owls", "bees were buzzing around the hive"), one wire per
  animal that merges with its other wires (as psys2.sop), each after a comment with the glosses it rests on. Glosses
  of noun.event, verb.communication, verb.perception (and noun.communication only with "as of a X"); an animal word
  that ends its phrase (not "a sharp swift blow"); a mention of a kind below the animal counts (hen for chicken; hound
  for dog); examples only where the definition names no animal and the example uses the synset's own word; left out:
  comparisons ("a loud laugh that sounds like a horse neighing", "a noise resembling the bark of a dog"), a call to
  animals ("as of hunting dogs"), a word for any sound (cry). Lemmas: the first, and those whose first sense is the
  synset and that a frequency list has (whinny, oink; not bombilate, low, click). Order of values: the animal's own
  gloss first, nouns before verbs, frequent first.
- Numbers: **32 animals, 51 pairs; 28 confirm a sound the hand table or PSys2 had, 23 new** (cat mew caterwaul yowl,
  dog yip yelp bow-wow bay howl yap, horse whinny, pig squeal, raven caw, goose gaggle, hen cackle, bull moo, cricket
  and grasshopper stridulate chirr, cicada chirr, mouse patter chirk, seagull mew, magpie chatter). Animals with a
  sound: 121 -> 123 of 314. **Kinds with no sound: 191** (`node tools/animal-sounds.mjs --report` lists them): fish
  and most invertebrates (no sound a child names), and birds and mammals that no source here names (penguin, swan,
  peacock, flamingo, fox, giraffe, rabbit, zebra, camel, deer, ...): to add only with a source.
- k.words: the sound words are asked words of the WordNet import (`soundWords`, `askedWords` in
  tools/import/wordnet.mjs): +22 words, +57 senses (cluck, neigh, oink, whinny, bray, caw, purr, bleat ...); `maa`
  (the goat in the PSys2 words) is a hand sense (noun.event). k.words 348 shards (9,402,222 bytes).
- Found on the way: **tools/ranges-core.mjs read the class of an animal from the last wire of its name**; the PSys2
  wires (no class) had erased the class of 15 animals, so the catalog's mammal ranges counted 11 mammals, not 24
  (size 2-3 m -> 1.3-2.5 m, weight 60-900 -> 40-500 kg). Fixed (only wires with a class), ranges.sop regenerated.
- Cost: a host that loads k.words and k.animals together pays the join check by scan (Q66): k.animals alone 0.1 s,
  after k.words 1.9 s (29,500 senses scanned per sound value).
- Tests: k.animals new test (shard = tool output, no new animal, every sound a k.words word, 17 plain sounds), 2 new
  questions (magpie, seagull), an-p1 list grown; k.cores and k.animals accept `wordnet 3.1` on the merged animal
  wires; import.wordnet uses `askedWords`. `npm run test:changed` on the rebased tip (55ff6ea): 40 files, 352 tests,
  350 pass, 2 skipped, 0 fail.

## 2026-11-15 — third worker: English regular inflection in std.morph notation (block 02:55)

- `tools/lang-en-morph.mjs` (new; reads WordNet 3.1's noun.exc, verb.exc, adj.exc and the catalog) writes:
  shards `morphology-classes` (137 wires, 20,729 bytes, CC0: 40 paradigm classes `w.lang.en.class`, 51 cells
  `w.lang.en.ending`, 44 suffix rules `w.lang.en.inflect` op third / past / ing / comparative / superlative),
  `irregular-forms` (453 wires, 62,194 bytes, CC0) and `irregular-forms-wordnet` (303 wires, 50,869 bytes,
  WordNet-3.0): 756 forms in std.morph's shape `w.lang.en.irregular_form lemma= form= num|vform|degree= variant=
  from=`, 295 of them `variant=yes` (read, never written: burnt, antennae, traveled); and `dictionary/<letter>.tsv`
  (26 files, 203,542 bytes, WordNet-3.0): 13,058 rows `lemma<TAB>class` for the 8,897 nouns, 3,343 verbs and 818
  adjectives of k.words and k.actions (one lower-case word each). 0 warnings.
- Classes (rows): noun.s 7,566, noun.es 440, noun.ies 583, noun.ves 16, noun.fe 5, noun.same 287; verb.s 1,635,
  verb.e 981, verb.es 232, verb.ies 90, verb.ee 24, verb.ie 7, verb.double.<13 letters> 375, verb.ck 5; adj.more
  526, adj.er 178, adj.e 60, adj.ier 42, adj.double.<letter> 12. Spelling first; WordNet's exception lists decide
  doubling, -ves, -oes and an adjective's doubling and -ier; one-syllable CVC verbs double by default (blog, bog);
  adjectives that are participles or WordNet adj.pert / adj.ppl (15) are compared with more.
- Irregulars stay irregular facts: `w.lang.en.irregular` stays the home of the plurals (206 derived copies name it in
  `from`); 167 irregular verbs written in the tool (with variants), 30 compounds where WordNet has their forms
  (understand, overcome, misunderstand, upset), be / have third person, 9 irregular adjectives. 36 WordNet forms are
  left out and reported (archaic or other spellings: curst, gript, swopped; am, are; cola for colon).
- `tests/w.lang.en.morph.test.mjs` (6 tests): files = tool output; dictionary format; **round trip 35,911 of 35,911
  cells** of the 13,058 lemmas (generate, then analyse with the dictionary back to lemma and cell); inflectBy and
  std.morph give cats, boxes, berries, stopped, making, bigger (and leaves, knives, roofs, mice, went, understood,
  happiest, better; burnt read as a variant, burned written); inflectBy's rules agree with the dictionary on regular
  cells: plural 8,514/8,819 (96.5 %: the misses are the nouns of plural form and -ves/-oes), third 3,337/3,341,
  past 3,021/3,164 (95.5 %), ing 3,199/3,343 (95.7 %: stress and British -ll-), comparative and superlative 284/285.
- Fixed on the way: the schema comment named w.lang.ro (its test keeps Romanian out of other worlds).
- Tests: `npm run test:changed` 20 files, 116 tests: 115 pass, 1 fail (that comment), fixed; after the rebuild
  (catalog 32 worlds, 1,094 shards, 29,133 words): w.lang.en.morph 6, w.lang.en 22, w.lang.en.closed 3, w.lang.ro 10,
  catalog 8, validate 5, repo 1, ask-real 4 pass. (04b767d had left ask-real red: the supersense key words were
  written by hand into the block tools/key-words.mjs owns; fixed by the first worker in 55ff6ea.)

## 2026-11-15 — third worker: fix: the w.lang.en dictionary follows k.words (e8c4f0b pushed red)

- e8c4f0b was pushed with tests/w.lang.en.morph.test.mjs red (my command chain pushed after a failing test): e6d0cc9
  had added 57 k.words senses (animal sounds) between my run of the tool and the push, so the dictionary was stale.
  Fix: `npm run build` now runs `node tools/lang-en-morph.mjs --if-raw` (rewrites the shards and the dictionary
  where WordNet's raw files are; leaves them as they are in a fresh clone), so a change of k.words reaches the
  dictionary at the next build. Rerun: 13,100 lemmas (8,917 nouns, 3,364 verbs, 819 adjectives), round trip 36,059
  of 36,059 cells; inflectBy agreement unchanged (plural 96.5 %, third 99.9 %, past 95.5 %, ing 95.7 %, comparative
  and superlative 99.7 %). Tests: w.lang.en.morph 6, catalog 8, validate 5, repo 1 pass.


## 2026-11-15 — first worker: k.music, music notation as typed values (block 03:20 item 2; PSys2 Q15)

- New world `k.music` (version 1, CC0, `hand-core 1`, written by rule by the new `tools/music-core.mjs` from the note
  letters, accidentals, interval patterns and the orders of sharps and flats; no input but the tool): 3 shards, 745
  wires, 189,912 bytes, 0 warnings.
  - `k.music.note`: 35 note names as the music world writes them (`C`, `F#`, `Bb`, `F##`, `Bbb`): letter,
    accidental, pitch_class, enharmonic; spoken forms as words ("C sharp", "C-sharp", "C♯", "B flat").
  - `k.music.interval`: 16 intervals (semitones, number, quality); "tritone", "half step", "whole step".
  - `k.music.key`: 30 keys (15 major, 15 minor, up to 7 sharps or flats): tonic, mode, sharps or flats (excludes),
    signature in written order, relative, parallel, enharmonic, scale, the 7 triads by degree. Words "key of G",
    "G major key", "F sharp minor". The names are the music world's key names ("C major", "Eb major").
  - `k.music.scale`: 90 scales (major on the 15 major tonics; natural, harmonic, melodic minor on the 15 minor ones;
    major and minor pentatonic), notes in order, key.
  - `k.music.chord`: 209 chords (12 qualities on 17 roots, plus B#dim, Cb, E#dim, E#m, Fb that the keys name), named
    by chord symbol (`C`, `Dm`, `C7`, `Cmaj7`, `F#m7b5`), root, quality, notes in order. "G major" alone is the key;
    every chord word says chord, triad or another quality ("G major chord", "D minor triad", "G seventh").
- So "G's major scale" has a typed value to bind: the scale "G major scale" with `tonic=G`, `type=major`; a checker
  that binds the tonic cannot accept "D major scale" for it. Joins: 13 declared, all met (339 values).
- Measures (k.units.measure): pitch_class counts semitones above C, interval semitones, interval number an ordinal,
  sharps and flats counted. Key words block written by tools/key-words.mjs (with everyday words: notes, in, chords,
  triads, key signature).
- Not here (WORLD.md): which chord a set of notes makes (a host's match over `note`; a query names one value per
  key), inversions and slash chords, church modes, blues and chromatic scales, tempo and duration words, solfège.
- Tests: tests/k.music.test.mjs (4: shards = tool output; every reference met; theory checks: letters once per scale,
  major steps 2-2-1-2-2-2, relative minor a minor third below with the same signature, 5 chords spelt; the music
  world's key names, "key of G", "G major chord" -> G, "F sharp minor", "C sharp", "G major" is not a chord word);
  tests/k.music.questions.jsonl (12 questions from PSys2's failing rows: notes of C and G major chords, the G major
  scale, the key with 5 sharps, the relative minor of C major, sharps in E major, C7, triads of F major, ...).
  `npm run test:changed` on 6b50041: 31 files, 256 tests, 253 pass, 2 skipped, 1 fail (COVERAGE.md stale with the new
  world: `npm run reports` rerun, coverage-report 4 pass).
- Reviewer's note (clean clone): the k.animals sounds test read sources/*/raw (WordNet and the frequency lists, not in
  the repository) and failed with ENOENT. Split: the comparison with the tool's output is skipped without the raw
  files (as the importer tests do); the checks on the shards (no new animal, every sound a k.words word, the plain
  sounds) run everywhere. Checked with the frequency list moved away: 9 pass, 1 skipped.


## 2026-11-15 — first worker: currencies as typed values in k.units (block 03:20 item 3; PSys2 Q15)

- `k.units.currency` (k.units version 2; identity `code`, ISO 4217): name, name_plural, unit, unit_plural, symbol,
  narrow, decimals, minor, minor_plural, country (declared join to k.geo.country by name). New importer
  `tools/import/currencies.mjs`; raw files from Unicode CLDR 48.2.3 (currencies.json, currencyData.json; sha256 in
  sources/cldr/SOURCE.md); `LICENSE.cldr` copied into k.units.
- Shard `currencies` (cldr 48, Unicode-3.0): **153 currencies** legal tender somewhere today (153 wires, 31,835 bytes):
  USD "$" dollar/dollars, EUR "€" euro/euros, GBP "£" pound/pounds, RON leu/lei (narrow "lei"), JPY "¥" 0
  decimals; the everyday unit is the last word of CLDR's name (lower case: "Turkish Lira" -> lira).
- Shard `currency-words` (hand-core, CC0; 62 wires, 8,265 bytes; merging): minor units of 41 currencies (cent, penny/
  pence, ban/bani, centavo, kopek, paisa, grosz, öre, ...) and words for 22: slang (buck, greenback, quid, loonie),
  symbols and codes as words ($, €, £, ₹, US$, C$, R$), and the usual reading of a unit word alone (dollar -> USD,
  pound -> GBP, leu and lei -> RON, franc -> CHF, peso -> MXN, rupee -> INR, yen, yuan, euro ...). "pound" stays also
  the k.units.unit of mass: a host decides by what the number counts (written in WORLD.md).
- So "I have 14 lei" carries a typed value (unit_plural=lei of RON, minor bani) a checker can keep through a round
  trip; a "she" or "rents" is no currency word.
- Not joined: k.geo.country.currency (the PSys2 country list's names: "United States dollar", "Euro") uses other
  names than CLDR; country -> currency goes through `country` here. Measures: decimals counts digits after the point.
- Tests: tests/k.units.currencies.test.mjs (3: shards = importer output, skipped without the raw files; the common
  currencies with symbols, units, plural units, minor units, every currency used by a country; slang, symbols and
  the usual reading of unit words), 6 questions in tests/k.units.questions.jsonl. `npm run test:changed` on
  a04b993: 31 files, 248 tests, 245 pass, 2 skipped, 1 fail (COVERAGE.md stale: `npm run reports` rerun, 4 pass).

## 2026-11-15 — third worker: diagram kinds as knowledge (block 04:40, items 1-3): w.diagram, k.diagrams, cycles of nature

- **`w.diagram`** (new world schema, std.schema, 65 wires, 11,160 bytes, CC0): diagram (title, form: 10 kinds, layout:
  top_down / left_right / radial / circular / grid / overlapping / free, topic), node (label, role: 19 values, shape:
  11 values, parent, group many, n, x, y, colour), edge (from, to, label, direction forward / both / none), group
  (label, shape, parent). Acts of std.acts; limits 20 / 500 / 1,000 / 100. Found by diagram, flowchart, mind map,
  venn diagram, org chart, cycle diagram ... Session in tests/w.schemas.test.mjs (a flowchart with a decision, a Venn
  item in two sets, a wrong role refused; the pinned build does not refuse an edge without `to`: required is not
  checked by make).
- **`k.diagrams`** (new world, `tools/diagrams-core.mjs`, shard diagrams 61 wires, 15,514 bytes, CC0): 10 kinds
  (flowchart, tree, cycle, timeline, mind map, Venn diagram, org chart, network, pipeline, comparison table) with
  structure (k.kinds), layout, arranged (k.layouts: flow, tree, ring, row, radial, scatter, grid ...), edges, roles,
  uses and sources; 23 shape conventions (ISO 5807 for the flowchart: oval, rectangle, diamond, parallelogram ...);
  18 fills naming the catalog's types and keys (k.procedures.step after / n, k.kinds.parent is_a, k.parts.usual has,
  k.time.ordered next / n, k.geo.country neighbour, k.attributes.number ...); 10 works cited (Gilbreth 1921, ISO 5807,
  Venn 1880, Buzan 1974, Priestley 1765, McCallum 1855, Reingold and Tilford 1981, Sugiyama et al. 1981, Fruchterman
  and Reingold 1991, Novak and Gowin 1984). The org chart has no fill: no world says who reports to whom.
- **k.kinds**: a seventh structure `cycle` (element, next, cycle, element_of, position, start), cast for k.time and
  w.diagram (w.diagram is also graph, whole with parts, sequence, placement): structures 281 wires, 51,720 bytes.
- **Cycles of nature in k.time** (version 5): `k.time.stage` (extends k.time.ordered; identity name + cycle; is,
  about): frog (egg, tadpole, frog), butterfly (egg, caterpillar, chrysalis, butterfly), flowering plant (seed,
  seedling, plant, flower, fruit) from WordNet's glosses (cycles-wordnet, 15 wires, WordNet-3.0), the water cycle
  (evaporation, condensation, precipitation, runoff) from the USGS Water Science School (cycles-usgs, 5 wires,
  public domain; sources/usgs-water/SOURCE.md). The order rule derives 25 "before" facts; `tools/derive.mjs` now
  writes one derived shard per licence (derived-wordnet-3-0 19 facts, derived-public-domain 6; derived stays CC0)
  instead of refusing. The stage words tadpole, chrysalis, seedling, evaporation, condensation, precipitation,
  runoff were asked of the WordNet importer (ASKED): k.words 29,518 senses.
- Units: k.time.stage.n and k.diagrams.source.year are orders (tools/measures-core.mjs). Catalog 33 worlds, 1,101
  shards, 29,223 words; 0 warnings.
- Tests: new tests/k.diagrams.test.mjs (6: shard = tool output; joins to w.diagram, k.layouts, k.kinds; a shape for
  every role, ISO's for the flowchart; every fill a declared type and key with facts; **a cycle diagram of the frog's
  life cycle and a flowchart of "compose a scene" built in a w.diagram session from the facts alone**); k.time 7
  (the cycles of nature; 9 cycles; before counts); w.schemas 15 (eight schemas). `npm run test:changed` 50 files,
  434 tests: 431 pass, 2 skipped, 1 fail (COVERAGE.md stale: `npm run reports`, then 4 pass); after rebasing on
  30fd9ab (k.music) and rebuilding (34 worlds, 1,105 shards, 33,040 words): 50 files, 435 tests, 433 pass, 2 skipped;
  again on 06b4358 (currencies; 34 worlds, 1,107 shards, 33,236 words): catalog 8, validate 5, repo 1, coverage-report 4,
  k.diagrams 6, k.time 7, w.schemas 15, k.kinds.structures 6, narration 3 pass; ask-real 4,
  questions 426 pass.


## 2026-11-15 — first worker: Q64, general frames for the 29 roles; PSys2's 9 failing local frames fixed here

- New shard `w.lang.en/shards/role-frames` (CC0, `tools/lang-en-role-frames.mjs`; 278 wires, 44,298 bytes): **29
  general frames, one per role of k.actions that no general frame read**, each from the role's markers in k.actions
  (make.part "with", make.material "out of/from/made of", make.topic "about", change.old value "from ... to",
  change.replacement "replace ... with/by/for", place.direction "towards", place.source "from ... <prep>", connect.tool
  "using/by means of/by/with", group.target/group/criterion "with", "into", "by", take apart.parts/source/tool
  "into", "from/off", "with/using", pick.source "from/out of/among", pick.other "over/instead of/rather than",
  ask.other "compare ... with/to/and", copy.place, send.means "by/via/through", send.format "as", undo.thing/number/
  state, save.thing/place, load.source, redo.thing/number, deselect.thing); 2 role maps (change old -> "old value",
  copy rel -> place). **Roles of k.actions no general frame reads: 29 -> 0 of 57** (the test now requires 0).
- **For PSys2 (delete these from src/lang/en.local.mjs; they live here now, same names):**
  `acts.facts.ask.what.in.lead` (the thing before "is", as its example says), `acts.media.m.pick.play.bare` ("play"
  is one of its words), `acts.media.m.pick.again` (priority 13 -> 15, over acts.media.m.pick.play),
  `acts.media.m.pick.play.kind.of` (7 -> 15, over acts.media.m.make.melody.colon; a closing "please"),
  `acts.media.m.pick.play.kind.bare` (6 -> 15), `acts.text.make.blank` (12 -> 13, over acts.text.make.kind),
  `acts.text.make.numbered` (12 -> 14, over acts.text.make.text), `acts.text.make.blank.at` (13 -> 14),
  `acts.facts.layer.on.want.pin` (13 -> 15, over acts.facts.layer.on.pin.verb). The import leaves them out
  (`MOVED_HERE`; IMPORT.md says so); the 07:40 test checks that each is published here.
- Priorities chosen so no other frame lost its example: acts.change.replace 11 (below the chart's swap-for frame),
  acts.save.thing and .place 10 (acts.save keeps "Save it as lunch" by its literal "it"), undo.thing and redo.thing 9
  (acts.undo keeps "Undo that"). tests/w.lang.en.frames.test.mjs: 386 frames, 370 read their example best, 11 tie,
  5 known (the chart frames; was 14 known); new test: the shard is the tool's output, 29 roles, 9 moved frames.
- tests/w.lang.en.test.mjs: the join of frame roles to k.actions follows mode_map (a frame of group in the mode apart
  names roles of take apart), and the 07:40 comparison skips the moved frames after checking they are here.

## 2026-11-15 — third worker: arrangement phrases in w.lang.en (block 04:40 item 4)

- `w.lang.en.arrangement text= layout= relation= inverse= direction= diagram_layout=` (new type, exported; shard
  hand-arrangements, 58 phrases, 9.5 kB, CC0): in a circle / ring / clockwise -> ring, circular; in a grid / in rows
  and columns -> grid; in a row / side by side -> row; in a column / one above the other -> column; evenly / equally
  spaced -> evenly_spaced; left to right -> row, left_of, left_to_right (right to left: inverse=yes); top to bottom ->
  column, above; stacked, in a pyramid, scattered, at random, in the corners, around the centre, one inside the other
  (nested, around inverse), step by step (flow), along the edge (border), overlapping (a diagram layout only).
  `layout` is a declared join to k.layouts.layout (JOINS-REPORT regenerated); a relation named with an arrangement is
  one that arrangement has in k.layouts.
- Tests: new tests/w.lang.en.arrangement.test.mjs (3: joins to k.layouts and w.diagram; the reviewer's phrases; a
  phrase for every repeating arrangement and for tree, radial, corners, border; every w.diagram layout asked by a
  phrase and used by a k.diagrams kind). `npm run test:changed` 39 files, 255 tests, 253 pass, 2 skipped; after
  rebasing on 7855ca2 (29 general frames) and rebuilding: catalog, validate, repo, w.lang.en.arrangement 3, closed 3,
  morph 6, w.lang.en 22, frames 3, joins-report 3, coverage-report 4 pass.

## 2026-11-15 — third worker: full suite at the end of the round

- `npm run test:all` on 7c7738f: 79 files, 3,093 tests, 3,085 pass, 0 fail, 8 skipped, 430 s. Slowest (`npm run
  test:slow`): questions 41.4 s, derived 39.3 s (2.9 GB), k.objects.render 30.7 s, k.objects.names 29.9 s,
  k.attributes 28.2 s; no file of this round over 30 s (k.diagrams, w.lang.en.morph 3 s, w.lang.en.closed and
  arrangement under 1 s).

## 2026-11-15 — second worker: the scene things with no drawing of that name (reviewer 04:10, item 1)

- The 89 values of `k.scenes.has.thing` that named no k.objects object, each mapped and looked at next to its scene
  (`sources/coverage/hand-links.tsv`, the one home of hand links, written to `k.objects/shards/words-hand` and
  `stand-ins-hand` by `tools/coverage.mjs`): **21 the same thing under another name** (core.word: beach ball ->
  "ball beach", cable car -> "mountain cableway", fuel truck -> "petrol tanker", carousel -> "merry go round",
  barrier -> "construction", ladybird -> "lady beetle", globe -> "globe showing Europe-Africa" ...), **59 the
  nearest drawable kind, marked as a `k.objects.stand_in`** (38 people by `person`; control tower by tower, lamp post
  and street lamp by lamp, pirate ship and shipwreck by ship, dune by hill, moat by ditch, runway by road, stall by
  shop, sandbox by box, snowball by ball, windsock by flag, firefly by beetle, crow by "black bird" ...), 5 already
  linked (child, flowers as words; counter, farmhouse, puddle, trapeze as stand-ins), and **4 with no drawable kind,
  left without a drawing** (stage, till, diving board, mobile: WordNet's kind of a mobile is a sculpture, which would
  draw a statue on a nursery ceiling). WordNet's link globe -> Earth is refused in not-links.tsv (the thing is the
  model). "performing arts" (theatre masks) is now the thing `theatre masks` drawn by "performing arts".
- **Why the join is re-targeted, not only filled**: sopworld checks `type=T by=k` against the wires of exactly `T`
  (`byType`, no subtypes), so a stand-in or a word can never close a join to `k.objects.object`. `has.thing` names a
  thing of the scene, not a drawing; it now joins `k.scenes.thing` (`type=k.scenes.thing by=name`), and the 86 scene
  things without a place and size got one (`sources/hand-core/place-size.tsv`, named=model). The drawing is the
  declared join `has.drawing` -> k.objects.object, now on 1,081 of 1,088 facts (was 1,062; the 7 without: the 4 above
  and the "=-" things pipe, ring, seat). k.scenes version 3.
- Numbers: JOINS-REPORT `k.scenes.has.thing` 595 of 595 meet (was 506), all declared joins 5,568 of 5,639 values
  meet (98.7 %, open 160 -> 71), 0 broken; k.objects stand-ins 159 drawings (was 144; stand-ins-hand 140 wires,
  14,700 bytes; words-hand 33 wires, 4,484 bytes); k.scenes.thing 2,394 things (was 2,308); scenes 99.4 % drawn (was
  97.6 %); k.scenes loads in 0.33 s with 0 open joins of `thing`. MISSING.md: hand stand-ins 72 -> 79, words 27 -> 28,
  no drawing at all 368 -> 360 of the 1,500 most frequent nouns. 23 scene previews redrawn.
- Tests: tests/k.scenes.test.mjs: a thing may also be a word of an object or one of the 4 listed things nothing
  draws; new test that every `has.thing` is a k.scenes.thing, the things without a drawing are exactly the 4 (and the
  "=-" objects), and the loaded world reports no open join of `thing`.
  tests/k.layouts.test.mjs: the pirate ship is no longer a thing without a drawing (the stall is: its stand-in, the
  shop, has no anchor). COVERAGE.md and ASPECTS.md regenerated (`npm run reports`). Note: "mobile" is a hand word of
  the phone, so the vocabulary sends the nursery's mobile to the phone.

## 2026-11-15 — second worker: every capital is a k.geo city (reviewer 04:10, item 2)

- The 10 capitals that were no k.geo city: Natural Earth (1:10m populated places, 5.1.2) has **none of them under that
  name**; it has three of the very places under another (Agana for Hagåtña, Papeete for Papeetē, its point "Grand
  Turk" at 21.47, -71.14 for Cockburn Town, the town named after its island: each marked `Admin-0 region capital` of
  that territory, which the import checks), marks a neighbouring place or the island for four (Grytviken for King
  Edward Point, Atafu for Fakaofo, Capitol Hill for Saipan, Melekeok for Ngerulmud: Q33 kept the list's), counts
  El Aaiún in Morocco (Laayoune), and has no place for Diego Garcia or the City of Victoria (its "Hong Kong" point
  is in Kowloon). So, keeping each fact in the shard of its licence (tools/import/geo.mjs):
  - the 3 same places: the country's `capital` names Natural Earth's city, the list's spelling is a `core.word` for
    it, and the city's `capital_of` is said by a wire of the list (borders shard, ODbL) that merges with Natural
    Earth's city (`CAPITAL_SAME_PLACE`);
  - every other capital the list gives (for the 40 territories Natural Earth marks none for, and for the list's
    countries Natural Earth's 1:50m countries lack: Western Sahara, Tokelau, Réunion, Gibraltar ...) is a
    `k.geo.city` with `capital_of` in the list's borders shard: it merges with Natural Earth's (or a PSys2 shard's)
    city of that name, or is the list's own city, with name and country only (37 such: Diego Garcia, King Edward
    Point, Fakaofo, El Aaiún, Ngerulmud, City of Victoria, Saipan, and 30 that other shards place).
- Numbers: `k.geo.country.capital` 262 of 262 values meet a city (was 252); `k.geo.city.capital_of` 245 of 245;
  59 new wires in the 6 borders shards (291 wires, 48,459 bytes); k.geo loads in the same time, 0 open joins of
  `capital`. Declared joins in all: 189 in 30 worlds, 6,286 of 6,347 values meet (99 %), 0 broken.
- Tests: tests/import.geo.test.mjs (stats `citiesFromList`; a list capital that is no place of Natural Earth becomes
  the list's city in the borders shard and not in the public-domain one); tests/k.geo.test.mjs new test: every
  capital of every country is a city whose `capital_of` is that country, no open join of `capital`, the three words,
  the seven list cities have no coordinates. Docs: k.geo/WORLD.md, sources/countries/SOURCE.md.

## 2026-11-15 — second worker: k.units month, decade, century (reviewer 04:10, item 3)

- `k.units/shards/core`: three time units with their factor to the second as the year here is (the Julian year,
  365.25 days): **month** 2,629,800 (a twelfth of the year, the mean month of 30.44 days), **decade** 315,576,000,
  **century** 3,155,760,000; no symbols (none is standard); words for the plurals (months, decades, centuries).
  50 units, 108 wires, 14,244 bytes.
- The join `k.time.duration.unit` -> `k.units.unit` closes: 9 of 9 values (was 6); all declared joins 6,289 of 6,347
  values meet (99.1 %, open 58), 0 broken.
- Tests: tests/k.time.test.mjs new test: every unit a duration is told in is a k.units unit, and where the duration's
  name is a unit too, count x factor equals its factor (exact counts to 1e-9: a year is 12 months, a decade 10 years,
  a century 100 years, a week 168 hours ...; `count_about` within 10 %: a month is about 30 days, about 4 weeks, the
  latter 8 % short); 3 questions (un-t1 to un-t3: a century in seconds, what a month measures, a decade in seconds).

## 2026-11-15 — third worker: diagram edit frames in w.lang.en (block 06:00 item 1; PSys2's DIAG-GAP)

- New shard `w.lang.en/shards/diagram-frames.sop` (73 wires, 16,062 bytes, CC0; `tools/lang-en-diagram-frames.mjs`, now
  a step of `npm run build`): 9 frames, 4 lexicons, 2 role maps.
  - Layout direction (place/layout, thing, direction): acts.place.layout.go "Make the arrows go left to right." (15),
    .should "The arrows should go from top to bottom." (14), .dir "Lay the flow out left to right." (14), .flow "Flow
    from left to right." (13, thing fixed "everything"). Direction = lexicon `diagram.direction`, derived from the
    arrangement phrases of a row/column in one direction with diagram layout left_right/top_down (14 phrases); 4 new
    arrangement phrases (downwards, upwards, down the page, across the page; 62 in all).
  - Edge labels (change/set, attribute=label fixed): acts.change.label.edge "Call the arrow yes." (15; label, call,
    name, mark, title, caption, tag + an edge word of w.diagram), .edge.ends "Label the arrow from A to B no." (16; the
    thing is "arrow from a to b": two role maps put the ends into the thing), .edge.on "Write yes on the arrow." (15).
  - A diagram of a kind about a topic (make, kind, topic): acts.make.diagram "Make a flowchart of making tea." (13),
    .diagram.bare "A cycle diagram of the four seasons." (4: under the statement frames; at 12 it took "The cycle of
    a week is week." from acts.state.of, found by the phrasing test). Kind = lexicon `diagram.kind`: the 10 kind names
    of k.diagrams and 38 new words for them in k.diagrams' schema (`core.word ... of=k.diagrams.kind.name`: hierarchy
    and tree diagram -> tree, concept map -> mind map, organigram -> org chart ...).
- New tests/w.lang.en.diagram-frames.test.mjs (6): 40 requests (26 of the gap set, 14 paraphrases) read back to the
  intended act and roles in a diagram world; directions map to k.diagrams layouts, kinds to k.diagrams kinds, the edge
  label to w.diagram.edge `label`; "Call yourself Robi" stays acts.change.call; the lexicons are the tool's output.
  Frames test: 395 frames, 379 best (was 370 of 386), 11 tie, 5 known. Variants regenerated (none of the new frames is
  a variant).
- **For PSys2:** the gap set's arrangements dg02/03/06/08/10 ("put them in a circle/grid/row/column") are already read
  by w.lang.en's acts.place.layout (it takes the verbs of place); their failure is the host's routing to the avatar
  world, not a missing frame. "make the arrows go left to right" (dg19), "call the arrow yes" (dg49) and the 15 kind
  requests (dg21-35) now have frames here.
- `npm run test:changed` on the rebased tip (0b0f1af): 24 files, 147 tests, 147 pass.

## 2026-11-15 — second worker: given names that are also common words need a person context (reviewer 04:10, item 4)

- `k.people.given_name.context=person` (k.people version 5): on **49 of the 2,990 names**, by a rule of
  tools/import/given-names.mjs over the published catalog (no list by hand): the lower-case name is the name of a
  thing of another world (25: Robin, Jay, Iris, Tea, Basil, Guy, Daisy, Lily, Violet, Rose, Jasmine, Margarita, Tuba,
  Marina, Line, April, May, June, August, Dawn, Kelvin, Amber, Ruby, Jade, Angelique), not counting the places of
  k.geo (a river James, a city David or Charlotte: there the person's name comes first), or a word of k.words with at
  least three senses that are no person (24: Hope, Mark, Job, Roar, Bob, Grace, Frank, Rein, Rut, Rick, Art, Faith,
  Odd, Jack, Gay, Carol, Crystal, Hazel, Aura, Bent, Dolly, Edit, Kitty, Sally). Tom (2 senses, a male cat or turkey),
  Ana (1), Leo (the constellation, capitalised in WordNet), Zoe carry no flag. "Cliff" is none of the 2,990 names.
  The flag's wires carry `core.source="hand-core 1"` after Wikidata's (the rule is ours); shard headers name both.
- **The vocabulary index supported no priority, so it got the least one**: tools/build-catalog.mjs lists, for each
  word, the shards it reaches only through a reading that needs a context (a fact with `context=person`) after its
  other shards; the rest stays sorted (README.md says so). `vocab.json` "rose": 19 shards of the flower, the colour,
  the dictionary, then `k.people/shards/given-names-r`; "hope", "may" likewise. Nothing else moved.
- A reader's rule as a reference (`readsAsName` in the import): a flagged name is the name only with no determiner
  before it (w.lang.en's closed-class determiners) and a person context: a capital inside the sentence, a person noun
  before it, a form of "be" and a person noun after it (k.words: first noun sense under noun.person), or a verb a
  person does after it. Tested: "a rose" -> the word; "Rose is my friend" -> the name; "I gave Rose a rose" -> name,
  word; "my friend Rose likes tea" -> name; "Hope is good" -> the word; "Hope said yes" -> the name; "Tom is here" ->
  the name (no flag).
- Numbers: 26 shards, 2,990 wires, 494,812 bytes (was 489,605). Docs: k.people/WORLD.md, docs/worlds/README.md,
  sources/given-names/SOURCE.md. Tests: tests/k.people.given-names.test.mjs new test (flags, sources, the reader's
  rule on the sentences above, the order in vocab.json).


## 2026-11-15 — first worker: drawables for frequent catalog lemmas (block 03:20 item 4; PSys2 Q15, dice and live check)

- What PSys2 saw, by cause: **"Add a ship" drew the red boat** although `ship` has a drawing (Noto u1f6a2): the
  hand-written word `k.objects.word.boat` had `text=ship`. A test now refuses a hand-written word of a drawing that
  names another drawing; **20 such words taken out** of the hand shards (ship and sailboat of boat, kitten of cat, hill
  and mountains of mountain, laptop of computer, telephone of phone, lorry of truck, cooker and stove of oven,
  luggage, books, houses, boots, socks, chicken, saturn, postbox, airplane, aeroplane). **"Add a thermometer"** was
  not understood by PSys2's reader, but the drawing exists (Noto u1f321, since 2026-11-13): a host-side gap, nothing to
  add here. **"Add a cottage"** gives the house "drawn as a house": the stand-in works as meant. **"Add an arrow"**
  had no drawing (the word was only a CLDR keyword of "bow and arrow", "envelope with arrow", "mobile phone with
  arrow"): OpenMoji's right arrow (27A1) is now the object `arrow` (`CHOSEN` in tools/import/openmoji.mjs; part
  named; place-size row small; openmoji shards re-split, 115 objects). "Add a kitty" drew the money bag: `kitty` is a
  CLDR keyword of it; keywords are search words, not names (WORLD.md says a host takes a name or stand-in first).
- New `tools/stand-ins-kinds.mjs`: common things with no drawing at all get a `k.objects.stand_in` by their parent
  one step up in k.kinds (dimension kind) that is an object, from the hand worlds' kind facts (shard
  `stand-ins-kinds`, CC0, 10) or a WordNet edge of the sense kept for a drawable class (`stand-ins-kinds-wordnet`, 5):
  beret -> cap, buzzard/condor/stork -> bird, cape/cloak -> coat, gingerbread -> sweet, goulash/hummus/sauerkraut ->
  dish, gravy/guacamole -> sauce, headset -> telephone receiver, mall -> building, pike -> fish. Refused: two steps
  (tuba -> bass -> the fish), hammock (sense kept: the hill), grill (sense kept: the restaurant). The other 318 common
  things with no drawing have no drawable parent one step up; MISSING.md is unchanged (coverage.mjs counts its own links).
- Tests: tests/k.objects.drawables.test.mjs (4: shards = tool output, skipped without the raw files; every stand-in
  drawn by an object and none has a drawing of its own; no hand word names another drawing; ship, thermometer, arrow
  drawn, cottage and stork by their kind).
  coverage.test counts the stand-ins of its own shard by id (stand-ins-kinds-wordnet is the new tool's); drawn-colour
  regenerated (the arrow is black).


## 2026-11-15 — first worker: end of round (block 03:20 items 1-4, Q64)

- Commits: e6d0cc9 (animal sounds), 2808dc0 (k.music), a04b993 (raw-file skip, reviewer's note), 06b4358 (currencies),
  7855ca2 (Q64 frames), c9572dd (drawables), c387cc3 (Q67, Q68, lessons).
- Full suite on c387cc3 (`npm run test:all`, files one at a time): 81 files, 3,111 tests, 3,109 pass, 0 fail, 2
  skipped, 492 s. Slowest: derived 57 s, questions 39 s, k.cores 31 s, k.attributes 30 s, gallery 29 s (unchanged by
  this round's work; derived and k.cores are over 30 s as before).
- Order: item 4 (drawables) was done after Q64 because the second worker had the k.scenes stand-ins in flight in the
  same files (stand-ins-hand, MISSING.md); its push came first, and the stand-ins here do not overlap its 59.

## 2026-11-15 — third worker: established terms in the WORLD.md files (block 05:25; 06:00 item 2)

- One paragraph each, "Established term(s)", with one reference checked against its source (publisher page, DOI
  record or the paper) and how this model differs; no world or type renamed:
  - k.procedures: HTN methods, SHOP2 (Nau et al. 2003, JAIR 20, 379-404, doi:10.1613/jair.1141; checked in the paper:
    methods decompose a compound task into partially ordered subtasks, planned in execution order, depth-first
    backtracking). Differs: bindings over knowledge facts; std.plan keeps one method per goal by rank and does not
    backtrack over methods (only `choose` is searched); depth 3, 200 acts.
  - k.genres, k.story, k.interest: NLG pipeline of Reiter & Dale (2000, CUP: document planning = content determination
    and document structuring; microplanning; surface realisation). k.genres: fixed structure per genre, not built from
    discourse relations. k.story: story grammars (Rumelhart 1975 rewrite rules, recursive; Mandler & Johnson 1977, Cog.
    Psych. 9(1), 111-151); differs: flat, 11 elements and 21 constraints, generation not parsing. k.interest: Silvia
    2005 (Emotion 5(1), 89-102: novelty-complexity and coping potential) as content determination; differs: computed
    from facts, relevance and penalty added, a weighted draw.
  - k.kinds (structures): structure mapping, Gentner 1983 (Cognitive Science 7(2), 155-170: relations, not attributes;
    systematicity). Differs: structures declared by hand, alignment role by role, no higher-order relations.
  - w.lang.en: alternations as transformations, Harris 1957 (Language 33, 283-340: a mapping between sentence forms
    that keeps co-occurrence restrictions); differs: directed to the canonical form, over spans, some by word.
    Templates as surface realisation (Reiter & Dale 2000); differs: templates with slots and morphology, the stages
    between are the host's.
  - k.diagrams already cites its sources (Gilbreth, ISO 5807, Sugiyama et al., Reingold and Tilford ...): unchanged.
- Two pages could not be opened (permission not answered in time): the SHOP2 PDF at jair.org (read instead at
  artlab.unist.ac.kr) and the CL review of Reiter & Dale at aclanthology.org (the LINGUIST List review was read).

## 2026-11-15 — second worker: the k.objects `of` joins and the library's indexed check (reviewer 04:10, item 5)

- The library indexes the `type= by=` check since **0.107.0** (its CHANGELOG: "From the reviewer's 04:05 entry
  ([KNOW] Q66) ... checked by a lookup in the index per (type, key, value)"; 0.109 makes quoted and bare one name).
  Our pin is still **0.97.0** (AGENTS.md: the pin moves only when the reviewer says so).
- Measured (k.objects, 27,902 parts, 2,211 objects; `fullWorld` with the schema patched in memory; the 0.113 build
  of the library at e9940e4 in a scratch folder, nothing of it committed): pinned 0.97 undeclared 16.4 s, declared
  22.8 / 25.0 s on a quiet machine (+7 to +9 s), 38-40 s against 20-31 s under a load of 4.5; 0.113 undeclared
  16.3 s, declared 17.6 s on a quiet machine (+1.3 s, +8 %), under load within the noise (26.7-29.4 s both ways).
  Every one of the 2,212 `of` values meets an object (0 open) in both builds.
- So: **`k.objects.skeleton.of` is declared** (`type=k.objects.object by=name`; no skeleton is published, 0 values,
  no cost; k.objects version 6); **`k.objects.part.of` stays undeclared** until the pin moves, its reason in
  tools/joins-report.mjs now carries these numbers; **Q69 [PIN]** asks the reviewer to move the one build to 0.113
  (or at least 0.107), after which the declaration is one `type=k.objects.object by=name` on the slot.
- Declared joins: 190 in 30 worlds, 6,294 of 6,352 values meet (99.1 %), 0 broken.
- Full suite of the round (`npm run test:all` on 094c411, the tip of this round before the last rebase): 81 files,
  3,111 tests, 3,105 pass, 0 fail, 6 skipped, 490 s. Lessons of the round appended to docs/lessons.md.

## 2026-11-15 — third worker: full suite at the end of the round

- `npm run test:all` on c7333aa: 81 files, 3,111 tests, 3,103 pass, 0 fail, 8 skipped, 444 s. Slowest (`npm run
  test:slow`): derived 42.0 s (2.9 GB), questions 41.7 s, k.attributes 32.3 s, k.cores 25.6 s, gallery 25.5 s; the
  files of this round are under 1 s (w.lang.en.diagram-frames 0.5 s; w.lang.en.frames 2.6 s).


## 2026-11-15 — first worker: keywords as their own relation (Q67 b; block 07:15 item 1)

- **Schema change for hosts (k.objects version 7):** the CLDR, OpenMoji and Mulberry keywords of a drawing are no
  longer `core.word … means=<object> of=k.objects.object.name` but
  `@<id>.keyword k.objects.keyword of=<object name> text=<keyword> text=…` (new type, exported; `of` a declared join
  to `k.objects.object` by name, `text` repeated). A keyword is a search word, not a name: the engine's word reading
  never resolves it. Hosts (PSys2, the library) take, in order: the object of the word's name, an object the word is
  a `core.word` of, a stand-in of that name, and only then an object the word is a keyword of (`tools/objects-lookup.mjs`,
  `drawingFor`). In `vocab.json` a shard reached only through a keyword comes after the word's other shards ("ship":
  the ship's shard before the anchor's); `vocab-kinds.json` files it under `k.objects.keyword` (was `k.objects.object`).
  The `core.word` facts of k.objects (hand-written, WordNet synonyms) are unchanged: those are words for the object.
- Library form: the pinned 0.97 reads every `core.word` as a synonym and ignores extra keys (src/resolve.mjs,
  readtypes.mjs, knowledge.mjs, interpret.mjs), so `core.word … role=keyword` would still draw the anchor for "a ship";
  the dedicated type is used meanwhile and asked as Q70 [LIB].
- Importers: tools/import/objects.mjs (OpenMoji, Mulberry) and tools/import/noto-emoji.mjs (CLDR) write the keyword
  facts. Rerun before the change: no diff. After: 278 shards, 1,509 wires replaced one for one (CLDR 802, Mulberry
  634, OpenMoji 73), 5,326 keyword texts, 2,088 distinct; no other line changed.
- Counts (tests/k.objects.keywords.test.mjs, 3 tests): of the 5,326 keyword texts, 1,499 now resolve before any
  keyword: 1,270 to a drawing's own name (Q67 counted 1,266 before the arrow and others were drawn), 160 to a word of a
  drawing (kitty -> kitten), 69 to a stand-in; 3,827 resolve only as keywords (gobble -> turkey). No `core.word` of an
  object comes from an image library; every keyword's `of` names an object; the engine's `world.words()` over a shard
  has no keyword text.
- Stand-ins by kind (tools/stand-ins-kinds.mjs) counted keywords as "drawn"; no longer: paella -> dish is new (it was
  hidden behind a keyword); barrel -> tube (the gun's barrel, the sense kept) is refused in `NOT_MEANT` (a drawn
  barrel is a cask). 16 stand-ins (CC0 13, WordNet 3). No scene thing relied on a keyword (k.scenes test unchanged).
- Load of k.objects (fullWorld): 31.0 s with the `of` join declared, 28.9 s without (+2.1 s for 1,509 values, the
  Q66 scan); kept declared as the stand-in's is.
- Build: k.attributes narration (2 slots, machinery), same-p (paella in k.objects.stand_in), relations-objects and
  JOINS.md (k.food–k.objects 143), vocab files regenerated. Key words: `keyword`, `keywords` for the type; `of`, `text`
  by rule. Docs: k.objects/WORLD.md, worlds/README.md (vocab order and kind).

## 2026-11-15 — third worker: the order criterion of make, place and group (block 07:45 item 1)

- Real row: the owner's diagram complaint; PSys2's DIAG-GAP dg30, dg31 ("a timeline of the planets by distance (from
  the sun)") were read with the criterion inside the topic ("planets by distance").
- k.actions: make has a role `criterion` (holds attribute; markers by, in order of, according to), place too (in order
  of, according to; not "by", which marks how far: "move it by 2"), group's criterion also takes in order of. 59 roles
  (was 57). w.lang.en hand-joins: the preposition "in order of" (rel by, role criterion).
- The join to the attributes: k.attributes has words for 11 attributes (`core.word ... of=k.attributes.attribute.name`:
  "distance from the sun", "how far", "how big", "how heavy", "number of legs" ...); w.lang.en's lexicon
  `order.criterion` (30 items) is derived from them and the names of the attributes that hold a number, a size or a
  step of a scale (tools/lang-en-diagram-frames.mjs, in npm run build). `k.attributes.found` then says where each is
  found (distance: k.space.body.distance_about).
- Frames: acts.make.diagram.order (14) and .order.bare (5) in the shard diagram-frames (97 wires, 21,902 bytes);
  acts.make.by (13, "Make a list of the planets by size.") and acts.place.order (13, "Line up the planets in order of
  size.") in role-frames (31 role frames, 46,780 bytes). "sorted by", "ordered by", "ranked by" ... are frame words.
- Tests (tests/w.lang.en.diagram-frames.test.mjs): 10 requests read with their criterion (dg30, dg31 now topic
  "planets", criterion "distance" / "distance from the sun"); "make a picture by the window" and "move it by 2" have no
  criterion; every lexicon word is an orderable attribute found in a world; the 8 planets sorted by distance_about
  are k.space's `order` 1 to 8. Frames test: 399 frames, 383 best, 11 tie, 5 known; 0 of 59 roles without a general
  frame.
- Templates (shard templates-acts, 37): make.topic.criterion ("Make a timeline of the planets by distance."),
  place.criterion ("Line up the planets in order of size."), group.criterion ("Sort the planets by size."), each read
  back by its frame; roles no template says: 27 (was 29; make.topic is said now too).

## 2026-11-15 — third worker: the kind after the topic (block 07:45 item 2)

- "draw the planets in order of distance from the sun on a timeline" read as make, kind "planets in order of distance"
  with material "sun on a timeline"; "put the parts of a car in a tree" as a layout of the parts.
- Four frames in the shard diagram-frames (140 wires, 32,294 bytes): acts.make.diagram.after (14: show/make verbs, on
  or in, a kind that names no drawing), .after.as (14: as, in the form of, any kind), .after.of (14: show, make or
  arrange verbs, a topic head that names the nodes of a fill, then any kind; role maps for "of" and the whole),
  .after.order (15: with an order criterion, any kind). Word parts may now carry `act` (frameLines), so "draw" and
  the other verbs of make come from k.actions.
- Lexicons (derived or joined): diagram.kind.only (all 49 kind words but tree, which names a k.objects drawing),
  diagram.topic.head (14 nouns, each joined to a k.diagrams.fill type: parts -> k.parts.usual, steps ->
  k.procedures.step, stages/seasons -> k.time.ordered, kinds -> k.kinds.parent, cities -> k.geo.city ...),
  diagram.topic.of.
- Tests: 13 requests (10 read as make with topic and kind after it; "draw a bird in a tree" stays a bird in a tree,
  "put the boxes in a tree" and "put the nest of the bird in a tree" stay layouts); every topic head's type fills a
  kind of k.diagrams. Frames test: 403 frames, 387 best, 11 tie, 5 known.

## 2026-11-15 — third worker: single-letter node names (block 07:45 item 3)

- "connect A to C" read as connect, thing "to c" (A the article); "connect box A to box C" did not read (a thing may
  not end in a determiner).
- tools/lib/lang-en.mjs (the reference reader): a capital single letter after a word of the lexicon
  `name.letter.after`, or after another such name, is a name: only a role's words take it (no determiner, verb, word
  or lexicon part), and a thing may end in it. Not the first word, not "I", not a lower-case letter. The names move
  with their words in the particle-shifted forms.
- w.lang.en lexicon name.letter.after (21 words: connect, join, link, from, to, between, and, or, with, called, named,
  point, step and w.diagram's words for a node and an edge), derived in tools/lang-en-diagram-frames.mjs (shard
  diagram-frames 141 wires, 32,923 bytes).
- Tests: 12 requests (connect A to C, B to A, A To C, box A to box C, the box A to the box C, label the arrow from A to
  B no, the line between A and B; and three where "a"/"A" stays the article); a reader without the lexicon reads as
  before.


## 2026-11-15 — first worker: one home for a country's currency (Q68; block 07:15 item 2)

- **Schema change for hosts (k.geo version 6):** `k.geo.country.currency` is gone (slot, its words "currency" and
  "money", and 246 values of the PSys2 country list in `psys2-countries`, ODbL). The currency of a country is
  `k.units.currency` read backwards: `k.units.currency` where `country=<k.geo country name>` (a declared join), e.g.
  France -> EUR "euro", Japan -> JPY "Japanese yen". No derived shard: the query answers it.
- tools/import/psys2.mjs no longer takes the list's `cur` (it is run once: the demo deleted its copies, so the shard
  was edited by the same rule, header and FROM-PSYS2.md row too). tools/ranges-core.mjs: `currency` no longer a typical
  attribute of a country (typical.sop 142 wires); the build regenerated narration (no currency row), relations-geo
  and the vocabulary ("currency" and "money" now lead to k.units only).
- Questions: geo-p1 ("what is the currency of Japan", k.geo) dropped, as un-c5 asks it of k.units; un-c7 "what is the
  currency of France" (k.units, euro) added. tests/import.psys2.test.mjs: no country has a `currency` key.
- Docs: k.units/WORLD.md (the one home), k.geo/WORLD.md, the k.geo schema comment.

## 2026-11-15 — third worker: full suite at the end of the round (block 07:45)

- Commits: ca5d4aa (order criterion), c9864d6 (kind after the topic), 009dc3f (single-letter names).
- `npm run test:all` on 009dc3f: 82 files, 3,118 tests, 3,110 pass, 0 fail, 8 skipped, 445 s. Slowest: derived 65 s,
  k.attributes 41 s (both over 30 s, not touched by this round), k.cores 28 s, gallery 26 s, questions 24 s;
  w.lang.en.diagram-frames 1.0 s.
- Note: 009dc3f was rebased onto 0463758 (worker-tasks.md only) after its test:changed and pushed before testing that
  tip again; the full suite above is on that tip.
- Open: "connect a to c" in lower case still reads "a" as the article; "link A with D" reads D as the tool (an older
  frame, acts.connect.tool, outranks acts.connect for "with"); "put the parts in a tree" is read as a diagram of
  parts, a host with parts already drawn should take the layout reading that comes next.


## 2026-11-15 — first worker: the parts of a thing as a diagram fill (block 07:30 item 1; PSys2 Q17 (1))

- Coordinator relay of the owner decision (07:30): the "more animal sounds" item (07:15 item 3) is dropped (no real
  row asks for it); the 07:30 diagram items follow items 1 and 2.
- `k.diagrams.fill` for `k.parts.whole has` (topic `name`) as a tree and as a mind map: "a tree of the parts of a car"
  had no fill (only `k.parts.usual`, 432 animals and simple things, filled trees); `k.parts.whole` has 307 things
  with WordNet's parts (car: 29, accelerator to window). tools/diagrams-core.mjs: 20 fills (was 18), shard 63 wires,
  15,997 bytes, CC0. Test: tests/k.diagrams.test.mjs (7, +1: both fills, the car's parts through the fill).

## 2026-11-15 — second worker: the one build moved to sopworld 0.113.0 (05d2f93; reviewer 08:00, Q69)

- `tools/sopworld/sopworld.mjs` = the library's `docs/sopworld.mjs` at 05d2f93 (release 0.113.0, build
  7bafaf2c0cdd, sha256 6b9e8ce4...; unchanged at the library's tip 176fefc); VERSION, the validate test, AGENTS.md,
  README.md, docs/index.html, docs/worlds/README.md, w.lang.en/WORLD.md and the alternations test's comment name it.
- `npm run build` (125 s): nothing changed but the catalog's sopworld commit and content hash (34 worlds, 1,112
  shards, 33,312 words, 0 warnings, 0 errors).
- `npm run test:changed` (the build touches every test that imports it: 79 files one at a time, catalog 8 and
  validate 5 included): 3,108 tests, 3,102 pass, 0 fail, 6 skipped, 473 s. No test changed behaviour.
- One behaviour change of the library that no test sees: since 0.107/0.109 a quoted atom and the bare atom are one
  name in joins and matching; the joins report still compares token for token and says that sopworld does. It
  changes no number today (0 of the 58 open join values would meet once folded). Recorded as **Q70 [LIB]**, not
  patched.

## 2026-11-15 — third worker: Q69 item 1, the nouns of PSys2's real Romanian turns (reviewer 09:00)

- Measured with the library's tools/bench-ro-frames.mjs (0.117.0, read-only clone in /tmp; its repos.pin pointed at
  this clone's commit): 161 real turns. Before (a1d1d11): read 93, act 74, act and thing 38. After: 93, 74, **55**.
- tools/lang-ro-core.mjs: 14 nouns with senses (270 lemmas, was 256): crocodil, minge, capră, rață, iarbă, fetiță ->
  girl, bunic, vilă -> villa.noun.2, leagăn -> swing.noun.2, masă -> table.noun.2 (class f.ă.e: mese), baltă -> pond,
  măgar -> donkey.noun.2, maimuță, vițel; irregular plurals ierbii/ierburi and viței. pământ -> ground.noun.1 (was the
  planet; the real turn is "muta casa pe pamint"). pește was there.
- dictionary-unimorph regenerated from the raw file (copied from psys2 ea2b29e7, git-ignored): 3,458 lemmas (6 now
  hand rows).
- Test (tests/w.lang.ro.test.mjs): each real-turn noun has a k.words sense whose English word is a drawing, animal,
  scene thing or kind of person (vocab.json), and 14 forms of the turns read to their lemma (crocodilii, iarba,
  ierburi, rata, leagan, mesele, baltile, vitei ...).
- Not reached by item 1: "muta crocodilii in lac" stays "act" only because the bench stems the gloss "crocodiles" to
  "crocodil" (a library matter).

## 2026-11-15 — third worker: Q69 item 2, "și" as a focus word

- Bench (161 real turns): 93 / 74 / 55 -> read **100**, act **83**, act and thing **63**.
- tools/lang-ro-frames.mjs: phrase group `focus` (și, de asemenea, tot), an optional part after the verb (and the joined
  clitic) in ro.make, .make.n, .make.place, .make.wish, ro.remove, ro.place, .place.dir, ro.copy; și taken out of
  clitic.joined and of ro.make.self ("pune și un lac" was read as "give yourself a lake"); new ro.place.bare (5, needs
  in, en acts.place.bare: "pune un lac", "pune niște iarbă", "mută peștele"). 40 frames, 292 wires, 44,328 bytes.
- tests/w.lang.ro.frames.test.mjs: six turns with și read as without it; și between two things stays "and"; Dă-ți
  stays the avatar. ro-en-meaning: hand 69.3/54.3/39.9 -> 70.6/55.3/40.8 %, machine 41.3/28.3/25.3 -> 43.1/28.7/25.6 %.
- Not fixed: "fa si o fetita" reads ro.change.value with the thing "si" (a bench "act": it maps the gloss's "make" to
  change); the frame cannot refuse a thing that is only a focus word.


## 2026-11-15 — first worker: ordered sets as timelines, everyday procedures as flowcharts (block 07:30 item 2; PSys2 Q17 (2))

- **Planets by distance and by size:** `k.diagrams.fill` timeline of `k.space.body` by `order` (topic `kind`: the
  planets, Mercury to Neptune) and by `size_rank` (Jupiter to Mercury). New optional key `k.diagrams.fill.by` (k.diagrams
  version 2), a declared join to `k.attributes.attribute`: the attribute an order by a rank follows (`distance`,
  `size`), so a host reading "a timeline of the planets by distance" (the third worker's criterion role) takes the
  fill whose `by` is the criterion.
- **Everyday procedures** (k.procedures version 2): `k.procedures.howto` (`name`, `about`, `basis` cited or own,
  `cite`) and `k.procedures.howto_step` (`howto`, `n`, `about`, `role` process or decision, `after`, `branch` yes or
  no, `detail`), apart from the planner's methods (the planner never reads them). Shard `everyday` (CC0, 28 wires,
  5,960 bytes, tools/procedures-core.mjs): **making tea** (own, 8 steps, decision "Milk or sugar?"), **washing hands**
  (cited: CDC, "When and How to Wash Your Hands", the five steps, each `detail` the CDC's sentence; the CDC page itself
  was not reachable from here, its text checked as quoted by an Air Force news article of 2022), **planting a seed**
  (own, 9 steps, decision "Is the soil dry?"). Words: gerund, noun and "how to" forms only ("tea making", "how to wash
  your hands"); not "make a cup of tea", which can ask for a drawing.
- Fills: flowchart of `k.procedures.howto_step` by `after` (edges) and `n` (order), pipeline by `n`. k.diagrams: 25
  fills, 68 wires, 17,288 bytes. measures-core: howto_step `n` and `after` are ordinals.
- Tests: tests/k.diagrams.test.mjs (9, +2): every `by` is an attribute; the planets in order by distance and by size
  through the fills; three procedures, none a method name, cited iff `cite`, one first step, `after` points back, a
  branch follows a decision and each decision has a yes and a no; the tea flowchart starts with "Boil water" and its
  decision is a diamond (k.diagrams.shape).


## 2026-11-15 — first worker: user-facing methods (block 07:30 item 3; PSys2 Q17 (3))

- `k.procedures.method.user_facing` (required boolean; k.procedures version 3): true when a person would ask to see the
  method as a procedure (its goal a task named in plain words, its steps steps a person could follow), false when it
  is one of the app's ways to a goal. 9 of 29 true: compose a scene, build from parts, set a table, a chart of the
  things there (the bar chart), write a story / presentation / essay / scientific article / report. False: anchors,
  wearables, faces of roles, feelings, take apart, map views, and the list or seating-plan rendering of a task that has
  a plain method. A random flowchart of a method takes a user-facing one (or an everyday procedure, item 2).
- `USER_FACING` in tools/procedures-core.mjs (one named list, with the rule); shards from-knowledge 54,023 bytes, tasks
  27,327, compose 48,617; build: narration (1 slot, machinery), relations-procedures.
- Test: tests/k.procedures.test.mjs (16, +1): every method says it, as the list says; set a table, an essay and a scene
  are, a face of a role, a feeling on a face and an anchor are not; every user-facing method has 2 or more steps.
## 2026-11-15 — fifth worker: KR1 item 1, the runner fails a file that never ran; derived.test.mjs runs

- **tools/test-run.mjs:** `verdict(r)` decides a run: killed by a signal on every try -> FAIL "not run (killed by
  SIGKILL on all N tries)"; 0 tests -> FAIL "not run (0 tests)"; failing tests or a non-zero exit -> FAIL; else ok.
  The summary line lists the files not run. Before: `r.fail || r.code`, so a run killed by a signal (code null, fail 0)
  and a file with no test were `ok`. Also: the child no longer inherits `NODE_TEST_CONTEXT` (under `node --test` a
  child reported to its parent and printed no counts, which the new rule would read as 0 tests).
- **tests/derived.test.mjs** (killed five times and logged `ok 89.5 s 2648 MB 0 pass` in the review run): the cause
  was `tools/derive.mjs` loading k.objects (36 MB of shards) with its rules because it imports k.commonsense, though no
  rule makes a k.objects type. `ruleWorlds` now takes only the worlds whose own types (or a type they extend) a rule
  makes: k.commonsense, k.kinds, k.people, k.shapes, k.time (k.objects out). Derived shards byte-identical.
  The file is split: tests/derived.test.mjs (fresh, marked: 2 tests, 18.2 s, 584 MB) and tests/derived.load.test.mjs
  (nothing made twice, told values not derived, tools see them; reads the shards from disk: 2 tests, 26.1 s, 466 MB),
  both at load average about 9. Before: killed at 2,648 MB, 0 pass.
- Test (tests/test-run.test.mjs, +1): `verdict` on a killed, an empty, a failing and a passing record, and `runFiles`
  on three real files in a temp folder (one kills itself with SIGKILL, one has no test, one passes): the first two FAIL
  as "not run", the third is ok, and the summary names the files not run.

## 2026-11-15 — fourth worker: w.list version 3, a shop list with prices and money (reviewer 09:20, PSys2 Q18 K1)

- Real rows: r0598, r0599, r0622-r0627 (PSys2 real set 2026-11-15: "I want a puzzle and I pay 10 lei. What is the
  change?", "how much does a pencil cost?"). PSys2's audit had missed that `w.list` exists; extended, not doubled.
- **Schema change for hosts (w.list version 3):** a list has `sort` (shopping, to-do, any), `budget`, `tendered` (the
  amount tendered at the till) and `currency`; an entry (`w.list.item`, schema.org's ListItem) has `food` (k.food by
  name), `object` (k.objects by name), `quantity` (now a number), `unit` (k.units unit by name), `price` (of one, in
  `currency`, a k.units currency by ISO 4217 code) and `status` (open, done) in place of the boolean `done`. Five
  declared joins (`type= by=`; open while the target world is not loaded). The total, what is left and the change are
  computed (PSys2 Q18 L3), never stored; prices stay an application's data. "task"/"tasks" left the entry's words
  (they go to w.tasks, K2).
- Schema: 45 wires, 8,180 bytes, loads with std.acts with no error and no warning. tools/ranges-core.mjs: typicality
  of `status`, `price`, `unit`, `sort`, `budget` (typical.sop 146 wires). Build: index.json, vocab, JOINS-REPORT
  (declared joins 196 in 31 worlds, 0 broken).
- Tests (tests/w.schemas.test.mjs, 16 pass): the list session on status and a numeric quantity; a new shop session
  (budget 30 RON, 2 pencils at 3 and a ball at 5, tendered 20: change 9, left 19; refusals: a sort that is not one, a
  negative price, "a bag" as a quantity) and the joins' names checked against k.objects, k.food and k.units facts.

## 2026-11-15 — fourth worker: w.tasks, tasks open or done (reviewer 09:20, PSys2 Q18 K2)

- Real row: r0590 "i should call grandma" (PSys2 real set 2026-11-15); the 25 sentences of PSys2's kids.tasks world.
- `docs/worlds/w.tasks/schema.sop` (version 1; 23 wires, 4,658 bytes; CC0, own) and `WORLD.md`: `w.tasks.task` with
  `text` (required), `status` (open, done; default open), `list` (a `w.list.list`: w.tasks imports w.list, one home for
  lists, a to-do list is a w.list list of sort to-do), `n`, `due`, `reminder` (ISO 8601 or a k.time word, read by the
  library's std.time), `owner`, `note`; acts make, remove, change, group, pick, ask, copy; at most 1,000 tasks. Terms
  after iCalendar's VTODO (RFC 5545): SUMMARY, STATUS (open = NEEDS-ACTION, done = COMPLETED), DUE, VALARM TRIGGER,
  ATTENDEE. "Done is a state that acts change": the closed set is set by `change` (anything else refused with the two
  allowed), read by `pick` and `ask`, taken back by `undo`.
- The first w.* schema that imports another: `describeSchema` (tools/lib/schemas.mjs) loads a schema with the other
  schemas in the library, as a host does, and the catalog entry of every schema now has `depends` (w.tasks:
  ["w.list"]; the others []). build-catalog passes its own scan.
- k.kinds.structure: w.tasks is a sequence (task, n, list; structures.sop 285 wires); k.attributes typicality of the
  task's keys (typical.sop 153 wires); the coverage test of schema kinds includes w.tasks.
- Tests (tests/w.schemas.test.mjs, 17): nine schemas; tasks/chores/things to do find w.tasks; a session (a to-do list,
  call grandma, water the plants with a reminder, homework due Friday; done set and picked, open again and undone;
  refused: status finished, a task on a task, a place in a picture; grouped as today).



## 2026-11-15 — first worker: diagram topics as known words (block 07:30 item 9; PSys2 Q17 (9))

- PSys2's speller (docs/webchat/lib/formalizer/spell.mjs, read on GitHub) takes its vocabulary from the worlds the
  host loads (pattern literals, lexicons, names and short strings of knowledge wires): "tea" was read as "sea" because
  no world the diagram host loads says "making tea". vocab.json has had "tea" all along; what a host lacked is a small
  set of facts naming the topics of the diagram knowledge.
- New derived type `k.diagrams.topic` (k.diagrams version 3): `name`, `kind` (many, join to k.diagrams.kind), `from`
  (many), `nodes` (the largest diagram, 2 or more). tools/diagram-topics.mjs (in `npm run build`, after the
  structures) reads every fill with a `topic` key over the catalog (subtypes included: the cycles of k.time.ordered)
  and writes one fact per topic and licence of its facts: 7 shards, 3,045 topics: CC0 1,078 (184,944 bytes), WordNet
  1,544 (253,964 bytes), public domain 219, CC BY 69, ODbL 53, CC BY-SA 50, Apache/Unicode 32. A topic in two
  licences is two facts (car: CC0 kinds, WordNet parts); names written as the catalog writes them (atoms unquoted).
- Test: tests/k.diagrams.test.mjs (10, +1): shards = tool output; making tea, washing hands, car, planet, frog life
  cycle, set a table are topics; every kind a kind of k.diagrams, every `nodes` at least 2; the car of k.parts.whole
  fills a tree. measures-core: `nodes` counts nodes.
- For PSys2 (host): load the `k.diagrams/shards/topics-*` shards with the diagram knowledge (or vocab.json's words)
  into the speller's vocabulary.


## 2026-11-15 — first worker: end of round (block 07:15 items 1-2, block 07:30 items 1, 2, 3, 9)

- Commits: ab3b2ab (Q67 b: k.objects.keyword), 4719034 (Q68: k.geo.country.currency dropped), a4b31f4 (parts of a
  thing fill trees: k.parts.whole), 66e839f (planets as timelines, fill `by`; everyday procedures), 687d193
  (user_facing methods), the diagram topics commit (k.diagrams.topic, 3,045 topics). 07:15 item 3 (more animal
  sounds) dropped by the owner's decision of 07:30 (no real row).
- Full suite on the rebased tip (`npm run test:all`, files one at a time): 83 files, 3,128 tests, 3,125 pass, 1 fail,
  2 skipped, 774 s. The failure: COVERAGE.md lacked the row of `w.list` (another worker's new schema, reports not
  rerun); regenerated here (`npm run reports`), coverage-report passes.
- Q70 answered (keep the dedicated type). Open for hosts: PSys2 to read keywords last (vocab order and
  `drawingFor` order), a country's currency through k.units, `by` on order fills, user_facing for random flowcharts,
  the topics shards for its speller.


## 2026-11-15 — first worker: items taken for the next round (coordinator relay, reviewer blocks 10:55 and 09:50 F)

- Taken, in this order: (1) **w.person** (block 10:55, PSys2 Q19, 30 real turns): the world schema on k.people and
  w.lang.en frames for first-person statements and questions about the user, in a frame shard of my own; (2)
  **outlines of objects as arrangement paths** and the "in the shape of X" frames (block 09:50 item F, the owner's
  case "a diagram in the shape of a house").

## 2026-11-15 — fourth worker: frames for lists, tasks, a shop and a wallet (reviewer 09:20, PSys2 Q18 K6)

- w.lang.en shard `list-frames` (tools/lang-en-list-frames.mjs, in `npm run build` after the diagram frames; 31
  frames, 196 wires, 46,468 bytes, CC0, own), every frame `needs=entries`, bound to the acts of k.actions and the keys
  of w.list (K1) and w.tasks (K2): lists (add / put X on my list: make, the list's name its place; take X off / remove
  X from: remove; does my list have X / is X on my list: ask has; how long is my list: ask count; which lists do I
  have: ask all, thing list), tasks (what is left to do / what's still open: ask open; I (just) finished X / X is done:
  change status done; I didn't finish X: change in the mode not, status open; did I finish X: ask done; set a reminder
  to X / remind me to X: make a reminder, topic X; I should X: make a task, topic X), shop (how much do N X cost / what
  is the price of X: ask price; can I buy N X / is N X affordable: ask afford; what is the change / how much change do
  I get: ask change; change from N lei for X / change for X with N lei: ask change, the money paid the other amount;
  I want X / I want N X: make; I pay / give the cashier N lei: change tendered), wallet (I start with N lei / my
  wallet has N lei: change budget; how much money is left: ask left). 3 role maps (the currency word goes with the
  number into change.value, or into ask.other), 1 lexicon `money.unit` (454 words derived from k.units; codes and
  signs left out).
- tools/lib/lang-en.mjs `clauseReader`: a sentence cut at . ? ! ;, a comma, a joiner of w.lang.en that cuts or before
  a question word (w.lang.en.wh, for run-ons); the cutting whose clauses all read wins (literal words, then captured,
  then clauses).
- **Real rows** (sources/psys2-eval/real-q18.tsv, the 9 turns of psys2 real-2026-11-15 at 40292c6 that Q18 names),
  read clause by clause with the right act and roles: **9 of 9** — r0590 make kind=task topic="call grandma"; r0598 /
  r0624 make kind=puzzle | change tendered "10 lei" | ask change; r0599 / r0627 make 2 pencils | change tendered "10
  lei" | ask change; r0622 / r0625 make "ball and a pencil" | change tendered "20 lei" | ask change (r0625 has no
  punctuation: cut before "what"); r0623 / r0626 ask price thing pencil / ball.
- PSys2's kids.shop and kids.tasks sentences the frames are for: 35 of 35 read right (tests/w.lang.en.list-frames.test.mjs,
  5 tests, 1.6 s). Not read: "Change from thirty lei, puzzle and 2 kites" (thirty is no numeral here).
- Frames test (every frame reads its own example): 434 frames, 418 best, 11 tie, 5 known (all 31 new read best).
- questions.md **Q71**: where the wallet lives (budget and tendered on a shopping list meanwhile, or a kind, or
  storyState); `n` or `position` across the w.* schemas (kept `n`); clause splitting as [LIB]; the conversation (K3)
  and arithmetic (K4) frames must outrank "I should …" and "how much is …" here.

## 2026-11-15 — fourth worker: K6 on main (974cbd9); takes K10 (block 09:20) and KR2 (block 10:50)

- K6 (frames for lists, tasks, a shop and a wallet) is on main as 974cbd9 after the restart (test:changed on the
  rebased tip: 43 files, 309 tests, 303 pass, 0 fail, 6 skipped). Real rows read clause by clause with the right act
  and roles: r0590, r0598, r0599, r0622, r0623, r0624, r0625, r0626, r0627 (9 of 9).
- Taken now, in this order: **K10** (question frames in other word orders over existing facts; real row r0244 "how
  many legs has a cow"), then **KR2** (one home per idea: colours, shapes, number words, verb forms; enums joined, not
  copied; declare the undeclared joins that meet 100 %).

## 2026-11-15 — third worker: Q69 item 3, the old spelling î for â as folds

- Bench: 100 / 83 / 63 -> 100 / 82 / 62. The one fewer is "fa un bunic linga rata", now read as make, grandfather,
  near (rel) the duck: right, but the bench takes the gloss's "make" as the act change. Readings improved where the
  bench does not look: "muta fetita linga baiat", "muta capra linga rata" get the place and relation near (they had the
  thing "girl linga boy"); "in stinga", "la stinga" read the direction left.
- tools/lang-ro-core.mjs: OLD_FOLDS, 13 stem folds derived from the words of the world with â inside them (stem up to
  two letters after the â, no trailing vowel, at least four letters, old spelling folded -> new spelling folded:
  sting -> stang, ling -> lang, pamint -> pamant, piin -> pain, cind -> cand, rind -> rand, cint -> cant, ciin -> cain,
  decit -> decat, sfirs -> sfars, spinz -> spanz, intiln -> intaln, saptamin -> saptaman), written after the letter
  folds in morphology.sop and used by foldText (the dictionaries re-sorted; dictionary-unimorph regenerated, 3,458).
- tests/w.lang.ro.test.mjs: 14 old spellings fold to the new; stinga, pamint(ul), piine, cintec, cinta read to their
  lemmas, stanga, pamant, linie as before; no new collision among the 3,728 lemmas of both dictionaries and the closed
  forms (săptămînă, UniMorph's old spelling of săptămână, is the one join, and it is the same word). Shorter stems
  refused: cit (câți = citi), pin (spin = spân). Round trips 3,028 / 3,028 exact and folded.

## 2026-11-15 — fourth worker: question frames in other word orders (reviewer 09:20, PSys2 Q18 K10; real row r0244)

- w.lang.en shard `question-frames` (tools/lang-en-question-frames.mjs, no input; 7 frames, 47 wires, 9,353 bytes,
  CC0, own; needs=facts): count.tail ("April has how many days?"), count.in ("How many days are in April?", over
  acts.facts.ask.live), count.away ("Friday is how many days away?"), count.until ("How many days until Saturday?"),
  which.in ("Which months are in summer?"), name.all ("Name all the seasons of the year."), what.are ("What are the
  seasons?").
- **r0244** "how many legs has a cow" already reads in w.lang.en: acts.facts.ask.count.does (ask count, topic legs,
  thing cow), with the host's attribute lexicon holding "legs" (a k.attributes attribute). Its failure in PSys2 is the
  host's routing or lexicon, not a missing frame (told here for PSys2).
- tests/w.lang.en.question-frames.test.mjs (2 tests, < 2 s): r0244 and the 10 kids.time sentences of K10 read with the
  right act, mode and roles, 11 of 11, the lexicon from k.attributes and k.time. Frames test: 441 frames, 425 best,
  11 tie, 5 known (all 7 new read best).

## 2026-11-15 — second worker: `k.objects.part.of` declared (reviewer 08:00, Q69)

- `k.objects.part.of` is a declared join: `type=k.objects.object by=name` (k.objects version 8). All 2,212 distinct
  `of` values meet an object (0 open); `k.kinds.relation` for it now says `found=declared object_by=name` (was
  `found=value` with three candidate types). Taken out of NOT_DECLARED; the schema comments and k.objects/WORLD.md say so.
- Measured on the pin 0.113.0 (k.objects: 27,904 parts, 2,212 objects; `fullWorld`, the schema patched in memory,
  7 pairs run back to back in alternating order): CPU 16.6 s undeclared -> 17.0 s declared (medians; mean pair
  difference -0.1 s, range -1.6 to +1.1 s), wall 26.4 -> 26.1 s (medians) under a load of 4.7 to 6.6 on 2 CPUs:
  no cost above the noise (the index of 0.107+). `world.check()` issues unchanged (1,460), 0 open joins. Written in
  JOINS-REPORT.md under a new section "Measured cost of declared joins" (tools/joins-report.mjs `MEASURED`).
- Declared joins: 192 in 30 worlds; 10,015 of 10,073 distinct values meet (99.4 %), 58 open, 0 broken; left undeclared
  on purpose: 5 (the k.time `next` keys).
- main was red on `tests/coverage-report.test.mjs` (COVERAGE.md stale since w.list version 3 / w.tasks: the row
  `w.list` was missing); `npm run reports` regenerated it, carried in this commit.
- main was red on `tests/k.people.given-names.test.mjs` too: since k.diagrams.topic (922a864) names countries and
  cities as topics (`name=Chad`, `name=Georgia`), the person-context rule of `tools/import/given-names.mjs` would flag
  5 more names (Chad, Georgia, India, Montserrat, Viola). k.diagrams.topic is a generated gathering of other worlds'
  names, like k.kinds and k.attributes, so the rule skips that type (`CONTEXT_SKIP_TYPES`); the import gives the
  published shards byte for byte again (context=person 49).

## 2026-11-15 — second worker takes: the joins report without enum keys (08:00), then K5 + K4 (block 09:20)

- part.of is on main (f15117d). Next, in this order: the joins report stops suggesting keys whose slot has an enum
  (`k.people.given_name.context`); K5 typed possession effects `holds=` / `money=` on k.actions; K4 arithmetic words
  and frames in w.lang.en, in a frame shard of my own (`arithmetic`).

## 2026-11-15 — second worker: the joins report suggests no enum keys (reviewer 08:00)

- `tools/joins-report.mjs`: a key whose slot (own or inherited, `declaredJoins().slotOf`) has `enum=` is never a
  join suggestion. Of the 116 suggestions, 66 were enum keys (`k.people.given_name.context`, the colour, shape,
  direction, season and part-of-day enums, `k.procedures.*.act` ...); the table keeps **50**. The enum keys are listed
  apart in a last section, "Keys with an enum (never suggested as joins)", with the enum's size and how many of its
  values are names of the first candidate, for KR2 (enums joined, not copied), which decides per enum. Left undeclared
  on purpose: 4 (k.time.season.next has an enum, so it is in the enum list now).
- `tests/k.kinds.joins-report.test.mjs`: no suggested key has an enum; context is among the enum keys.

## 2026-11-15 — third worker: Q69 item 4, "mai" + a direction; then K3 and K7 taken

- Bench (library tools/bench-ro-frames.mjs, 161 real turns): before Q69 93 / 74 / 38; (1) nouns 93 / 74 / 55; (2) "și"
  focus 100 / 83 / 63; (3) î -> â stem folds 100 / 82 / 62; **(4) "mai" + direction 104 / 83 / 64** (read by a frame /
  right act / right act and thing).
- tools/lang-ro-frames.mjs: acts.dir plain (mai jos, mai sus out; în stânga, în dreapta, spre stânga, în stânga sus ...
  in); lexicons space.amounts (mai, și mai, încă, puțin, un pic ...), relative.more (mai, încă) and relative.small
  (puțin, pic, ușor) for the library's resolveEllipsis options; frames ro.place.dir.amt (14), .amt.it (15, no thing:
  "mută și mai la stânga"), .amt.bare (7, verbless continuation), all en=acts.more.place.dir.amt. 43 frames, 318 wires,
  49,417 bytes.
- tests/w.lang.ro.frames.test.mjs: 9 real-turn shapes read with amount mai and the direction; the relative words are
  single words and amounts; mai is not part of a direction.
- Taken next (assignment 12:10): K3 conversation frames (bound to w.person where it exists) and K7 clock and calendar
  words, in w.lang.en frame shards of my own.
## 2026-11-15 — fifth worker: KR1 item 2, capitals have one home

- **Home:** `k.geo.country.capital`. `k.geo.city.capital_of` is no longer told anywhere: the rule `k.geo.capital_of`
  (k.geo/schema.sop, version 7; `when` a country's capital, `then` that city of that country has `capital_of`) makes
  it, and tools/derive.mjs writes it for readers of shards: `derived` (246 facts, ODbL-1.0) and
  `derived-public-domain` (1). New slot `k.geo.city.derived` (boolean), as k.time's derived types have.
- **Before:** 263 country.capital pairs, 278 told capital_of wires (265 pairs; 13 PSys2 cities told it again), 2
  capital_of with no capital (Oranjestad and The Bottom of Caribbean Netherlands, in north-america-borders and
  psys2-cities-north-america), 16 countries with 2-4 capitals. **After:** 247 capital pairs, 0 told capital_of, 247
  derived, every capital a told city of its country, 1 country with several capitals (South Africa: Pretoria,
  Bloemfontein, Cape Town, as the country list says).
- tools/import/geo.mjs: no `capital_of`; the list's city wire only where Natural Earth's city is not kept (citiesFromList
  37, unchanged); of Natural Earth's capital marks, only those the country list names stay where it names some
  (`capitalsNotListed` 16: Cotonou, Abidjan, Laayoune, Lagos, Johannesburg, Dar es Salaam, Mbabane, Tel Aviv, Kyoto,
  Putrajaya, Yangon, Baguio, Sri Jayawardenepura Kotte, The Hague, La Paz, Valparaíso; they stay cities). Rerun on
  the raw files: only these lines change. tools/import/psys2.mjs and its six city shards: no `capital_of`.
  Q75 (numbered Q71 at first; Q71 is the fourth worker's) asks whether a seat of government should stay a second capital (meanwhile the list decides).
- Tests: tests/k.geo.test.mjs (+1): no told capital_of, derived ones name the rule, every capital a told city, the
  countries with several capitals are exactly South Africa's three, capital_of read with the rule equals
  country.capital backwards, Caribbean Netherlands' capital is Kralendijk and Oranjestad / The Bottom are not
  capitals of it. tests/import.geo.test.mjs (+1): the importer keeps the listed one of two marked capitals, keeps
  both when the list names neither, keeps the other as a city, and writes no capital_of; the freshness test skips
  derived shards.

## 2026-11-15 — fifth worker: KR1 item 3, size has one home

- **Home:** `k.attributes.number.size_about` (metres, sources/hand-core/numbers.tsv). The k.scenes size class is
  computed from it where it exists (tools/lib/size-class.mjs: under 0.1 m tiny, 0.8 small, 2 medium, 6 large, else
  huge, from the examples the class definitions give: a mouse tiny, a cat or hen small, a dog or person medium, a
  horse or car large, an elephant or house huge), as weight_class and speed_class are; told only where no number
  exists. The tables can no longer tell it apart: tools/scenes-core.mjs and tools/animals-core.mjs refuse a told size
  for a thing whose number exists (an animal only where the number is about the animal, senses.tsv); 589 sizes of
  place-size.tsv and 148 of animals.tsv blanked.
- **Before:** 650 things with both (the review counted 623 a few commits earlier), 499 of the same class under these
  steps, 9 by two classes or more (bandage, cable, chime, fence, holly, pipe, ribbon, rope, wire). **After:** every
  thing with a number has the number's class (144 k.scenes things changed class, most by one step); 0 conflicts.
- **The conflicts, by the source** (each in sources/hand-core/numbers-audit.tsv): the number was of another thing than
  the drawing: bandage 1 m -> 0.07 (the adhesive bandage, U+1FA79), ribbon 1 m -> 0.15 (the bow, U+1F380), holly 5 m ->
  0.2 (the Mulberry sprig, not the tree); the class was wrong: chime (a wind chime, 0.5 m) large -> small; the length is
  any length and so not plain (numbers.tsv's own rule): cable, rope, wire, pipe (also two things), fence: size_about
  dropped, the class stays told. k.attributes: size_about 975 -> 970.
- The 61 scene previews are drawn again (sizes moved). Schemas: comments in k.scenes and k.attributes.
- Test (tests/k.scenes.test.mjs, +1): every k.scenes thing with a k.attributes size_about has the class of the
  number; no place-size.tsv row tells a size the number gives, and the reader refuses one; the resolved conflicts;
  elephant huge, mouse tiny. The audit test compares a "right" size only where no number decides it.

## 2026-11-15 — fifth worker: KR1 item 4, material / made_of and can / used_for: one key, one home

- **Home:** `k.attributes.thing` (`material`, `can`, `used_for`), the world with the source: the audited table
  sources/hand-core/attributes.tsv (761 -> 763 things). k.commonsense (version 5) keeps `at`, `usually_count` and the
  rules; its slots `made_of` and `used_for` are dropped, and `can` / `cannot` hold only what its rules make from
  k.animals (the join of an animal's name; shard derived, 1,148 -> 1,149 facts).
- **Before:** k.commonsense/shards/core told made_of 9, can 8, used_for 7 for 15 things; 9 of those things also in
  k.attributes, with other values (car can=drive used_for=travel against can=move used_for=travelling; boat travel against
  travelling). **After:** 0 told in k.commonsense; what k.attributes lacked moved there in its value set: cloud can rain,
  boat can sail, flower used_for decoration, two rows for the generic bird (can fly, sing) and fish (can swim, used_for
  food); car "can drive" dropped (a car moves; a person drives it), dog and cat take their abilities from k.animals.
- tools/import/conceptnet.mjs (not run yet): CapableOf, UsedFor, MadeOf go to k.attributes.thing (`material`, not
  `made_of`), in k.attributes shards of their own (CC-BY-SA-4.0). tools/attributes-core.mjs FOUND and
  tools/coverage-report.mjs no longer list k.commonsense for material and used_for. Questions cs-03/04/05/08 moved to
  k.attributes (at-27 to at-30). Q72 [PSYS2] [LIB] records the old and new names; Q73 asks about k.space.kind.made_of.
- Test (tests/k.commonsense.rules.test.mjs, +1): k.commonsense.thing has no made_of, used_for or material slot; no
  told shard of k.commonsense says can, cannot, made_of or used_for; derived can/cannot come from the ability rules;
  car, boat, house, bird, fish, cloud, flower have their values in k.attributes. tests/import.conceptnet.test.mjs: the
  importer writes material and used_for on k.attributes.thing.

## 2026-11-15 — fifth worker: KR1 item 5, the time of day joins k.time

- `k.scenes.scene.time` and `k.attributes.usage.time` were `enum=morning enum=day enum=evening enum=night`; k.time's
  parts of the day are morning, afternoon, evening, night. Both slots are now `type=k.time.part_of_day by=name` (a
  declared join), and `day` (the daytime) became `morning` + `afternoon`: 41 scenes in tools/scenes-data.mjs (one
  "evening, day" -> morning, afternoon, evening) and 36 rows of sources/hand-core/usage.tsv. The renderer's night
  test reads morning and afternoon instead of day (previews unchanged).
- **Before:** the joins report showed 3 of 4 values meeting for each slot (k.kinds/JOINS-REPORT.md). **After:** 4 of 4,
  declared.
- Test (tests/k.scenes.test.mjs, +1): both slots declare the join and no enum; every time value of the scenes and the
  usages is a k.time.part_of_day name; the beach is morning and afternoon. tests/k.attributes.test.mjs compares only
  season and weather as enums now.

## 2026-11-15 — fifth worker: KR1 item 6, licences: UniMorph catalogued, an allowlist in the validator

- **Catalog:** tools/build-catalog.mjs lists the folders of data files that are not SOP (the TSV dictionaries) as a
  world's `data` (id, path, format, files, bytes, sources, license), and counts their sources and licences in the
  world's `sources` / `licenses` and in LICENSES.md. **Before:** w.lang.ro `licenses ['CC0-1.0']`, `sources
  ['hand-core-1']`, no unimorph section in LICENSES.md. **After:** w.lang.ro `licenses ['CC-BY-SA-3.0', 'CC0-1.0']`,
  `sources` with `unimorph-ron-2026-11-14`, data `w.lang.ro/dictionary-unimorph` (23 files, 67,603 bytes, CC-BY-SA-3.0)
  and `w.lang.ro/dictionary` (21, CC0), `w.lang.en/dictionary` (26, WordNet-3.0); LICENSES.md has `unimorph-ron` with
  the CC BY-SA 3.0 terms and attribution. The `nc` flag and "non-commercial stays non-commercial" are gone.
- **Allowlist:** tools/lib/licenses.mjs (CC0, public domain, MIT, BSD, Apache-2.0, MPL-2.0, WordNet-3.0, CC BY, ODbL,
  CC BY-SA, CDLA; Unicode-3.0 meanwhile, Q74); tools/validate.mjs refuses any other id, NC / ND / research-only /
  unknown above all, more than one `# license:` line, a share-alike licence joined with another in one file, a data
  file without licence or source, and two licences in one folder of data files. Checked on every run (not cached).
  The 1,156 files of today all pass. AGENTS.md rule 9 names the allowlist. docs/worlds/README.md documents `data`.
- Tests (tests/catalog.test.mjs, +1 and the toy catalog): a toy TSV folder is catalogued with its source and licence
  and appears in LICENSES.md; NC, ND, GPL, a missing licence, CC-BY-SA AND CC0, and two licences in one folder fail;
  the real catalog has the UniMorph folder under CC-BY-SA-3.0, LICENSES.md its section, and every shard and data
  folder a licence the allowlist takes.

## 2026-11-15 — fifth worker takes: the sensitivity key (block 13:15), KR5, then a full test:all on main

- (a) `sensitive=` on k.kinds from WordNet with a generator and a freshness test; (b) KR5 (k.objects loaded once for
  the four test files, one drawing-name check, freshness tests for objects-hand / lang-en-core / lang-en-discourse,
  generated counts in README and WORLD.md); (c) `npm run test:all` on main, with every file not run or over 30 s.

## 2026-11-15 — fifth worker: the sensitivity key (block 13:15, PSys2 Q20; real: "Add a weapon.")

- `k.kinds.sensitivity` (k.kinds version 6): `name`, `sensitive` (weapon, drug, alcohol, tobacco: the GARM Brand Safety
  Floor's "Arms & Ammunition" and "Illegal Drugs / Tobacco / e-cigarettes / Vaping / Alcohol"), `sense` (the k.words
  sense read). A type of its own: as a key of k.kinds.kind it merged into k.commonsense's beer and wine and moved their
  derived facts into a WordNet-licensed shard.
- tools/sensitive-core.mjs (in `npm run build`) reads the WordNet chains already in k.words (no raw file): shard
  `sensitive`, 86 words (weapon 45, alcohol 34, drug 4, tobacco 3), WordNet-3.0. Rule: the first noun sense only (a
  knife is first an edge tool, an axe and a hatchet tools); narrow roots (weapon, weaponry, armament, weapon system,
  explosive device, ammunition, explosive, firearm; drug of abuse, hard / soft drug, narcotic), never instrument or
  device (a tank, a shield, a slingshot stay out); alcohol only with beverage in the chain, tobacco not as a plant; is_a
  followed where kind_of is missing; 10 words whose everyday sense differs from WordNet's first (battery, canister,
  hardware, hatchet, knuckles, round, sedative, shell, slug, mortar) in sources/hand-core/sensitive-not.tsv, each with
  that sense. In the catalog: 26 names marked (gun, rifle, pistol, sword, dagger, bomb, cannon, beer, wine, cigarette ...);
  "water pistol" is not (a multi-word name counts only as itself).
- Unicode-3.0 is on the licence allowlist without the "pending" mark (reviewer's answer to Q74).
- Q76 [PSYS2]: the key and how to exclude by default.
- Test (tests/k.kinds.sensitive.test.mjs, new, 3 tests, 1.7 s): the shard is fresh; weapons, drugs, drinks and tobacco
  are marked and knife, axe, hammer, saw, scissors, fork, bow, arrow, shield, tank, slingshot, water pistol, battery,
  shell, glycerol ... are not; every row of sensitive-not.tsv is a word the rule would otherwise mark.

## 2026-11-15 — fifth worker: KR5, tests and docs (review findings 26, 27, 31)

- **k.objects once, cheaply:** `objectsView()` (tools/lib/worlds.mjs: the object, part and point facts of k.objects
  merged by wire id, the one method the readers use, `ofType`) gives what `fullWorld('k.objects')` gives, checked once
  over all 2,212 objects (partsOf identical, objectList identical): 8.6 s against 51 s. Used by tests/gallery,
  k.objects.render, tools/render-svg.mjs (the first step of the build) and tools/drawn-colour.mjs (so
  k.attributes.test); tests/k.objects.names asks its queries of an engine world with the object and part facts only
  (13 s). Before -> after (load average about 9): k.cores 54 -> 4.6 s, gallery 49 -> 9.7, k.objects.render 39 -> 13.3,
  k.objects.names 36 -> 13.6, k.attributes 69 -> 24.4.
- **One drawing-name check:** the k.cores copy of "every drawing names a k.objects object" is gone (it loaded k.objects);
  tests/shared-modules.test.mjs checks it for every world, and the joins are declared.
- **Freshness:** tests/generators.test.mjs reruns tools/objects-hand.mjs (7 shards), tools/lang-en-core.mjs and
  tools/lang-en-discourse.mjs. WordNet's four exception lists are committed (sources/wordnet/exc, 100 kB, WordNet
  licence), so lang-en-core and lang-en-morph run in every clone: `npm run build` runs lang-en-core and lang-en-morph
  without `--if-raw`, and tests/w.lang.en.morph's freshness test no longer skips. It found core-plurals stale (184 ->
  185: chrysalis, from a k.words noun added since) and irregular-forms-wordnet with it.
- **Counts generated:** tools/counts.mjs (in the build, before the catalog) rewrites counts between `<!--n:SPEC-->`
  markers (worlds, schemas, facts:<type> as distinct identities, named-takers, slots / slot-worlds of a key). The ten
  stale counts of finding 31 are markers: README (34 worlds and 9 schemas, not "nineteen"; 2,212 objects; 62 roles; 16
  acts; 316 verbs; 314 animals, distinct names: two animals are told in two shards; 763 common things), k.people (62
  roles), k.shapes (38 shapes), k.food (229 foods), k.actions (316 verbs, 90 markings), docs/worlds/README (21 types
  take k.named; 11 drawing slots in 8 worlds).
- Tests: tests/generators.test.mjs (new, 3), tests/counts.test.mjs (new, 2: every marker fresh; the review's stale
  places are markers).


## 2026-11-15 — second worker: K5, typed possession effects on k.actions (block 09:20; real rows r0194, r0195, r0201, r0542)

- `k.actions.action` gains `holds` (enum add, remove, give, set) and `money` (enum add, remove); k.actions version 4.
  17 actions carry them (`EFFECTS` in tools/actions-data.mjs, written by tools/actions-core.mjs): holds=add find, get,
  receive, get back, win, buy; remove lose, eat, break, fly away, leave, sell; give give; set have, hold; money=remove
  buy, spend, pay; money=add sell. `result` stays the gloss.
- Five actions added for them (192 actions, was 187): get, get back, have (hands), fly away (move), spend (social),
  each with who, object, tool, result, example, forms (got, gets back, has, flew away, spent) and near words; "get" and
  "have" are no longer near words of take, receive, eat and wear (an action stands for itself).
- `tests/k.actions.effects.test.mjs`: the asked verbs carry their effects; storyState of the pinned build reads 8
  stories (buy, eat, give both ways, lose + find, get + receive, spend lei, together) with a verb table built from the
  shards (each action and its forms -> holds, else money), none written by hand. For the library (L1): read
  `k.actions.action holds= money=` and the action's `core.word` forms.
- main was red on `tests/coverage-report.test.mjs` again (COVERAGE.md and ASPECTS.md stale after the KR1 material /
  size commits); `npm run reports` regenerated them, carried in this commit.

## 2026-11-15 — third worker: K7 clock and calendar words (block 09:20)

- Real row r0586 "I should tell you, today is Friday": now change/set, thing today, attribute weekday, value friday.
- k.time (version 6): type `k.time.clock_phrase` (name, minutes) and shard clock-words: 14 clock phrases (o'clock,
  five past ... half past ... quarter to, five to), 7 spans in clock words as durations in minutes (half an hour,
  a quarter of an hour, an hour and a half ...), 12 noon / 12 midnight; minutes measured in minute (measures-core).
- w.lang.en shard time-frames (tools/lang-en-time-frames.mjs, in npm run build): 9 statements (today, date day-month and
  month-day, month, season, clock, clock phrase, o'clock, named hour) and 4 questions (day, date, time, month); 6
  derived lexicons; 114 wires, 24,794 bytes.
- tests/w.lang.en.time-frames.test.mjs: 15 requests read back (r0586 among them), "it is red" is no time, the values
  are k.time facts, quarter to = -15, half an hour = 30 minutes.

## 2026-11-15 — third worker: K3 conversation frames (block 09:20)

- Real rows: "hello" (r0166, r0216, r0630) and "thanks" (8 rows) read as greet and thank (were not read); "who am I?"
  (r0148) is w.person's (not on main yet: the test reads it once person-frames is there; skipped meanwhile).
- k.actions: acts greet (role person, to), thank (role topic, for), farewell (role person, to), family conversation
  under "no change of things"; 15 hand verbs (say hello, say thanks, say goodbye ...). 19 acts, 62 roles, 331 verbs.
- w.lang.en shard talk-frames (tools/lang-en-talk-frames.mjs): 9 frames (greet, greet + person, greet verb; thank,
  thank for; farewell, farewell + person; who are you; how are you), "what is your name" stays acts.ask.name; 5
  templates (hello, hello {person}, thank you, thank you for {topic}, goodbye).
- tests/w.lang.en.talk-frames.test.mjs: 11 real rows and 9 paraphrases read back; the acts and family in k.actions.

## 2026-11-15 — third worker takes block 14:25: class=dialogue, the two Romanian shapes, Romanian reply templates, KR3 (fn first)

## 2026-11-15 — fourth worker: KR2 step 1, enums joined, not copied; joins that meet 100 % declared (reviewer 10:50 KR2)

- Declared (`type= by=`), the enum that copied another world's names dropped where it was a copy: the seasons
  (k.attributes.usage.season, k.scenes.scene.season, k.time.month.season_north / season_south, k.time.season_in.season
  -> `k.time.season`), the part of the day of an hour (k.time.hour.part -> `k.time.part_of_day`), the class of an animal
  (k.animals.animal.class -> `k.animals.class`), the acts of a method and a step (k.procedures.method.act, step.act ->
  `k.actions.act`; the enum was a copy of the act list), what a thing of a scene stands on (k.scenes.has.on ->
  `k.scenes.thing`), an attribute's default key (-> `k.attributes.attribute`).
- Joined but the enum kept, because the enum is a narrower set of its own, not a copy: the drawing primitives
  (k.drawing.part.shape: rectangle ... polygon, now also declared shapes of `k.shapes.shape`), the directions a part
  points or opens to (up, down, left, right; -> `k.values.direction`) and the basic colours of k.drawing.part.colour,
  k.attributes.drawn.drawn_colour, k.values.colour.basic and k.colours.colour.family (-> `k.colours.colour`). The pinned
  engine (0.113) reports a value that meets no target as an open join and does not refuse it, so dropping these enums
  would have let "teal" or a family "sea" in unchecked (two tests said so); the enum stays as the check until Q76.
  tests/shared-modules.test.mjs checks the joins with the lists; tests/k.attributes.test.mjs checks the season joins.
- Joins report: declared joins 217 in 32 worlds (was 196), 0 broken; undeclared 89 (was 114). Left undeclared from the
  100 % list on purpose: yes/no values that meet k.values.reply by accident, the hemisphere meeting k.values.direction
  (north/south), k.people.given_name.context, k.motion and k.procedures.binding values (one value each), and the
  colour slots of the w.* schemas (users name any of k.values.colour's 171 colours, k.colours has 33: which is the home
  of colour names is asked in Q76).
- Validate: 1,156 files, 0 errors.

## 2026-11-15 — third worker: the two Romanian shapes (block 14:25 item 1)

- "fă și o fetiță": ro.make.focus (14) and ro.make.place.focus (15), the focus word required: make, thing girl (was
  change with the thing "și o"). Two directions: English frame acts.more.place.dir.two ("move the house a bit left and
  up", hand-frames; rel2 -> direction) and ro.place.dir.two: "mută prima casă mai la stânga și mai jos" reads amount
  mai, la stânga, amount2 mai, jos. 46 Romanian frames.
- Bench (161 real turns): 104 / 83 / 64 -> 104 / 82 / 64. The one fewer is "fa si o fetita", now read right (make, girl)
  but scored against the act change, the bench's reading of the gloss's "make" (one of the three bench faults sent to
  the library). The three two-direction turns now carry both directions.

## 2026-11-15 — fourth worker: w.list version 4, `tendered` out (reviewer 12:30, Q71 (1))

- w.list: `w.list.list.tendered` and its words gone (version 4; 44 wires); `budget` stays, a planned limit (words budget,
  limit, spend at most). The money a person has and pays is the story's (k.actions pay `money=remove`, K5; L1).
- w.lang.en list-frames (32 frames, 202 wires, 47,740 bytes): acts.shop.pay now reads change, mode less, fixed attribute
  `money`, amount "10 lei" (role map list.change.unit for that frame); acts.wallet.start ("I start with 30 lei", "my
  wallet has 15 lei") change attribute `money`; new acts.list.budget ("my budget is 30 lei") change attribute budget.
  Real rows r0598, r0599, r0622-r0627 still read with the right act and roles (9 of 9), with the moved key.
- questions.md Q77 [LIB]: old key w.list.list.tendered, new reading for the library's listSums.
- Tests: list-frames 5, w.schemas 17, frames (442 frames), w.lang.en 22, catalog 9, validate 5: all pass.

## 2026-11-15 — second worker: K4, arithmetic words and frames in w.lang.en (block 09:20; real rows r0194, r0195, r0201, r0543)

- New type `w.lang.en.calc` (text, kind, form, calc, factor, marker, state, example; w.lang.en version 4) and an own
  shard `arithmetic` (124 wires, 24196 bytes) written by `tools/lang-en-arithmetic.mjs` (in `npm run build`):
  48 words with the core.calc builtin each names: operators (plus, minus, times, divided by, take away, add/subtract/
  multiply/divide/share/split with their markers; double, twice, triple, half, half of, a quarter of with a factor),
  comparisons (more than, fewer than, less than, N times as many as, twice / half as many as, as many as; more / fewer
  / less in a question), aggregates (in total, altogether, all together, in all, together), extremes (the most, the
  fewest, the least), states (left, now: now; at first, at the start, to begin with, to start with, in the
  beginning: start). 8 lexicons drawn from the words.
- 9 frames, act ask, mode calc, needs=calc: "what is N op M", "what is double N", "share N (X) between M (Y)",
  "how many X does O have (left / now)", "how many X did O have at first", "how many X are there altogether", "how
  many X do A and B have in total", "who has the most X", "how many more X does A have than B". Role maps: the first
  number or owner -> thing / place, the second -> other, the operator, state, aggregate, extreme, comparison -> topic.
- `tests/w.lang.en.arithmetic.test.mjs`: shard = tool; every calc name is a builtin of the pin; lexicons = words;
  19 requests read with the right act, mode and roles (19 of 19); a world without calc reads none of them as calc.
  Frames test: 450 frames, 433 best, 12 tie, 5 known (unchanged). variants: 2 new verb-ellipsis variants marked.
  tools/measures-core.mjs: `calc.factor` is a plain number.
- Tests run (new push rule 14:10): arithmetic 4, frames 3, w.lang.en, list-frames, abstraction, alternations,
  templates, phrasing, coverage-report, catalog 8, validate 5, repo: all pass.

## 2026-11-15 — second worker takes block 15:00

- In this order: the two answers of 15:00 (joins report folds quoted and bare names; `holds` / `money` narrate=no);
  (1) the pin to the library's current release (0.130.0); (2) KR4 on the new pin (tools/lib/lang-en.mjs and
  tools/lib/choose.mjs: the tests of the local copies run on the library; [LIB] questions where it falls short);
  (3) `*-data.mjs` tables to hand-written shards, starting with tools/actions-data.mjs, one table per commit.

## 2026-11-15 — second worker: the two answers of 15:00

- `tools/joins-report.mjs` folds a quoted atom and the bare atom into one name (the engine's own atom pattern,
  sopworld 0.109; Q70 answered): in the declared joins, the match keys and the undeclared share. No number changes
  today (220 declared joins, 0 broken, 47 undeclared, 4 kept); the report's text says how values are compared.
- `holds` and `money` of k.actions.action are machinery: narrate=no (`MACHINE_KEYS` in tools/narration-core.mjs,
  by type.key).
- Tests: k.kinds.joins-report, k.kinds.relations, k.attributes: 20 pass.


## 2026-11-15 — first worker: w.person and the first-person frames (block 10:55, PSys2 Q19)

- New world schema **w.person** (std.schema format, CC0, 62 wires, 10830 bytes, no rule, no function): `person`
  (user, name, age, occupation a declared join to k.people.role, language many, note), `relative` (of, relation: 23
  values, count, name, age: "two kids" is one fact, count 2), `taste` (of, thing, type the catalog type that names it,
  stance likes or dislikes, strong): likes and dislikes as typed relations over the catalog. Words for the world, its
  kinds, every key, and the relation values ("kids" are children, "mum", "grandma"). WORLD.md. Terms after schema.org
  Person.
- **w.lang.en:** new frame key `mood` (declarative, interrogative, imperative; not said: a request, or a question for
  ask); the reference reader (tools/lib/lang-en.mjs) returns it; tools/lang-en-role-frames.mjs `frameLines` writes it
  (other shards unchanged). Shard **person-frames** (tools/lang-en-person-frames.mjs, in the build; 77 wires, 16,838
  bytes; needs=person): 8 statements (mood declarative, set acts.state, change/set, thing=me: name, called, age,
  relatives with a count, likes, dislikes, occupation, language) and 8 questions (mood interrogative, ask: what do you
  know about me, how many kids do I have, how old am I, name, likes, dislikes, job, languages); 2 derived lexicons
  (person.relation from w.person, person.occupation from the 36 jobs of k.people). The determiner part could not stay
  before the count (the determiners hold number words: "I have two kids" lost "two"); an "a/an" word part instead.
- Tests: tests/w.person.test.mjs (3): shard = tool output and its lexicons; 28 turns read back (act/mode, mood, args;
  "I have a cat" is read by no person frame); a session (user, two kids, tastes, age changed, a wrong relation and an
  age of 200 refused). tests/w.schemas.test.mjs lists ten world schemas. The general frame test (every frame reads its
  own example, alone and in its world), w.lang.en and diagram-frames tests pass. Build: variants regenerated.
- k.kinds structures (tools/structures-core.mjs): w.person is a graph (the person a node; a relative and a taste links
  from it, labelled by relation and stance), as every world schema has a structure (tests/k.kinds.structures.test.mjs).
- Push: test:changed green on seven rebased tips, each push rejected as main moved meanwhile; pushed under the
  reviewer's 14:10 rule (rebase; the commit's own tests, catalog and validate: 8 files, 66 pass). COVERAGE.md and
  ASPECTS.md regenerated in this commit where other workers' changes had left them stale.
- Owned by another worker (skw-worker4): the list and task frames; this commit touches only person-frames among the
  frame shards.


## 2026-11-15 — first worker: outlines as arrangement paths, "in the shape of X" (block 09:50 item F)

- The owner's case: "a diagram in the shape of a house" drew one circle. New in k.layouts (version 3):
  `k.layouts.outline` (name, from, shape or drawing as declared joins, points, tolerance) and `k.layouts.outline_point`
  (outline, n, x, y): the edge of a shape as an ordered closed path in the 0 to 100 frame, clockwise from the topmost
  point; and the layout `outline` (things evenly spaced along it). tools/outlines-core.mjs (in the build): 50 outlines
  in 3 shards, one per licence (CC0 520 wires 58,094 bytes; Apache/Unicode 331, 46,045; CC BY-SA 50, 6,009): 17 shapes
  of k.shapes by geometry (circle, oval, semicircle, triangle, square, rectangle, diamond, rhombus, parallelogram,
  trapezium, pentagon, hexagon, octagon, star, cross, arrow, ring) and 33 drawings traced (house, heart, tree, fish,
  cloud, moon, apple, car, bell, key, umbrella, rocket, castle, church, teapot, crown ...): parts filled on a 100 x 100
  grid (details, lines and arcs left out), the largest piece with its holes filled, its edge traced, simplified
  (Ramer-Douglas-Peucker, 1.5 units, raised to at most 40 points). Refused with the reason: boat and cat (in several
  pieces, the largest about 60 %). The house: 11 points, the ridge first (49, 15), the chimney, the body to y=95.
- The role `arrangement` (holds arrangement, markers in the shape of, shaped like, in the form of, in the outline of)
  of make, place and group in k.actions (tools/acts-core.mjs); the markers as prepositions of w.lang.en (hand-joins,
  role=arrangement). Shard **shape-frames** (tools/lang-en-shape-frames.mjs, in the build; 8 frames, needs=layout, 66
  wires): "make a diagram in the shape of a house", "a flowchart shaped like a fish", "a house-shaped diagram", "a
  diagram in heart form", "arrange the boxes in the shape of a star", "put the nodes in a heart shape", "lay the boxes
  out star-shaped", "group the dots in the shape of a heart"; lexicons outline.shape and outline.shaped derived from
  the outline shards (the adjective keeps its ending: "house-shaped").
- The library: `arrange(nodes, 'path', { points, closed })` exists since 0.129 (no [LIB] question needed); with the
  library's current build, 8 nodes along the house's outline go round it from the ridge (49,15 | 72,23 | 80,45 | 80,80 |
  59,95 | 24,95 | 20,63 | 21,37). The library's `outlineOf` is the convex hull of the part boxes (PSys2's lopsided
  pentagon); these outlines are the silhouette. With the pin at 0.113 the arrange test is skipped and says why.
- Tests: tests/k.layouts.outlines.test.mjs (5: shards and frames = generators; every path closed, in the frame,
  clockwise from the top, as many points as it says, geometry CC0 and traces in their drawing's licence; the owner's
  shapes present, the house's ridge at the top; 10 requests read back; arrange along the house, skipped before 0.129).
  The tests of the touched files: 15 files, 96 tests, 95 pass, 1 skipped.
- package.json: the step `lang-en-person-frames` lost in the w.person commit's rebase (sync.sh keeps main's side of a
  non-.md conflict) is back, with the two new steps.


## 2026-11-15 — first worker: items taken (block 15:35), and tonight's rebased commits checked

- Taken, in order: (1) **KR6 coverage** (usual colour, material, abilities of the 1,500 common things), (2) **chart
  selection rules** (which chart fits which data, from the visualisation literature), (3) time zones and dates if time
  is left.
- Look-back (block 15:35): the key changes of each of tonight's commits checked on main (23 checks over ab3b2ab,
  4719034, a4b31f4, 66e839f, 687d193, 922a864, 4d70c88, baacdad: schema slots, tool steps in package.json, importer
  and measures entries, tests): all present. The one change sync.sh dropped (the `lang-en-person-frames` build step
  of 4d70c88) was restored in baacdad.

## 2026-11-15 — third worker: Romanian reply and request templates (block 14:25 item 2)

- w.lang.ro: types request, reply, fill (schema); hand-written shards requests (46 rows: the 42 English act templates
  one to one, numbers in CLDR few / other) and replies (34 rows, 15 names); w.lang.en: type reply and shard replies
  (24 rows, the same 15 names, one / other). tools/lang-ro-core.mjs now rewrites only its own shards (it deleted the
  others).
- tests/w.lang.ro.replies.test.mjs: one-to-one names; every template realised with casă, copac, desen in every count
  (o casă, un copac, 3 desene, 20 de case, 3 copaci roșii, cele 3 case sunt acum roșii, cât de mulți copaci); English
  replies realised (I drew an apple, I drew 3 mice); 31 requests read back to their act by the Romanian frames.
- Not mirrored: the 151 discourse templates of w.lang.en (rhetorical moves of k.genres for essays and reports): no
  real row asks for them in Romanian.

## 2026-11-15 — fourth worker: k.colours is the home of every colour name (reviewer 14:45, KR2)

- The 141 CSS colours (shard k.colours/colours-css, css-colors 2.1.1, MIT, 233 wires) and the 29 common names
  (colours-common, CC0) moved from k.values.colour to `k.colours.colour` (ids k.colours.css.*, k.colours.common.*;
  `basic=` became `family=`), merged by name with the 33 colours of shard colours; skin and 11 colour words from
  k.values/psys2 to k.colours/psys2 (the import is not run again; tools/import/psys2.mjs names the new type).
  tools/values-core.mjs writes the two colour shards into k.colours (prefix colours-); colours-shapes-core keeps them.
- k.colours version 2: imports k.named; `css`, `rgb`, `rgb_about` (excludes rgb), `basic` (boolean, true on the 11
  basic terms of Berlin and Kay); family, tone, temperature no longer required (a CSS name may have only its value);
  `k.colours.basic`, the basic view, by rule (shard derived, 11 facts). family, k.values.coloured.colour,
  k.drawing.part.colour and k.attributes.drawn.drawn_colour join `k.colours.basic` (their 11-value list stays as the
  check until strict joins); drawn_shade joins k.colours.colour. k.values.colour (type, 5 slots, words, 2 shards) gone.
- tools/drawn-colour.mjs merges a colour's wires by name; 7 names that the CSS shard left without family now take the
  hand-written one (amber orange, beige brown ...), so 95 lines of k.attributes drawn-* changed. joins.mjs,
  relations-core.mjs, narration and the joins report follow.
- Questions va-01..03 moved to k.colours (co-v1..3: the RGB of crimson, the family of navy, the usual RGB of mustard);
  co-04 "which colours are greens" now lists 21 names (was 5).
- Tests: k.colours-shapes 8 (a new test of the colour names and the basic view), k.values 4, shared-modules 5,
  k.attributes 11, narration 3, questions 448, joins, joins report, relations, catalog, validate (1,166 files, 0
  errors), and coverage-report, import.psys2, counts, derived.load, generators, k.food, k.space, k.faces,
  k.objects.render, coverage, ranges, repo, page: all pass.

## 2026-11-15 — third worker: w.lang.en.fn (block 14:25 item 3, KR3, first)

- Type w.lang.en.fn (text, view: filler / politeness / wish / hesitation, at: lead / tail / any) and hand shard fn: 61
  words; tests/w.lang.en.fn.test.mjs (the reviewer's words with their views; 59 of 61 said in the hand-over's phrase
  groups, kindly and umm new).

## 2026-11-15 — third worker: KR3, k.feelings replies to w.lang.en; AGENTS.md rule 2

- k.feelings.feeling.reply (30 English sentences) moved to w.lang.en type feeling_reply (feeling joins
  k.feelings.feeling by name), hand shard w.lang.en/shards/feelings; the slot and its word left k.feelings, the
  strings left tools/feelings-core.mjs (one home); question fe-04 dropped from k.feelings (the reply is no k.feelings
  fact now; tests/k.feelings.test.mjs checks a reply in w.lang.en for every feeling).
- AGENTS.md rule 2: English is the language of ids and keys; words of a language live in its language world.
- Seen on main, not mine: tests/k.kinds.relations.test.mjs fails "make.arrangement holds arrangement" (a k.actions role
  whose holds value has no argument class yet).

## 2026-11-15 — third worker: end of block 14:25 round

- Pushed: class=dialogue; the two Romanian shapes (bench 104 / 82 / 64); Romanian reply and request templates (46
  requests, 34 + 24 replies); w.lang.en.fn (61); k.feelings replies to w.lang.en; AGENTS.md rule 2.
- Q78: where core.word should live for KR3 (vocab build) and [LIB] issue bindings for the deny `why` texts.

## 2026-11-15 — fourth worker: k.shapes is the one home of shape names (reviewer 14:45, KR2)

- k.values.shape gone (type, `solid`, words, shard shapes with 30 names and 30 word facts, 3 PSys2 names): every name
  was a k.shapes shape or a word of one (trapezoid -> trapezium, curve -> arc, rhombus -> diamond and k.shapes/psys2);
  dot is a new k.shapes shape (flat, round; 37 shapes); the words k.shapes lacked (ellipses, crescent moon, curves,
  curved line, globe shape, tube shape) are words of its shapes. k.shapes.shape.face and flat join k.shapes.shape
  (were k.values.shape). tools/values-core.mjs writes no shapes; joins.mjs, relations-core, the PSys2 import follow.
- tools/colours-shapes-core.mjs keeps the derived shards of k.colours and k.shapes (it deleted them on every run).
- Question va-12 ("is a cube a solid shape") is sh-v1 of k.shapes (kind solid).
- Tests: k.colours-shapes 8, k.values 4, shared-modules 5, questions 448, narration 3, import.psys2, joins, joins
  report, counts, k.objects.render, catalog, validate (1,174 files, 0 errors), repo: pass. k.kinds.relations fails on
  main before this commit too ("make.arrangement holds arrangement": the outlines commit baacdad added the role).
- Look-back (reviewer 15:35): my rebases tonight went through my own scripts (logs by union, generated files from main
  then rebuilt, any other conflict stopped); checked on main: the list-frames build step, the w.tasks typicality and
  structure, the season joins and the frames' WORLD.md sections are all there; no change was lost.

## 2026-11-15 — fourth worker: k.space.kind.made_of is `material` (reviewer 14:45, KR2; Q73)

- The key of what a kind of body in space is made of is `material`, the key k.attributes uses (KR1 item 4): slot, key
  words (material, made of, made), 7 facts of k.space/kinds (star: gas; comet: ice, dust ...), the question sp-13, the
  ask-domains template and the key-words table. `made_of` stays only on k.food (ingredients). Relations, narration,
  the joins report and the catalog follow.
- Tests: k.space, questions (all 473 of the run), narration, phrasing, catalog, counts, validate (1,176 files, 0
  errors): pass.


## 2026-11-15 — first worker: the argument class `arrangement` (main was red after baacdad)

- baacdad added the role `arrangement` (holds arrangement) to make, place and group in k.actions without an argument
  class in k.kinds: tests/k.kinds.relations.test.mjs was red on main. Added the class `arrangement` to
  tools/relations-core.mjs (`ARGUMENTS`: how things are laid out, a named arrangement or the outline of a shape; types
  k.layouts.layout and k.layouts.outline); k.kinds/shards/arguments regenerated. k.kinds.relations, the k.actions and
  k.layouts tests, catalog, validate, repo: 10 files, 52 pass, 1 skipped.
- Lesson: a new role (or `holds` value) on k.actions touches k.kinds' argument classes, so k.kinds.relations is one of
  the touched tests of such a commit; I had not run it.

## 2026-11-15 — third worker: words shards, the first three worlds (Q78 (1), reviewer 16:10)

- k.feelings (11 word wires), k.wearables (19), k.food (13): their schema's core.word facts moved to
  w.lang.en/shards/words-<world>.sop (ids w.lang.en.word.<world>.…); tools/lib/words-shards.mjs; build-catalog reads
  a words shard as the world's schema words; key-words writes the block there; tests/ask-real checks the block and no
  core.word left in the schema.
- vocab.json and vocab-kinds.json: byte-identical before and after (no diff, not even ordering). index.json lists the
  three new shards. COVERAGE.md was stale on main (k.colours 71 -> 73, k.values 20 -> 6, from another commit):
  regenerated here.
## 2026-11-15 — fifth worker: full `npm run test:all` on main (db16219)

- 88 files, 3,151 tests: 3,131 pass, 0 fail, 20 skipped, 631 s summed (load average about 9). No file "not run" (none
  killed, none with 0 tests).
- Over 30 s: only tests/questions.test.mjs (87.3 s, 1,928 MB, 448 questions of every world). Next slowest: import.geo
  28.5, k.attributes 27.0, w.lang.ro.frames 24.1, w.lang.ro 24.1, k.kinds.relations 22.0, w.lang.en.templates 21.7,
  k.procedures 20.4, derived.load 20.0, k.objects.render 19.5. Before this round eight files were over 30 s
  (catalog 171, derived 89 killed, questions 79, k.objects.render 79, k.attributes 64, gallery 56, k.cores 51,
  k.objects.names 43).
- Skipped (raw data absent or by design): coverage 4, import.wordnet 3, coverage-report 2, import.objects 2, and one
  each in import.dicebear, import.noto, import.psys2, k.actions.acts, k.animals, k.objects.drawables, k.parts,
  k.people.given-names, k.units.currencies.

## 2026-11-15 — fifth worker: tools/sync.sh never chooses a side for a hand-written file (block 15:35, serious)

- tools/sync.sh:27 took main's side (`checkout --ours` during a rebase) for every conflicted file that was not .md and
  went on, and union-merged every .md; that dropped the w.person build step from package.json. Now: a file whose
  merge attribute is `regenerate` (the generated files, next commit) keeps main's side and is rewritten by
  `npm run regenerate` (new script: measures-core, the build, the reports where the raw files exist); every other
  conflicted file stops the script with the list of files and exit code 1, the rebase left in progress, both sides in
  the file. After the rebase the regenerated files go into the worker's last commit. A failed `git pull` (a dirty tree)
  stops it too.
- Test (tests/sync.test.mjs, new, on a toy repository with a bare origin and two clones): a README.md edited on both
  sides stops sync.sh with "README.md" listed, the rebase in progress and both lines kept (the old script union-merged
  it and went on); a conflict only in a generated file and the log goes through, the generated file is regenerated
  from both sides' sources, the log keeps both entries, and the regenerated file is in the worker's commit.

## 2026-11-15 — fifth worker: generated files no longer conflict on a rebase (block 15:15); NOTE TO EVERY WORKER

- Chosen: they stay in git (GitHub Pages serves docs/ from main with no build before publishing, so taking them out
  would leave the site without a catalog) and get a merge rule. `.gitattributes`, written by tools/generated.mjs:
  127 generated paths (index.json, vocab.json, vocab-kinds.json, LICENSES.md, JOINS.md, COVERAGE.md, ASPECTS.md,
  JOINS-REPORT.md, PARENTS.md, the k.objects and k.scenes previews, the w.lang.en dictionary, and the 113 shards whose
  `# script:` is a tool of `npm run regenerate`) take the merge driver `regenerate` (keep main's side, regenerate);
  worker-log.md, questions.md, worker-tasks.md, docs/lessons.md and CHANGELOG.md take git's `union` merge. README.md
  stays hand-written (its counts are rewritten by the build, but a conflict there stops sync.sh).
- `npm run regenerate` = measures-core, the build, tools/generated.mjs, and the coverage and aspects reports where the
  raw files exist (without them COVERAGE.md and ASPECTS.md stay as main has them).
- **Every worker:** rebase with `tools/sync.sh` (it configures the driver in your clone with `git config
  merge.regenerate.driver true`; without that config a plain `git rebase` still stops on generated files, take main's
  side and run `npm run regenerate`). A conflict in a hand-written file stops sync.sh with the list: resolve it by hand.
  Then compare `git show --stat HEAD` with what you changed, and push by the 14:10 rule. AGENTS.md has a section
  "Generated files and rebases".
- Test (tests/sync.test.mjs, +1): .gitattributes is what tools/generated.mjs writes; index.json, vocab.json,
  JOINS-REPORT.md, COVERAGE.md and a derived shard are `regenerate`; package.json, tools, README.md and schemas are not.

## 2026-11-15 — fifth worker: tonight's rebased commits checked for lost changes (block 15:35)

- Method: for the 138 commits on main since 18:00 yesterday, every tools/ and tests/ path named in the commit message
  or in the worker-log lines the commit added, against the commit's own file list and against main; every tool a
  commit says is "in npm run build", against package.json; and every commit that changed package.json, for build steps
  it removed.
- **Lost:** 6e1ad74 (K7, third worker, 02:59) says "tools/lang-en-time-frames.mjs (in npm run build)" but changed no
  package.json, and no later commit added it: the build step was dropped (by sync.sh's `checkout --ours`, most
  likely). Restored here, after lang-en-arithmetic; its shard time-frames.sop was still fresh (the tool gives it byte
  for byte), and .gitattributes now lists it as generated (128 paths).
- Already restored by its author: the w.person build step (4d70c88). No commit removed a build step; every other path
  the commits name is in the commit or on main (tools/bench-ro-frames.mjs is the library's bench, not ours).
- Correction to my previous entry: the generated paths are 12 named outputs and 115 shards (127, now 128), not 113.
## 2026-11-15 — fourth worker: the plurals of every catalog noun in w.lang.en (reviewer 14:45, KR2 item 4, part 1)

- tools/lang-en-catalog-plurals.mjs (in npm run build after lang-en-core, before lang-en-morph) writes w.lang.en shard
  catalog-plurals (45 pairs, 5597 bytes, CC0, own): for the head noun of every k.objects / k.animals name that is a
  noun of k.words (1,381 heads), the rules of w.lang.en are checked both ways; where the noun itself or its plural
  does not read back (cave/caves read "caf", axe/axes "ax", lens "len", emu/emus, die/dies, glove, hive, stove ...),
  the pair is a w.lang.en.irregular fact; plural-only nouns (scissors, trousers, tights, 15 by hand) have one form.
  lang-en-morph derives their irregular_form wires (irregular-forms.sop).
- Reference reader (tools/lib/lang-en.mjs inflect): the singular of a listed pair is read as a singular ("lens" is no
  plural of "len"). Told to the library with Q79.
- 1,356 of the heads read both ways (tests/w.lang.en.catalog-plurals.test.mjs, 2 tests); 6 do not: WordNet lists a
  read-only classical plural for them (hippopotami, irides, mantes, plateaux, macaronies, forceps), and one singular
  has one irregular fact, so the English plural the rules write (hippopotamuses) does not read back: Q79.
- Tests: catalog-plurals, w.lang.en, morph, frames, list-frames, question-frames, phrasing, catalog, counts, validate
  (1,177 files, 0 errors), repo: pass. w.lang.en.templates and k.kinds.relations fail on main before this commit
  (the arrangement role of baacdad has no template and no argument class).

## 2026-11-15 — fourth worker: Q78 of the catalog plurals renumbered Q79 (the third worker's KR3 question is Q78)

- KR2 item 4 status: plurals done (catalog-plurals). Verb forms not moved yet: 1,507 form words of 929 k.words lemmas
  and the k.actions form words; 1,043 of the k.words forms are no w.lang.en irregular_form (most are regular forms the
  class dictionary generates: pegged, married, pettier), so dropping them needs the library's inflectBy to confirm
  each one first (after the pin move). Number words not moved yet.

## 2026-11-15 — third worker: fn views for w.lang.ro (reviewer 16:10 (c))

- Type w.lang.ro.fn and hand shard fn (44: filler, politeness, wish, hesitation, focus); lang-ro-frames derives the
  phrase groups skip, focus, wish and the leads from it. Bench: 104 / 82 / 64 -> **105 / 83 / 65** ("pai muta casa pe
  pamint" reads place on the ground). tests/w.lang.ro.frames.test.mjs: views, the groups follow the shard, three real
  shapes (păi, ăă, te rog at the end).

## 2026-11-15 — third worker: Romanian data out of the tools, step 1: the hand dictionary (reviewer 16:10 (b))

- The 270-lemma table left tools/lang-ro-core.mjs: the TSV files of w.lang.ro/dictionary are the home; the tool reads
  them (LEXICON, dictionaryRows) and writes them back sorted (byte-identical); dictionary-unimorph regenerates the same.
- Step 2: the Romanian frames are data of w.lang.ro: shard frames is hand-written (46 frames), tools/lang-ro-frames.mjs
  is gone; tests/w.lang.ro.frames.test.mjs reads the frames from the shard (each says an English frame, parts in order,
  roles are its role parts) and checks that skip and focus follow the fn shard.

## 2026-11-15 — fifth worker takes: test:all on main hourly, questions.test under 30 s, KR6 abilities (`can`)

- KR6: I take abilities (`can` of k.attributes.thing for the 1,500 common things, from WordNet relations and the
  k.actions roles in data). The first worker takes colour and material.
## 2026-11-15 — first worker: KR6 coverage, what the data here gives (block 15:35)

- From the sources in data, for the 1,500 common things (usual colour missing 82 %, material 73 %, abilities 77 %):
  - **WordNet glosses** (tools/attributes-glosses.mjs, shard `k.attributes/shards/things-glosses`, WordNet-3.0, 66
    wires, 12238 bytes): three rules on the gloss of the sense kept (a basic colour in the head noun phrase; a material
    in the head or after "made of"; the verb of a relative clause that is an action of k.actions), only where the
    catalog has no value. **Every** proposed value checked by hand (fewer than 50 per attribute, so the audit is the
    whole set; sources/coverage/kr6-audit.tsv, with why for each wrong one): colour 3 of 22 wrong (14 %), material 8 of
    38 (21 %), can 7 of 31 (23 %); only the right ones are published, a value the audit has not seen stops the tool.
    Most wrong ones are WordNet's sense kept not being the one people mean (bumper as a full glass, stretcher as a
    painter's frame, cowl as an engine cowling). Missing now: colour 81 %, material 71 %, can 76 %.
  - **WordNet substance meronyms**: 46 things, mostly chemistry (protein, keratin, palmitic acid): not taken.
  - **Inheritance along k.kinds** (a thing takes its parent's value): measured and refused, it gives nonsense (a star
    blue from sky, bread made of china from dish, a chicken that flies).
  - **ConceptNet**: no local copy (the importer needs sources/conceptnet/raw). **Wikidata**: the query service is
    refused by this machine's proxy (403).
- [DATA] ask **Q80** (questions.md): Wikidata color / made from material / has use for the items with a WordNet 3.1
  synset id (P8814, CC0); ConceptNet 5.7 CapableOf / MadeOf / HasProperty / UsedFor (CC BY-SA 4.0); Visual Genome
  colour attributes (CC BY 4.0); columns and sizes given. (Q78 and Q79 were taken by other workers meanwhile.)
- Derived: k.kinds `material-wordnet` (30 up edges from the new materials, WordNet licence; its description added to
  tools/kinds-core.mjs), k.attributes `same-*` (in=k.attributes.thing where a thing gained a value). tests/
  k.attributes.test.mjs reads the hand-written things by their source (a thing can now also have values of another
  shard, merged by name). Tests: tests/k.attributes.glosses.test.mjs (3); the touched tests (k.attributes*, k.kinds*,
  k.diagrams, coverage-report, catalog, validate, repo): 14 files, 78 pass.
- tools/attributes-glosses.mjs is a step of `npm run build` (before kinds-core, which reads its materials), so its
  shard is generated (.gitattributes by tools/generated.mjs: merge=regenerate); the audit stays hand-written. A value
  the rules propose that the audit has not seen stops the build until it is checked.


## 2026-11-15 — first worker: the outline arrangement in w.lang.en's phrases and templates (red after baacdad)

- tests/w.lang.en.arrangement.test.mjs (a phrase for every repeating arrangement of k.layouts: `outline` had none) and
  tests/w.lang.en.templates.test.mjs (the holes count: the role `arrangement` had no template) were red on main after
  baacdad. Added to hand-arrangements three phrases with layout=outline ("in the shape of", "shaped like", "in the form
  of") and to templates-acts three templates: make.kind.arrangement ("make a {kind} in the shape of a {arrangement}."),
  place.arrangement (mode layout) and group.arrangement, each with its frame of shape-frames; the test's sample
  fillers for them (house, star, heart, circle). All w.lang.en tests, k.kinds.relations and k.layouts.outlines: 19
  files, 97 pass, 1 skipped, 1 failing that is not this change's: w.lang.en.catalog-plurals ("axe: axes -> ax"), red
  without it too (the plurals work of KR2 item 4).
- Lesson: a new role or arrangement reaches w.lang.en's phrases and templates as well as k.kinds' argument classes; all
  w.lang.en tests belong to such a commit's touched tests.
## 2026-11-15 — third worker: plural rules as facts (reviewer 16:45, the library's Q79), first

- w.lang.en.count and w.lang.ro.count (class, rule in CLDR syntax, samples), shards counts copied from CLDR 48
  plurals.json (sha256 noted in sources/cldr/SOURCE.md; Unicode-3.0). The Romanian few rule is CLDR's "v != 0 or n = 0
  or n != 1 and n % 100 = 1..19" (the note in Q79 had 2..19). tests/w.lang.counts.test.mjs: the rules agree with
  Intl.PluralRules for 0..300 and decimals in both languages; 3 case, 20 de case, 101 case, 120 de case; template rows
  name only these classes.
- The article chosen by gender, not given by the caller: w.lang.ro.fill role=art lemma=un on the 7 requests and 4
  replies that say {art@kind}; the three new English arrangement templates mirrored (49 Romanian requests, 33 read back
  to their act). tests/w.lang.ro.replies.test.mjs realises without an art filler.

## 2026-11-15 — fifth worker: test:all on main at e2fd461 (05:30); tests/questions.test.mjs under 30 s

- **Full suite at e2fd461** (a clean worktree of main): 98 files, 3,184 tests, 3,159 pass, **3 fail**, 22 skipped,
  532 s; no file not run. Red, with the commit that caused each:
  - tests/w.lang.en.arrangement.test.mjs (no phrase for the `outline` arrangement) and tests/w.lang.en.templates.test.mjs
    (the `arrangement` role has no template): **baacdad** (first worker, outlines), being fixed by the first worker.
  - tests/generators.test.mjs (core-plurals is stale: the generator now gives 186 plurals, `ax/axes` added):
    **77f1294** (fourth worker, catalog plurals) changed tools/lib/lang-en.mjs so the rules no longer read axes -> ax,
    and pushed without the build (lang-en-core is in it since db16219), so core-plurals was not rewritten. Fix: run
    `node tools/lang-en-core.mjs` (or `npm run build`) and commit the shard. Questions.md Q81 (first written Q80, which the first worker had taken).
  - Over 30 s: tests/catalog.test.mjs 118 s (a fresh worktree: no .validate-cache.json, every world validated, as on a
    fresh clone; 12 s with the cache) and tests/questions.test.mjs 44 s (before the change below).
- **questions.test.mjs:** a world whose own shards pass 5 MB (k.objects 36 MB with 271,000 points, k.words 9.4 MB) is
  loaded with its imports in full and, of its own shards, only the facts of the types its questions ask or tell and
  its words; the others in full as before. 447 questions pass. 44-87 s -> 22 s (load average about 7); k.objects alone
  was 50 s of it.
## 2026-11-15 — fourth worker: two plurals for one singular, `register` (reviewer 16:45; Q79 (2))

- w.lang.en.irregular: identity singular + plural (`plural` id=true), new key `register` (classical, common). WordNet's
  read-only plurals carry register=classical (core-plurals, 185 wires); catalog-plurals adds the common plural of the
  catalog nouns that had only a classical one (hippopotamuses, irises, mantises, macaronis, plateaus; 50 pairs).
  forceps is written as forceps (WRITTEN in tools/lang-en-core.mjs). tools/lang-en-core.mjs no longer reads
  catalog-plurals (it is built after it, from it).
- Reference reader: a common pair of a plural is read before a classical one ("axes": axe before ax).
- The pinned reader takes it: lang-en-morph writes both as std.morph irregular forms of the cell num=pl, the classical
  one `variant=yes` (read, not written: hippopotami), the common one written (hippopotamuses). So Q79 (2) needs no
  library change; Q79 (1) (the singular of a listed pair read as a singular) stays for the library.
- Catalog nouns read both ways: 1,362 of 1,362 (was 1,356). Tests: catalog-plurals, w.lang.en, morph, frames, catalog,
  validate (1,181 files, 0 errors), repo: pass.
- Romanian words for the kinds of the 10 published world schemas (shards w.lang.ro/words-w.*), 17 new dictionary
  lemmas (287); build-catalog reads only w.lang.en's words shards into vocab.json (unchanged). tests/w.lang.ro.words.

## 2026-11-15 — fifth worker: KR6 abilities (`can`) from WordNet's hypernyms and the k.actions agents

- tools/attributes-abilities.mjs (not in the build: a new proposal must be checked by hand first; its test names any
  unchecked one) writes shard k.attributes/things-abilities (WordNet-3.0): for the catalog things with no ability,
  (1) the actions of k.actions whose `who` names the thing (a baby cries, a stone sinks; not person or animal), and
  (2) the abilities the catalog gives a kind (k.attributes, k.animals, k.actions agents) carried down WordNet's
  hypernym chain to the things under it, from the nearest kind that says anything, only where the kind's word means
  the same WordNet sense (its chain is the same: the lamp "bulb" gives nothing to an onion), never from a wide kind
  (entity, artifact, animal, person, plant, food ...); a k.food name whose first sense is no food (plum: the tree) and a
  name with senses in two domains (queen, needle) are skipped.
- **Hand check of every proposal** (sources/coverage/abilities-audit.tsv, more than the 50 asked): 137 values for 58
  things, **16 wrong (11.7 %)**: louse fly / fly away (wingless), gear roll, the catalog's mortar and queen (other
  senses than WordNet's first: the grinding bowl, a person or chess piece; 4), rooster hatch / drop / make / build /
  sing (bird abilities that a rooster has not; 5), shipwreck sail / leave / float / move (4). Written: 121 values for
  56 things (laptop, computer, engine, motor: work; freighter, tanker, destroyer, battleship: sail, float, sink ...;
  poodle: the dog's 21; stag: run, jump, swim; baby: cry, crawl; sky: rain, snow ...).
- **Coverage of the 1,500 common things** (COVERAGE.md, rebuilt with the raw files): "what it can do" by its name 300
  -> 340 (20 -> 23 %), none 1,136 -> 1,090 (76 -> 73 %). What is still missing is mostly things that do nothing by
  themselves (world, bed, road, picture, building, bag, box, key, wall): "can" does not apply to them, so the 73 % is
  not a gap to fill; a usual use (`used_for`) is their attribute.
- Test (tests/k.attributes.abilities.test.mjs, new, 2): the shard is fresh; at most 20 % of proposals wrong; no value
  checked wrong is written; laptop works, freighter sails, baby cries, a louse only crawls, plum / onion / queen /
  mortar / person get nothing, a shipwreck only sinks.
## 2026-11-15 — second worker: the one build moved to sopworld 0.130.0 (ad4d456; reviewer 15:00 item 1)

- `tools/sopworld/sopworld.mjs` = the library's `docs/sopworld.mjs` at ad4d456 (release 0.130.0, build 150c9d0ec306);
  VERSION, the validate test, AGENTS.md, README.md, docs/index.html, docs/worlds/README.md, w.lang.en/WORLD.md and the
  alternations test's comment name it. `npm run build`: only the catalog's commit and hash changed (34 worlds,
  1,132 shards, 33,461 words, 0 warnings).
- Names the library removed since 0.113 (`cousins`, `judgeFix`, `liftTokens`, `continueAct`, `variantsOf`, the old
  `calibrate`, `route`, `veto`, `typedWorldOf`, `readRolesByTypes`, `assignBySlotTypes`, `motionPlan`), by grep in
  tools/ and tests/: none is called (only comments say "the library's cousins"). Every one of the 30 names tools and
  tests import from the build exists in 0.130.
- Tests whose result changes: **none**. Full run on 0.130 (`node tools/test-run.mjs`, 92 files one at a time):
  3,165 tests, 3,157 pass, 1 fail, 7 skipped, 580 s. The one failure, coverage-report, was already red on main
  (COVERAGE.md said w.list has 2 keys; it has 1 since w.list v4): regenerated here. The skips are the same raw-file
  skips as on 0.113 (import.dicebear, noto, objects 2, psys2, k.units.currencies) plus talk-frames' new one.
- No silent change either: the 12 test files that call the library's functions beyond parsing (k.actions.effects /
  families, k.compose, k.procedures, k.motion, w.lang.en, morph, templates, alternations, frames, w.lang.ro, ro.frames)
  were run under 0.113 and 0.130 and their full spec output compared: identical.
- After the rebase onto 7ecf82d, the tests the incoming commits touch, on 0.130: 85 files, 3,048 pass, 5 fail. The
  five (coverage-report, k.kinds.relations, w.lang.en.templates, k.values, w.lang.en.arrangement) fail the same way
  with the 0.113 build on that tip: red on main since ccf47d7 / 7e31925 (k.colours as the home of colour names, the
  fn words), not from the pin; left to their author (14:10 rule 3).
- Rebased again (onto the catalog-plurals commits): 50 touched files on 0.130, 4 fail, each failing the same way with
  0.113 on that tip (coverage-report, w.lang.en.arrangement, w.lang.en.templates, and w.lang.en.catalog-plurals:
  "axes -> ax"): red on main, not from the pin.

## 2026-11-15 — fourth worker: number words have one home, w.lang.en (reviewer 16:45, KR2 item 4)

- The 222 number words (cardinals and ordinals to ninety-nine by the tens-and-units rule of tools/values-core.mjs,
  hundred ... billion, once / twice / thrice, single ... quadruple, pair ... dozen, half ... three quarters) are
  `w.lang.en.number` (new type: text, kind, value, value_about) in shard w.lang.en/number-words (written by
  values-core); k.values.number (type, 4 slots, words, shard numbers) is gone. The 13 numerals and 11 ordinals of
  w.lang.en stay as the grammar's closed classes (the parser's NUM and ORD) and agree with w.lang.en.number (a test).
- Followers: measures (w.lang.en.number value plain), relations-core (the amount and number argument classes),
  narration, the PSys2 importers' texts (FROM-PSYS2.md, the w.lang.en numbers header), w.lang.ro's numeral test.
  Questions va-10, va-11 are en-n1, en-n2 of tests/w.lang.en.questions.jsonl.
- Tests: k.values (5), w.lang.en 22, w.lang.ro, questions (446 pass; at-07 "which things are usually pink" fails on
  main before this commit too: the KR6 glosses added rhubarb), relations, narration, import.psys2, generators,
  counts, catalog, validate (1,185 files, 0 errors), repo.

## 2026-11-15 — fourth worker: verb forms have one home, w.lang.en; each checked with the pinned library (reviewer 16:45, KR2 item 4)

- Pin 0.130 (second worker) in place. tools/forms-report.mjs checks every form word of k.words (WordNet's exception
  lists) and k.actions with the pinned library: confirmed when std.morph reads it back to its lemma with the w.lang.en
  dictionary (`analyse`) or `inflectBy` writes it. k.words: 1,507 forms of 929 lemmas, 1,459 confirmed and dropped
  (163 shards; the importer tools/import/wordnet.mjs drops them the same way, `confirmed` injectable for its fixture
  test); 48 kept and listed by class in docs/worlds/w.lang.en/FORMS-REPORT.md (archaic and British variants: curst,
  swopped, gript, quitted; foreign plurals: frauen, senores; WordNet entries that are no form of that lemma: cola of
  colon, dive of diva; and be's am / are, which w.lang.en has as a closed class). k.actions: 569 of 570 confirmed (a
  phrase by its first word and the same particle); tools/actions-core.mjs no longer has its own English rule
  (formsOf goes) and writes only `wetted`. FORMS-REPORT.md is generated (in the build, .gitattributes).
- Tests: w.lang.en.forms (new, 2), k.actions (examples use the verb by the library), k.words, import.wordnet,
  questions (446; at-07 fails on main before), w.lang.en, frames, paraphrase, generators, sync, catalog, counts,
  validate (1,196 files, 0 errors), repo: pass.

## 2026-11-15 — fourth worker: the PSys2 / catalog seating difference, a proposal (reviewer 16:45 item 4)

- Read psys2 worlds/plan.seating/schema.host.sop (40292c6) against w.seating 2: guest at a table with a capacity vs
  on a seat, `seats` default 4, `colour` on table and guest, needs one value. questions.md Q82 proposes one schema
  (guest.table beside an optional seat with a second capacity and a deny that keeps them together; no seats default:
  the typical range says it; colour joined to k.colours, no default; needs stays many). w.seating is unchanged.
## 2026-11-15 — second worker: KR4 step 1, the tests on the library (reviewer 15:00 item 2)

- `articleFor`: the library's gives the local copy's article for all 8,886 nouns of k.words: the local copy is
  deleted; `realiseEn` and the templates and phrasing tests call the library's (`enWorld()` in tools/lib/lang-en.mjs:
  w.lang.en as a World, built once).
- `inflect` vs the library's `inflectBy`: plurals differ for 4 of 8,886 nouns (axis, basis, forceps right in the
  library, taxis wrong); singulars back from the plural: library 8,589 right, local 8,299. On the catalog's 1,356 head
  nouns the library reads 1,319 both ways: 37 cases (bus -> bu, iris -> iri, houses -> hous ...) are **Q82 [LIB]**.
  `tests/w.lang.en.library.test.mjs` checks the library's inflectBy on the hand-over table and the catalog nouns with
  those cases listed (a listed case that reads fails the test). The local `inflect` stays only for the tools that write
  core-plurals and catalog-plurals.
- `frameReader` vs the library's `readFrames` on the 498 frame examples: the same frame for 249, the same act and mode
  for 37, another reading for 212 (no `needs`, role maps, fixed values or host lexicons): **Q83 [LIB]**; the reference
  reader and clauseReader stay. The test measures every third example (82 of 166) to stay under 30 s (27 s).
- `realiseEn` vs the library's `realise`: no article form, no English plural, no capital: **Q84 [LIB]**; the local
  slot filling stays, with the library's articleFor.
- `solveChoices` (tools/lib/choose.mjs): next step.
- Tests: library 4, templates, phrasing, w.lang.en, catalog-plurals, repo: 40 pass.
## 2026-11-15 — first worker: k.charts, which chart fits which data (block 15:35 item 2)

- New world **k.charts** (CC0; tools/charts-core.mjs; shard charts 95 wires, 17,186 bytes, no warning): 5 works cited
  (Mackinlay 1986, expressiveness and effectiveness; Cleveland and McGill 1984, the ranking of encodings; Few 2012 and
  2007; Zelazny 1985); 9 kinds of chart, each with the w.chart form that draws it, its mark, its main encoding and the
  data types of its axes (nominal, ordinal, quantitative, time; `whole` for the parts of one whole); 14 encodings in 4
  rankings (Cleveland and McGill for quantities; Mackinlay for quantitative, ordinal, nominal data); 7 relationships
  of data (Few: time series, ranking, part-to-whole, deviation, distribution, correlation, nominal comparison); 15
  selection rules (relationship -> kind, rank, conditions categories_max, series, points_min, why, sources): "a share
  of a whole -> pie (at most 5 parts, one whole) or stacked bar (several wholes)", "a trend over time -> line".
- Its English words in w.lang.en (shard words-k.charts, KR3: the type words, chart names such as "bar graph", "pie
  graph", relationship phrases such as "share of a whole", "trend over time"; no single common word, which would
  read "compare" or "pie" as a value), and the key words by tools/key-words.mjs there. Measures for its integers.
- Tests: tests/k.charts.test.mjs (4: shard = tool; joins to w.chart forms, encodings, relationships; the rankings'
  order; the reviewer's cases through chartsFor and the axes' types of each best kind). The touched tests: 29 files,
  143 pass, 1 failing that was not this change's (w.lang.en.catalog-plurals); after the rebase on its fix: 23 files, 116 pass.

## 2026-11-15 — second worker: KR4 step 2, compositions on the library's planner

- The library's planner reads `choose` bindings itself (std.plan since Q57). tests/k.compose.test.mjs: the 100 seeded
  stories and the 20 seeded reports are now solved by `planner(...).plan` (not tools/lib/choose.mjs); every story holds
  every hard constraint of k.story and expands to the document and its five chapters; every report's next steps are
  not yet done. 8 pass, 5.9 s.
- What the planner does not give yet: statements and history entries as values ("[object Object]" in `chosen`), choices
  fixed by the host, the first solution without a seed: **Q85 [LIB]**; choose.mjs stays for those tests only.
## 2026-11-15 — fourth worker: w.seating version 3 and its frames in English and Romanian (reviewer, Q82 approved)

- w.seating 3: guest.table (a w.seating.table) beside the optional guest.seat, a deny "A guest on a seat is at the
  table of that seat."; the capacity counts guests at a table (the engine takes one capacity per kind; version 2
  counted seats); `colour` on table and guest (11 basic colours, joined to k.colours.basic); `seats` has no default.
- Frames: w.lang.en shard capacity-frames (acts.make.for "Add a table for 4." and its template make.for, attribute
  seats); w.lang.ro shard seating-frames (ro.make.name.place "Adaugă un invitat numit Ana la masa 1.", ro.make.for
  "Adaugă o masă pentru 4.", the request make.for and its article fill); words-w.seating gets the new keys (culoare, la
  masa). tests/w.lang.ro.replies.test.mjs reads requests and fills from every w.lang.ro shard.
- With the library's examples/seating-app.mjs on this tree (a scratch copy pinned to my clone): "add a guest called Ann
  at table 1", "make table 1 blue", "Adaugă un invitat numit Ana la masa 1" are done; "add a table for 4" and
  "Fă masa 1 albastră" read right but the kit still refuses them: Q85 [LIB] (and [PSYS2]: what is left against
  plan.seating).
- Tests: w.schemas 18 (a version 3 session), frames, templates, w.lang.en, w.lang.ro, w.lang.ro.frames, replies,
  k.kinds relations, joins report, structures, catalog, validate.

## 2026-11-15 — fifth worker: test:all on main at 5b90131 (06:20), an hour after the first

- 105 files, 3,206 tests: 3,180 pass, **5 fail in 4 files**, 21 skipped, 615 s; no file not run. The three red files
  of 05:30 are green (baacdad's two fixed by the first worker; core-plurals rebuilt). Red now, each checked against
  its commit's parent (green there, red at the commit):
  - tests/k.actions.effects.test.mjs (storyState's verb table: `set` missing) and tests/k.words.paraphrase.test.mjs
    ("bought", "got" reach no sense): **26ddd3f** (fourth worker, verb forms have one home in w.lang.en).
  - tests/questions.test.mjs, at-07 "which things are usually pink" (rhubarb now usual pink) and one more of
    k.attributes: **f4fcb4f** (first worker, KR6 colour from glosses); the expected lists need the new values (or the
    values are wrong).
  - tests/k.attributes.glosses.test.mjs fails without WordNet's raw files (ENOENT index.noun) instead of skipping:
    **f4fcb4f** too.
- Over 30 s: k.attributes 42.2 s and w.lang.en.library 33.6 s (load average about 7; both 24-27 s when quieter).
  questions.test.mjs 23.9 s. Questions.md Q86.

## 2026-11-15 — second worker: tools/actions-data.mjs into hand-written shards (reviewer 15:00 item 3, first table)

- The five `k.actions/shards/actions-*.sop` are the home of the 192 everyday actions, their near words and the kept
  form (wetted): 646 wires, byte for byte what the generator wrote, with the header now `# script: none
  (hand-written)` and a source line saying edits go there. tools/actions-data.mjs and tools/actions-core.mjs are
  deleted (the forms they held are w.lang.en's since 26ddd3f; nothing derived from the table is lost).
- What the generator checked is in tests/k.actions.test.mjs: hand-written headers, one fact per name, a known group,
  opposites and undoing name other actions (both sides), the example uses the verb (by the library's form check).
- tests/k.actions.effects.test.mjs was red on main since 26ddd3f (the verb forms left k.actions): its verb table now
  takes the third person and past from w.lang.en through the library's inflectBy; 8 stories read again.
- Tests: k.actions 4, effects 2, acts, families, w.lang.en.forms, catalog, validate, repo: 37 pass.
## 2026-11-15 — fifth worker: COVERAGE.md counts `can` only where it applies (block 18:10 (3))

- `canApplies` (tools/attributes-abilities.mjs): a thing acts by itself when its k.attributes kind is animal, creature,
  person, plant, vehicle, machine, device, appliance, sky or weapon; a k.food name does not; otherwise its first WordNet
  noun sense is an animal, a person, a plant or a natural phenomenon, or under machine, conveyance, electrical or
  electronic device, source of illumination, timepiece, celestial body, weapon or appliance. tools/coverage-report.mjs
  counts "what it can do" over those (`APPLIES`) and writes the rule under the table.
- COVERAGE.md: "what it can do (of the 463 it applies to)": by its name 255 (55 %), through its drawing 52 (11 %), none
  156 (34 %); before, over all 1,500: 340 / 70 / 1,090 (73 % "missing", most of them beds, roads, boxes). The gap list
  is now of things that act (earth, camera, planet, bullet, pig, sheep, fridge, oven ...).
- Test (tests/coverage-report.test.mjs): the row says "of the N it applies to", its counts add up to N, and N lies
  between 300 and the 1,500.

## 2026-11-15 — second worker: tools/scenes-data.mjs into hand-written shards (reviewer 15:00 item 3, second table)

- The four `k.scenes/shards/scenes-*.sop` are the home of the 61 scenes and what each has (1210 wires), byte for byte as
  written before, the header now `# script: none (hand-written)`. tools/scenes-data.mjs is deleted: it held the
  scenes in a notation of its own inside strings ("thing=drawing,count,where,side,@on,*"), against AGENTS rule 3.
  tools/scenes-core.mjs writes only the things shards (from place-size.tsv) now.
- tests/k.scenes.test.mjs checks what the generator checked: hand-written headers, one scene per name, one fact per
  thing of a scene, whole counts (and, as before, drawings are objects and what a thing is on is in its scene); the
  drawn share per scene is counted from the facts. k.scenes, catalog, validate, repo: 26 pass.
- Left: tools/objects-hand-data.mjs (1,010 lines), the next table.
## 2026-11-15 — first worker: at-07 ("which things are usually pink") after the gloss values

- tests/questions.test.mjs was red on main at at-07 since the KR6 glosses commit gave rhubarb the colour pink. By the
  source the fact stands: WordNet's gloss of the sense kept is "long pinkish sour leafstalks usually eaten cooked and
  sweetened" (rhubarb stalks are red to pink); the question's expected list now has rhubarb (first, in the order the
  query returns). tests/questions.test.mjs: 449 pass.
- tests/k.attributes.glosses.test.mjs crashed where WordNet's raw files are missing (the fifth worker's full suite):
  its first test (the shard against the tool, which reads the coverage list from the raw files) now skips with the
  reason, as the other raw-data tests do; checked with the raw files moved away (1 skipped, 2 pass) and present (3 pass).
- Lesson: a change to k.attributes runs tests/questions.test.mjs too (under 30 s).
## 2026-11-15 — fifth worker: KR6 uses (`used_for`) for the things that do nothing by themselves (block 18:10 (2))

- tools/attributes-uses.mjs (not in the build: new proposals are checked by hand first; the test names unchecked ones)
  writes shard k.attributes/things-uses (WordNet-3.0) for catalog things where `can` does not apply (`canApplies`) and
  no use is known: (1) the instrument role of k.actions (`tool`: soap -> washing, scales -> weighing, a fishing pole ->
  catching); (2) uses the catalog gives a kind, carried down WordNet's hypernyms with the guards of the abilities (a
  palace, a convent, a farmhouse are houses: living; a motorway, a street are roads: driving); the use is the -ing form
  of the action's verb, written by the library's inflectBy on w.lang.en.
- **Hand check of every proposal** (sources/coverage/uses-audit.tsv): by source, instrument role 8 of 52 wrong, inherited
  4 of 29 wrong (alley, coffin, sarcophagus, vial), and the object role of k.actions 104 of 112 wrong (an apple is peeled,
  bitten, taken; a wall painted, touched: what is done to a thing is rarely what it is for), so the object role is not
  read; after it, balloon -> travelling (WordNet's first sense is the aircraft) wrong too. Published: **13 of 82 wrong
  (15.9 %)**, 69 values for 59 things; the rate is in the shard's header.
- COVERAGE.md "what it is used for" over the 1,500: by its name 336 -> 357 (22 -> 24 %).
- Test (tests/k.attributes.uses.test.mjs, new, 2): the shard is fresh and says its error rate; only things that do not act;
  no value checked wrong written; soap washing, palace living, motorway driving; alley, coffin, vial, balloon none; the
  -ing forms (sleeping, putting on, cutting).
## 2026-11-15 — fourth worker: the readers of verb forms read w.lang.en (red files of 26ddd3f, reviewer)

- 26ddd3f dropped the k.words / k.actions forms w.lang.en confirms; two readers still read them there:
  tests/k.actions.effects.test.mjs (fixed on main meanwhile by 6bb54d6, kept as it is) and tools/paraphrase-words.mjs
  ("bought", "got" reached no sense). tools/lib/lang-en.mjs gets `lemmasOf(form)` (the w.lang.en dictionary and
  morphology, the library's analyse) and `verbFormsOf(lemma)` (the library's inflectBy: third, past, ing) for any reader;
  paraphrase-words reads a form back with lemmasOf. No test changed what it asserts.
- Also: ee130ff added the frame acts.make.for without the variants shard rebuilt (w.lang.en.abstraction red); 6bb54d6
  rebuilt it on main meanwhile.
- Lesson: deleting facts from a world runs every test that reads that world (grep its type names in tests/ and
  tools/); a new frame of w.lang.en runs the w.lang.en.* tests, the abstraction test among them. After a rebase the
  merge driver keeps main's generated files: rebuild them before the push.
- Tests: k.actions.*, k.words.*, w.lang.en.*, import.wordnet, k.kinds relations and structures, k.time, w.person,
  w.lang.ro (k.attributes.glosses needs sources/wordnet/raw, not in this clone).

## 2026-11-15 — second worker: question numbers

- My Q82 and Q85 [LIB] (inflectBy's 37 catalog nouns; the planner's choose) collided with the fourth worker's Q82 and
  Q85 (pushed meanwhile): mine are renumbered **Q87** and **Q88** in questions.md, tests/w.lang.en.library.test.mjs and
  tests/k.compose.test.mjs. Q83 (readFrames) and Q84 (realise) keep their numbers.
## 2026-11-15 — fifth worker: test:all on main at b717dac (06:45); state at be5c4e2

- 105 files, 3,207 tests: 3,178 pass, 8 fail in 6 files, 21 skipped, 604 s; none not run. Five red files were those of
  Q86 (26ddd3f: k.actions.effects, k.words.paraphrase; f4fcb4f: questions at-07, k.attributes.glosses). New:
  tests/w.lang.en.abstraction.test.mjs (the variants shard is not what tools/lang-en-variants.mjs gives): **ee130ff**
  (fourth worker, w.seating version 3 and its frames), found by running the test at every commit since 5b90131 (green
  up to 44bebac, red from ee130ff).
- Rerun on main at be5c4e2: all six are green now (k.attributes.glosses skips without the raw files). Over 30 s at
  b717dac: catalog 74 s (fresh worktree, no validate cache), k.attributes 33 s. Questions.md Q87.

## 2026-11-15 — second worker takes block 18:45

- (1) tools/objects-hand-data.mjs into hand-written shards; (2) the pin to the library's current release (0.144.0),
  then `strict=true` on the joined colour / shape / direction slots with their copied value lists removed, slot by
  slot; tests/w.lang.en.library.test.mjs re-run on the new pin, fixed cases taken off the lists.
## 2026-11-15 — fourth worker: w.timeline against plan.timeline (reviewer: proposal first, superset only)

- Read psys2 worlds/plan.timeline/schema.host.sop and its generated schema.sop (d363718): the host keeps aspect
  temporal, a view, `named=yes` on events, `at` default 0 and the words later / earlier of its own.
- w.timeline 3 (a superset of 2): std.schema.aspect w.timeline.temporal, the view w.timeline, act show on events;
  a session shows the events (tests/w.schemas.test.mjs). Q89 [PSYS2] proposes the rest (the importer maps a required
  `title` to the host's name; `at` default stays the host's; [LIB] comparative words of a number slot; calendar left
  out; denies stay).
- Tests: w.schemas, k.kinds relations, joins report, structures, k.attributes ranges, catalog, validate, w.lang.en,
  w.lang.ro.

## 2026-11-15 — fifth worker: a pre-push check for stale generated files (block 18:45 (1)); NOTE TO EVERY WORKER

- tools/hooks/pre-push runs `npm run check-generated` (new script: tools/counts.mjs --check, tools/generated.mjs --check,
  tools/build-catalog.mjs --check) and refuses the push when the counts, .gitattributes or the catalog files
  (index.json, vocab.json, vocab-kinds.json, LICENSES.md) are not what the build gives: after a plain `git rebase` the
  merge driver keeps main's versions of them. About 60 s with a warm validate cache. tools/sync.sh installs it
  (`git config core.hooksPath tools/hooks`); AGENTS.md says so.
- **Every worker:** run `git config core.hooksPath tools/hooks` once in your clone (tools/sync.sh does it), and when a
  push is refused run `npm run regenerate`, commit, push again. COVERAGE.md and ASPECTS.md are not checked (they need
  raw files).
- Test (tests/sync.test.mjs, +1, toy repository): sync.sh sets core.hooksPath; a push with a stale generated file is
  refused with "generated files are stale"; after regenerating it goes through.

## 2026-11-15 — second worker: tools/objects-hand-data.mjs into hand-written shards (reviewer 18:45 item 1)

- The seven k.objects shards of Round 11 (animals-2, plants, land-3, places-3, food-3, vehicles-2, things-3; 2532 wires,
  103 drawings) are the home of their drawings, byte for byte as written before, header `# script: none
  (hand-written)`. tools/objects-hand-data.mjs (1,010 lines of a part notation in strings: "name shape x y w h | z
  colours key=value") and tools/objects-hand.mjs are deleted; tests/generators.test.mjs drops their test.
- tests/k.objects.hand.test.mjs checks on the facts what the tool checked: shapes, colours, the box in the frame, w = h
  for circles and squares, whole z, pointing on triangles and opens on arcs only, unique part names, relations naming
  parts of the same object, points inside their part's box (3 pass).
- The generated files that main had stale (catalog, JOINS, PARENTS, same-*, topics, .gitattributes's use-wordnet line)
  are rebuilt in this commit (`npm run build`, tools/generated.mjs).
## 2026-11-15 — fourth worker: 20 more everyday procedures (reviewer 19:05 item 3)

- k.procedures.howto, 23 in all (tools/procedures-core.mjs HOWTOS, shard everyday): six cited with each step's
  `detail` the source's words (ADA MouthHealthy brushing; the Green Cross Code; FoodSafety.gov's four steps; USFA stop,
  drop and roll; Ready.gov drop, cover, hold on; CDC coughing and sneezing, its last step marked as added here),
  fourteen own (sandwich, boiled egg, toast, pasta, bed, laundry, dishes, table, school bag, pet, plant, dressing,
  shoelaces, letter); 13 have a decision. The k.diagrams topics are rebuilt (tools/diagram-topics.mjs).
- Tests: k.diagrams (names, cited/own, one first step, decisions with yes and no, flowchart fill), k.procedures,
  catalog, validate.
## 2026-11-15 — fifth worker: KR6 from ConceptNet 5.7 (block 18:45 (2)): can, used_for, material, property

- tools/import/conceptnet-attributes.mjs reads the [DATA] PSys2's machine fetched (psys2 data/external/conceptnet-en/,
  copied to sources/conceptnet/raw, git-ignored; CC BY-SA 4.0): for the 1,500 common things, CapableOf -> `can` (an
  action of k.actions: the end or its first word), UsedFor -> `used_for` (-ing form of a leading verb, inflectBy),
  MadeOf -> `material` (one-word parts), HasProperty -> `property` (new slot of k.attributes.thing, version bumped);
  `can`, `used_for` and `material` only where the catalog has none. Shard k.attributes/things-conceptnet,
  CC-BY-SA-4.0, a shard of its own.
- **Hand check, 100 per relation** (sources/conceptnet/audit.tsv; drawn seeded from the edges with weight >= 2, or from
  all, weight >= 1, where fewer than 100 have 2; MadeOf has only 46 candidates, all checked):
  CapableOf 6 of 100 wrong (6.0 %; weight >= 2), UsedFor 31 of 100 (31.0 %; weight >= 2), MadeOf 21 of 46 (45.7 %;
  weight >= 1), HasProperty 60 of 100 (60.0 %; weight >= 1: opinions, uses, events, puns). None under 5 %, so **only
  the values checked right are written**: can 94, used_for 69, material 25 (18 things after splitting lists into one
  word each), property 40; 124 things. The rates and the choice are in the shard's header.
- COVERAGE.md over the 1,500: used for 357 -> 410 by name (24 -> 27 %), material 328 -> 346, can 255 -> 257 of the 463
  it applies to (ConceptNet's abilities are mostly of things that already have some), property (new row) 34.
- Test (tests/k.attributes.conceptnet.test.mjs, new, 3): licence and the per-relation rates in the header; every value
  written is in the audit as right; with the raw files, the shard is what the importer gives (skips without them).


## 2026-11-15 — first worker: time zones (block 15:35 item 3)

- New type **k.time.zone** (k.time version 7): name (IANA id), country_code (many; a declared join to k.geo.country by
  code2: 246 of 247 meet, AQ is no k.geo country), lat and lon of the principal place, offset_january and offset_july
  (minutes, 2026), summer_time, about (the database's comment). tools/import/tzdata.mjs from the IANA time zone database
  (sources/tzdata, public domain, release 2026e: zone1970.tab, the offsets through Node's Intl, whose tz release is the
  same; the tool stops when they differ): 312 zones in 2 shards (zones-africa-asia, zones-atlantic-pacific), no
  warning. Europe/Bucharest 120/180, America/New_York -300/-240, Asia/Kolkata 330, Asia/Kathmandu 345.
- tools/narration-core.mjs: a key named `*_code` is an identifier (not narrated), as `*_id` is; no other world has
  such a key. Words: "time zone" for the type; the key words by rule. Measures: degrees and minutes.
- Dates (the order of day, month and year by country) wait for CLDR's date patterns, which are not in the data here.
- Tests: tests/k.time.zones.test.mjs (2: the shards = the importer on the raw files of the release Intl has, skipped
  otherwise with the reason; the cases above, summer time where the offsets differ, the join). Touched tests (k.time*,
  k.kinds*, k.attributes*, questions, coverage-report, sync, catalog, validate, repo): 19 files, 533 pass.
- At the push, main itself was red on three tests from f77c570 (KR6 ConceptNet, fifth worker), the same in a clean
  worktree of origin/main: k.attributes.abilities and k.attributes.uses (their shards stale against their tools) and
  k.kinds (material.sop: hand-core and conceptnet facts in one CC0 shard). Not this commit's; reported.

## 2026-11-15 — fourth worker: w.calendar version 1 (reviewer 19:05 item 2) and Q92-w4

- docs/worlds/w.calendar: calendar (name, week_starts Monday by ISO 8601), event after RFC 5545 (date, start, end,
  last_date, place, sort, about; repeat, every, on, times, repeat_until), view (month, year, mode); three denies (end,
  last day, repeat end not before the start); aspect on_day and show; words; Romanian kind words in
  w.lang.ro/shards/words-w.calendar (calendar added to the hand dictionary: n.e, calendare, k.words.calendar.noun.3).
- Q92-w4 asks: expanding recurrences ([LIB] or host), "first Monday" rules, time zones from IANA tzdata, PSys2 use,
  holidays as data.
- Fixed on the way: ee130ff put three key words (culoare, la masa) into words-w.seating, which holds kind words only
  (w.lang.ro.words red since); they are removed (the frame ro.make.name.place carries "la masa" as its own words; the
  Romanian kit glosses keys through the English pivot). calendar leaves dictionary-unimorph (the hand dictionary wins;
  UniMorph gives the same class, n.e).
- Tests: w.schemas (a calendar session), w.lang.ro.words, w.lang.ro, k.kinds relations, joins report, structures,
  catalog, validate, w.lang.en.

## 2026-11-15 — second worker: the one build moved to sopworld 0.144.0 (94cffa2; reviewer 18:45 item 2)

- `tools/sopworld/sopworld.mjs` = the library's `docs/sopworld.mjs` at 94cffa2 (release 0.144.0, build 6cbb6f3ee855);
  VERSION, the validate test, AGENTS.md, README.md, docs/index.html, docs/worlds/README.md, w.lang.en/WORLD.md and the
  alternations test name it. Build: only the catalog's commit and hash change.
- Removed names since 0.130 (`fallbackOf`, `subjectOf` no longer exported): not used here. All 33 names tools and tests
  import exist in 0.144.
- **Tests whose result changes: none.** Full run on 0.144 (93 files one at a time): 5 files fail, and each fails the
  same way with 0.130 on this tip, so they are red on main, not from the pin: coverage, import.wordnet,
  k.objects.drawables, k.values, w.lang.ro.words (the KR6 and words-shard work in progress).
- No silent change: the 15 test files that call library functions beyond parsing (now including w.lang.en.library,
  phrasing and forms) give identical spec output under 0.130 and 0.144. So the library has fixed none of the cases of
  Q83, Q84, Q87, Q88 yet: tests/w.lang.en.library.test.mjs keeps its lists (82 of 166 frame examples; 37 nouns).
## 2026-11-15 — fourth worker: the licence of quoted steps (reviewer 19:35, fault in cdd50ba)

- The `everyday` shard is CC0 and quoted its sources. The US government works (CDC washing hands of 66e839f and
  covering a cough, FoodSafety.gov, USFA, Ready.gov) are public domain: their procedures and quoting steps carry
  `core.license=public-domain`, the shard's header says `CC0-1.0 AND public-domain`. Brushing teeth (ADA) and crossing
  the road (Green Cross Code, Milton Keynes Council's page) are copyrighted: rewritten in our own words, nothing
  quoted, `basis=paraphrased` (a new value of k.procedures.howto.basis; `cite` says where the facts were read).
- tools/validate.mjs: a fact with `basis=cited` must name a `core.license` on the allowlist and among its header's
  licences; tests/validate.test.mjs has toy facts for each case.
- Lesson: a quotation carries its source's licence, not the file's; quote only what is public domain or under an
  allowed licence, and say so on the fact.
- Tests: validate, k.diagrams, k.procedures, catalog.

## 2026-11-15 — fourth worker: w.calendar version 2, the time zone (Q92-w4 item 3, reviewer 19:35)

- `zone` on the calendar: a zone of k.time.zone by its IANA name (the first worker's 312 zones); words time zone,
  zone, timezone. The answers of Q92-w4 written into WORLD.md (recurrence expansion is the library's; "first
  Monday" waits for a real row; holidays later as data). The value list of k.time.zone is not copied (no enum).
- Tests: w.schemas (the calendar session sets Europe/Bucharest), k.kinds relations, joins report, catalog, validate.

## 2026-11-15 — second worker: stopped (owner); strict joins left half-done

- Done and on main: objects-hand data into hand-written shards; the pin at 0.144.0 (no test changes; no [LIB] case fixed yet).
- Left: `strict=true` on the joined colour and direction slots (k.drawing, k.values, k.attributes, w.seating; imports of k.colours / k.values added; tools/validate.mjs loads the strict targets' shards first): validates (exit 0) but untested, not committed; the diff is in /tmp/w2-strict-joins.diff (scratch scripts in /tmp/w2scripts).
- Not possible as asked: k.colours.colour.family (its target k.colours.basic is derived into the same world's last shard) and k.drawing.part.shape (k.shapes imports k.kinds: 2.6 MB more on every k.objects load); both keep their enum.

## 2026-11-15 — third worker: stopped (owner, quota)

- Pushed: plural rules (w.lang.en/ro.count), article fills, Romanian words for the w.* kinds, words shards of 22 k.* worlds (vocab byte-identical each).
- Left (words shards): k.actions, k.animals, k.attributes, k.diagrams, k.drawing, k.faces, k.geo, k.scenes, k.time, k.values, k.words (their tools/tests read schema words: need tools/lib/words-shards.mjs readers); k.motion (its test forbids k.motion in language worlds: owner decision needed); k.objects (k.objects.drawables test red on main). Scripts: /tmp/w3word.sh, /tmp/w3batch.sh, /tmp/w3move_words.py.
- Left (Romanian data, reviewer 16:10 (b) step 3): morphology tables, closed classes and templates of tools/lang-ro-core.mjs into hand shards (stem folds stay generated).
## 2026-11-15 — fifth worker: my ConceptNet commit left eight generated files stale; fixed (full suite at f77c570)

- The full suite at f77c570 found 10 red files; 8 were mine. Under the new push rule I ran only the touched tests
  and the catalog, not `npm run regenerate`, and the new slot `property` and the new facts moved joins, narration,
  relations, kinds (material and use edges), diagram topics and COVERAGE.md (kept as main's by the merge driver).
  Fixed: `npm run regenerate` on the tip. Lesson for me: after a change of facts or of a schema, run
  `npm run regenerate` before the push (the pre-push hook checks only the catalog).
- Licences kept apart: tools/kinds-core.mjs writes the edges read from ConceptNet's values into shards of their own
  (material-conceptnet, use-conceptnet, CC-BY-SA-4.0; the k.kinds licence test found them in the CC0 `material`
  shard). tools/attributes-abilities.mjs and attributes-uses.mjs no longer seed from ConceptNet's facts (a share-alike
  value must not reach a WordNet-licensed shard), and the ConceptNet importer no longer reads their shards, so neither
  depends on the other.
- With that order, the samples were drawn again and the new values checked (audits extended): ConceptNet CapableOf 7 of
  100 wrong (7.0 %), UsedFor 30 of 100 (30.0 %), MadeOf 21 of 46, HasProperty 60 of 100: still only the checked-right
  values (can 98, used_for 109, material 25, property 40; 133 things). Abilities from WordNet 16 of 144 wrong (128
  written), uses 14 of 91 wrong (77 written).
- tests/k.commonsense.rules.test.mjs reads the table's own facts (other shards add facts of the same name).
- Not mine: tests/w.lang.ro.words.test.mjs (w.seating.table.colour) — recorded with its commit after the next run.

## 2026-11-15 — fifth worker stops (owner: save quota)

- Left: the last full suite on main after fddd8ac (the one at f77c570 had 10 red files, 8 mine, fixed in fddd8ac); and
  the commit that made tests/w.lang.ro.words.test.mjs red (w.seating.table.colour) is not yet bisected.
- Scratch: /tmp/w5 (analysis scripts), /tmp/w5-all (a worktree of main for full runs), logs /tmp/w5-all*.log.
## 2026-11-15 — first worker: KR6 from the Q80 data, Wikidata and Visual Genome (block 18:45)

- tools/import/attributes-data.mjs (raw copied from psys2 data/external, commit 30a5808a; SOURCE.md for both):
  - **Wikidata** (CC0, shard things-wikidata, 89 wires): `material` from P186 of the item whose WordNet 3.1 id
    (P8814) is the sense kept, not for foods (their P186 values are ingredients: home k.food made_of; WordNet
    noun.food or a food of k.food), named as the catalog names materials; `used_for` from P366.
  - **Visual Genome** (CC BY 4.0, shard things-visual-genome, 107 wires): `colour` = the modal basic colour of the
    sense's synset (NLTK name from the WordNet 3.1 sense: first lemma, sense number) when its colour words are said at
    least 20 times and it holds at least 50 % of them.
  - Only where the catalog had no value for the key (ConceptNet's shard of the fifth worker counts as the catalog).
- Hand checks (sources/coverage/kr6-wikidata-material-audit.tsv, kr6-wikidata-use-audit.tsv,
  kr6-visual-genome-colour-audit.tsv, with why for each wrong value): material all 68, 25 wrong (37 %); use a seeded
  100 of 395, 27 wrong (27 %); colour all 133, 26 wrong (20 %). All over 5 %, so only checked right values are
  published: material 43, use 73, colour 107. Main causes: the item is another or a narrower thing (hand fan for
  "fan", tabernacle for "synagogue", traffic cone for "cone"), things of many colours (wine, suit), weak or novelty
  uses ("medicinal plant", potato as an electrical energy source).
- questions at-07 ("which things are usually pink"): ham added (Visual Genome, checked right).
- Tests: tests/k.attributes.data.test.mjs (2: shards = importer, skipped without the raw files; every published value
  checked right, each source in its licence's shard); questions 448 pass; k.attributes*, k.kinds, coverage-report,
  sync, catalog, validate, repo green except the three red on main before this commit (k.attributes.abilities,
  k.attributes.uses, k.kinds licences: from f77c570).
## 2026-11-15 — DGX session: red files of main fixed; words shards back beside their worlds

- KR6 import (queue item 1) started, then stopped on the coordinator's order (reviewer 09:30 in psys2): nothing of it
  committed. (357c0105 had already published the hand-checked Wikidata / Visual Genome values.)
- 6ea0e338, red files: `npm run test:all` on main had 5 red (coverage, k.attributes.abilities, k.attributes.uses,
  k.kinds licence, k.objects.drawables). Causes: k.kinds put Wikidata edges in the hand CC0 shard (now
  material-/use-wikidata CC0, -visual-genome CC-BY-4.0); abilities/uses were seeded by the imported facts (now left
  out, as ConceptNet's; 14 new proposals checked by hand); MISSING.md and stand-ins-kinds-wordnet were stale (their
  tools need the raw WordNet, not in `regenerate`). After: 0 red.
- 34bab7c6, owner 08:10: the 20 words-<world> shards of w.lang.en moved back to `<world>/shards/words.sop` (k.named
  into its schema), ids `<world>.word.*`; writeShards never removes words.sop; vocab.json and vocab-kinds.json
  byte-identical. Full touched run (110 files): 0 red. The reviewer counted 22 moved worlds; there were 20.
- Lesson: tools that need the raw files (coverage.mjs, stand-ins-kinds.mjs, attributes-abilities/uses) are not in
  `regenerate`, so their outputs go stale silently on clones without the raw files.
## 2026-11-15 — DGX session: the kit's reply names (queue item 3), person.know.none (psys2 Q32), face kinds (psys2 Q31)

- Queue item 3 (the library's Q82): w.lang.en.reply / w.lang.ro.reply now have every name of KIT_REPLIES (library
  0.147 src/kit.mjs) that the catalog lacked: 40 names, the roles of the kit; refused.which and ask.count in every
  count (en one/other, ro one/few/other), the rest count=one. `{art@…}` rows have their w.lang.ro.fill. Plus
  `person.know.none` ("I do not know anything about you yet." / "încă nu știu nimic despre tine.") for psys2 Q32.
- psys2 Q31 K1: `k.faces.preset kind=` (enum human / robot / alien; robot and alien presets, the 12 others human),
  written by tools/faces-core.mjs (PRESET_KIND); value words `core.word … means=<kind> of=k.faces.preset.kind`:
  human (human, humans, human being(s), person, people), robot (robot(s), machine, android(s), droid), alien (alien(s),
  extraterrestrial, martian). K2 (sense= for queen) not done.
- Found: "nume" is not in the w.lang.ro dictionary (no def form "numele"); the replies test uses "culoare" as its key.
- Tests: k.faces (new test: kinds reach presets), w.lang.ro.replies (new fillers; 4 new checks); `npm run test:changed`
  77 files, 0 red.
## 2026-11-15 — islands and geographic regions in k.geo (psys2 T43, reviewer block 13:10 in psys2)

- `k.geo.island` (1,382, Wikidata CC0, shards `islands-<continent>`, `tools/import/geo-places.mjs`): name, country
  (many), archipelago (many), area (only ≥ 1,000 km², 324), lat, lon, wikidata. `k.geo.region` (43, Natural Earth
  Geoarea, shard `regions`): name, continent, centre, box, wikidata. Tenerife: Spain, Canary Islands, 2,034 km²,
  28.27 / -16.61. Schema version 8; 9 shards, 1,425 wires, 245,657 bytes.
- KR6 hand checks (115 islands in three samples; all 43 regions): names, countries, points 0 wrong in 82; areas of
  islands < 1,000 km² 4 wrong in 62 (6.5 %: municipality areas, a unit slip) so not imported; ≥ 1,000 km² 1 in 53;
  groups named "... Islands/Archipelago" filtered; 5 corrections by item (Malta's country, Cres, Illas Ons, two
  region names, Anatolia's continent). Published values as imported: 2 wrong in 115 (1.7 %), corrected.
- Not imported: first-level administrative divisions. Natural Earth admin-1: 3 of 35 out of date (Kenya, Latvia,
  Burundi reforms: 8.6 %); Wikidata P150 no cleaner (France: Lorraine listed, 5 regions missing; a river as a
  division). Needs a source that is kept current, or a per-country check.
- Tests: k.geo (new T43 test); `npm run test:changed` 71 files, 0 red.
## 2026-11-15 — w.request, w.dialogue, k.expect and the cues (owner's GO, psys2 reviewer block 14:00)

- `w.request` (schema v1): request (act, mode, target, refers, goes_to, text, said, n, revises, status), constraint
  (request, on = kind|count|size|extent|attribute|place|manner|layout|with|about|length, want = yes|no|not_all, value,
  of, attribute, relation, number, min, max, amount, unit, words, origin = said|default|reaction, honoured, why),
  unread (request, text, n, note).
- `w.dialogue` (schema v1, imports w.request): session, tab (last_request, last_result), turn (sort, reaction),
  result (thing many, effect, status, replaces, seed), assumption, question; `w.dialogue.revision` data: how each of
  reject, reduce, enlarge, refine, redo, put_back, thanks, frustration revises the last request.
- `k.expect` (new world, tools/expect-core.mjs in the build): 9 amounts, 5 scale steps, 13 hand makes (diagram 5-9
  nodes of 2-3 shapes; pond: water + water plants + animals ...), 60 scene makes from k.scenes has, 10 diagram makes
  from k.diagrams; 1,302 wires in 4 shards, all hand-core 1 CC0.
- `w.lang.en.cue` type + shard `hand-cues` (81 cues: negation, counts/ranges/amounts, scale, place, manner, layout,
  attribute, with, about, length, reactions); replies sorry, assumed, not_honoured, unread, done.revise (en, ro).
- Tests: new tests/request-worlds.test.mjs; `npm run test:changed` 75 files, 0 red.
## 2026-11-16 — psys2 Q51 [KNOW]: Romanian words and senses, English cues, dialogue and replies, knowledge gaps

- Source: psys2 questions.md Q51 (real failing turns: the real set and the owner session, analysed by hand), Q47, Q49, Q43. Rows are general facts, never a sentence's row; written by a language model from those turns (`hand-core 1`).
- Found first: most of the knowledge gaps (E) are already in the catalog (kinds, drawings, stand-ins, Tenerife, azure, the unit degree, leg of a crocodile in k.parts.usual); vilă, baltă, leagăn, înlocui, ăla, "în fața" and the old-spelling folds (linga, pamint) were in w.lang.ro too: psys2 still pins an older catalog, or its own translator lexicon lacks them. Probed with the pinned sopworld before adding.
- w.lang.ro: 15 dictionary lemmas (azuriu, lega, ordona, ordonat, peisaj, prost, prostie, reașeza, rearanja, val, zice, centru, fund, plantă; duce gets a second sense, go), irregular cells of lega, zice, așeza, reașeza (the class v.a.ez gave no "așează"), 4 particles (încă un = one_more, în plus = extra, oricum, logic), 1 preposition (pe la), 9 syntax facts and 1 phrase group (colour.of) for senses, 40 reply rows (done.whole, done.change.place/size, size up/down, can/can.say and per act, state.count, state.empty, nothing.same) and 1 fill.
- w.lang.en: shard hand-cues-more (30 cues, 12 pronoun rows `refers=all`), 27 reply rows (with can.<act>), 2 arrangement phrases (layers); schema 5 (`pron.refers` gains `all`).
- w.dialogue 2: reaction enum `continue`, revision does `inherit`, row continue.inherit.
- k.layouts: layout `layers` (levels), tools/layouts-core.mjs; k.objects: stand-in `water plant` -> seaweed (hand-links.tsv + shard by hand: tools/coverage.mjs needs the raw files); w.document 2: `words` slot.
- Not done: see questions.md (rotation default step, done.place.<relation> region words, reaction value keep).
## 2026-11-16 — psys2 Q96-Q99 [KNOW]: letter and other text genres, face-domain Romanian words, text reply rows, step cues, part names

- Source: psys2 questions.md Q96, Q98, Q99 and the avatar Romanian probes of its worker-log (real failing turns: "furios" unread, "ochelari" read as drinking glasses, "write a short letter" unread, "the next mouth" unread). Rows are general facts, never a sentence's row; written by a language model from those turns (`hand-core 1`).
- k.genres: 5 genres (letter, note, email, poem, list), 3 moves (greet, sign off, invite reply), register `personal` (letter, note, email), `unit` enum gains section and paragraph; poem uses the narrative register, list the report register. 16 templates for `personal` in w.lang.en (discourse, every move of the new genres and the seven common ones). k.genres.test: ten genres, hand-traced shortest outlines of the new ones.
- k.faces: 16 word rows for the slots (eye/eyes, hair, glasses/eyeglasses/spectacles, hat/cap ...), one per slot name (`of=k.faces.slot.name`).
- k.expect: one name per part. The part keeps its singular kind name (eye, hair); the new `k.expect.part.slot` key (many) names the k.faces slot(s) it is drawn as (eyes; hair_front and hair_back; ears; eyebrows); parts ear and eyebrow added to the face make; the slot names are words of the parts in k.faces.
- w.lang.en: 2 cues (`attribute.variant_next`, `attribute.variant_previous`: the next / previous mouth, `step` enum gains next and previous), shard replies-text (14 reply rows: done.about, done.title, done.change.about / length / title, done.add.value one/other, state.count.value one/other, state.count.named, short_of with unit, refused.needed, refused.no_colour, refused.no_drawing), `register` enum gains personal.
- w.lang.ro: 27 dictionary lemmas with k.words senses (moods: fericit, bucuros, vesel, trist, furios, supărat (2 senses), mirat, surprins, obosit, calm; face: ochelar = eyeglasses sense, pahar = the drinking glass sense, zâmbet, pălărie, sprânceană, ochi, ureche, nas, gură, barbă, mustață, buză, obraz, cercel, umăr, păr), moved out of dictionary-unimorph (hand rows win), 14 irregular plural cells (shard irregular-nouns), shard words-k.faces (16 slot words + 6 expression words, bound to k.faces: "ochelari" is the eyeglasses slot), shard replies-text (the 14 reply rows in one / few / other forms and 4 `fill` article rows).
- Not done: plural-as-singular irregular pairs for English (eyes, ears, eyebrows ...): they break the reading of the singular ("eyes" read as the lemma, w.lang.en.test and catalog-plurals fail); see questions.md.
- Tests: `npm run regenerate`, then `npm run test:changed` 82 files, 0 red. test:all not run (last push of the round is the reviewer's).

## 2026-11-16 psys2 Q101 / Q102 [KNOW]: genre words, the letter sense, preset words, local reply rows
- w.lang.ro: new shard words-k.genres (94 wires: 10 genre words, 31 part words, 46 move words; greeting = salut / formulă de adresare, body = corp, closing = încheiere, signature = semnătură); chapter (capitol) and section (secțiune) already in words-w.document. Dictionary: `literă` now carries only k.words.letter.noun.2 (the alphabet character); `scrisoare` (hand row, left the UniMorph file) carries letter.noun.1; `ochi` is masculine (m.cons, plural from irregular-nouns). words-k.faces: 14 preset words (bătrână, bătrân, băiat, fată, robot ...).
- Reply rows kept locally by psys2, en 24 / ro 25 in replies-text: done.parts, refused.no_other, nothing.same.value, refused.already, refused.no_default, the 11 `<reply>.plural` rows (done.change / .size / .place (ro new), done.add, done.add.value, done.remove, refused.no_such, nothing.same.value, refused.already, refused.no_default, state.count, state.count.value), not_honoured.not_declared / .no_kind, done.change.kind (+ fill), assumed.act.
- Skipped: `short_of` with a `kind` role (same name and count as the existing short_of row: a conflict; needs a library decision on the name); the English plural-only irregular rows (Q96 note already explains). Model-made, for a native speaker to check. npm run test:changed: 221 pass, 0 fail.

## 2026-11-16 — Worker commit/push access probe (done)

- Owner request: make a minor documentation change and verify a real commit and push. Added `WORKER-HANDOFF.md`, linking the existing task, question and progress protocols.
- Base commit: `3803c9b64a36`. Documentation only: 0 wires and 0 shards changed; data bytes and load time not applicable.
- Checks: `npm run test:changed` — 3 files, 16 passed, 0 failed, 0 skipped; build 22 s, tests 3 s. `git diff --check` and `git push --dry-run origin main` passed.
- This entry is committed with the documentation; identify its commit with `git log -- WORKER-HANDOFF.md`.

## 2026-11-16 — Owner-concept migration ledger before phase zero

- `migration/README.md`: all eight chapter-11.1 dependency families and all 38 owner-concept probes, with separate recognition, semantic and realisation checks. Owner examples set priorities/acceptance probes; reusable relation/property families determine migration/import coverage, never a replay-only filter. No world patterns, facts or dependency pins migrated.
- `tools/audit-owner-migration.mjs` and `migration/owner-concepts-evidence.json`: reproducible catalog-scoped evidence, including published patterns (not only shards), file/line/type/attributes, source/licence and input SHA-256. 1,258 inputs; 2,722 selected declaration occurrences; 38 probes; 2,273,987 evidence bytes. Added the output to the build and generated-file merge protocol.
- Semantic corrections to the earlier inventory's open questions: grandfather already has optional visible face/moustache cues; levels is vocabulary of the layers layout; chapter is a published document pattern type. These do not prove selectable/editable realisations. Swing-seat support, calculable extent/layer semantics and contextual usual-value regions remain explicit migration dependencies. No source thresholds or new facts invented.
- Checks: `npm run test:changed` — build 24 s, 4 test files (sync/catalog/validate/repo), 20 passed, 0 failed, 0 skipped; tests 4 s. `node tools/audit-owner-migration.mjs --check` byte-identical; `git diff --check` clean. 0 wires and 0 shards changed; world-data bytes/load time/warnings unchanged. Full-round suite remains the integrating worker's check. Commit held for root review/push.

## 2026-11-16 — Full-round migration-ledger validation and canonical vocabulary repair

- Root requested the full-round check before publication. First `npm run test:all`: 111 files, 3,227 tests, 3,208 passed, 1 failed, 18 skipped, 142 s. The only failure was the pre-existing stale `k.expect` key-word block in `ask-real.test.mjs`; a read-only comparison found all other k.* blocks current.
- Root authorised canonical regeneration. `node tools/key-words.mjs` restored 13 sourced `core.word` wires in the existing k.expect words shard (43 → 56 wires; 5,408 → 6,897 bytes, +1,489 bytes). `npm run regenerate` updated catalog/vocabulary indexes and the audit input digest; no world pattern or semantic relation changed, no test assertion weakened. Existing validation cache/build accepted the shard; no warning change.
- Clarified the ledger extractor's one-declaration-per-physical-line limitation: continuation attributes are outside this lexical audit; it is not an exhaustive semantic inventory.
- Second `npm run test:all`: 111 files, 3,227 tests, 3,209 passed, 0 failed, 18 skipped, 129 s. Deterministic evidence and generated-file checks will run after the required `tools/sync.sh`; root approved push after these checks.
- Publication gate: `tools/sync.sh` completed against origin/main with no rebase conflicts or further generated diff; inspected both commit stats for lost changes. `node tools/audit-owner-migration.mjs --check`, `npm run check-generated` and `git diff --check` passed on the synchronized tip; the catalog has 36 bases, 1,222 shards and 34,350 indexed words.

## 2026-11-16 — Reviewer follow-up: migration audit report on demand

- Addressed reviewer block 15:20: stopped tracking the 107,782-line migration evidence report, removed it from the build/generated merge registry, and ignored its local path. The generator and short human-readable family/concept ledger remain; README gives on-demand generation/check commands without linking an absent tracked artifact. Published catalog/vocabulary indexes remain tracked under AGENTS.md; the audit report is outside `docs/` and is not published knowledge.
- Preserved the 13 canonically generated k.expect word rows under the reviewer's explicit current-test exception. Recorded the exact `ask-real.test.mjs` key-vocabulary assertion, failing baseline, canonical generator and green full-round evidence in questions.md. No new knowledge or pattern migration; 0 wires, 0 shards and 0 published-data bytes changed by this follow-up; load times/warnings unchanged.
- Checks: `npm run test:changed` — 4 files, 20 passed, 0 failed, 0 skipped; `npm run test:all` — 111 files, 3,227 tests, 3,209 passed, 0 failed, 18 skipped, 133 s. `node tools/audit-owner-migration.mjs` followed by `--check` reproduced 2,722 occurrences over 1,258 inputs byte-for-byte; `git check-ignore` confirms the local report is ignored. Required synchronization and generated/diff checks follow before push.
- Final publication checks: `tools/sync.sh` completed without conflicts or further generated changes; inspected `git show --stat HEAD` against intended scope. `npm run check-generated` and `git diff --check` passed on the synchronized tip.

## 2026-11-16 — Data-only English symbolic-reader overlay preparation

- Added `w.reader.en`: declarative provider bindings, lexical features/filters, seven category productions, structured SOP object/copy/literal/null template nodes and ordered path-step wires, and an explicit property/value concept agreement. Domain vocabulary remains with its owning bases; providers cover the complete existing attribute, object, animal, people-kind, genre, colour and shape families. The property-of-target construction licenses only the existing change sense, rather than assuming every change synonym has that subcategorisation. Mood and existing-target mode belong to the construction. No development/held-out sentence rows, observed state or execution effects; held-out material was not used.
- This is preparation, not migrated legend declarations or a runnable semantic reader. Canonical names retain their source identities. Published library 0.185 supplies source-range provenance and 0.187 supplies composeParses; the SOP adapter, agreement integration and validated request bridge remain pending. WORLD.md explains old required=true open-world semantics and mandatory consumer validation of arbitrary templates (cycles, duplicate attachments, exactly-one paths/selectors, missing bindings, consistent source_id enforcement). No engine pin upgrade.
- Added three ordinal metadata facts for template/path indices; regenerated published catalog, joins, counts and vocabulary outputs. New module: 41 schema declarations / 5,145 bytes and one shard of 178 wires / 22,068 bytes; existing measures shard +3 wires / +406 bytes. The native `node --input-type=module` World.use/tell measurement returned 5.15 ms / 6.59 ms, check=true; catalog warnings=0. No source facts or old frames edited.
- Checks: `node tools/validate.mjs` accepted the new module (0 errors / 0 warnings); `npm run regenerate` passed; `npm run test:changed` final 38 files, 284 tests, 281 passed, 0 failed, 3 skipped, 64 s. `npm run test:all` on final data: 112 files, 3,231 tests, 3,213 passed, 0 failed, 18 skipped, 144 s. New tests check broad source-family coverage, licensed sense, construction-scoped mood/mode, fixture template/path references, explicit compatibility and category grammar parsing from both value families; they do not claim arbitrary-template validation, runtime semantic correctness or execution acceptance. `git diff --check` clean. Required sync/generated/stat checks follow before push.
- Publication gate: `tools/sync.sh` completed without conflicts; its only additional regeneration was the catalog fingerprint after the explanatory WORLD.md update. Inspected `git show --stat HEAD` and the pre-/post-sync diff: no authored files lost or altered. `npm run check-generated` and `git diff --check` passed on the synchronized tip; catalog 37 bases / 1,223 shards / 34,351 indexed words.

## 2026-11-16 — First Drawing path: complete shape-kind provider and explicit constraint semantics

- Root prioritised the published overlay → std.request → Drawing path. Confirmed with the reader/host owners that shape targets were a real provider-family gap: `k.objects.object` has no circle identity; `k.shapes.shape` does. Added the entire existing shape family as KIND, alongside its existing VALUE use. Command `factsOf('k.shapes','k.shapes.shape')` reports 59 declaration occurrences / 39 distinct name tokens across all shards; duplicates remain source alternatives, not arbitrary first matches. No shape/colour term or instance-name fact was added or copied. Existing colour values, including exact RGB and same-name metadata, already provide the needed reusable inventory.
- Added explicit constraint character=requirement and polarity=positive literal nodes, requested by the generic request bridge so it need not invent semantics. No production IDs, schemas, old frames or engine pin changed. Updated runtime capability notes for published composeParses/guards; adapter/resolution/execution remain separate acceptance checks. Recorded a concrete response to the general phrase-structure review in questions.md; this small compatibility correction does not claim frame-generalisation delivered.
- One existing shard: +4 wires / +665 bytes; now 182 wires / 22,733 bytes. `node --input-type=module` native tell measurement: 8.49 ms, check=true; catalog warnings unchanged at 0. Regenerated catalog fingerprint/size and joins report. Native overlay tests 4/4; `npm run test:changed`: 32 files, 202 tests, 200 passed, 0 failed, 2 skipped, 39 s. `npm run test:all`: 112 files, 3,231 tests, 3,213 passed, 0 failed, 18 skipped, 136 s. `git diff --check` clean; required synchronization/generated/stat checks follow before push. No held-out material used or changed.
- Publication gate: `tools/sync.sh` completed with no conflicts or further generated changes; `git show --stat HEAD` matched the intended seven-file scope. `npm run check-generated` and `git diff --check` passed on the synchronized tip before push.

## 2026-11-16 — Opt-in frame licences and role-path evidence, version 1

- Added separate `w.reader.en.frames` data: five exact verb-sense/frame licences and ten source-grounded role paths for transitive, resultative and oblique families. Reuses existing structured copy nodes and ordered steps; no second path/template language and no new production set. Semantic act comes from the selected source frame: the checked acts.change.add case has frame act=change but verb/verb-part act=make. Marker and argument roles remain separate array entries even when both map to semantic place. Resultative object paths preserve a whole selector-bearing object independently of its result predicate.
- Exact verb/frame/part/role_map/k.actions.role references and full role coverage were checked against published sources. No vocabulary or sentence fixtures copied. Old `w.reader.en` files and the ef0a1b27 preview pin remain unchanged. These declarations remain unconsumed until public generic projection and a separately validated frame binder; no new std.request/instance-resolution claim or validator pin upgrade.
- questions.md specifies actual SOP plus concrete JSON context/template/output and bounded alternative/guard semantics. Inspected composeParses' existing evaluator with the reader owner: shared projection semantics can be exposed without a new expression language. Root authorised extraction separately; library implementation/publication is not counted as delivered by this data commit.
- New module: 15 schema declarations / 2,341 bytes, one shard of 50 wires / 8,045 bytes. `node tools/validate.mjs`: 0 errors and new module/shard 0 warnings; `node --input-type=module` World.use/tell inspection measured shard tell=2.94 ms, check=true. `npm run regenerate` passed. Native new test file 4/4; `npm run test:changed`: 32 files, 202 tests, 200 passed, 0 failed, 2 skipped, 39 s. `npm run test:all`: 113 files, 3,235 tests, 3,217 passed, 0 failed, 18 skipped, 123 s. `git diff --check` clean; required sync/generated/stat gate follows before push. No held-out data touched or used.
- Publication gate: `tools/sync.sh` completed without conflicts or additional generated changes; reviewed `git show --stat HEAD` against intended ten-file scope. `npm run check-generated` and `git diff --check` passed, and `git diff ef0a1b27 -- docs/worlds/w.reader.en` was empty, confirming preview declaration bytes unchanged.

## 2026-11-16 — General phrase profile and explicit object-role modes

- Added opt-in `w.reader.en.phrases`: ten shared productions for verb+object, resultative and prepositional-goal commands, neutral qualified/determined NPs, result predicates and goal structure. Reuses the existing binding/rule/map/node/step schemas; all domain terms come from existing source families and exact licensed verb identities. Phrase mappings emit verb identity, valency, mood, argument context and provenance, never a guessed semantic act. NP qualifiers remain neutral until a selected frame role interprets them; they are not merged into result predicates.
- `w.reader.en.frames` version 2 adds optional target_mode on object-valued roles, with six source-justified new/existing annotations. Modes are not inferred from lexical act or determiners; absent stays unresolved, and marker/value/count roles gain no fabricated mode. The root coordinator agreed to this counterexample/design; actual SOP and the create-vs-change scope rationale are in questions.md. Exact source role evidence and the semantic-act/verb-act mismatch remain tested.
- Preview declaration bytes remain ef0a1b27 and the old production is not retired without parity. No full property-of/count/scope coverage, automatic request bridge, instance success or validator pin upgrade claimed. Loader views are explicitly separated for phrase templates versus frame role paths. The reader owner independently confirmed the agreed envelope against published composition; consumer integration remains a separately validated milestone.
- New phrase module: 1 schema declaration / 556 bytes and one shard of 318 wires / 46,179 bytes. Frame module: +1 optional slot declaration; existing 50-wire shard gains 121 bytes of mode annotations, now 8,166 bytes. `node tools/validate.mjs`: 0 errors and new/changed modules 0 warnings. Native World.use/tell command measured frame shard 3.07 ms and phrase shard 7.33 ms, check=true. `npm run regenerate` passed. Native phrase tests 4/4 and frame tests 5/5; `npm run test:changed`: 33 files, 207 tests, 205 passed, 0 failed, 2 skipped, 39 s. `npm run test:all`: 114 files, 3,240 tests, 3,222 passed, 0 failed, 18 skipped, 123 s. `git diff --check` clean. No held-out material used or changed; required sync/generated/stat gate follows before push.
- Publication gate: `tools/sync.sh` rebased onto the new owner/control instructions without conflicts; inspected final commit stat and confirmed `git diff ef0a1b27 -- docs/worlds/w.reader.en` stays empty. `npm run check-generated` and `git diff --check` passed on the synchronized tip. The preserved first new-reader profile is a data compatibility snapshot, not authorisation for a legacy engine switch/fallback; the owner's parallel new-only lanes now supersede sequential rollout policy.

## 2026-11-16 — Additive general frame-to-request graph mappings

Added `w.reader.en.requests` with four source-grounded graph mappings (create/remove/resultative change/spatial placement), target/predicate/relation components, metadata paths and exact spatial preposition source admission. Existing preview, phrase and frame files are unchanged. Existing/new mode comes from frame roles; neutral qualifiers remain selectors versus desired results according to that declared mode. No existence concept, unit, dependency or context reference was invented.

`node --test tests/w.reader.en.requests.test.mjs`: 3 passed, 0 failed. Direct `World.tell`/`World.check` measurement over schema+shard: 84 wires, 1 shard, 17,333 bytes, 10.2 ms, 0 errors, 0 warnings. Catalog shard entry: 57 facts, 13,201 bytes, 0 warnings. `npm run test:changed`: 45 passed, 0 failed before the final lexical-source admission tightening. `npm run test:all`: 115 files, 3,243 tests, 3,224 passed, 1 failed (stale generated catalog), 18 skipped. After `node tools/build-catalog.mjs` and `node tools/generated.mjs`, `node tools/test-run.mjs tests/catalog.test.mjs`: 9 passed, 0 failed, resolving the sole round failure. Final request-module test remained 3/3 in the full round.

The library integration tests exercise all graphable families together; data validation alone is not an English coverage claim. Increment, questions, quantity syntax, coordination and dialogue-context bindings remain declared follow-up work. Source records marked as incomplete multiword fragments are not admitted solely because they share a canonical relation with a complete preposition.

## 2026-11-17 — Reusable depiction, retained-text and room families

Added w.picture, w.text and w.room world patterns together, source hand-core1
(CC0-1.0), with owning legends/source record. Reuse published colour, scene,
object and document joins; existing lists/tasks retain their own concepts.
Depiction does not alias a physical leaf/page or a tab. Room seating capacity
is a nonnegative count, independent of calendars/occupancy/relative quality.
Text spans explicitly bind a retained source_id/revision/text and half-open
Unicode-scalar coordinates, may cross structural boundaries, and carry separate
formatting/link predicates. Source make/ask/copy is append-only at the generic
act boundary; change/remove refuse with not_allowed, spans remain changeable.
Missing required source/span provenance and empty source identifiers refuse.
Upper bounds/unique immutable historical identity remain explicit host checks.
Ambiguous mood, relative room qualities and presentation facets recorded in
questions.md; no native conversion, trained-reader or execution claim.

Three patterns:95wires,11209SOPbytes,0newshards; zero load errors/warnings,
about20ms combined measured load.17additional structural facts (3108SOPbytes)
reuse whole/parts and sequence, and declare capacity independently of assignment:
112newwires/14317SOPbytes total. Source generator and generated catalog/vocab/
coverage/structure reports regenerated. Existing16-pattern registry updated
without weakening per-pattern/catalog/composition assertions. Library pin stays
0.144.0/94cffa2; old request-mappings worktree untouched.

Checks: tools/sync.sh; regenerate; targeted6/6; per-push test:changed33files,
223tests/221pass/0fail/2skip; full serial test:all116files,3249tests,
3231pass/0fail/18skip. Earlier stale coverage/registry failures and append-only
review fix were resolved before these final gates. No model/data/GPU changes.
2026-11-17 partial: PSys2 5997e85a ran the mechanical exporter against all 1,282 published SOP files; 105 properties, 21 unique identity proposals, 1 ambiguous and 83 without a unique applicable declaration/alias. Added grouped knowledge tasks and the topic/about counterexample to questions.md; no world declarations changed.
Checks: npm run test:changed — build passed; catalog/validate/repo 16 tests passed, 0 failed. Existing unresolved questions retained; typed/contextual value interpretation is not claimed solved.

2026-11-17 done: published sparse constituent-feature goals for facial expressions; names map to property goals, not fixed variant identities, so compatible alternatives can be retained by any consumer. Includes generated key vocabulary, narration and relation metadata.
Checks: node tools/faces-core.mjs; node tools/key-words.mjs; node tools/narration-core.mjs; node tools/relations-core.mjs; node tools/counts.mjs; node tools/build-catalog.mjs; npm test — 3251 tests,3233 passed,0 failed,18 optional skips.
Integration: PSys2 native tests resolve real goals while preserving compatible constituent choices; unfamiliar-emotion and two-compatible-smile probes pass. Publishing these knowledge facts does not claim generic application reasoning is fully integrated.

2026-11-18 delivered: 1,014 lexical wires moved unchanged into 32 owned vocabulary shards (129,974 bytes); schema imports contain no lexical facts, and explicit vocabulary composition follows declared dependency closure. Catalog worlds/schemas expose vocabulary paths; declared lexical IDs replace old double-qualified import IDs. Imported rules still derive from separate instance facts; no tool/runtime policy changed.
Checks: `npm run test:changed` and `npm run test:all` each118files3258tests3240pass0fail18skip; `node --test tests/world-ownership.test.mjs`5pass; before/after `node --input-type=module` lexical comparison preserves all1,014source/runtime attributes. Explicit k.faces probe106words,72.83ms including discovery,0warnings; `git diff --check` clean.

2026-11-18 delivered k.spatial2d: ranked box placement costs, evidence-gated containment and point contact, scoped preferences, and reversible learning from two comparable observed corrections.
Catalog: 255 schema wires and 151 facts across 2 shards, 58,584 SOP bytes, 8.3 ms total schema and shard load, zero warnings. Pinned knowledge runtime is unchanged.
Checks: focused 6/6, test:changed 51 files and 373 tests (368 pass, 5 skip, 0 fail). Verified current library module import and facts-only policy admission.
Round gate: test:all 119 files and 3,264 tests (3,246 pass, 18 skip, 0 fail). The library and application own normal-route dispatch and live correction collection.

2026-11-18: k.composition2d derives normalized candidate regions by joining requested subjects, usual places and declared layout anchors. A boat/lake match retains both published fact identities; the same rules match a new airship to the sky and a thread to a loom.
Measured: 39 schema wires, one 20-wire vocabulary shard (2,504 bytes), schema and vocabulary loaded in 10 ms with zero warnings. npm run test:changed passed 363, skipped five, failed zero.

2026-11-18: w.face now imports std.schema explicitly, including the inherited kind key read by its existing part deny. Standalone loading and the original duplicate-hat refusal are covered alongside distinct faces and the eyes pair.
Measured with World.tell and parse: 79 schema wires, one 35-wire shard, 16,726 SOP bytes, 10.7 ms standalone schema load, zero warnings. npm run test:changed passed 99 tests across 14 files, zero failures.

2026-11-18 — The catalog records which identity slots have complete shard-key coverage. Other slots require reading the owning world or a separate complete index. Verified k.scenes.thing.name prunes to one shard for boat; scanning place=water returned all 130 source rows, including the boat.
Changed gate passed 557, skipped 7, failed 0 across 59 files.

2026-11-18 — Composition slots accept explicitly assigned structural roles. The unordered scatter region accepts generic graph nodes. A diamond without role evidence derives no such region. The editor declaration supplies the role.
Measured 45 composition schema wires (6,220 bytes, 8.2 ms), 54 layout schema wires (12,610 bytes, 0.7 ms), and 186 arrangement-shard wires (33,280 bytes, 8.0 ms), zero warnings in the affected shard. Changed gate passed 375, skipped six, failed zero across 51 files.

2026-11-18 — Generated the catalog word for the layout slot role key. The round gate found the stale generated key block. The focused key-word test passed four, and the changed gate passed 164 with three skips.

2026-11-19 — w.face declares which k.faces slot each kind of part draws (18 `w.face.slot` facts plus words), so a projection rule joins a part to its variant geometry by a declared fact, not by the type name. Prototype: std.acts make/change/undo on w.face with a SOP rule projecting parts to drawing primitives.
`npm run test:changed` 99 pass, 0 fail across 14 files.

2026-11-19 — w.meetings: a std.schema world of meetings at exact times (start ms since the Unix epoch, duration ms) with people, rooms and calendars, each addressed by a unique `code` (one deny); words in its own shard. For the Calendar tab's SOP area in PSys2.
`npm run test:changed` 44 pass; `tests/w.schemas.test.mjs` 20 pass (now seventeen schemas); act check: a second meeting with code "review" is refused.

2026-11-19 — Catalog validated with sopworld 0.225.1 (the release PSys2 runs) instead of 0.144.0: VERSION and the bundle updated; the version test checks a full commit beside the sha256; Q87 expectations emptied (0.225 reads every listed plural both ways); w.meetings got its structure (sequence by start) in k.kinds.
`SKW_NO_CACHE=1 npm run test:all`: 3,267 tests, 3,249 pass, 0 fail, 18 skipped.
2026-11-19 — w.meetings declares that two meetings sharing a room or a person do not overlap (half-open intervals; two denies with core.calc ends), moved from the PSys2 calendar policy. Act check: a third meeting at 50 in a room booked 0–100 is refused, one at 100 is admitted.
2026-11-20 — w.drawing: a std.schema world of placed objects (code, drawing = k.objects name or basic shape, centre, size, optional width/height, colour, label, layer), groups and part edits; unique codes and one edit per part. For the PSys2 Drawing tab's SOP area.
`npm run test:changed` 223 pass, 0 fail (33 files); act check: a second object with code o1 is refused.
2026-11-20 — k.spatial2d: directional relations `left`, `right`, `above`, `below` (a policy and one direction each, at the near gap) and `in` (within the anchor's box: middle, then a quarter from either side; distance weight 0), the relations PSys2's reader emits for drawing placement. policies.sop 10 → 22 wires, 4,077 bytes.
`npm run test:changed` 287 pass, 0 fail, 4 skipped (45 files); PSys2 check: "a fish left of the house" and "a boat in the lake" compile and verify through the app route.
2026-11-20 — w.diagram extended for an editor (the PSys2 Diagram tab's SOP area): codes on nodes, edges and groups (unique per kind); node size grade, width, height, value, pinned and the shapes square, triangle, hexagon, star, text; edge n, colour, style, width; group n, colour, layout (row, column, grid, bar, line), framed, scale, x, y, pinned; w.diagram.member (a membership as a thing: std.acts cannot unset a reference and removing a group removes what refers to it). Additive: every earlier value still loads.
`npm run test:changed` 135 pass, 0 fail, 3 skipped (18 files).
2026-11-20 — w.document extended for an editor (the PSys2 Documents tab's SOP area): `code` on documents; `w.document.block` (code, document, n, form paragraph/heading/quote/list/table, text, name, level 1-6, align, style, header, part, source); `w.document.item`, `w.document.cell`, `w.document.mark` (block, item or cell, from, to, form, href, colour); denies: one code per kind, a mark not in an item and a cell at once. Additive. schema 104 wires (17.9 kB), words 73 wires (9.6 kB); 0 warnings.
`npm run test:changed` 296 pass, 0 fail, 5 skipped (43 files).
2026-11-20 — Ordered features of face variants: `k.faces.feature` (key, scale) with the shard `features` (length on the k.values scale length: short < medium < long; size on the scale size), k.faces imports k.values; `w.face.slot.group` (hair: the back hair and the front hair, named together as one thing). For the PSys2 Avatar tab: "make her hair shorter" / "give her long hair" step a part's variant along the declared scale.
`npm run test:changed` 379 pass, 0 fail, 5 skipped (55 files).
