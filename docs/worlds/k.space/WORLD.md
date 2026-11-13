# k.space

The solar system and a little beyond, as a child's encyclopedia describes it. Hand-written (`hand-core 1`, CC0-1.0); the facts
were written by a language model, only where sure (`named=model`).

## What it knows

- `k.space.body` (identity `name`): `kind` (star, planet, `"dwarf planet"`, moon, comet, galaxy), `orbits` (what it
  goes around), `order` (a planet's place from the Sun, 1 to 8), `size` (small, medium, large, huge) and `size_rank`
  (1 is the largest planet), `group` (rocky; gas for a gas giant; ice for an ice giant), `moons` (an exact count: 0, 1,
  2, and 5 for Pluto), `moons_about` (for the giant planets, where new small moons are still being found: Jupiter
  about 95, Saturn about 270, Uranus about 28, Neptune about 16, as known in 2025), `rings`, `orbit_years` (about how
  many Earth years one trip around the Sun takes), `colour` (many), `colour_why` (one plain sentence: Mars is red
  because "Its soil is full of iron that has rusted."), `in` (its galaxy), `drawing` (the name of the `k.objects`
  object that draws it).
- Approximate numbers (Round 9), three digits at most: `day_hours_about` (one turn around its axis, in Earth
  hours: Earth 24, Jupiter 9.9, Venus 5,830), `orbit_days_about` (one trip around what it orbits, in Earth days,
  where that is under two years: Mercury 88, the Moon 27), `diameter_about` (kilometres), `distance_about` (from
  what it orbits, in kilometres: Earth 150,000,000, the Moon 384,000), `temperature_about` (the surface of the Sun,
  5,500 degrees Celsius), `age_years_about` (the Sun), `light_years_about` (the distance of a star or galaxy from
  the Sun). The unit of each is a `k.units.measure` fact.
- `k.space.kind` (identity `name`): star, planet, dwarf planet, moon, comet, asteroid, galaxy, solar system,
  constellation, meteor, black hole: `about` (one plain sentence saying what it is), `made_of`, `orbits`, `has`,
  `does`, `drawing`.
- `core.word` facts: other names (`"Red Planet"`, `"North Star"`) and plural forms of the kinds.
- The numbers are rounded so far that books agree on them; a test checks them against each other (farther planets
  have longer years, by Kepler's third law within 8%; the size rank is the order of the widths). Not here: masses,
  gravity, the temperatures of the planets, the distances of stars that books give differently (Polaris, Betelgeuse).

## Shards

`solar-system` (the Sun, 8 planets, Pluto, 9 named moons, Halley's Comet), `stars-and-galaxies` (Polaris, Sirius,
Proxima Centauri, Alpha Centauri, Vega, Betelgeuse, the Milky Way, the Andromeda Galaxy), `kinds` (11 kinds): 39 things
and kinds, 57 wires, 11,544 bytes.

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (`Saturn`, `Earth`, `sun`, `moon`, `comet`);
`sun`, `moon` and `star` are also things of `k.commonsense`.

## Questions it helps with

See `tests/k.space.questions.jsonl`: which planet is third from the Sun, which is the largest, how many moons Mars
has, whether Saturn has rings, which planets are rocky, what the Moon orbits, what a comet is made of.
