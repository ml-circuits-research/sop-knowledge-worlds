# w.seating: a seating plan

A **world schema** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1`, CC0-1.0. Version 2.

Tables, their seats, and the guests who sit on them: a wedding, a class, a dinner.

- `w.seating.table`: `name` (required), `shape` (round, square, long; default round), `seats` (how many seats it has room for), `x` and `y` (where it stands in the room).
- `w.seating.seat`: `table` (required), `n` (its place at the table).
- `w.seating.guest`: `name` (required), `seat`, `party` (whom the guest came with), `needs` (many), `note`.
- Acts: on tables make, remove, change, place (sets `x`), connect ("next to", "far from"), group (the tables in the
  garden), pick, ask, copy; on seats make, remove, change, pick, ask, copy; on guests make, remove, change, place,
  connect ("next to", "not next to"), group, pick, ask, copy. A guest is placed on a seat through its `seat` slot:
  `place thing=<guest> at=<seat>` (sopworld 0.33 or later; with 0.30, `change attr=seat value=$<seat>`).
- A table holds at most its `seats` seats (`std.schema.capacity`): one seat more is refused ("w_seating_table1 has
  room for 0 more w.seating.seats (seats 2)"), and so is a `seats` below the seats it has; a table with no `seats`
  takes any number. At most 50 tables, 500 seats, 500 guests.
- Found by: seating plan, seating chart, seating, table plan, who sits where.
- Not said here: that two guests are not on one seat. A deny could say it, but `copy` copies a guest with its seat,
  so every copy of a seated guest would be refused; whether a copy should keep a key that puts a thing into another
  is a question for the library (questions.md Q43).

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
