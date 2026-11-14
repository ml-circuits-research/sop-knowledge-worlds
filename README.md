# sop-knowledge-worlds

Reusable **knowledge worlds** and **world schemas** for [sopworld](https://github.com/ml-circuits-research/soplang-words-lib):
each a module (types, slots, rules, soft rules) and, for a knowledge world, its facts, written in SOP Lang only,
split into small shards, and served as static files through GitHub Pages.

**Three kinds of worlds** (names used in every repository and in the library's docs): a **world schema** says what
a kind of world is (its kinds of things, attributes, value types, acts, limits, rules and the words for them) and
holds no particular things: `w.seating` (a seating plan: tables, seats, guests). A **knowledge world** holds facts
about the world at large, true for everyone, with no session state: `k.animals` (a rabbit is a mammal; its young is
a kit), and `w.lang.en`, a knowledge world about English. A **live world** is one running instance of a world schema
in a session (the tables a user made, their seats, the focus, the history and undo); a tab shows it through a view.
This repository holds world schemas (`w.*`) and knowledge worlds (`k.*`, `w.lang.en`), never live worlds; the
library's modules (`std.*`: acts, fill, focus, relations, turn, know, grammar) are mechanisms, not worlds.

**Shards hold facts, modules hold rules** (reviewer's answer to Q38). A rule (`core.rule`, a soft rule, a deny) is
written in the world's module (`schema.sop`), never in a shard: `k.commonsense`'s rules (an animal that lives in the
sea is at sea; a drink is a liquid) and `k.time`'s (of two months, the one with the smaller position is before) live
in their schemas, so a host that loads a module gets its rules once, and a host that loads shards gets facts only.
When a module's rules grow, they move to a module of their own that imports the fact worlds (`k.commonsense.rules`),
so a host can take the facts without the rules. What the rules derive is written back as facts, marked: the
generated shards `shards/derived*.sop` (`tools/derive.mjs`) carry `derived=true` and `core.source="rule <rule id>"`,
for tools and hosts that read shards without running rules; they are facts, not rules.

Applications (PSys2 first) do not copy this knowledge into their own worlds. They load a schema as a sopworld
module and load only the instance shards that a conversation needs, when the words of a message point to them.

- **Catalog:** `docs/worlds/index.json` lists every world, its schema, its shards and its sources and licenses.
- **Vocabulary index:** `docs/worlds/vocab.json` maps an English word to the shards where it matters, so a host can load
  knowledge lazily.
- **Documentation:** `docs/index.html` (how to use the catalog from an application) and `docs/worlds/README.md`.

Status (Round 7): nineteen worlds are published: `k.commonsense`, `k.objects` (2,108 drawable objects; browse them in
`docs/gallery.html`), `k.words`, `k.geo`, `k.units`, `k.time`, and the hand-written cores `k.space`, `k.animals`,
`k.body`, `k.food`, and `k.faces` (faces built from replaceable parts; previews in
`docs/worlds/k.faces/preview/index.html`), `k.scenes` (the usual place and relative size of drawable things, and 61 typical scenes; previews in
`docs/worlds/k.scenes/preview/index.html`) `k.people` (kinds of person, 60 roles and jobs), `k.feelings` (30 feelings and how a face shows them), `k.layouts` (17 named arrangements, anchors on drawable things, what joins what), `k.colours` (33 colours: family, light or dark, mixes, typical things) and `k.shapes` (36 shapes: sides, corners, round or not, typical things). ConceptNet, Quick, Draw! and Wikidata are not imported yet (their hosts are not reachable from
the build network; the import scripts for the first two exist with fixture tests).
Round 8 worlds: `k.actions` (the words of the acts: 14 acts, their roles and markers, 291 verbs and phrasal verbs; and, from Round 7, 187 everyday actions: who does it, to what, with what, the opposite, what undoes it), `k.values` (the words for values: 170 colour names with RGB, 13 ordered scales and their
comparatives, shapes, directions, positions, set words, number words), `k.attributes` (which attributes kinds of things have, where their values are
found, usual colour, material, wheels, abilities and use of 761 common things), `k.wearables` (what is worn where: 15 places on the body with their anchor on the
person drawing, 105 wearables joined to drawings and face variants), `k.parts` (usual parts of 541 of the 1,500 common things, from WordNet).
Coverage of the 1,500 common things per attribute and per world, with the gaps: `docs/worlds/COVERAGE.md`; families of things by aspect: `docs/worlds/k.attributes/ASPECTS.md`.
Round 9 (the facts the Talk tab asked for): `k.layouts` has 225 anchors (where a thing sits, stands, lies or is put:
swing, bench, bed, horse, bookcase, branch, roof; the feet and hips of the person); `k.animals` 314 animals with size
class, group name and what they cannot do; `k.geo` capitals for 232 of 238 countries and territories, 100 lakes, 58
deserts, 72 oceans and seas, river lengths and areas as `_about` values; `k.space` colours and why, days, years,
widths, distances; `k.body` 91 parts with the parts of hand, eye, ear and mouth; `k.food` 229 foods with what dishes
are made of; `k.words` opposites, adjectives and adverbs of the common words and chains of kinds. `k.units.measure`
says in which unit every number of these worlds is given. `node tools/ask-sample.mjs` asks a seeded sample of 100
natural questions per domain and counts those that find a fact by lookup.
Round 11 (the demo's real questions): `node tools/ask-real.mjs` answers the 292 questions of
`sources/psys2-eval` (the Talk tab's failed questions and the demo's lookup set) from the catalog by the words of
each question alone (the thing, the asked key, a value, a scale) and says for each one that finds nothing why:
thing missing, key missing, key of another kind of thing, word not in the vocabulary. Every key of every named
type now has a `core.word` (`tools/key-words.mjs` writes the block at the end of each schema), and `k.units.measure`
says the unit of every number of every world.

## What belongs here, what belongs to the library, what stays in an application

- **Here (this repository):** every world written in SOP Lang alone that more than one application could use,
  loaded by lookup. Two namespaces. `k.*` is **knowledge**: facts and their schemas (animals, places, words, the
  usual place and size of things), the words for values and for the acts, layouts, common-sense rules about kinds.
  `w.*` is **reusable worlds**: schemas of things a user makes and changes (a list, a seating plan, a timeline),
  declared in the library's `std.schema` format, with words, and no rule or function of their own. Both are found
  through `docs/worlds/index.json` (`worlds`, `schemas`) and `vocab.json`. Nothing here names an application.
- **The library ([soplang-words-lib](https://github.com/ml-circuits-research/soplang-words-lib)):** the engine and
  every module that needs a **function**: the acts themselves (`std.acts`), fillers (`std.fill`, `std.know`),
  solvers for space and time, arithmetic on units, anything that computes. A world here may say *that* a rule
  needs a function and name it with `core.function`; the function is written there.
- **An application:** what is true only of it or of one user: its tabs and commands, the wording of its replies,
  translation, the things of a session, what a user taught, its own drawings and styles. If a second application
  would want it, it moves here.

Round 12: `w.lang.en`, English grammar as facts (closed word classes, morphology, clause structure, ellipsis, 84
plain productions of 64 constructions, 233 argument frames of the acts of `k.actions`, phrase groups), imported from
PSys2's hand-over and read by the library's `std.grammar` (`docs/worlds/w.lang.en/WORLD.md`). It is a reusable world
of facts (types and shards, validated like the knowledge worlds), not a `std.schema` world.

Block "09:10" (first worker): `k.procedures`, how goals are reached: 23 methods as facts (goal, steps as acts of `k.actions`
with roles read off the goal, earlier steps, the live world and other knowledge worlds, preconditions, effects, order,
alternatives by world and rank) for the library's planner `std.plan` (format: questions.md Q44; `docs/worlds/k.procedures/WORLD.md`).

World schemas so far: `w.list`, `w.seating`, `w.timeline`, and (block "06:55" item 3, for the library's case
corpus and the demo) `w.face`, a drawn face whose kinds are the slots of `k.faces`, and `w.map`, a map view over the
places of `k.geo` with its own zoom and layer (each with a `WORLD.md`; sessions in `tests/w.schemas.test.mjs`). A
world schema may hold denies (`w.timeline`: an event is inside its timeline; `w.face`: one part of each kind on a
face) but no function. Every world, `k.*` and `w.*`, is validated with one sopworld build, 0.52.0 at
commit b44d444 (`tools/sopworld/VERSION`).

Agents working here start with [AGENTS.md](AGENTS.md).
