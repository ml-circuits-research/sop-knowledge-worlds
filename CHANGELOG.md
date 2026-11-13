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

### k.animals 1 and k.space 1, additions (2026-11-13, not breaking)

- `k.animals.animal.cannot` (many): what an animal is well known not to do (`cannot=fly`). A fact with the same verb
  in `can` and in `cannot` is refused.
- `k.space.body`: a fact with both `moons` and `moons_about` is refused (an approximate number is a second key with
  the suffix `_about`, never next to the exact one).
- `k.objects`: the 44 club football kits of Mulberry are left out; one kit stays, named `"football kit"`.

### k.animals 1 and k.layouts 1, additions (2026-11-13, Round 9, not breaking)

- `k.animals.animal`: `size` (tiny, small, medium, large, huge), `group` (the name of a group), `named` (`model`,
  now on every animal); the class `myriapod`. Every animal that is not a bird or an insect and is not said to fly
  has `cannot=fly`. The shards are now written by `tools/animals-core.mjs` from `sources/hand-core/animals.tsv`.
- `k.layouts.anchor`: `part` is absent on the anchors of the new shard `anchors-points` (a place in the frame of a
  drawing whose parts have no names).

### k.geo 2 and k.units 1, additions (2026-11-13, Round 9, not breaking)

- `k.geo`: new types `lake`, `desert`, `sea`; `area_about` and `named` on `continent`; `length_about` and `named` on
  `river`; `capital` may now come from the `-borders` shard. New shards `seas` and `numbers`.
- `k.units`: new type `measure` (the unit of a number of another world) and shard `measures`; new unit `year`.

### k.space 1, additions (2026-11-13, Round 9, not breaking)

- `k.space.body`: `colour_why`, `day_hours_about`, `orbit_days_about`, `diameter_about`, `distance_about`,
  `temperature_about`, `age_years_about`, `light_years_about`, `named`. `k.space.kind`: `about`, `named`.
  `k.units`: the unit `"light year"`.

### k.attributes 1, additions (2026-11-13, Round 10, not breaking)

- `k.attributes.thing.colour` also takes `any`: the thing comes in any colour and has no usual one (116 things).
  `any` never stands next to a colour. A host that reads `colour` as a colour name must expect it.
- New type `k.attributes.drawn` (name, `drawn_colour` many, `drawn_shade` many; exported): the main colours of the
  drawing of a thing, computed by `tools/drawn-colour.mjs`; four shards `drawn-*`, one per source of drawings.
