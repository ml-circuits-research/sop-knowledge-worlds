# k.actions

The words of the acts: the few things a person asks an application for, whatever the things are, and the English
verbs that mean them. A host finds the verb of a request here, reads the act, and fills the roles of the act from
the object and the prepositions.

## What it knows

- `k.actions.act` (identity `name`): make, remove, change, place, connect, group, take apart, pick, ask, copy, send,
  undo, save, load, and from the PSys2 hand-over (`k.actions-missing.md`) redo and deselect. `about`, `opposite`
  (make and remove, save and load, connect and take apart, undo and redo, pick and deselect), `role` (many).
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

`acts` (16 acts, 57 roles; Q45: make has `topic`, marked by about) and one shard of verbs per act: `verbs-make`, `verbs-remove`, `verbs-change`,
`verbs-place`, `verbs-connect`, `verbs-group`, `verbs-take_apart`, `verbs-pick`, `verbs-ask`, `verbs-copy`,
`verbs-send`, `verbs-undo`, `verbs-save`, `verbs-load`, `verbs-redo`, `verbs-deselect`: 314 verbs (272 from WordNet
senses, 42 hand-written) and 89 markings. The hand-over added doodle, scribble, whip up, shove, nudge, scoot, wipe,
click, tap, touch, step back, export; moved download from load to save (with the new role `format` of save, marked
by as and in); and the verbs of redo (redo, do again, put back, bring back, get back) and deselect (deselect,
unselect, unmark, unhighlight, untick, uncheck). Left for `w.lang.en` (Round 12): the frames ("undo that change",
"clear the selection", "give me") and the fillers. Written by `tools/acts-core.mjs` from `sources/hand-core/act-verbs.tsv` (the table that was read and
filled in) and `sources/wordnet/act-verb-glosses.tsv`.

## What it does not know

- A verb is listed only where the reading was sure. Left out on purpose: `show` and `display` as asking ("show me
  the animals"; `show` is here as change, visible), `lighten` and `brighten` for a lighter colour (WordNet's gloss
  is about cheerfulness), `cancel` and `reset` as undo, `order` as putting in an order, `print`, `redo`.
- Only the listed senses of a verb mean the act: `draw` is sense 6 (represent by a drawing), not "pull".
- Requests that are not verbs ("I want a tree", "how many …", "bigger!") are not here.
- The everyday actions below (who cuts what with what) are separate facts: `k.actions.action` does not say which
  act a verb means, and `k.actions.verb` does not say who does it.

## Joins

By name, with no import: `text` with `sense` joins `k.words.sense` (`word`, `pos=verb`, `n`) where k.words keeps
the sense (its three most frequent senses of a word); a test compares the glosses.

## Questions it helps with

See `tests/k.actions.questions.jsonl`: which act erase means, the two acts of "put on", what enlarge changes and
which way, what "with" marks after replace, the roles of remove and the words that mark its source.

## Everyday actions (Round 7, R7.2)

187 common actions, named by their verb: who or what does it, to what, with what, where, what comes of it, the
opposite action, the action that undoes it, and an example sentence. Hand-written (`hand-core 1`, CC0-1.0). For
talk about what things do, and for giving a verb in a sentence its usual roles.

### What it knows

- `k.actions.action` (identity `name`, the base form of the verb; phrases too: `"pick up"`, `"put on"`, `"take off"`,
  `"put out"`, `"knock down"`): `group` (move 30, hands 29, make 15, change 30, sense 7, mind 16, talk 14, body 15,
  social 19, nature 12); `who` (many: person, animal, bird, wind, sun); `object` (many: what it is done to; left out
  for walk, sleep, rain); `tool` (many: a thing or a part of the body: `"kitchen knife"`, scissors, hand, tooth);
  `where` (many: a `k.scenes` scene); `result` (a short phrase: melt gives `"a liquid"`); `opposite` (82 actions;
  always said from both sides: push and pull, float and sink, buy and sell); `undone_by` (53 actions: tie and
  untie, fold and unfold, melt and freeze, break is undone by mend); `example` (one sentence that uses the verb).
- `core.word` facts: the other forms of every verb (cuts, cut, cutting; flies, flew, flying), worked out by rule
  with the irregular forms given by hand; all read.
- `k.actions.similar` (identity `name`, `action`): 442 verbs and phrases that mean nearly the same as an action or
  are a kind of it (stroll is close to walk, `"rub out"` to erase, repair to mend, grab to catch and to take). They
  are not `core.word` facts, because they are not the same action.

### Shards

`actions-move` (30 actions), `actions-hands` (29), `actions-make-change` (45), `actions-mind-talk` (37),
`actions-body-social-nature` (46); 816 wires, written by `tools/actions-core.mjs` from `tools/actions-data.mjs`.

### Joins

By name, with no import: every `where` is a `k.scenes` scene; 243 of the 268 tools are a `k.objects` drawing, a
stand-in or a `k.body` part (not: glass, toy, voice, net, sewing machine, paw, match, mud, vacuum cleaner, lid,
magnifying glass, binoculars, ruler, skipping rope, traffic light: the drawings of some of these have longer
names); 308 of the 542 things an action is done to have a drawing. Every verb that `k.commonsense` and `k.animals`
use in `can` and `cannot` (swim, fly, run, climb, jump, dig, talk, sing, sail, rain, glow, float, drive, bark) is an
action here.

### Questions it answers

"What do you cut with?", "Who can fly?", "What is the opposite of push?", "What undoes tying?", "What comes of
melting?", "What is done with a broom?", "What does one do in a library?", "Which action is stroll close to?",
"What does the wind do?" (`tests/k.actions.questions.jsonl`).
