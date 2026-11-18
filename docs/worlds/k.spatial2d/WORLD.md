# k.spatial2d

This module measures proposed two-dimensional placements against observed geometry and declared relations. Load
`schema.sop` as a module, then tell `shards/policies.sop` for the default policy. Observers provide current
instance facts. English terms are available in the separate `shards/words.sop` vocabulary.

| Fact | Contract |
| --- | --- |
| `box` and `point` | Name the observed entity or feature, frame, instance, revision and direct container scope. Coordinates are scalar values in the named frame. Use `evidence=bounds` for an enclosing box and `evidence=rectangle` when it represents the actual rectangular region. Missing geometry stays missing. |
| `relation` | Supply directed subject and object entity names with the subject's frame, instance, revision and scope. Assert each independent pair once. An observer can use `core.source` and wire IDs to track the native evidence. |
| `policy` and `direction` | Select the metric, clearance and weight for a relation. A direction proposes each axis as anchor minimum + anchor extent × anchor coefficient − subject extent × subject coefficient + clearance × gap coefficient. Rank breaks ties between direction proposals. |
| `effective_policy` and `measurement` | Rules resolve each relation's active policy before geometry is available. When observations match, each measurement identifies its pair and context, gives a nonnegative value and carries the policy weight. Zero satisfies a hard requirement. A missing measurement leaves the requirement unresolved. |
| `profile` and `preference` | Activate a named profile in a particular observation scope and revision. A scoped explicit preference can replace only a soft metric marked as profile-sensitive. Undo by retracting its fact. |
| `correction` and `learned_preference` | Two distinct, observed correction events with the same profile, scope, frame, relation, metric and comparison class contribute only when both changed their gap and reached the same clearance. The learned result retains both event IDs. An active profile must declare the comparison class. An explicit preference takes precedence, conflicting learned goals use the default, and retracting supporting corrections withdraws their contribution. |

`independent_peer` and `near` compare boxes in one scope. Signed separation is the greatest of the four
directional edge gaps. Separation below zero reflects the distance needed to separate overlapping boxes along
one axis. Peer clearance deficit is the shortfall from the desired gap, bounded below at zero. Overlap area is
the product of positive intersection widths and heights. Near cost is the absolute difference from the desired
gap. The initial gaps, weights and directions are authored starting values.

`member_of` supports occupation of the same region. It enforces box containment when the relation states
`evidence=containment` and the container is an observed rectangle. `endpoint_of` and `anchored_to` with
`evidence=coincident` enforce exact equality of the supplied points. Each can cross a direct container scope
within the same frame, instance and revision. Bounding boxes provide no contour or contact evidence.
