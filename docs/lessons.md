# Lessons: what each round taught about structuring knowledge for reuse

A few lines per item, appended by the workers (standing direction of 2026-11-14 00:40). Each says what was
learnt about making worlds that other worlds and hosts can combine, not what was done (that is in worker-log.md).

## Round 10 (second worker)

- **A world can carry facts of a type nobody declared, and nothing notices.** `k.attributes.same` (3,202 facts,
  the joins of R10.3) was published without its type in the schema: the schema change was lost between two
  rebases, and sopworld takes a fact of an unknown type in an open world without a word. The catalog then
  listed no export for it, so a host loading by the catalog could not find the joins at all. Fix: the type is
  declared, and the validator now refuses a fact whose type no schema declares. Lesson: a world's own
  vocabulary (its exports) is the join surface; check it mechanically, not by reading the commit.
- **Generated pages go stale silently** (R10.7): every page computed from the shards (COVERAGE, ASPECTS, JOINS)
  needs a test that recomputes it, or it is wrong after the next change of any other world.
- **Joins are rules over where a fact lives, not facts of a thing** (R10.3): the sense of a name came from the
  type and, for drawings, the group the source filed them in. Nothing in SOP Lang can refer to the shard a fact
  is in, so the rule lives in a tool and its output is facts; the facts must be regenerated when any world
  changes, which is why `npm run build` runs the tool.
- **A class next to a number should be computed, not labelled** (R10.5). `weight_class` and `speed_class` come from
  `weight_about` and `speed_about` by a threshold in the tool, so the two never disagree; only `price_class`, which
  has no number behind it, is labelled. The class values are steps of a `k.values` scale, so a comparative word
  ("heavier") reaches both the class and the number through one join (`k.attributes.found`).
- **Comparing needs one key for both sides** (R10.5). Once a thing had two keys for one scale (a size class and
  metres), a host that takes "the first key each thing has" compares unlike values. Lesson for hosts and for the
  catalog: a scale may be found under several keys, and a comparison must pick a key both things share.
- **A cheap mechanical check finds what reading does not** (R10.5): weight over the cube of the size flagged three
  wrong weights that a reading of 100 random rows had passed.
- **Join by value, not only by name** (R10.6). The usage facts take the very values of `k.scenes.scene` (season,
  time, weather) and of `k.people.kind.age`, so "which things fit this scene" is an equality of values across two
  worlds with no mapping table. SOP Lang cannot say that two slots share one enum; a test compares them.
- **A reverse relation must have one home** (R10.6). `k.people.role.uses` (role -> thing) and a new `used_by`
  (thing -> role) would say the same fact twice; the tool drops from `used_by` every pair the role already lists,
  and the aspect table reads `uses` backwards. Which direction is the home is a choice to write down.

- **A dropped fact needs a reason that can be checked** (hand-overs). R10.0 dropped every city within a quarter
  of a degree of ours as "a suburb or another spelling"; the demo reported 137 missing cities. Split by cause, the
  quarter degree held three different things: other spellings (a word for our city), districts and exonyms
  (left, listed), and separate cities 5 to 30 km away (taken). A rule that lumps cases hides a gap.
- **Some asked-for flags are joins that already exist** (hand-overs): "which slots of the face are face parts"
  is `k.layouts.slot.holds` = `k.body.part.name` with `part_of=face`. Answering with a test of the lookup, not a
  new key, keeps one fact in one place.
- **Verbs and frames are different layers** (hand-overs): "redo", "deselect", "export" are words of acts;
  "undo that change", "clear the selection", "give me" are frames and belong to the grammar world.
- **A sense for a name comes from the world that owns the name** (k.words and the cores). "Mars" has a god and a
  planet; the world `k.space` says which one it means, because its things lie under celestial body. Picking the
  first WordNet sense under the root of the owning type is a join from a world to the dictionary that needs no
  reading per word.
## Round 11 (first worker)

