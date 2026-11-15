# wikidata-thing-attributes

- **What:** Wikidata items that carry a WordNet 3.1 synset id (P8814), with their direct values for made from material
  (P186), has use (P366), color (P462), instance of (P31) and subclass of (P279): 84,380 rows, 35,557 synsets.
- **Origin:** Wikidata Query Service (https://query.wikidata.org/sparql), English labels (and `wbgetentities` for the
  missing ones); fetched 2026-11-15 by PSys2's machine for questions.md Q80 (psys2 `data/external/wikidata-thing-attributes/`,
  commit 30a5808a, with its own SOURCE.md).
- **Version:** 2026-11-15 (the fetch).
- **License:** CC0-1.0 (Wikidata structured data, https://www.wikidata.org/wiki/Wikidata:Licensing).
- **How to fetch:** copy psys2 `data/external/wikidata-thing-attributes/thing-attributes.tsv` into `sources/wikidata-thing-attributes/raw/`;
  run `node tools/import/attributes-data.mjs`.
- **What is kept:** for the 1,500 common things (tools/coverage.mjs) whose kept sense is an item's P8814: P186 as
  `material` (not for foods) and P366 as `used_for`, only where the catalog has none and only the values the hand check
  (sources/coverage/kr6-wikidata-*-audit.tsv) found right while its error is 5 % or more. Columns: synset_id, item,
  label, property, property_label, value_item, value_label.
