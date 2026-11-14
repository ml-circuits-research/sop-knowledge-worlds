# k.kinds: one kind-of relation, followed upwards by one rule

A module with one type and two rules, no facts of its own (Q34 item 6). `k.kinds.kind` has a `name`, `is_a` (the
kinds right above, many) and `kind_of` (every kind above, derived). The rules: what a thing is, it is a kind of; a
kind of a kind of something is a kind of it. `k.commonsense.thing`, `k.people.kind` and `k.shapes.shape` extend
`k.kinds.kind`, so one rule follows their chains: a square is a kind of rectangle, rhombus, quadrilateral and
polygon (Q33: `is_a` of a shape now holds many); a grandfather is a kind of man; milk, a drink of `k.food`, is a
liquid by a rule of `k.commonsense` and so a kind of liquid. The derived `kind_of` lands on the wire of the thing
itself (its type is the world's own type).

Not taken in: `k.words.sense` (WordNet's chains, keyed by word, part of speech and sense, not by name; its import
already writes `kind_of`, so the key is the same) and `k.parts.inherited.from` (a table of where a part was inherited
from, computed by its tool). Checked by `tests/shared-modules.test.mjs`.
