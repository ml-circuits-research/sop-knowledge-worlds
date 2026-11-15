# wikidata-islands: islands from Wikidata

- **What:** islands (items whose P31 is island, Q23442, or a direct subclass of it) with an area of 100 km² or
  more, or 20,000 inhabitants or more, and a coordinate: English label, coordinate (P625), area (P2046, normalised
  to m²), country (P17, by its ISO 3166-1 alpha-3 code P298), archipelago (P361 whose item is an archipelago,
  Q33837, or a direct subclass). For `k.geo.island` (psys2 real turn T43: a map places "Tenerife").
- **Origin:** Wikidata Query Service (https://query.wikidata.org/sparql), fetched 2026-11-15 with the User-Agent
  `psys2-data-fetch/1.0`. 1,774 rows, 1,440 items.
- **Version:** 2026-11-15 (`core.source="wikidata-islands 2026-11-15"`).
- **License:** CC0-1.0 (Wikidata structured data, https://www.wikidata.org/wiki/Wikidata:Licensing).
- **Attribution:** none required. Data from Wikidata.
- **How to fetch:** save the query below as `sources/wikidata-islands/raw/query.rq`, then
  `curl -sS -G https://query.wikidata.org/sparql -H 'User-Agent: psys2-data-fetch/1.0' -H 'Accept: application/sparql-results+json' --data-urlencode query@sources/wikidata-islands/raw/query.rq -o sources/wikidata-islands/raw/islands.json`;
  then `node tools/import/geo-places.mjs` (it also needs Natural Earth's `ne_10m_geography_regions_polys.geojson`).

```sparql
SELECT DISTINCT ?island ?islandLabel ?coord ?areaM2 ?iso3 ?arch ?archLabel WHERE {
  { ?island wdt:P31/wdt:P279? wd:Q23442 . ?island p:P2046/psn:P2046/wikibase:quantityAmount ?a . FILTER(?a >= 100000000) }
  UNION
  { ?island wdt:P31/wdt:P279? wd:Q23442 . ?island wdt:P1082 ?p . FILTER(?p >= 20000) }
  ?island wdt:P625 ?coord .
  OPTIONAL { ?island p:P2046/psn:P2046/wikibase:quantityAmount ?areaM2 . }
  OPTIONAL { ?island wdt:P17 ?c . ?c wdt:P298 ?iso3 . }
  OPTIONAL { ?island wdt:P361 ?arch . ?arch wdt:P31/wdt:P279? wd:Q33837 . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

- **What is kept:** 1,382 islands: one per English name (the largest; Long Island is New York's), items without an
  English label and names ending in "Islands" or "Archipelago" (groups that Wikidata calls islands) left out. The
  countries k.geo knows (1,311 islands have one), the archipelagos (448), a point (the southernmost of Wikidata's
  coordinates when it has several), the Wikidata item. `area` (the smallest statement) only for islands of 1,000 km²
  or more (324): see the check.
- **Hand check (KR6, 2026-11-15):** three samples. (1) every 35th island (40): 4 wrong: Tyuleniy Archipelago (a group:
  names ending in Archipelago/Islands now left out), Taboga Island (area 121 km² for about 6), Cres (archipelago
  Dalmatian; it lies in the Kvarner Gulf: corrected), plus Walcheren without a country (Wikidata gives none; a former
  island, now joined to the mainland). (2) after the group filter, every 33rd island (42): 3 wrong areas
  (Mykonos 106 km², the municipality's, for 86; Cozumel 539 for 478; Sabuniyah 124 for a small islet). Names,
  countries and points: 0 wrong in 82. Areas of islands under 1,000 km²: 4 wrong in 62 (6.5 %: Taboga, Mykonos, Cozumel,
  Sabuniyah), above the 5 % KR6 allows, so not imported. (3) every 10th island of 1,000 km² or more (33): 1 wrong (Illas Ons, 4,458 km² for
  about 4.3: area removed); with the larger islands of samples 1 and 2, 1 in 53 (1.9 %). Corrections, by Wikidata
  item, in `ISLAND_FIXES` of the import script (also Malta, the island, whose P17 gave Italy). What is published, as
  first imported: 2 wrong values in the 115 islands checked (Cres's archipelago, Illas Ons's area: 1.7 %), both
  corrected.