- **Item 2: a reusable world is a schema with words and nothing else** (`w.list`, `w.seating`, `w.timeline`).
  Everything that makes it act (make, change, undo, refusals with what is allowed) is the library's `std.acts`,
  the same for every world; so the schema stays data, and what it cannot say ("two guests are not on one
  seat", "`until` is not before `at`") is named in WORLD.md as needing a rule or function of the library, not
  written as a half-rule here. The line between this repository, the library and an application is: data that
  two applications could use / anything that computes / anything of one application or one user.
- **Found by name means a word for the world itself**, not only for its kinds: `core.word means=w.seating
  of=std.schema.world.name` puts "seating plan" in `vocab.json` with the schema's path. One vocabulary for facts
  and schemas lets a host take one lookup path; the price is that a common word ("table", "list") now also
  leads to a schema, and a host must tell a `schema.sop` path from a shard path.
- **Two builds of the engine can live side by side** when the newer one is pinned with its own VERSION and
  sha256 and used by one loader only (`tools/lib/schemas.mjs`); the catalog names both. Writing sessions as
  tests against the engine found two engine defects (a `required` slot not enforced by `make`; `undo` after
  `remove`): a reusable world is also a test case for the library (Q35).
- Not done and worth doing: `k.layouts` has layouts named `list` and `timeline`; a join from those layouts to
  the `w.*` schema of the same name would let a host draw what a user made.
- **Item 3: one name, two things, is fixed with a second name and a join, not by renaming.** The drawing `crane`
  stays the machine; the animal gets `"crane bird"` and says so with `drawing=` and `thing=`. The joins table
  keeps reporting the clash, which is right: a host that compares names in lower case must still be told. The
  rule that gives an animal its own place row had to learn a second trigger (drawn under the other name), so a
  rule over names needs to know about the drawings, not only about the sizes.
- **A drawing that carries its own background does not compose.** The iceberg with its sea and the seaweed with
  its water looked right alone and became blue tiles in the scenes that place them. A reusable drawing is the
  thing alone; the scene gives the ground and the water.
- **Hand drawing scales with a table and a checker, not with free SOP Lang:** one line per part, checked
  for the frame, the shape rules and the names of relations, made 50 drawings with no load error.
- **Before drawing a missing thing, look for it under the other names of the catalog** (item 3, part 2): three of
  the "missing" words had a drawing all along under a name that WordNet does not join (tram for trolley, nazar
  amulet for amulet, blusher for rouge). The gap was a missing join, not a missing drawing, and a hand link closed
  it in one line each. The cheap check is the tags and words of the imported drawings.
- **A drawing also needs a place and a size to be usable in a scene**; the test that every drawing has them (5%
  allowed) caught 159 new objects without. A new thing in one world is a row in two or three others.
- **Item 4: a rule over kinds turns one world's facts into another's** (an animal's habitat becomes its usual place,
  a drink becomes a liquid): 330 animals reach the soft rules of k.commonsense with no fact written for each. But
  the moment the rules reached real data, two old soft rules were wrong (a duck lives on a pond and flies; a frog
  lives in it and sits on the bank): rules written for a toy core must be re-read when a join feeds them.
- **What a rule derives is invisible to the tools that read shards** (the joins table, the coverage page): they see
  15 liquids, not 22, and no animal in k.commonsense. A report of what the catalog knows must say whether it counts
  told facts or also derived ones.
- **A module that holds rules over other worlds pulls their schemas in** (k.commonsense now imports k.animals and
  k.food, and with it k.objects does). Where such rules live is a design question of its own (Q38).


## Round 12 (second worker): `w.lang.en`, a grammar as a world

- **A grammar's notation is a language inside a value; plain productions say the same with wires.** The hand-over's
  rules (`rhs=DET? rhs=MOD* rhs="[all|every]"`) and frame patterns (`"L V.make D {thing:words}"`) carried EBNF and a
  capture syntax inside strings. Written as plain productions (an optional part is a second production, a repeated
  part a helper category, a set of words a category with word facts) and as one fact per frame part, they need no
  reader of their own, and the library's parser read them unchanged: the notation was never needed.
- **A repeated key is a set, so an order with repeats cannot be a repeated key.** `rhs=NP rhs=OF rhs=NP` loses its
  second NP when told (the library parsed "the legs of the crocodile" only through another rule). Order of distinct
  values survives; a repeat needs a helper (NP -> NP OFNP). A test now refuses a production that names a category twice.
- **Say in the world how a host reads it.** `w.lang.en.cat name=DET type=w.lang.en.det` lets a host build the
  library's options from facts instead of a hand-made map; the same world then serves the library's test and ours.
- **Joins of a grammar are by value, and the gaps show at once**: numerals against `k.values.number` agree; `every`
  is no `k.values` set word; 20 frame roles are PSys2's names, not `k.actions` role names. One test per join lists
  what does not meet, so the next step is a table, not a search.
- **What belongs to one application hides in a general hand-over**: tab flags, the "act" `own` (routing to a world's
  own reader), PSys2 module names as views. The views stay (they make unifying measurable); the rest is left out
  with its reason in a generated IMPORT.md, so the next import from the same source repeats the decision.
- **Joins found the missing words** (holes): checking that every marker of a `k.actions` role is a preposition of the
  grammar found 12 missing ones (close to, out of, using, instead of); checking that a spatial preposition names a
  `k.layouts` relation found left of, right of, in front of missing. A join test is also a coverage test.
- **A role name is not a role** (frames): PSys2's frames say `value` for a name ("save it as lunch") and for a format
  ("save as SVG"). A role map keyed by act and role, with an exception by frame and by what the part takes, joins
  the 233 frames to `k.actions` with 23 facts; the frames stay as written.
- **A dictionary's exception list mixes reading and writing**: WordNet's noun.exc gives mice and feet, but also
  antennae, bani (for ban) and cola (for colon). Kept for reading only where the plural is classical or foreign
  (`read_only=yes`), left out where the plural is a word of its own: one list, two directions, two decisions.

## After Round 11 (first worker): one build, order in time, derived facts, drawings

- **Q35: a second build hides changes of meaning, not of syntax.** Moving every world to 0.30.0 changed nothing in
  942 files of facts, but one key of a reusable world: `amount` on a list item had become an argument of the act
  `make` (how many to make), so "a litre" was refused. A key name of a reusable world shares a namespace with the
  arguments of the library's acts; a world validated by an older build than the acts it is driven by does not see
  that. One build, and a session per reusable world as a test, found it in one run.
- **Order in time is one type with a position and a successor, and one rule** (k.time version 2). Weekdays, months,
  seasons, parts of the day and hours all extend `k.time.ordered` (`cycle`, `n`, `next`), so "before" is one rule
  for every cycle (375 facts) and a host compares any two times of one cycle by one lookup. Two senses had to be
  kept apart: `next` is cyclic (after December comes January), "before" is inside one round as the cycle counts it
  (Friday is not before Monday). A cycle fact that says where the round starts is what makes the second answer honest.
- **A reverse relation was dropped for the one home**: the season's `after` (the season before) is `next` read
  backwards; keeping both would have let them disagree.
- **A summary that can be derived should be derived, not written**: the first and last month of a season in each
  hemisphere come from the months by four rules, so the 8 facts cannot disagree with the 24 values they summarise.
- **Identity decides what can be said**: with `name` alone as the identity of a duration, "a year is 52 weeks"
  could not stand next to "a year is 12 months". Making `name` and `unit` the identity let a span be told in
  several units, and the two PSys2 facts left out in Round 10 now match ours.

## Q34 (a) and Q33 (second worker): shared modules by inheritance

- **`extends` shares slots without touching a fact.** `k.objects.part` and `k.faces.part` extend `k.drawing.part`,
  three worlds extend `k.kinds.kind`, two extend `k.values.coloured`: the 100,000 facts of the drawings keep their
  types, a pattern on the parent type matches them all, and the slots are declared once. Before, "share a module"
  sounded like renaming types across every shard and tool; the language already had the cheap way.
- **Inheritance shares a whole slot, not a list.** A slot that must be required, or allows one value more, or has
  another key, cannot take the parent's enum; the basic colours are still written five times (were eight), kept
  equal by a test (Q40). The unit of sharing in SOP Lang is the slot; the thing worth sharing was often the value list.
- **A rule on a parent type writes onto the child's fact.** The `kind_of` that `k.kinds` derives for "square" lands
  on the `k.shapes.shape` wire of the square (the identity key is the same), so a host sees one thing with its chain,
  and one rule serves three worlds and the rules of k.commonsense (milk is a drink, so a liquid, so a kind of liquid).

## Q36 and Q37 (second worker): names of several words, and which sense a fact is about

- **An identity key that is only an atom quietly excludes a whole class of names.** `k.words.sense.word` was an
  atom, so 150 names of the hand-written worlds (manta ray, light year, police officer) had no definition and 45 of
  them were joined to no other world. Letting the key also be a string (as `name` already was in every core) cost
  hosts nothing and added 45 joins in one step. The cheap check: count the names of a type that its joins cannot reach.
- **A root per world is a good sense picker, but a dictionary files some things under abstract parents** (a galaxy is
  a collection, the solar system a system, a black hole a region, olive oil a lipid). Widening the root would pull
  in wrong senses; a few narrow roots, each read off the chain, fixed 8 of 10 misses without changing any other sense.
- **A join that cannot decide should say "unsure", and the fix is one key on the fact, not a smarter join.** 29
  numbers sat under `unsure` for every sense of their name (turkey: bird, food, country). The facts themselves knew
  which they meant (a turkey running 40 km/h); writing `sense=` on the 34 facts of names with several senses, and
  having the join read it, made the join exact without touching the 3,400 names that have one sense.
- **A wrong boolean is often the wrong column, not wrong rows** (Q33). Natural Earth's `TYPE` made 13 countries wrong
  in `independent`; its `SOVEREIGNT` agreed with the country list everywhere but for four states of limited
  recognition. One rule replaced a list of thirteen exceptions, and the rest is the honest residue: a boolean cannot
  say "disputed", so it is left unsaid and asked about.
- **Keep a fact in the shard of the licence it comes from.** Putting a second source on a public-domain wire looked
  harmless, but the catalog then listed the shard under ODbL terms. A wire of the same identity in the list's own
  shard says the same thing and merges when both are told.
- **A join of a relation word says both keys, not one** (during, Round 12). `first_is` was enough while every temporal
  preposition read the same two-key relation (before: earlier, later); the first relation with other keys (during:
  time, span) needed `second_is` too. Naming both keys costs one slot and lets a host read any relation the same way.


## Derived facts visible to tools (first worker, block "02:45" item 3)

- **Derived facts become visible by writing them as facts, marked** (item 3). A build step runs each module's rules
  over its told facts and writes what they make, one wire per thing and rule, `derived=true`, the rule as source.
  Loaded with the rules, the wire is the rule's own conclusion, so the shard and the rules never disagree and
  nothing is made twice. Three traps found on the way: a wire a rule made can later take told values (load order),
  so "made by a rule" must be checked value by value against the told shards, not by the wire's maker; a fact made
  only of identity keys (`k.time.before`) is a derived fact too, though it adds no value; and an identity-keyed
  derived wire merges with a told wire of the same name in a host, so a wire-level flag says "some of this is
  derived", not which values (the shards keep that apart).
- **The sense of a derived fact is the sense of what it was derived from**: the joins table filed the animals of
  k.commonsense as "unsure" until a derived wire took the sense of the one typed thing its rule reads. A rule's
  patterns are metadata a tool can use.

## Drawings redrawn, one file-name rule, rebasing generated files (first worker, block "02:45" items 4 and 5)

- **A drawing is weak when its parts belong to another thing's template.** The cougar was the four-legged template
  with round ears and a snout: a bear. What made each of the seven readable was one cue the thing alone has: the
  dark-tipped hanging tail of a big cat, growth lines round a hinge (not the radial ribs of a scallop), a fin
  along an eel's back, a stocking's lace top and seam, a cake slice's wedge and crust, a buggy's spoked wheels and
  hood, a harness's carabiner. Look for the cue before drawing the outline.
- **A rule every reader must follow is a rule a test reads from the documentation.** The picture of "crane bird"
  was found by every tool of this repository and missed by the reviewer's sheet; the rule existed only as code. Now
  `k.objects/WORLD.md` holds the one JavaScript line, and a test evaluates that line against every object, so the
  documented rule and the code cannot drift; the rule also accepts the quoted SOP token, the form a reader of the
  shards actually holds.
- **Two workers pushing generated files: take either side, rerun, test only what reads generated files, push at
  once.** The catalog's `version` is a hash of `docs/worlds`, so every commit of the other worker conflicts in
  `index.json`; a ten-minute full test run let main move three times before a push. Rebuilding, then the test files
  that read generated files (about 30 of 44), then pushing, and the full run afterwards on the pushed commit in a
  separate worktree, got the work in without skipping the full check. Two full builds side by side on this machine
  can kill a test process (SIGKILL): rerun before believing a failure.

## World schemas for the library's corpus and the demo (first worker, block "06:55" item 3)

- **The acting half of a knowledge world takes its kinds from the knowledge, not its value lists.** `w.face` has one
  kind per slot name of `k.faces`, and a part's variant, the face's colours and its expression are open names of
  k.faces facts; a test keeps the kinds equal to the slot names of the shards. One list in one place; the price is
  that a wrong variant is not refused until a join can check it, and a join by `name` alone is too weak where the
  knowledge's identity is two keys (a variant is slot + name: "round" is an ear and a head).
- **A mode is a key of the whole, not a change of its parts.** The expression is a key of the face drawn over the
  parts' own variants; the parts keep theirs, so leaving the mode or undoing it costs nothing. Writing the
  expression's variants into the parts (as an application's state did) loses what the user chose.
