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
