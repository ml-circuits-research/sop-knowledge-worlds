# w.seating: a seating plan

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1`, CC0-1.0.

Tables, their seats, and the guests who sit on them: a wedding, a class, a dinner.

- `w.seating.table`: `name` (required), `shape` (round, square, long; default round), `seats` (how many it is meant to have).
- `w.seating.seat`: `table` (required), `n` (its place at the table).
- `w.seating.guest`: `name` (required), `seat`, `party` (whom the guest came with), `needs` (many), `note`.
- Acts: make, remove, change, pick, ask, copy on tables and seats; make, remove, change, connect, group, pick, ask on guests (connect: "next to", "not next to"). At most 50 tables, 500 seats, 500 guests.
- Found by: seating plan, seating chart, seating, table plan, who sits where.
- Not said here (it would need a rule or a function, which belong to the library): that two guests are not on one seat, that a table has no more seats than `seats`.

## How to use it

```js
const w = new World({ library: { 'w.seating': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION, 0.30.0 or later)
w.load('@acts core.use world=std.acts');
w.use('w.seating');
w.act({ action: 'make', args: { kind: 'w.seating.table', name: 'my first' } });
```

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs`. The names of kinds are
written in full (`w.seating.…`); a host gets from a word of the user ("guest", "item") to the kind by the `core.word`
facts of the schema.
