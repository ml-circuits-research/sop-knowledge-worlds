# sop-knowledge-worlds

Reusable **knowledge worlds** for [sopworld](https://github.com/ml-circuits-research/soplang-words-lib): world
**schemas** (types, slots, rules, soft rules) and world **instances** (facts), written in SOP Lang only, split into
small shards, and served as static files through GitHub Pages.

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
person drawing, 105 wearables joined to drawings and face variants).

Agents working here start with [AGENTS.md](AGENTS.md).
