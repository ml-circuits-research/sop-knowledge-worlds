# k.geo

Geography: countries, capitals, continents, neighbours, population, area, largest cities, rivers, mountains, mountain
ranges, lakes, deserts, oceans and seas, each with a number where a free source or a usual figure has one.

## What it knows

- `k.geo.continent`: `name` (Africa, Antarctica, Asia, Europe, North America, Oceania, South America), `area_about`
  (square kilometres, the usual figure; `named=model`).
- `k.geo.country` (identity `name`): `code`, `formal`, `capital` (many), `continent`, `region`, `neighbour` (many),
  `population`, `area` (square kilometres), `landlocked`, `independent`, `lat`, `lon` (a point inside it), `west`,
  `south`, `east`, `north` (its box, in degrees). The name is the common short name (`"United States"`, `Serbia`:
  Natural Earth's `NAME` or `NAME_LONG`, whichever is shorter and not abbreviated); `formal` is the formal name
  (`"Republic of Serbia"`); `core.word` facts give the other names (`"United States of America"`, `"Dem. Rep. Congo"`).
- `k.geo.city` (identity `name` + `country`): `capital_of` (the country, for a national capital), `population`,
  `lat`, `lon`. The national capitals and the 5 largest places of each country.
- `k.geo.river` (identity `name` + `continent`): `country` (many: those it flows through), `lat`, `lon`, and its box;
  for 54 well-known rivers `length_about` (kilometres, the usual figure; `named=model`).
- `k.geo.mountain` (identity `name` + `continent`): `country`, `elevation` (metres), `lat`, `lon`.
- `k.geo.range` (identity `name` + `continent`): `lat`, `lon`, and its box.
- `k.geo.lake` (identity `name`): the 100 largest natural lakes: `continent`, `country` (many: on its shores),
  `area_about` (square kilometres: the area of Natural Earth's 1:10m outline worked out on the sphere, three digits
  kept), `lat`, `lon`, and its box. Lake Superior 82,100; Lake Victoria 67,300; Lake Baikal 31,400.
- `k.geo.desert` (identity `name`): 58 deserts: `continent`, `lat`, `lon`, box; for 17 of them `area_about` (the usual
  figure; `named=model`).
- `k.geo.sea` (identity `name`): 72 oceans, seas, gulfs, bays, straits and channels: `kind`, `lat`, `lon`, box; for
  the 5 oceans and 17 seas `area_about` (the usual figure; `named=model`).
- A number that is only approximate has the suffix `_about`. The unit of every number is a `k.units.measure` fact
  (`world=k.geo type=mountain key=elevation unit=metre`).
- A name of several words is a string (`"Mount Everest"`). No geometry beyond a point and a box.

## Shards

Two per continent:

- `<continent>` (`europe`, `north-america`, …): everything from Natural Earth, public domain.
- `<continent>-borders`: `neighbour`, `area` and `landlocked` of the same countries, from mledoze/countries, ODbL-1.0.
  It names each country again (`k.geo.country name=Moldova neighbour=…`), so when both shards are told the facts of
  one country are one wire. An application that wants public-domain facts only leaves these shards out.

- `seas`: the oceans and seas, from Natural Earth, public domain.
- `numbers`: the approximate numbers that no imported source gives (river lengths, the areas of oceans, seas,
  deserts and continents), hand-written (`hand-core 1`, CC0-1.0, `named=model`; `tools/geo-numbers.mjs`). Each fact
  names a thing of the other shards, so the facts merge when both are told.
- `<continent>-borders` also has the `capital` of the 37 countries and territories for which Natural Earth marks
  none (South Sudan, Nauru, Greenland, Puerto Rico …).

15 shards, 3,858 wires, 695,907 bytes; the largest is `asia`.

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
- No capital is known for Macao, Northern Cyprus, Åland and three territories without inhabitants.
- Natural Earth's rivers are named piece by piece, so no length is worked out from them (the Nile's line is 2,760
  km long there); the outlines of deserts and seas are for labels, so no area is worked out from them either.
- The rivers of Siberia (Lena, Ob, Amur) are filed under Europe: Natural Earth files Russia there.

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2-countries` (ODbL-1.0): the two-letter code (`code2`), `currency` and `language` (many) of 234 countries, 15 territories that were missing (Palestine, Gibraltar, French Guiana, Réunion …) and 42 more names of countries (uk, britain, usa, holland, burma, Türkiye); `psys2-cities-<continent>` (CC-BY-4.0, GeoNames): 597 more cities (79 of them after the catalog-lacks hand-over: a city farther than 5 km from one of ours is a city of its own, Mississauga, Guarulhos, Foshan); `psys2-city-words` (CC-BY-4.0): 15 other spellings of cities we have (Saint Petersburg, Sevilla, Ulan Bator), a city of PSys2 within 5 km of ours whose name is spelt alike; `psys2-groups` (CC0): `k.geo.group`, 8 groups of countries with their members as of 2024 (European Union, NATO, Scandinavia, Nordic countries, Baltic states, Benelux, Balkans, Middle East).
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
