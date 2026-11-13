# Questions from the worker

The worker appends questions here. The reviewer answers in `worker-tasks.md`.

Format:

```
## Q<n> (task Tn, <date>)
Question: ...
Context: what was tried, what the options are.
Blocking: yes/no. If no: the choice taken meanwhile.
```

# Open

## Q27 (Q25 applied, 2026-11-13)
Question: the rule of the answer to Q25 (a hand-written object counts for its own name whatever WordNet lists) does
not reach `tablet`: that drawing is OpenMoji's, not hand-written. Should `tablet` count as drawn all the same?
Context: the rule is in `tools/coverage.mjs` (the sense check cannot take a hand-written object away from its name);
no hand-written object was affected by the sense check, so no number changed. `tablet` is still the one word with a
drawing of its name that counts as missing. Options: (a) keep it missing; (b) widen the rule: a drawing that was
looked at and shows a physical thing the word names counts, whoever drew it (then the `shown` column of
`sense-check.tsv` is needed only for the record); (c) draw a tablet computer by hand under the name `tablet` and
rename OpenMoji's (two drawings of one thing).
Blocking: no. Meanwhile: (a).

## Q28 (task R7.3 next to Round 8 item 3, 2026-11-13)
Question: should `k.colours` and `k.shapes` (R7.3, published now) stay worlds of their own next to the `k.values`
of Round 8 (colour names with RGB and synonyms, shape names), or be folded into it?
Context: R7.3 asks what is known about colours and shapes (family, light or dark, mixes, typical things; sides,
corners, round); Round 8 item 3 asks for the value words of a request. I gave `k.colours` no RGB so that two worlds
do not state two values for one name; the colour and shape names here are then the names that `k.values` can join
by name. Options: (a) keep both: `k.values` holds names, RGB and synonyms, `k.colours` and `k.shapes` what is known
about them; (b) `k.values` takes the types `colour`, `mix` and `shape` in, and these two worlds go; (c) add `rgb`
to `k.colours.colour` and let `k.values` refer to it.
Blocking: no. Meanwhile: (a). The second worker published `k.values` on the same reading while this was written:
every colour of `k.colours` joins a `k.values.colour` by name or word (a test), 28 of the 36 shapes a `k.values.shape`.

# Closed

Answered by the reviewer in `worker-tasks.md` (Q1 to Q21 in the blocks up to "2026-11-13 14:40").

## Q1 (task T2, 2026-11-13)
Question: may the catalog `version` be a content hash of `docs/worlds` instead of the git sha?
Context: PLAN.md §2 says `"version": "<git sha>"`, but `index.json` is committed, and a commit cannot contain its own
sha; writing the parent's sha would make every rebuild after a commit differ ("reruns give no diff" fails). A sha256 of
every file under `docs/worlds` (except `index.json` and `vocab.json`), 12 hex digits, is deterministic and changes exactly
when published content changes. Option b: the git sha only in a file written by a CI step after the commit.
Blocking: no. Meanwhile: the content hash.

## Q2 (task T4, 2026-11-13)
Question: what license do the hand-written cores (source `hand-core`) carry?
Context: the repository has no LICENSE file. The cores are written here, with no outside source.
Blocking: no. Meanwhile: CC0-1.0 in the shard headers, the catalog and `sources/hand-core/SOURCE.md`.

## Q3 (task T4, 2026-11-13)
Question: where does a world's schema version go? PLAN.md §2.6 says "the world's `version=` key in `core.module`", but
sopworld 0.14.0 does not read `version` on `core.module` and notes `unknown-attribute` in `world.warnings`.
Context: options: (a) a header comment `# version: 1` in `schema.sop` (read by build-catalog into the catalog);
(b) `core.version=1` on the module wire (an open `core.` key: no warning, but it is bookkeeping, not a declaration);
(c) ask sopworld to read `version=` on `core.module`.
Blocking: no. Meanwhile: (a).

## Q4 (task T4, 2026-11-13)
Question: is it acceptable that matrix ids in schemas are written fully qualified (`@k.commonsense.thing.name`)?
Context: a module loaded by `core.module … imports=` keeps its ids unchanged, while `core.use` prefixes them. With short
ids (`@t`, `@k1`) an application whose own matrix has `@t` and imports `k.objects` is refused (`duplicate-id`), and
sopworld then also reports a misleading "module k.objects imports k.commonsense, which is neither loaded nor in the
library". Fully qualified ids never clash; under `core.use` they become `k.commonsense.k.commonsense.thing.name`, which
is harmless. (The misleading message may be worth a note to the sopworld reviewer.)
Blocking: no. Meanwhile: fully qualified ids in every schema.

