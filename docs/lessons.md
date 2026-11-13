# Lessons: what each round taught about structuring knowledge for reuse

A few lines per item, appended by the workers (standing direction of 2026-11-14 00:40). Each says what was
learnt about making worlds that other worlds and hosts can combine, not what was done (that is in worker-log.md).

## Round 10 (second worker)

- **A world can carry facts of a type nobody declared, and nothing notices.** `k.attributes.same` (3,202 facts,
  the joins of R10.3) was published without its type in the schema: the schema change was lost between two
  rebases, and sopworld takes a fact of an unknown type in an open world without a word. The catalog then
  listed no export for it, so a host loading by the catalog could not find the joins at all. Fix: the type is
  declared, and the validator now refuses a fact whose type no schema declares. Lesson: a world's own
  vocabulary (its exports) is the join surface; check it mechanically, not by reading the commit.
- **Generated pages go stale silently** (R10.7): every page computed from the shards (COVERAGE, ASPECTS, JOINS)
  needs a test that recomputes it, or it is wrong after the next change of any other world.
- **Joins are rules over where a fact lives, not facts of a thing** (R10.3): the sense of a name came from the
  type and, for drawings, the group the source filed them in. Nothing in SOP Lang can refer to the shard a fact
  is in, so the rule lives in a tool and its output is facts; the facts must be regenerated when any world
  changes, which is why `npm run build` runs the tool.

## Round 11 (first worker)

- **Item 2: a reusable world is a schema with words and nothing else** (`w.list`, `w.seating`, `w.timeline`).
  Everything that makes it act (make, change, undo, refusals with what is allowed) is the library's `std.acts`,
  the same for every world; so the schema stays data, and what it cannot say ("two guests are not on one
  seat", "`until` is not before `at`") is named in WORLD.md as needing a rule or function of the library, not
  written as a half-rule here. The line between this repository, the library and an application is: data that
  two applications could use / anything that computes / anything of one application or one user.
- **Found by name means a word for the world itself**, not only for its kinds: `core.word means=w.seating
  of=std.schema.world.name` puts "seating plan" in `vocab.json` with the schema's path. One vocabulary for facts
  and schemas lets a host take one lookup path; the price is that a common word ("table", "list") now also
  leads to a schema, and a host must tell a `schema.sop` path from a shard path.
- **Two builds of the engine can live side by side** when the newer one is pinned with its own VERSION and
  sha256 and used by one loader only (`tools/lib/schemas.mjs`); the catalog names both. Writing sessions as
  tests against the engine found two engine defects (a `required` slot not enforced by `make`; `undo` after
  `remove`): a reusable world is also a test case for the library (Q35).
- Not done and worth doing: `k.layouts` has layouts named `list` and `timeline`; a join from those layouts to
  the `w.*` schema of the same name would let a host draw what a user made.