- **Write for the pinned build, carry what the next release reads, and test the rest as skipped steps naming the
  release.** `state=` on the view and the typed `seat` slot are read by 0.37 and 0.33 and ignored by 0.30; the steps
  that need them are tests skipped with the release named, and one scratch run on 0.45 showed every one passes. A
  schema is forward compatible when the newer construct is a key the older build ignores; the meanwhile (a `make` on
  the view's state, limited to one) is said where a later build makes it unneeded.
- **A deny over a reference holds from both sides.** "An event is inside its timeline" is written over the event's
  `timeline` reference; moving an end of the timeline past an event is refused as well as moving the event. No
  re-checking rule is needed: the engine evaluates a deny on every wire a change touches.
- **The first join shows a name with two meanings.** `clothes` is a colour on a k.faces preset and a slot of the style
  toon-head; copying a preset into a face key for key made a part of the colour. The face keeps the colour as its key
  and the part as the kind `w.face.clothes`, and says so.
- **A tool that describes kinds must follow inheritance.** The catalog listed no attributes for the parts of w.face
  (they inherit from `w.face.part`) until `describeSchema` followed `extends`; a shared parent is invisible to a
  reader that looks at a type's own slots.
- **Decide what `copy` keeps before writing a constraint on a container.** A copied guest keeps its seat, so "one
  guest per seat" would refuse every copy of a seated guest; the constraint waits for the library's answer on what a
  copy of a thing inside another keeps.

## k.procedures (first worker, block "09:10"): methods as knowledge

- **A method is a join over many worlds, and writing one finds holes no coverage report finds.** Taking a car apart
  needs to know which parts of its drawing have a name: nothing says so (an unnamed part is just `part7`); a chart
  needs a chart schema that does not exist; "a report about" needs a marker `make` does not have (Q45). Each hole was
  invisible while each world was checked on its own.
- **A name that is both a scene and a thing is decided by where it stands, not by the name.** Composing a farm made a
  pond, a field and a barn, and each was expanded again as the scene of that name. The rule that fixed it is general
  (a method is never used inside its own expansion), not a list of names that are only things.
- **Compare kinds one way.** Matching "a kind of the other, either way round" let `person` fit every role (a doctor is
  a person, so a person was taken for a doctor). The rule that holds everywhere: a fact's value takes a name that is it
  or a kind below it (what holds a person holds a man; a farm scene is not a wheat field).
- **An empty filler means two different things.** A role the goal did not say (how many, where) is left out of the
  step; a filler the knowledge should give and does not (no slot of the layout holds this kind) means the step cannot
  be done. Treating both the same either drops honest steps or makes empty ones ("place the man" with no place).
- **In a hierarchy, the goal's other roles must travel down.** The farmer of the farm (one, on the ground) became a
  person of a role, and the method for a role made "a farmer" with no number or place: every method whose step makes
  the goal's own thing must hand the goal's remaining roles to that act.
- **The same task, one method per world schema, chosen by the world.** "Set a table" is chairs and plates in a picture
  and a table with seats in a seating plan; "a report" is a timeline or a list. `world=` on the method keeps the
  knowledge free of "if this is a seating plan" logic, and adds alternatives without touching the others.
- **A small reference reader is the cheapest review of a format.** Expanding every scene, role, wearable, layout and
  labelled drawing (2,000 goals in 7 s) with a 330-line oracle found what the proposal had left open (is the history
  read before the plan or during it; "this or that" as a binding; "not this value") before the library writes the
  planner; those points went into Q44 instead of into the library's code.

## k.motion (first worker, blocks "10:50" and "11:05"): a face over time as knowledge

- **The drawing's conventions leak into the rules that use it.** The eyes of k.faces are one mirrored variant, so a
  glance to one side cannot be one variant: it is "looking out" for the eye on the viewer's left and "looking in" as
  `one_eye`. And every step that sets the eyes must also set the other eye, or a lower layer (a glance) shows through on
  it. A world that names another world's parts must know how those parts are drawn; a test now says it.
- **Priorities replace sequencing, but a hidden onset is a wasted measurement.** With the talking mouth above the
  expression's mouth, one rule held "until spoken" would show a sad mouth only after the text; but its measured onset
  would run invisibly under the talking. So the mouths start on the event `spoken`, the brows on `reply`: write a
  measured duration only where it can be seen.
- **A cited number belongs in a test that recomputes it.** The blink ranges are checked back to the source's means
  (17 a minute at rest, 26 in conversation, from the pause and the blink length), and a ten-minute seeded run gives
  16.4 and 24.4. Without that the range and the citation drift apart at the first retune.
- **A rule over text is a class table plus Unicode kinds, not lists per language**: eleven groups (letters by class,
  then space, digit, symbol, the rest as one default) with marks folded and case ignored cover any Latin-script text,
  and the speaking rate comes out at 184 words a minute against 164-214 measured in conversation.
- **Join by value, not by import**: k.motion names k.faces variants as values and does not import k.faces, so a host
  can animate a face of another source with the same rules; the names are checked by a test, and a missing unit
  (milliseconds) was caught by the measures test, not by reading.

## k.faces proportion canon (first worker, block "10:35"): measured, not switched

- **Before replacing hand numbers by rules, prove the rules can say the hand numbers.** The canon maps (anchor and
  scale per slot) first reproduced the existing shards byte for byte with the canon the drawing already follows; only
  then was a different canon a test of the canon and not of the maps.
- **A style is a canon of its own.** The cartoon's big eyes high in the head and long space under the nose are what
  makes it read as this style; the classical canon put moustaches and noses on the mouth in 40 and 37 pairs. A cheap
  mechanical check (does any pair of variants of two neighbouring slots overlap?) said it before anyone looked at the
  sheets, as the weight-over-size check did for the weights.
- **Rules that only generate the same output cost bytes and lines.** Shards for renderers must stay absolute; the rules
  would be added, not substituted, so they win only if they make the drawings better or let new parts be drawn in
  proportion. That is the question to ask before the experiment, not after.

## One planner, published canon, a language world (first worker, block "13:00")

- **A reference reader that is the same code as the library's is the best hand-over.** Swapping the 384-line oracle for
  std.plan changed no act list and no coverage number; the 252 motion plans compared equal. What remained local was
  the host's part: the chain of kinds as data, the keys a face shows, and checks of the facts themselves (a world's
  slots, a circle in the steps). A test of knowledge needs those, never a second planner.
