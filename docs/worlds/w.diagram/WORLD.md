# w.diagram: a diagram of nodes, edges and groups

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change diagrams,
written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It has no function
of its own; two denies keep one code per thing of a kind and one membership per node and group. Source `hand-core 1`, CC0-1.0. Asked for by the reviewer (block "04:40").

- `w.diagram.diagram`: `title`, `form` (flowchart, tree, cycle, timeline, mind_map, venn, org_chart, network, pipeline,
  table; default flowchart; not `kind`, an argument of `make`), `layout` (top_down, left_right, radial, circular, grid,
  overlapping, free), `topic`.
- `w.diagram.node`: `label` (required), `diagram`, `role` (start, end, process, decision, data, document, subprocess,
  connector, root, item, stage, event, centre, branch, post, node, row, column, cell), `shape` (oval, rectangle,
  rounded_rectangle, diamond, parallelogram, document, double_rectangle, circle, ellipse, dot, chevron), `parent` (a
  node: trees, org charts, mind maps), `group` (groups, many: a Venn diagram's sets), `n` (order), `x`, `y`, `colour`.
- `w.diagram.edge`: `from`, `to` (nodes, required), `label` (yes, no, then), `direction` (forward, both, none; default
  forward), `diagram`.
- `w.diagram.group`: `label` (required), `diagram`, `shape` (circle, ellipse, rectangle, rounded_rectangle; default
  circle), `parent` (a group: nested groups).
- For an editor (a diagram tab whose state is a w.diagram instance): `code` on nodes, edges and groups (unique per
  kind); on nodes `size` (tiny, small, medium, large, huge), `width`, `height`, `value`, `pinned` and the shapes
  square, triangle, hexagon, star, text; on edges `n`, `colour`, `style` (solid, dashed, dotted), `width`; on groups
  `n`, `colour`, `layout` (row, column, grid, bar, line), `framed`, `scale`, `x`, `y`, `pinned`.
- For an editor's page and style: on the diagram `arrange` (tree, layered, row, column, grid, circle, radial, free),
  `direction` (down, right, up, left), `spacing` (compact, normal, loose), `route` (orthogonal, straight, curved),
  `theme` (a `k.styles` theme), `background`, `numbered`, `code`; on nodes `outline`, `text_colour`, `font_size`,
  `font_weight` (normal, bold), the roles database, actor, note, external and the shapes cylinder, cloud, actor,
  note; on edges the direction `back` and `route`; group layouts circle, pie and doughnut.
- `w.diagram.member`: `group`, `node` (required): a membership as a thing, made and removed by an editor (std.acts
  cannot take a reference away, and removing a group removes what refers to it); `node group=` stays the plain form.
- Acts: make, remove, change, pick, ask, copy on diagrams and groups; also place, connect, group on nodes; make,
  remove, change, pick, ask on edges; make, remove, pick, ask on memberships. At most 20 diagrams, 500 nodes, 1,000
  edges, 100 groups, 1,000 memberships.
- Found by: diagram, flowchart, flow chart, cycle diagram, tree diagram, mind map, venn diagram, org chart,
  organisation chart, network diagram, process diagram, concept map.

What each kind of diagram is, how it is laid out, how each node is drawn and which knowledge fills it is `k.diagrams`
(the values of `form`, `layout`, `role` and `shape` here are the values it names; a test keeps them equal). Its
structures for alignment are in `k.kinds` (graph, whole with parts, sequence, cycle, placement).

What it does not say: that an edge joins two nodes of its own diagram, that a cycle closes, that a tree has one root;
each needs a rule over several things (a library function), not data. The pinned build does not refuse a `make` that
leaves a required key out (an edge without `to`).

A session is in `tests/w.schemas.test.mjs`; two diagrams made from the catalog's knowledge in `tests/k.diagrams.test.mjs`.
