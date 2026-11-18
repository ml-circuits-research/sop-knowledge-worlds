# k.composition2d

This world derives candidate regions for omitted positions in a two-dimensional composition. A thing’s usual place in `k.scenes` can match a named layer or the kind of an anchor in `k.layouts`. A layer or anchor can also say directly which things it holds. Each derivation refers to its source declarations.

A `slot` gives a subject, a layout, a named place and a box in the layout’s 0–100 frame. An `anchor` gives a subject, the kind of supporting object (`of`), the kind of region and a box in the supporting object’s 0–100 frame. For example, the usual medium of a boat matches the water region of a lake. The same rule can match a different subject or container when the supplied facts establish the relationship.

The application supplies the current layout and visible instances, projects candidate boxes into scene coordinates and ranks the available placements. These are soft placement suggestions. A suggestion about a lake supplies no evidence that a lake exists on the current canvas.
