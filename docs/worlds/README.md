# Knowledge worlds catalog

This folder is served by GitHub Pages. Everything in it is generated or validated by the tools of the repository
(`npm test` checks it); do not edit `index.json`, `vocab.json` or `LICENSES.md` by hand: run `node tools/build-catalog.mjs`.

## Files

- `k.<world>/schema.sop`: the world as a sopworld module (`core.module name=k.<world>`): types, slots, rules, soft
  rules (`core.deny … soft=true`), and `core.word` facts for its vocabulary. Types and slots are all under
  `k.<world>.`; matrix ids are written fully qualified (`@k.objects.part.name`) so that loading the module through
  `imports=` (ids unchanged) or `core.use` (ids prefixed) never clashes with the application's ids.
- `k.<world>/shards/<key>.sop`: facts only, at most about 2,000 wires and 300 kB each. Each starts with a header
  (`# sources:`, `# license:`, `# script:`) and every wire carries `core.source="<source id> <version>"`.
- `k.<world>/WORLD.md`: what the world knows, its sources, and questions it helps with.
- `index.json`: the catalog.
- `vocab.json`: lowercased English lemma → shard ids.
- `LICENSES.md`: the terms and attribution text of every source, generated with the catalog.

## index.json

```json
{ "version": "<content hash>", "sopworld": "c7247e2",
  "worlds": [ { "id": "k.objects", "version": "1", "schema": "k.objects/schema.sop",
                "exports": ["k.objects.object", "k.objects.part"], "depends": ["k.commonsense"],
                "shards": [ { "id": "k.objects/shards/buildings", "path": "k.objects/shards/buildings.sop",
                              "wires": 40, "bytes": 3000, "keys": ["house", "roof"],
                              "sources": ["hand-core-1"], "license": "CC0-1.0", "warnings": [] } ],
                "sources": ["hand-core-1"], "licenses": ["CC0-1.0"], "warnings": [] } ] }
```

- `version`: a hash of every file in this folder except the generated ones (`index.json`, `vocab.json`, `LICENSES.md`). Pin it; cache shards by it.
- `sopworld`: the sopworld commit every file was validated with.
- World `version`: the schema's version (its `# version:` header line); a breaking schema change raises it.
- `exports`: the types other modules may read. `depends`: worlds whose schemas must be in the same library.
- Shard `keys`: the identity values of its wires (lowercased). `sources`: the `core.source` values, as `<id>-<version>`.
  `license`: the shard's terms (a shard keeps its source's terms); `nc: true` marks non-commercial terms.
  `warnings`: what sopworld noted when loading it (no shard is published with errors).

## vocab.json

`{ "chimney": ["k.objects/shards/buildings"], "capital": ["k.geo/schema.sop"], ... }`. Built from the `text=` of
`core.word` facts and from the identity values of the shard wires. A word for a value points to shard ids (the path
without `.sop`); a word for a type or a key of a world ("capital", "synonym", "colour") points to the world's schema
path (`k.<world>/schema.sop`): it says the world is relevant, and the other words of the message pick the shards. A
host translates a message to English, lemmatises it, looks each lemma up, and fetches only those shards.

## Using them

See `../index.html` for a JavaScript example, and PLAN.md §2 in the repository for the contract.
