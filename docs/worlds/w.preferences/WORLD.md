# w.preferences: standing preferences

A **reusable world** (not knowledge): a schema that an application loads to keep what a person prefers and apply it
from then on, written in SOP Lang alone in the library's `std.schema` format and driven by the acts of `std.acts`. It
has no rule and no function of its own. Source `hand-core 1` (own), CC0-1.0.

Standing preferences: "I'd prefer a man as my avatar", "make my avatar an old man with glasses", "always use dashed
lines", "I prefer pastel colours", "keep the IDs on", "always put new things on the right".

- `w.preferences.preference`: `key` (required: what it is about, as the application names it), `field` (the part of a
  described value it sets: age, sex, trait; `value` for a key with one value), `value` (required), `about` (the words
  as the person said them), `scope` (app, tab or kind; `of` names the tab or the kind of object), `source` (default,
  stated, learned), `at` (when it was stated, as the order of statements: 0 for a default).
- Acts: make, remove, change, pick, ask. At most 1,000 preferences.
- Declared by the application (data it loads with its rules): `w.preferences.default` (the value of a key or field
  until the person states another, with its scope) and `w.preferences.field` (whether a field holds several values,
  `many`, and which fields of the same key a statement of it `clears`).

**Merging statements.** A later statement refines: it replaces the value of the fields it states (adds one value to a
field with `many=true`) and leaves the other fields as they were; a field it `clears` loses its stated value. A reset
removes the stated and learned values of the key, so the declared default is in force again. The default stays in
the instance (`source=default`, `at=0`), so the instance shows both what was declared and what was said.

Where the words come from: the settings and preferences of desktop and mobile applications (a value per key, a
default, a scope for the whole application, one window or one kind of document).