- **Four decimals are knowledge, sixteen are a fit.** The canon read off the drawing came out as 30/68 of the head; the
  published fact is 0.4412, and the generator's own tolerance (parts within 0.01 of their box) absorbs the rest. Choose
  the precision by the output's rounding, then test byte-identity: a rounding rule that was tighter than the check it
  serves (1e-6 against 0.01) was the only thing that moved.
- **A language world's paradigm classes are found by the alternations, not the genders.** Most of the 44 classes are a
  parent plus one alternation (oa > o, a > ă, t > ț) on the cells it touches; inheritance with per-cell overrides kept
  each a few wires. Ordered, anchored alternations (0.53) covered carte > cărți and noapte > nopți with one list.
- **Measure the rules in both directions before writing data around a gap.** Generating looked right everywhere; the
  round trip through the library found two library limits at once (a folded form against unfolded suffixes: 22% of
  cells; alternations always undone: 6 cells), and one data error (oa > o in the common verb class undid every o).
  The gaps are questions with cases (Q51, Q52), the draft reads exact spelling meanwhile.
- **Gold by word type is cheap and good enough for coverage.** 335 forms annotated once (several lemmas where the set
  has several readings) measure 1,191 tokens and their casual variants by folding alignment; the tokenizer, not the
  morphology, was the first bug (\w in JavaScript is ASCII even with the u flag: diacritics split words).
