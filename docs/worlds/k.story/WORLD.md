# k.story

How a story is built, as facts a program can plan with: the **elements** of a story in the order they are told, the
**kinds of goals** a protagonist can have, the **obstacles** that block them, and the **constraints** between the
elements ("random but by the book"). Hand-written (`hand-core 1`, CC0-1.0) by `tools/story-core.mjs`, from the classic
story-grammar and plot literature. **Nothing is invented here but the structure**: characters are names of
`k.people` (kinds and roles) and `k.animals`, places are scenes of `k.scenes`, things are `k.scenes` things with
`k.objects` drawings, and every act is an act of `k.actions`; the joins are by name and checked by the tests. Read by
the library's `std.compose` through the procedure "write a story" of `k.procedures`: its choice points are these
elements, solved jointly under these constraints (finite domains: the facts of the catalog), and sampled among the
solutions by the weights of `k.interest` and the soft constraints here. No language model is involved.

## The format

| Type | Identity | Says |
| --- | --- | --- |
| `k.story.source` | `name` (`propp1968`) | `cite`, `year`, `doi` (where sure), `finding` |
| `k.story.element` | `name` | `n` (order told), `min`, `max` (how many), `part` and `move` (of the genre "story" in k.genres), `fills` (types of the catalog that fill it), `propp`, `grammar`, `arc`, `about`, `source`, `own` |
| `k.story.goal` | `name` | `act` (a k.actions act: the protagonist is one of its `who`, the target one of its `object`s), `target` (place, thing, being), `place_kind` (for a place: a k.scenes kind), `propp`, `about`, `source`, `own` |
| `k.story.obstacle` | `thing`, `blocks` | `how` (between, across, guards, holds), `overcome_by` (acts that get past it), `means` (their tools: what is missing), `tried_by` (acts tried in vain), `about`, `own` |
| `k.story.constraint` | `name` | `element`, `relation`, `other`, `strength` (hard, soft), `about`, `source`, `own` |

## The elements (11), in the order told

| n | Element | Filled from | Part, move | Propp | Story grammar | Arc |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | setting | k.scenes.scene | orientation, set the scene | initial situation | setting | exposition |
| 2 | protagonist | k.people.kind, k.people.role, k.animals.animal | orientation, introduce character | hero | protagonist | exposition |
| 3 | goal | k.story.goal | orientation, state goal | lack (VIIIa), villainy (VIII) | goal / theme | exposition |
| 4 | target | k.scenes.scene, k.objects.object, people, animals | orientation, state goal | sought-for person or object | object of the goal | exposition |
| 5 | obstacle | k.story.obstacle | complication, complicate | struggle (XVI), difficult task (XXV) | initiating event | rising action |
| 6 | attempt (0-3) | k.actions.action | complication, attempt | reaction to the test (XIII) | attempt and outcome | rising action |
| 7 | helper | k.people.role | complication, introduce character | donor (XII), helper | new character | rising action |
| 8 | means | k.objects.object | climax, turning point | magical agent (XIV) | enabling condition | climax |
| 9 | turning point | k.actions.action (give) | climax, turning point | receipt of the agent (XIV) | outcome that turns the goal path | climax |
| 10 | resolution | k.actions.action | resolution, resolve | victory (XVIII), liquidation (XIX) | outcome / resolution | falling action |
| 11 | ending | k.story.goal (reached) | ending, end | return (XX), reward (XXXI) | ending, reaction | outcome |

## Goals (4) and obstacles (16)

Goals: **reach a place** (act go; an outdoor scene other than the setting), **find a thing** (act find; its objects
with a drawing: a key, a shell), **rescue someone** (act help; a friend, a neighbour, a child), **visit someone** (act
visit; a grandmother, a friend). Obstacles, each a thing of k.scenes as it blocks one kind of goal: a **river** (between;
row, sail or build a bridge: rowing boat, sailboat, hammer; tried in vain: jump, wait, shout), the **sea** (sail), a
**mountain** (climb with a rope or a ladder), a **tree** (climbed with a ladder to rescue someone or fetch a thing;
cut with a saw when it lies across the way), a **dragon** (guards; fight with a sword and a shield), a **fence** and a
**wall** (climbed). Helpers come out of k.people: a sailor uses a sailboat and holds a rope, a cowboy holds a rope, a
firefighter and a builder use a ladder, a builder and a carpenter a hammer, a carpenter holds a saw, a knight, a king,
a prince and a pirate hold a sword.

