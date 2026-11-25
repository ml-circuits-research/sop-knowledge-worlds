# pro-formaliser: shared property vocabulary, English frames, context-property frames and weather words

- **What:** reusable SOP declarations imported from this source in two batches: eight property aliases and two
  generic English owner/property frames (4fdfc00), plus two context-property frames with their eleven ordered parts
  and twelve weather value words (b5e5bd7).
- **Origin:** this project’s pro-formaliser repository, https://github.com/ml-circuits-research/pro-formaliser.
- **Version:** 4fdfc00 (batch INTEGRATE-1) and b5e5bd7 (batch INTEGRATE-4); `core.source` keeps the revision each
  fact came from (`core.source="pro-formaliser 4fdfc00"`, `core.source="pro-formaliser b5e5bd7"`).
- **License:** CC0-1.0 for these original project-authored SOP declarations, with the owner’s authorization recorded
  below.
- **Attribution:** the project authors; original declaration provenance is retained in core.source.
- **How to fetch:** read, at the stated revision, `sop-worlds/vocabulary/visual-properties.sop` and
  `sop-worlds/language/property-frames.sop` (4fdfc00), and `sop-worlds/pro.reader/implicit-property-frames.sop` and
  `sop-worlds/pro.reader/grouped-effects.sop` (b5e5bd7).
- **What is kept:** forty-nine facts in two batches (24 in INTEGRATE-1, 25 in INTEGRATE-4). INTEGRATE-1 (4fdfc00): the three edge-route aliases, two
  edge-style aliases and three document-alignment aliases, plus both owner/property frames and their fourteen ordered
  parts, under canonical owned IDs; vocabulary in w.diagram/shards/words.sop and w.document/shards/words.sop, grammar
  in w.lang.en/shards/property-frames.sop. INTEGRATE-4 (b5e5bd7): the two context-property frames and eleven parts in
  w.lang.en/shards/context-property-frames.sop, and the twelve `core.word` rows naming values of the existing
  w.drawing.page.weather slot in w.drawing/shards/words.sop (sunny/sun, cloudy/cloud, misty/mist, foggy/fog, hazy/haze,
  rainy/rain, snowy/snow, frosty/frost, icy/ice, breezy/breeze, windy/wind, stormy/storm). The `pro.reader.*` machinery
  of the same files is not imported.

## Batch INTEGRATE-1, revision 4fdfc00

Eight property aliases and two owner/property frames; the batch is published and its attribution is unchanged.

## Batch INTEGRATE-4, revision b5e5bd7 (2026-11-25)

Twenty-five facts: the two context-property frames and eleven parts (`context.set.property`, `context.make.property`)
and the twelve weather value words. Scope not taken: the slot declares fourteen values, so `clear` and `overcast` have
no word in this batch. Licence and attribution are the source-level ones above.

## Owner authorization, 2026-11-25

The owner explicitly authorized moving the reusable SOP declarations from pro-formaliser/sop-worlds into the canonical knowledge repository, then confirmed: “nu exista probleme de licente, e munca noastra in toate proiectele”. This confirms project ownership and permission to publish this original SOP material under the canonical repository’s CC0-1.0 terms. The earlier provisional import hold is resolved. Third-party imported material retains its documented source terms.

The literal edge-style aliases describe a single style assignment. They do not describe the separate relation that copies existing drawing styles into legend samples; the integration controls verify that distinction.
