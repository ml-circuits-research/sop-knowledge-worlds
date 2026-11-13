# w.timeline: a timeline

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1`, CC0-1.0.

Events in order of time: the life of a person, the history of a town, the plan of a project, a day.

- `w.timeline.timeline`: `name` (required), `unit` (year, month, week, day, hour, minute; default year), `from`, `to`.
- `w.timeline.event`: `title` (required), `timeline`, `at` (required: when, a number in the unit of the timeline), `until` (where an event that lasts ends), `sort` (birth, battle, milestone), `about`, `certain` (default true).
- Acts: make, remove, change, pick, ask, copy on both; connect and group on events ("leads to"; an age, a phase). At most 20 timelines, 1,000 events.
- Found by: timeline, time line, chronology, history, schedule.
- Not said here: that `until` is not before `at`; dates with month and day (a number in one unit only; `k.time` has the months).

## How to use it

```js
const w = new World({ library: { 'w.timeline': schemaText } });   // sopworld with std.schema (tools/sopworld/w/VERSION)
w.load('@acts core.use world=std.acts');
w.use('w.timeline');
w.act({ action: 'make', args: { kind: 'w.timeline.timeline', name: 'my first' } });
```

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs`. The names of kinds are
written in full (`w.timeline.…`); a host gets from a word of the user ("guest", "item") to the kind by the `core.word`
facts of the schema.