## Constraints (21: 17 hard, 4 soft)

Hard: the protagonist can reach the goal (it is one of the `who` of the goal's act, up the chain of kinds: a girl is a
child is a person); the target fits the goal (an object of its act, or a scene of its kind) and differs from the
setting and the characters; **the obstacle blocks the goal**; the setting has the obstacle (k.scenes.has); the means
overcomes the obstacle; **the protagonist lacks the means** (holds and uses of k.people.role); **the helper has the
means**; the helper differs from the protagonist; the protagonist can make the attempts, and **the attempts fail**
(1 to 3 different acts of the obstacle's tried_by); the helper comes before the turning point; the turning point
gives the means; the protagonist can do the resolution's act; **the resolution uses the means** (an overcoming act
whose tool it is: what was set up earlier solves the problem); the means comes before the resolution. Soft (a
composer prefers them): the ending reaches the goal; the protagonist and the helper belong in the setting (work
there, or are things it has); the target is in the setting. The attempts, the helper, the means, the turning point
and the resolution are optional elements (min 0) since the tales check below; the constraints on them hold where
they are there. The procedure "write a story" of k.procedures writes the helper tale (all of them present).

The reference reading: `storyKb(worlds)` gathers the facts a plan reads (the wires of the types it needs, parsed
alone), `storyPlans(kb, each)` enumerates every plan that holds the hard constraints, and `checkPlan(kb,
constraints, plan)` checks one plan against every constraint from the facts alone and names those it breaks.

## Where it comes from

- **Elements.** Propp's functions and characters of the wonder tale (1928; English 1968): the lack or the villainy,
  the donor who provides a magical agent, the struggle, the liquidation of the lack, the return. The story grammars:
  Rumelhart (1975: setting and episode, goal and attempts, causal and enabling links), Mandler and Johnson (1977:
  beginning, development with goal, attempt and outcome, ending), Stein and Glenn (1979: initiating event, internal
  response, attempt, consequence, reaction), Thorndyke (1977: setting, theme, plot, resolution). The arc: Aristotle's
  beginning, middle and end and the reversal (Poetics), Freytag's five parts (1863), Field's three acts and plot points
  (1979), Labov and Waletzky's orientation, complication, resolution and coda (1967).
