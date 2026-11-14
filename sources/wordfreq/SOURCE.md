# wordfreq: wordfreq English, top 50,000 words

- **What:** the merged English word-frequency list of wordfreq 3.1.1 (`large_en`), its first 50,000 entries, with
  each word's Zipf value (log10 of its frequency per billion words). Used for `k.words.frequency` (block "15:15"
  item 2: the register of words for lexical choice by genre).
- **Origin:** fetched by PSys2's machine for this repository (reviewer block "19:00") into psys2
  `data/external/wordfreq-en/en-top50k.tsv` (psys2 commit a7b34da3), from the wordfreq 3.1.1 wheel
  (https://pypi.org/project/wordfreq/3.1.1/; source https://github.com/rspeer/wordfreq), decoded from
  `large_en.msgpack.gz`. sha256 of the file: `cf894ee627cf7167774d8d6b1de652435fc56c5116ba44876d86df628323fd98`.
- **Version:** wordfreq 3.1.1 (`wordfreq 3.1.1` in shard headers and on every wire).
- **License:** the data may be redistributed under **CC BY-SA 4.0** (wordfreq README); code Apache-2.0 (not used).
- **Attribution:** wordfreq by Robyn Speer, https://github.com/rspeer/wordfreq, CC BY-SA 4.0. Built from Google Books
  Ngrams (http://books.google.com/ngrams), the Leeds Internet Corpus, Wikipedia, ParaCrawl, OPUS OpenSubtitles 2018
  (http://www.opensubtitles.org/), the SUBTLEX word lists (Marc Brysbaert et al.) and Twitter statistics (no
  content republished).
- **How to fetch:** copy the file from a psys2 checkout: `mkdir -p sources/wordfreq/raw && cp
  <psys2>/data/external/wordfreq-en/en-top50k.tsv sources/wordfreq/raw/` (or rebuild it from the wheel as
  psys2's SOURCE.md says).
- **What is kept:** for each word that has senses in `k.words` (single lower-case lemmas), its Zipf value as given and
  a band computed from it; in the shards `k.words/shards/frequency-<letter>.sop`, labelled CC-BY-SA-4.0. No rank, no
  other word of the list.
