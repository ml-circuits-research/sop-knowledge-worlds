# Instructions for coding agents in this repository

Read this first, then [PLAN.md](PLAN.md), then the open round in [worker-tasks.md](worker-tasks.md).

## What this repository is

A library of **knowledge worlds** for sopworld: schemas and instances in **SOP Lang only**, imported in bulk from open
datasets, split into small shards, validated with sopworld, and published as static files under `docs/` (GitHub Pages).
Applications load them dynamically. Nothing here is specific to one application. PSys2 is the first user, so its
needs set priorities, but **no PSys2 names, types or code go into the worlds**.

## Hard rules

1. **SOP Lang only for worlds.** Schemas and instances are `.sop` files. No JSON facts, no JS inside wires. Host functions
   are declared with `core.function` (sopworld 0.15.0) and are never needed to *read* a world.
2. **English only inside worlds.** Type names, keys, values, `core.word` texts: English. Proper names keep their own
   spelling (`Chișinău`). Translation is always a separate layer of the application, never here.
3. **One language, no notation inside values.** Use wires and repeated keys, never mini-grammars in strings
   (`a|b`, `x:y`, `?` as "optional"). `?x` is only a variable; `@` declares; `$` refers; `::` is a fact namespace;
   dots are part of names. If you need new syntax, stop and ask in `questions.md`.
4. **Names are owned.** Each world is a sopworld module named `k.<world>` (example `k.objects`) and declares types and
   slots only under its prefix (`k.objects.part`). It lists what others may read with `core.module … exports=`.
   Matrix ids are written fully qualified (`@k.objects.part.name`, never `@t` or `@k1`), so that a module loaded
   through `imports=` (ids unchanged) never clashes with the ids of the application.
5. **Small shards.** An instance shard is at most about 2,000 wires and about 300 kB uncompressed. Shard by a
   natural key (domain, first letter, region, category) so that one shard answers one kind of question.
6. **Every fact carries its source.** `core.source="<source id> <version>"` on every imported wire (as the PSys2 geo kb
   does). Each shard file starts with a header comment naming sources, versions, licenses and the import script.
7. **Validated before published.** Every schema and shard loads in sopworld (pinned commit, see below) with zero errors;
   warnings are listed in the shard's catalog entry. `npm test` runs the validation for everything under `docs/worlds`.
8. **Reproducible.** Raw downloads go to `sources/<id>/raw/` (git-ignored); import scripts in `tools/import/<id>.mjs`
   turn them into shards deterministically (same input, byte-identical output). Commit the scripts and the shards,
   never the raw dumps.
9. **Only what can be published.** See "Licenses" in PLAN.md: import only sources we may publish openly (CC0, permissive,
   CC BY, BY-SA, BY-NC, BY-NC-SA). Do not import no-derivatives, no-redistribution or unclear sources at all. Record every
   source's license in `sources/<id>/SOURCE.md` and in the catalog.
10. **Approximate numbers, "cannot", drawings** (reviewer's answers Q17 to Q19). A number that is only approximate goes
    in a second key with the suffix `_about` (`moons_about=95` next to the exact key `moons`); never both keys on one
    fact. What a thing is known not to be able to do is `cannot=<verb>` next to `can=<verb>`; one fact never has the
    same verb in both, and a missing `can` says nothing. `drawing=<object name>` is the join from a fact to its
    drawing in `k.objects`.
11. **One commit per task**, with the numbers (wires, shards, bytes, load time, warnings) in the commit message and in
    `worker-log.md`. Never edit `questions.md` answers; the reviewer answers in `worker-tasks.md`.

## Tests: per push and per round (owner, 16:35: do not lose the time in tests)

Several workers share one machine (8 GB, 2 CPUs): run test files one at a time, never the whole suite in parallel.

- **Per push:** `npm run test:changed`: the build, then only the test files the changed paths touch (against
  origin/main: committed, staged, unstaged and new files) and the catalog, validate and repository tests.
  `node tools/test-run.mjs --plan` prints the files it would run and why, without running them. Never push red.
- **Once per round** (the last push of a worker's round): `npm run test:all`, every file one at a time.
- `npm run test:slow`: the 10 slowest files of the last runs, with seconds and peak memory (from
  `.test-timings.json`, git-ignored, written by every run of the runner). A file over 30 s is split or shrunk.
- The runner (`tools/test-run.mjs`) starts a file when its last peak memory and a margin are free, and runs a file
  killed by SIGKILL (the memory killer) again alone. `test:changed` asks only the questions of the touched worlds.
- `tools/validate.mjs` (and so the build and the catalog test) does not load again a world whose inputs are unchanged
  since it passed (same sopworld build and validator, same schemas, same shards: `.validate-cache.json`,
  git-ignored); `SKW_NO_CACHE=1` validates everything, as a fresh clone does.
- A test that only reads facts of a world uses `factsOf(world, types)` (tools/lib/worlds.mjs), not `fullWorld`:
  loading k.objects takes 44 s. `tools/sync.sh` rebases on origin/main and regenerates the
  generated files after a conflict (logs keep both sides; `tests/repo.test.mjs` refuses conflict markers).

## sopworld version

Validate with the sopworld build pinned in `tools/sopworld/VERSION` (0.97.0 at commit 04fc35e as of 2026-11-15; the VERSION file is authoritative) of `ml-circuits-research/soplang-words-lib` (`docs/sopworld.mjs`
is the single-file build). Pin by commit in `tools/sopworld/VERSION`; no tags. **One build** for every world, `k.*` and
`w.*`, and every tool and test (Q35: two builds side by side is a trap). Upgrade only when the reviewer says so.

## Layout

```
docs/                     GitHub Pages root (published)
  index.html              how applications use the catalog (one page, plain)
  worlds/
    README.md             the catalog explained
    index.json            the catalog (generated by tools/build-catalog.mjs)
    vocab.json            word -> shards index (generated)
    k.<world>/
      schema.sop          the module: core.module, types, slots, rules, soft rules, core.word for its vocabulary
      shards/<key>.sop    instances
      WORLD.md            what the world knows, its sources, examples of questions it helps with
sources/<id>/SOURCE.md    where it comes from, license, version, how to fetch, what is kept
tools/import/<id>.mjs     raw -> shards
tools/build-catalog.mjs   scans docs/worlds, validates, writes index.json and vocab.json
tools/sopworld/           the pinned single-file sopworld build and VERSION
tests/                    validation and size gates
```
