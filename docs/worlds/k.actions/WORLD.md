# k.actions

The words of the acts: the few things a person asks an application for, whatever the things are, and the English
verbs that mean them. A host finds the verb of a request here, reads the act, and fills the roles of the act from
the object and the prepositions.

## What it knows

- `k.actions.act` (identity `name`): make, remove, change, place, connect, group, take apart, pick, ask, copy, send,
  undo, save, load. `about`, `opposite` (make and remove, save and load, connect and take apart), `role` (many).
- `k.actions.role` (identity `act`, `name`): what an act can be told. `holds` (thing, kind, place, direction, value,
  attribute, amount, number, name, person, group, topic, means), `needed=true` where the act cannot be done
  without it, `marker` (many): the prepositions that usually mark the role after any verb of the act (the place of
  `make`, `place`, `copy` and `ask`: on, in, at, under, above, behind, "next to", "in front of" and 15 more; the
  source of `remove`: from, "out of", off). A role with no marker is said without one (the object of the verb).
- `k.actions.verb` (identity `text`, `act`): a verb or phrasal verb that means the act. `sense` (many): the
  numbers of the WordNet 3.1 verb senses of `text` that were read and mean the act; `gloss`: WordNet's definition
  of the first; `object` and `complement`: the roles of the object and of an adjective or noun right after it
  ("paint the door red"); `attribute` and `value`: what the verb itself already fixes (enlarge: size, larger;
  darken: colour, darker; hide: visible, no; rename: name); `separable=true` and `after_particle` for phrasal verbs
  ("put the hat on the man": the man is the place). `named=model` on every verb taken from WordNet: which act the
  sense means, and the roles, are a language model's reading. Verbs with no `sense` are hand-written (`hand-core
  1`): WordNet does not list them in this meaning (turn into, change into, make into, recolour, scale up, ungroup,
  unlink, pull apart, roll back, go back, take back, share, make a copy of, pull up, bring up, hold on to …).
- `k.actions.marking` (identity `verb`, `act`, `marker`): after this verb the word marks this role (replace … with:
  the replacement; substitute … for: the thing; add … to: the place; point at: the thing). A host reads these
  first and the markers of the role second.

## Shards

`acts` (14 acts, 52 roles) and one shard of verbs per act: `verbs-make`, `verbs-remove`, `verbs-change`,
`verbs-place`, `verbs-connect`, `verbs-group`, `verbs-take_apart`, `verbs-pick`, `verbs-ask`, `verbs-copy`,
`verbs-send`, `verbs-undo`, `verbs-save`, `verbs-load`: 291 verbs (269 from WordNet senses, 22 hand-written) and
83 markings. Written by `tools/acts-core.mjs` from `sources/hand-core/act-verbs.tsv` (the table that was read and
filled in) and `sources/wordnet/act-verb-glosses.tsv`.

## What it does not know

- A verb is listed only where the reading was sure. Left out on purpose: `show` and `display` as asking ("show me
  the animals"; `show` is here as change, visible), `lighten` and `brighten` for a lighter colour (WordNet's gloss
  is about cheerfulness), `cancel` and `reset` as undo, `order` as putting in an order, `print`, `redo`.
- Only the listed senses of a verb mean the act: `draw` is sense 6 (represent by a drawing), not "pull".
- Requests that are not verbs ("I want a tree", "how many …", "bigger!") are not here.
- This world is not the 150 common verbs of everyday life (who cuts what with what): those are a separate task.

## Joins

By name, with no import: `text` with `sense` joins `k.words.sense` (`word`, `pos=verb`, `n`) where k.words keeps
the sense (its three most frequent senses of a word); a test compares the glosses.

## Questions it helps with

See `tests/k.actions.questions.jsonl`: which act erase means, the two acts of "put on", what enlarge changes and
which way, what "with" marks after replace, the roles of remove and the words that mark its source.
