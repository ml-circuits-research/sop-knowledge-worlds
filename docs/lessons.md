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
