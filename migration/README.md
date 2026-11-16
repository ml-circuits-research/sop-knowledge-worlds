# Owner-concept migration ledger

Pre-phase-zero preparation, 2026-11-16. Scope: chapter 11.1 and 11.5 of
[sop-worlds-teorie.md](../../soplang-words-lib/books/sop-worlds-teorie.md), checked against the
[published inventory](../../soplang-words-lib/refactoring/knowledge-inventory.md).
Owner concepts are acceptance probes and migration priorities, never an eligibility filter for
imports. Migration and import coverage must cover reusable relation/property families across
the knowledge base, including concepts not spoken in the replay. The family table scopes that
broader work; the concept table audits the selected probes only. No sentence-specific fact
selection or thresholds are justified by these probes.

No facts, world patterns or dependency pins migrate in this ledger. The phase-zero contract
publication is the prerequisite for choosing target identifiers and writing regions or roles.

Generate the ignored local evidence on demand with
`node tools/audit-owner-migration.mjs` from this repository; verify byte-for-byte with
`node tools/audit-owner-migration.mjs --check`. The optional local file `migration/owner-concepts-evidence.json`
records catalog version, SHA-256 of every catalog-listed input, file/line, wire id, type,
attributes and file licence. The evidence is a local audit report, outside the published
`docs/` knowledge base; it is excluded from Git and the build. This differs from the
published catalog/vocabulary indexes, which remain tracked under AGENTS.md. The report
includes published world patterns as well as shards: the older inventory excluded pattern declarations and therefore missed chapter. It does not
load worlds, follow arbitrary synonyms, merge repeated identities or infer inherited facts.
The extractor parses one `@` declaration per physical line; continuation-line
attributes are outside this lexical audit. It is not an exhaustive semantic inventory.
Counts are declaration occurrences. Alias searches expose candidates; they do not establish
same-sense identity (especially arrow, circle, water and letter). Provenance is copied rather
than reconstructed; a file licence and `core.source` do not alone prove semantic correctness.

The tables below classify migration readiness, not runtime support. “Missing contract” means
that the existing representation does not establish the general chapter-11 requirement;
it does not mean no related word or graphic exists. “Verify” is deliberately unresolved:
a type match or a drawing cannot discharge the check. Static parts are candidate edit handles,
not evidence that an application can select, mutate and observe them.

## Families of chapter 11.1

| Family | Published basis and work remaining |
|---|---|
| Kinds and specialisations | `k.kinds.parent`, `k.attributes.same`, `k.people.kind`, animal classes and sense-bearing words exist. Preserve each parent relation's meaning; do not turn part-of, material or use edges into is-a. Resolve selected senses and compute their dependency closure after phase zero. |
| Conceptual vocabulary | `core.word` belongs beside its English domain; Romanian remains in `w.lang.ro`. Evidence includes exact text/means candidates. Resolve multiword aliases and senses before joining concepts; no lexical match is an identity proof. |
| Spaces and regions | Colour RGB centres, shape geometry, layout anchors and numeric proportions exist. Missing contracts: axes/units/domains, named region membership/boundaries, uncertainty and extent/layer semantics shared by domains. A colour centre is not a colour region. |
| Whole structures | `k.parts.whole/inherited/usual`, `k.objects.part`, face slots and `k.expect.part` offer complementary evidence. Keep usual parts separate from mandatory cardinalities. Match semantic part names to editable realisations and verify inheritance. |
| Functional relations | Layout anchors/joins and scene placement offer geometry; people roles offer social roles. Neither proves support/containment/attachment conditions. Swing-seat support remains an explicit dependency to declare, not a relation inferred from pixels. |
| Usual values and preferences | `k.attributes.thing/typical/range`, people presets, `k.expect` counts and scene defaults exist. Preserve source and context; turn discrete degree words into justified regions, keeping defaults editable. No region thresholds are justified merely by the owner replay. |
| Realisations and capabilities | Object drawings/stand-ins, face variants, outlines, diagram structures and document patterns exist. Check visible difference from inherited realisations and observed part editing separately. A stand-in provides a candidate realisation, not every capability of its ancestor. |
| Sources and versions | Every evidence row retains `core.source` and header licence, every input has a digest. Keep imported source licences separate when migrating. New hand-authored role/region judgments need their own provenance and rationale; do not attribute them to an imported drawing dataset. |