- **Constraints.** That the events lie on one causal chain from the goal to the outcome (Trabasso and van den Broek
  1985: events off the chain are dead ends), so the obstacle must block the goal and the resolution must get past it;
  that the helper has what the hero lacks (Propp's donor and magical agent); that what is set up is used and what is
  used was set up (Chekhov's letter of 1889: the gun on the wall in the first act is fired later); at most three
  attempts, the tries failing before the help comes (Olrik's law of three, 1909).
- **Own choices** (said by `own`): which acts of k.actions get past each obstacle, with which of their tools, and which
  acts are tried in vain; the goals as acts of k.actions (rescue as help, a visit as a goal); `who` and `object` of the
  act standing for "a protagonist that can have the goal" and "what the goal can be about"; holds and uses of a role
  standing for what a character has; the soft constraints.

## Sources

- `aristotle`: Aristotle (c. 335 BCE). Poetics, chapters 7 and 10-11. Translated by S. H. Butcher (1895) as The Poetics of Aristotle. London: Macmillan. — A plot is a whole with a beginning, a middle and an end, its events joined by necessity or probability; the best plots turn by a reversal (peripeteia) that follows from what came before.
- `propp1968`: Propp, V. (1968). Morphology of the Folktale (2nd ed., L. Scott, Trans.; L. A. Wagner, Ed.). Austin: University of Texas Press. (Original work published 1928.) — Wonder tales are built of at most 31 functions in a fixed order (a lack or a villainy, the departure, the donor who tests the hero and provides a magical agent, the struggle, the liquidation of the lack, the return) carried by seven kinds of characters (hero, villain, donor, helper, sought-for person, dispatcher, false hero).
- `rumelhart1975`: Rumelhart, D. E. (1975). Notes on a schema for stories. In D. G. Bobrow & A. Collins (Eds.), Representation and Understanding: Studies in Cognitive Science (pp. 211-236). New York: Academic Press. — A story is a setting and an episode; an episode is an event and the reaction to it, the reaction an internal response (a goal) and the overt attempts to reach it, joined by causal and enabling links.
- `mandlerJohnson1977`: Mandler, J. M., & Johnson, N. S. (1977). Remembrance of things parsed: Story structure and recall. Cognitive Psychology, 9(1), 111-151. doi:10.1016/0010-0285(77)90006-8 — A story is a setting and episodes; an episode is a beginning, a development (a reaction, a goal path of attempt and outcome) and an ending; stories in this structure are recalled best.
- `steinGlenn1979`: Stein, N. L., & Glenn, C. G. (1979). An analysis of story comprehension in elementary school children. In R. O. Freedle (Ed.), New Directions in Discourse Processing (pp. 53-120). Norwood, NJ: Ablex. — An episode is an initiating event, an internal response (the protagonist's goal), an attempt, a consequence and a reaction, after a setting that introduces the protagonist.
- `thorndyke1977`: Thorndyke, P. W. (1977). Cognitive structures in comprehension and memory of narrative discourse. Cognitive Psychology, 9(1), 77-110. — A story is a setting, a theme (the goal), a plot of episodes (subgoal, attempts, outcome) and a resolution; texts that keep this structure are understood and recalled better.
- `trabasso1985`: Trabasso, T., & van den Broek, P. (1985). Causal thinking and the representation of narrative events. Journal of Memory and Language, 24(5), 612-630. — Events of a story that lie on its causal chain from the goal to the outcome are recalled and judged important; events with no causal links are dead ends.
- `freytag1863`: Freytag, G. (1863). Die Technik des Dramas. Leipzig: S. Hirzel. Translated by E. J. MacEwan (1895) as Technique of the Drama. Chicago: S. C. Griggs. — A drama rises and falls in five parts: introduction (exposition), rising action, climax, falling action (return), and catastrophe (the outcome).
- `field1979`: Field, S. (1979). Screenplay: The Foundations of Screenwriting. New York: Dell. — A story is told in three acts (set-up, confrontation, resolution) divided by plot points that turn the action in a new direction.
- `labovWaletzky1967`: Labov, W., & Waletzky, J. (1967). Narrative analysis: Oral versions of personal experience. In J. Helm (Ed.), Essays on the Verbal and Visual Arts (pp. 12-44). Seattle: University of Washington Press. — A narrative has an orientation (who, where, when), a complication, an evaluation, a resolution and a coda that returns to the present.
- `olrik1909`: Olrik, A. (1909). Epische Gesetze der Volksdichtung. Zeitschrift fur deutsches Altertum und deutsche Literatur, 51, 1-12. Translated as Epic laws of folk narrative, in A. Dundes (Ed.) (1965), The Study of Folklore (pp. 129-141). Englewood Cliffs, NJ: Prentice-Hall. — Folk narrative follows epic laws: the law of three (three tries, three brothers, the last succeeding), two to a scene, contrast, and a single strand of action.
- `chekhov1889`: Chekhov, A. P. (1889). Letter to A. S. Lazarev (Gruzinsky), 1 November 1889. In Letters of Anton Chekhov (1973, M. H. Heim & S. Karlinsky, Trans.). New York: Harper & Row. — Nothing should be put on the stage that is not used: a gun shown in the first act must be fired later (set-up and pay-off).

## Tests and numbers

`tests/k.story.test.mjs`: the shards are what the tool writes; every reference resolves (each obstacle a k.scenes
thing with a k.objects drawing; acts in k.actions; each means a drawn tool of an overcoming act, and some means of
each obstacle has a helper; parts and moves of the story genre in k.genres; the types elements are filled from exist);
every source is used and cited here. **Integration case for std.compose:** two hand-traced plans that hold every hard
constraint (a girl rescues a friend from the dragon of the castle with the knight's sword after shouting and hiding;
a boy crosses the river to his grandmother in the sailor's sailboat after jumping, waiting and shouting) and the
soft ones traced; broken plans refused by name (a knight who already has a sword, a baker as the helper, a beach with
no dragon, a repeated or a fourth attempt, the helper after the turning point, the means after the resolution, a fox
that cannot find); **all 642,752 plans** that hold the hard constraints counted over the catalog (reach a place
605,163; rescue someone 18,669; find a thing 15,314; visit someone 3,606), and **1,000 sampled** uniformly (seeded),
given 1 to 3 attempts, and each checked again from the facts: none breaks a hard constraint. Uniform sampling holds
the soft constraints rarely (about 1 to 2 in 100 each): a composer weights by them and by k.interest.

## Checked against tales annotated by hand (block "19:45")

`sources/story-check/` holds two samples annotated by hand by the third worker with k.story's elements and
constraints (`SOURCE.md` there gives the fields and the rule): 40 human-written public-domain tales of PSys2's
`tales-pd` (15 Grimm, 5 Andersen, 20 Aesop; the fables read whole, the long tales read in their opening and annotated
from their well-known plot) and 40 TinyStories. `tests/k.story.check.test.mjs` prints the table:

| Measure (over the stories it applies to) | Tales | TinyStories |
| --- | --- | --- |
| has a goal | 34/40 | 32/40 |
| has an obstacle | 37/40 | 27/40 |
| obstacle blocks the goal (goal and obstacle) | **33/33** | 25/26 |
| attempts that fail | 23/33 | 14/26 |
| at most three attempts | **23/23** | 14/14 |
| a helper | 13/33 | 15/26 |
| helper has what is missing | **12/13** | 15/17 |
| the helper gives a thing | 6/13 | 6/17 |
| protagonist lacks it | **13/13** | 16/17 |
| resolution | 19/33 | 19/26 |
| resolution uses a set-up | 13/20 | 3/21 |
| goal reached | 17/33 | 19/26 |
| goal told before the obstacle | 18/33 | 20/26 |

**Decisions, by the tales column:** kept hard what holds in nine in ten of the tales where it applies (the obstacle
blocks the goal; at most three attempts; the helper has what is missing; the protagonist lacks it). Made optional
what many tales do without: attempts (23 of 33 have them), the helper with its means and turning point (13 of 33: 12
of the 15 Grimm tales, 1 of the 19 fables), the resolution (19 of 33). Made soft "the ending reaches the goal" (17 of
33: fables end in failure). Set-up and pay-off holds in 13 of the 20 tales that resolve (65%) and is kept where a
helper brings the means. The goal comes before the obstacle in only 18 of 33 tales (the trouble often comes first and
the goal answers it): `n` is the usual order of telling, not a constraint, and no constraint orders goal and
obstacle. No new goals, obstacles or helpers were taken: those of the tales that map to existing kinds (a river, a
glass mountain, a fox, a dwarf with a wand) are already of the kinds k.story uses.
**TinyStories adds nothing the tales do not say** (its numbers are close on every constraint but set-up and pay-off,
which it almost never uses: 3 of 21); it can be dropped; it was used for statistics only, never as a style reference.

## Checked against a corpus

`tests/k.story.corpus.test.mjs` reads 1,000 short stories of TinyStories (Eldan and Li 2023,
https://arxiv.org/abs/2305.07759; CDLA-Sharing-1.0; machine-generated stories for young children) in place, from
PSys2's data folder (nothing of it is copied into this repository; skipped where it is absent), and looks for surface
cues of the elements (own choice: "once upon a time", "but", "suddenly", "tried", "helped", "finally"...). Result: a
setting in 840, a complication in 729, an attempt in 196, a helper in 234, a resolution cue in 193 stories; **the setting
comes before the complication in 571 of 605 stories with both (94%), the complication before the resolution in 130 of
139 (94%)**: the order k.story tells its elements. The obstacles of k.story occur too (a tree in 130 stories, a wall
in 25, a boat in 23, the sea in 19, a river in 14, a ladder in 10). The cues measure order and frequency, not content.

## Known limits

- The obstacles are the things k.scenes and k.actions already join (a river and row, a dragon and fight); obstacles
  that are not things (the dark, a storm, being lost) wait for scenes or acts that say them (night is a scene, not a
  thing a setting has).
- One episode per story; stories of several episodes (Mandler and Johnson's then-connected episodes) are the same
  elements repeated, which a procedure can express by repeating the complication.
- A character "has" a thing only by k.people roles (holds, uses); a person of no role and an animal have nothing, so
  they are always protagonists who lack, never helpers.
