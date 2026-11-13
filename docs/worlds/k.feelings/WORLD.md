# k.feelings

30 common feelings: how a face shows them, what usually causes them, the opposite, a kind reply. Hand-written
(`hand-core 1`, CC0-1.0). For an avatar that shows feelings and for talk about them.

## What it knows

- `k.feelings.feeling` (identity `name`, the adjective): happy, sad, angry, afraid, surprised, tired, excited, proud,
  shy, bored, lonely, worried, calm, jealous, disappointed, embarrassed, confused, curious, grateful, hopeful,
  nervous, ashamed, guilty, disgusted, loved, hurt, frustrated, relieved, homesick, amused.
- `tone` (pleasant, unpleasant, neutral); `expression`: the `k.faces.expression` of style `plain` that fits (happy,
  sad, angry, surprised, sleepy), where one does (20 feelings); `mouth`, `eyebrows`, `eyes`, `cheeks`: the variant
  of that `k.faces` slot that shows the feeling, put on after the expression or alone (shy: `mouth=small
  eyebrows=sad cheeks=blush`; calm: `mouth=smile eyebrows=straight eyes=closed`); `caused_by` (many: short phrases:
  `"the dark"`, `"a loud noise"`); `opposite` (where there is a plain one: happy and sad, excited and bored, proud
  and ashamed, lonely and loved; angry, afraid, worried and nervous have calm); `reply` (a kind thing to say).
- `core.word` facts: other words and the nouns (scared, frightened, fear; glad, joy; mad, cross, anger; anxious).
- `looks_like` names the feeling whose face a feeling shares, where a face cannot tell the two apart: lonely,
  disappointed, guilty and homesick look like sad; grateful looks like happy; relieved looks like calm. What tells
  them apart is the cause, not the face. The other 24 feelings each have a face of their own (a test checks it):
  hurt is the sad face with tears, frustrated the angry face with gritted teeth, tired yawns, shy looks down,
  hopeful looks up, proud smirks, nervous grits the teeth under worried eyebrows.

## Shards

`feelings` (30 feelings and 30 word facts, 60 wires), written by `tools/feelings-core.mjs`.

## Joins

By name, with no import: `expression` is a `k.faces.expression`, and `mouth`, `eyebrows`, `eyes`, `cheeks` are
`k.faces.variant` names of those slots (style `plain`).

## Questions it helps with

See `tests/k.feelings.questions.jsonl`: how a face shows that someone is afraid, the opposite of happy, what makes
someone afraid, what to say to someone who is sad, which feelings show as the angry expression.
