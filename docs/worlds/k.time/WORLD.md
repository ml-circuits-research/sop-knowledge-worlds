# k.time

The calendar: months, weekdays, seasons and spans of time.

## What it knows

- **Order in time** (version 2). Every time that repeats is a `k.time.ordered` (month, weekday, season, part of the
  day, hour): `cycle` names its cycle, `n` its position, `next` the one that follows. `next` is cyclic: after
  December comes January, after Sunday Monday, after winter spring, after the night the morning, after 11 pm midnight.
- `k.time.cycle` (complete): `week` (Monday to Sunday, ISO 8601; in some countries the week starts on Sunday, which
  this world does not say), `year` (January to December), `seasons` (spring to winter), `day` (morning to night),
  `clock` (midnight to 11 pm), each with `first`, `last`, `length` and how long one round `lasts`.
- `k.time.before` (complete, **derived**): `earlier` is before `later` inside one round of `cycle` as the cycle counts
  it. One rule (`k.time.order`) makes it from the positions: of two times of one cycle the smaller `n` is earlier
  (375 facts: 21 for the week, 66 for the year, 6 for the seasons, 6 for the day, 276 for the clock). "After" is the
  same fact read backwards. "Is Friday before Monday?" is "no" in one week from Monday; whether next Monday is meant
  is for the host, which has `next` for it.
- `k.time.month` (complete: there are exactly 12): `name`, `n` (1 to 12), `next`, `days`, `leap_days` (February: 29),
  `season_north`, `season_south` (the meteorological seasons: March to May is spring in the north, autumn in the south).
- `k.time.weekday` (complete): `name`, `n` (Monday is 1, ISO 8601), `next`, `weekend`.
- `k.time.season` (complete): `name`, `n` (spring is 1), `next` (the season that follows; version 1 had `after`, the
  season before, which is `next` read backwards and was dropped: one home for the relation).
- `k.time.season_in` (**derived**): a season in a `hemisphere` (north, south) with its `first` and `last` month. Four
  rules make it from the months' `season_north` / `season_south` and `next` (a month whose season differs from the
  month before it starts its season), so it cannot disagree with the months: winter in the north is December to
  February, spring in the south September to November.
- `k.time.part_of_day` (complete): morning, afternoon, evening, night, with `n`, `next`, and `starts_about` /
  `ends_about` in hours after midnight (5, 12, 17, 21: everyday usage, which varies, hence `_about`).
- `k.time.hour` (complete): the 24 hours of the clock, named as said (`midnight`, `"1 am"` ... `noon`, `"1 pm"` ...
  `"11 pm"`), with `n` (0 to 23), `next`, `hour12` and `am_pm` (the 12-hour clock) and the `part` of the day.
- `k.time.duration`: `name`, and `count` (or `count_about`) times `unit`. **A span may be told in several units**, one
  fact each; `name` and `unit` together are its identity (Q33): a week is 7 days and 168 hours; a day 24 hours, 1,440
  minutes, 86,400 seconds; a year 12 months, about 52 weeks, about 365 days; a common year 365 days, 12 months,
  about 52 weeks; a leap year 366 days, 12 months; a month about 30 days, about 4 weeks; decade, century,
  millennium. A host asking "how many days" names the unit: `where name=week unit=day`.
- `core.word` facts: short forms (`Jan`, `Mon`), plurals, `fall` for autumn, `"12 pm"` and `midday` for noon,
  `"12 am"` for midnight; words for the order (`before`, `after`, `earlier`, `later`, `next`, `comes after`).
- No holidays: `k.time` has none yet (PLAN.md lists their names for a later import), so none has a place in time.

Shards: `calendar` (months, weekdays, seasons, cycles, durations, words), `clock` (parts of the day, hours, words).
The derived facts (`k.time.before`, `k.time.season_in`) are made by the rules of the schema when the shards are
loaded. Hand-written (`hand-core 1`, CC0-1.0).

## Questions it helps with

See `tests/k.time.questions.jsonl`: how many days April has, which month is the 9th, which months are summer in the
south, how many days a week has, what comes after spring; is Monday before Friday, is December after November, what
comes after December (January), what comes after winter (spring), which months come before April, which month
starts spring in the south, what part of the day 3 pm is, how many hours a week is, about how many weeks a year is.

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: a weekend has two days.
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
