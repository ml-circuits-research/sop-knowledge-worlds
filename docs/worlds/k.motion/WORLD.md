# k.motion

How a drawn face moves over time when nobody draws it frame by frame: it blinks, glances aside now and then, moves
its mouth while a reply is said, shows how the reply came out (a smile when something is done, sad brows when it
cannot be), and eases back to its own face. Facts only, no rule or function of its own: the library's `std.motion`
(being designed; format proposed in `questions.md` Q46) plans and runs them. Every part of a face is named by its
`k.faces` name (a slot, a variant of the style `plain`, a key of `k.faces.expression`); no coordinate is written here.
Nothing of the mouth is in a language world (owner, 11:05): the classes of mouth shapes and the rule from written
text to them are here, the same for every text in Latin letters.

## Schema (`schema.sop`, module `k.motion`, version 1)

Durations are milliseconds (`k.units.measure`); a range is a pair of keys `<name>_min`, `<name>_max`.

- `k.motion.event` (identity `name`): what a host tells the face: `reply` (a reply begins) and `spoken` (made by the
  rule that says a text, when its last letter is said). `k.motion.field` (identity `event` + `name`): the fields an
  event carries and the values they take: `outcome` (done, already, refused, "not understood", answer, question,
  thinking) and `text`.
- `k.motion.layer` (identity `name`): a layer of the face's state, the keys its rules may set (`key`, many) and its
  `priority`: blink 4 (eyes), talk 3 (mouth), expression 2 (mouth, eyebrows, eyes), glance 1 (eyes). Where two layers
  set one key at once the higher wins; under every layer is the face itself (its preset, or what the user chose).
- `k.motion.rule` (identity `name`): `layer`; `on` an event, or `repeat_min`/`repeat_max` (again and again, after a
  pause in that range); `chance`; `during` / `not_during` (layers that must or must not be running); `until` (the
  event that cancels it: its keys ease back at once); `emits` (the event it makes when done).
- `k.motion.when` (identity `rule` + `key`): a condition: `of=event` a field of the event, `of=state` a key of the face
  as shown (with `feature`, a feature of the k.faces variant shown, such as `feel=closed`); `value` (many); `not`.
- `k.motion.step` (identity `rule` + `n`): in order (or `with` another step): `onset`, `hold`, `back` ranges;
  `hold_until` (the hold lasts until that event, then the hold range); or `per` a field of the event (a stream: the
  text), `splitter` and `key` (one unit after another, each setting the key to the mouth of its class).
- `k.motion.set` (identity `rule` + `step` + `key`): what a step sets: `key` to `value` (a k.faces variant of that
  slot; `one_eye` takes an eye variant); `via` a variant a host that only switches shows during the onset and the ease
  back (a blink passes through half-closed eyes).
- `k.motion.viseme` (identity `style` + `class`): a class of mouth shapes and the k.faces mouth that shows it.
- `k.motion.splitter` (identity `name`) and `k.motion.letters` (identity `splitter` + `name`): the rule from text to
  classes: one unit per character; `fold` (a letter with a mark counts as the letter), `ignore_case`, `default` (the
  group of a letter no group lists); each group: `class`, `letter` (many) or `kind` (space, digit, symbol), `min`, `max`.