- **Keep a language out of the vocabulary by its keys.** The catalog indexes w.* identity keys named text or ending;
  naming the closed classes' key `form` kept every Romanian word out of the English vocab.json with no special case.


## Block 17:05 (fourth worker): generation templates, discourse templates, typical ranges

- **A template is proven by reading it back, and the reading finds the grammar's own holes.** Writing 34 act
  templates against w.lang.en's frames showed two frames that do not read their own examples ("Add a seat to table
  1": no determiner before the attribute), a frame that steals another's sentence where both apply ("take the tables
  apart" read as moving them apart), and a noun compound that ties with an adjective reading ("red house"). Each
  became a template that avoids it plus a line in WORLD.md; none was found by the 351 frames' own tests.
- **Name a template's slots by the roles of the acts, not by the words.** With `{kind}`, `{thing}`, `{place}` the
  slots are k.actions roles, so the frame read back and the template compare role by role, and a sampler's frame
  fills the template with no table in between. What a filler looks like (a thing with its determiner, a place as
  relation and thing) is the one convention left to write down.
- **A rule of the language that is not a paradigm cell needs facts of its own**: the article a/an depends on the
  sound of the next word, whatever it is. Writing it as two facts (`before=vowel`) and a short onset list keeps it out
  of templates, and the question to the library is how a realiser applies such a rule in general (Q54).
