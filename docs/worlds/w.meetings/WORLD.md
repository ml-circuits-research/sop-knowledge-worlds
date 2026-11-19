# w.meetings: meetings with people, rooms and calendars

A **world schema** in the library's `std.schema` format, driven by the acts of `std.acts`: a user's meetings at
exact times (milliseconds since 1970-01-01T00:00Z, with a duration in milliseconds), the people who take part,
the rooms they use and the calendars they belong to. Every thing has a `code`, the short identifier tools and
people use ("review", "room-a"); one deny keeps codes unique within a kind. No function of its own. Source
`hand-core 1`, CC0-1.0. Version 1.

`w.calendar` describes events on the days of a month by date and clock time; `w.meetings` describes the same kind
of thing at the precision a scheduling tool needs. Words: `shards/words.sop`.
