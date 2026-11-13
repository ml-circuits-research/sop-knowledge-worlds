# noto-emoji: Noto Emoji, the SVG drawings

- **What:** Google's Noto Emoji: one SVG drawing per emoji. Used as the shapes of everyday things in `k.objects`.
- **Origin:** https://github.com/googlefonts/noto-emoji , commit `99701e07d3d1fe1bdbcdb14964547f0fd592966f`, folder
  `2D/svg` (3,751 files; the files `emoji_u<code points>.svg`).
- **Version:** the commit (`core.source="noto-emoji 99701e0"`).
- **License:** Apache-2.0 (`2D/svg/LICENSE` in the repository: "Copyright 2013 Google, Inc. All Rights Reserved.
  Licensed under the Apache License, Version 2.0"; the fonts are OFL-1.1 and the flag images public domain; neither is
  used).
- **Attribution:** Noto Emoji, Copyright 2013 Google, Inc., licensed under the Apache License, Version 2.0
  (http://www.apache.org/licenses/LICENSE-2.0 ; the notice is `docs/worlds/k.objects/LICENSE.noto-emoji`). The
  drawings were changed: converted to simplified polygons and primitive shapes with flat colours, at most 16 parts
  per object.
- **How to fetch:** `git clone --depth 1 --filter=blob:none --sparse https://github.com/googlefonts/noto-emoji.git
  sources/noto-emoji/raw/repo && cd sources/noto-emoji/raw/repo && git sparse-checkout set --cone 2D/svg` (check out
  the commit above for byte-identical shards); then `node tools/import/noto-emoji.mjs`.
- **What is kept:** the emoji of the groups Animals & Nature, Food & Drink, Travel & Places, Activities and Objects
  (things; no faces, hands, people, flags, symbols, letters; inside the kept groups no clock faces for each half hour
  and no card suits). Per drawing: every visible element as one part; circles, ellipses and rectangles as primitives;
  paths flattened and simplified (Douglas-Peucker) to at most 40 points a part and about 200 points an object; holes,
  gradients (one flat colour, the middle stop), clips and translucent overlays dropped; a shape that is mostly hole
  (a frame, a ring) becomes a closed line along its outer edge; at most 16 parts (the
  largest). Part names: `sources/noto-emoji/part-names.tsv` (written by a language model looking at numbered
  pictures; `named=model`), else `part1…partN`.
- **Twemoji was not compared:** the Noto drawings convert well (see worker-log.md R2.6) and Apache-2.0 is more
  permissive than CC BY 4.0 (the owner's rule: the more permissive source).
- **Counts (2026-11-13, all):** 861 emoji in the kept groups, 32 not things, 18 with a hand-written object of the same
  name (left out, questions.md Q12): 811 objects, 10,152 parts, 120,941 points, 802 word wires; 132,706 wires in 124
  shards, 16,153,844 bytes. `sources/noto-emoji/limit.txt` holds how many objects the build takes (0: all).
