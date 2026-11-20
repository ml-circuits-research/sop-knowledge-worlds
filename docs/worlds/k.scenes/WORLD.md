# k.scenes

Where things usually are and how big they are, and 61 typical scenes: what is usually there, how many, where in the
picture, what happens there, and the time and weather that fit. Hand-written (`hand-core 1`,
CC0-1.0); the place and size labels were given by a language model (`named=model`).

## What it knows

- `k.scenes.thing` (identity `name`: the name of a `k.objects` object, word or stand-in, or of a thing of a scene
  that nothing draws): `place`, where one usually
  sees the thing: `sky` (also: in the air), `ground` (outdoors), `water` (on or in it), `indoors`, or `on_thing`
  (on another thing); `on` (many), what it is usually on (`hat` on `head`, `roof` on `house`, `cup` indoors on
  `table`); `size`, the size of the real thing among five classes:

  | Class | Means | Examples |
  | --- | --- | --- |
  | `tiny` | fits in a closed hand | coin, bee, berry, button |
  | `small` | held in one or two hands | cup, book, cat, shoe |
  | `medium` | carried in both arms, up to the size of a person | chair, dog, bicycle, person |
  | `large` | bigger than a person, up to a truck | car, horse, bed, tent |
  | `huge` | bigger than a truck | house, tree, ship, mountain, sun |

- A key is left out where a thing has no usual place (a rope, a sword, a feather) or no plain size (grass). Objects
  that are symbols, whole scenes, faces or parts (heart, sunset, "dog face", liver) have no fact. A fact with
  `place=on_thing` and no `on` is refused.
- The labels come from `sources/hand-core/place-size.tsv`: written by a language model from the names of the
  objects, only where sure. A seeded sample of 200 was looked at next to the drawings
  (`sources/hand-core/place-size-audit.tsv`).

- `k.scenes.scene` (identity `name`): `kind` (outdoors, indoors, underwater, space), `ground` (what covers the
  ground: sand, grass, snow, floor …), `time` (many: morning, day, evening, night), `weather` (many: sunny, cloudy,
  rainy, snowy, windy, stormy, foggy), `season` (many), `happens` (many: what people or animals do there: `swim`,
  `"build sandcastles"`), `drawing` (a `k.objects` object that draws the whole scene, where one exists). Time,
  weather and season are left out when any fits. Other names of a scene are `core.word` facts (seaside, woods,
  "train station").
- `k.scenes.has` (identity `scene` + `thing`): `count` (how many there usually are), `where` (the layer of the
  picture: sky, ceiling, background, wall, ground, water, foreground), `side` (left, centre, right, where the thing
  has a usual side), `on` (another thing of the same scene that it is on or in: the duck on the pond, the cup on
  the table; a thing on water always says on which water, unless the whole scene is water), `fills=true` (the
  thing fills its layer from side to side: the sea behind a beach), `drawing` (the `k.objects` object that draws
  the thing). The thing is named as one says it in that scene (`farmhouse`, drawn by `house`; `farmer`, drawn by
  `person`): every thing of a scene is a `k.scenes.thing` (the join of `thing`), and one not drawn under its own
  name is drawn by an object of which it is a word (a beach ball by `ball beach`) or by the nearest drawable kind,
  a `k.objects.stand_in` (a stall by `shop`, a control tower by `tower`, the people by `person`). Four have no
  drawable kind and no `drawing` (stage, till, diving board, mobile), and three things whose namesake object shows
  another thing (`pipe`, `ring`, `seat`) have none either.
- `k.scenes.support` (identity `name`), `k.scenes.surface` (identity `of`, `part`), shard `support.sop`
  (`tools/support-core.mjs`; owner, 2026-11-20): what holds a thing up in a picture and what it keeps out of. The
  rows of the places hold for every thing of that place: ground things stand `on` the ground and `avoid` water and
  roads, water things are on the water, sky things in the air. The rows of things are derived from k.kinds, not
  listed: 35 ground things that are motor vehicles, public transport or wheeled vehicles (not on rails) are on the
  road; a bridge stands over water and roads. The surfaces are the water, road, ground and sky parts of the terrain
  features of k.layouts and the water anchors of drawn objects (15). The lights (`k.scenes.light`, identity `name`)
  are the things in the sky that shine (k.attributes can=shine: sun, moon, star): a picture lights its scene from
  the largest one, shadows falling away from it. A host compiles them into placement and drawing: a house never in
  a river, a car on the road, shadows away from the sun (PSys2: worlds/art.draw/landscape-rules.sop, perspective-rules.sop).

## The scenes, and how many of their things have a drawing

