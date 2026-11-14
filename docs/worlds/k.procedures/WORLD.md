# k.procedures

How goals are reached: **methods** as facts. A method says how one goal (an act on a kind, or a named task) is
reached by the acts of `k.actions`, with steps whose roles are read off the goal, what earlier steps made, the live
world and the facts of other knowledge worlds. Hand-written (`hand-core 1`, CC0-1.0) by `tools/procedures-core.mjs`.
The planner that applies the methods is the library's `std.plan` (Round 29); the format is proposed to it in
`questions.md` Q44. Complex behaviour comes from knowledge and orchestration, not from code in live worlds.

## The format

| Type | Identity | Says |
| --- | --- | --- |
| `k.procedures.method` | `name` | `about`; `act` (the goal's act); `world` (a world schema it acts in, if any); `rank` (order among methods of one goal; 1 when not said); `example` (goals in plain words) |
| `k.procedures.goal` | `method`, `role` | what the goal's role must be: `from` a knowledge type whose fact it names (by `by`, else `name`), `value`, `kind`, `rel`; `needed`; `default` |
| `k.procedures.binding` | `method`, `name` | one source: `goal` (a role), `step` (what those steps made; an ask step's answer rows), `from` (facts of a type, filtered by matches), `live` (things of a kind, or `any`), `history` (acts done before the plan), `upto` (1..n), `together` (other bindings), `value`; `key` takes one key's values |
| `k.procedures.match` | `method`, `binding`, `key` | a filter on a binding of facts or things: `value`, `not`, `equals` (another binding, of its key `equals_key`, compared up the chain of kinds), `present` |
| `k.procedures.step` | `method`, `n` | `act`; `each` (repeat over a binding); `after` (many: order; none said: unordered); `expand=false` (the act itself, never another method); `optional`; `about` |
| `k.procedures.arg` | `method`, `step`, `role`, `attribute` | a role of the step's act (for `value`, the `attribute` it sets): from a `binding` (its `key`, else `else_key`) or a `value`; `rel` of a place; `of` (a part or anchor of that thing) |
| `k.procedures.condition` | `method`, `n` | `when=before` (precondition of the method, or of step `step`: done only if) or `after` (effect); `fact` exists, absent, on, inside, grouped, has; `thing`, `other`, `attribute`, `value` |

**Alternatives** are the methods of one goal: the planner keeps those whose goal facts fit, whose `world` is the live
world's schema (or none), and whose preconditions hold, then takes the lowest `rank`, then the first by name.
**Decomposition**: a step is expanded by a method whose goal fits it (unless `expand=false`), to a depth of 3, and no
method is used again inside its own expansion (a pond inside a farm is a thing, not the pond scene). A plan has at
most 200 acts. Kinds in steps are plain names; the live world's schema resolves them (`table` -> `w.seating.table`).
A role of the goal that the goal does not say is left out of a step; any other filler with no value leaves the step
out for that value.

## The methods (23)

From knowledge (shard `from-knowledge`, 16): **compose a scene** (`k.scenes`: the ground, each thing it has, as many
as it has, where it usually is; things that rest on another after it, on it), **arrange in a layout** (`k.layouts`:
group the things, put each into the slot that holds its kind), **put / make a thing on the anchor of another**
(`k.layouts` anchors: the seat of a swing holds a person, the top of a table a cup; the other thing made first if
there is none), **put on (a new) wearable** (`k.wearables`: where it is worn), **put a wearable on a face** (`w.face`:
the face slot and variant k.wearables names), **a person of a role** (`k.people`: the person, what the role wears,
what it holds in the hand), **a face of a role** (`w.face`: hat, glasses, beard, moustache, shoulders of the role),
**show a feeling on a face** (`k.feelings` on `w.face`: the expression, then the variant of each part), **take apart a
drawn thing** (`k.objects`: the parts of its drawing that have a name), **take apart into named parts** (`k.parts`, when
the drawing has none), **take apart a group**, **build from parts** (`k.layouts` joins: make the parts, connect those
that attach, group them), **show a country / a city on the map** (`k.geo` on `w.map`).
Named tasks (shard `tasks`, 7, with `core.word` facts for the task names): **a family photo** of the people there, or
of a new family when there is nobody; **set a table** in a picture (chairs around, plates and cups on top) or in a
seating plan (`w.seating`: a table with that many seats, and the seats); **a chart of the things there** (`w.list`: one
item per kind with its count); **a report about what was done** on a timeline (`w.timeline`) or as a list (`w.list`).

## Tests and coverage

`tests/k.procedures.test.mjs`: every act and role is one of `k.actions`; every binding has one source and every name
used is bound; knowledge types and keys exist; a plan in a world schema makes only its kinds with its attributes; and
goal -> expected acts for: draw a farm, a person sitting on a swing (new or existing swing; a man on a bench; a cup on
the table), a family photo (both alternatives), set a table for four (picture, an existing table, w.seating), take
apart a car (drawing parts), a piano (k.parts), a group, a refusal (an idea), build a house from parts, a chart of the
things in the picture, a report about what we did (w.timeline, w.list; refused with nothing done), a doctor (picture),
a pirate face (w.face), a shy and a hurt face, a hat on a man, a scarf on a girl, a cap on a face, Peru and Lima on the
map, a row, a missing needed role asked. The expansion is done by `tools/lib/plan.mjs`, a reference reader (a test
oracle, not a planner for hosts).
Coverage (every goal of the knowledge each general method reads, all within the budget, effects true): 61 of 61
scenes (1,261 acts, at most 35), 60 of 60 roles in a picture and 60 on a face, 105 of 105 wearables on a person, 30 of
30 feelings on a face, 17 of 17 layouts, 50 of 50 joined wholes built from parts, 1,643 of 1,643 drawings with named
parts taken apart.

## Known limits

- An imported drawing's unnamed part is called `part<n>`, with no key saying it has no name; take apart uses only
  parts with a kind (not `detail`) or named by the model, so the body of a drawing (`body`, `cabin` of the car) stays
  as the thing, and the whole is not removed (questions.md Q45).
- No `w.chart` schema: a chart is a list of counts (`w.list`) for now (Q45).
- The role -> argument map of `std.acts` (`number` -> `amount`, a place with `rel` and `of` -> `at` or `rel` and `ref`)
  is the library's (Q44 a).
