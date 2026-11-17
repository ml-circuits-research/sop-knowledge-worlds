# hand-core: hand-written core facts

- **What:** the hand-written cores of the worlds (`k.commonsense`, `k.objects`, `k.units`, `k.time`, `k.space`,
  `k.animals`, `k.body`, `k.food`, and the schemas of the others): small sets of facts that define each
  schema and its tests before any bulk import. Written by the worker in this repository, checked by the reviewer.
- **Version:** `1` (`core.source="hand-core 1"`). A new edition of the cores that changes facts raises the number.
- **Origin:** this repository.
- **License:** CC0-1.0 (the repository's `LICENSE`, section 2: schemas and hand-written facts).
- **Attribution:** none required.
- **How to fetch:** nothing to fetch; the facts are the `.sop` files themselves. No import script.
- **What is kept:** everything written. Counts are in worker-log.md.

## Authorial depiction, text-span and room patterns (2026-11-17)

w.picture, w.text and w.room are original project declarations released under
CC0-1.0. The source is the owning schema.sop definitions and their WORLD.md
coordinate/property legends, version1, maintained in this repository. They reuse
published k.colours, k.scenes, k.objects and w.document concepts by typed joins;
existing w.list/w.tasks remain the owners of list/task semantics. They contain
no corpus annotations, acceptance sentences, training-key registries, native API
names, sample instances or copied external prose. Lexical sense references to
existing k.words.page.noun.1 and k.words.room.noun.1 remain references to WordNet
3.1 (sources/wordnet/SOURCE.md), not new CC0 copies of that material.
