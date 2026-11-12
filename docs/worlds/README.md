# Knowledge worlds catalog

This folder is served by GitHub Pages. Applications read:

- `index.json`: every world, with its schema (a sopworld module, `schema.sop`), its instance shards (`shards/*.sop`), its sources and its licenses;
- `vocab.json`: an English lemma → the shard ids where that word matters, for lazy loading;
- `k.<world>/schema.sop` and `k.<world>/shards/<key>.sop`: SOP Lang files.

How to use them from an application: see `../index.html` and PLAN.md §2 in the repository.

Nothing is published yet (Round 1 in progress).
