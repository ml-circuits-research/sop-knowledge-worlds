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
