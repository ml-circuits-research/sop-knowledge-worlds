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
| hand-frames | frames written here where a host found a sentence no frame reads right: `acts.make.name.place.p`, the named add with a place verb and a place ("Put a guest named Maria at table 1.", block 20:15 from PSys2; acts.make.name.p took the rest as the name) |
| templates-acts | generation (block 17:05): 34 templates of the 16 acts of k.actions, one per act and argument shape; the article forms (a, an) and 19 onsets |
| templates-discourse | composition (blocks 14:45 item 2, 15:00 item 4, 17:05): 116 templates of 43 rhetorical moves of k.genres in its 5 registers, and the 35 slots they name |

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

Checked by `tests/w.lang.en.test.mjs` with the one library build of this repository (`tools/sopworld/VERSION`, 0.113.0): the
noun-phrase examples ("the big red house", "the legs of the crocodile", "the house's door", "table 1 or table 2",
"some of the tables", "everything except the tree", "the other table") and four question shapes parse with the
right construction and head, with the nouns and adjectives taken from `k.words`.

## Generation: templates of the acts (block 17:05; 14:15 item 1)

`w.lang.en.template` gives one sentence per act and argument shape, imperative (a question for ask), for the
library's realisation (std.morph `realise` / `templateFor(act, shape)`, read with `types: { template:
'w.lang.en.template' }`) and the round trip of std.sample: `add a {kind}.`, `add {number} {kind:num=pl}.`, `make
{thing} {value}.`, `change the {attribute} of {thing} to {value}.`, `put {thing} {place}.`, `take apart {thing}.`,
`what is the {topic} of {thing}?`. Slots are roles of the act in k.actions (`role=` lists them). A `kind` is filled
with a kind's name, a `thing` (and `source`, `target`, `recipient`) with the thing as the host refers to it, with
its determiner ("the house", "table 1", "Ann"), a `place` with a relation and a thing ("next to the tree"); the other
roles with a word. `{role:num=pl}` is the plural by this world's morphology; the article `a` becomes `an` before a
vowel sound (`w.lang.en.det before=`, and `w.lang.en.onset` where the spelling misleads: an hour, a unicorn, a
European). `shape` is the roles in k.actions order, then the frame's mode, then a fixed attribute (`kind.value.name`:
"add a guest called Ann"); `none` for a template without roles. `frame` names the frame(s) the template realises and
`needs` that frame's needs: a host uses the template only in a world that meets them.

**Established term** (block 05:25): these templates are surface realisation, the last stage of the natural language
generation pipeline of Reiter & Dale (2000, *Building Natural Language Generation Systems*, Cambridge University
Press). Where this model differs: realisation is by templates with slots, inflection and the article (std.morph), not
by a grammar of English; the stages between (lexicalisation, aggregation, referring expressions) are the host's.

| act | templates (shapes) |
| --- | --- |
| make | kind; kind.number; kind.value; kind.number.value; kind.place (needs in); kind.value.name (named); kind.place.value.name (in) |
| remove | thing; thing.source (in) |
| change | thing.value (values); thing.attribute.value.set (attrs); thing.value.amount (scale: a bit bigger); thing.attribute.amount.more / .less (number: add 2 seats to table 1) |
| place | thing.place (in); thing.direction (dir); thing.direction.amount (scale) |
| connect, group, take apart, pick | thing.target; thing.group; thing; thing |
| deselect, undo, redo | none ("deselect everything", "undo that", "redo that"); undo number (textual) |
| ask | topic.thing.what (attrs); thing.where (in); thing.count; place.what (in) |
| copy, send, save, load | thing; thing, thing.recipient; name; thing |

**Read back by this world's own grammar** (`tests/w.lang.en.templates.test.mjs`): every template, realised with two
sets of sample fillers (68 sentences), is read by the frames (the reference frame reader `frameReader` in
`tools/lib/lang-en.mjs`: the frames a general world of things meets, and the template's own `needs`; priority, then
literal words, then fewer captured words, the library's order) to the same act, mode and roles, through the role maps
and `w.lang.en.mode_map` (PSys2's group/apart is the act take apart, pick/none is deselect); a kind's noun phrase is
read by this world's productions with k.words ("3 red tables": kind table, value red). What the frames cannot read,
the templates do not say: 28 of the 56 roles of k.actions have no template (make.part, make.material, change.old
value, change.replacement outside the avatar's and a chart's frames, place.source, connect.tool, the target, group
and criterion of group, pick.source and other, ask.other, copy.number, send.means and format, undo.state,
save.format, deselect.thing...): each needs a frame first. Found on the way and fixed (block 22:30): "Add a seat to table 1" (acts.change.add1 has a determiner before the
attribute), "take the tables apart" (the template now says it so: the particle shift and acts.apart.2's priority), "red
house" (a modifier before its noun, see the next section).

## Composition: discourse templates per move and register (blocks 14:45 item 2, 15:00 item 4, 17:05)

`w.lang.en.discourse` gives sentences that make a rhetorical move (`move`, a move of k.genres: "introduce topic",
"compare", "surprising fact", "give example", "raise a question", "conclude", "transition"; for stories "set the
scene", "introduce character", "state goal", "complicate", "attempt", "turning point", "resolve", "evaluate", "end";
and the moves of each genre: "indicate a gap", "state thesis", "rebut", "state takeaway", "report problem", "next
step"...) in a register of k.genres (`register`: scientific, presentation, essay, narrative, report). Several
templates of one move and register are alternatives for a composer (std.compose) to choose among. `text` is in the
library's notation; `slot` lists its slots, each a `w.lang.en.slot` that says what fills it: `fact` a clause without
its stop, `question` an indirect question ("why an octopus has three hearts"), `value` and `usual` a value with its
unit, `thing` and `other` noun phrases with their determiner, `goal`, `attempt`, `overcome` verb phrases in the
base form; the story slots are elements of k.story (`element`: setting, protagonist, goal, target, obstacle,
attempt, helper, means, resolution). Examples:

| move | scientific | presentation | narrative |
| --- | --- | --- | --- |
| surprising fact | The {attribute} of {thing} is {value}, far outside the usual range for {kind:num=pl} ({usual}). | Did you know that {fact}? | And then, to everyone's surprise, it turned out that {fact}. |
| raise a question | This raises the question of {question}. | Have you ever wondered {question}? | Nobody could say {question}. |
| transition | The next section turns to {part}. | Now let us move on to {part}. | But that was not the end of it. |

Counts: 116 templates (scientific 30, presentation 21, essay 23, narrative 26, report 16), 43 moves, 35 slots;
written by `tools/lang-en-discourse.mjs` from one table (hand-written, CC0). Checked (`tests/w.lang.en.templates.test.mjs`):
moves and registers are those of k.genres (read from its facts); every slot is declared and used, a story slot names an element of k.story; coverage:
the seven moves the reviewer named in all five registers, the story moves in the narrative register, and, with
k.genres, every move every genre uses (its steps and `also_move`) in that genre's register; the words outside the
slots keep the register (its persons by the pronouns' person and number, no direct question where the register
has none, no contraction where it has none, no present verb in a narrative), and a sentence filled with sample
fillers is not longer than the register's `sentence_max`.

## Alternations: variants back to the canonical form (reviewer 21:55; the library's Q54 item 2)

Shard `alternations` (`tools/lang-en-alternations.mjs`), read by the library's `normalise` / `alternationsOf`
(sopworld 0.75): `w.lang.en.alternation name= n= family= from= to= mode=`, a rule over a whole sentence that brings a
variant back to the form a frame is written in, so the frames need not list their variants. `from` / `to` are the
library's patterns (words; `{x}` a span of one word or more, shortest first; `{x:base}` the base of a span's first
word); the library's `[a|b]` is not used (hard rule 3): each alternative is a fact of its own. `n` is the order they are
tried in (the first whose pattern covers the whole sentence; to a fixpoint, at most 6 steps): specific before general.

**Established term** (block 05:25): an alternation is a transformation in Harris's sense (1957, Co-occurrence and
transformation in linguistic structure, *Language* 33, 283-340: a mapping from one sentence form to another under
which the co-occurrence restrictions between words found in one also hold in the other, as in active and passive).
Where this model differs: the rules are directed (from a variant to the one form the frames are written in, never
back), work on spans of words rather than on sentence forms of word classes, and some are restricted by word (the
passive one participle at a time).

| family (parent) | rules | example |
|---|---|---|
| polite word, ability question, desire, suggestion, sequence lead (request wrapper) | please, could / can / would / will you, I want you to, I'd like to, let's, now | can you please draw a cat -> draw a cat (request) |
| question vs command (question form) | tell me / do you know / I want to know / I wonder + wh, + if / whether | tell me where the cat is -> where is the cat |
| embedded question (question form) | the copula or does back before the subject | what colour the car is -> what colour is the car |
| wh in situ (question form) | the question word back to the front | a cow makes what sound -> what sound does a cow make |
| passive (voice) | one rule per participle of 24 common verbs (a span for the verb would read "the cat is sitting by the door" as a passive) | the mouse was chased by the cat -> the cat chase the mouse |
| dative shift (argument order) | 9 verbs with to, 10 with for, the one who gets it a pronoun (me, us, them): the frames write it after to (send table 2 to the diagram) | draw me a sheep -> draw a sheep for me |
| ellipsis (context) | and, also, too, as well, the same for, what about, how about | what about the tree? -> the tree (ellipsis) |

`w.lang.en.alternation_family` gives the families and the family above each (up to `alternation`): the up edges of a
construction for the library's cousins. `w.lang.en.alternation_case`: 35 test sentences with their canonical form,
the rules applied in order and the mode; `tests/w.lang.en.alternations.test.mjs` checks them with the
library's own `normalise` (the pin, 0.113.0; one reader, no copy in the tests).
Of the 352 frame examples, 17 are changed by an alternation ("Pastel colours please.", "Draw me a nice picture.",
"Tell me how many houses there are."): they are the variants the second worker marks.
Not covered: double objects with a noun recipient ("give the dog the ball": two spans side by side cannot be told
apart), tell and show with me (they ask: "tell me the capital of Japan"), plural have in embedded questions (the
canonical form ends in have and would match its own rule), would you mind + -ing.
## Variants, skipped words, removal (block "21:05" items 2 and 5)

- **`w.lang.en.variant`** (shard `variants`, by `tools/lang-en-variants.mjs`, by rule from the frames' parts): the
  frames that are variants a general alternation of the library will cover, marked and not deleted; `alternation`
  names a family of the alternation rules (`w.lang.en.alternation_family`, shard `alternations`): 45 of 352 frames
  (request wrapper 17: "I want the bars green", "can you tell me what continent Egypt is in"; passive 3: "I want
  France and Spain highlighted"; verb ellipsis 27, a family added here under context: no verb, "House huge.",
  "Legend off."; dative shift 0: every "draw me ..." frame has the oblique pronoun as an optional part, so the frame
  is already canonical). 39 of them name `canonical` frames (same act and mode, no alternation, every role of the
  variant). A question with its wh-word in front is canonical (wh in situ is the variant, as the alternation rules
  say). Not variants by rule: a naming participle ("a guest called Ann" is a reduced relative), "I don't want pears"
  (a removal: the negation changes the act), a role followed by a determiner ("Bold the second paragraph": the value
  acts as the verb), a catch-all frame of the rest.
- **`w.lang.en.skip`** (shard `hand-request`): the words a request skips, by class: politeness (please, pls, plz,
  kindly, thank you, thanks), desire (want, wanna, like, love, wish, need), filler (also, now, just, too, very,
  really, then, um, uh, er, hmm, hey, well, ok, okay, so, actually, maybe), conjunction (and between two things of one
  role), copula (be, being, been: also forms of `w.lang.en.copula` now, with am), reflexive (yourself, myself,
  ourselves, yourselves, urself), request_preposition (of, on, to, for, with: only for a reader that fills the parts of
  a thing and has no role marked by them).
- **Removal**: `w.lang.en.neg means=removal` text without, lose, minus, no (a house without a door, lose the hat, ten
  minus two, no hat); not and never stay negations. `if` is a joiner of a condition (`kind=condition`, no cut).
- The named add with a place verb ("Put a guest named Maria at table 1.", block "20:15") is the fourth worker's
  `acts.make.name.place.p` in `hand-frames` (585afaf). Tests: `tests/w.lang.en.abstraction.test.mjs`.

## Every frame reads its own example (block 22:30)

`tests/w.lang.en.frames.test.mjs`, with the reference reader of tools/lib/lang-en.mjs, in two passes: the frame alone
reads its example (a host lexicon it names takes any one to three words; what each took is the lexicon of the frame's
kind of world, `needs`), then in its world (those lexicons, every frame the world meets) the best reading is the frame
or one with the same act, mode and roles. Of 357 frames 333 read their example best, 10 tie with a frame of the same
reading, 5 are listed with the reason (`KNOWN`; the test fails on a new failure and on a listed frame that passes):
the chart frames (orders among one set); the 9 local frames of PSys2 listed before are fixed (Q64, below).
What the test found and is fixed: in the reader, a `rest` capture takes at least one word; apostrophes inside a word
are dropped ("don't" is the frames' "dont"); the thing a frame acts on does not end in a preposition or a determiner;
a phrasal verb k.actions marks `separable` is also read with its particle back next to the verb ("take the tables
apart"); in the data, a verb group inside a word list (`V.place`, `V.make`, `V.set`: the hand-over's notation, kept
as a word) is now `act=` on the part (the verbs of that act join the words; the import does it); in the frames (at the
import, `FRAME_FIXES`, `FRAME_PRIORITY`): acts.change.add1's determiner, "give yourself", "what colours can I use",
"colour list please", acts.apart.2 over the direction frames; in the host lexicon (`hostLexicon`): a word with an
adjective sense right before a noun is its modifier, not the first noun of a compound ("red house"; "apple pie" still
compounds).
**Frame asks** (Q64, shard `role-frames`, `tools/lang-en-role-frames.mjs`): every one of the 57 roles of k.actions is
read by a general frame. The 29 that had none got one each, built from the role's markers in k.actions: "Draw a
house with a red door" (make.part), "Make a boat out of paper" (make.material), "Make a chart about sales"
(make.topic), "Change the car from red to blue" (change.old value), "Replace the hat with a crown"
(change.replacement), "Move the car towards the house", "Move the cat from the sofa to the bed", "Connect the boxes
using a line", "Group the cat with the dog", "Group the guests into teams", "Sort the guests by colour", "Cut the cake
into slices", "Detach the wheel from the car", "Cut the paper with scissors", "Pick a card from the deck", "Pick the
cat instead of the dog", "Compare the cat with the dog", "Copy the star to the corner", "Send the picture by email",
"Send the chart as a PDF", "Undo the colour change", "Undo 3 steps", "Go back to the start", "Save the drawing as
lunch", "Save the drawing to my files", "Load lunch from my files", "Redo the colour change", "Redo 2 steps",
"Deselect the circle". **The nine frames of PSys2's local file that did not read their own example are fixed and kept
here** (same names; the import leaves them out and PSys2 deletes its copies): acts.facts.ask.what.in.lead (the thing
before "is"), acts.media.m.pick.play.bare ("play" a word of its own), acts.media.m.pick.again, .play.kind.of and
.play.kind.bare (priority 15 over pick.play and make.melody.colon), acts.text.make.blank (13), .numbered and
.blank.at (14 over make.text), acts.facts.layer.on.want.pin (15 over pin.verb). The frames test now reads 370 of 386
examples best, 11 tie, and lists 5 (the chart frames).

## How each attribute is said (block 00:05 item 2)

`w.lang.en.phrasing` (shard `templates-phrasing`, `tools/lang-en-phrasing.mjs`): one sentence template per form of
`k.attributes.narration` (relation, measure, text: "the {key} of {thing} is {value}."; count: "{thing} has {value}
{key}."; kind: "{thing} is a {value}."; state: "{thing} is {key}." and "{thing} is not {key}.") and 53 templates for the
keys English says with a verb or a phrase of their own ("{thing} eats {value}.", "{thing} is made of {value}.", "{thing}
is the capital of {value}.", "{thing} says {value}.", "the young of {thing} is a {value}.", "{thing} has rings."); `of`
names the type where a key is said otherwise in other types (k.food kind, k.people does). Slots: {thing} the thing with
its determiner, {value} the value as said (with its unit), {key} the key's word.
Read back by five frames of the set `acts.state` (needs=state: a world that takes statements of facts, so no host reads
statements by them unless it asks): `acts.state.of`, `.count`, `.phrase`, `.verb`, `.is`, each reading a statement as the
act change (set) with thing, attribute and value; the verbs and phrases that say a key are the lexicons
`attribute.verb` and `attribute.phrase`, derived from the templates. Checked (`tests/w.lang.en.phrasing.test.mjs`): the
reviewer's four ("The capital of Chad is N'Djamena.", "A cow eats grass.", "A banana is yellow.", "A hen has 2 legs.")
and every narrated key that has a fact (190), said from its first fact in the catalog with its template and read back
to the same thing, value and attribute ("A peanut is a legume.", "A star is made of gas.", "A head is the part that
holds the brain.", "The elevation of Adrar Bou Nasser is 3340."). The defaults are plain ("The orbit years of Mars is
1.88."): a key gets a template of its own when a composition shows one reads badly.

## Inflection in std.morph notation (block "02:55")

The regular rules of English are published as facts in the library's std.morph notation, as w.lang.ro's are, so a
host needs no plural or past tense of its own. Written by `tools/lang-en-morph.mjs` (from WordNet 3.1's exception
lists; `npm run build` reruns it where the raw files are, and leaves the files as they are where they are not):

| file | what | size |
|---|---|---|
| `shards/morphology-classes.sop` | 40 paradigm classes and their 51 cells (`w.lang.en.class`, `w.lang.en.ending`), and 44 suffix rules for inflectBy (`w.lang.en.inflect` op third, past, ing, comparative, superlative) | 137 wires, 20.7 kB, CC0 |
| `shards/irregular-forms.sop` | 453 irregular forms in std.morph's shape (`w.lang.en.irregular_form lemma= form= <cell>`): the irregular verbs and adjectives of the catalog, the non-WordNet irregular plurals | 62.2 kB, CC0 |
| `shards/irregular-forms-wordnet.sop` | 303 irregular plurals and adjective variants from WordNet | 50.9 kB, WordNet-3.0 |
| `dictionary/<letter>.tsv` | 13,058 rows `lemma<TAB>class`: every noun (8,897), verb (3,343) and adjective (818) of k.words that is one lower-case word, and the one-word verbs of k.actions | 26 files, 203.5 kB, WordNet-3.0 |

- **Classes.** Nouns (`num` sg, pl): noun.s (cats), noun.es (boxes; potatoes where WordNet lists -oes), noun.ies
  (berries), noun.ves and noun.fe (leaves, knives: where WordNet lists the -ves plural; roofs stay noun.s),
  noun.same (nouns of plural form: arms, clothes, physics). Verbs (`vform` base, third, past, past_participle, ing):
  verb.s, verb.es (pushes, goes), verb.e (making, baked), verb.ee (agreed, agreeing; dyeing), verb.ie (dying),
  verb.ies (carried), verb.double.<letter> (stopped, stopping: one class per doubled letter, an alternation
  `p>pp@end` on the cells marked alt=yes), verb.ck (panicked). Adjectives (`degree` positive, comparative,
  superlative): adj.er, adj.e (larger), adj.ier (happier), adj.double.<letter> (bigger), and adj.more, compared with
  more and most, which has only the positive cell (526 of 818: a realiser says "more beautiful").
- **Which class.** By spelling, then by WordNet's exception lists where spelling cannot tell: a verb doubles when
  WordNet lists its doubled forms (prefer, preferred; visit is not listed: visited), or when it is one syllable of
  the shape stop, blog (WordNet lists nothing for some); a noun takes -ves or -oes when WordNet lists that plural
  and w.lang.en.irregular does not mark it for reading only (banjos are written, banjoes read). An adjective is
  compared with -er when it has one syllable, or two ending in -y, -le, -er, -ow, and is not a participle (cut,
  shut), a relational or participial adjective in WordNet (adj.pert, adj.ppl), or in the table of ungradable words.
- **Irregulars stay irregular facts.** `w.lang.en.irregular` (singular, plural) stays the home of the irregular
  plurals; their std.morph copies are derived (`from` names the fact). The irregular verbs (167 written in the
  tool, with variants: burned and burnt) and 30 compounds that inflect like them where WordNet has their forms
  (understand, overcome, misunderstand), be and have's third person, and nine adjectives (good, bad, far, ...).
  `variant=yes` marks a form for reading only: generation asks for the cell without it and gets the regular form
  (burned, antennas), analysis reads it (burnt: burn, past, variant). A verb that doubles a final -l in a longer
  word (travel, travelled: WordNet's doubled forms) has the undoubled forms as variants (traveled).
- **Round trip** (`tests/w.lang.en.morph.test.mjs`): every cell of every dictionary lemma generated and analysed back
  to its lemma and cell with the dictionary: 35,911 of 35,911 cells. `inflectBy` gives cats, boxes, berries, stopped,
  making, bigger; its suffix rules (the guess for a word the dictionary lacks) agree with the dictionary on the
  regular cells for plural 96.5 % (the misses are the 287 nouns of plural form and -ves, -oes), third 99.9 %, past
  95.5 % and ing 95.7 % (stress: audit, audited; British -ll-), comparative and superlative 99.6 %.
- Read with `morphOf(world, { types: { cls: 'w.lang.en.class', ending: 'w.lang.en.ending', irregular:
  'w.lang.en.irregular_form' } })` and `dictionary({ read: (letter) => fetchText(`w.lang.en/dictionary/${letter}.tsv`) })`.
- **Not covered.** be's am, are (no cell for the other persons); forms WordNet lists that are archaic or other
  spellings (dwelt is in, curst, gript, swopped are not: 36 reported by the tool); multi-word lemmas (the head is
  inflected by a host: manta rays); capitalised names.

## The class of each closed-class word (block "02:15")

`w.lang.en.closed text= class= from=` (shard `closed-classes`, 274 facts for 260 words, CC0) gives every closed-class
word of the word lists its class, for type signatures (a closed-class word stays literal; its class is the level a
signature backs off to): determiner, pronoun, preposition, conjunction, auxiliary, numeral, ordinal, adverb, particle,
interjection (the closed parts of speech of Universal Dependencies). A word of several classes has one fact per class
(that: determiner and pronoun); `from` names the lists it is in, which stay the home of the words. Derived by
`tools/lang-en-closed.mjs` (rerun by `npm run build`): a one-class list (det, pron, prep, aux, numeral, ...) gives its
class with exceptions by word (the numeral determiners are numerals, the locative pronoun there an adverb, the
question words by word); the marker lists (answers, corrections, leads, skipped words) class their single words from
one table. Open-class words in the lists get no class (45: want, think, like, lose, new, the attribute nouns colour,
size ...), and `tests/w.lang.en.closed.test.mjs` fails on a new word of a list that has neither.

## Arrangement phrases (block "04:40" item 4)

`w.lang.en.arrangement text= layout= relation= inverse= direction= diagram_layout=` (shard `hand-arrangements`, 62
phrases, CC0): how a request says things are to be arranged, joined to what can carry it out. "in a circle", "in a
ring", "clockwise" are the k.layouts arrangement `ring` and a w.diagram's `circular` layout; "in a grid", "in rows
and columns" `grid`; "in a row", "side by side" `row`; "in a column", "one above the other" `column`; "evenly",
"equally spaced" the k.layouts relation `evenly_spaced`; "left to right" `row` with `left_of` and the direction
left_to_right ("right to left": the same relation, `inverse=yes`); "top to bottom" `column` with `above`; "stacked",
"in a pyramid", "scattered", "at random", "in the corners", "around the centre", "one inside the other", "step by
step", "along the edge", "overlapping". A relation named with an arrangement is one that arrangement has in k.layouts;
every repeating arrangement and every diagram layout has a phrase (`tests/w.lang.en.arrangement.test.mjs`). The
library reads them as acts over a layout (its block 04:40); the diagram frames below take their directions.

## Diagram frames (block "06:00" item 1, PSys2's DIAG-GAP set)

Shard `diagram-frames` (`tools/lang-en-diagram-frames.mjs`, rerun by `npm run build`; 9 frames, 4 lexicons, 2 role maps,
CC0) reads the diagram wording PSys2 measured (psys2 training/eval/diagram-gap-2026-11-15.jsonl):

| wording | frame | reading |
|---|---|---|
| "Make the arrows go left to right.", "Lay the flow out left to right.", "The arrows should go from top to bottom.", "Flow from left to right." | acts.place.layout.go, .dir, .should, .flow | place/layout, thing (the arrows; "everything" when none is said), direction (an arrangement phrase) |
| "Call the arrow yes.", "Label the arrow from A to B no.", "Write yes on the arrow." | acts.change.label.edge, .edge.ends, .edge.on | change/set, attribute `label` (fixed), thing the edge ("arrow from a to b"), value |
| "Make a flowchart of making tea.", "A hierarchy of the parts of a car." | acts.make.diagram, .diagram.bare | make, kind (a kind of diagram), topic |
| "Make a timeline of the planets by distance.", "A timeline of the planets by distance from the sun." (block 07:45 item 1) | acts.make.diagram.order, .order.bare | make, kind, topic, criterion (an attribute that can order things) |
| "Draw the planets on a timeline.", "Draw the parts of a car as a tree.", "Put the parts of a car in a tree.", "Draw the planets in order of distance from the sun on a timeline." (block 07:45 item 2) | acts.make.diagram.after, .after.as, .after.of, .after.order | make, topic, kind after it (criterion where said) |

The lexicons are derived from their homes: `diagram.direction` is the arrangement phrases of a row or column in one
direction whose diagram layout is left_right or top_down (left to right, from top to bottom, downwards, across the page
...: a host maps the direction read to `diagram_layout`, a layout of k.diagrams' kinds); `diagram.edge` is w.diagram's
words for an edge (arrow, edge, line, link, connector); `diagram.kind` the names of k.diagrams' kinds and their words
(`core.word ... of=k.diagrams.kind.name` in k.diagrams: hierarchy and tree diagram are a tree, concept map a mind map,
organigram an org chart); `diagram.edge.from` the words before the ends of an edge (from, between). An edge named by
its ends is one thing: the frame's `link` and `ends` parts map to the thing (role maps), so the reading is "arrow from
a to b". A label said with "call" or "name" is a label only of an edge word: "Call yourself Robi" stays the avatar's
name. The verbless acts.make.diagram.bare has priority 4, under the statement frames (it took "The cycle of a week is
week." from acts.state.of until then). Checked by `tests/w.lang.en.diagram-frames.test.mjs`: 40 requests (26 of the gap set: its failing edits and kinds
with their neighbours, and the 5 arrangements PSys2 sent to another world, which w.lang.en's layout frame already
reads: a routing matter of the host; and 14 paraphrases) read back to the intended act and roles in a diagram world;
the frames test reads the 9 new examples best (395 frames: 379 best, 11 tie, 5 known).

**Order criterion** (block 07:45 item 1): k.actions gives make, place and group a role `criterion` (holds an
attribute; make: by, in order of, according to; place: in order of, according to, not "by", which says how far; group
also takes in order of). The lexicon `order.criterion` is derived from k.attributes: the names of the attributes that
hold a number, a size or a step of a scale (distance, size, weight, speed, temperature, price, legs ...) and their words
(`core.word ... of=k.attributes.attribute.name`: "distance from the sun", "how far", "how big", "number of legs"), so
a criterion read is an attribute, and `k.attributes.found` says where its values are (distance: k.space.body
distance_about; the planets by distance are k.space's `order` 1 to 8, a test checks it). Besides the two diagram frames,
the general frames acts.make.by ("Make a list of the planets by size.") and acts.place.order ("Line up the planets in
order of size.") in the shard role-frames; "sorted by", "ordered by", "ranked by" are words of the frames before the
marker by. The preposition "in order of" (rel by, role criterion) is in the shard hand-joins.

**The kind after the topic** (block 07:45 item 2). "In a tree" is also where a bird sits and how boxes already drawn
are laid out (acts.place.layout), so the kind is read after the topic only where nothing else can be meant: with on or
in, a kind whose words name no drawing of k.objects (lexicon `diagram.kind.only`, derived: every kind word but tree;
"draw a bird in a tree" stays a bird in a tree); with as or in the form of, any kind; after a verb of showing or
arranging, any kind when the topic names the nodes of a fill (lexicon `diagram.topic.head`: parts, steps, stages,
seasons, kinds, cities ..., each joined to the type of a `k.diagrams.fill`; "put the parts of a car in a tree" is a
tree, "put the boxes in a tree" and "put the nest of the bird in a tree" stay layouts); with an order criterion, any
kind ("put the planets in order of size on a timeline"). The topic of acts.make.diagram.after.of is three parts
(head, of, whole) mapped to the topic by role maps. A host that has the things named already drawn still sees the
layout reading next.

**Single-letter names** (block 07:45 item 3). "Connect A to C": a capital single letter after a word of the lexicon
`name.letter.after` (the verbs connect, join, link; from, to, between, and, or, with, called, named; w.diagram's
words for a node and an edge: box, node, step, arrow, line ...), or after another such name ("A, B and C"), is a name
and not the article. The reference reader (`tools/lib/lang-en.mjs`) lets only a role's words take a name: no
determiner, verb, word or lexicon part matches it, and a thing may end in it ("the box A"). The first word of a
sentence, "I", and a lower-case letter are left as they were ("connect a to c" is still the article). Not covered then: the kind after the topic and single-letter names (both
block 07:45, below).

## Lists, tasks, a shop and a wallet (reviewer 09:20, PSys2 Q18 K6)

Shard `list-frames` (`tools/lang-en-list-frames.mjs`, rerun by `npm run build`; 32 frames, 4 role maps, 1 lexicon),
every frame `needs=entries` (a world of lists of entries with a status, a quantity and a price: `w.list`, `w.tasks`),
bound to the acts of k.actions and the keys of those two schemas:

- lists: "add milk to my shopping list", "put bread on my list" (make: the entry is the thing made, the list's name
  its place: `place=shopping`; no name, the host's default list), "add to my shopping list" (make with nothing said:
  the host asks what), "take milk off my list", "remove milk from my list" (remove), "does my list have milk", "is
  homework on my list" (ask, mode has), "how long is my list", "how many things are on my list" (ask, mode count),
  "which lists do I have" (ask, mode all, thing list);
- tasks: "what is left to do", "what's still open" (ask, mode open: the entries whose `status` is open), "I (just)
  finished my reading", "my homework is done" (change: `status` done, a fixed argument), "I didn't finish my homework"
  (change in the mode not: status open, nothing ticked off), "did I finish my homework" (ask, mode done), "set a
  reminder to water the plants", "remind me to …" (make: a reminder, what it is about its topic), "I should call
  grandma" (make: a task, its topic; PSys2's real row r0590);
- shop: "how much do 3 pencils cost", "what is the price of a kite" (ask, mode price; the number stays in the thing,
  ask has no number role), "can I buy 3 pencils", "is 2 balls affordable" (ask, mode afford), "what is the change", "how
  much change do I get" (ask, mode change), "what is the change from 20 lei for a ball and a pencil", "change for 2
  balls with 5 lei" (ask, mode change: the money paid is the *other* amount, the one the price is taken from), "I want a
  puzzle", "I want 2 pencils" (make: on the shopping list; an article or a number must follow, so "I want to draw a
  cat" is no purchase), "I pay 10 lei", "I give the cashier 10 lei" (change in the mode less, attribute money, the
  amount paid: an event of the story, Q71 (1));
- wallet: "I start with 30 lei", "my wallet has 15 lei" (change: attribute money, the person's money in the story
  state), "my budget is 30 lei" (change: the list's `budget`, a planned limit), "how much money is left", "how
  much money do I have left after I buy 2 pencils" (ask, mode left).

A sum of money is a number and a word of the lexicon `money.unit` (derived from k.units: the everyday unit, its plural,
the name and the minor unit of each currency and their core.word texts: leu, lei, bani, dollars, cents, quid; codes and
signs left out), both mapped to one role ("10 lei"): "I pay 10" and "I have 3 apples" are no money. What the frames
set (`w.lang.en.fixed`: status, budget) are keys of w.list and w.tasks with values they allow (and money the key of
k.actions whose effects change what a person has), and what they
make or ask about (list, task, reminder) are words of their kinds; a test checks both.

**Several clauses** ("I want a puzzle and I pay 10 lei. What is the change?"): the reference reader's `clauseReader`
(tools/lib/lang-en.mjs) cuts a sentence at . ? ! ;, and inside one at a comma, at a joiner of this world that cuts (and,
then, also, but) or before a question word (`w.lang.en.wh`, for run-ons: "pay with 20 lei what is the change"); of the
ways to cut, the one whose clauses all read wins, most literal words first, then fewest captured words, then fewest
clauses (the frames' own order summed), so "a ball and a pencil" stays one thing. PSys2's real rows r0590, r0598,
r0599, r0622-r0627 read clause by clause with the right act and roles (9 of 9), and 35 of the sentences of its kids.shop
and kids.tasks worlds (`tests/w.lang.en.list-frames.test.mjs`). Not read: "Change from thirty lei, puzzle and 2 kites"
(thirty is no numeral of this world; a list after a comma). Known competition for a host that also has the frames of
other worlds: "I should tell you something" (a conversation, PSys2 Q18 K3) reads as a task here, and "how much is 7 plus
5" (arithmetic, K4) as a price; those frames must outrank these when they come (questions.md Q71).

## Questions in other word orders (reviewer 09:20, PSys2 Q18 K10)

Shard `question-frames` (`tools/lang-en-question-frames.mjs`; 7 frames, `needs=facts`, set acts.facts, the host lexicon
`attribute` as the facts frames use it): the number asked last ("April has how many days?", count.tail), "how many days
are in April?" (count.in, over the "how many people live in" frame), how far in a cycle ("Friday is how many days
away?", "how many days until Saturday?": the unit counted is the topic, the end the thing; std.time counts it, PSys2
Q18 L2), the members of a set ("which months are in summer?" as "name the months of spring": topic months, thing
summer), "name all the seasons of the year", "what are the seasons?". PSys2's real row r0244 "how many legs has a cow"
already reads with acts.facts.ask.count.does (ask count, topic legs, thing cow) once the host's attribute lexicon has
"legs" (k.attributes); `tests/w.lang.en.question-frames.test.mjs` reads it and the 10 kids.time sentences of K10 with
the lexicon taken from k.attributes and k.time (11 of 11).

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

## Time frames (block 09:20 K7, PSys2 Q18; real row r0586)

Shard `time-frames` (`tools/lang-en-time-frames.mjs`, in `npm run build`; 13 frames, 6 lexicons, 9 role maps, CC0):
statements of the date and the time as the act change in the mode set of the set acts.state (as statements of facts
are), the thing fixed (today, now) and the attribute fixed (weekday, date, month, season, time): "I should tell you,
today is Friday" (r0586; the telling words are an optional part), "today is the 5th of May", "today is May 5", "we are
in May", "it's spring", "the clock says half past 3", "it's quarter to four", "it is 5 o'clock", "it is noon"; and
questions (ask, mode what, the topic fixed): "what day is it", "what's the date", "what time is it", "what month is
it". The lexicons are derived from k.time (weekdays, months, seasons, the hours by number and name, the clock phrases of
the new shard clock-words) and w.lang.en's numerals (one to twelve); the parts of a time or a date map to the value
("half past 3"). "It is" reads a time only before a clock phrase, an hour with o'clock, am or pm, or noon and midnight
("it is red" is not a time). Checked by `tests/w.lang.en.time-frames.test.mjs` (15 requests, the values joined to
k.time). The frames carry no `mood` yet: the slot comes with w.person's schema change.

## Conversation frames (block 09:20 K3, PSys2 Q18)

Shard `talk-frames` (`tools/lang-en-talk-frames.mjs`, hand-written, CC0; 9 frames): a greeting, thanks and a goodbye
as the acts greet, thank and farewell of k.actions (family conversation; greet and farewell opposites), with the
person greeted or left ("hello Robi", "bye Robi", "say hello to Ana") and what the thanks are for ("thank you for the
drawing"); the questions about the assistant, "who are you" (ask who) and "how are you" (ask feeling), the thing fixed
to "yourself" as acts.ask.name does for "what is your name". Templates hello / thank you / goodbye in templates-acts.
What the speaker says and asks about themselves ("my name is Ana", "you can call me Ana", "who am I", "what is my
name") is w.person's shard person-frames, not repeated here; tests/w.lang.en.talk-frames.test.mjs reads "who am I?"
(r0148) through it once it is on the tree. Real rows: "hello" r0166, r0216, r0630; "thanks" r0588, r0591, r0594,
r0597, r0600, r0603, r0606, r0612.

## Arithmetic words and frames (shard arithmetic; reviewer 09:20, PSys2 Q18 K4)

`w.lang.en.calc`: 48 words of arithmetic, each with its kind (operator, comparison, aggregate, extreme, state), how it
is said (infix "3 plus 4", prefix "double 6", split "share 12 between 3" with its markers, relation "3 more than
Tom", question "how many more") and the core.calc builtin it names (add, sub, mul, div, eq, sum, argmax, argmin), a
factor for double, twice, triple, half, a quarter of, and the state a word asks for ("left", "now": now; "at first",
"to begin with": start). Nine frames of the act ask in the mode calc, `needs=calc` ("what is N op M", "what is double
N", "share N between M", "how many X does O have (left / at first)", "how many X are there altogether", "how many X
do A and B have in total", "who has the most X", "how many more X does A have than B"); their lexicons are drawn from
the words. Written by `tools/lang-en-arithmetic.mjs` (in `npm run build`); `tests/w.lang.en.arithmetic.test.mjs`
reads 19 requests back. The verbs of a story (has, gives, eats, buys) are k.actions actions with `holds=` / `money=`.

## Mood, and what a person says about themselves (block 10:55)

`w.lang.en.frame mood`: declarative (a statement the speaker makes: a host records it, it does not obey it),
interrogative (a question), imperative (a request); not said, a frame is a request (or a question for the act ask). The
shard `person-frames` (tools/lang-en-person-frames.mjs, 16 frames, `needs=person`) reads first-person statements (8,
mood declarative, set acts.state: "I have two kids", "I am 40", "I like cats, dogs and horses", "my name is Ana") and
questions about the speaker (8, mood interrogative: "what do you know about me", "how many kids do I have", "how old am
I") for the world schema w.person; its lexicons (person.relation, person.occupation) are derived from w.person and the
jobs of k.people. The reference reader returns the frame's `mood`.
