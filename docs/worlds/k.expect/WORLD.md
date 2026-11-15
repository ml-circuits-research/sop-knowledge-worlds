# k.expect: what a reasonable person expects

Knowledge (owner's GO, reviewer block 2026-11-15 14:00, item 3): when a person asks for a thing and does not say
everything, what they expect: the typical number of parts and of kinds of parts, the usual layout and extent, the
named amounts ("a few", "many") as ranges, and the scale steps (tiny, small, default, big, huge) as factors. A
planner fills from it what a `w.request` request did not say; the reply names those assumptions (`w.dialogue`
assumption, reply `assumed`). **"random" means varied within the typical range** (between `min` and `max`, and
`kinds_min` to `kinds_max` kinds, varying what `varies` lists), never the minimum. CC0-1.0; every fact `hand-core 1`
(own; the derived facts keep the source of the fact they come from). Written by `tools/expect-core.mjs` (in `npm run
build`); words in `shards/words.sop`.

## Types and exact keys

- `k.expect.amount`: `name` (one, couple, few, some, handful, several, many, dozen, about), `min`, `max`, `typical`;
  a relative amount (about: "about 7", "7 or so") has `min_factor` 0.8 and `max_factor` 1.25 instead. `about`.
- `k.expect.scale`: `step` (tiny, small, default, big, huge), `order` (1-5), `count_factor` (0.4, 0.6, 1, 1.5,
  2.2), `size_factor` (0.4, 0.7, 1, 1.4, 2), `extent` (share of the canvas: 0.1, 0.25, 0.6, 0.85, 1), `about`.
- `k.expect.make`: `thing` (id), `made_in` (diagram | drawing | document | chart | list | map | face | music), `unit`,
  `min`, `max`, `typical`, `kinds_min`, `kinds_max` (a diagram: node shapes; anything else: part groups), `layout`, `extent`, `scene` (k.scenes scene), `diagram`
  (k.diagrams kind), `length_unit`, `length`, `varies` (many: count, kinds, layout, colour, place, topic, size), `about`.
- `k.expect.part`: `of` (a make's `thing`), `part`, `group` (what kinds_min/kinds_max count: water, plant, animal,
  node, link, building ...), `min`, `max`, `typical`, `needed` (yes), `where` (a scene region), `shape` (many: a
  k.diagrams shape), `role` (a k.diagrams role).

## Shards

- `hand`: the amounts, the scale, and 13 hand-checked makes with their parts: diagram (5-9 nodes of 2-3 shapes from
  rectangle, rounded_rectangle, circle, diamond, oval; 4-12 links; layout top_down), pond (water needed, 2-5 water
  lilies, 0-4 reeds, 0-2 each of duck, frog, goldfish, stones, grass: 4-9 parts of 3-4 groups, so at least one animal), house, tree,
  garden, street, story (3 chapters, about 400 words), poem, essay, bar chart, list, song, face.
- `scenes`: every scene of `k.scenes` as a make named "<scene> scene" (pond scene, garden scene, city street scene):
  each `k.scenes.has` part with its count as typical, min 0 (1 for the scene's namesake and a part that fills a
  region), max twice the count; kinds 3 to all, the default about six kinds.
- `diagrams`: every kind of `k.diagrams` as a make (flowchart, cycle, timeline, mind map, Venn diagram, org chart,
  network, pipeline, comparison table, and "tree diagram"): 5-9 nodes, a part per role with its shape and usual
  count (a flowchart: start 1, end 1, process 2-6, decision 1-2 ...), links where the kind has edges, the kind's
  first arrangement as layout.

## Questions it helps with

What does "a pond" contain by default? How many nodes for a random diagram? What is "a few"? How much smaller is
"small"? What shapes does a flowchart use?