## Q5 (task T5, 2026-11-13)
Question: may a triangle and an arc carry an orientation key? Added `pointing` (triangle: up, down, left, right; up
when absent) and `opens` (arc: up, down, left, right; up when absent) as enum slots.
Context: with the box alone a triangle can only point one way (a roof) and an arc only curve one way; a fish tail
points left, a beak right, a rocket flame down; a smile opens up, a cup handle left. Other options: (a) draw every such
part as a polygon or line with points (more wires, no orientation key); (b) more shape names (`triangle_left`), which
would be a notation inside the value.
Blocking: no. Meanwhile: the two enum keys; absent means up.

## Q6 (task T5, 2026-11-13)
Question: for repeated parts (one wire per instance), is `name` unique per object (`left_window`, `right_window`) plus
an optional `kind=window` the right shape?
Context: identity is `of` + `name`, so two windows need two names. `kind` says what each one is; queries count by it
("how many windows": `where kind=window, mode=count` → 2). Option b: `name=window` for both and a third identity key
`n` (1, 2), required on every part.
Blocking: no. Meanwhile: unique names plus `kind` on repeated parts only.

## Q7 (task T5, 2026-11-13)
Question: `k.objects.point of=` is a reference to the part (`of=$k.objects.house.roof`, `kind=ref to=k.objects.part`),
because a part is named by two values (object and name). Is a reference fine here, or should a point carry `object=`
and `part=` atoms instead?
Context: references need the part in the same world (they are in the same shard); atoms would join by value as
everything else in the knowledge worlds does.
Blocking: no. Meanwhile: the reference.

## Q8 (task T5, 2026-11-13)
Question: should `k.objects.object` extend `k.commonsense.thing`?
Context: tried; merging is order-dependent in sopworld 0.14.0: a `k.objects.object name=house` told before a
`k.commonsense.thing name=house` merges them into one wire; told after, they stay two wires that both match
`k.commonsense.thing name=house`. So the two types are joined by the name value instead, and `k.objects` imports
`k.commonsense` so that the common sense comes with it. (Perhaps worth a note to the sopworld reviewer.)
Blocking: no. Meanwhile: no `extends`.

