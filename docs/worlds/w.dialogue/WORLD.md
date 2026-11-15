# w.dialogue: the conversation as state

A **reusable world**: a schema in the library's `std.schema` format, driven by `std.acts`, no rule and no function.
Source `hand-core 1` (own), CC0-1.0. Owner's GO, reviewer block 2026-11-15 14:00, item 2. One live instance per
session; it imports `w.request` (its requests and constraints are w.request facts).

## Kinds and exact keys

- `w.dialogue.session`: `name` (required), `language` (en, ro; default en).
- `w.dialogue.tab`: `session`, `name` (required: diagram, drawing, documents, map ...), `holds` (the world id),
  `last_request` (a `w.request.request`), `last_result` (a `w.dialogue.result`). Limit 20.
- `w.dialogue.turn`: `tab`, `n` (required), `text`, `sort` (required: request | reaction | question | answer | talk),
  `request` (the w.request read, or the revision a reaction made), `reaction` (reject | reduce | enlarge | refine |
  redo | put_back | thanks | frustration), `on_result` (the result reacted to). Limit 1,000.
- `w.dialogue.result`: `request` (required), `tab`, `thing` (many: ids of the things made or changed), `effect`
  (made | changed | removed | arranged; default made), `status` (current | replaced | undone; default current),
  `replaces` (the result it replaced), `seed` (the seed of a random plan). Limit 1,000.
- `w.dialogue.assumption`: `result`, `constraint` (required: a w.request constraint with origin=default), `said`
  (yes | no; default no).
- `w.dialogue.question`: `tab`, `request`, `asks` (a constraint `on`), `text`, `option` (many), `status` (open |
  answered | dropped; default open).

## How a reaction revises the last request: `w.dialogue.revision` (data, in the schema)

Keys: `reaction`, `does` (flip | step | add | keep | undo | none), `on`, `direction` (up | down), `replaces`
(yes | no), `reply` (a w.lang.* reply name), `about`.

| reaction | does | on | direction | replaces | reply |
| --- | --- | --- | --- | --- | --- |
| reject | flip | kind | | yes | |
| reduce | step | count, extent | down | yes | |
| enlarge | step | count, size | up | yes | |
| refine | add | (the constraints said) | | yes | |
| redo | keep (new seed) | | | yes | |
| put_back | undo | | | no | |
| thanks | none | | | no | welcome |
| frustration | flip | kind | | yes | sorry |

flip: the constraints `on` of the last request (or, where none was said, the kinds of the last result) become
want=no. step: one `k.expect.scale` step, or the count times the step's `count_factor`. add: the reaction's own
constraints replace those on the same key ("not all circles, better layout"). "My expectation was ..." (cue
`reaction.expectation`) is a refine whose constraints are the whole new set. A revision makes a new w.request request
with `revises` = the last one (status replaced) and a new result with `replaces` = the last result (status replaced):
the last result is replaced, not piled on.

## English

The reaction phrasings are `w.lang.en.cue` facts with `on=reaction` (shard `hand-cues`): "not this", "wrong", "no",
"too much", "you overdid it", "too many", "bigger", "more", "better layout", "redo", "again", "another one", "put it
back", "thanks", "perfect", insults ("stupid", "useless", "what is this"). No Romanian words shard: a session world,
reached through translation.
