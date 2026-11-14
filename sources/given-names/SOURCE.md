# given-names: Wikidata given names with a sex class

- **What:** the given-name items of Wikidata in the classes male given name (Q12308941), female given name
  (Q11879590) and unisex given name (Q3409032) with at least 6 sitelinks, their English label, and the number of
  Wikidata humans whose given name (P735) is the item; the 3,000 most borne.
- **Origin:** Wikidata Query Service (https://query.wikidata.org/sparql), fetched by PSys2's machine on 2026-11-14 into
  psys2 `data/external/given-names/given-names.tsv` (psys2 commit `0a24284f`; its SOURCE.md gives the two queries).
  Read in place from a psys2 checkout and copied to `sources/given-names/raw/given-names.tsv` (sha256
  `367b0f4a92cc8fcec612483f49b43237cbd3db4302fa542b8679c7b16036b099`; header `name sex usage qid`, 3,000 rows).
- **Version:** 2026-11-14 (`core.source="wikidata-given-names 2026-11-14"`).
- **License:** CC0 1.0 (https://www.wikidata.org/wiki/Wikidata:Licensing); the shards are CC0-1.0.
- **How to fetch:** copy `data/external/given-names/given-names.tsv` of a psys2 checkout (commit `0a24284f` or later)
  to `sources/given-names/raw/`; then `node tools/import/given-names.mjs`.
- **What is kept:** one fact per English label (`k.people.given_name`): the name as spelled, its sexes (female, male;
  both for a unisex item), the holders (added over the items of one label: Anna is Q666578 and Q22713652), a band
  computed from the holders (very common >= 10,000; common >= 1,000; frequent >= 100; rare below), and the Wikidata
  items. Left out: a label with no Latin letter (one: ג'וי, Q4539731).
- **Counts (2026-11-15):** 3,000 items, 2,990 names (9 labels of two items merged, 1 left out): 123 very common,
  934 common, 1,441 frequent, 492 rare; 184 of both sexes; 26 shards (`k.people/shards/given-names-<letter>`),
  489,605 bytes.
- **Not used:** the SSA national baby names (public domain; ssa.gov refuses automated fetches). A CC0 copy exists in
  the R package babynames (github.com/hadley/babynames, data/babynames.rda, 1880-2017, 1,924,665 rows); it was read
  once (10,570 names with at least 1,000 births) and set aside when the reviewer chose the Wikidata set.
