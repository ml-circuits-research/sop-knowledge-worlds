# geonames: GeoNames cities, through the PSys2 world geo.map

- **What:** cities of the world with country, population and position.
- **Origin:** https://www.geonames.org , as packaged by the npm package `all-the-cities` 3.1.0 and selected by
  the PSys2 script `scripts/build-geo-data.mjs` (the largest cities and the capitals, 1,001 in all); read here
  from `worlds/geo.map/kb.sop` of PSys2 at commit `6b63b2ba`, not from GeoNames itself.
- **Version:** all-the-cities 3.1.0 (`core.source="geonames all-the-cities-3.1.0"`).
- **License:** CC-BY-4.0.
- **Attribution:** Contains data from GeoNames (https://www.geonames.org), licensed under CC BY 4.0.
- **How to fetch:** a checkout of PSys2; then `node tools/import/psys2.mjs --from <checkout>`.
- **What is kept:** only the cities that `k.geo` did not have from Natural Earth (not by name in the country,
  nor within a quarter of a degree of a city it has): name, country, population (the city proper), latitude and
  longitude rounded to two places; in the shards `k.geo/shards/psys2-cities-<continent>`.
