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

## Q35 (Round 11 item 2, first worker, 2026-11-13)
Question: the reusable worlds `w.*` need `std.schema` and `std.acts`, which the pinned sopworld 0.16.0 (1e18f1d)
does not have. May the whole repository move to the library's current release (0.26.0, 4c33e81), or should the
two builds stay side by side?
Context: AGENTS.md says "upgrade only when the reviewer says so". Done meanwhile: a second pinned build in
`tools/sopworld/w/` (0.26.0; VERSION with commit and sha256, checked by a test), used only by
`tools/lib/schemas.mjs` for `w.*`; the knowledge worlds are validated with 0.16.0 as before; `index.json` names
both (`sopworld`, `sopworld_schemas`). The sessions pass on 0.25.0 (01d29cd) and on 0.26.0 alike. Not tried:
validating the `k.*` worlds with 0.26.0. Options: (a) keep two builds; (b) upgrade everything to 0.26.0 after a
run of the whole suite on it; (c) wait for a library release the reviewer names.
Two things seen in the library while writing the sessions, for the library's session (not worked around in the
schemas; both seen again on 0.26.0): the act `make` accepts a thing without a `required` attribute
(`make kind=w.list.item` with no `text` is done, with no violation); and `undo` right after the act `remove` does
not bring the removed thing back but undoes the step before it (make a, make b, remove b, undo: a is gone, b
stays gone).
Blocking: no. Meanwhile: (a).

## Q38 (Round 11 item 4, first worker, 2026-11-14)
Question: the rules about kinds were asked for "in a k.commonsense rules shard a host can import". Shards hold
facts only (the validator refuses a matrix wire in a shard), and a host imports modules, not shards. May the rules
stay in the schema of `k.commonsense`, which now imports `k.animals` and `k.food`, or should they be a module of
their own (`k.commonsense.rules` or a world `k.rules`) that a host imports only when it wants them?
Context: done meanwhile: six rules and one new soft rule in `docs/worlds/k.commonsense/schema.sop` (version 3),
the facts they read in two shards (`lives`, `liquids`). The cost: a host that imports `k.commonsense` (and
`k.objects`, which imports it) now loads the schemas of k.animals and k.food too (no shards), and the rules run
on whatever animal and drink facts the host loads. Options: (a) keep them in the schema; (b) a module of rules per
world that reads other worlds (`k.commonsense.rules` with imports), loaded on request; (c) let the validator accept a
shard named `rules` that holds rules and patterns only.
Blocking: no. Meanwhile: (a).

## Q39 (Round 12, second worker, 2026-11-14)
Question: is the structure below the "language-free structure" for tests of `w.lang.en` (sentence -> expected
structure), until the library defines its own? (A second part, about a third pinned build for the grammar check, is
settled by Q35: the one build, 0.30.0, reads w.lang.en.)
Context: the block "01:00" asks for tests "as sentences -> expected structure (a language-free structure the library
will define with you: write it as a proposal in questions.md and in the library's format when it exists)". The library's
format exists in part: `parseText` gives trees whose nodes carry `rule` (the id of a `w.lang.en.rule`), and `nounPhrase`
reads a noun phrase as `{ det, num, ord, quant, mods, head, lemma, pp, parts }` with the categories named by the
grammar. Proposal: an expected structure is `{ construction, head lemma }` for a noun phrase (construction = the
`construction` of the rule at the root; lemma from `nounPhrase`), `{ construction }` for a question or a clause, and,
once frames are read, `{ act, roles: { <k.actions role>: <lemma of the head> } }` through `w.lang.en.role_map`. No
English word is in the structure except the lemmas, which come from `k.words`. `tests/w.lang.en.test.mjs` uses the first
two forms now (23 noun phrases, 4 questions).
For the library's session (seen while checking, not worked around here): its tokenizer drops commas, so the
coordination separator "," of `w.lang.en.coord.sep` is never read ("a sun, a cloud and a man" does not parse as a
list); and a production with a category twice cannot be a repeated `rhs` key (a fact keeps repeated values as a set),
which `w.lang.en` now avoids with helper categories (NP -> NP OFNP).
Blocking: no. Meanwhile: the proposal above.

## Q40 (Q34 item 4, second worker, 2026-11-14)
Question: may a slot take the enum of another slot by name (for example `enum_of=k.values.coloured.colour`), so that
the eleven basic colours are written once although the slots that hold them differ in key or flags?
Context: done meanwhile with what the language has: `k.values.coloured` declares the list once and the types whose
slot is the same (`colour`, many, optional: `k.food.food`, `k.space.body`) extend it, as `k.objects.part` and
`k.faces.part` now extend `k.drawing.part` (Q34 item 1) and three worlds extend `k.kinds.kind` (item 6). Inheritance
shares a whole slot: a slot that must be required (`k.drawing.part.colour`), take one value more (`any` in
`k.attributes.thing.colour`) or have another key (`k.values.colour.basic`, `k.attributes.drawn.drawn_colour`,
`k.colours.colour.family`) has to write the list again, so it is written five times instead of eight, and
`tests/shared-modules.test.mjs` keeps the five equal. A reference to a slot's enum is new syntax (a library question,
like the slot groups of Q34 item 2).
Blocking: no. Meanwhile: inheritance where the slot is the same, a test for the rest.

