# k.named: the slot `named` shared by the worlds whose facts a language model labelled

A module with one type and one slot and no facts (block 06:55 item 2). `k.named.labelled` has the slot `named`
(`enum=model`): a fact with `named=model` was labelled by a language model, from the name of the thing, and the
world that holds it says in its WORLD.md how a sample was audited. Types take the slot by `extends=k.named.labelled`
(a second `extends`, a slot group of sopworld 0.34+, where the type has a parent already: `k.objects.part` extends
`k.drawing.part` and `k.named.labelled`), and their module imports `k.named`. `k.parts.usual` keeps a slot of its own:
there `named` is required (every usual part was labelled), which a shared slot cannot say.

Hand-written (`hand-core 1`, CC0-1.0). No shards.