## Q9 (task R2.2, 2026-11-13)
Question: which terms do the `k.words` shards carry: the WordNet licence alone, or CC BY-SA 4.0 because the words were
chosen with a CC BY-SA list?
Context: the only clearly licensed 20,000-word frequency lists on GitHub are CC BY-SA (FrequencyWords from
OpenSubtitles; wordfreq's data; Wiktionary lists). The Google-derived lists (`first20hours/google-10000-english`) have
unclear terms and were not used. The list is used as a filter only: no line and no count of it is in a shard; every
fact is WordNet's. Option a: WordNet licence, with the list named in SOURCE.md and LICENSES.md. Option b: label the
shards CC-BY-SA-4.0 (WordNet's terms allow that).
Blocking: no. Meanwhile: (a), `# license: WordNet-3.0`, the list attributed in `sources/frequency-words/SOURCE.md`
and in the wordnet entry of LICENSES.md.

## Q10 (task R2.2, 2026-11-13)
Question: where should the words for a world's types and keys ("synonym", "meaning", "capital") point in `vocab.json`?
Context: build-catalog sends a schema `core.word` for a type or key to every shard of the world. That was right for 1
to 7 shards; for `k.words` (318 shards) the word "synonym" would tell a host to fetch all of them. Options: (a) such
words map to the world's schema path instead of shards (the host then knows the world is relevant and picks shards by
the other words of the message); (b) a separate `"worlds"` section in vocab.json; (c) no schema words in large worlds.
Blocking: no. Meanwhile: (c) for `k.words` only: its schema has no `core.word` wires.

## Q11 (task R2.2, 2026-11-13)
Question: is a string the right way to write a value of several words (`is_a="domestic animal"`), next to atoms for
single words (`is_a=canine`)?
Context: the slots say `kind=atom kind=string`. A query must then quote: `where: { is_a: '"domestic animal"' }`, and
answers come back as the quoted token. The other option, WordNet's own `domestic_animal`, would be an underscore
notation inside a value.
Blocking: no. Meanwhile: strings for several words.

## Q12 (task R2.6, 2026-11-13)
Question: how should the parts of a second drawing of an object (`k.objects.object name=house variant=noto`) be keyed,
so that "what are the parts of a house" still answers with the hand-written parts only?
Context: tried: the schema now has `variant` as an optional identity key on objects and on parts, and
`k.objects.part of=house variant=noto name=part1` stays a separate wire. But a query cannot ask for "no variant":
`{ type: 'k.objects.part', where: { of: 'house' }, seek: 'name', mode: 'list' }` then answers body, roof, …, part1, …
part16 as soon as both shards are loaded (the test ob-01 fails). Options: (a) the variant's parts name another
object value (`of="house noto"`, a small notation); (b) a default `variant=hand` on every hand-written object and
part (then every question must say which variant); (c) leave the 18 imported drawings out while a hand-written one
exists; (d) sopworld: a query condition for an absent key.
Blocking: no. Meanwhile: (c). Left out: dog, cat, bird, fish, butterfly, mountain, house, castle, train, bicycle,
rocket, sun, star, cloud, umbrella, snowman, ladder, chair.

## Q13 (after "more objects", 2026-11-13)
Question: is the size of `k.objects` acceptable: 39 MB of shards (326 shards), 9 MB of previews, `docs/worlds` 56 MB,
and `npm test` 4 minutes?
Context: an imported object costs about 160 wires and 19 kB, mostly its points as wires (one wire per point, about
115 bytes each). Options: (a) keep; (b) a smaller point budget per object (100 instead of 200 would roughly halve
it, with rougher outlines); (c) keep the previews out of the repository (generate them in CI); (d) sopworld: a
compact way to say a list of points, which rule 3 forbids today.
Blocking: no. Meanwhile: (a).

## Q14 (after "more objects", 2026-11-13)
Question: should the naming pass (R2.7) be done for all 1,265 OpenMoji and Mulberry objects, or only for a part?
Context: it took 6 batches (about 70 contact sheets) to look at the 811 Noto objects; 20% of their parts got a name.
The Mulberry drawings are outlines plus fills, so about half of their parts are outlines (`kind=detail`). The
tools are ready (`sources/openmoji/part-names.tsv`, `sources/mulberry/part-names.tsv`, `render-svg --label`); no
row is written yet. Options: (a) all, in batches of 100; (b) only the categories an application asks for first
(animals, vehicles, furniture); (c) mark outlines as detail by rule (black lines) and name only the fills.
Blocking: no. Meanwhile: nothing named for these two sources.

## Q15 (task R2.3, 2026-11-13)
Question: are Natural Earth's `ADMIN` names right as the identity of a country ("United States of America",
"Republic of Serbia", "United Republic of Tanzania"), with the short names as `core.word` facts?
Context: the short names of Natural Earth (`NAME`) are abbreviated ("Dem. Rep. Congo", "Bosnia and Herz.") and its
`NAME_EN` has "People's Republic of China". The short common names of mledoze/countries are better but ODbL; using
them as the identity would put ODbL names into the public-domain shards.
Blocking: no. Meanwhile: `ADMIN`.

## Q16 (task R3.2, 2026-11-13)
Question: should the 50 club football kits of Mulberry ("football kit Arsenal" … "football kit Wolves") stay as objects?
Context: each is a recognisable thing (a shirt and shorts in the club's colours) and survives the conversion, so the
rule of R3.2 (not a thing, or does not survive) does not exclude them. But they are 50 near-identical drawings named
after English clubs of one season, about 4% of the Mulberry objects, and of little use to a general application.
Options: (a) keep all; (b) keep only "football kit blank"; (c) keep one kit and name it "football kit".
Blocking: no. Meanwhile: (a), all kept; shirt and shorts are named where one number is clear.

## Q17 (task R3.3, 2026-11-13)
Question: is a plain name the right join from a fact to its drawing (`k.animals.animal name=ladybird
drawing="lady beetle"`), with no import of `k.objects`?
Context: "join by name, as before" works when the names are equal (`dog`). They often are not (`grape` / `grapes`,
`ladybird` / `"lady beetle"`, `Sun` / `sun`), and sometimes an object of the same name shows something else (`nail`,
the tin of `tuna`). So each core type has a key `drawing` holding the object's name. sopworld does not check it (a
test does: `tests/k.cores.test.mjs`). Options: (a) keep the name key; (b) `imports=k.objects` and a reference to the
object fact, which would dangle unless the object's shard is told too; (c) put the link on the `k.objects` side
(`k.objects.object name="lady beetle" shows=ladybird`), which needs the importers to read the cores.
Blocking: no. Meanwhile: (a).

