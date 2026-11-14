# unimorph-ron: UniMorph Romanian

- **What:** UniMorph's Romanian inflection table (lemma, inflected form, feature bundle; 84,679 rows, 4,406 lemmas),
  from Wiktionary. Used to derive a bigger `w.lang.ro` dictionary (lemma -> paradigm class), reviewer blocks "18:20"
  item 2 and "19:35".
- **Origin:** fetched by PSys2's machine for this repository (block "19:00") into psys2
  `data/external/unimorph-ron/ron.tsv` (psys2 commit ea2b29e7), unchanged from https://github.com/unimorph/ron (file
  `ron`). sha256: `0c007e572cacf37b0e538f024cea9e630cc17669c4faa7a5054655530871fd22`.
- **Version:** fetched 2026-11-14 (`unimorph-ron 2026-11-14` in the dictionary headers).
- **License:** CC BY-SA 3.0 (the repository's README: "Source: Wikipedia", "License: CC BY-SA 3.0").
- **Attribution:** UniMorph (https://unimorph.github.io), Romanian data derived from Wiktionary, CC BY-SA 3.0.
- **How to fetch:** `mkdir -p sources/unimorph-ron/raw && cp <psys2>/data/external/unimorph-ron/ron.tsv
  sources/unimorph-ron/raw/` (or `curl -L -o sources/unimorph-ron/raw/ron.tsv
  https://raw.githubusercontent.com/unimorph/ron/master/ron`).
- **What is kept:** for each lemma whose UniMorph forms one paradigm class of `w.lang.ro` generates in full, the lemma,
  the class and the gender the class implies, in `docs/worlds/w.lang.ro/dictionary-unimorph/<letter>.tsv`, labelled
  CC-BY-SA-3.0. No inflected form and no feature bundle is published; lemmas of the hand dictionary are left out
  (the hand row wins). Script: `tools/lang-ro-unimorph.mjs`.
