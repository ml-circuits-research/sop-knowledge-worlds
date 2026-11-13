# k.geo

Geography: countries, capitals, continents, neighbours, population, area, largest cities, rivers and mountains.

## What it knows

- `k.geo.continent`: `name` (Africa, Antarctica, Asia, Europe, North America, Oceania, South America).
- `k.geo.country` (identity `name`): `code`, `official`, `capital` (many), `continent`, `region`, `neighbour` (many),
  `population`, `area` (square kilometres), `landlocked`, `independent`, `lat`, `lon` (a point inside it), `west`,
  `south`, `east`, `north` (its box, in degrees). Names are Natural Earth's (`"United States of America"`,
  `"Republic of Serbia"`); `core.word` facts give other names (`"United States"`, `Serbia`).
- `k.geo.city` (identity `name` + `country`): `capital_of` (the country, for a national capital), `population`,
  `lat`, `lon`. The national capitals and the 5 largest places of each country.
- `k.geo.river` (identity `name` + `continent`): `country` (many: those it flows through), `lat`, `lon`, and its box.
- `k.geo.mountain` (identity `name` + `continent`): `country`, `elevation` (metres), `lat`, `lon`.
- `k.geo.range` (identity `name` + `continent`): `lat`, `lon`, and its box.
- A name of several words is a string (`"Mount Everest"`). No geometry beyond a point and a box.

## Shards

Two per continent:

- `<continent>` (`europe`, `north-america`, …): everything from Natural Earth, public domain.
- `<continent>-borders`: `neighbour`, `area` and `landlocked` of the same countries, from mledoze/countries, ODbL-1.0.
  It names each country again (`k.geo.country name=Moldova neighbour=…`), so when both shards are told the facts of
  one country are one wire. An application that wants public-domain facts only leaves these shards out.

13 shards, 3,473 wires, 634,408 bytes; the largest is `asia` (811 wires, 140 kB).

## Sources

Natural Earth 5.1.2 (public domain) and mledoze/countries 5.1.0 (ODbL-1.0): `sources/natural-earth/SOURCE.md`,
`sources/countries/SOURCE.md`, `../LICENSES.md`. Import: `node tools/import/geo.mjs`.

## Questions it helps with

See `tests/k.geo.questions.jsonl`: the capital of Moldova; its neighbours; the continent of France; the country
whose capital is Nairobi; how high Mount Everest is; the countries the Danube flows through; the largest cities of
Italy; whether Switzerland is landlocked.

## Limits

- A box that crosses the 180th meridian spans −180 to 180 (Russia, Fiji, United States).
- Rivers carry the countries their line passes through at Natural Earth's 1:10m scale; a border river may miss one.
- Two rivers or mountains of one name on one continent: only the larger is kept.
- Disputed and dependent territories are listed as Natural Earth lists them, with `independent=false`.
