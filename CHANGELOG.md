# Changelog

Breaking schema changes, per world. The world's version is the `# version:` header line of its `schema.sop` and the
`version` of its catalog entry.

## k.objects 2 (2026-11-13)

- `k.objects.point`: the key that refers to the part is now `part=$<part id>` (was `of=$<part id>`). `of=` means "the
  object, by name" everywhere. Identity of a point: `part` + `n`.
