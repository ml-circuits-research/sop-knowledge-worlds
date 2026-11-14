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

`core`: 8 quantities, 47 units (Round 9: `year`, `"light year"`; for k.motion: `millisecond`), 47 word wires. Hand-written (`hand-core 1`, CC0-1.0).

`measures` (Round 9): `k.units.measure` (identity `world`, `type`, `key`): in which unit a number of another world
is given (`unit`, a unit of this world), what it counts (`counts=person`, `counts=leg`), or that it is a place in an
order (`ordinal=true`), a position or length in a 0 to 100 frame (`frame=object`, `frame=face`), or a plain number
(`plain=true`); `approximate=true` for the keys with the suffix `_about`. Written by `tools/measures-core.mjs`,
which reads the schema of every world of the catalog (Q31: 135 numeric slots of 21 worlds) and refuses a number
without an entry, in any world.

`currencies` and `currency-words` (block 03:20 item 3; `tools/import/currencies.mjs`): `k.units.currency` (identity
`code`, ISO 4217): the 153 currencies that are legal tender somewhere today in Unicode CLDR 48 (Unicode-3.0, shard
`currencies`, 153 wires): `name`, `name_plural` (US dollar, US dollars; Romanian leu, Romanian lei), the everyday
`unit` and `unit_plural` (dollar, dollars; leu, lei; yen, yen), `symbol` ($, €, £, ¥; CA$ for the Canadian dollar)
and `narrow` symbol ($ for the Canadian dollar, lei for the leu), `decimals` (2; 0 for the yen; 3 for the dinars of
Bahrain, Kuwait ...), `country` (the k.geo countries that use it, by their two-letter code). By hand (CC0, shard
`currency-words`, merging): `minor` and `minor_plural` for 41 currencies (cent, cents; penny, pence; ban, bani;
centavo, kopek, paisa, grosz ...), and words for 22 currencies: slang (buck, greenback, quid, loonie), symbols and
codes as words, and **the usual reading of a unit word said alone** (dollar: USD; pound: GBP, while `pound` of
k.units.unit is the pound of mass, so a host decides by what the number counts; leu and lei: RON; yen, euro, franc:
CHF; peso: MXN; rupee: INR). A currency has no `factor`: exchange rates change daily and are no fact here. CLDR's notice: `LICENSE.cldr`.
Not joined: `k.geo.country.currency` (the PSys2 country list's names, "United States dollar", "Euro") names a
currency by another name than CLDR's; the way from a country to its currency is `country` here.

## Questions it helps with

See `tests/k.units.questions.jsonl`: how many metres a kilometre is, what a pound measures, the symbol of the litre,
which units measure length, the base unit of mass, the offset of degrees Celsius; the symbol of the US dollar, the
currency with the sign €, which currencies are counted in lei, what pence are, what money Japan uses.
