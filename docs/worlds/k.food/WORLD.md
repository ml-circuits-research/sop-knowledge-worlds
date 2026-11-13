# k.food

Common foods and drinks, as a child's encyclopedia describes them. Hand-written (`hand-core 1`, CC0-1.0).

## What it knows

- `k.food.food` (identity `name`): `kind` (the kitchen grouping: fruit, vegetable, grain, legume, nut, bread, dairy,
  egg, meat, fish, seafood, sweet, drink, seasoning, herb, oil, sauce, dish), `botanically` (only where the plant part
  is something else: a tomato, a cucumber and a pumpkin are fruits, a peanut is a legume, a mushroom is a fungus),
  `colour` (many, the colour names of `k.objects`), `grows_on` (tree, bush, vine, plant, underground), `comes_from`
  (many: the animal, plant, food or place it is made or taken from: cheese from `milk`, honey from `bee`, chocolate
  from `"cocoa beans"`), `eaten` (many: raw, cooked), `drawing` (the name of the `k.objects` object that draws it).
- A key is left out where it is not plain (the colour of a soup, how an olive is eaten).
- `core.word` facts: plural forms and other names (`eggplant`, `zucchini`, `cookie`, `fries`, `maize`).

## Shards

`fruit` (32 foods), `vegetables` (29), `grains-nuts-and-pulses` (25), `animal-foods` (25), `other` (43: sweets,
drinks, seasonings, herbs, oils, sauces, dishes): 154 foods, 254 wires, 33,319 bytes.

## Joins

By name, with no import: `drawing` is the `name` of a `k.objects.object` (125 of 154 foods have one; `grape` is drawn by `grapes`); `comes_from`
values that are animals are names of `k.animals.animal` (`cow`, `hen`, `pig`, `sheep`, `bee`).

## Questions it helps with

See `tests/k.food.questions.jsonl`: what kind of food a carrot is, what colour a banana is, where an apple or a potato
grows, what cheese and honey come from, whether a potato is eaten raw, which fruits grow on a vine.
