# w.person

A reusable world: **who a person is, as they tell it in a session** (block 10:55, PSys2 Q19: the 30 real turns of its
former Profile tab: "I have two kids", "I like cats, dogs and horses", "I am 40", "my name is Ana", "what do you know
about me"). Declared as data in the library's std.schema format; the acts of std.acts drive it; no rule, no function.
Hand-written, CC0-1.0. Terms after schema.org's `Person` (name, age, hasOccupation, knowsLanguage; children, parent,
sibling, spouse as relations).

| Kind | Keys | Says |
| --- | --- | --- |
| `w.person.person` | `user`, `name`, `age`, `occupation`, `language` (many), `note` | a person; `user=true` the one the session talks with ("I", "me"); `occupation` a job of k.people (a declared join to `k.people.role`) |
| `w.person.relative` | `of`, `relation`, `count`, `name`, `age` | relatives of a person by relation (child, son, mother, grandmother, spouse ... 23 relations), `count` how many ("two kids": one fact, count 2) |
| `w.person.taste` | `of`, `thing`, `type`, `stance`, `strong` | what a person likes or dislikes, one fact per thing, typed: `thing` a catalog name, singular (cat), `type` the catalog type that names it (`k.animals.animal`, from vocab-kinds.json), `stance` likes or dislikes, `strong` for love and hate |

Words lead a host to the world ("profile", "about me") and to each kind and key; the words for relation values
("kids" are children, "mum" a mother, "grandma" a grandmother) are `core.word of=w.person.relative.relation`.

## Reading what a person says

The w.lang.en frames of the shard `person-frames` (tools/lang-en-person-frames.mjs, rebuilt by the build; `needs=person`):

- **statements, mood declarative** (set `acts.state`, the act change in the mode set, as the statements of facts are; a
  host records them and does not obey them): "My name is Ana" / "I am called Ana" / "call me Ana" (name), "I am 40" /
  "I'm 40 years old" (age), "I have two kids" / "I've got three children" / "I have a son" (a relation and a count),
  "I like cats, dogs and horses" / "I love pizza" (likes: the host makes one taste per thing), "I don't like spiders" /
  "I hate snakes" (dislikes), "I am a teacher" / "I work as a nurse" (occupation: a job of k.people), "I speak English
  and Romanian" (language). The thing is always the speaker (`thing=me`).
- **questions, mood interrogative** (the act ask): "What do you know about me?" / "Who am I?" (describe), "How many
  kids do I have?" (count), "How old am I?", "What is my name?", "What do I like?", "What is my job?", "What languages
  do I speak?".

`tests/w.person.test.mjs` reads 28 such turns back and drives a session.

## Limits

- A pet is not a relative: "I have a cat" is read by no person frame (a host may keep it as a taste or a note).
- An age is told, not a birth date: "I am 40" next year is still 40 until the person says otherwise.
- The list after "I like" is one value ("cats dogs and horses"); splitting it into things and finding each one's type
  is the host's (its list reader and vocab-kinds.json).
