# k.time

The calendar: months, weekdays, seasons and spans of time.

## What it knows

- `k.time.month` (complete: there are exactly 12): `name`, `n` (1 to 12), `days`, `leap_days` (February: 29),
  `season_north`, `season_south` (the meteorological seasons: March to May is spring in the north, autumn in the south).
- `k.time.weekday` (complete): `name`, `n` (Monday is 1, ISO 8601), `weekend`.
- `k.time.season` (complete): `name`, `n` (spring is 1), `after` (the season before it).
- `k.time.duration`: `name`, and `count` times `unit` (a week is 7 day; a year is 12 month; a common year is 365 day,
  a leap year 366 day; decade, century, millennium).
- `core.word` facts: short forms (`Jan`, `Mon`), plurals, `fall` for autumn.
- No holidays yet (PLAN.md lists their names for a later import).

One shard, `calendar`: 12 months, 7 weekdays, 4 seasons, 13 durations, 32 word wires. Hand-written (`hand-core 1`,
CC0-1.0).

## Questions it helps with

See `tests/k.time.questions.jsonl`: how many days April has, which month is the 9th, which months are summer in the
south, the day after which a weekend starts, how many days a week has, what comes after spring.

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: a weekend has two days.
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
