# psys2-worlds: the knowledge of the PSys2 tab worlds

- **What:** the general knowledge that the demo application PSys2 carried in its own tab worlds: animals, shapes
  and colours, time, common sense, colour and shade words, yes and no words, the names of the parts of the
  things it draws, groups of countries. Taken here so that the demo holds no general knowledge of its own.
- **Origin:** the PSys2 repository of this project (github.com/ml-circuits-research, private), files
  `worlds/kids.animals/kb.sop`, `worlds/kids.shapes/kb.sop`, `worlds/kids.time/kb.sop`,
  `worlds/common.sense/kb.sop`, `worlds/space/space.mjs`, `worlds/art.draw/scene.mjs`,
  `worlds/lang.common/lexicon.sop`, `worlds/geo.map/kb.sop`.
- **Version:** commit `6b63b2ba` (`core.source="psys2-worlds 6b63b2ba"`).
- **License:** CC0-1.0 for the hand-written knowledge (the project's own data; the reviewer's ruling in
  `worker-tasks.md`, block "2026-11-13 22:30"). The file `geo.map/kb.sop` is not hand-written: it was generated
  from mledoze/countries (ODbL-1.0) and GeoNames (CC-BY-4.0); the facts taken from it keep those sources
  (`countries 5.1.0`, `geonames all-the-cities-3.1.0`) and licences, with `psys2-worlds` as a second source.
- **Attribution:** none needed for the hand-written part.
- **How to fetch:** a checkout of PSys2; then `node tools/import/psys2.mjs --from <checkout>`.
- **What is kept:** `docs/worlds/FROM-PSYS2.md` (generated) lists, file by file, what was taken into which world,
  what was left and why, and where the two disagree.
