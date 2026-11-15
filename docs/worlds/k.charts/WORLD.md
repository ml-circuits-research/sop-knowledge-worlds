# k.charts

**Which chart fits which data** (block 15:35 item 2), as facts from the visualisation literature, hand-written
(`hand-core 1`, CC0-1.0) by `tools/charts-core.mjs`, each citing the works it rests on (`k.charts.source`):

- Mackinlay, J. (1986). Automating the design of graphical presentations of relational information. *ACM Transactions
  on Graphics* 5(2), 110-141: **expressiveness** (a chart expresses all the facts of the data and only those: the data
  types each axis takes) and **effectiveness** (encodings ranked per data type: quantitative, ordinal, nominal).
- Cleveland, W. S., and McGill, R. (1984). Graphical perception. *Journal of the American Statistical Association*
  79(387), 531-554: the ranking of encodings of quantities by how accurately they are read (position on a common scale,
  position on unaligned scales, length, angle, area, volume, shading).
- Few, S. (2012). *Show Me the Numbers* (2nd ed.): the relationships data shows (time series, ranking, part-to-whole,
  deviation, distribution, correlation, nominal comparison) and the graphs for each; Few, S. (2007). Save the pies for
  dessert: a pie only for a few parts of one whole. Zelazny, G. (1985). *Say It with Charts*: five of the same kinds of
  comparison.

| Type | Identity | Says |
| --- | --- | --- |
| `k.charts.kind` | `name` | `form` (the form of w.chart that draws it), `mark`, `encoding`, `x` and `y` (the data types of the axes: nominal, ordinal, quantitative, time), `whole` (the values are the parts of one whole), `about`, `source` |
| `k.charts.encoding` | `name` | `about` (position, length, angle, area, colour hue ...) |
| `k.charts.rank` | `encoding`, `data`, `source` | `rank` (1: read most accurately) |
| `k.charts.relationship` | `name` | `about`, `source` |
| `k.charts.rule` | `relationship`, `kind` | `rank` among the kinds for that relationship; conditions `categories_max`, `series` (one or several), `points_min`; `about` why; `source` |

9 kinds (bar, grouped bar, stacked bar, line, area, pie, scatter, dot plot, histogram), 14 encodings in 4 rankings,
7 relationships, 15 rules. Its English words (chart names, "share of a whole", "trend over time") are in w.lang.en
(shard `words-k.charts`, KR3).

## How a host uses it

A planner that has data to chart says what it shows (a relationship), how many categories, series and points it has:
the rules of that relationship whose conditions hold give the kinds, best first, and each kind's `form` is the w.chart
form to make; the kind's `x` and `y` must take the data's types (expressiveness). Examples (tools/charts-core.mjs
`chartsFor`, tests/k.charts.test.mjs): a share of a whole in 4 parts gives the pie chart, then the bar chart; in 9 parts
the bar chart only; several wholes the stacked bar chart; a trend over 12 months the line chart; two quantities of each
item the scatter plot.

## Limits

- The relationship of the data is the host's to say (from what the user asked or from the facts it charts); no rule
  here reads data to guess it.
- Kinds w.chart cannot draw yet (box plot, heat map, bullet graph) are left out until it can.
