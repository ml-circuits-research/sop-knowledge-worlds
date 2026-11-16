# English symbolic reader declarations

This additive fact module describes an English imperative construction and reusable
lexical-provider families. It leaves the older `w.lang.en` frames unchanged. It is not
an execution tool, a completed reader, or a migration of domain facts into `w.legend`.
The declarations validate with this repository's pinned library; consuming original
source ranges requires published library 0.185.0. Library 0.187.0 publishes the generic `composeParses` transducer; 0.188.0 adds
per-production equality guards. The SOP mapping adapter, agreement compilation and
request bridge remain pending consumer
capabilities, so the module does not yet claim a runnable semantic reader.

## Vocabulary ownership and source identities

`binding` identifies a loaded source type, its text key and lexical category. Its optional
`source_id` restricts an explicitly licensed construction to one existing sense. `filter`
conditions are conjunctive; repeated source values match existentially. If a filter
restricts the text key, only matching text values are emitted. Compare unquoted SOP scalar
values, not their textual quoting. `feature` either copies a source key or supplies a literal,
never both. Missing required source values fail closed. Consumers preserve the originating
wire id and provenance alongside each lexical entry; source licensing remains with that
source, rather than becoming the mapping's CC0 licence.

| Family | Published source and feature paths |
|---|---|
| Property names | All `k.attributes.attribute.name` values supply `feat.concept`. Shape vocabulary comes from domain-owned `core.word` records whose means is `k.shapes.shape`. This is lexical classification, not proof that an attribute applies to every kind. |
| Kind names | All object, animal, people-kind, genre and shape identity names supply `feat.kind`. Duplicate names/senses remain alternatives; consumers must not silently choose the first source. These families are reusable coverage, not a replay-derived word list. |
| Colour and shape values | Every `k.colours.colour.name` and `k.shapes.shape.name` supplies `feat.value`, with explicit `feat.concept` and `feat.operator=eq`. The names are vocabulary candidates, not newly defined calculable regions or universal attribute defaults. |
| Imperative verb | The existing `k.actions.verb.change.change` sense supplies `feat.act`; the published `acts.change.of` frame licenses this construction. Other change synonyms, degree/size expressions, fills and numerical/unit forms are not inferred from that act grouping. |
| Grammatical terminals | Existing `w.lang.en` records provide OF, TO and definite DET. Mood belongs to the imperative production, never to a verb in every syntactic context. |

Canonical names here are grounded by their source identities. They are not declarations
that those names have already been resolved to migrated legend concepts. Domain English
words stay beside their domains; the language module contains bindings, not copied noun,
colour or shape lists. An adapter may later add other source families through declarations.
Unknown words, absent source families, unresolved senses and unlicensed constructions
remain unread or partial; a source-table match is not a correctness or feasibility verdict.

## Productions and compositional templates

`rule` uses ordered repeated `rhs` values. Productions describe Message, Command,
PropertyPhrase, Target and ToValue, with optional definiteness represented by separate
productions. `parseText` returns the production's **wire id**, not its `name`; consumers
resolve the symbolic `map.rule` name to that id when compiling mappings.

`map` selects either a rule or a lexical category and names a root `node`. Object children
attach by `parent` and `field`; array children use `index`. A copy node has ordered `step`
records: each has an `at` and exactly one `key` or `index`. This encodes path components as
facts, without a string mini-grammar. Copy paths are rooted at the transducer context:
`node` is the parse node and `children` contains the children's semantic outputs. Literal
nodes carry their SOP value; null nodes explicitly mark grammatical-only terminals.
Consumers reject missing paths, unsupported node kinds, cycles, duplicate fields/indexes,
missing mappings and invalid attachments instead of omitting semantic content.

The Command template preserves act, mood, target and a property constraint as an intermediate
semantic record, with whole-command evidence and separate lexical-value evidence. These
are not `std.request` wires. This imperative construction explicitly declares the constraint
character as requirement and polarity as positive; a bridge must not silently invent them. An adapter must retain disjoint original source ranges and
must not replace them with a contiguous hull or normalized token offsets.

`agreement` supplies two copy nodes evaluated in the same production context **before**
parent composition. The operands must compare equal without type coercion. This
construction compares concept-name primitives: the property concept must equal the
value's declared concept. A future adapter must not restrict the generic guard to primitive
operands; structural equality of compound operands belongs to the generic mechanism. Absent or incompatible features
fail closed; no type coercion, colour/shape guessing or dropping an unmatched adjective.
The SOP agreement declaration does not automatically execute a guard. An adapter must
compile every agreement to the generic transducer's guards; claiming interpretation
requires this adapter and the structural request bridge to be released/tested.

The intermediate Target explicitly declares `mode=existing` in both target constructions
and retains its kind and optional determiner. A bridge must not infer that mode from
an act name. Request target
selection, selector/result separation, instance resolution, property applicability and
operator/value/unit typing remain distinct mandatory gates. The property-of-target phrase
never places an old identifying property and a desired result into one result conjunction.
No domain state, observed success, execution effect, automatic assumption or conversational
context is invented by these declarations.

On the old pinned engine, `required=true` has open-world requirement semantics, not the
newer closed-record `present=true` guarantee. Loading this fixture therefore does not
prove arbitrary template records complete or valid. Before composition the consumer must
check exactly-one feature source (`from_key` or literal), exactly-one map selector, ordered
copy-step completeness and exactly-one key/index, roots/parents, cycles, duplicate object
fields/array indices and agreement operands. It must enforce `source_id` consistently for
every provider, including `core.word`, and preserve alternatives. These consumer structural
checks remain pending and are mandatory before any request bridge or execution.

## Source and checks

The mapping is hand-authored general English construction knowledge (`hand-core 1`, CC0).
Domain facts retain their existing licences, sources and sense uncertainty. There are no
held-out sentences or sentence-specific productions in this module. Tests verify provider
family coverage, source identities, template references/paths, explicit compatibility,
construction-scoped mood, and category parsing on values drawn from both source families.
They do not claim semantic execution or owner-session acceptance.
