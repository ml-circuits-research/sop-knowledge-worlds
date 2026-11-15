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

## Version 3 (reviewer, Q82: one schema for PSys2 and the catalog)

- A guest is **at a table** (`guest.table`, a w.seating.table); the seat is optional (`guest.seat`), and a deny keeps a
  guest on a seat at that seat's table ("A guest on a seat is at the table of that seat.").
- A table holds at most its `seats` **guests** (std.schema.capacity holds=w.seating.guest via=table; version 2 counted
  seats, and the engine takes one capacity per kind). `seats` has no schema default: a table's usual size is the typical
  range of k.attributes (4 to 10).
- `colour` on table and guest: one of the 11 basic colours, joined to `k.colours.basic` (the list stays until the
  library refuses a value that meets no join target).
- English: "add a guest called Ann at table 1" (acts.make.name.place), "make table 1 blue" (a value of the colour list),
  "add a table for 4" (acts.make.for with the template make.for, attribute seats; shard capacity-frames); Romanian:
  "Adaugă un invitat numit Ana la masa 1", "Adaugă o masă pentru 4" (w.lang.ro shard seating-frames), "Fă masa 1
  albastră" (ro.change.value). What still differs from PSys2's plan.seating is in questions.md (Q85 [PSYS2]).