- **Join by value to a world that is not published yet, and let the test switch.** The discourse templates name the
  moves of k.genres; the test read the draft's names until k.genres landed, then its facts and its genres' steps,
  with no change to the templates. Register rules (persons, questions, contractions, sentence length) are checked
  from k.genres's own register facts, so a new register is a fact there and a few templates here.
- **A typical range is a statistic of a population; say which population.** The catalog's interquartile ranges are
  the catalog's usual (11 mammals with a number make the mammal range 2-3 m). Marking `basis` (catalog, source, own)
  and the count on every range lets a host trust a sourced height and doubt a thin catalog range; the licence of the
  numbers follows the range into its own shard (country areas under ODbL).

## Q41, block 07:40 and block 06:55 (second worker): joins, inheritance, and what the engine checks

- **Neutral is a fact of its own, not a missing boolean** (Q41). `independent` unsaid told a host nothing; one key
  more (`recognition=limited`), set by a rule over the source's own fields and checked against the rule that leaves
  `independent` unsaid, says what is true and keeps both from drifting.
- **A dictionary join gives aliases, and its errors have causes** (Peking). The synonyms of a place's WordNet sense
  are its other names; the dry run found three wrong joins and each was a rule, not a row: "state" took US states,
  a sense whose other name is another place is that place (Zaire), a sense about a former state is not the place.
- **A vocabulary needs the kind of each word** (vocab-kinds.json): "back" is a river; a reader that cannot resolve
  rivers needs to know that before it fetches a shard. And the values that name things of other worlds (the typical
  things of a shape) are vocabulary too: "stop sign" reached no shape until they were.
- **Every tool that reads schema text reimplements inheritance, and each forgets it once** (slot groups). Dropping
  three redeclared `name` slots and sharing `named` broke four readers: derive, the plan reader (62 roles merged into
  one fact), ask-real and a test's `slotsOf` (first `extends` only). A reader of types should ask the engine
  (`world.schema(t)`), not the text.
