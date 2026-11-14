# psys2: the English grammar of the PSys2 demo (its hand-over `handover/lang.en`)

- **What:** what the demo application PSys2 knows about English, collected by PSys2 from seven of its modules as
  facts: closed word classes (determiners, pronouns, prepositions, small numbers), morphology, clause structure,
  ellipsis markers, noun-phrase rules, the argument frames of its acts, phrase groups; and four small lexicons and
  two phrase groups its frames name, from its worlds (`worlds/space/lexicon.sop`, `worlds/acts/lexicon.sop`,
  `worlds/lang.common/lexicon.sop`). Imported as the reusable world `w.lang.en`.
- **Origin:** the PSys2 repository of this project (github.com/ml-circuits-research, private), directory
  `handover/lang.en/` (README.md, schema.sop, std-grammar.md, shards/*.sop), read from a checkout with
  `git show <commit>:<path>` (the checkout is never changed).
- **Version:** commit `78f45863` (`core.source="psys2 78f45863"`); the files of `handover/lang.en` were last changed
  at `9b025e05` and are the same at `78f45863`.
- **License:** CC0-1.0 (the project's own hand-written data; the reviewer's ruling in `worker-tasks.md`, blocks
  "2026-11-13 22:40" and "2026-11-14 01:20").
- **Attribution:** none needed.
- **How to fetch:** a checkout of PSys2; then `node tools/import/psys2-lang-en.mjs --from <checkout> --commit 78f45863`.
- **What is kept:** everything of the hand-over that says something of English, rewritten under this repository's
  rules; `docs/worlds/w.lang.en/IMPORT.md` (generated) lists what was changed and what was left out and why.
