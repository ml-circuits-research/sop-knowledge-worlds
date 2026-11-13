# Questions from the worker

The worker appends questions here. The reviewer answers in `worker-tasks.md`.

Format:

```
## Q<n> (task Tn, <date>)
Question: ...
Context: what was tried, what the options are.
Blocking: yes/no. If no: the choice taken meanwhile.
```

## Q1 (task T2, 2026-11-13)
Question: may the catalog `version` be a content hash of `docs/worlds` instead of the git sha?
Context: PLAN.md §2 says `"version": "<git sha>"`, but `index.json` is committed, and a commit cannot contain its own
sha; writing the parent's sha would make every rebuild after a commit differ ("reruns give no diff" fails). A sha256 of
every file under `docs/worlds` (except `index.json` and `vocab.json`), 12 hex digits, is deterministic and changes exactly
when published content changes. Option b: the git sha only in a file written by a CI step after the commit.
Blocking: no. Meanwhile: the content hash.

## Q2 (task T4, 2026-11-13)
Question: what license do the hand-written cores (source `hand-core`) carry?
Context: the repository has no LICENSE file. The cores are written here, with no outside source.
Blocking: no. Meanwhile: CC0-1.0 in the shard headers, the catalog and `sources/hand-core/SOURCE.md`.

## Q3 (task T4, 2026-11-13)
Question: where does a world's schema version go? PLAN.md §2.6 says "the world's `version=` key in `core.module`", but
sopworld 0.14.0 does not read `version` on `core.module` and notes `unknown-attribute` in `world.warnings`.
Context: options: (a) a header comment `# version: 1` in `schema.sop` (read by build-catalog into the catalog);
(b) `core.version=1` on the module wire (an open `core.` key: no warning, but it is bookkeeping, not a declaration);
(c) ask sopworld to read `version=` on `core.module`.
Blocking: no. Meanwhile: (a).

## Q4 (task T4, 2026-11-13)
Question: is it acceptable that matrix ids in schemas are written fully qualified (`@k.commonsense.thing.name`)?
Context: a module loaded by `core.module … imports=` keeps its ids unchanged, while `core.use` prefixes them. With short
ids (`@t`, `@k1`) an application whose own matrix has `@t` and imports `k.objects` is refused (`duplicate-id`), and
sopworld then also reports a misleading "module k.objects imports k.commonsense, which is neither loaded nor in the
library". Fully qualified ids never clash; under `core.use` they become `k.commonsense.k.commonsense.thing.name`, which
is harmless. (The misleading message may be worth a note to the sopworld reviewer.)
Blocking: no. Meanwhile: fully qualified ids in every schema.

## Q5 (task T5, 2026-11-13)
Question: may a triangle and an arc carry an orientation key? Added `pointing` (triangle: up, down, left, right; up
when absent) and `opens` (arc: up, down, left, right; up when absent) as enum slots.
Context: with the box alone a triangle can only point one way (a roof) and an arc only curve one way; a fish tail
points left, a beak right, a rocket flame down; a smile opens up, a cup handle left. Other options: (a) draw every such
part as a polygon or line with points (more wires, no orientation key); (b) more shape names (`triangle_left`), which
would be a notation inside the value.
Blocking: no. Meanwhile: the two enum keys; absent means up.

## Q6 (task T5, 2026-11-13)
Question: for repeated parts (one wire per instance), is `name` unique per object (`left_window`, `right_window`) plus
an optional `kind=window` the right shape?
Context: identity is `of` + `name`, so two windows need two names. `kind` says what each one is; queries count by it
("how many windows": `where kind=window, mode=count` → 2). Option b: `name=window` for both and a third identity key
`n` (1, 2), required on every part.
Blocking: no. Meanwhile: unique names plus `kind` on repeated parts only.

## Q7 (task T5, 2026-11-13)
Question: `k.objects.point of=` is a reference to the part (`of=$k.objects.house.roof`, `kind=ref to=k.objects.part`),
because a part is named by two values (object and name). Is a reference fine here, or should a point carry `object=`
and `part=` atoms instead?
Context: references need the part in the same world (they are in the same shard); atoms would join by value as
everything else in the knowledge worlds does.
Blocking: no. Meanwhile: the reference.

## Q8 (task T5, 2026-11-13)
Question: should `k.objects.object` extend `k.commonsense.thing`?
Context: tried; merging is order-dependent in sopworld 0.14.0: a `k.objects.object name=house` told before a
`k.commonsense.thing name=house` merges them into one wire; told after, they stay two wires that both match
`k.commonsense.thing name=house`. So the two types are joined by the name value instead, and `k.objects` imports
`k.commonsense` so that the common sense comes with it. (Perhaps worth a note to the sopworld reviewer.)
Blocking: no. Meanwhile: no `extends`.
