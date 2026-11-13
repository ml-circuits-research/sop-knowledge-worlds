# Worker log

One entry per task: what was done, numbers (wires, shards, bytes, load time, warnings), what is open.

## T1 (2026-11-13): pinned sopworld and validation

- `tools/sopworld/sopworld.mjs` = `docs/sopworld.mjs` of soplang-words-lib at c7247e2 (0.14.0, build ab7bc4ec2db6,
  426,896 bytes, sha256 d7240105...); `tools/sopworld/VERSION` names commit, build and sha256 (a test checks them).
- `package.json` (type module, no dependencies); `npm test` = `node --test tests/*.test.mjs`.
- `tools/validate.mjs` (helpers in `tools/lib/worlds.mjs`): for every `docs/worlds/k.*/schema.sop`, a World with all
  schemas as its library and `use(<world>)`; then each shard told into a fork of it (wires, bytes, load ms, warnings
  printed), and all shards of the world together (catches duplicate ids across shards). Errors: refused changes, parse
  errors, a shard without the `# sources:` / `# license:` / `# script:` header lines, a fact without `core.source`,
  a matrix wire in a shard, more than 2,000 wires or 300 kB.
- Numbers: 0 worlds yet; npm test 5/5 pass (fixture worlds check that each error kind is caught).
