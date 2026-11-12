# Plan: sop-knowledge-worlds

Written by the reviewer (the PSys2/sopworld reviewer session) at the owner's request, 2026-11-12.

## 1. Goal

General knowledge, imported in bulk from open sources, available to any sopworld application as **schemas** (sopworld
modules) and **instances** (fact shards). Everything is in SOP Lang, served from GitHub Pages, and loaded on demand.
An application combines a knowledge world with its own worlds at run time, by declaration, and never duplicates its
facts in its own worlds.

What the first user (PSys2, a browser chat with tabs such as drawing, diagrams, map, arithmetic, animals) needs from it:
- **Common sense**: where things usually are (fish in water, the sun in the sky), what things can do, typical counts. It is
  used as soft rules, so it gives warnings and never refusals.
- **Objects and their parts**: what a house, a tree or a car is made of, how the parts sit relative to each other,
  rough proportions and typical colours. A drawing world composes pictures from parts with this; a diagram world uses
  the part layout as a skeleton ("a diagram in the shape of a house").
- **General knowledge by domain**: geography, animals, the solar system, the human body, food, units and measures, time and
  calendars. It is used for richer dialogue and small problems.
- **Words**: English lemmas, synonyms and "is a kind of" links (WordNet-like), as `core.word` facts and type hierarchies,
  so that readers can map the user's words to the knowledge.

## 2. How applications use it (the contract)

1. **Catalog.** `GET <pages>/worlds/index.json` returns:
   ```json
   { "version": "<git sha>", "sopworld": "c7247e2",
     "worlds": [ { "id": "k.objects", "schema": "k.objects/schema.sop", "exports": ["k.objects.thing", "..."],
                   "shards": [ { "id": "k.objects/shards/house", "path": "...", "wires": 812, "bytes": 61234,
                                 "keys": ["house","roof","chimney"], "sources": ["conceptnet-5.7"], "license": "CC-BY-SA-4.0" } ],
                   "depends": ["k.words"], "sources": ["..."], "licenses": ["..."] } ] }
   ```
2. **Vocabulary index.** `GET <pages>/worlds/vocab.json` maps an English lemma to shard ids, `{ "chimney": ["k.objects/shards/house"], ... }`.
   It is generated from the `core.word` facts and the identity keys of each shard. A host lemmatises the (translated)
   message, looks the words up, and fetches only the matching shards. Each shard is cached per version.
3. **Schema as a module.** The host puts `schema.sop` into `new World({ library: { 'k.objects': text } })` and its own
   world says `core.use world=k.objects`, or `core.module … imports=k.objects`. Types stay `k.objects.*`, and the
   world's `exports` limit what the host's rules read.
4. **Shards as facts.** Shards are told into the instance that composes the module (`tell(text)`), or registered as a
   **fact provider** (sopworld R6.13) so that large shards are matched by rules without being copied, forked or logged.
   Namespaces (`::`) keep shards from different worlds apart. Shards never call functions.
5. **Soft knowledge.** Common-sense rules are `core.deny … soft=true` with `why=` reasons and variables. The host shows
   them as advice after acting ("Done! Fish usually live in water."), never as a refusal.
6. **Versioning.** Applications pin a catalog `version` (git sha). There are no tags. A breaking schema change bumps the
   world's `version=` key in `core.module` and is listed in `CHANGELOG.md`.

## 3. Worlds, in order

| # | World | What it knows | First sources |
|---|---|---|---|
| 1 | `k.words` | English lemmas, plurals, synonyms, "is a kind of" (as types), parts of speech | WordNet (Princeton, permissive), Open English WordNet |
| 2 | `k.commonsense` | typical location, capability, use, material, part-of, size class, soft rules | ConceptNet 5.7 (English edges, high weight only), hand-written core facts |
| 3 | `k.objects` | drawable objects: parts, relative positions (above, below, inside, left of), proportions, typical colours, a simple outline skeleton per object | ConceptNet PartOf/HasA, Quick, Draw! (345 categories; layout skeletons from simplified strokes), hand-written core for 30 objects |
| 4 | `k.geo` | countries, capitals, cities, rivers, mountains, continents, borders | Wikidata slices, GeoNames, world-countries (the same family PSys2 already uses) |
| 5 | `k.animals` | classes, habitats, diet, legs, sounds, coverings, sizes | Wikidata slice, ConceptNet, hand-checked core |
| 6 | `k.space` | solar system: planets, moons, sizes, distances, order | Wikidata slice |
| 7 | `k.body` | human body parts, organs, systems, counts | Wikidata, WordNet meronyms |
| 8 | `k.food` | foods, categories, colours, typical meals, where they grow | Wikidata, ConceptNet |
| 9 | `k.units` | units, conversions, magnitudes | hand-written plus Wikidata (QUDT if license fits) |
| 10 | `k.time` | calendars, holidays (names only), seasons by hemisphere | hand-written plus Wikidata |