## Q42 (block "02:45" item 3, first worker, 2026-11-14)
Question: a derived wire (`derived=true`, `core.source="rule <id>"`) has the identity of its thing (`name`), so a host
that loads `k.commonsense/shards/derived` with the told shards gets one merged wire per thing, and `derived=true` and
the rule source then stand on a wire that also holds told values. Should the mark be per value instead?
Context: shards keep told and derived apart (separate wires, the told values left out of the derived shard; a test),
and tools that read shards see the difference. In a loaded world only the engine's provenance (`why`) tells a told
value from a derived one. Options: (a) keep `derived=true` on the wire (as asked) and say it means "some values of
this wire are derived"; (b) name the derived keys instead (`derived=at`, repeated), which survives a merge; (c) ask
the library for provenance of told cells by source (a told value from a shard whose wires say `derived=true` is shown
as derived by `why`).
Blocking: no. Meanwhile: (a), said in k.commonsense/WORLD.md and sources/rule/SOURCE.md.

## Q43 (block "06:55" item 3, first worker, 2026-11-14)
Question: three things the world schemas of item 3 need are only in sopworld releases after the pinned 0.30.0
(42b3456). May the build move to the library's current release (0.45.0, 80df521), or should these wait for the
move to 0.34+ that block 06:55 item 2 gives the second worker?
Context:
1. **A guest placed on a seat through its slot** (`place thing=<guest> at=<seat>`, block 06:55: "a guest is placed
   into a seat through the seat's slot") is 0.33.0. On 0.30 `place` sets only `x` or `at=<rel>:<ref>`, so the guest
   is seated with `change attr=seat`. The schema already has what 0.33 reads (`w.seating.guest.seat type=w.seating.seat`).
2. **Acts on the view itself** (`std.schema.view ... state=w.map.view`: "zoom in" with no thing; the state thing made
   on first use) are 0.37.0. 0.30 reads `state=` and ignores it, so the kind `w.map.view` also allows `make`, with
   at most one, and the acts name it (`thing=w.map.view`). On 0.37+ both forms work; `make` is then not needed and
   could be dropped (a host that makes it first and then says "zoom in" is refused by the limit, since the view
   makes `view_w_map` as a second one).
3. **Joins by name** (`type=k.faces.variant by=name`, `type=k.geo.country by=name`) are 0.34.0. Today a face part's
   `variant`, the face's colours and expression, and a map place's `name` are open names; the tests check the
   names their sessions use against the k.faces and k.geo shards. Even on 0.34 two joins do not fit as they are:
   a variant's identity is slot + name, so `by=name` would accept "round" of the ears for a head; and a map place
   is a country or a city, while `type=` names one type. Options: a join on several keys (`by=slot by=name`, with
   the slot taken from the kind), or a join to any of several types; both are library questions.
Also for the library (seen, not worked around): `copy` copies the key that puts a thing into another, so a copy of
a seated guest sits on the same seat; a deny "two guests are not on one seat" would then refuse every such copy, so
w.seating does not say it.
Checked meanwhile, in a scratch copy, not committed: every session of tests/w.schemas.test.mjs passes on 0.45.0,
including the two skipped on 0.30 (a guest placed at a seat; "zoom in"); the library's case corpus (55 cases) passes
on 0.45 with the new w.seating and w.timeline as it does with the published ones; and its 17 inline face and map
cases (grid.face.*, view.zoom.implicit) pass when they name w.face and w.map instead (kinds `w.face.<part>`, view
`view_w_map`), so the library can drop its inline copies.
Blocking: no. Meanwhile: the schemas are written for 0.30 and already carry what the later releases read
(`state=`, the slot a seat is placed through); the steps that need a later release are tests skipped with the
release named, and they run as soon as the build moves.

## Q44 (block "09:10", `k.procedures`, first worker, 2026-11-14): the format of methods, for the library's `std.plan`
Question: is the format below the one `std.plan` (library Round 29) reads? The library has no design note yet (its
questions.md and worker-tasks.md name only the round), so this is written for it to answer or amend.
Context: a **method** says how a goal is reached, as facts only (no rule, no function): `k.procedures`, a knowledge
world. Seven types, one home per fact, every value a plain name, number or binding name (no notation):
1. `k.procedures.method name= about= act= world= rank= example=`: `act` (one of the 16 acts of `k.actions`) is the
   goal's act; `world` (optional) a world schema the method acts in (`w.seating`): the method applies only when the
   live world is of that schema; `rank` (default 1) orders methods of one goal when more than one applies.
2. `k.procedures.goal method= role= from= by= value= kind= rel= anchor= needed= default=`: what the goal's role
   (a `k.actions` role of `act`: make: kind, number, place, value, part, material; place: thing, place ...) must be
   for the method to apply: `from` a knowledge type whose fact the filler names (by `name`, or the key `by`);
   `value` the filler itself (a named task is a goal `role=kind value="family photo"`); `kind` the filler's kind;
   `rel` the relation of a place (on, in, around); `anchor` an anchor kind of `k.layouts` the filler's kind has
   (seat, surface). `default` is used when the goal does not say the role; `needed=true`: the planner asks for it.
3. `k.procedures.binding method= name= goal= step= from= key= live= history= upto= value=`: a name the steps use,
   bound to exactly one source: the filler of a goal role (`goal=<role>`, or its default); what step n made
   (`step=n`; for an `ask` step, its answer rows); the facts of a knowledge type (`from=k.scenes.has`, as
   `std.know.fill from=`) that pass the binding's matches; the things of the live world (`live=<kind>`, or
   `live=any`); the acts done so far, oldest first (`history=true`: keys `act`, `thing`, `at`); the whole numbers
   1..n of another binding (`upto=<binding>`); a literal (`value=`). `key=` takes that key's values (many keys
   flattened) instead of the whole facts.
