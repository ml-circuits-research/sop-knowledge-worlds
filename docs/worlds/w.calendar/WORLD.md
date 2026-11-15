# w.calendar: a calendar

A **world schema** (not knowledge): a schema that an application loads to let its users make and change such
things, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. Three
denies keep the ends of an event in order; it has no function of its own. Source `hand-core 1`, CC0-1.0. Version 2
(questions.md Q92-w4; version 2 adds `zone`).

The days of a month in a grid with the events on them: a family calendar, a school year, the appointments of a week.
A calendar is not a timeline (w.timeline: events on one line, in one unit): its events have dates and clock times,
and they repeat.

- `w.calendar.calendar`: `name` (required), `week_starts` (Monday by ISO 8601, or Sunday; a weekday of `k.time`),
  `zone` (the time zone of its clock times: a zone of `k.time.zone` by its IANA name, Europe/Bucharest).
- `w.calendar.event`, after the iCalendar standard (RFC 5545, VEVENT): `title` (required), `calendar`, `date`
  (required, an ISO 8601 date: 2026-11-20), `start` and `end` (clock times; none for an all-day event), `last_date`
  (an event of several days), `place`, `sort` (birthday, lesson, appointment, holiday), `about`. A recurring event
  (RRULE) has `repeat` (daily, weekly, monthly, yearly: FREQ), `every` (INTERVAL, default 1), `on` (the weekdays of
  a weekly event: BYDAY), and stops after `times` (COUNT) or on `repeat_until` (UNTIL), or never.
- `w.calendar.view` (one): the `month` (a month of `k.time`) and `year` the grid shows, `mode` month, week or day.
- Acts: make, remove, change, pick, ask, copy on calendars and events; group and show on events (show: each event with
  the keys of its aspect `w.calendar.on_day`); make, change, ask on the view. At most 20 calendars, 2,000 events.
- Found by: calendar, diary, planner, agenda, wall calendar.
- **Refused** (denies): an `end` before the `start`, a `last_date` before the `date`, a `repeat_until` before the
  `date`; and by the slot kinds, a date that does not exist (2026-02-30) and a weekday that is not one.
- Not said here (Q92-w4, answered): the days an event recurs on are not listed (expanding the rule is the
  library's, [LIB]); "the first Monday" and "on the 15th" wait for a real row; public holidays later, as data.

## How to use it

```js
const w = new World({ library: { 'w.calendar': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION)
w.load('@acts core.use world=std.acts');
w.use('w.calendar');
w.act({ action: 'make', args: { kind: 'w.calendar.event', title: 'swimming', date: '2026-11-16', start: '17:00', repeat: 'weekly', on: ['Monday', 'Thursday'] } });
```

A session is in `tests/w.schemas.test.mjs`; the Romanian words of its kinds are in `w.lang.ro/shards/words-w.calendar`.
