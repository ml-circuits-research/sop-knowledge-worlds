# psys2-eval-ro: PSys2's Romanian commands, for measuring w.lang.ro

- **What:** `messages.jsonl`, the 240 distinct Romanian messages (with diacritics) of the worlds `art.draw`,
  `docs.editor`, `ui.shell` and `data.charts` of PSys2's `training/eval/operational-ro.jsonl`, each with its casual
  variant (typed without diacritics, sometimes shorter); and `gold-lemmas.tsv`, the lemma of each of their 335 word
  forms (after splitting at hyphens), written by hand by the first worker (several lemmas where the form has several
  readings in the set; `name`, `letter`, `foreign` for words that are not counted).
- **From:** the PSys2 repository at commit `dccd3239` (read from a local copy at /tmp/wt2). Kept: the source id, the
  world, the message and its casual variant.
- **Licence:** the project's own data (reviewer's block "2026-11-13 22:30": PSys2's hand-written data can be published
  here as CC0); CC0-1.0. Measuring data, not knowledge: nothing of this folder is in a world.
- **Used by:** `tests/w.lang.ro.test.mjs` (coverage of w.lang.ro).