How a host reads it (the library's `std.motion` does: sopworld 0.56 `readMotion`, `planMotionFacts`, `splitText`): events come in; a repeated rule fires after
its pause when its layers and conditions allow; an event ends the holds waiting for it, cancels the rules it ends,
then starts the rules `on` it. Each key shows, at each moment, the value of the highest layer that sets it (the later
rule in one layer), else the face's own. A host that only switches variants shows a value from the middle of its onset
to the middle of its ease back (or the `via` variant during both).

## What it holds (`shards/rules.sop`, `shards/mouth.sop`, written by `tools/motion-core.mjs`)

| Rule | Layer | When | What |
| --- | --- | --- | --- |
| blink at rest | blink | every 1.5-5.5 s, not while talking, not when the eyes are closed | eyes closed via half-closed: 60-100 ms closing, 30-60 closed, 110-200 opening |
| blink while talking | blink | every 1.0-3.6 s while talking | the same |
| glance left / right while listening | glance | each every 10-22 s, not while talking | eyes aside 190-670 ms, saccades 25-60 ms |
| glance left / right while talking | glance | each every 3-12 s while talking | eyes aside 300-1500 ms |
| say the reply | talk | on `reply`, cancelled by the next | one mouth per letter of the text; then `spoken` |
| done: smile | expression | on `spoken`, outcome done | smile: onset 400-700, hold 800-1600, back 450-750 |
| already: eyebrow flash, small smile | expression | on `reply` / `spoken` | brows raised 150-300 ms; a short smile |
| refused: sad brows, sad mouth | expression | on `reply` (held until spoken) / `spoken` | sad brows; then a sad mouth |
| not understood: raised brows, small mouth | expression | on `reply` (held until spoken) / `spoken` | raised brows; then a small mouth |
| answer: eyebrow flash | expression | on `reply` | brows raised 150-300 ms, otherwise the face as it is |
| question: raised brows | expression | on `reply`, held until spoken and 0.4-0.9 s after | raised brows |
| thinking: look up | expression | on `reply`, held until the next reply | eyes looking up, small mouth |

Because the talking mouth (layer 3) is above the expression's mouth (2), a sad or smiling mouth shows only once the
text is said, while the brows of the expression show during it; blinks (4) show over everything; glances (1) hide under
an expression that sets the eyes.

**Mouth shapes** (style `plain`): rest `neutral`, open `talking`, mid `half open`, rounded `open`, closed `pressed`,
lip-teeth `lip bite`, tongue `tongue tip` (four of these mouths and the eyes `looking out` / `looking in` were added
to k.faces for this world). **Text to mouth** (`latin letters`, the owner's rule of 11:05): vowel letters a, e, i, y
open (60-100 ms); o, u rounded (70-110); m, b, p closed (60-90); f, v lip-teeth (60-90); t, d, n, l tongue (45-70, the
one addition to the owner's list, so that every class is used); other letters mid (45-75); digits mid (150-300);
spaces rest (30-60); `, ; :` rest (150-300); `. ! ?` rest (300-500); other symbols rest (0-30). An approximation for
any Latin-script text, not a model of the sounds of a language; if measured realism later needs sound-level detail,
the reviewer is asked first.

## Where the numbers come from

Measured (the ranges contain the published values; the test `tests/k.motion.test.mjs` checks each):
- **Blink rate:** Bentivoglio AR, Bressman SB, Cassetta E, Carretta D, Tonali P, Albanese A (1997), "Analysis of blink
  rate patterns in normal subjects", *Movement Disorders* 12(6):1028-1034: 150 subjects, 17 blinks a minute at rest,
  26 in conversation, 4.5 while reading; log-normal distributions. The planner gives 16.4 at rest and 24.4 while
  talking (seeded, 10 minutes and 91 s).
- **Blink duration:** the lid closes 40-47% faster than it opens (Sforza C et al. 2008, "Spontaneous blinking in healthy
  persons: an optoelectronic study of eyelid motion", *Ophthalmic and Physiological Optics* 28(4):345-353); closing
  70-215 ms and opening about 200-320 ms in the studies reviewed by Kwon KA et al. 2013, "High-speed camera
  characterization of voluntary eye blinking kinematics", *Journal of the Royal Society Interface* (a
  voluntary blink there: closing 76, closed 58, opening 438 ms). A whole spontaneous blink is taken as 200-360 ms,
  inside the 100-400 ms usually quoted.
- **Glances:** Lee SP, Badler JB, Badler NI (2002), "Eyes alive", *ACM Transactions on Graphics* 21(3) (SIGGRAPH
  2002): saccade duration 25 ms + 2.4 ms per degree; gaze held on the other / away 237.5 +- 47.1 / 13.0 +- 7.1 frames
  while listening and 93.9 +- 94.9 / 27.8 +- 24.0 frames while talking (video at 30 frames a second: 7.9 / 0.43 s and
  3.1 / 0.93 s).
- **Smile:** Schmidt KL, Ambadar Z, Cohn JF, Reed LI (2006), "Movement differences between deliberate and spontaneous
  facial expressions: zygomaticus major action in smiling", *Journal of Nonverbal Behavior* 30(1):37-52: onset 0.555 s
  (deliberate) and 0.591 s (spontaneous), offset 0.643 s and 0.555 s.
- **Eyebrow flash:** about a fifth of a second (Grammer K et al., "Patterns on the face: the eyebrow flash in crosscultural
  comparison", *Ethology* 77, 1988, as summarised in the Wikipedia article "Eyebrow flash"; the paper itself was not read).
- **Speaking rate:** Yuan J, Liberman M, Cieri C (2006), "Towards an integrated understanding of speaking rate in
  conversation", Interspeech 2006: 164-214 words a minute in English conversation corpora (Switchboard, CallHome,
  Fisher). The letter durations give 184 words a minute on a long sample, and 120-220 on every test sentence.

Chosen (no measurement used): the onsets, holds and ease-backs of the brows and mouths other than the smile and the
flash (in the order of the smile for slow changes such as sad brows, of the flash for quick ones), the holds after a
reply is said (0.4-1.6 s), and the split of each mode's glances into a left and a right rule at half the rate.

## Known limits

- The rules name variants of the style `plain` only; another style needs its own `k.motion.viseme` facts and sets.
- A switching host shows a ramp as one change (or the `via` variant). The library read the format as published
  (its Q39, answering Q46); the tests run through it, and the reference reader that first planned these rules is gone.
- No sound-level lip sync: the text rule is by letters (owner, 11:05).

## Previews

`node tools/motion-strip.mjs <out.png>` draws the strip of faces of the sample reply "Done, I moved it." (the face at
every change: letters, a blink, the smile, the ease back); `--outcomes` one face per outcome. Not published.
