# w.drawing: a drawing of placed objects

A **world schema** in the library's `std.schema` format, driven by the acts of `std.acts`: the objects a user places
on a page (each a kind of `k.objects` or a basic shape, with its centre, size, optional width and height, colour,
label and layer), the groups that keep objects together, and the edits of single parts (recoloured, moved, resized,
removed). Every object and group has a unique `code`; one deny keeps codes unique, another one edit per part. No
function of its own: how a kind is drawn is read from `k.objects`. Source `hand-core 1`, CC0-1.0. Version 1.
