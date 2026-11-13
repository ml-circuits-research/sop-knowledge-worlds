# k.space

The solar system and a little beyond, as a child's encyclopedia describes it. Hand-written (`hand-core 1`, CC0-1.0).

## What it knows

- `k.space.body` (identity `name`): `kind` (star, planet, `"dwarf planet"`, moon, comet, galaxy), `orbits` (what it
  goes around), `order` (a planet's place from the Sun, 1 to 8), `size` (small, medium, large, huge) and `size_rank`
  (1 is the largest planet), `group` (rocky; gas for a gas giant; ice for an ice giant), `moons` (an exact count: 0, 1,
  2, and 5 for Pluto), `moons_about` (for the giant planets, where new small moons are still being found: Jupiter
  about 95, Saturn about 270, Uranus about 28, Neptune about 16, as known in 2025), `rings`, `orbit_years` (about how
  many Earth years one trip around the Sun takes), `colour`, `in` (its galaxy), `drawing` (the name of the `k.objects`
  object that draws it).
- `k.space.kind` (identity `name`): star, planet, dwarf planet, moon, comet, asteroid, galaxy, solar system:
  `made_of`, `orbits`, `has`, `does`, `drawing`.
- `core.word` facts: other names (`"Red Planet"`, `"North Star"`) and plural forms of the kinds.
- Not here: distances, diameters, temperatures and other numbers that books give differently.

## Shards

`solar-system` (the Sun, 8 planets, Pluto, 9 named moons, Halley's Comet), `stars-and-galaxies` (Polaris, Sirius,
Proxima Centauri, the Milky Way, the Andromeda Galaxy), `kinds` (8 kinds): 33 things and kinds, 48 wires, 6,783 bytes.

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (`Saturn`, `Earth`, `sun`, `moon`, `comet`);
`sun`, `moon` and `star` are also things of `k.commonsense`.

## Questions it helps with

See `tests/k.space.questions.jsonl`: which planet is third from the Sun, which is the largest, how many moons Mars
has, whether Saturn has rings, which planets are rocky, what the Moon orbits, what a comet is made of.
