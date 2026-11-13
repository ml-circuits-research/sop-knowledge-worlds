# openmoji: OpenMoji, the colour SVG drawings

- **What:** the open-source emoji and icon project of HfG Schwäbisch Gmünd: one SVG per emoji, and extra icons that
  are not Unicode emoji. Used for `k.objects`: things that neither the hand-written objects nor Noto Emoji have.
- **Origin:** https://github.com/hfg-gmuend/openmoji , commit `3e01de523ddefe9c5e46a7765b15efef04bf9002`, folders
  `color/svg` and `data` (`openmoji.json`: names, groups, tags).
- **Version:** the commit (`core.source="openmoji 3e01de5"`).
- **License:** CC-BY-SA-4.0 (`LICENSE.txt` of the repository).
- **Attribution:** All emojis designed by OpenMoji – the open-source emoji and icon project (https://openmoji.org).
  License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ . The drawings were changed: converted to
  simplified polygons, lines and primitive shapes with flat colours, at most 16 parts per object.
- **How to fetch:** `git clone --depth 1 --filter=blob:none --sparse https://github.com/hfg-gmuend/openmoji.git
  sources/openmoji/raw/repo && cd sources/openmoji/raw/repo && git sparse-checkout set --cone color/svg data` (check
  out the commit above for byte-identical shards); then `node tools/import/openmoji.mjs`.
- **What is kept:** entries of the groups of things (animals-nature, food-drink, travel-places, activities, objects)
  and of the extras subgroups animals-nature, food-drink, gardening, objects, technology, travel-places,
  healthcare, whose name no earlier source has and that are things (no signs, people, actions, complaints, local
  in-jokes). Name: `annotation`; `core.word`: `tags` and `openmoji_tags`. Conversion as for Noto Emoji, with outlines
  (shapes that are at least 30% hole) as closed lines.
- **Counts (2026-11-13):** 1,059 candidates; 816 names already taken (hand-written or Noto), 129 not things; **114
  new objects**, 1,322 parts, 10,928 points, 18 shards.