## Q18 (task R3.3, 2026-11-13)
Question: how should a number that is only "about" be said?
Context: the task asks for moon counts "as about". SOP Lang has a value or no value; a value cannot be marked as
approximate without a notation inside it. Workaround: two keys on `k.space.body`: `moons` (exact: Earth 1, Mars 2)
and `moons_about` (Jupiter 95, Saturn 270, Uranus 28, Neptune 16), and the word "about" in the name of
`orbit_years`' description only. A host must know to read both keys. Options: (a) keep two keys; (b) one key plus a
boolean `moons_exact=false`; (c) sopworld: a standard way to mark a value as approximate.
Blocking: no. Meanwhile: (a).

## Q19 (task R3.3, 2026-11-13)
Question: should the cores say what an animal cannot do (a penguin cannot fly), and how?
Context: `can=fly` is a repeated key, as in `k.commonsense`; a missing value does not mean "cannot" (the type is
closed, but the fact is only incomplete), so "can a penguin fly" has no supported "no". The soft rule of
`k.commonsense` already reads a missing `can=fly` as "cannot fly", which is right for a fish and wrong for an animal
that is simply not listed. Options: (a) leave as is; (b) a second repeated key `cannot` for the well-known cases
(penguin, ostrich, emu, kiwi: fly); (c) booleans `flies`, `swims` on every animal.
Blocking: no. Meanwhile: (a).

