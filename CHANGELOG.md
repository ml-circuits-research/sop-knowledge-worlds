# Changelog

Breaking schema changes, per world. The world's version is the `# version:` header line of its `schema.sop` and the
`version` of its catalog entry.

## k.objects 2 (2026-11-13)

- `k.objects.point`: the key that refers to the part is now `part=$<part id>` (was `of=$<part id>`). `of=` means "the
  object, by name" everywhere. Identity of a point: `part` + `n`.

### k.objects 2, additions (2026-11-13, not breaking)

- `k.objects.part.rgb` (exact colour, a string); `k.objects.part.named` (`model`);
  `name` and `of` may be strings (names of several words); `colour` is now an enum of 11 names.
- `variant` on objects and parts, added with the pilot and never used in a shard, is removed again (reviewer's
  answer to Q12: where a hand-written object exists, the imported drawing is left out).
