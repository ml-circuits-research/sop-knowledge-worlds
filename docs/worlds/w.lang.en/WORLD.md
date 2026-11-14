# w.lang.en: English grammar as facts

A reusable world (namespace `w.*`): what is known about English grammar, so that an application reads English with
it instead of its own lists and rules. Facts only; what applies them is the library's `std.grammar`
(soplang-words-lib: `parseText`, `nounPhrase`, `grammarView`, `viewDiff`; the functions proposed in PSys2's
`std-grammar.md` follow there). Open-class words are not here: nouns and adjectives are `k.words`, verbs
`k.actions`, number words and colours `k.values`.

Source: PSys2's hand-over `handover/lang.en` at commit `78f45863` (CC0, `sources/psys2/SOURCE.md`), imported by
`tools/import/psys2-lang-en.mjs`; what the import changed to meet this repository's rules is in [IMPORT.md](IMPORT.md).

## What it holds (Round 12, import)

| shard | facts |
| --- | --- |
| determiners | 31 determiners and quantifiers, with kind, number, definiteness, person; `in` = the PSys2 list (view) a word was in |
| pronouns | 21 pronouns (case, person, number, gender, what they refer to), 14 anaphoric noun phrases ("that one") in the order they are tried |
| prepositions | 32 prepositions as relations (place, goal, source, way; roles), 7 temporal ones (`w.lang.en.prep.time`: earlier, later, within; all 7 joined: to `k.time.before`, and during to `k.time.during`) |
| numbers | 11 ordinals, 13 small cardinals (agree with `k.values.number`) |
| morphology | 11 inflection rules in order, 5 irregular plurals, 31 noun exceptions, 20 contractions, 6 contraction endings (and core-plurals, hand-morphology: 201 irregular plurals more) |
| ellipsis | 19 lead and 4 trail markers of a fragment, 10 repeats, 27 sentence starters, 6 limits |
| grammar | 64 constructions (54 of English, 10 helpers) with 84 productions over 53 categories; the 28 words of 16 small categories; coordination words and limits |
| clauses | joiners and how they cut, frame leads, 13 self-correction markers, bare answers, 11 question words, 14 auxiliaries, negation |
| frames-acts, -more, -data | 233 argument frames of the acts of `k.actions` with their 1,244 parts and 30 fixed arguments |
| frames-acts-text, -facts, -media, -own | 118 frames PSys2 wrote after the import (`src/lang/en.local.mjs`): 27 of text (`acts.text`: headings, paragraphs, bold, undo the last 2 changes), 62 of facts by lookup (`acts.facts`: 38 questions over any attribute or relation of a place, 20 highlight / pin / line layers, 3 clear, 1 view), 24 of media (`acts.media`: play, loop, add a melody), and the 5 of the act `own`; 707 parts, 47 fixed arguments |
| joiners-keep | `keep`: a word after "and" that continues the noun phrase before it (its: "Highlight Romania and its neighbours") |
| hand-grammar, hand-joins | what this repository added: 4 constructions with 7 productions (and 4 helpers), the words of AUXNEG, HAVE, IF, THEN; 27 role maps (4 for the frames written after the import); 15 prepositions joined to k.layouts and 20 new ones |
| phrases | 81 phrase groups (politeness, fillers, answers, degree, comparison, request and question shapes, undo, redo) and 4 lexicons the frames name |

## How a host reads it

- **Categories.** `w.lang.en.cat name=DET type=w.lang.en.det` says that the words of DET are the `text` of the
  `w.lang.en.det` facts; NUM also takes digits (`digits=yes`); a category of a few words (QALL: all, every, each,
  both) has `w.lang.en.word text= cat=` facts; N, MOD, NAME and VP are open: the host gives them from `k.words`
  (nouns, adjectives), the worlds in play and `k.actions`. `tools/lib/lang-en.mjs` builds the library's options
  from these facts (`hostOptions`) and an open-class lexicon from `k.words` through `vocab.json` (`hostLexicon`).
- **Productions** are plain: `w.lang.en.rule lhs=NP rhs=DET rhs=MODS rhs=NOUNS construction=np.det-n`. Each rhs is
  one category; there is no `?`, `*`, `+` or `[a|b]` inside a value. An optional part is a second production
  without it, a repeated part a helper category (MODS -> MOD | MOD MODS), a set of words a category of its own. A
  production never names a category twice: a fact keeps a repeated key as a set, so `rhs=NP rhs=OF rhs=NP` would
  lose its second NP; it is written NP -> NP OFNP, OFNP -> OF NP.
- **Constructions** (`w.lang.en.construction`) say what the productions mean: `about` the category, `emit` the
  roles a reading carries (`set=all`), `reading` in words, `asks` for a question, `function` the std.grammar
  function that applies what productions cannot (shared arguments, one-anaphora, references), `example` sentences,
  `status=hole` when no reader applies it yet. A construction said only in words has no production.