## Q20 (task R4.2, 2026-11-13)
Question: is the list of "common things" right as built: without persons, places, body parts, rooms and scenes, and
with about 630 words taken out by a reading of the list?
Context: the rule asked (frequency list x WordNet hyponyms of physical object, living thing, food, artifact) keeps
much that is not a thing one draws: under "living thing" all persons (man, father, guy, friend: 2,298 words before
the 1,500th thing); under "physical object" all places (city, side, America); and WordNet has a noun for most given
names and verb forms (john = a toilet, sam = a missile, felt, spoke, stole). What `tools/coverage.mjs` does: (a) only
senses filed by WordNet under animals, artifacts, food, natural objects, plants or the top concepts, which drops
persons and places; (b) noun must be the main use (WordNet's tagged counts); (c) no proper names; (d)
`sources/coverage/not-things.tsv`: 695 words with a reason, chosen by reading the list: names (123), verb forms and
adjectives (103), general words and parts without a shape (about 285), rooms and scenes (70), rare WordNet words that
are frequent as something else (69), a few others. Body parts (hand, head, eye) are outside the four roots and so
not in the list, although `k.objects` has drawings of some. Options: (1) keep; (2) add persons that look different
(man, woman, baby, king, doctor) and body parts as two more lists; (3) a stricter mechanical rule and no reading
(the list then has names and verb forms in its first hundred).
Blocking: no. Meanwhile: (1).

## Q21 (task R4.4, 2026-11-13)
Question: how should a `core.word` say that its word is not the thing itself but a kind of it (`puppy` → the drawing
of `dog`), as opposed to a synonym (`couch` → `sofa`)?
Context: `core.word` has `text`, `means`, `of`. A host that draws "a puppy" with the dog drawing may want to know it
is only the kind. Tried: `core.word text=… means=dog of=k.objects.object.name as=kind` told to a fork of the world
is accepted by sopworld 0.15.0 with no warning, but no reader knows such a key and nothing checks its values, so I
did not publish a key of my own. Workaround: the id says it (`k.objects.wordnet.same.<word>`, `k.objects.wordnet.kind.<word>`) and the
shard lists the synonyms first. Options: (a) keep; (b) two shards (`words-same`, `words-kind`) so that the catalog
entry says it; (c) a type of `k.objects` for the link (`k.objects.drawn_by word=puppy object=dog as=kind`) instead of
`core.word`, which the vocabulary builder would then have to read; (d) sopworld: a standard key on `core.word`.
Blocking: no. Meanwhile: (a).

## Q22 (task R5.1, 2026-11-13)
Question: when the sense that the rule keeps for a common word is not what the word names first (WordNet's counts
keep `plate` as the base of baseball, `cake` as a block of soap, `lorry` as a horse-drawn wagon, `turtle` as a
sweater, `tablet` as a slab for an inscription), should the kept sense be changed by hand?
Context: the sense check found 29 name-matched drawings that show another sense than the one kept. In every one of
them the drawing shows the common meaning (a dinner plate, a baked cake, a truck, the animal, a tablet computer) and
the sense kept is the rarer one. By the rule of Round 5 the drawing keeps its name and the list entry counts as
missing, so `MISSING.md` now asks for a baseball plate and a horse-drawn lorry near its top. `bank`, `shell` and
`frame` are of this kind too (both senses common). Options: (a) keep: the entry is missing, and a drawing for the
sense kept gets another name (`"river bank"`), found through the `instead` column of `sense-check.tsv`; (b) a table
of sense overrides (word, WordNet sense, reason), read by `tools/coverage.mjs`, so that the list asks for the sense
the drawing shows: this is a second reading by a language model, as `not-things.tsv`; (c) keep the entry as drawn
when the drawing shows any physical sense of the word that WordNet has.
Blocking: no. Meanwhile: (a); in R5.3 an "other sense" word is drawn under another name only when the sense kept
is itself a common thing (river bank, artillery shell); the others are passed over and listed in the log.
Closed: answered (c) in worker-tasks.md, block "2026-11-13 17:25"; applied in the commit "Q22 (c)".

## Q23 (task R5.4, 2026-11-13)
Question: the frequency list has only 2,687 common things by the rule, not 3,000; and the part after the 1,500th
has not been read or looked at. Is a count over it wanted as it is, or should that part be read first?
Context: `sources/frequency-words/raw/en_50k.txt` has 50,000 words; the rule of `tools/coverage.mjs` keeps 2,687 of
them (`node tools/coverage.mjs --limit 3000` prints the numbers and writes nothing). For the words after the 1,500th:
`not-things.tsv` was written by reading about 2,200 candidates and has little past the 1,500th, so names, verb forms
and general words are still in that part; none of its name matches went through the sense check; its links are
counted by rule but not published and not looked at (the shards hold only the links of the 1,500). So the numbers
for the long list are an upper estimate. Options: (a) keep them as an estimate, labelled so; (b) read and
sense-check the tail (about 1,200 words, 73 name matches, about 350 links) in a later round; (c) a longer frequency
list, to reach 3,000.
Blocking: no. Meanwhile: (a).
Closed: accepted as an estimate in worker-tasks.md, block "2026-11-13 17:25"; the tail is not read.

## Q24 (Round 7 addendum, item 4, 2026-11-13)
Question: should `puddle` stand in by the pond (as published) or by the new lake drawing, as the task says ("puddle →
small lake")?
Context: there was no lake drawing; I drew one (`lake`, shard `scenery`): a lake with two mountains behind it and a
tree on the shore. Next to the word "puddle" it misleads; the Mulberry `pond` (an oval of water with two tufts of
reed) reads as a puddle much better. Both were looked at side by side. `k.scenes.thing name=puddle` says ground,
small, so a host draws it small either way. Options: (a) keep `puddle` → `pond`; (b) `puddle` → `lake` as written;
(c) a hand-written `puddle` object (an oval of water, nothing else).
Blocking: no. Meanwhile: (a).
Closed: answered "pond" in worker-tasks.md, block "2026-11-13 18:35"; puddle stays by the pond; a plain `lake` (water only) is drawn and the earlier one is `"mountain lake"`.

## Q25 (Q22 applied, 2026-11-13)
Question: `tablet` is the one common thing that still counts as missing although it has a drawing of its name: the
drawing is a tablet computer, and WordNet 3.1 has no such sense (slab for an inscription, pad of paper, cake of a
substance, pill). Should it count as drawn?
Context: the answer to Q22 is "any physical sense of the word that WordNet has", so by the rule it does not count,
and `MISSING.md` asks for a slab of stone. Options: (a) keep, as the rule says; (b) count a drawing as right when
it shows a physical meaning of the word that WordNet lacks only because it is newer than WordNet (one row in
`sense-check.tsv`, marked so); (c) draw a pill under the name `"tablet pill"` and leave the entry missing.
Blocking: no. Meanwhile: (a).
Closed: answered "yes" with a general rule in worker-tasks.md, block "2026-11-13 18:35": a hand-written object counts for its own name whatever WordNet lists; applied in `tools/coverage.mjs`. The `tablet` drawing is OpenMoji's, not hand-written: see Q27.

## Q26 (Round 7, order, 2026-11-13)
Question: the block "2026-11-13 17:40" asks for addendum 2 (`k.layouts`, anchors, what joins what) before
`k.feelings`; `k.feelings` is already published (the session that did it was given the order scenes, people,
feelings). Is anything in `k.feelings` to wait for addendum 2, or does addendum 2 simply come next?
Context: `k.feelings` joins only `k.faces` (expressions and variants); it uses no layout and no anchor. Not started:
addendum 2, R7.2 `k.actions`, R7.3 `k.colours` and `k.shapes`.
Blocking: no. Meanwhile: addendum 2 next, then R7.2 and R7.3.
Closed: answered "nothing waits" in worker-tasks.md, block "2026-11-13 18:35"; addendum 2 comes next.
