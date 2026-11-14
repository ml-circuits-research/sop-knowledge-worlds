# cldr: Unicode CLDR English emoji names and keywords, and the emoji list

- **What:** the English short name and the search keywords of every emoji (CLDR annotations), and the list of emoji
  with their group and subgroup (`emoji-test.txt`). Used to name the `k.objects` drawings imported from Noto Emoji,
  to keep only things, and to group them into shards.
- **Origin:** https://github.com/unicode-org/cldr-json , tag `48.2.3`,
  `cldr-json/cldr-annotations-full/annotations/en/annotations.json` (sha256
  `f22083cb86dffb63a643d5bacb5d9899f82d2fa5d388ad4f3aed72184acef505`); https://github.com/unicode-org/cldr , tag
  `release-48`, `tools/cldr-code/src/main/resources/org/unicode/cldr/util/data/emoji/emoji-test.txt` (emoji 17.0,
  sha256 `f10773f8aee18d5091ab7b3659b08c83eace3ece0bae1621b09de6a98e0ce7a9`).
- **Version:** 48 (`core.source="cldr 48"`).
- **License:** Unicode-3.0 (Unicode License V3, permissive, with the copyright notice kept).
- **Attribution:** Copyright © 1991-2025 Unicode, Inc. Unicode CLDR data, used under the Unicode License V3 (text:
  `docs/worlds/k.objects/LICENSE.cldr`).
- **How to fetch:** `mkdir -p sources/cldr/raw && cd sources/cldr/raw && curl -L -O
  https://raw.githubusercontent.com/unicode-org/cldr-json/48.2.3/cldr-json/cldr-annotations-full/annotations/en/annotations.json
  && curl -L -O
  https://raw.githubusercontent.com/unicode-org/cldr/release-48/tools/cldr-code/src/main/resources/org/unicode/cldr/util/data/emoji/emoji-test.txt`
- **What is kept:** per kept emoji its English short name (the object's name) and its keywords (`core.word` facts).
- **Also kept (block 03:20 item 3, 2026-11-15), for `k.units.currency`:** `cldr-json/cldr-numbers-full/main/en/currencies.json`
  (English names, plural names, symbols; sha256 `a6c41b28f4035f65ae698b53a66866982b4ff49bc0de7e840f91d2c6e6bdc23b`) and
  `cldr-json/cldr-core/supplemental/currencyData.json` (digits after the point, which regions use which currency
  since when; sha256 `e50315091b1f34428480f82970be64159ad207af0bdcebe7faa6260d3e34c8a6`), both of tag `48.2.3`. Fetch:
  `cd sources/cldr/raw && curl -L -O https://raw.githubusercontent.com/unicode-org/cldr-json/48.2.3/cldr-json/cldr-numbers-full/main/en/currencies.json
  && curl -L -O https://raw.githubusercontent.com/unicode-org/cldr-json/48.2.3/cldr-json/cldr-core/supplemental/currencyData.json`;
  then `node tools/import/currencies.mjs`. Kept: the currencies that are legal tender in some region today (153):
  code, English name and plural, the last word of each as the everyday unit, symbol and narrow symbol where they are
  not the code, digits, the regions as k.geo country names (shard `k.units/shards/currencies`, licence Unicode-3.0).