Each world starts with a **hand-written core** of 20–50 facts that defines the schema and the tests. Only then comes the
bulk import, so that the schema is shaped by use, not by the dump.

## 4. Import pipeline (per source)

1. `sources/<id>/SOURCE.md`: URL, version or date, license, attribution text, what is kept and why, row counts.
2. `tools/import/<id>.mjs`: streams the raw dump, filters (English, high confidence, the domain's relations), maps
   it to the world's schema, de-duplicates by identity keys, writes shards sorted by a stable key, and adds
   `core.source` on every wire. Deterministic.
3. Validation: load the schema plus every shard in sopworld. Zero errors. Contradictions within soft rules become
   `core.issue` facts and are listed, not dropped.
4. `tools/build-catalog.mjs` regenerates `index.json` and `vocab.json`. `npm test` checks the size gates (§1 rule 5)
   and checks that every word in `vocab.json` resolves.
5. Numbers in `worker-log.md`: rows read, wires written, shards, bytes, load time per shard, warnings.

## 5. Licenses (owner's decision, 2026-11-12 09:58)

This project is non-commercial, open-source research. **We import only what we can publish openly on GitHub Pages.**
Anything that cannot be published is not imported at all; there is no restricted or private area.
- **Allowed:** public domain and CC0 (Wikidata); permissive licenses (MIT, BSD, Apache, MPL, the WordNet license, CC BY,
  ODbL with attribution); share-alike (CC BY-SA, e.g. ConceptNet); and non-commercial licenses (CC BY-NC, CC BY-NC-SA),
  because this is non-commercial research. A shard keeps its source's terms: share-alike stays share-alike, NC stays NC.
- **Not imported:** no-derivatives (ND), since we transform everything; "no redistribution"; "research use only, do not share";
  and any source with unclear terms.
- Every shard header and catalog entry names its license. `docs/worlds/LICENSES.md` is generated with the attribution
  texts. The catalog marks NC shards (`"nc": true`) so that a future commercial user could filter them out.

## 6. Quality

- Prefer fewer, correct facts: ConceptNet weight ≥ 2, Wikidata items with a label and the property in question, and
  no facts that contradict the hand-written core.
- Each world has `tests/<world>.questions.jsonl`: questions the world must answer through sopworld `query`, with the
  expected status and value ("where does a fish live" → `water`; "what is a roof part of" → `house`).
- Soft-rule worlds also test that nothing is refused, only flagged.

## 7. PSys2 integration (first user; work done in the PSys2 repository, listed here for coherence)

- PSys2's `common.sense` world (made 2026-11-12) moves to `k.commonsense` once that world exists. PSys2 then loads it
  from Pages and keeps only what is app-specific.
- Drawing composes objects from `k.objects`; diagrams use the `k.objects` layout skeletons ("diagram shaped like a
  house"); kids.animals, geo.map and a new solar-system tab read `k.animals`, `k.geo` and `k.space`.
- PSys2 fetches shards through `vocab.json` after translation to English, caches them per catalog version, and tells
  them into the composed instance or registers them as fact providers.

## 8. Milestones

- **M0 infrastructure:** pinned sopworld, validation, catalog and vocab builders, Pages page, CI test. One toy world.
- **M1 commonsense + objects core:** hand-written cores and tests; the soft rules work; 30 objects with parts and layout.
- **M2 bulk commonsense:** ConceptNet import into `k.commonsense` and `k.objects` (PartOf/HasA/AtLocation/UsedFor/CapableOf/MadeOf).
- **M3 drawings:** Quick, Draw! skeletons for the objects of M1 and M2. Report which objects have a usable skeleton.
- **M4 domains:** Wikidata slices for geo, animals, space, body and food, each as its own world with tests.
- **M5 words:** WordNet into `k.words`, linked to the types of every other world; `vocab.json` complete.
