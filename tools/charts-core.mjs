// k.charts (block 15:35 item 2): which chart fits which data, as facts from the visualisation literature, hand-written
// here (hand-core 1, CC0) with the works each rests on:
//  - the kinds of chart, the w.chart form that draws each, the data types of its axes (Mackinlay 1986, expressiveness:
//    a bar chart takes categories, a line chart an ordered axis, a pie chart the parts of one whole);
//  - the encodings ranked for accuracy: Cleveland and McGill 1984 (quantitative values: position on a common scale,
//    position on unaligned scales, length, angle, area, volume, shading) and Mackinlay 1986 (quantitative, ordinal and
//    nominal data);
//  - the relationships data shows (Few 2012: time series, ranking, part-to-whole, deviation, distribution,
//    correlation, nominal comparison; Zelazny 1985 named five of them), and the rules from each to the kinds that
//    show it, best first, with their conditions (a pie chart for a few parts of one whole: Few 2007).
//  - the typical categories of the dimensions charts are broken down by (months, quarters, regions, roles, payment
//    methods ...): conventional values a host draws, with sample values said to be a sample, when a chart is asked for
//    by its dimension alone ("a bar chart of sales by month") and no data is given.
//   node tools/charts-core.mjs     writes docs/worlds/k.charts/shards/charts.sop and categories.sop
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text } from './import/lib.mjs';

