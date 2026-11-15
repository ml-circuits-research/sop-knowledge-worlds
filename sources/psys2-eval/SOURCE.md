# psys2-eval: the demo's real questions

- **What:** `real-questions.jsonl`, 292 questions asked of the PSys2 demo, used by `tools/ask-real.mjs` to measure
  how many find a fact in the catalog. They are measuring data, not knowledge: nothing of this folder is in a world.
- **From:** the PSys2 repository at commit `0bd36ec0` (read from a local copy):
  - `training/eval/failures.jsonl`: the 132 rows whose `source` mentions the Talk tab (`E-T1`, `E-T3` of
    `scripts/exp-talk.mjs`), without the three rows that are counts of other turns (`(aggregate: …)`): set
    `talk failures`. Kept: the text and the experiment group.
  - `training/eval/knowledge-lookup-2026-11-13.jsonl`: the 160 rows of the groups `draw` and `know` (the 40
    `control` rows are commands to the demo's tabs, not questions to the catalog): sets `lookup set, drawings` and
    `lookup set, knowledge`. Kept: the message, the id, for a row with an invented noun (`.inv`) the mark
    `invented` (the right outcome is "not found"), and for a knowledge row the demo's expected answer pattern
    (`expect`).
- **Also** (block "21:05" item 3): `paraphrase-failures.jsonl`, the 71 rows of psys2 `training/eval/failures.jsonl`
  (commit `c1175ee1`) whose `class` starts with `paraphrase:`; kept: the text, the class and the source. Read by
  `tools/paraphrase-words.mjs` (the content words that reach no sense of k.words).
- **Also** (reviewer block 2026-11-15 09:20, PSys2 Q18 K1/K2/K6): `real-q18.tsv`, the 9 turns of psys2
  `training/eval/real-2026-11-15.jsonl` (commit `40292c6`) that PSys2's questions.md Q18 names for lists, tasks and the
  shop (r0590, r0598, r0599, r0622-r0627); kept: the id and the text as logged. Read by
  `tests/w.lang.en.list-frames.test.mjs` (each turn read clause by clause with the right act and roles).
- **Licence:** the project's own data (the reviewer's block "2026-11-13 22:30": PSys2's hand-written data can be
  published here as CC0); CC0-1.0.
- **How to refresh:** read the two files again and keep the same fields; the script is in the worker log entry
  "Round 11, item 1".
