# k.units

Units of measure and how to convert them.

## What it knows

- `k.units.quantity`: `name` (length, mass, time, volume, area, temperature, speed, angle) and its `base` unit.
- `k.units.unit` (identity `name`): `symbol`, `quantity`, `factor`, `offset` (temperatures), `system` (metric,
  imperial, other). **A value in the unit, times `factor`, plus `offset`, is the value in the base unit**: 3 kilometres
  are 3 × 1000 metres; 20 degrees Celsius are 20 × 1 + 273.15 kelvin. To convert between two units of one quantity go
  through the base: (value × factor₁ + offset₁ − offset₂) ÷ factor₂. The arithmetic is the application's (or a
  `core.calc` in its own matrix); this world holds the facts only.
- `core.word` facts: plurals, American spellings and symbols (`kilometers`, `km` → `kilometre`).
- Imperial volume units are the British ones (pint 0.568 l, gallon 4.546 l).

`core`: 8 quantities, 46 units (Round 9: `year`, `"light year"`), 46 word wires. Hand-written (`hand-core 1`, CC0-1.0).

`measures` (Round 9): `k.units.measure` (identity `world`, `type`, `key`): in which unit a number of another world
is given (`unit`, a unit of this world), what it counts (`counts=person`, `counts=leg`), or that it is a place in an
order (`ordinal=true`), a position or length in a 0 to 100 frame (`frame=object`, `frame=face`), or a plain number
(`plain=true`); `approximate=true` for the keys with the suffix `_about`. Written by `tools/measures-core.mjs`,
which reads the schema of every world of the catalog (Q31: 135 numeric slots of 21 worlds) and refuses a number
without an entry, in any world.

## Questions it helps with

See `tests/k.units.questions.jsonl`: how many metres a kilometre is, what a pound measures, the symbol of the litre,
which units measure length, the base unit of mass, the offset of degrees Celsius.