- **Frames.** One `w.lang.en.frame` per way of saying an act, with its parts in order (`w.lang.en.part frame= at=`):
  `is` lead, det, verb (the verbs of `act` in `k.actions`), word (one of `word`), phrase (a group of
  `w.lang.en.phrase`), lexicon, or role (a capture: `role`, `takes` words, rest, number, prep or lexicon). `needs`
  is what a world's schema must have for the frame to apply. `optional=yes` for a part that may be left out,
  `max_words`, `quotes=yes` (free text that keeps its quotes), `listed=yes` (one word written as a set, "[have]"), so
  that a host that reads patterns writes each pattern again exactly as the source wrote it (a test does it for every
  frame); `after` places a frame right after another of its set where a reader tries them in order. The frames of
  the act `own` hand a sentence to the reader of a world of its own ("Make a diagram shaped like a house"); they name
  no act of k.actions.
- **Documentation.** The constructions of the question frames, joiners, corrections, negation and imperatives and the
  contraction endings carry `documentation=yes`: the source wrote them to document its own readers, not as data it
  reads. They stay complete, and the library's parser reads the question productions (a test).
- **Views.** `in=` keeps the lists PSys2 had in its modules; `grammarView(world, type, view)` gives one,
  `viewDiff` says where two differ, so that unifying them is a measured decision of the application.

Checked by `tests/w.lang.en.test.mjs` with the one library build of this repository (`tools/sopworld/VERSION`, 0.63.0): the
noun-phrase examples ("the big red house", "the legs of the crocodile", "the house's door", "table 1 or table 2",
"some of the tables", "everything except the tree", "the other table") and four question shapes parse with the
right construction and head, with the nouns and adjectives taken from `k.words`.

## Joins

- **k.values:** the numerals, ordinals and numeral determiners have the values of `k.values.number` (a test); the
  quantifiers over a set (all, every, each, both) are `k.values.set_word` names or their words (every is a word of each).
- **k.words:** the irregular singulars and the noun exceptions are words of `k.words`; plurals in a sentence are
  read by the morphology rules to the word `k.words` holds (`hostLexicon`). `shards/core-plurals.sop` (WordNet's noun
  exceptions, `tools/lang-en-core.mjs`) adds 184 plurals of k.words nouns that the rules do not read (mice, feet,
  children, vertebrae, potatoes); the classical and foreign ones are `read_only=yes` (antennae is read as antenna, a
  writer writes antennas), and plurals that are words of their own are left out (cola, dive, soles).
  `shards/hand-morphology.sop` adds people, the -man plurals WordNet makes by a rule of its own, and the plurals that
  are the singular (sheep, deer, fish).
- **k.actions:** every frame names an act of `k.actions` and its verb parts the verbs of an act (PSys2's verb
  groups `set` and `apart` are the acts change and take apart). Every role of every frame is a role of its act:
  by name, or through `w.lang.en.role_map` (23 maps in `shards/hand-joins.sop`: make.thing is the kind, a rel that
  takes a preposition marks the place, save.value is the name, or the format in the two frames that say "as SVG").
  Every marker of a role in `k.actions` is a preposition here, except "and" (connect a and b), a conjunction.
- **k.layouts:** a preposition that says a place names the relation of `k.layouts.relation` it says (`layout`), and
  `inverse=yes` when it says it the other way round (under: above inverse; to the right of: left_of inverse; in front
  of: behind inverse). The prepositions of the hand-over lacked left of, right of, in front of, on top of,
  underneath, beneath; they are in `shards/hand-joins.sop`.

## Left out, holes

- Left out (one application's): the tab flags (`tab-only`, `tab-priority`) of 6 frames: how the demo's tabs claim a
  sentence. See IMPORT.md. The 5 frames of the act `own`, left out at first, are published (block 07:40).
- Filled here (`shards/hand-grammar.sop`): statements with be ("the table is red", construction `s.copula`); the tag
  question ("the table is red, isn't it": negated auxiliaries; it was a hole of the hand-over); relative clauses with
  have ("the table that has four seats"); conditions ("if the table is red then the chair is blue"); standing rules
  after a frame lead ("from now on the squares are grey"); was and were. Each parses with the library (a test).
- Filled after k.time got its order (version 2): the temporal prepositions name `k.time.before` (`relation`) and
  which of its keys the first thing is (`first_is`): "Monday before Friday" holds when Monday is the `earlier`;
  "December after November" when December is the `later`; `pp.time` is no longer a hole. until and since name the
  same order (`second_is` the end or the start of a span, which itself counts: "Monday until Friday", "Friday since
  Monday"); during names `k.time.during` (k.time version 3: "January during winter" in the north, "9 am during the
  morning").
- Filled after block 08:00 (`shards/hand-grammar.sop`): **imperative clauses** (`clause.imperative`: a verb V, after
  lead words, with what it acts on and where: "please put the cat on the mat", "can you move the tree";
  `clause.imperative-neg`: "do not move the tree"); **"of" beyond parts**: `np.attribute-of` ("the colour of the
  table", ATTRN: 15 attribute nouns) and `np.position-of` ("the top of the box"), both with `priority` over
  np.possessive-of, and the attribute question with ATTRN. A category may take its words from another world
  (`from_type`, `from_key`): V from the verbs of k.actions, POSN from the positions of k.values (`hostLexicon` in
  tools/lib/lang-en.mjs fills them). Not read: "the left of the table" (the multiword preposition "left of" takes the
  words first); "a cup of tea" (a measure of a substance).
- The library's tokenizer drops commas, so the coordination separator "," is not read ("a sun, a cloud and a man"
  parses only as "a sun and a cloud and a man"); questions.md Q39.
