# k.commonsense

Everyday common sense, as soft knowledge: where things usually are, what they can do, what they are used for and
made of, a size class, and how many of a thing a scene usually has. The soft rules never refuse; they give advice
after the application acted ("Done! A fish is usually in water, not in the sky.").

## Schema (`schema.sop`, module `k.commonsense`, version 1)

- `k.commonsense.thing` (shared, closed): `name` (identity, an English lemma), `at` (many: typical locations), `can`
  (many: capabilities), `used_for` (many), `made_of` (many), `size` (tiny, small, medium, large, huge),
  `usually_count` (how many a scene usually has; given only for one-of-a-kind things: sun, moon).
- `k.commonsense.placed`: what an application tells when it puts a thing in a scene: `thing` (a name), `at` (where),
  `scene`. An application may extend it with a type of its own.
- Soft rules (`core.deny … soft=true`), each with a `why`:
  - a thing usually in water placed in the sky: "A ?thing is usually in water, not in the ?place.";
  - the same, placed on grass: "A ?thing is usually in water, not on the ?place.";
  - a thing that cannot fly and is not usually in the sky, placed in the sky: "A ?thing cannot fly, so it is not
    usually in the sky.";
  - more of a thing in one scene than it usually has: "A scene usually has only ?usual ?thing, not ?n." (one issue per
    scene and thing).
- Exports: `k.commonsense.thing`, `k.commonsense.placed`.

## Shards

- `shards/core.sop`: 15 things (fish, bird, sun, moon, cloud, tree, house, car, boat, plane, flower, grass, star, dog,
  cat) and one `core.word` per thing with its forms. Source `hand-core 1`, CC0-1.0.

## Questions it helps with

See `tests/k.commonsense.questions.jsonl`: where does a fish live (`water`), what can a bird do (`fly`, `sing`), which
things are usually in the sky, how many suns does a scene usually have (`1`); and soft issues for a fish in the sky, a
boat on the grass, a car in the sky, two suns in one scene; nothing is refused.

## Bulk import (not run yet)

`tools/import/conceptnet.mjs` will add ConceptNet 5.7 facts as shards `conceptnet-<letter>` (keys `at`, `can`,
`used_for`, `made_of`, and `is_a`, `part_of`, `has`, which the schema already declares). The dump is not reachable
from the workers' network; see `sources/conceptnet/SOURCE.md`.

## Notes

- A soft issue is advice: after a fish was put in the sky, "where does a fish live" still answers `water`
  (sopworld 0.15.0).
