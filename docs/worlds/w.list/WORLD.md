# w.list: a list

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1` (own), CC0-1.0.

Lists of entries in order, which can be ticked off: a shopping list (with prices and the money to pay them), a to-do
list, a packing list. Version 3 (PSys2 Q18 K1, real rows r0598, r0599, r0622-r0627: prices and change in a shop).

- `w.list.list`: `name` (required), `about`, `sort` (shopping, to-do, any; default any); for a shopping list
  `budget` (the money there is to spend: "I start with 30 lei"), `tendered` (the money handed over at the till: "I pay
  10 lei") and `currency` (the ISO 4217 code of a `k.units.currency`: RON for lei).
- `w.list.item` (an entry): `text` (required: what it says, as the user said it), `food` (a `k.food.food` by name) or
  `object` (a `k.objects.object` by name) where the catalog knows the thing, neither for free text; `list` (its list),
  `n` (its place in the list, from 1), `quantity` (a number: how many, or how much in `unit`, a `k.units.unit` by name:
  1 litre, 2 kilogram), `price` (the price of one of it, one pencil or one kilogram, in `currency`, a
  `k.units.currency` by code), `status` (open or done; default open: the act `change` sets it, "I bought the milk"),
  `note`. Not `amount`, which the act `make` reads as how many things to make.
- Acts: make, remove, change, pick, ask, copy on both kinds. At most 20 lists and 500 entries.
- Found by: list, shopping list, to-do list, grocery list, checklist, packing list, basket.

Declared joins (`type=… by=…`, checked by the engine when the target world is loaded, left open otherwise):
`item.food` -> `k.food.food` name, `item.object` -> `k.objects.object` name, `item.unit` -> `k.units.unit` name,
`item.currency` and `list.currency` -> `k.units.currency` code. "lei" and "leu" are `core.word`s of RON in k.units,
so a host reads "10 lei" as 10 in RON.

What is **computed, never stored** (one home per fact; the library's list acts, PSys2 Q18 L3): the total of a list
(the sum of quantity x price over its entries), what is left (budget - total), the change (tendered - total), whether
a list can be bought (total <= budget). The prices themselves are an application's data (a shop's price list), not
knowledge: no k.* world holds prices.

Where the words come from: an entry is schema.org's `ListItem` (`position`: here `n`, the name every w.* schema uses for
a place in an order; `item`: here `text` with its `food` or `object`); a price with a currency is schema.org's
`Offer` (`price`, `priceCurrency`), a quantity with a unit its `QuantitativeValue` (`value`, `unitText`); the money handed
over is the *amount tendered* of point-of-sale systems. A task with a due date, an owner and a reminder is `w.tasks`,
whose tasks stand on a list of this world (sort to-do).

## How to use it

```js
const w = new World({ library: { 'w.list': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION, 0.30.0 or later)
w.load('@acts core.use world=std.acts');
w.use('w.list');
w.act({ action: 'make', args: { kind: 'w.list.list', name: 'shop', sort: 'shopping', budget: 30, currency: 'RON' } });
w.act({ action: 'make', args: { kind: 'w.list.item', text: 'pencil', object: 'pencil', quantity: 2, price: 3, currency: 'RON', list: '$w_list_list1' } });
w.act({ action: 'change', args: { thing: 'w_list_list1', attr: 'tendered', value: 10 } });   // "I give the cashier 10 lei"
```

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. Sessions are in `tests/w.schemas.test.mjs`; the English requests for it ("add
milk to my shopping list", "how much do 3 pencils cost", "I pay 10 lei", "what is the change") are frames of `w.lang.en`
(shard `list-frames`, PSys2 Q18 K6). The names of kinds are written in full (`w.list.…`); a host gets from a word of the user ("entry",
"basket") to the kind by the `core.word` facts of the schema.

Changes in version 3 for hosts: `done` (boolean) is now `status` (open, done); `quantity` is a number (with `unit`),
no longer a phrase ("a litre" is quantity 1, unit litre); new keys `sort`, `budget`, `tendered`, `currency` on a list
and `food`, `object`, `unit`, `price`, `currency` on an entry; "task" and "tasks" are words of w.tasks, not of an entry.