- **A checked join makes load order part of the contract** (Q48, Q49). `drawing=` declared as a join held when the
  objects came first, but the module that owns the objects imports the worlds that point at them, and a lazy host
  loads by message. 0.60 defers the check until a target exists, which still refuses a reference told after some
  targets and before its own. Declare the join, and keep a test over all shards as the check that does not depend on
  order.
- **Priority is data only where parses really tie** (06:55 item 1). Parsing every construction's own examples found
  three ties out of 64 constructions; adding a priority everywhere would have been guessing.
- **A category can be a join** (`from_type`, `from_key`): the verbs of an imperative are the verbs of k.actions; but
  joined blindly to k.attributes, "the legs of the crocodile" became an attribute (legs: how many). A join by value
  inherits every sense the other world gives the value.
- **Markers of "nobody named this" are worth a value** (`named=no`): "has `named`" had meant "has a name" in a
  method of k.procedures; the explicit value made that reading wrong and visible at once.
- **A shared machine changes what a test run proves.** Under a memory limit shared with other workers, files were
  killed (SIGKILL) and full runs were overtaken by pushes; running files one at a time and rerunning killed files
  alone kept the evidence honest, and the log says which numbers came from which run.
## k.genres, k.story and the compositions (third worker, blocks "15:00" and "17:05")

- **Writing a procedure's facts finds the format's limit before any code does.** A story's protagonist is constrained
  four ways on one key (`name`: it can do the goal's act, the resolution's act, the attempts; it is not the helper),
  but a match was one per key of a binding, and a binding was "every fact that matches", never "one of them". The
  proposal (Q57) is six optional keys, and the reference reader that checks them is 160 lines; the facts were
  written in the proposed form and a script hands the choices to the one planner.
- **The direction of kind matching decides where a constraint is written.** "A fact's value takes a name that is it or
  a kind below it" made "the target is one of the act's objects" accept *person* for *grandmother* (a grandmother is
  a person). The constraint had to be read from the act's object names themselves; "the protagonist is one of the
  act's who" is written on the act's binding, not on the protagonist.
- **Count every solution before sampling, and look at the shares.** 642,752 story plans hold every hard constraint,
  94% of them "reach a place" (every outdoor scene is a target): a sampler uniform over plans would almost never
  tell a rescue. Choosing the goal first (each choice point drawn in turn, weighted) keeps the four goals equal.
- **The soft constraints are where "intelligent" lives.** Uniform samples hold "the helper belongs in the setting" in
  2 of 100; the hard constraints make a story valid, the weights make it sensible. `who=animal` in k.actions lets a
  porpoise climb a castle wall with a sailor's rope: valid by the knowledge, absurd to a reader; the soft
  constraints and k.interest must carry it, or `who` must get narrower.
- **Nothing new but the structure is a strong rule, and it pays.** Obstacles, means and helpers as joins (a river is
  rowed or sailed; the tool of sail is a sailboat; a sailor uses a sailboat) gave 9 helpers and 16 obstacles without a
  single new name, and every join is checked; the price is that obstacles that are not things (the dark, being lost)
  wait for a world that says them.
- **A cheap corpus check says something.** Surface cues in 1,000 machine-written children's stories put the setting
  before the complication and the complication before the resolution in 94% of the stories that have both: k.story's
  order. Read in place, nothing copied (a share-alike source stays where it is).
- **Under shared memory, check what a killed test asserts by other means.** The catalog test builds the catalog twice
  and was killed even alone while four workers ran suites; rebuilding in the clean worktree and finding no diff is
  the same assertion.
- **A structure from the literature is a shape, not a law: check it on real tales and decide by the numbers.** Forty
  public-domain tales annotated by hand kept four constraints (the obstacle blocks the goal 33/33, the helper has
  what is missing 12/13) and overturned three requirements: a helper (13 of 33; the Grimm tales have one, the fables
  not), attempts (23 of 33) and a happy ending (17 of 33). The synthetic stories agreed with the tales on everything
  but set-up and pay-off (3 of 21 against 13 of 20): what they lack is exactly what makes a tale feel made.

## k.interest, w.document, the register of words, w.lang.ro on 0.63 and UniMorph (first worker, blocks 14:45 to 19:35)

- **A finding gives a direction, never a number.** Every feature of k.interest says which works its direction rests on
  (`source`) and, separately, that its numbers are this repository's (`own`); weights are ranges a host may sample
  inside. Keeping the two apart made the citations honest and left the tuning to the library without touching them.
- **Product, not sum.** Silvia's two appraisals multiply: an obvious fact scores 0 however concrete it is, and an
  incomprehensible novelty too. With a sum, concreteness alone would have carried "a dog is a mammal". The structure
  of a theory is worth more to a program than its list of factors.
