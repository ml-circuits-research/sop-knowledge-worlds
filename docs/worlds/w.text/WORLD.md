# w.text: retained text and formatting spans

A reusable world pattern, source hand-core 1, CC0-1.0. A retained source record
requires source_id, revision and exact text. An optional document reference joins
the existing w.document.document type; it does not select the current document.
Source capabilities are append-only make/ask/copy; change/remove are not declared.
A revised text needs a distinct retained source record/revision. Spans may still
be changed or removed as formatting records. Direct host writes remain outside
that capability boundary.
A span requires a source reference and explicit unicode_scalar coordinates:
zero-based, half-open [start,end), nonempty. It may cross sentence/paragraph
boundaries. No implicit first sentence, current revision or latest-source lookup.

Optional independent boolean predicates record bold, italic, underline, strike,
highlight and code. Missing is unknown, not false. Highlight colour joins the
existing k.colours.colour.name, independently of the highlight predicate. A link
has an explicit link_target string; no target, URL scheme or resource is guessed.
These are authorial predicates, not a copied closed list of raw format labels.

Explicit absence-denies enforce source identity/revision/text and span source,
unit and coordinates (generic required-key prompts alone are insufficient on
this pin). Empty source identifiers/revisions are refused. The pinned library
also checks reference existence/type, scalar integer lower bounds and start < end.
The host must retain immutable source/revision identity, refuse
conflicting contents under one source/revision,
count Unicode scalars and enforce end <= retained text length. The pattern does
not prove those checks itself, repair spans, extract text or apply native styles.

List structure and checked state already belong to w.list.list, w.list.item and
w.tasks.task; document structure to w.document. They are not formatting spans.
Paragraph alignment, list-marker presentation and table dimensions are separate
facets with unresolved representation recorded in questions.md; none is silently
mapped to a text span or a generic quantity. No native operation is declared.
