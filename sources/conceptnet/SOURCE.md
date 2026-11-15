# conceptnet: ConceptNet 5.7

- **What:** a graph of common-sense assertions between words and phrases. For `k.commonsense`: where things are,
  what they can do, what they are used for and made of, what they are a kind of, a part of, and what they have.
- **Origin:** https://github.com/commonsense/conceptnet5/wiki/Downloads ; the file is
  `https://s3.amazonaws.com/conceptnet/downloads/2019/edges/conceptnet-assertions-5.7.0.csv.gz` (about 475 MB).
- **Version:** 5.7 (`core.source="conceptnet 5.7"`).
- **License:** CC-BY-SA-4.0.
- **Attribution:** This work includes data from ConceptNet 5, which was compiled by the Commonsense Computing
  Initiative. ConceptNet 5 is freely available under the Creative Commons Attribution-ShareAlike license (CC BY-SA
  4.0) from https://conceptnet.io . The included data was created by contributors to Commonsense Computing
  projects, contributors to Wikimedia projects, Games with a Purpose, Princeton University's WordNet, DBPedia,
  OpenCyc, and Umbel.
- **Status: NOT FETCHED.** The file is on Amazon S3, which the network of this repository's workers does not
  reach (GitHub, npm and pip only). No ConceptNet fact is in the repository. `tools/import/conceptnet.mjs` is
  written and tested on a made-up fixture in the file's format (`tests/import.conceptnet.test.mjs`).
- **How to fetch and run (on a machine with an open network):** `mkdir -p sources/conceptnet/raw && curl -L -o
  sources/conceptnet/raw/conceptnet-assertions-5.7.0.csv.gz
  https://s3.amazonaws.com/conceptnet/downloads/2019/edges/conceptnet-assertions-5.7.0.csv.gz && node
  tools/import/conceptnet.mjs && node tools/build-catalog.mjs && npm test`
- **What will be kept:** edges whose two ends are English (`/c/en/…`), with weight 2 or more, of the relations
  AtLocation (`at`), CapableOf (`can`), UsedFor (`used_for`), MadeOf (`made_of`), IsA (`is_a`), PartOf
  (`part_of`), HasA (`has`); one `k.commonsense.thing` per start term, values by weight; things the hand-written
  core already has are left to it. Shards `conceptnet-<first letter>`, split into parts inside the size gate.

- **Imported (KR6, 2026-11-15):** CapableOf, UsedFor, MadeOf and HasProperty of the 1,500 common things into
  `k.attributes.thing` (`can`, `used_for`, `material`, `property`), shard `k.attributes/shards/things-conceptnet`
  (CC-BY-SA-4.0, a shard of its own), by `tools/import/conceptnet-attributes.mjs` from the subset PSys2's machine fetched
  (psys2 `data/external/conceptnet-en/`, copied to `sources/conceptnet/raw/`, git-ignored). Hand check:
  `sources/conceptnet/audit.tsv` (it quotes ConceptNet and keeps its licence). Only values checked right are written:
  no relation's sampled error was under 5 %.