- **A dozen lines of reference arithmetic are the integration case.** `share` and `score` in the tool, tested on real
  facts (penguin > elephant's weight > dog is a mammal), let the library read k.interest within the hour (0.65).
- **The join surface of a document is the wire id.** `w.document.sentence.fact` holds the ids of the facts a sentence
  states, so "every claim traces to a fact" is a test over the whole catalog, not a promise of the composer.
- **Share-alike data gets its own shards from the first line.** Frequency next to WordNet facts would have changed the
  terms of 321 shards; 26 shards of their own keep WordNet's terms and let a host leave the share-alike part out.
- **A band computed from a published scale beats a band of list positions.** wordfreq's Zipf value (a standard scale)
  arrived while FrequencyWords bands were drafted; switching before publishing cost one function, and the band is now
  computed from the number on the same fact, so the two cannot disagree.
- **Noisy labels, good forms.** UniMorph Romanian mislabels noun cells; matching sets of forms against what each class
  generates fit 82% of lemmas and agreed with the hand classes for 92%. The 753 that fit nothing are a list of missing
  alternations, the next classes to write.
- **Under memory contention the common failure is SIGKILL, and the common conflict is a generated file.** A test
  wrapper that reruns killed files alone behind a memory gate, and a sync script that resolves conflicts in generated
  files by regenerating them, made pushes possible with four workers on one 8 GB machine.
## Reviewer 21:55 (third worker): the up edges for cousins

- **Several parents come from joining what the worlds already say, not from typing a taxonomy.** Every second parent
  of a cow (farm animal, animal with legs, herbivore) was a key of k.animals read as an edge; the new nodes (farm
  animal) need only one parent each to join the graph. The cost is names: a parent made from a value ("thing for
  travelling") is a phrase, and the report must say which nodes are made.
- **A dictionary's chain is about senses, the graph is about names.** WordNet's `kind_of` lists the first word of each
  hypernym synset; read as names, the chain of "carriage" (a railway car) made "car" a wheeled vehicle. An edge from a
  chain word is safe only where that word's own chosen sense has that parent.
- **A head-noun rule is cheap and mostly right, and its errors are idioms** (teddy bear, guinea pig, Komodo dragon): a
  sample of 100 found 6, all of one kind, so an exception list closes them; the source's naming habit matters too
  (Mulberry puts the qualifier last).
- **Alternation rules are patterns over whole sentences, so their order and their own outputs are the risk**: a rule
  whose output matches another rule's input loops (have / does ... have), and a general rule placed before a specific
  one eats it (how {x} are before how many {y} there are). The canonical forms as fixpoints and the frame examples as
  a check (17 of 352 changed: exactly the variants) found both.
## Block 21:20 and the abstraction round (second worker): w.chart, selectional restrictions, structures, variants

- **A type for a relation's object is mostly already in the data; find it by value, then say how it was found.**
  Of 919 keys, the schemas typed only those with `type=`, an enum or a number; joining the values of every other key
  to the naming keys of every type (half the distinct values, regular plurals as singulars) typed capital -> city,
  can -> action, colour -> colour without a word per key. Two cheap guards made it right: types keyed by the word
  whatever it means (k.words, k.parts, word frequencies) only as the last resort (else every key of English words
  "joins" the dictionary), and a second type only within nine tenths of the best share (rivers named Red and White
  were the second type of every colour key).
- **A generated fact that reads every world is a shared liability.** The relation shards change when any world's
  values cross a threshold, so every worker's build must regenerate them; the cost is acceptable only because the tool
  runs in 5 s and is in `npm run build` (Q59 asks whether declared joins should replace it).
- **A tool that owns a directory must not own every file in it.** kinds-core and relations-core both write k.kinds
  shards; the first wiped the second's on its run. `writeShards` takes a `keep` list now; a test that compares "the
  shards on disk" with a tool's output must filter by the tool's own prefixes.
- **Structure is a better join for analogy than names.** Writing six structures with ordered roles and casting each
  world's types, keys and acts to them gave 96 aligned world pairs and 174 transfer candidates from 153 facts; no pair
  of worlds is written by hand, and a new world is aligned with all others by casting its own roles once.
- **A variant is a variant only where the alternation is required.** Most frames carry wrappers and datives as
  optional parts ("[draw|make] [me|us?]"); those frames are already canonical. Marking only required parts found 45
  variants of 352 and no dative at all, which is itself the measurement: the grammar already folds datives into its
  canonical frames. And which form is canonical is one decision for the whole system: a fronted wh-word was a variant
  in my first draft and the canonical form in the alternation rules that landed meanwhile; the variants now name the
  rules' families, so there is one vocabulary of alternations.
- **Coverage of the words of failures is cheap and tells the gap's kind.** 138 content words of 71 failing
  paraphrases: one real dictionary gap (subhead), five closed-class words the grammar lacked, three names, one notation,
  one misspelling. The failures are not lexical; reaching a sense is not reaching the meant one (Ana, Tom, lei).
- **Resolve a rebase on a log by hand, then grep for markers.** Taking "ours" for generated files and rebuilding them is
  safe; `git add -A` after a conflict on an appended log published six marker lines once.