## Concept-by-concept migration decisions

All rows require the common source/sense checks above. Extent below is the intended semantic
check, not a newly asserted fact. “Usual regions open” applies to every row: existing presets,
measurements and labels need contextual region definitions under the published contracts.

| Owner concept | Existing typed evidence; specific remaining checks |
|---|---|
| duck | `k.animals.animal`, `k.objects.object`, `k.kinds.parent`, scene facts. Verify duck→bird sense path, inherited wings/beak and actual editable parts; distinguish duck from generic bird. Extent point/area depends on representation; support/water conditions and usual regions open. |
| bird | `k.animals.class`, `k.parts.whole/inherited`, object and outline. Verify wings/beak cardinalities and part bindings without making flight mandatory; generic bird realisation is a candidate ancestor. Extent and functional perch/support roles open. |
| swing | Object, drawn attribute and scene placement. Inspect its part realisation and select the seat explicitly; missing support-role/attachment conditions and editable seat binding. A swing picture does not establish a place for a child. Extent and usual regions open. |
| seat | Object, object parts and layout anchors. Resolve standalone seat versus seat-of-chair/swing; bind a supporting surface with containment/contact conditions. Required cardinality and selectable part geometry need verification; extent and usual regions open. |
| child | `k.people.kind` age/height/hair, face preset, person drawing. Concrete visual defaults exist; verify inherited body parts and observable child/person difference, without treating height as a hard age definition. Support roles, extent and usual regions open. |
| grandfather | `k.people.kind`, `k.people.role` (face=`old man`, moustache=`walrus`, glasses/walking stick), face preset candidate. Visible distinguishing cues are present, not absent; their selection/editability and optional status need checking. Kinship is not equivalent to appearance. Extent/support/usual regions open. |
| girl | People kinds and specific face preset. Verify inherited person structure and actual selected variant; preset hair/clothes are optional defaults, not defining constraints. Extent/support/usual regions open. |
| robot | Object, face preset kind=robot, usual parts. Keep mechanical object and face presentation senses apart; verify part cardinalities and visible robot/human distinction. Attachment/support, extent and usual regions open. |
| man | People kind and face preset with beard/hair defaults. Verify person inheritance and editable face/body bindings; do not harden defaults into sex/age definitions. Extent/support/usual regions open. |
| boy | People kind and face preset. Verify visible child/person specialisation and body/face editing; presets are context-dependent. Extent/support/usual regions open. |
| woman | People kind and face preset. Verify inherited person parts and editable distinctions; appearance defaults remain optional. Extent/support/usual regions open. |
| frog | Animal, object and usual parts. Verify amphibian sense, inherited/own legs and counts, frog-specific realisation and editing. Land/water support conditions, extent and usual regions open. |
| flower | Object, usual parts, attribute numbers, outline. Verify petal binding and cardinality, stem/head containment and editable petals, rather than substituting whole-object scaling. Extent/support/usual regions open. |
| petal | Named object part, number attribute and parent candidates. Verify flower-scoped identity, count and editable geometry; a named meronym is not an edit operation. Attachment, extent and usual regions open. |
| hair | Body part, object parts, face parts/slots (`hair_front`, `hair_back`). Verify both slots map to the requested semantic part across face styles; distinguish body hair from preset hair. Extent/attachment and usual length/colour regions open. |
| beard | Face slots/parts and people appearance defaults. Verify optional presence, named variants and editable binding rather than whole-face replacement. Attachment/extent and length/colour regions open. |
| grass | Object, usual parts, scene and attribute facts. Verify repeated blades versus area-cover realisation and which edits apply to each; extent must support area coverage. Ground/support and usual regions open. |
| lake | Object, scene and attribute candidates; geographic named lakes have separate senses. Verify area realisation, shore/water parts and containment; do not equate a lake with water or pond. Extent/layer and usual regions open. |
| pond | Object, scene and attribute candidates. Verify water and water-plant/fish expectations and editable boundary. Missing calculable pond/lake distinction; containment, area/layer and usual regions open. |
| water | Material/food/object/part candidates. Resolve water-as-substance versus depicted surface; verify area fill and containing-body joins separately. Do not infer same concept from shared blue pixels. Extent/containment/usual regions open. |
| sky | Attribute kind, landscape layout slot and object parts. A standalone drawable name is not required for a background region. Verify area/layer realisation, horizon boundaries and allowed placement; usual regions open. |
| ground | Landscape layout slot and object parts. Verify background/support surface and layer geometry; no exact standalone object is needed to recognise the role. Functional support conditions, area extent and usual regions open. |
| cloud | Object, outline, scene and attributes. Verify distinct cloud geometry and editing instead of a bird-like inherited graphic; extent/layer and placement conditions open. Usual regions open. |
| sun | Object, outline, parts and astronomical attribute candidates. Separate celestial body from drawing symbol; verify editable disk/rays and placement in sky region. Extent/layer and usual regions open. |
| house | Object, parts/usual/inherited structure, outline and number facts. Verify roof/wall/door cardinalities and edits, ancestor distinction and support/containment roles. Extent and usual proportions/colour regions open. |
| fish | Animal class, object, whole parts and outline. Verify fins/tail counts and fish-specific editing; containment in water is a functional condition, not a location label alone. Extent and usual regions open. |
| water plant | `k.objects.stand_in` maps to seaweed. Verify seaweed realisation/parts and whether the broader requested plant permits that stand-in; no universal identity or aquatic support rule follows. Area/point extent, containment and usual regions open. |
| levels | `k.layouts.layout` name=layers, words include levels; explicit horizontal order. Verify diagram levels versus landscape bands and bind nodes/regions to them. Extent/layers and spacing regions need contracts; lexical recognition is present. |
| node | `k.kinds.role` graph.node plus diagram shape/structure patterns. Role and rendered shape are separate; verify graph membership, editable node identity and edge endpoints. Extent and usual size regions open. |
| arrow | `k.shapes.shape`, object, parts and outline. Resolve pictorial arrow versus directed graph edge; verify endpoint direction and line/area extent, selectable head/shaft. Relation conditions and usual regions open. |
| hexagon | Shape facts, polygon parent, outline and object part. Preserve six-sided geometry, not only label; verify diagram shape binding and editable parameters. Area extent and usual regions open. |
| circle | Shape/outline and multiple parent senses (including theatre). Select geometric sense; verify roundness/radius and diagram binding rather than lexical parent union. Area/boundary extent and usual regions open. |
| letter | `k.genres.genre`, genre parts/moves and object drawing candidates. Select written correspondence, not alphabet glyph/envelope picture; verify greeting/body/closing/signature structure. Signer is instance data. Length/tone regions and editable section bindings open; physical support is inapplicable to document structure. |
| story | `k.genres.genre`, `k.story` structure and `k.expect.make/part` chapter counts. Verify character/goal/obstacle dependencies and ordered editable text structure. Factual subject provenance and length/tone regions open; geometric extent/support inapplicable. |
| chapter | `w.document.chapter` pattern, chapter words, story unit and expected part. Verify ordered parent relation, instance cardinality and text edit observation; absence from the shard-only exact-name inventory was not absence of recognition. Length regions open; geometric extent/support inapplicable. |
| narrator | No exact selected fact found by this audit. Verify story voice/narration declarations beyond exact names before asserting absence of the concept. A narrator identity must not be fabricated; editable narrative-role and tone/voice region bindings remain open. Geometric extent/support inapplicable. |
| colours | `k.colours.colour/basic`: RGB/rgb_about centres, family links and mixes. Existing coordinates support seed points, not complete regions. Declare colour space/unit/metric, region boundaries and source uncertainty; verify contextual usual colour joins separately. Parts/support inapplicable to colour values. |
| expressions | `k.faces.expression` maps to mouth/eyes/eyebrow variants. Verify observable multi-slot edits and expression-specific differences across styles. Missing measurable expression regions and uncertainty; names do not define axes. Extent/support apply to face parts, not expression values themselves. |

## Handoff after phase zero

Start with the swing-seat-child dependency and landscape region extents, then face/people
specialisations, graph shape/endpoint roles and document structure/quality. This is a dependency
order, not authority to guess missing facts. Preserve separately recognition, reasoning and
realisation evidence. Every migrated claim needs a published target contract, justified source
or explicit hand-authored rationale, and a test of the claimed relation or edit. Replay turns
remain an integration acceptance check; this ledger does not claim that replay succeeds.
