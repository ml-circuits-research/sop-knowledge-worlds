# Changelog

Breaking schema changes, per world. The world's version is the `# version:` header line of its `schema.sop` and the
`version` of its catalog entry.

## k.objects 2 (2026-11-13)

- `k.objects.point`: the key that refers to the part is now `part=$<part id>` (was `of=$<part id>`). `of=` means "the
  object, by name" everywhere. Identity of a point: `part` + `n`.

### k.objects 2, additions (2026-11-13, not breaking)

- `k.objects.object.variant` and `k.objects.part.variant` (optional identity keys, for a second drawing of a name;
  not used yet, questions.md Q12); `k.objects.part.rgb` (exact colour, a string); `k.objects.part.named` (`model`);
  `name` and `of` may be strings (names of several words); `colour` is now an enum of 11 names.
