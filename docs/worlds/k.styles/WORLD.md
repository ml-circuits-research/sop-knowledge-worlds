# k.styles: named visual styles

**Colour themes and palettes** for pictures made of shapes and lines (diagrams, charts, drawings), hand-written
(`hand-core 1`, CC0-1.0).

| Type | Identity | Says |
| --- | --- | --- |
| `k.styles.theme` | `name` | `about`, `fill`, `outline`, `text`, `edge` (lines), `background`, `group` (inside a frame), `weight` (labels: normal, bold), `width` (lines) |
| `k.styles.role` | `theme`, `role` | `fill`, `outline`, `text` for the shapes of one role (a flowchart's start, decision, data ...) |
| `k.styles.swatch` | `theme`, `n` | `colour`: the theme's palette in order |

11 themes: classic, pastel, dark, blueprint, monochrome, highlight, vivid, ocean, forest, sunset, flowchart (with a
colour for each flowchart role). Colours are `#rrggbb` values. Its English words (theme, colour scheme, palette and
the theme names: dark mode, black and white, pastels) are in its own shard `words`.

## How a host uses it

A diagram editor applies a theme by copying its colours onto the shapes and lines a request names ("make it pastel",
"highlight the decision nodes": the `highlight` theme on the nodes whose role is decision), lets later shapes follow
the page's theme, and colours categories by a palette in order ("colour each level differently": the swatch at the
level's place, round again after the last). A chart takes its slices' colours from a palette.

Questions it helps with: which colours make a dark theme; what a blueprint looks like; which colour the third
category takes in the vivid palette.
