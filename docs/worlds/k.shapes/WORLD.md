# k.shapes

36 shapes: flat shapes, lines and solids, with their sides and corners (or faces, edges and corners), whether they
are round, and things that typically have the shape. Hand-written (`hand-core 1`, CC0-1.0).

## What it knows

- `k.shapes.shape` (identity `name`), `kind`:
  - `flat` (21): circle, oval, semicircle, triangle, square, rectangle, diamond, parallelogram, trapezium, pentagon,
    hexagon, octagon, polygon, star, heart, crescent, cross, arrow, ring, drop, `"cloud shape"`. `sides` and
    `corners` (triangle 3 and 3, circle 0 and 0, a five-pointed star 10 and 10; left out where the number is not
    fixed: polygon, heart).
  - `line` (5): line, arc, zigzag, `"wavy line"`, spiral.
  - `solid` (10): sphere, hemisphere, `"egg shape"`, cube, cuboid, cylinder, cone, pyramid, prism, torus. `faces`,
    `edges`, `corners` (cube 6, 12, 8; cylinder 3, 2, 0; cone 2, 1, 1), `face` (the flat shape of its faces: many),
    `flat` (what one sees from the front: a sphere is drawn as a circle, a cone as a triangle).
  - `round` (true or false), `equal_sides=true`, `symmetric=true`, `is_a` (a square is a rectangle, a cube a cuboid),
    `thing` (many: circle: ball, wheel, plate, clock, pizza, button, coin).
- A fact that gives a solid `sides`, or a flat shape `faces`, is refused.
- `core.word` facts: other names (ellipse, rhombus, oblong, trapezoid, globe, tube, teardrop, half circle).

## Shards

`shapes` (36 shapes, 36 word facts; 72 wires), written by `tools/colours-shapes-core.mjs`.

## Joins

By name, with no import: the eight shapes that a `k.objects` part can have (rectangle, square, circle, oval,
triangle, line, arc, polygon) are shapes here (a test); 124 of the 128 typical things are `k.objects` drawings. 28 of the 36 shapes are named by `k.values.shape` (not:
polygon, drop, cloud shape, wavy line, hemisphere, egg shape, prism, torus).

## Questions it answers

"How many sides has a hexagon?", "How many corners has a cube?", "Is a circle round?", "What is shaped like a
cone?", "Which shapes have four sides?", "What shape are the faces of a cube?" (`tests/k.shapes.questions.jsonl`).