export const SHARD = join(WORLDS_DIR, 'k.charts', 'shards', 'charts.sop');
export const CATEGORY_SHARD = join(WORLDS_DIR, 'k.charts', 'shards', 'categories.sop');
const SRC = 'hand-core 1';
// name, cite, year
export const SOURCES = [
  ['mackinlay1986', 'Mackinlay, J. (1986). Automating the design of graphical presentations of relational information. ACM Transactions on Graphics, 5(2), 110-141.', 1986],
  ['cleveland1984', 'Cleveland, W. S., and McGill, R. (1984). Graphical perception: theory, experimentation, and application to the development of graphical methods. Journal of the American Statistical Association, 79(387), 531-554.', 1984],
  ['few2012', 'Few, S. (2012). Show Me the Numbers: Designing Tables and Graphs to Enlighten (2nd ed.). Analytics Press.', 2012],
  ['few2007', 'Few, S. (2007). Save the pies for dessert. Visual Business Intelligence Newsletter, August 2007.', 2007],
  ['shneiderman1992', 'Shneiderman, B. (1992). Tree visualization with tree-maps: 2-d space-filling approach. ACM Transactions on Graphics, 11(1), 92-99.', 1992],
  ['zelazny1985', 'Zelazny, G. (1985). Say It with Charts: The Executive\'s Guide to Visual Communication. Dow Jones-Irwin.', 1985],
];
// name, about
export const ENCODINGS = [
  ['position', 'where a mark stands along an axis'], ['position unaligned', 'where a mark stands along one of several scales that are not aligned'],
  ['length', 'how long a mark is'], ['angle', 'the angle a mark makes (a slice of a pie)'], ['slope', 'how steep a line is'],
  ['area', 'how large a surface is'], ['volume', 'how large a solid is'], ['density', 'how dark a shade of grey is'],
  ['colour saturation', 'how strong a colour is'], ['colour hue', 'which colour a mark has'], ['texture', 'the pattern that fills a mark'],
  ['connection', 'a line joining marks'], ['containment', 'a mark inside another'], ['shape', 'the shape of a mark'],
];
// the rankings, most accurate first: [source, data, [encodings]]
export const RANKINGS = [
  ['cleveland1984', 'quantitative', ['position', 'position unaligned', 'length', 'angle', 'area', 'volume', 'density']],
  ['mackinlay1986', 'quantitative', ['position', 'length', 'angle', 'slope', 'area', 'volume', 'density', 'colour saturation', 'colour hue', 'texture', 'connection', 'containment', 'shape']],
  ['mackinlay1986', 'ordinal', ['position', 'density', 'colour saturation', 'colour hue', 'texture', 'connection', 'containment', 'length', 'angle', 'slope', 'area', 'volume']],
  ['mackinlay1986', 'nominal', ['position', 'colour hue', 'texture', 'connection', 'containment', 'density', 'colour saturation', 'shape', 'length', 'angle', 'slope', 'area', 'volume']],
];
// name, form, mark, encoding, x types, y types, whole, about, sources
export const KINDS = [
  ['bar chart', 'bar', 'bar', 'length', ['nominal', 'ordinal', 'time'], ['quantitative'], false, 'one bar per category, its length the value; the most accurate way to compare values of categories after position', ['cleveland1984', 'few2012']],
  ['grouped bar chart', 'bar', 'bar', 'length', ['nominal', 'ordinal', 'time'], ['quantitative'], false, 'bars of several series side by side in each category', ['few2012']],
  ['stacked bar chart', 'bar', 'bar', 'length', ['nominal', 'ordinal', 'time'], ['quantitative'], true, 'one bar per whole, divided into its parts; compares the parts of several wholes', ['few2012', 'zelazny1985']],
  ['line chart', 'line', 'line', 'position', ['time', 'ordinal', 'quantitative'], ['quantitative'], false, 'values joined in the order of the axis; its slope shows the change', ['few2012', 'cleveland1984']],
  ['area chart', 'area', 'area', 'position', ['time', 'ordinal', 'quantitative'], ['quantitative'], true, 'a line chart filled below; stacked, the parts of a whole over time', ['few2012']],
  ['pie chart', 'pie', 'slice', 'angle', ['nominal'], ['quantitative'], true, 'one slice per part of one whole, its angle the share', ['few2007', 'cleveland1984']],
  ['scatter plot', 'scatter', 'point', 'position', ['quantitative'], ['quantitative'], false, 'one point per item at its two values; shows whether two quantities vary together', ['few2012', 'cleveland1984']],
  ['dot plot', 'scatter', 'point', 'position', ['nominal', 'ordinal'], ['quantitative'], false, 'one dot per category at its value on a common scale', ['cleveland1984', 'few2012']],
  ['treemap', 'treemap', 'rectangle', 'area', ['nominal'], ['quantitative'], true, 'one rectangle per part, its area its share of the whole, the rectangles filling one frame; shows the parts of a whole when there are many', ['shneiderman1992', 'few2012']],
  ['histogram', 'bar', 'bar', 'length', ['quantitative'], ['quantitative'], false, 'bars over ranges of a quantity, their length how many values fall in each', ['few2012', 'zelazny1985']],
];
// name, about, sources
export const RELATIONSHIPS = [
  ['time series', 'how values change over time', ['few2012', 'zelazny1985']],
  ['ranking', 'values in order of size', ['few2012']],
  ['part-to-whole', 'the shares of a whole', ['few2012', 'zelazny1985']],
  ['deviation', 'how values differ from a reference (a target, an average)', ['few2012']],
  ['distribution', 'how many values fall in each range of a quantity', ['few2012', 'zelazny1985']],
  ['correlation', 'whether two quantities vary together', ['few2012', 'zelazny1985']],
  ['nominal comparison', 'the values of categories that have no order', ['few2012', 'zelazny1985']],
];
// relationship, kind, rank, conditions { categories_max, series, points_min }, about, sources
export const RULES = [
  ['time series', 'line chart', 1, { points_min: 3 }, 'the slope between points shows the change; position is read most accurately', ['few2012', 'cleveland1984']],
  ['time series', 'bar chart', 2, {}, 'bars for a few separate periods, when the values themselves matter more than the trend', ['few2012']],
  ['time series', 'area chart', 3, {}, 'a filled line, for one series or the parts of a whole over time', ['few2012']],
  ['ranking', 'bar chart', 1, {}, 'bars sorted by length make the order plain', ['few2012', 'cleveland1984']],
  ['ranking', 'dot plot', 2, {}, 'dots on a common scale, sorted', ['few2012', 'cleveland1984']],
  ['part-to-whole', 'pie chart', 1, { categories_max: 5, series: 'one' }, 'a few parts of one whole: the slices say "share of a whole" at a glance; with more parts angles are hard to compare', ['few2007', 'cleveland1984']],
  ['part-to-whole', 'stacked bar chart', 1, { series: 'several' }, 'the parts of several wholes, one bar per whole', ['few2012', 'zelazny1985']],
  ['part-to-whole', 'bar chart', 2, { series: 'one' }, 'the parts as bars: lengths are read more accurately than angles', ['few2007', 'cleveland1984']],
  ['deviation', 'bar chart', 1, {}, 'bars above and below the reference line', ['few2012']],
  ['deviation', 'line chart', 2, { points_min: 3 }, 'the deviation over time, the reference as a line', ['few2012']],
  ['distribution', 'histogram', 1, {}, 'bars over ranges of the quantity', ['few2012', 'zelazny1985']],
  ['correlation', 'scatter plot', 1, {}, 'one point per item at its two values', ['few2012', 'zelazny1985', 'cleveland1984']],
  ['nominal comparison', 'bar chart', 1, {}, 'one bar per category; length on a common baseline', ['few2012', 'cleveland1984']],
  ['nominal comparison', 'grouped bar chart', 1, { series: 'several' }, 'the categories of several series side by side', ['few2012']],
  ['nominal comparison', 'dot plot', 2, {}, 'dots on a common scale when bars would not start at zero', ['cleveland1984', 'few2012']],
];

