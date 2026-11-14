# story-check: k.story's elements annotated by hand in samples of stories (block "19:45")

- What: one row per story with the elements of k.story found in it and whether each constraint holds; no story
  text, only the story's id in its corpus and a short note in this repository's words.
- `tinystories-40.jsonl`: 40 stories of TinyStories (Eldan and Li 2023; CDLA-Sharing-1.0; the 1,000-story subset in
  PSys2's data/external/tinystories), every 25th (`tinystories-train-0`, `-25`, ..., `-975`), read and annotated by
  hand by the third worker on 2026-11-14.
- `tales-pd-40.jsonl`: 40 human-written public-domain tales of PSys2's data/external/tales-pd (Project Gutenberg
  2591 Grimm, 1597 Andersen, 11339 Aesop; 369 stories): every 4th Grimm tale (15), every 4th Andersen tale (5),
  every 14th Aesop fable (20; the two title lists at 83 and 84 are not stories, the next story, 85, stands for them);
  `id` is `tales-pd-<line index in tales.jsonl>`. The fables were read whole; the long tales (1,300 to 17,000
  characters) were read in their opening and annotated from their well-known plot.
- Licence of the annotations: CC0-1.0 (own work). The stories are not copied; their licence stays with them.
- Fields (1 holds, 0 does not, null not applicable): goal (the protagonist wants something that drives the story),
  obstacle (something stands in the way or goes wrong), blocks (the obstacle blocks that goal), attempts (tries that
  fail before the resolution), helper, means_thing (the helper gives a thing), helper_has (the helper has what the
  protagonist lacks: a thing, a skill or authority), lacks (the protagonist cannot do it alone), setup_used (the
  resolution uses something told earlier), resolution (the obstacle is overcome), reached (the goal is reached),
  goal_first (the goal is told before the obstacle; 0 when the trouble comes first and the goal answers it).
- Rule: an element counts only when the story says it; a helper who does not bring what is missing (a father who
  looks too) has helper_has=0; a goal that changes into another (wants to be alone, gets a friend) has reached=0.