| Scene | Things | With a drawing | Without |
| --- | --- | --- | --- |
| beach | 17 | 17 |  |
| farm | 23 | 23 |  |
| forest | 19 | 19 |  |
| mountains | 15 | 15 |  |
| meadow | 16 | 16 |  |
| river | 19 | 19 |  |
| lake | 16 | 16 |  |
| pond | 14 | 14 |  |
| desert | 12 | 12 |  |
| jungle | 16 | 16 |  |
| savanna | 16 | 16 |  |
| arctic | 15 | 15 |  |
| island | 16 | 16 |  |
| garden | 23 | 23 |  |
| park | 20 | 20 |  |
| orchard | 12 | 12 |  |
| campsite | 16 | 16 |  |
| field | 13 | 13 |  |
| picnic | 17 | 17 |  |
| city street | 21 | 21 |  |
| village | 18 | 18 |  |
| playground | 19 | 19 |  |
| market | 17 | 17 |  |
| harbour | 20 | 20 |  |
| airport | 15 | 15 |  |
| railway station | 15 | 15 |  |
| construction site | 18 | 17 | pipe |
| petrol station | 12 | 12 |  |
| zoo | 23 | 23 |  |
| fairground | 16 | 16 |  |
| football pitch | 13 | 13 |  |
| swimming pool | 15 | 14 | diving board |
| circus | 18 | 17 | ring |
| castle | 22 | 22 |  |
| kitchen | 26 | 26 |  |
| bedroom | 18 | 18 |  |
| living room | 20 | 20 |  |
| bathroom | 20 | 20 |  |
| classroom | 21 | 21 |  |
| office | 21 | 21 |  |
| supermarket | 20 | 19 | till |
| restaurant | 19 | 19 |  |
| library | 17 | 17 |  |
| hospital | 21 | 21 |  |
| workshop | 22 | 22 |  |
| theatre | 14 | 12 | stage, seat |
| museum | 16 | 16 |  |
| cafe | 18 | 18 |  |
| nursery | 20 | 19 | mobile |
| laboratory | 19 | 19 |  |
| birthday party | 17 | 17 |  |
| space | 17 | 17 |  |
| underwater | 24 | 24 |  |
| night | 14 | 14 |  |
| winter | 19 | 19 |  |
| autumn | 19 | 19 |  |
| spring | 18 | 18 |  |
| rainy day | 16 | 16 |  |
| Christmas | 17 | 17 |  |
| Halloween | 19 | 19 |  |
| pirate ship | 19 | 19 |  |

61 scenes, 1088 things, 1081 with a drawing (99.4%). The pictures composed from these facts are in `preview/` (`preview/index.html`):
`tools/render-scenes.mjs` gives every place a band (sky or ceiling, far ground or wall, a strip for what fills its
layer, water, near ground or floor, foreground), packs each band in rows, sizes by the size class, and draws at most
three of a thing; nothing overlaps but a thing and what it is on. Every picture is one file (the object drawings are
copied in, without their tile), so that a page can show it. It is a plain composer to check the facts, not the application's.

## Shards

`things-a` … `things-z` and `things-0` (names that start with a digit): one fact per thing, by the first letter of
its name. The vocabulary index maps the name of a thing to its shard.

`scenes-nature` (19 scenes), `scenes-town` (15), `scenes-indoors` (17), `scenes-other` (10: space, underwater, night,
the seasons, the weather, feasts): the scene, what it has, and its other names. Hand-written: these shards are the home of the scenes (edit them
there; reviewer 15:00 item 3; until 2026-11-15 they were written from a JS table with a notation of its own).

## Joins

Declared (`type=` / `by=`): `k.scenes.has.thing` names a `k.scenes.thing` (595 of 595 values meet), `has.drawing` and
`scene.drawing` a `k.objects.object`, `has.scene` a `k.scenes.scene`. By name, with no import: `name` is the `name`
of a `k.objects.object` (its drawing), a word of one, or a `k.objects.stand_in`;
the same name in `k.commonsense.thing`, `k.animals.animal` and `k.food.food` gives more facts.

## Questions it helps with

See `tests/k.scenes.questions.jsonl`: where the sun, a duck, a goat or a swing usually is; how big a house, a cow
or a bee is; what a hat is usually on; what is usually on a horse; what is in the sky at a beach; how many cows a
farm has; what the duck is on; what happens in a classroom; which scenes have a tractor.

## From the PSys2 tab worlds

Shards named `psys2*`, written by `tools/import/psys2.mjs` (source `psys2-worlds <commit>`; the facts of one thing
merge with the others). `psys2`: a wheel and a car are on the road, a book on a shelf (`on`).
What was taken, what was left and where the two disagree: [FROM-PSYS2.md](../FROM-PSYS2.md).
