# w.map: a map of the world

A **world schema** (not knowledge): a view schema that an application loads to let its users show places on a map
of the world, highlight them, pin them and move the view, written in SOP Lang alone in the library's `std.schema`
format and driven by the acts of `std.acts`. It has no rule and no function of its own. Source `hand-core 1`,
CC0-1.0. Version 1.

The map is a view over the places of `k.geo` (countries and cities). What a place is (where it lies, its borders,
capital, population, rivers) is knowledge, read from k.geo by its name; the map holds only what a user did with it.

- `w.map.place`, a place shown on the map: `name` (required: the name of a `k.geo.country` or `k.geo.city`), `sort`
  (country or city: the last part of the k.geo type, for a name that is both: Luxembourg, Mexico, Singapore),
  `highlight` (default false), `colour` (of the highlight; any colour name of k.values).
- `w.map.pin`, a pin stuck in the map: `on` (required: the name of the k.geo place it marks), `sort`, `label` ("our
  hotel"), `colour`.
- `w.map.view`, the view's own state, one thing: `zoom` (1, the whole world, to 10, a city; default 3; one step at a
  time), `layer` (borders, rivers, none; default none), `centre` (the name of the k.geo place the map is centred on).
- The view `w.map` (`std.schema.view name=w.map shows=w.map.shown state=w.map.view`): the act `show` gives each place
  and pin with the keys of the aspect `w.map.shown` (name, on, sort, highlight, label, colour).
- The acts a map needs:

| A user says | The act |
| --- | --- |
| show France | `make kind=w.map.place name=France sort=country`, with `change thing=w.map.view attr=centre value=France` in the same sentence |
| highlight Peru in red | `make kind=w.map.place name=Peru highlight=true colour=red` (or `change` on a place already shown) |
| pin Paris | `make kind=w.map.pin on=Paris sort=city` |
| remove the pins | `remove thing=w.map.pin set=all` (one undo step) |
| zoom in, zoom out | `change thing=w.map.view attr=zoom by=more` (`by=less`); with sopworld 0.37 or later also `change attr=zoom by=more`, no thing named |
| show the rivers | `change thing=w.map.view attr=layer value=rivers` |
| what is on the map? | `show thing=w.map.place set=each view=w.map`, and the same for pins (`thing=*` from sopworld 0.32) |

- **The view's state with sopworld 0.30 and 0.37.** From 0.37 the view makes its state thing itself on first use
  (`view_w_map`, with the defaults) and `change`/`ask` find it without a thing ("zoom in"). The pinned build is
  0.30, which reads `state=` but does not act on it, so the kind `w.map.view` also allows `make` (once: at most one
  view) and the acts name it (`thing=w.map.view`); both forms work on 0.37 and later, where `make` is not needed
  (questions.md Q43).
- At most 300 places, 100 pins and one view.
- Found by: map, maps, world map, atlas.
- Not said here: that a name is a k.geo place (an open name today; a join `type= by=name` needs sopworld 0.34 and
  names one type, while a place is a country or a city: questions.md Q43); fitting the zoom to a place, drawing the
  layers, distances (the host's renderer and functions).

## How to use it

```js
const w = new World({ library: { 'w.map': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION, 0.30.0 or later)
w.load('@acts core.use world=std.acts');
w.use('w.map');
w.act([{ action: 'make', args: { kind: 'w.map.place', name: 'France', sort: 'country' } },
       { action: 'make', args: { kind: 'w.map.view', centre: 'France' } }]);     // 0.30: the view's state made once
w.act({ action: 'make', args: { kind: 'w.map.pin', on: 'Paris', sort: 'city', label: 'our hotel' } });
w.act({ action: 'change', args: { thing: 'w.map.view', attr: 'zoom', by: 'more' } });
```

A host draws each place and pin at the coordinates k.geo gives for its name (`k.geo.city lat= lon=`; a country at
its own), the layer from k.geo's borders (`neighbour`) or rivers, at the zoom of the view.

The catalog lists it under `schemas` in `index.json` (names, kinds, acts, attributes), and its words are in
`vocab.json` with the path of the schema. A session is in `tests/w.schemas.test.mjs` (show, highlight, pin, remove
the pins and undo, zoom and layer within their values, what the map shows; the names it uses are checked in k.geo).
