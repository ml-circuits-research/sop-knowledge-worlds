# countries: mledoze/countries

- **What:** a list of the world's countries with codes, borders, area and more. Used in `k.geo` only for what
  Natural Earth (public domain) does not have: land neighbours, area, landlocked.
- **Origin:** https://github.com/mledoze/countries , tag `5.1.0` (commit `f931d9cfb70446d2d8e3c3193726b211f695afd3`),
  file `countries.json` (sha256 `1c097ce85e7fbae8e2dd9ab7e7b40056039737d2f4f4517fb4ff8aff43bb24b4`).
- **Version:** 5.1.0 (`core.source="countries 5.1.0"`).
- **License:** ODbL-1.0 (Open Database License: attribution, share-alike for the database).
- **Attribution:** Contains information from mledoze/countries (https://github.com/mledoze/countries), which is
  made available under the Open Database License (ODbL) 1.0, https://opendatacommons.org/licenses/odbl/1-0/ .
- **How to fetch:** `mkdir -p sources/countries/raw && curl -L -o sources/countries/raw/countries.json
  https://raw.githubusercontent.com/mledoze/countries/f931d9cfb70446d2d8e3c3193726b211f695afd3/countries.json`
- **What is kept:** per country that Natural Earth also has (joined by code; 233 of 250): `neighbour` (the
  countries of `borders`), `area` (square kilometres), `landlocked`; in the shards `<continent>-borders`, which keep
  this licence. Everything else of `k.geo` comes from Natural Earth (the owner's rule: the more permissive source).
- **Round 9 (2026-11-13):** also kept: `capital`, only for the 37 countries and territories for which Natural Earth
  marks no capital; in the `-borders` shards, under ODbL like the rest of the list.
- **2026-11-15:** also kept: each of those capitals as a `k.geo.city` (name, country; `capital_of` is derived since
  KR1 item 2) in the same
  shards, and the capitals of the list's countries that Natural Earth lacks (Western Sahara, Tokelau …); where
  Natural Earth names the same place otherwise, the list's spelling as a `core.word` (Hagåtña, Papeetē, Cockburn Town).
- **KR1 item 2 (2026-11-15):** the list's `capital` also decides between the places Natural Earth marks as capitals of
  one country (16 countries: only those the list names stay, `tools/import/geo.mjs`). Its three capitals of
  Caribbean Netherlands are not taken: Kralendijk is the capital, Oranjestad and The Bottom are cities only.
