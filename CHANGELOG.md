# Changelog

Breaking schema changes, per world. The world's version is `version=` on the `core.module` wire of its `schema.sop`
(sopworld 0.15.0; a `# version:` header line before) and the `version` of its catalog entry.

## k.geo 2 (2026-11-13)

- `k.geo.country`: the identity `name` is now the common short name (`"United States"`, `Serbia`, `Russia`; it was
  Natural Earth's `ADMIN`: `"United States of America"`, `"Republic of Serbia"`). The values of `country`, `capital_of`
  and `neighbour` change with it. The formal name is the key `formal` (was `official`). Other names are `core.word` facts.

## k.objects 2 (2026-11-13)

- `k.objects.point`: the key that refers to the part is now `part=$<part id>` (was `of=$<part id>`). `of=` means "the
  object, by name" everywhere. Identity of a point: `part` + `n`.

### k.objects 2, additions (2026-11-13, not breaking)

- `k.objects.part.rgb` (exact colour, a string); `k.objects.part.named` (`model`);
  `name` and `of` may be strings (names of several words); `colour` is now an enum of 11 names.
- `variant` on objects and parts, added with the pilot and never used in a shard, is removed again (reviewer's
  answer to Q12: where a hand-written object exists, the imported drawing is left out).

### k.commonsense 1 and k.objects 2, additions (2026-11-13, not breaking)

- `k.commonsense.thing`: `is_a`, `part_of`, `has` (many); `name`, `at`, `can`, `used_for`, `made_of` also take
  strings (names of several words). For the ConceptNet import.
- `k.objects.skeleton` (of, n, x, y, w, h, part, drawings, spread): sketch skeletons, for the Quick, Draw! import.
