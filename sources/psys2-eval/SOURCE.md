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
- **Licence:** the project's own data (the reviewer's block "2026-11-13 22:30": PSys2's hand-written data can be
  published here as CC0); CC0-1.0.
- **How to refresh:** read the two files again and keep the same fields; the script is in the worker log entry
  "Round 11, item 1".
