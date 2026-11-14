# wikidata-typical: typical numbers from Wikidata

- **What:** numbers of Wikidata items by property, for typical ranges of k.attributes: the mass and length of taxa,
  the height of buildings, the area of countries (and, read but not used, heights and lifespans of taxa, heights of
  structures, populations, areas and elevations of cities, populations and elevations of countries, planets).
- **Origin:** Wikidata Query Service (https://query.wikidata.org/sparql), fetched by PSys2's machine on 2026-11-14 into
  psys2 `data/external/wikidata-typical-numbers/` (one CSV per property: `item, label, value, unit`; each query capped
  at 1,500 rows, so a file is a sample, not complete). Reviewer blocks 17:55, 19:20, 19:35 of worker-tasks.md.
- **Version:** 2026-11-14 (`core.source="wikidata-typical 2026-11-14"`).
- **License:** CC0-1.0 (Wikidata structured data, https://www.wikidata.org/wiki/Wikidata:Licensing).
- **Attribution:** none required. Data from Wikidata.
- **How to fetch:** copy psys2 `data/external/wikidata-typical-numbers/*.csv` into `sources/wikidata-typical/raw/`
  (git-ignored), then `node tools/ranges-core.mjs`.
- **What is kept:** no item and no value: only the derived ranges (quartiles and median, one value per item: the
  median of its statements, after converting units to the unit k.units.measure gives), shard
  `k.attributes/shards/ranges-wikidata.sop`. Not used: animals' height (60 items), lifespan (70, no key in the
  catalog), speed (3); structures' height (no kind of the catalog); cities' population (152 items: Natural Earth's 872
  are used), area and elevation (k.geo.city has no such key); countries' population (23 items) and elevation (7);
  planets (exoplanets, in Jupiter units). Per-item values were not imported into k.animals or k.geo: of the 314
  animals of k.animals, 5 have a Wikidata mass and 5 a length in these samples.
