# k.words

English words: the noun and verb senses of about 11,500 words (the frequent words, the 1,500 common things, and the
names of the hand-written worlds with the sense under the root of their world: kilogram a unit, Mars the
planet, manta ray an animal, light year a unit), and the adjective and adverb senses of the common ones, with opposites and chains of kinds, from WordNet 3.1.

## What it knows

- `k.words.sense` (shared, closed), identity `word` + `pos` + `n`: one sense of a word.
  - `word`: the word as WordNet spells it (`dog`, `Paris`); version 2 (Q36): a name of several words is a string
    with spaces (`"manta ray"`, `"French toast"`; WordNet writes `manta_ray`), its id segment keeps the underscore
    (`k.words.manta_ray.noun.1`). 102 of the 150 names of several words of the hand-written worlds have one; 46 are
    not in WordNet (`"tomato soup"`, `"light green"`, `"bobble hat"`: their own world says what they are) and two
    have no sense under their world's root (`"chilli pepper"` only the plant, `"right angle"` an angle, not a unit). `pos`: `noun`, `verb`, `adjective` or `adverb` (the
    last two only for the common words: those of the first 3,000 lines of the frequency list and the common things
    of `tools/coverage.mjs`; 803 adjectives, 287 adverbs).
  - `n`: the sense number in WordNet; 1 is the most frequent sense. At most the first 3 senses per part of speech
    are kept, and senses marked as slurs or vulgar are left out, so a number may be missing.
  - `gloss`: a short definition (a string).
  - `synonym`: other words with this sense. `is_a`: what it is a kind of. `instance_of`: what a named thing is
    (`Paris` → `national capital`). `part_of`: what it is a part of (`wheel` → `wheeled vehicle`). All many; a value
    of one word is an atom, a value of several words is a string (`"domestic animal"`).
  - Round 9: `opposite`: WordNet's antonym of the word in this sense (`hot` → `cold`, `open` → `close`, `man` →
    `woman`; 1,377 senses of 1,029 words). `near_opposite`: for an adjective without an antonym of its own, the
    antonym of the adjective it is filed as similar to (`huge` is similar to `large` → `small`; 1,044 senses);
    weaker, and so a key of its own. `kind_of`: the chain of kinds upward from the sense, nearest first, through the
    first kind at each step (`dog` → canine, carnivore, placental, mammal, vertebrate, chordate, animal, organism,
    "living thing", whole, object, "physical entity", entity), on the noun and verb senses of the common words
    (9,342 senses): "is a dog an animal" is one lookup, `where: { word: 'dog', pos: 'noun', n: 1, kind_of: 'animal' }`.
- `core.word` facts in the shards: irregular forms (`text=children means=child`) and lower-case text for capitalised
  words (`text=paris means=Paris`), both `of=k.words.sense.word`.
- Words asked for by other worlds (`ASKED` in the importer, block "16:10"; subhead, block "21:05" item 3): anterior, bold, horizontal, italic, sandy,
  thick, thicken, vertical are kept with every part of speech whatever their place in the frequency list, for the
  lemmas of `w.lang.ro`'s dictionary (cursiv = italic adjective 1, îngroșat = bold adjective 2 "clear and distinct",
  îngroșa = thicken verb 1, anterior = anterior adjective 2 "earlier in time", nisipiu = sandy adjective 1).
  `numbered` is not an adjective in WordNet 3.1 (only a form of the verb *number*, sense 2 "give numbers to"): its one
  sense is written by hand (`HAND_SENSES`, `hand-core 1`, CC0) in the shard `hand.sop`, which holds no WordNet wire.
- **Register of words** (version 3, block "15:15" item 2, for lexical choice by genre):
  - `usage` on a sense: WordNet's usage domain where it gives one: `informal` (WordNet's colloquialism), `slang`,
    `archaic`, `formal`, `euphemism`, `disparaging` (171 marks on 170 of the kept senses: 115 informal, 33 slang, 14 archaic, 7
    euphemism, 1 formal, 1 disparaging). A sense without it is neutral as far as WordNet says.
  - `k.words.frequency` (identity `word`, lower case): `zipf`, the word's Zipf value in wordfreq's merged English list
    (wordfreq 3.1.1 `large_en`, top 50,000: subtitles, Wikipedia, books, news, web; Zipf = log10 of the frequency
    per billion words, van Heuven et al. 2014), and `band` computed from it: 1 very common (Zipf >= 6), 2 common
    (>= 5), 3 familiar (>= 4), 4 uncommon (>= 3), 5 rare (below 3). 11,278 words with senses here have one (62, 828,
    3,800, 5,790, 798: dog 2, animal 3, penguin 4, thicken 5); a word with no fact is rarer, or not in the list. A
    register of k.genres names the highest band its vocabulary mostly keeps to; k.interest's `word_band` and
    `share_beyond_band` read it.
  - Shards `frequency-<letter>.sop` (26, 11,278 facts, 1.18 MB), under wordfreq's data terms, **CC BY-SA 4.0**, with
    the attributions it asks for (`sources/wordfreq/SOURCE.md`), so no WordNet shard changes its terms (Q9). A host
    that wants no share-alike data leaves them out.
