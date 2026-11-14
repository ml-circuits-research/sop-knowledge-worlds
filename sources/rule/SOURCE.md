# rule: facts derived by a rule of a module of this repository

- **What:** the values a `core.rule` of a schema module (`k.commonsense`, `k.time`, `k.kinds`) makes from the told
  facts of a module and of the modules it imports, on the wires of that module's own types, written by `tools/derive.mjs` into the generated shards
  `docs/worlds/<world>/shards/derived*.sop`, so that tools and hosts that read shards see them. Every such wire
  carries `derived=true` and `core.source="rule <rule id>"`: the source names the rule, whose own `core.source`
  (in the schema) names who wrote it. A value that is also told is not written.
- **Version:** the rule id stands in for a version; the module's version is in the shard header.
- **Origin:** this repository (the rules, `hand-core 1`), applied to the facts named in the shard header.
- **License:** the licence of the facts the rules read; `tools/derive.mjs` refuses a mix of licences in one shard.
  All derived shards so far read CC0-1.0 facts only, so they are CC0-1.0.
- **Attribution:** that of the facts read (none for CC0-1.0).
- **How to fetch:** nothing to fetch; `node tools/derive.mjs` (part of `npm run build`) rewrites the shards.
- **What is kept:** every value a rule makes over the published facts, one wire per thing and rule. Loaded together
  with the rules, a derived wire is the rule's own conclusion (same identity), so nothing is made twice.
