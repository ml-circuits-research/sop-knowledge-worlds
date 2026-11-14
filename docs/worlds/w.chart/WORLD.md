# w.chart: a chart of numbers

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1`, CC0-1.0. Asked for by the reviewer (block "11:35",
Q45 (ii)).

Charts of numbers: a bar chart of sales by month, a pie chart of favourite fruits, a line chart of temperatures.

- `w.chart.chart`: `title`, `form` (bar, line, pie, scatter, area; default bar; not `kind`, an argument of `make`), `x_label`, `y_label`, `unit` (a unit
  of k.units, by name).
- `w.chart.series`: `name`, `chart` (its chart), `colour`, `n` (its place among the series, from 1).
- `w.chart.point`: `category` (where it stands on the other axis: a month, a fruit), `value` (required, a number),
  `series` (its series), `n` (its place in the series, from 1).
- Acts: make, remove, change, pick, ask, copy on charts and series; make, remove, change, pick, ask on values. At
  most 20 charts, 100 series and 2,000 values.
- Found by: chart, graph, bar chart, pie chart, line chart, line graph, bar graph, plot.

A chart of the things in a picture is a method of `k.procedures` with `world=w.chart` ("a chart of the things there
in a chart": count the things of each kind, make a bar chart, one series of counts, one value per kind), the second
alternative next to the list of counts in `w.list` (questions.md Q45).

What it does not say: that a pie chart has one series and no negative values, or that the categories of the series
of one chart are the same; each needs a rule over several things (a library function), not data.

## How to use it

```js
const w = new World({ library: { 'w.chart': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION)
w.load('@acts core.use world=std.acts');
w.use('w.chart');
w.act({ action: 'make', args: { kind: 'w.chart.chart', title: 'sales' } });
```

The catalog lists it under `schemas` in `index.json`, and its words are in `vocab.json` with the path of the schema.
A session is in `tests/w.schemas.test.mjs`.
