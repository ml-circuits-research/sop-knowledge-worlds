# k.words

English words: the noun and verb senses of about 10,000 frequent words, from WordNet 3.1.

## What it knows

- `k.words.sense` (shared, closed), identity `word` + `pos` + `n`: one sense of a word.
  - `word`: the word as WordNet spells it (`dog`, `Paris`). `pos`: `noun` or `verb`.
  - `n`: the sense number in WordNet; 1 is the most frequent sense. At most the first 3 senses per part of speech
    are kept, and senses marked as slurs or vulgar are left out, so a number may be missing.
  - `gloss`: a short definition (a string).
  - `synonym`: other words with this sense. `is_a`: what it is a kind of. `instance_of`: what a named thing is
    (`Paris` → `national capital`). `part_of`: what it is a part of (`wheel` → `wheeled vehicle`). All many; a value
    of one word is an atom, a value of several words is a string (`"domestic animal"`).
- `core.word` facts in the shards: irregular forms (`text=children means=child`) and lower-case text for capitalised
  words (`text=paris means=Paris`), both `of=k.words.sense.word`.
- Exports: `k.words.sense`.

The values of `is_a`, `part_of` and the others are words, not senses: to follow a chain, look the value up as a
`word` again (its first sense is the usual one). A value may be a word that has no sense in the shards (only words of
the frequency list have senses).

## Shards

By the first two letters of the word (`do.sop` holds `dog`, `door`, `do`); a one-letter word or a word whose second
character is not a letter is in the shard of its first letter. A bucket that would pass the size limits is split into
consecutive parts (`co-1`, `co-2`); none needs it today. `vocab.json` maps every word (lower case) and every
irregular form to its shard. 318 shards, 28,951 wires, 5,610,059 bytes; the largest is `co` (1,185 wires, 229,974
bytes).

## Sources

WordNet 3.1 (`core.source="wordnet 3.1"`, WordNet licence), words chosen with the FrequencyWords 2018 English list
(first 20,000 lines). The licence text is `LICENSE` in this folder. See `sources/wordnet/SOURCE.md`, `sources/frequency-words/SOURCE.md` and `../LICENSES.md`.
Import: `node tools/import/wordnet.mjs`.

## Questions it helps with

- "What is a dog?" → `{ type: 'k.words.sense', where: { word: 'dog', pos: 'noun', n: 1 }, seek: 'gloss' }`
- "What is a dog a kind of?" → `seek: 'is_a'` → `canine`, `"domestic animal"`
- "What is a wheel part of?" → `seek: 'part_of'` → `"wheeled vehicle"`
- "Another word for car?" → `seek: 'synonym'` → `auto`, `automobile`, `machine`, `motorcar`
- "Which words are kinds of canine?" → `{ where: { is_a: 'canine' }, seek: 'word', mode: 'list' }` (over the shards
  that are loaded)
