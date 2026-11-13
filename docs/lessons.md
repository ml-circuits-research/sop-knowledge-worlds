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