4. `k.procedures.match method= binding= key= value= equals= equals_key= present=`: a filter on a `from` or `live`
   binding: the key's value is `value`, or one of the values of the binding `equals` (of its key `equals_key`),
   compared by name and up the kind chain (`k.kinds` `is_a`; a `k.people` kind's `age`); `present=false`: the key
   is not said. Inside a step that repeats over a binding, that binding stands for its current value.
5. `k.procedures.step method= n= act= each= after= expand= optional= about=`: one act; `each=<binding>` repeats it
   for every value (none: the step is not done); `after` (many) the steps it comes after (none said: unordered);
   `expand=false`: done as the act itself, never by another method (needed where a step has the method's own goal,
   such as "make a doctor" inside the method for a person of a role); `optional=true`: the plan goes on without
   it when it cannot be done.
6. `k.procedures.arg method= step= role= attribute= binding= key= else_key= value= rel= of=`: one role of a step
   (a `k.actions` role of its act; for `value`, `attribute` names the attribute it sets): from a binding (its value,
   or its key `key`, or `else_key` where the fact does not say `key`) or a literal `value`; `rel` the relation of a
   place; `of=<binding>`: the value is a part or an anchor of that thing ("the seat of the swing": `value=seat
   of=swing rel=on`), found in `k.layouts.anchor`, `k.wearables.place` (for a person) or `k.objects.part`.
7. `k.procedures.condition method= n= step= when= fact= thing= other= attribute= value=`: `when=before` is a
   precondition (of the method: it applies only if; of a step: the step is done only if, else left out), `when=after`
   an effect (checked after the plan). `fact`: `exists` / `absent` (a thing of the binding `thing` is in the live
   world, or the binding has a value), `on`, `inside`, `grouped` (`thing` with `other`), `has` (`thing` says
   `attribute`, with `value` if given).
Kinds in args are plain names (`table`, `hat`); the live world's schema resolves them (`w.seating.table`,
`w.face.hat`), as it resolves a kind word. **Alternatives** are the methods of one goal (same act, goal facts that
all fit): the planner drops those whose `world` is another schema or whose preconditions fail, then takes the lowest
`rank`, then the first by name (deterministic); when none applies, the refusal names each one with its failing
condition, and a missing needed role becomes one question. **Decomposition**: a step is expanded when a method's goal
fits it (unless `expand=false`), to a depth of 3; a plan has at most 200 acts (the budget); each `each` is bounded by
its binding. The plan is applied as one `act([...])`, with `why` naming the method and the step. Things a plan makes
are named as the library names them (`swing1`, `person1`), so a test's expected step list is the acts in order:
`make kind=swing`, `make kind=person`, `place thing=person1 place=seat of=swing1 rel=on`.
Four points for the library to decide: (a) the map from a `k.actions` role to a `std.acts` argument (make: number ->
`amount`, value + attribute -> the attribute; place: place + rel + of -> `at` or `rel` and `ref`; connect: thing,
target -> `a`, `b`; group: thing, group -> `things`, `name`; "take apart" a group -> `ungroup`): here, as facts, or in
the library next to `w.lang.en.role_map`? (b) the keys of `history` and of an ask step's answer rows (`kind`,
`count`); (c) the order in which `of` is looked up (anchor, wearable place, drawing part); (d) whether "compared up
the kind chain" in matches is `std.know`'s job (here only a test oracle does it).
Blocking: no. Meanwhile: the world is written in this format; its tests expand each test goal with a reference
reader (`tools/lib/plan.mjs`, a test oracle that reads the facts, not a planner for hosts) and compare the act lists;
the format changes when the library answers.

