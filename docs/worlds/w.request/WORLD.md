# w.request: the meaning of one request

A **reusable world** (not knowledge): a schema in the library's `std.schema` format, driven by the acts of
`std.acts`, with no rule and no function of its own. Source `hand-core 1` (own), CC0-1.0. Owner's GO, reviewer block
2026-11-15 14:00, item 1: *what the user asked is itself a world*. A reader (the library's `readRequest`) fills one
live instance per turn; `w.dialogue` keeps the requests of a session and revises them; the open tab's world receives
the request as a goal and its planner fills what was not said from `k.expect`.

## Kinds and exact keys

- `w.request.request`: `act` (required; a `k.actions.act` by name: make, change, remove, place, group, connect ...),
  `mode` (a frame's mode: more, apart; or a finer act, below), `target` (a kind name, a thing id, or empty for the
  last result), `refers` (kind | thing | last | world; default kind), `goes_to` (the world it goes to: w.diagram, a drawing world,
  w.document ...), `text` (the message as read, English), `said` (the original, before translation), `n` (turn, from 1),
  `revises` (the request it revises), `status` (open | done | partly | refused | replaced; default open).
- `w.request.constraint`: `request` (required), `on` (required: kind | count | size | extent | attribute | place |
  manner | layout | with | about | length), `want` (yes | no | not_all; default yes), `value`, `of` (the kind it is
  about when not the target), `attribute` (a k.attributes name, for on=attribute), `relation` (in, on, at, next_to: for
  on=place), `number`, `min`, `max` (counts and lengths), `amount` (a `k.expect.amount` name: one, couple, few, some,
  handful, several, many, dozen, about), `unit` (length: word, sentence, paragraph, chapter, page), `words` (the words
  of the message it was read from), `origin` (said | default | reaction; default said), `honoured` (yes | no | partly,
  set after the plan), `why` (why not, for the reply).
- `w.request.unread`: `request` (required), `text` (required: the word(s) no constraint took), `n` (position),
  `note`.
- What a reader reads off the message, on `w.request.request` (names of the library's request contract `std.request`):
  `mood` (do | ask | check | propose), `words` (the stretch of the message the request was read from), `words_origin`
  (hull: not marked, taken from the first to the last word of the request's parts), `predicate` (the verb as written),
  `question` (count | exists | list | what | which | where | when | who | describe | why | how | how_much | compare |
  total | average | max | min | difference | percent), `asked` (the key asked about: drawn.colour).
- `w.request.target` (the target as read, `std.request.target`; one per request): `request`, `family` and `mode`
  (present: new | existing | bound), `determiner` (definite | indefinite | quantified | possessive | demonstrative; a
  mention read two ways keeps both, the reader's own first), `fill` (written | context | description | all |
  journal_step), `sort` and `sort_words` (the canonical kind and the words that said it; `kind` is the thing's own type
  in std.schema), `name`, `description`, `count_words`, `count` (integer), `quantifier` (as written: all, every, both,
  "one by one"), `quantity` (the amount word it was normalised to: one, two, some), `ordinal` (first, last,
  second_last, "first two"), `code_words`, `ids` (many: n1, e2).
- On `w.request.constraint`, what a reader reads: `attribute` may be a key of the tab's family (drawn.colour,
  chart.labels, meeting.time); `value` is one value or several (many: a chart's values 30, 25, 20); `operator` (eq |
  degree | delta | factor | relation | region | less.equal | greater.equal), `phase` (selector: it picks the target;
  result, the default), `character` (requirement, the default | preference), `step` (more | much_more | less |
  much_less, with operator delta), `measure` (a number, in `unit`) and `measure_words`, `open_value` (true: the value
  is outside the reader's bank for the key and keeps the words as written).
- `w.request.unread` also keeps `value` (many): the value read for a meaning with no key yet (its frame in `note`).
- The reader's context: `w.request.context` (a thing on the page: `sort` present, `name`, `code`, `size`, `y`,
  `text`), `w.request.previous` (`text` present: the message before), `w.request.clock` (`now`, a date and time, and
  `timezone`, both present).
- Acts: request make, remove, change, ask, copy; target and constraint make, remove, change, ask; unread make, remove,
  ask; context make, remove, change, ask; previous and clock make, ask.
  Limits: 500 requests, 500 targets, 5,000 constraints, 2,000 unread facts, 2,000 things of context.
- `present=true` keys are refused when missing at a tell; `required` keys are ones a host may still ask for.

## Finer acts and `mode`

`act` is a `k.actions.act` by name: a host that loads k.actions and declares its acts complete
(`world.closeType('k.actions.act')`) refuses any other. A reader whose act bank is finer than k.actions writes the
k.actions act that k.actions' own verb of the same name means, and names the finer act in `mode` (as w.lang.en's
mode_map reads group in the mode apart as take apart). answer and select are k.actions' ask and pick.

| finer act | act | mode | k.actions verb |
| --- | --- | --- | --- |
| arrange (a grid, a row, even gaps, aligned) | place | arrange | align, line up -> place |
| merge (several things become one) | group | merge | merge, combine -> group |
| ungroup (a group dissolved, its members stay) | take apart | ungroup | ungroup -> take apart |
| split (one thing becomes several) | take apart | split | split -> take apart |
| disconnect (the join between two things taken away) | take apart | disconnect | disconnect -> take apart |
| reverse (order or direction turned round) | change | reverse | reverse, flip -> change |
| set (a value made the standing default) | change | set | set -> change |
| repeat (the last act done again) | copy | repeat | repeat -> copy |

## What each `on` holds

| on | value | other keys | example |
| --- | --- | --- | --- |
| kind | the kind | want=no / not_all | "not a circle" = kind circle want=no; "not all circles" = kind circle want=not_all |
| count | — | number, or min/max, or amount; of | "5-10 nodes" = count min=5 max=10 of=node; "a few plants" = count amount=few of=plant |
| size | a k.expect scale step (tiny, small, default, big, huge) | of | "small houses" = size small of=house |
| extent | a scale step | — | "in a corner" = extent small (and place corner) |
| attribute | the value | attribute | "red circles" = attribute colour value red of circle |
| place | corner, top_left, left, top, centre ... or a thing | relation | "in the top left" = place relation=in value=top_left |
| manner | nice, better, tidy, random, logical, simple, detailed, colourful, symmetric | — | "a random diagram" = manner random |
| layout | a k.layouts / k.diagrams layout (grid, ring, row, column, tree, radial) or better | — | "better layout" = layout better |
| with | the part kind | — | "with water plants and a duck" = two facts: with water plant, with duck (+ count facts of them) |
| about | the topic in words | — | "about the water cycle" |
| length | small / big, or none | number, min/max, amount, unit | "a story of 300 words" = length number=300 unit=word |

Properties a planner keeps (tests of psys2 `tests/request-properties.test.mjs`): want=no never yields the kind;
not_all yields more than one kind; a count or range is respected; small < default < big in parts and extent;
"random" varies within the typical range of `k.expect` (never the minimum); a constraint not honoured is named in
the reply (`honoured=no`, `why`, reply `not_honoured`); every unread word is named (reply `unread`).

## English

The phrasings that set constraints are the cues of `w.lang.en` (shard `hand-cues`, type `w.lang.en.cue`): negation
(not, no, without, instead of, not all), counts and ranges (exactly, at least, at most, about, N or so, between N and
M, N-M, from N to M, a few, many ...), scale words, places, manners, layouts, with, about, length. Replies: `assumed`,
`not_honoured`, `unread`, `done.revise`, `sorry` (w.lang.en and w.lang.ro). The world has no Romanian words shard: it
is a session world a host fills, not a tab a person names; Romanian reaches it through translation.

```js
const w = new World({ library: { 'w.request': text } });
w.load('@acts core.use world=std.acts'); w.use('w.request');
w.act({ action: 'make', args: { kind: 'w.request.request', act: 'make', target: 'diagram', n: 1, text: 'a diagram with 5-10 nodes, not all circles' } });
w.act({ action: 'make', args: { kind: 'w.request.constraint', request: '$w_request_request1', on: 'count', min: 5, max: 10, of: 'node', words: '5-10 nodes' } });
w.act({ action: 'make', args: { kind: 'w.request.constraint', request: '$w_request_request1', on: 'kind', value: 'circle', want: 'not_all', words: 'not all circles' } });
```
