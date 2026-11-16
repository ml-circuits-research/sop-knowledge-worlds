# General English phrase profile, version 1

This opt-in profile adds shared phrase-structure productions and structured composition
mappings. It imports schema dependencies, not the old preview data. The preview declaration
bytes and its ef0a1b27 pin remain unchanged. This profile is not a replacement until the
selected-frame path demonstrates parity; in particular the older explicit property-of
construction is not retired by this increment.

## Syntax and neutral semantic records

| Construction | Intermediate output |
|---|---|
| Command with verb and object | Exact verb identity, transitive valency, imperative mood and object context. |
| Command with verb, object and result predicate | The same envelope with resultative valency and a separate result predicate. |
| Command with verb, object and prepositional goal | Oblique valency with marker and goal object kept distinct. |
| Bare/determined noun phrase | Kind identity, optional determiner, neutral qualifier and source evidence. |
| Qualified nominal | A declared value predicate modifying a kind; it is not automatically a selector or a result requirement. |

There is one command production per syntactic valency, not per act or sentence. Verb
entries carry an exact licensed source identity only. The construction supplies valency
and mood; the selected source frame later supplies semantic act and roles. Semantic act
is absent from these phrase templates. The published frame mismatch counterexample
remains decisive: an add verb in the make family can select a frame whose act is change.

The reading envelope is `{verb,valency,mood,context,provenance}`. `context.node` contains
object and, where syntactically present, result or goal. Goal preserves marker/object.
NPs have kind, determiner (null if absent), qualifier (null if absent), evidence and origin.
Predicates preserve concept/operator/value, explicit positive polarity/requirement character,
lexical evidence and origin. These are semantic JSON records, not SOP request wires.

A property-bearing NP remains neutral until a selected frame role interprets it. Explicit
role target_mode=new describes a new object's requested property; existing makes it a
selector over the pre-state. The separate resultative predicate stays a result condition.
A determiner or a verb-family label does not decide target mode. Missing role mode remains
unresolved; it must not default to existing, new or a guessed selector interpretation.

## Reusable providers and provenance

Provider recipes reuse all existing object, animal, people-kind, genre and shape names,
and colour/shape value families. Domain terms remain in their owning bases. Verb entries
refer exactly to the separately published licence inventory; unlicensed senses are not
silently promoted. Existing language facts provide articles and prepositions. Provider
origin is preserved beside original Unicode source ranges; evidence is never widened to a
contiguous hull or replaced by normalized token positions.

This data does not make every syntactically parsed verb/argument combination semantically
licensed. The frame binder must enumerate exact verb+valency licences, project every role,
keep marker and argument entries separate, enforce source evidence and retain alternatives.
Missing roles, absent modes, unsupported argument forms and type/unit requirements remain
unresolved failures, not permission to choose a different act. The increment frame's count
argument, for example, is not magically supplied by this nominal profile.

## Consumption and verification

The mappings reuse the existing binding/rule/map/node/step fact types and existing bounded
composition semantics; no new expression operators are defined. Library 0.194 supplies
composition/projection, but the knowledge validator remains at its authorised old pin.
Native repository tests validate source families, template references, mode metadata and
category parsing. Consumer-side tests must additionally validate actual composition and
licence projection with the published library before claiming a request-ready profile.
No native validator-pin upgrade, automatic request bridge or execution acceptance is
claimed by loading these facts. Object existence, property applicability, colour/native
format conversion and three-valued instance resolution remain later gates.

The old pinned schema required=true has open-world semantics. Consumers still enforce
full declarations, safe structured paths, complete mappings, exact origins, budgets and
ambiguity reporting. No held-out rows or sentence-specific mappings are included here.

Loader scope is explicit: the phrase compiler consumes this module's binding/rule/map/
node/step facts only. The frame binder consumes the frame module's role-path node/step
facts in its own static source view. Shared helper types do not mean their records can be
indiscriminately merged into a phrase compiler; frame-only paths are not phrase mappings.
Both views may share the same pinned catalog/source families. Parsing must request
original source ranges; absent ranges/origins cause required composition paths to decline.
