# w.list: a list

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1`, CC0-1.0.

Lists of items in order, which can be ticked off: a shopping list, a to-do list, a packing list.

- `w.list.list`: `name` (required), `about`.
- `w.list.item`: `text` (required), `list` (its list), `n` (its place, from 1), `done` (default false), `amount`, `note`.
- Acts: make, remove, change, pick, ask, copy on both kinds. At most 20 lists and 500 items.
- Found by: list, shopping list, to-do list, checklist, packing list.

## How to use it

```js
const w = new World({ library: { 'w.list': schemaText } });   // sopworld with std.schema (tools/sopworld/w/VERSION)
w.load('@acts core.use world=std.acts');
w.use('w.list');
w.act({ action: 'make', args: { kind: 'w.list.list', name: 'my first' } });
```

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs`. The names of kinds are
written in full (`w.list.…`); a host gets from a word of the user ("guest", "item") to the kind by the `core.word`
facts of the schema.
