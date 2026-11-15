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
2. **English is the language of ids and keys; words of a language live in its language world** (KR3, reviewer
   14:25). Type names, keys and enum values are English identifiers in every world. Wording meant to be said or read
   (replies, explanations, word lists) belongs to the language world of its language (`w.lang.en`, `w.lang.ro`), in a
   shard that world owns, joined to the neutral fact by name; a second language adds a shard there and changes no
   other world. Proper names keep their own spelling (`Chișinău`). The `core.word` blocks of the k.* schemas are
   English words still to move (KR3, world by world).
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
   CC BY, BY-SA). Do not import non-commercial (NC), no-derivatives, no-redistribution, research-only or unclear sources at all. Record every
   source's license in `sources/<id>/SOURCE.md` and in the catalog. `tools/validate.mjs` refuses a licence outside the
   allowlist of `tools/lib/licenses.mjs`; a share-alike licence (CC BY-SA, ODbL, CDLA-Sharing) stays in files of its own.
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
  loading k.objects takes 44 s; a test of its drawings uses `objectsView()` (the object, part and point facts merged by
  wire id, about 9 s).

## Generated files and rebases (reviewer blocks 15:15 and 15:35)

- The files tools write (index.json, vocab.json, vocab-kinds.json, LICENSES.md, JOINS.md, JOINS-REPORT.md,
  COVERAGE.md, ASPECTS.md, PARENTS.md, the previews, the w.lang.en dictionary, and every shard whose `# script:` is a
  tool of `npm run regenerate`) stay in git: GitHub Pages serves docs/ from main as it is, with no build before
  publishing. They never need a merge: `.gitattributes` (written by `tools/generated.mjs`; a test keeps it fresh) gives
  them the merge driver `regenerate`, which keeps main's side; the logs (worker-log.md, questions.md, worker-tasks.md,
  docs/lessons.md, CHANGELOG.md) take git's `union` merge.
- Rebase with `tools/sync.sh`: it sets up the driver (`git config merge.regenerate.driver true`), rebases, runs
  `npm run regenerate` on the rebased tip and puts the regenerated files into your last commit. A conflict in any
  other file is hand-written work: sync.sh never chooses a side, it stops with the list of files (exit 1, the rebase
  in progress). Resolve by hand, `git rebase --continue`, run it again. Before pushing, compare `git show --stat HEAD`
  with what your commit changed. `tests/repo.test.mjs` refuses conflict markers.
- A new generating tool goes into `npm run build` (or `regenerate`); then `node tools/generated.mjs` adds its files.

## sopworld version

Validate with the sopworld build pinned in `tools/sopworld/VERSION` (0.113.0 at commit 05d2f93 as of 2026-11-15; the VERSION file is authoritative) of `ml-circuits-research/soplang-words-lib` (`docs/sopworld.mjs`
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
