# mulberry: Mulberry Symbols

- **What:** about 3,400 coloured pictograms made for communication aids (AAC), each named in English and put in a
  category. Chosen as the second filled icon set for `k.objects` after comparing 20 objects with game-icons
  (`game-icons/icons`, CC BY 3.0: one colour, white on black, fantasy-game subjects, 11 of the 20 everyday names
  present) — Mulberry had 17 of the 20, in colour, drawn for exactly these everyday things (worker-log.md).
- **Origin:** https://github.com/mulberrysymbols/mulberry-symbols , commit
  `fa94a93ca1b5357c0b6e0d9f8a81c426a1dfefdf`, folder `EN` (the SVGs) and `scripts/data/symbol-info.csv` (names,
  categories, grammar, tags).
- **Version:** the commit (`core.source="mulberry fa94a93"`).
- **License:** CC-BY-SA-4.0 (`LICENSE.txt`: "licensed under the Creative Commons Attribution-Share Alike License",
  https://creativecommons.org/licenses/by-sa/4.0/).
- **Attribution:** Mulberry Symbols, Copyright 2018-2026 Steve Lee, https://mulberrysymbols.org , CC BY-SA 4.0. The
  drawings were changed: converted to simplified polygons, lines and primitive shapes with flat colours, at most 16
  parts per object.
- **How to fetch:** `git clone --depth 1 https://github.com/mulberrysymbols/mulberry-symbols.git
  sources/mulberry/raw/repo` (check out the commit above); then `node tools/import/mulberry.mjs`.
- **What is kept:** nouns in the categories of things (animals, art making, buildings and their contents, furniture,
  celebration items, clothes, drinks, electrical, food, grooming and medical items, travel, games, playground,
  toys, money, instruments, plants, science, sport accessories, tools, transport, stationery); the first drawing
  of a thing (no `_2`, `_3` variants); names no earlier source has. Name: the file name with spaces;
  `core.word`: the tags. Not kept: verbs, people, feelings, flags, maps, letters, numbers, descriptive symbols.
  Also not kept: the 149 names in `excluded.tsv` (name, reason), found by looking at every converted drawing: ideas,
  adjectives, actions, places, groups of things, parts pointed at with an arrow (118), and drawings that do not
  survive the conversion (31: drawn black, or only loose lines are left); and 44 club football kits (reviewer's
  answer to Q16). One kit stays: `renamed.tsv` (Mulberry name, object name) keeps "football kit blank" as "football kit".
- **Counts (2026-11-13):** 3,435 symbols; 1,930 not things, 118 variants, 237 names already taken, 193 excluded;
  **958 objects**, 13,498 parts (1,167 named, 6,334 details), 135,852 points, 149 shards.
