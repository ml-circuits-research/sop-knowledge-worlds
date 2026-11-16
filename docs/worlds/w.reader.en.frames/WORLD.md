# English frame-licence declarations, version 1

This separately selectable overlay records explicit licences between existing verb senses
and existing argument frames, with role projections over normalized argument records.
It imports only the earlier reader's schema to reuse structured copy nodes/path steps.
It does not import or modify its data, add productions, replace the preview overlay,
change the validator pin, or claim new executable request coverage.

The two new record types are `licence` and `role`. A licence names its verb source identity,
selected frame name, actual verb-part identity and grammatical valency family. A role
names the existing frame-part identity, frame role and semantic act role; where those
roles differ or a marker is involved, the existing `role_map` identity is explicit.
Every path reuses `w.reader.en.node kind=copy` and ordered `w.reader.en.step` records.
There is no encoded JSON template or string path language in the facts.

| Family | Declared source evidence |
|---|---|
| Transitive | Create sense with `acts.make`, and remove sense with `acts.remove`, share one valency family while retaining different frame-owned acts/roles. |
| Resultative | The change sense of make with `acts.change.value` separates an existing object argument from its result predicate. The creation sense of make is not silently substituted. |
| Oblique | Put with `acts.place`, and add with `acts.change.add`, share the oblique family while their semantic roles remain frame-specific. The latter frame's act is change although its verb part's act is make. |

## Consumer contract proposed for review

First resolve the exact licensed verb identity and selected frame. The semantic act is
read from that frame's `act`, never copied from the verb-family label. Resolve each role's
part in that frame. Use its explicit role_map when present; otherwise the frame role is
the semantic role of the same name under the selected act. Marker records remain markers:
`place.rel` and `place.place` may both map to semantic place, but a relation marker must
not overwrite or become the target argument. Keep alternatives and source provenance.

The proposed normalized argument context has `node.object`, optional `node.result` and
optional `node.goal`; goal has marker/object fields. A property/count noun phrase may
carry quantity/head subrecords, as shown by the increment paths. These are an input
contract for a future generic frame binder, not a claim that current syntax composition
already emits them. Required roles, exact path presence, marker distinction and type/unit
compatibility must be validated; a missing path is not a reason to use an arbitrary span.

The existing composeParses operation projects from a parse-node/child context. The public
bounded operation needed to project an existing semantic argument context independently
of parsing is specified in questions.md; extracting that existing evaluator is authorised
separately from this data publication. Do not manufacture a
fake parse merely to invoke it, or treat path records as an executable frame binder.
No new general-production set is published before that decision. This slice supplies
source-grounded data and paired validation, not std.request output or effect acceptance.

The old pinned validator's required=true remains open-world semantics. Runtime consumers
must enforce required fields, source identity consistency, ordered paths, full licensed
frame-role coverage and ambiguity/typing checks. Tests check this concrete inventory,
including the semantic-act/verb-act counterexample; they do not certify arbitrary input
licences or all verbs sharing a family. Broader synonym licences need independent evidence.

## Provenance and compatibility

These mapping judgments are hand-core 1 (CC0). The source verb senses remain in k.actions,
including their WordNet provenance; frames, parts and role maps remain in w.lang.en with
their own source metadata. No domain vocabulary or sentence fixtures are copied here.
Preview consumers keep the exact old pin; this new module is additive and opt-in.
