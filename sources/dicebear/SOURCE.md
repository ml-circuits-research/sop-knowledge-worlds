# dicebear: DiceBear avatar styles

- **What:** the official avatar style definitions of DiceBear: one JSON file per style, with the canvas, the
  components (hair, eyes, mouth, …), their variants as SVG elements, and the colour lists. Used for `k.faces`: the
  slots, variants and parts of seven styles.
- **Origin:** https://github.com/dicebear/styles , commit `67f54a0d45034c078cdb03e7374037eeacd6ab62`, folder `src`.
  (Round 6 named `dicebear/dicebear`; the styles are no longer in that repository, its README points here.)
- **Version:** the commit (`core.source="dicebear-<style> 67f54a0"`, one source id per style).
- **License:** each style has its own, in the `meta` block of its definition and in `LICENSE.md` of the repository.
  Imported: `cutouts` and `pixel-art` (CC0 1.0), `miniavs`, `personas`, `micah`, `toon-head`, `big-smile` (CC BY
  4.0). The importer stops if a definition names another licence than the one listed in `tools/import/dicebear.mjs`.
  Not imported because of the licence: `avataaars`, `avataaars-neutral`, `bottts`, `bottts-neutral` ("free for
  personal and commercial use": not one of the licences of PLAN.md), `icons` (MIT, but not faces).
- **Attribution:** cutouts: "Cutouts" by DiceBear, CC0 1.0. pixel-art: "Pixel Art" by DiceBear, CC0 1.0. miniavs:
  remix of "Miniavs - Free Avatar Creator" by Webpixels, CC BY 4.0. personas: remix of "Personas by Draftbit" by
  Draftbit - draftbit.com, CC BY 4.0. micah: remix of "Avatar Illustration System" by Micah Lanier, CC BY 4.0.
  toon-head: remix of "ToonHead" by Johan Melin, CC BY 4.0. big-smile: remix of "Custom Avatar" by Ashley Seo, CC BY
  4.0. The drawings were changed: converted to simplified polygons, lines and primitive shapes with flat colours.
  Links and the licence text: `docs/worlds/k.faces/LICENSE.dicebear`.
- **How to fetch:** `git clone https://github.com/dicebear/styles.git sources/dicebear/raw/styles` (check out the
  commit above for byte-identical shards); then `node tools/import/dicebear.mjs`.
- **What is kept:** see the top of `tools/import/dicebear.mjs`. Every component is a slot of its style, every
  variant a `k.faces.variant` named `"<style> <variant>"`; colours taken from a colour list become `tint` for skin,
  hair and clothes. Left out: variants that convert to nothing (`empty`) and variants whose shape would cover the
  face because the converter drops holes and masks (`covering`: the eight beards of pixel-art).
  `sources/dicebear/features.tsv`: the features of 232 variants, given by a language model that looked at them.
- **Not imported yet:** the other CC0 and CC BY styles with faces (adventurer, big-ears, croodles, lorelei,
  notionists, open-peeps, toon-head's neutral forms, moods, thumbs, …): line drawings and very large definitions
  that were not tried.
