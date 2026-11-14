# w.timeline: a timeline

A **world schema** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. Four
denies keep its events in order; it has no function of its own. Source `hand-core 1`, CC0-1.0. Version 2.

Events in order of time: the life of a person, the history of a town, the plan of a project, a day.

- `w.timeline.timeline`: `name` (required), `unit` (year, month, week, day, hour, minute; default year), `from`, `to`.
- Every number (`from`, `to`, `at`, `until`) lies between -10000 and 10000: the years from 10,000 BC to AD 10,000, or
  the days, hours or minutes of a plan (10,000 minutes are about a week). A slip ("19690") is refused with the bound.
- `w.timeline.event`: `title` (required), `timeline`, `at` (required: when, a number in the unit of the timeline), `until` (where an event that lasts ends), `sort` (birth, battle, milestone), `about`, `certain` (default true).
- Acts: make, remove, change, pick, ask, copy on both; connect and group on events ("leads to"; an age, a phase). At most 20 timelines, 1,000 events.
- Found by: timeline, time line, chronology, history, schedule.
- **An event is inside its timeline** (denies, version 2): `at` is not before the timeline's `from` nor after its
  `to`, and an event that lasts ends (`until`) by `to`; and an event does not end before it begins (`until` is not
  before `at`). Whichever side moves, the event or an end of its timeline, a change that would break one is refused
  with the reason ("An event is inside its timeline: 1712 is before its start, 1901."). An event on no timeline, or a
  timeline without ends, has the range only.
- Not said here: dates with month and day (a number in one unit only; `k.time` has the months); that `from` is not
  after `to` (a timeline with its ends swapped can hold no event, so it shows itself at once).

## How to use it

```js
const w = new World({ library: { 'w.timeline': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION, 0.30.0 or later)
w.load('@acts core.use world=std.acts');
w.use('w.timeline');
w.act({ action: 'make', args: { kind: 'w.timeline.timeline', name: 'my first' } });
```

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs`. The names of kinds are
written in full (`w.timeline.…`); a host gets from a word of the user ("guest", "item") to the kind by the `core.word`
facts of the schema.