// dimension, its categories in the usual order (conventional values; the dimensions charts of business, school,
// survey and web data are most often broken down by)
export const CATEGORIES = [
  ['month', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']],
  ['quarter', ['Q1', 'Q2', 'Q3', 'Q4']],
  ['week', ['Week 1', 'Week 2', 'Week 3', 'Week 4']],
  ['weekday', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']],
  ['day', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']],
  ['year', ['2021', '2022', '2023', '2024', '2025']],
  ['season', ['Spring', 'Summer', 'Autumn', 'Winter']],
  ['shift', ['Morning', 'Afternoon', 'Night']],
  ['region', ['North', 'South', 'East', 'West']],
  ['continent', ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']],
  ['country', ['France', 'Germany', 'Italy', 'Spain', 'Poland']],
  ['city', ['London', 'Paris', 'Berlin', 'Madrid']],
  ['department', ['Sales', 'Marketing', 'Engineering', 'Finance', 'Support']],
  ['team', ['Team A', 'Team B', 'Team C', 'Team D']],
  ['role', ['Manager', 'Engineer', 'Analyst', 'Designer']],
  ['rank', ['Junior', 'Mid-level', 'Senior', 'Lead']],
  ['level', ['Beginner', 'Intermediate', 'Advanced']],
  ['grade', ['A', 'B', 'C', 'D', 'F']],
  ['status', ['Open', 'In progress', 'Done', 'Blocked']],
  ['priority', ['Low', 'Medium', 'High', 'Critical']],
  ['size', ['Small', 'Medium', 'Large']],
  ['sex', ['Female', 'Male']],
  ['gender', ['Female', 'Male', 'Other']],
  ['age group', ['18-24', '25-34', '35-44', '45-54', '55+']],
  ['age', ['18-24', '25-34', '35-44', '45-54', '55+']],
  ['education', ['Secondary', 'Bachelor', 'Master', 'Doctorate']],
  ['payment method', ['Card', 'Cash', 'Bank transfer', 'Mobile']],
  ['payment', ['Card', 'Cash', 'Bank transfer', 'Mobile']],
  ['channel', ['Online', 'Store', 'Phone', 'Partner']],
  ['source', ['Search', 'Social', 'Email', 'Direct']],
  ['device', ['Desktop', 'Mobile', 'Tablet']],
  ['platform', ['Web', 'iOS', 'Android']],
  ['browser', ['Chrome', 'Safari', 'Firefox', 'Edge']],
  ['language', ['English', 'Spanish', 'French', 'German']],
  ['subject', ['Mathematics', 'Science', 'History', 'Languages']],
  ['course', ['Mathematics', 'Physics', 'History', 'Biology']],
  ['genre', ['Rock', 'Pop', 'Jazz', 'Classical']],
  ['colour', ['Red', 'Blue', 'Green', 'Yellow']],
  ['rating', ['1 star', '2 stars', '3 stars', '4 stars', '5 stars']],
  ['product', ['Product A', 'Product B', 'Product C', 'Product D']],
  ['category', ['Category A', 'Category B', 'Category C', 'Category D']],
];

export function categoryShardText() {
  const lines = [];
  for (const [dimension, labels] of CATEGORIES) labels.forEach((label, i) => lines.push(wire(`k.charts.category.${seg(dimension)}.${i + 1}`, 'k.charts.category', [['dimension', dimension], ['n', i + 1], ['label', text(label)]], SRC)));
  return `${header({ id: 'k.charts/shards/categories', about: `the typical categories of ${CATEGORIES.length} dimensions charts are broken down by (${lines.length} categories): conventional values, drawn with sample values when a chart is asked for by its dimension alone.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/charts-core.mjs)'], license: 'CC0-1.0', script: 'tools/charts-core.mjs' })}\n${lines.join('\n')}\n`;
}

export function shardText() {
  const lines = [];
  for (const [name, cite, year] of SOURCES) lines.push(wire(`k.charts.source.${name}`, 'k.charts.source', [['name', name], ['cite', text(cite)], ['year', year]], SRC));
  for (const [name, about] of ENCODINGS) lines.push(wire(`k.charts.encoding.${seg(name)}`, 'k.charts.encoding', [['name', name], ['about', text(about)]], SRC));
  for (const [source, data, list] of RANKINGS) list.forEach((e, i) => lines.push(wire(`k.charts.rank.${source}.${data}.${seg(e)}`, 'k.charts.rank', [['encoding', e], ['data', data], ['source', source], ['rank', i + 1]], SRC)));
  for (const [name, form, mark, encoding, x, y, whole, about, sources] of KINDS) lines.push(wire(`k.charts.kind.${seg(name)}`, 'k.charts.kind', [['name', name], ['form', form], ['mark', mark], ['encoding', encoding],
    ...x.map((t) => ['x', t]), ...y.map((t) => ['y', t]), ['whole', whole || undefined], ['about', text(about)], ...sources.map((s) => ['source', s])], SRC));
  for (const [name, about, sources] of RELATIONSHIPS) lines.push(wire(`k.charts.relationship.${seg(name)}`, 'k.charts.relationship', [['name', name], ['about', text(about)], ...sources.map((s) => ['source', s])], SRC));
  for (const [rel, kind, rank, c, about, sources] of RULES) lines.push(wire(`k.charts.rule.${seg(rel)}.${seg(kind)}`, 'k.charts.rule', [['relationship', rel], ['kind', kind], ['rank', rank],
    ['categories_max', c.categories_max], ['series', c.series], ['points_min', c.points_min], ['about', text(about)], ...sources.map((s) => ['source', s])], SRC));
  return `${header({ id: 'k.charts/shards/charts', about: `which chart fits which data: ${KINDS.length} kinds of chart, ${ENCODINGS.length} encodings ranked in ${RANKINGS.length} rankings, ${RELATIONSHIPS.length} relationships of data, ${RULES.length} selection rules, and the ${SOURCES.length} works they rest on.`,
    sources: ['hand-core 1 (hand-written in this repository: tools/charts-core.mjs; the works cited are the k.charts.source facts)'], license: 'CC0-1.0', script: 'tools/charts-core.mjs' })}\n${lines.join('\n')}\n`;
}

// The kinds for data that shows `relationship` with so many categories, series and points, best first.
export function chartsFor({ relationship, categories, series = 1, points }) {
  return RULES.filter(([rel, , , c]) => rel === relationship
    && (c.categories_max === undefined || categories === undefined || categories <= c.categories_max)
    && (c.series === undefined || c.series === (series > 1 ? 'several' : 'one'))
    && (c.points_min === undefined || points === undefined || points >= c.points_min))
    .sort((a, b) => a[2] - b[2]).map(([, kind]) => kind);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(join(WORLDS_DIR, 'k.charts', 'shards'), { recursive: true });
  const t = shardText();
  writeFileSync(SHARD, t);
  console.log(`charts.sop: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`);
  const c = categoryShardText();
  writeFileSync(CATEGORY_SHARD, c);
  console.log(`categories.sop: ${c.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(c)} bytes`);
}
