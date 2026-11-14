# k.drawing: the drawing primitives shared by k.objects and k.faces

A module with two types and no facts of its own (Q34 item 1). `k.drawing.part` is a primitive shape with a box in
the frame of its drawing (0 to 100 on both axes), a draw order `z`, colours by name (the basic colours of
`k.values`) and `rgb`, and `pointing` / `opens`; `k.drawing.point` is a corner of a line or polygon (`n`, `x`, `y`).
`k.objects.part` and `k.faces.part` extend `k.drawing.part` and add what only they say (the object or the slot the
part belongs to, its name and kind, relations to other parts, the tint of a face); `k.objects.point` and
`k.faces.point` extend `k.drawing.point` and say which part they belong to. Before, the ten slots of a part and the
three of a point were written twice; now a renderer reads the keys of `k.drawing` and draws both worlds.

The facts did not change: they keep their types (`k.objects.part`, `k.faces.part`); a host that asks for all parts
of any drawing asks for `k.drawing.part` (a pattern on a type matches the types that extend it).
Checked by `tests/shared-modules.test.mjs`.