- Exports: `k.words.sense`, `k.words.frequency`.

The values of `is_a`, `part_of` and the others are words, not senses: to follow a chain beyond the common words (which carry `kind_of`), look the value up as a
`word` again (its first sense is the usual one). A value may be a word that has no sense in the shards (only words of
the frequency list, the common things and the names of the cores have senses).

## Coverage of the words of failing paraphrases (block "21:05" item 3)

A reader that replaces an unknown word in a slot by its nearest sense needs every content word to reach a sense.
`node tools/paraphrase-words.mjs` reads the 71 failing paraphrases of the first host
(`sources/psys2-eval/paraphrase-failures.jsonl`), drops the closed-class words of `w.lang.en` and numbers, and looks
each of the 138 content words up in k.words: the word, a form k.words names (`core.word`), its stem by the regular
endings (-s, -es, -ies, -ed, -ing, -er, -est; doubled consonant and dropped e restored), without a possessive 's or
the ending of a contraction. Before this item 126 reached a sense; `subhead` ("Add a subhead details") was missing
and is now kept as an asked word (WordNet noun 1, "a heading of a subdivision of a text", in its WordNet shard
`su`). 128 of 138 reach a sense; the 10 that do not are not words of English or not content words: names (Zoe,
Zoe's, Anah for Ana), a chess square (c3), a misspelling (wat), and closed-class words w.lang.en does not list yet
(if, myself, yourself, hey, um: block "21:05" item 5). Reaching a sense is not reaching the meant one: Ana, Tom,
Leo reach WordNet senses that are not the names (a collection of anecdotes, a male animal, a constellation), lei
the garland (the money of Romania is `leu`), G a gram. Checked by `tests/k.words.paraphrase.test.mjs`.

## Shards

By the first two letters of the word (`do.sop` holds `dog`, `door`, `do`; `ma.sop` holds `"manta ray"`); a one-letter word or a word whose second
character is not a letter is in the shard of its first letter. A bucket that would pass the size limits is split into
consecutive parts: `co` is now `co-1` and `co-2`. `vocab.json` maps every word (lower case) and every
irregular form to its shard. 348 shards (321 from WordNet, 26 of word frequency and `hand.sop`), 43,710 wires, 8,676,705 bytes; the largest is `re` (899 wires, 187,344
bytes).

## Sources

WordNet 3.1 (`core.source="wordnet 3.1"`, WordNet licence); the frequency of words from wordfreq 3.1.1 (`core.source="wordfreq 3.1.1"`, CC BY-SA 4.0, own shards); words chosen with the FrequencyWords 2018 English list
(first 20,000 lines, and the 1,500 common things of `tools/coverage.mjs` wherever they stand in the list: 427 of
them come later, sunflower, teapot, locomotive, chimpanzee; each with the sense that rule keeps). The licence text is `LICENSE` in this folder. See `sources/wordnet/SOURCE.md`, `sources/frequency-words/SOURCE.md` and `../LICENSES.md`.
Import: `node tools/import/wordnet.mjs`.

## Questions it helps with

- "What is a dog?" → `{ type: 'k.words.sense', where: { word: 'dog', pos: 'noun', n: 1 }, seek: 'gloss' }`
- "What is a dog a kind of?" → `seek: 'is_a'` → `canine`, `"domestic animal"`
- "What is a wheel part of?" → `seek: 'part_of'` → `"wheeled vehicle"`
- "Another word for car?" → `seek: 'synonym'` → `auto`, `automobile`, `machine`, `motorcar`
- "Which words are kinds of canine?" → `{ where: { is_a: 'canine' }, seek: 'word', mode: 'list' }` (over the shards
  that are loaded)
- "What is the opposite of hot?" → `{ type: 'k.words.sense', where: { word: 'hot', pos: 'adjective', n: 1 }, seek: 'opposite' }` → `cold`
- "Is a dog an animal?" → `where: { word: 'dog', pos: 'noun', n: 1, kind_of: 'animal' }`

## Limits of the opposites

WordNet's antonyms are between words, and it pairs `big` with `little` and `large` with `small`; `friend`, `war` and
`day` have no antonym among their first three senses. Of the 2,978 words in the first 3,000 lines of the frequency
list, 2,416 have a sense here (the others are function words and inflected forms), 599 have an opposite and 953 an
opposite or a near opposite.
