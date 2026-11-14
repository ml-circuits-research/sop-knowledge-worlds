# k.diagrams

What each **kind of diagram** is, as facts a program can draw with (block "04:40"; the owner: "a random diagram draws
circles; arrangements are not understood"). Hand-written (`hand-core 1`, CC0-1.0) by `tools/diagrams-core.mjs`, with
the published works each fact rests on. A diagram itself is made in the world schema `w.diagram`; this world says
which kind to choose for a topic, how to lay it out, how to draw each node, and which knowledge of the catalog fills it.

## The format

| Type | Identity | Says |
| --- | --- | --- |
| `k.diagrams.kind` | `name` | `form` (its value of `w.diagram.diagram.form`), `about`, `structure` (k.kinds structures, many), `layout` (values of `w.diagram.diagram.layout`), `arranged` (k.layouts layouts), `edges` (directed, undirected, none), `role` (the roles of its nodes: values of `w.diagram.node.role`), `groups`, `usual_for`, `source` |
| `k.diagrams.shape` | `kind`, `role` | `shape` (a value of `w.diagram.node.shape`), `about`, `source` |
| `k.diagrams.fill` | `kind`, `type`, `key` | `gives` (edges, order, members, values), `topic` (the key that names what one diagram is about), `about` |
| `k.diagrams.source` | `name` | `cite`, `year` |

## The kinds (10)

| kind | structure | layout | arranged | edges | filled by |
| --- | --- | --- | --- | --- | --- |
| flowchart | graph, sequence | top_down, left_right | flow, column | directed | k.procedures.step after, n |
| tree | whole with parts, graph | top_down | tree | undirected | k.kinds.parent is_a, k.parts.usual has, k.geo.city country |
| cycle | cycle | circular | ring, flow | directed | k.time.ordered next, n (seasons, months, life cycles, the water cycle) |
| timeline | sequence | left_right, top_down | row, column | none | k.time.ordered n, k.story.element n |
| mind map | whole with parts | radial | radial | undirected | k.parts.usual has, k.attributes.aspect |
| Venn diagram | whole with parts | overlapping | | none | k.kinds.parent is_a (members of kinds) |
| org chart | whole with parts, graph | top_down | tree | undirected | nothing in the catalog yet (who reports to whom) |
| network | graph | free | scatter | undirected | k.geo.country neighbour, k.layouts.joins, k.kinds.relation |
| pipeline | sequence | left_right | flow, row | directed | k.genres.part n, k.procedures.step n |
| comparison table | values by category | grid | grid | none | k.attributes.number |

Shapes (23 conventions): a flowchart's start and end are ovals, a process a rectangle, a decision a diamond, data a
parallelogram, a document a wavy rectangle, a subprocess a double-sided rectangle, a connector a small circle (ISO
5807); a cycle's stage is a circle, a timeline's event a dot on the line, a mind map's centre an ellipse and its
branches rounded boxes, a Venn diagram's sets circles (groups) and its items dots, an org chart's post a box, a
network's node a circle, a pipeline's stage a chevron, a table's cells rectangles.

Sources: Gilbreth and Gilbreth 1921 (process charts), ISO 5807:1985 (flowchart symbols), Sugiyama, Tagawa and Toda
1981 (layered top-down drawing of directed graphs), Reingold and Tilford 1981 (tidy trees), Venn 1880, Buzan 1974
(mind maps), Novak and Gowin 1984 (concept maps), Priestley 1765 (the timeline), McCallum 1855 (the first org chart),
Fruchterman and Reingold 1991 (force-directed network drawing).

Words for the kinds (schema, `core.word ... of=k.diagrams.kind.name`, 38 words): the other names a request uses for a
kind ("a hierarchy of the parts of a car" is a tree; flow chart, cycle diagram, concept map, organigram, comparison
chart). w.lang.en's lexicon `diagram.kind`, which its diagram frames name ("make a flowchart of making tea"), is these
words and the kinds' names, derived by tools/lang-en-diagram-frames.mjs.

## How a host uses it

A topic and a kind: the kind's fills say which facts make its nodes and edges (the frog's stages of
`k.time.stage` with `next` make a cycle; the steps of a method of `k.procedures` with `after` make a flowchart); the
kind gives the diagram's `form`, its first `layout`, each node's `role`, and `k.diagrams.shape` the shape for that
role; `arranged` names the k.layouts layout whose relations place the nodes (ring: around a centre, evenly spaced).
`tests/k.diagrams.test.mjs` builds both diagrams in a `w.diagram` session from these facts alone. The cycles of
nature (life cycles of a frog, a butterfly and a plant; the water cycle) are `k.time.stage` facts (k.time version 5).

## Limits

- No world of the catalog says who reports to whom: the org chart has no fill.
- A Venn diagram's sets are groups of `w.diagram`; which kinds overlap is read from `k.kinds.parent` (a thing with two
  parents lies in both), not written here.
- The layouts are named; computing positions is the library's (std.space), from the k.layouts relations.
