# w.tasks: tasks to do

A **reusable world** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1` (own), CC0-1.0. PSys2 Q18 K2 (real row r0590 "i should
call grandma"; the 25 sentences of PSys2's kids.tasks world).

Tasks to do (homework, call grandma, water the plants), each open or done, with a due date, an owner and a reminder,
standing in order on a to-do list.

- `w.tasks.task`: `text` (required: what is to be done, as the user said it), `status` (open or done; default open),
  `list` (the list it stands on: a `w.list.list`, sort to-do), `n` (its place on that list, from 1), `due` (when it is
  to be done by), `reminder` (when to remind of it), `owner` (who is to do it: Ana; me), `note`.
- `due` and `reminder` are an ISO 8601 date, time or date and time (2026-11-20, 17:00, 2026-11-20T17:00) or a word of
  k.time (Friday, tomorrow, evening), which the library's std.time reads (PSys2 Q18 L2: today and now come from the
  host).
- Acts: make, remove, change, group, pick, ask, copy. At most 1,000 tasks.
- Found by: tasks, task list, chores, reminders, things to do, to-dos.

**Done is a state that acts change.** `status` is a closed set (open, done): the act `change` sets it and refuses any
other value with the two allowed; `pick` and `ask` read it; `undo` takes a change back. In English (w.lang.en, shard
`list-frames`, PSys2 Q18 K6): "I (just) finished my homework" and "my homework is done" are `change` of `status` to
done; "I didn't finish my homework" is `change` in the mode `not`, status open (nothing is ticked off); "what is left
to do", "what's still open" ask for the open tasks; "did I finish my homework" asks for one task's status; "set a
reminder to water the plants" and "remind me to …" make a reminder; "I should call grandma" makes a task. Which act
and turn set a status ("why is milk done?") is the library's provenance of a value (PSys2 Q18 L3), not a key.

**One home for lists.** A task stands on a list of `w.list` (the schema imports w.list; the catalog's entry says
`depends: ["w.list"]`): a to-do list is a `w.list.list` with sort to-do, so "which lists do I have" counts it once,
whether its entries are tasks or plain entries. A host loads w.list with w.tasks.

Where the words come from: iCalendar's to-do (RFC 5545, the VTODO component): `text` is its SUMMARY, `status` its
STATUS (open is NEEDS-ACTION, done is COMPLETED; IN-PROCESS and CANCELLED are not asked for yet), `due` its DUE,
`reminder` the TRIGGER of its VALARM, `owner` its ATTENDEE (the one who is to do it); `n` is the position on the list,
the name every w.* schema uses for a place in an order.

## How to use it

```js
const w = new World({ library: { 'w.list': listText, 'w.tasks': tasksText } });   // sopworld with std.schema (tools/sopworld/VERSION)
w.load('@acts core.use world=std.acts');
w.use('w.tasks');                                                                    // imports w.list
w.act({ action: 'make', args: { kind: 'w.list.list', name: 'to do', sort: 'to-do' } });
w.act({ action: 'make', args: { kind: 'w.tasks.task', text: 'call grandma', list: '$w_list_list1', n: 1 } });
w.act({ action: 'change', args: { thing: 'w_tasks_task1', attr: 'status', value: 'done' } });   // "I called grandma"
w.act({ action: 'pick', args: { kind: 'w.tasks.task', status: 'open' } });                       // "what is left to do?"
```

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes, depends), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs`.
