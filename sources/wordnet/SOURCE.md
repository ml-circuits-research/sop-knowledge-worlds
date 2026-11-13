# wordnet: Princeton WordNet 3.1

- **What:** the English lexical database of Princeton University: words grouped into sets of synonyms, each with a
  gloss, linked by is-a, instance-of and part-of.
- **Origin:** https://wordnet.princeton.edu/ ; fetched from the nltk_data repository on GitHub
  (`nltk/nltk_data`, branch `gh-pages`, commit `550b6625bcef1f2abff2ff770a5a0d272c9c6b2a`,
  `packages/corpora/wordnet31.zip`, sha256 `2a9e7da7d0c17ad875e4171a4d28ae17ab6969c7d67f1cf0f59d65c66d0fdd37`).
- **Version:** 3.1 (`core.source="wordnet 3.1"`).
- **License:** the WordNet licence (permissive: use, copy, modify and distribute for any purpose, with the copyright
  notice kept); written `WordNet-3.0` in shard headers and the catalog, the name of the licence text.
- **Attribution:** WordNet 3.1 Copyright 2011 by Princeton University. All rights reserved. THIS SOFTWARE AND DATABASE
  IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED. The full
  licence text is `LICENSE` in the archive and at https://wordnet.princeton.edu/license-and-commercial-use . Which
  words are kept was chosen with the FrequencyWords list (see `sources/frequency-words/SOURCE.md`).
- **How to fetch:** `mkdir -p sources/wordnet/raw && cd sources/wordnet/raw && curl -L -o wordnet31.zip
  https://raw.githubusercontent.com/nltk/nltk_data/550b6625bcef1f2abff2ff770a5a0d272c9c6b2a/packages/corpora/wordnet31.zip
  && unzip wordnet31.zip` ; then `node tools/import/wordnet.mjs`.
- **What is kept:** for the words of the frequency list (its first 20,000 lines, and the common things of
  `tools/coverage.mjs` wherever they stand in it; lower case letters, digits and hyphens only) that WordNet has as a noun or a verb: the 3 most frequent senses per part of speech, each with the
  definition part of its gloss (no example sentences), the other words of its synset (`synonym`), the first word of
  each hypernym synset (`is_a`), of each instance hypernym (`instance_of`) and of each part holonym (`part_of`); the
  irregular forms of `noun.exc` and `verb.exc` as `core.word` facts. Senses that WordNet marks as slurs, offensive
  or vulgar terms are left out. Not kept: adjectives, adverbs, member and substance holonyms, verb frames, examples.
- **Counts (2026-11-13):** 19,697 list words usable, 10,471 words kept, 26,116 senses (61 left out as offensive),
  1,264 irregular forms, 2,021 capitalised spellings; 28,951 wires in 318 shards, 5,610,059 bytes.
- **Also kept, for `k.actions`:** the gloss of the verb senses named in `sources/hand-core/act-verbs.tsv` (269 verbs,
  283 senses; `sources/wordnet/act-verb-glosses.tsv`, rewritten by `node tools/acts-core.mjs --glosses`).
- **Also kept, for `k.parts`:** the part meronyms of the kept sense of the 1,500 common things and of their
  hypernyms up to two steps, each by the first word of its synset, and the gloss of the sense (`tools/import/parts.mjs`).
- **Round 9 (2026-11-13), also kept:** antonyms (`opposite`: the lexical pointer `!` of the word in the sense); for
  an adjective without one, the antonym of the adjective it is similar to (`near_opposite`: the pointer `&`, then
  `!`); the adjective and adverb senses (first 3) of the common words (the first 3,000 lines of the frequency list
  and the common things of `tools/coverage.mjs`); the chain of first hypernyms to the top (`kind_of`) for the noun
  and verb senses of those words. Counts with Round 10 item 2: 11,313 words, 28,987 senses (1,648 adjective, 534
  adverb), 1,377 senses with an opposite, 1,044 with a near opposite, 9,342 with a chain; 31,926 wires in 321
  shards, 7,258,687 bytes.
