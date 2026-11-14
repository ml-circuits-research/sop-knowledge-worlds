# w.face: a drawn face

A **world schema** (not knowledge): a schema that an application loads to let its users make and change a drawn
face (an avatar, a character, a portrait), written in SOP Lang alone in the library's `std.schema` format and
driven by the acts of `std.acts`. One deny keeps one part of each kind on a face; it has no function of its own.
Source `hand-core 1`, CC0-1.0. Version 1.

It is the acting half of `k.faces`: k.faces knows what faces are made of (slots, variants and their shapes,
colours, presets, expressions); w.face holds what a user does to one face. Nothing of k.faces is written here
again: the kinds are its slot names, and a part's look, its colours and the expression are names of k.faces facts,
read from there.

- `w.face.face`: `name`; `style` (a `k.faces.slot` style: plain, micah, pixel-art ...; default plain); `preset` (the
  `k.faces.preset` it started from); `skin`, `hair_colour`, `eye_colour`, `clothes` (names of `k.faces.colour` of that
  use: the keys of `k.faces.preset`, so a preset is copied key for key); `expression` (below).
- `w.face.part`, the parent of every kind of part: `face` (the face it belongs to; a host with one face may leave it
  out), `variant` (a `k.faces.variant` of the part's slot in the face's style: "round", "big smile"; its parts are
  the shapes drawn), `colour` (paints the part over the face colour its `tint` names; any colour name of k.values),
  `size` (0.6 to 1.5, default 1, by tenths: 1 as the style draws it), `x` and `y` (the move from its place in the
  slot's box, -50 to 50 in the 0 to 100 frame of the face, default 0; y grows downwards, so "raise the eyebrows" is
  less y). A pair (eyes, ears, eyebrows, cheeks, earrings) is one part drawn twice, mirrored at the middle: `x` moves
  the side on the viewer's left, so more `x` brings the two closer.
- The kinds of part, one per slot name of k.faces (all styles together; a style has some of them): `hair_back`,
  `shoulders`, `clothes`, `neck`, `ears`, `head`, `cheeks`, `beard`, `mouth`, `moustache`, `nose`, `eyes`, `eyebrows`,
  `glasses`, `hair_front`, `earrings`, `hat`, `accessories` (`w.face.<slot>`). A test keeps them equal to the slot
  names of the k.faces shards.
- **The expression is a mode, not a part.** `expression` names a `k.faces.expression` (happy, sad, angry, surprised,
  sleepy, wink, talking): while it is set, its mouth, eyebrows and eyes are drawn over the face's own; the parts keep
  their own variants, so leaving the mode (removing `expression`, or undo) shows them again. No expression: calm.
- Acts: on a face make, remove, change, copy, pick, ask; on a part make (put it on), remove (take it off), change
  (variant, colour, size), place (move: sets `x`), pick, ask. A face has one part of each kind: a second hat is
  refused ("A face has one part of each kind: this face has a w.face.hat already."); to change the hat, change its
  variant. At most 10 faces and 10 parts of each kind.
- Found by: face, avatar, face maker, avatar maker, drawn face.
- `clothes` is two things in k.faces: a colour key of a preset and the name of a slot of the style `toon-head`. Here
  the face's key `clothes` is the colour and the kind `w.face.clothes` the part.
- Not said here: that a variant belongs to the part's slot and style, that a colour is one of k.faces's colours of
  that use, and that an expression exists (open names today; with sopworld 0.34, joins `type=k.faces.variant
  by=name` would check them when k.faces is loaded: questions.md Q43); how the parts around a resized part follow
  it (a function of the renderer, as in the application).

## How to use it

```js
const w = new World({ library: { 'w.face': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION, 0.30.0 or later)
w.load('@acts core.use world=std.acts');
w.use('w.face');
// A face from the k.faces preset "robot": its style and colours, then one part per slot it fills.
w.act({ action: 'make', args: { kind: 'w.face.face', preset: 'robot', style: 'plain', skin: 'metal grey', hair_colour: 'black', eye_colour: 'yellow', clothes: 'grey' } });
w.act({ action: 'make', args: { kind: 'w.face.head', face: '$w_face_face1', variant: 'box' } });
w.act({ action: 'change', args: { thing: 'w.face.head', attr: 'size', by: 'more' } });     // 1.1
w.act({ action: 'change', args: { thing: 'w_face_face1', attr: 'expression', value: 'happy' } });
```

To draw it, a host takes, for each part in the order of its slot's `z` in the face's style, the `k.faces.part`s of
its variant (or of the expression's variant for mouth, eyebrows and eyes while the face has one), colours them from
the face's colours by `tint` (or the part's own `colour`), scales them by `size` about the slot's centre and moves
them by `x` and `y` (k.faces/WORLD.md, "How a face is drawn"). The drawing is connected as the host's effect
(`std.schema.effect of=<kind> act=change action=<the renderer>`), declared by the application, not here.

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs` (a preset of k.faces made into
a face; sizes, places and colours changed; a second hat refused; an expression set and undone).
