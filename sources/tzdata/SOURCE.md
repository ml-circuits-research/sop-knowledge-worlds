# tzdata (the IANA time zone database)

- **What:** the time zones of the IANA time zone database (tz, "Olson"): `zone1970.tab`, one row per zone that has had
  the same clocks since 1970, with the ISO 3166 codes of the countries it covers, the coordinates of its principal
  place and a comment; the UTC offset of each zone in January and July of 2026, read from the same release through
  Node's `Intl` (ICU's copy of tz, release 2026e, `process.versions.tz`).
- **Origin:** https://www.iana.org/time-zones; the files as installed by the system's tzdata package
  (`/usr/share/zoneinfo/zone1970.tab`, `iso3166.tab`, `tzdata.zi` for the release line).
- **Version:** 2026e.
- **License:** public domain (the tz database: "This database is in the public domain", the file LICENSE of tz).
- **How to fetch:** copy `zone1970.tab` and `iso3166.tab` from `/usr/share/zoneinfo/` (or from the release tarball
  tzdata2026e.tar.gz of https://data.iana.org/time-zones/releases/) into `sources/tzdata/raw/`, and the first line of
  `tzdata.zi` (`# version 2026e`) into `sources/tzdata/raw/version.txt`; run `node tools/import/tzdata.mjs`.
- **What is kept:** zone, countries (two-letter codes), latitude and longitude of the principal place, the comment,
  the offsets in January and July 2026 in minutes, and whether they differ (summer time). Not kept: the rules and
  transitions of past years.
