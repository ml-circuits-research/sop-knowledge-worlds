# natural-earth: Natural Earth vector data

- **What:** public domain map data: countries, populated places, rivers, elevation points and physical regions,
  with names and attributes. Used for `k.geo`.
- **Origin:** https://github.com/nvkelso/natural-earth-vector , tag `v5.1.2` (commit
  `f1890d9f152c896d250a77557a5751a93d494776`), folder `geojson`: `ne_50m_admin_0_countries`,
  `ne_10m_populated_places_simple`, `ne_10m_rivers_lake_centerlines`, `ne_10m_geography_regions_elevation_points`,
  `ne_10m_geography_regions_polys`, `ne_10m_lakes`, `ne_10m_geography_marine_polys` (`.geojson`).
- **Version:** 5.1.2 (`core.source="natural-earth 5.1.2"`).
- **License:** public domain (`LICENSE.md` of the repository: "All versions of Natural Earth raster + vector map
  data found on this website are in the public domain"); written `public-domain` in shard headers and the catalog.
- **Attribution:** none required. Made with Natural Earth, free vector and raster map data at naturalearthdata.com.
- **How to fetch:** `mkdir -p sources/natural-earth/raw && cd sources/natural-earth/raw && for f in
  ne_50m_admin_0_countries ne_10m_populated_places_simple ne_10m_rivers_lake_centerlines
  ne_10m_geography_regions_elevation_points ne_10m_geography_regions_polys ne_10m_lakes
  ne_10m_geography_marine_polys; do curl -L -O
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/$f.geojson; done` ; then
  `node tools/import/geo.mjs`.
- **What is kept:** countries and territories (name `ADMIN`, code, formal name, capitals from the populated places,
  continent, UN subregion, population estimate, label point, bounding box of the 1:50m outline; other names as
  `core.word`); per country its national capitals and its 5 largest places; named rivers (pieces of one name that
  touch are one river; its countries are those its line passes through); named mountains with elevation; mountain
  ranges with centre and box. English names where Natural Earth has them. No outlines, no lines: a centre point and
  a bounding box only. A box that crosses the 180th meridian (Russia, Fiji, United States) spans the whole range.
- **Counts (2026-11-13):** 238 countries and territories (4 dropped: no code or indeterminate), 872 cities (70
  places without a known country or population dropped), 1,074 rivers (119 dropped: no name, no country, or a
  second river of the same name on the continent), 627 mountains, 216 ranges, 206 word wires.
- **Round 9 (2026-11-13):** also kept: the 100 largest natural lakes (no reservoirs; bays and channels of a lake
  and lagoons are not lakes of their own) with the countries on their shores and the area of their outline, worked
  out on the sphere and kept to three digits (`area_about`); 58 deserts (name, continent, centre, box); 72 oceans,
  seas, gulfs, bays, straits and channels of scale rank 0 to 3 (kind, centre, box). Not taken from the geometry:
  river lengths and the areas of deserts and seas (see `k.geo/WORLD.md`, Limits).