## Q45 (block "09:10", `k.procedures`, first worker, 2026-11-14): three gaps the methods found in other worlds
Question: may these be closed as below, each in its own world?
Context: writing the methods as joins to other worlds showed three holes; none blocks a method, each is worked around.
1. **An unnamed part of an imported drawing has no mark.** 21,654 of 27,902 `k.objects.part` facts are called `part<n>`;
   7,734 of them carry `kind=detail` (a stroke or an outline by rule), the other 13,920 nothing, so nothing in the facts
   tells "part7" (no name) from "body" (a hand-written name). "Take apart" therefore uses only parts with a kind (not
   `detail`) or named by the model, and leaves the rest as the thing (the car's body and cabin), so the whole cannot be
   removed. Proposal: the imports write `kind=detail` (or a new `unnamed=true`) on every part they do not name; that
   rewrites the imported shards (the raw drawings must be fetched again).
2. **No chart schema.** "A chart of the things in the picture" is a `w.list` list of counts. Proposal: a world schema
   `w.chart` (a chart with a kind: bar, pie, line; series and points with label and value), when the library's chart
   view exists; the method then gets a second alternative with `world=w.chart`.
3. **"about" is no marker of `make`.** The report task fills the role `material` ("a report of what we did"); "a report
   about what we did" needs `about` as a marker of `make.material` (or a role `topic` for `make`) in `k.actions`, and the
   frame in `w.lang.en` (the second worker's world).
Blocking: no. Meanwhile: as said above for each; `k.procedures/WORLD.md` lists them under Known limits.

## Q46 (blocks "10:50" and "11:05", `k.motion`, first worker, 2026-11-14): the format of motion rules, for the library's `std.motion`
Question: is the format below the one `std.motion` reads (`[LIB]`, for the library's block "10:50 — std.motion")? The
library has no design note or release of `std.motion` yet (its worker-tasks.md names the block only), so this follows
the block's words (rules as data, `on <event> [when …]`, steps that set keys for a duration range, `repeat every`,
priorities, ease back, `per unit of <stream>` with a class table, the splitter a parameter) and is written for it to
accept or amend.
Context: `k.motion` (knowledge world, facts only) uses ten types, one home per fact, durations in milliseconds as pairs
`<name>_min`/`<name>_max` (k.units.measure says `millisecond`; the unit was added to k.units):
1. `k.motion.event name= about=` and `k.motion.field event= name= value=(many) about=`: what a host tells the face
   (`reply` with `outcome` and `text`) and what a rule makes (`spoken`).
2. `k.motion.layer name= priority= key=(many) about=`: the keys a layer may set; at each moment a key shows the value
   of the highest layer that sets it, the later rule within one layer, else the host's own value (the face itself).
3. `k.motion.rule name= layer= on= repeat_min= repeat_max= chance= during=(many) not_during=(many) until=(many) emits=`:
   exactly one of `on` and `repeat`; `repeat`: fires after a pause drawn from the range, counted from the end of its
   last run; `during`/`not_during`: layers that must or must not be running; `until`: events that cancel it (its keys
   ease back at once, its pending `emits` is dropped); `emits`: an event made when its steps are done (`spoken`).
4. `k.motion.when rule= key= of=event|state value=(many) feature= not=`: a field of the starting event, or a key of the
   state as shown when the rule would start; `feature` compares a feature of the knowledge fact the shown value names
   (here a k.faces variant's `feel`; "do not blink when the eyes are closed").
5. `k.motion.step rule= n= with= onset_min/max hold_min/max hold_until back_min/max per= splitter= key=`: steps in
   order of `n`, each after the previous has eased back, or together with step `with`; `hold_until=<event>`: the hold
   lasts until that event, then the hold range. `per=<field>`: a stream step: the field's text is split by the
   `splitter`, each unit sets `key` to the value its class has in the viseme table for its duration (no ramps), and
   the key is released after the last unit.
6. `k.motion.set rule= step= key= value= via=`: the values a step sets; `via`: what a host that only switches shows
   during the onset and the ease back.
7. `k.motion.viseme style= class= mouth=`, `k.motion.splitter name= fold= ignore_case= default=`, `k.motion.letters
   splitter= name= class= letter=(many) kind=space|digit|symbol min= max=`: the class table and the splitter.
Reading for a host that only switches: a value shows from the middle of its onset to the middle of its ease back (or
`via` during both). Order at one moment: an event first ends the holds waiting for it, then cancels what it cancels,
then starts the rules `on` it. The reference reader `tools/lib/motion.mjs` (a test oracle, `planMotion(motion,
{ events, seed, end, base, features }) -> { segments, changes, stateAt }`) does exactly this; its `changes` are the
block's `[{t, key, value}]`.
Points for the library to decide: (a) a stream step's unit splitter: here a fact (`k.motion.splitter` and groups by
letters and Unicode kinds); does `std.motion` take it as data, or as a named host function that the fact names?
(b) is `via` the library's business (a host that blends ignores it) or the host's? (c) the base under every layer:
the host's current face (here) or a value the rules give? (d) whether a cancelled step eases back from where it is
(here) or jumps; (e) timers of repeated rules: from the end of the last run (here) or from its start.
Blocking: no. Meanwhile: the world is written in this format, tested with the oracle; a script converts the facts if
the library amends it.

## Q47 (block "10:35", k.faces proportion rules, first worker, 2026-11-14): the canon lost; what next, if anything?
Question: the experiment kept the hand-placed output (it lost on the overlaps, the bytes and the lines). Should the
canon go further in one of the ways below, or stop here?
Context: `tools/faces-canon.mjs` moves and scales each slot's drawings from where the hand put them to where a canon
puts them (maps checked exact: the canon the drawing follows gives the shards byte for byte). The adult canon of the
block (eyes on the middle line, one eye apart, brows one eye above, nose halfway to the chin, mouth a third below the
nose) puts 40 of 114 moustache/mouth pairs and 37 of 152 nose/mouth pairs on top of each other (0 now): this cartoon
has big eyes high in the head and a long space under the nose, which the classical canon does not have. Sheets:
`faces-before.png` and `faces-after.png` (41 faces: presets, expressions on the woman, 20 random faces). findVariants,
the w.face sessions, k.feelings, k.wearables, k.people and the 424 catalog questions pass on both. Options: (a) stop:
the absolute output stays and the experiment tool stays for later (done); (b) publish the canon the style follows
(`k.faces.canon` facts read off the drawing, `plain as drawn`), useful to a host that draws new parts in proportion,
at +1.3 kB and no visible change; (c) a style drawn for the classical canon (child, adult and old faces as three
styles, or one style with per-age slot boxes), a drawing task of its own; (d) variants as parameters (primitive +
size, roundness, tilt, openness), item 2 of the block, which this experiment did not try: the anchors-and-scale maps
were enough to measure the canon, and redrawing 181 variants as parameters only pays if (c) is wanted.
Blocking: no. Meanwhile: (a).
## Q48 (block "06:55" item 2, second worker, 2026-11-14): a join by key that does not depend on load order
Question: may `drawing=` and the other joins to `k.objects` wait for a join check that does not refuse a fact told
before the wire it names (a check at the end of a load, by `world.check()`, or one that is open until the target's
facts are there), instead of being declared now with `type=k.objects.object by=name`?
Context: declared on the 10 `drawing` slots of 8 worlds, the joins held when the k.objects shards were told first
(a load of all of them gave no violation), but sopworld 0.52 checks a `by=` join when a fact is told, as soon as the
target type is declared. `k.objects` imports `k.commonsense`, which imports `k.animals` and `k.food`, so
`fullWorld('k.objects')` (and any host that loads a module's imports first) tells 400 animal and food facts before
any object, and each is refused ("must be the name of a k.objects.object wire"). A host that loads shards lazily
(by the words of a message) would be refused whenever a fact comes before the shard of its drawing. The join of a
stand-in inside k.objects cannot be declared at all while every shard must load alone.
Options: (a) the library checks `by=` joins after a load, or on request, and leaves them open while telling; (b) the
check is open until a fact of the target type with that key is told (a missing target is then a report, not a
refusal); (c) declare them and make every loader tell the target world's shards first (k.objects before its own
imports: a cycle in practice).
Blocking: no. Meanwhile: the joins are not declared; `tests/shared-modules.test.mjs` checks that every `drawing=` of
every world names an object (1,000+ joins, none missing), and docs/worlds/README.md says why.

## Q51 [LIB] (block "13:00" item 3, `w.lang.ro`, first worker, 2026-11-14): `analyse` misses every suffix with a diacritic when the world has folds
Question: may `analyse` look a form up in a suffix index keyed by the folded suffixes (fold(m, cell.suffix)), so that a
suffix with a diacritic is found, typed with or without it?
Context: `analyse` folds the form, then looks its endings up in `m.index`, whose keys are the cells' suffixes as
written. With the folds of `w.lang.ro` (ă > a, ș > s, ...) a form ending in -ă, -ează, -ește, -ăm, -ați is never
found: "desenează" is read only as the noun-like lemma "deseneaza". Case: round trip of the 2,904 cells of the 255
lemmas of `w.lang.ro` through the folds, 2,249 come back (exact spelling with folds switched off: 2,898); coverage of
PSys2's Romanian commands 92.4% through the folds against 99.5% in exact spelling; casual messages typed without
diacritics 92.2%. The library's own test language has no diacritic in a suffix, so its round-trip test did not see
it. The test `w.lang.ro: round trip through the folds` is marked todo with this number; the rest of the tests read
the world in exact spelling (`morphOf(world, { types: { ...types, fold: '<no such type>' } })`).
Blocking: no for the draft; yes for reading Romanian typed without diacritics. Meanwhile: as above.

## Q52 [LIB] (block "13:00" item 3, `w.lang.ro`, first worker, 2026-11-14): three things analysis cannot undo
Question: (a) may `analyse` also try the stem without undoing an alternation (an alternation that did not fire when
the form was made: the lemma already had its result)? (b) may an anchored alternation whose target has two letters
(o>oa@vowel, e>ea@vowel) be undone at the place the target starts (today the reverse looks at the stem's last
vowel, the a of "oa", and fails)? (c) may an alternation to nothing (d>@end) be refused at load, or undone only where
the dictionary has the lemma (today the reverse adds the letter to every stem)?
Context: `w.lang.ro` cases, all in exact spelling. (a) The class's list is applied only where it matches, but undone
everywhere: uriaș and englez (a.1, s>ș@end and d>z@end in
the masculine plural: the stem of "uriași" undone to "urias", of "englezi" to "engled"), îngroșa (v.a, s>ș@end in the 2nd person):
6 of 2,904 cells, listed in the test as known (Q52). The same made the oa>o of scoate unusable in the common verb class
(every verb with an o was undone to oa): it now lives only in the classes of such verbs. (b) and (c) are written
around: unanchored o>oa, e>ea and u>oa (undone at their last occurrence) and substitutions (d>s@end for the
participle deschis, n>i@end for pui) instead of deletions; they work for the lemmas of the draft, but a lemma with two
o's or e's would need the anchor.
Blocking: no. Meanwhile: the 6 cells are listed as known in the round-trip test.

## Q53 [LIB] (block "13:00" item 3, `w.lang.ro`, first worker, 2026-11-14): feature names, articles in templates, two forms of one cell
Question: (a) are the feature names of `w.lang.ro` the ones the library will use for every language (below)? (b) how
should a template realise an article or determiner that agrees with its noun ("am desenat o casă roșie": o, not un)?
(c) is a second irregular fact for one cell (este and e; the first is generated, both are analysed) the intended way
to give variants?
Context: (a) `num` sg pl; `case` nomacc gendat (pronouns, where Romanian tells them apart: nom acc gendat); `def` yes no;
`gender` m f n; `person` 1 2 3; `tense` inf imper pres subj part, plus cond and perf for the auxiliary avea (aș vrea,
am desenat); the conjunctive "să ..." is subj; the negative imperative is "nu" + inf. Close to the block 11:20
suggestion; voc, impf, perf (simple), pqp and ger are not used by the app's commands and are left out. (b) `realise`
takes a role's class from the dictionary; the articles are closed-class facts (`w.lang.ro.det`, form, lemma, gender,
num, case) with no dictionary row, so `{art@kind}` returns the lemma "un". Options: realise also reads closed-class
facts (a type and its keys named in the call), or a template part names a closed class ("{det:article@kind}"). The
draft's templates leave the article out ("am desenat casă roșie"). (c) Without it, "e" (is) could not be read.
Blocking: no. Meanwhile: the names above; no article in templates; variants as second irregular facts.

## Q49 (Q48 applied, second worker, 2026-11-14): a join made after some targets are loaded, before its own
Question: should a `by=` join also stay open when targets of its type are loaded but not the one it names, as the
answer to Q48 said ("stays open while its target's facts are not loaded")?
Context: on sopworld 0.63 the 10 `drawing` joins are declared and every load path of this repository passes
(`fullWorld` of k.objects, k.animals, k.scenes, k.people, k.wearables: 0 open joins). But 0.60 keeps a join open
only while no fact of the target type has the key at all: told after one object shard (cat) and before the shard of
its own drawing (owl), an animal is refused ("animal whose object is not loaded, after another object": false in a
three-line test). A host that loads object shards by the words of a message meets that order.
Options: (a) the library keeps a join open until a target with that value arrives, and `check()` reports what is
still open; (b) hosts tell the shard of a thing's drawing before the thing (the vocabulary gives the shard).
Blocking: no. Meanwhile: declared as asked; docs/worlds/README.md tells hosts the order; the second check stays.

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
Closed: answered "yes" in worker-tasks.md, block "2026-11-13 20:35": a thing counts as drawn when any drawing in the catalog carries its name, whatever the source. Applied in `tools/coverage.mjs` as the one rule (it takes in the rule of Q25); `tablet` counts: 680 of 1,500 drawn by name.

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
Closed: answered "keep both" in worker-tasks.md, block "2026-11-13 20:35": `k.values` holds the words and scales, `k.colours` and `k.shapes` the facts about them, joined by name; no fact in two places. Nothing to change.

## Q29 (Round 8 item 2, second worker, 2026-11-13)
Question: the usual colour was asked for 2,000 things; `k.attributes` has it for 256 (and `k.food` for its foods).
How should the rest be done?
Context: I labelled only where the colour is plain and not a matter of country or make (grass, a fire engine, a
zebra; not a car, a postbox, a pencil), and stopped where I was no longer sure. `docs/worlds/COVERAGE.md`: 249 of
the 1,500 common things have a usual colour by their name or through their drawing; 1,251 have none, and for many
of those none exists. Every drawing has the colours of its parts (`k.objects.part.colour`, 1,023 of 1,500), which
says how the thing is drawn, not what colour it usually is. Options: (a) keep "only where plain", and label the
things of the gap list that have one in a later pass; (b) take the main colour of the drawing as the usual colour,
marked as coming from the drawing (wrong for a car that happens to be drawn red); (c) also say "any colour" as a
fact for things that have no usual one (car, shirt, book), so that a missing value means "not looked at".
Blocking: no. Meanwhile: (a).
Closed: answered "two facts, never mixed" in worker-tasks.md, block "2026-11-13 21:55": `colour` stays only where plain; `k.attributes.drawn` holds `drawn_colour` computed from the drawing for 2,103 drawable things; `colour=any` on 116 things that come in any colour. Applied in the commit "Q29".

## Q30 (Round 8 item 5, second worker, 2026-11-13)
Question: `k.parts` holds WordNet's parts under WordNet's names and only for 541 of the 1,500 common things. Should
the common names and the missing things be added by a language model?
Context: WordNet names a part by its synset ("car door", "automobile engine", "car wheel"), so "door" does not
find the part of a car; a house gets rooms but no roof or wall (those belong to "building", further up than the
rule follows without bringing in an elevator for a doghouse); 959 common things have no part at all (dog: only
"flag"). Options: (a) leave `k.parts` as the WordNet import; (b) add a model-labelled layer (`named=model`, sampled
audit): three to six everyday parts for each of the 1,500 things, in plain words (car: wheel, door, engine,
window, seat), next to the WordNet facts; (c) only add plain-word synonyms for WordNet's part names as `core.word`.
Blocking: no. Meanwhile: (a).
Closed: answered "yes" in worker-tasks.md, block "2026-11-13 21:55": `plain` next to `has` (the last word of a part's name when WordNet says the part is a kind of it), and `k.parts.usual` (`named=model`) for 432 common things. Applied in the commit "Q30".

## Q31 (Round 9, block "2026-11-13 21:30": numbers with units, 2026-11-13)
Question: is one fact per numeric slot in `k.units` the right way to say the unit of a number
(`k.units.measure world=k.geo type=mountain key=elevation unit=metre`), or should the unit be said in each world,
or on every fact?
Context: SOP Lang has no unit on a value, and a unit inside the value or in the key name would be a notation. Tried
and published: the type `k.units.measure` (identity world, type, key; `unit`, or `counts` for a count, or
`ordinal=true`; `approximate=true` for `_about` keys), written by `tools/measures-core.mjs`, which reads the schemas
of `k.geo`, `k.animals`, `k.space`, `k.body` and refuses a numeric slot without an entry (70 slots). A host joins
by the slot. Options: (a) keep; (b) a `<key>_unit` key on every fact (repeats one value thousands of times);
(c) a type of each world (`k.geo.measure`), so that a world read alone knows its units; (d) sopworld: a unit on
`core.slot`, which today notes an unknown attribute.
Blocking: no. Meanwhile: (a). The worlds of the second worker (`k.attributes`, `k.parts`, `k.wearables`) are not
in the list yet.
Closed: answered "yes" in worker-tasks.md, block "2026-11-13 23:10": one `k.units.measure` fact per numeric slot, kept in `k.units`, now for every world (135 slots of 21 worlds; new keys `frame` for a position in a 0 to 100 frame and `plain` for the value of a number word); `tools/measures-core.mjs` refuses a number without a unit in any world. The scales of `k.values` are ranks (`ordinal=true`); `k.attributes` has one number (`wheels`).

## Q32 (Round 9 item 2, 2026-11-13)
Question: the size class of an animal is now said in two places: `k.scenes.thing size=` (every drawable thing)
and `k.animals.animal size=` (every animal, 179 of them with no drawing). Should one of them go?
Context: the item asks for the size class among the facts of `k.animals`; the answer to Q28 says "no fact in two
places". A test requires the two to agree where the drawing has the name of the animal (132 compared, all agree;
`tuna` differs on purpose: the thing of `k.scenes` is a tin of tuna). Options: (a) keep both with the test;
(b) `k.animals` has `size` only for animals without a `k.scenes.thing` (a host then looks in two places);
(c) `k.scenes.thing` drops the size of things that are animals.
Blocking: no. Meanwhile: (a).
Closed: answered "one home" in worker-tasks.md, block "2026-11-13 23:10": `k.animals.animal` has no `size`; `tools/scenes-core.mjs` adds a `k.scenes.thing` row for each of the 176 animals that had none (and `"crane bird"`, `"tuna fish"`, named by `thing=` on the animal); `k.commonsense.thing` drops its `size` too; a test forbids a second slot with the size or place classes in any world.

## Q33 (Round 10 item 0, second worker, 2026-11-13)
Question: where the PSys2 tab worlds and ours disagree, which value stays? And may two facts that our keys cannot hold be said?
Context: `docs/worlds/FROM-PSYS2.md` lists every disagreement; ours is kept everywhere. The ones that are more
than spelling: (1) **independent**, 14 countries: PSys2 (mledoze/countries 5.1.0, `independent`) says false for
Aruba, Åland, Curaçao, Guernsey, Greenland, Hong Kong, Isle of Man, Jersey, Macao, Sint Maarten and Taiwan, and
true for Cuba, Israel and Kazakhstan; ours (Natural Earth 5.1.2, derived from its `TYPE` column) says the
opposite for each. Ours looks wrong for Cuba, Israel and Kazakhstan at least. (2) **capital**: Burundi (PSys2
Gitega, ours Bujumbura: the capital moved in 2019), Kazakhstan (Astana; ours Nur-Sultan: renamed back in 2022),
Palau (Ngerulmud; ours Melekeok, the state it lies in); the other seven are spellings. (3) **population**:
United Kingdom 1,885,400 in PSys2 (country-json; plainly wrong) against 66,834,405. (4) **continent**: Cyprus
(PSys2 Europe, ours Asia); three sub-Antarctic territories (PSys2 Antarctica; ours Africa or North America).
(5) **animals**: the young of a rabbit (PSys2 bunny, ours kit); the covering of cow, horse, goat, donkey,
giraffe, zebra, deer and camel (PSys2 fur, ours hair).
Two facts PSys2 has cannot be said next to ours: "a square is a rhombus" (`k.shapes.shape.is_a` holds one
value, and a square is a rectangle) and "a year has 52 weeks" (`k.time.duration` has one count and one unit per
name, and a year is 12 months).
Options: (a) keep ours everywhere and leave the two facts out; (b) take the country list's `independent` and
the newer capitals (Gitega, Astana) over Natural Earth, keep the rest; (c) make `is_a` of a shape hold many, and
let a duration be told in several units (identity `name` + `unit`): both change published schemas.
Blocking: no. Meanwhile: (a); the demo keeps nothing of these (ours answers).


## Q34 (Round 10 item 4, second worker, 2026-11-13)
Question: which of these shared modules should be made, and where do they live (here, or in the library)?
Context: the library's reuse detector exists (`tools/reuse.mjs` of soplang-words-lib at `01d29cd`) and was run on
the 22 schemas of `docs/worlds`: 16 candidates (12 type shapes, 1 rule shape, 3 word overlaps); every world has
reuse 0 (no world uses a type of another: the joins are by name only). Its findings that hold up on reading, and
what reading the schemas adds (the detector compares types, not single slots or enums):
1. **Drawing primitives** (detector 1 and 6): `k.faces.point` is `k.objects.point` key for key;
   `k.faces.part` repeats ten keys of `k.objects.part` (shape, x, y, w, h, z, colour, rgb, pointing, opens).
   Proposal: one module `k.drawing` (part, point, the shape enum), imported by both.
2. **A box in a frame** (detector 8, 9, 10): x, y, w, h from 0 to 100 are declared nine times (`k.objects.part`,
   `.skeleton`, `k.faces.slot`, `.part`, `k.layouts.slot`, `.anchor`, `k.wearables.place`). Needs a way to
   share four slots between types: SOP Lang has no slot group that a type can take in; a library question.
3. **"Never the exact number and the approximate one"** (detector 2): the same `core.deny` rule in `k.body`,
   `k.space`, `k.values` (and stated in words in AGENTS.md rule 10 for every world). Proposal: one rule
   written once over a pair of keys; needs a rule over key names, a library question.
4. **The eleven basic colours**: the same enum of eleven values is written out in eight slots of seven worlds
   (`k.objects.part.colour`, `k.faces.part.colour`, `k.attributes.thing.colour`, `.drawn.drawn_colour`,
   `k.food.food.colour`, `k.space.body.colour`, `k.values.colour.basic`, `k.colours.colour.family`).
   Proposal: declared once in `k.values` and referred to (`kind=ref to=k.values.colour` or a shared enum).
5. **Provenance and joins as keys**: `named` (enum model) is declared 20 times in 14 worlds; `drawing` (the
   join to `k.objects`) 11 times in 8 worlds, each as a plain atom that only tests check. Proposal: `drawing`
   becomes `kind=ref to=k.objects.object` where the host loads `k.objects`; `named` a core key like
   `core.source` (a library question).
6. **Kind-of chains**: `is_a` in `k.words.sense`, `k.commonsense.thing`, `k.people.kind`, `k.shapes.shape`
   and `from` in `k.parts.inherited`: five chains, each followed by its own host code or test. Proposal: one
   `is_a` relation with one "follows upwards" rule in a shared module.
7. **What a thing can do**: `can` and `cannot` in `k.animals`, `k.attributes.thing`, `k.commonsense.thing`
   with the same "never both" rule in one of them. **Typical things of a value**: `thing` (many) in
   `k.colours.colour` and `k.shapes.shape`. **Name, about**: nine types.
Detector candidates that are chance (same number of keys, nothing shared): 3, 4, 5 (`k.actions.similar`,
`k.objects.stand_in`, `k.units.quantity`: a name and one other key), 7, 11, 12, 13.
Options: (a) do 1, 4 and 6 here now (they need nothing new from the library; 1 and 4 change published schemas of
both workers), ask the library for 2, 3 and 5; (b) wait for the library's `std.schema` format and do all in one
pass; (c) leave as is: the joins by name work and `k.attributes.same` says which names are one thing.
Blocking: no. Meanwhile: (c); nothing is refactored.


## Q36 (cause left by R11.1, second worker, 2026-11-14)
Question: may `k.words` take names of several words (manta ray, light year, top hat, small intestine, police officer)?
Context: the one-word names of the hand-written worlds now have their sense (734 names, the first WordNet sense
under the root of their world). About 170 names of several words do not: `k.words` keys a sense by `word`, an atom
(`LEMMA` in `tools/import/wordnet.mjs`), and its shards by the first two letters. WordNet has most of them as
lemmas with underscores (manta_ray, light_year, small_intestine). Taking them makes `word` a string for those
senses and needs a rule for the shard of a word with a space; hosts that look a word up by its text are unchanged.
Options: (a) take the multiword names of the cores only (about 170), `word` a quoted string; (b) also the multiword
lemmas of the frequent words (many thousands: phrasal nouns); (c) leave them out.
Blocking: no. Meanwhile: (c); the WORLD.md of each core keeps its own `about` where it has one.

## Q37 (Round 10 items 5 and 6, second worker, 2026-11-14)
Question: should the numbers and usage of a thing name the sense they are about, for the 70 names with two senses?
Context: `k.attributes.number` and `k.attributes.usage` are keyed by name, labelled for the everyday sense (turkey
the bird, crane the machine where a drawing is the machine, orange the fruit). `k.attributes.same` knows that these
names have several senses but cannot say which one a number belongs to. A key `sense` (the values of
`k.attributes.same.sense`) on those facts would make the join exact; it costs a second identity key (name, sense).
Options: (a) add `sense` to number and usage facts of clash names only; (b) to every fact of the two types; (c) leave as is.
Blocking: no. Meanwhile: (c); the log and WORLD.md say that the everyday sense is meant.

## Q41 (Q33 applied, second worker, 2026-11-14)
Question: what should `k.geo.country.independent` say for the four states that govern themselves without being
generally recognised (Taiwan, Kosovo, Somaliland, Northern Cyprus)?
Context: Q33 (b) is applied with one rule instead of a list: `independent` follows Natural Earth's `SOVEREIGNT` (the
country is its own sovereign) instead of its `TYPE`. That fixes Cuba, Israel, Kazakhstan (now true) and Aruba, Åland,
Curaçao, Guernsey, Greenland, Hong Kong, Isle of Man, Jersey, Macao, Sint Maarten (now false), and agrees with the
country list for every country it has, but for four: Natural Earth makes them their own sovereign while noting
another state's claim ("Claimed by China", "by Somalia", "by Cyprus") or the list does not call them independent
(Taiwan false, Kosovo null; Somaliland and Northern Cyprus are not in it). Before, Taiwan, Somaliland and Northern
Cyprus were true and Kosovo false. A boolean takes a side either way.
Options: (a) leave `independent` unsaid for the four (a host answers "not known"); (b) unsaid, plus a key that says
why (`recognition=limited`, or `claimed_by=<country>` from Natural Earth's note); (c) follow the country list
(Taiwan false, the other three unsaid); (d) follow Natural Earth (all four true).
Blocking: no. Meanwhile: (a); WORLD.md and the schema say so, and a test keeps the four unsaid.

## Q54 ([LIB] block 17:05, fourth worker, 2026-11-14): realising English templates with std.morph
Question: how should the library's `realise` give the English forms the w.lang.en templates ask for?
Context: `w.lang.en.template` (34 act templates) uses the library's notation. Two English rules are not cells of a
paradigm in std.morph's sense: (1) `{kind:num=pl}`: English nouns have no class in a dictionary; their plural is
w.lang.en's `inflect` rules plus irregulars (mice, sheep); (2) the article `a` takes its form from the next word
(`an apple`, `an hour`, `a unicorn`): `w.lang.en.det before=vowel|consonant` and `w.lang.en.onset begins= sound=`.
The reference realiser here (`realiseEn` in tools/lib/lang-en.mjs) does both; the library's `realise` returns the
lemma unchanged for a word its dictionary lacks ("add 3 house").
Options: (a) `realise` takes a `generate(lemma, feat)` hook, and the host passes w.lang.en's inflection; the article
is a post-step the language world declares (a form of a word chosen by the next word's sound, as facts); (b) w.lang.en
declares English nouns as `m.class` (s, es, y>ies, f>ves) with the class chosen by the ending, so `realise` needs no
dictionary row for a regular noun; (c) the host realises English itself.
Blocking: no. Meanwhile: (c) through `realiseEn`; the facts are written so (a) or (b) can read them.
