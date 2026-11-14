# w.document: a written document

A **world schema** (not knowledge): a schema that an application loads to let its users (and the library's
composition) make and change documents, written in SOP Lang alone in the library's `std.schema` format and driven by
the acts of `std.acts`. Two denies keep a paragraph and a sentence in one place; it has no function of its own.
Source `hand-core 1`, CC0-1.0. Version 1 (block "15:15" item 1, for the library's std.compose and std.summarize).

A document is a tree of parts in order, down to sentences, and every sentence says **which facts of the catalog it
states**: a composition writes one as a live world that any host renders (an editor, slides), and a summary reads one
back with its sources.

- `w.document.document`: `title` (required), `genre` (a `k.genres` genre: scientific article, essay, story, report,
  presentation), `topic` (a name of the catalog), `register` (a `k.genres` register), `language` (a language world:
  `w.lang.en`), `seed` (the number the composition was drawn with: same seed, same document), `about`.
- `w.document.chapter` (`document`, `n` required, `title`, `part`) and `w.document.section` (`chapter`, `n`, `title`,
  `part`): `part` names the part of the genre it realises (`k.genres.part`: introduction, methods; orientation).
- `w.document.paragraph`: in a `section` or, in a document without sections, straight in a `chapter`; `n`.
- `w.document.slide`: `document`, `n`, `title` (the headline), `layout` (title, agenda, content, summary, closing;
  default content), `part`, `note` (what the speaker says beyond the slide).
- `w.document.sentence`: `text` (required), in a `paragraph` or on a `slide`, `n`; `move` (the rhetorical move:
  `k.genres.move`, realised by a discourse template of `w.lang.en`), `template` (the id of that template), `fact`
  (many: **the ids of the wires it states**, `k.animals.animal.penguin`), `interest` (its `k.interest` score, 0 to 1).
- Places are numbers from 1 (`n`); a part refers to its parent, so the order of a document is (chapter n, section n,
  paragraph n, sentence n) or (slide n, sentence n).
- Denies: a paragraph is not in a section and a chapter at once; a sentence is not in a paragraph and on a slide at
  once. A sentence with no place is allowed while a composition builds the tree.
- Acts: make, remove, change, pick, ask, copy on every kind; save and load on a document; connect on slides (a slide
  to the section it presents). At most 50 documents, 2,000 parts of each kind, 20,000 sentences.
- Found by: document, essay, article, presentation, slides, slide show, composition, story.

## Shapes by genre (k.genres)

| Genre | Tree |
| --- | --- |
| scientific article | chapters = IMRaD parts (`part=introduction` ...), sections where long, paragraphs, sentences with moves of the introduction (territory, niche, occupying the niche) |
| essay | chapters = introduction (thesis), one per argument, counterargument, conclusion; paragraphs in chapters |
| story | chapters = the parts of the story (orientation, complication, attempts, resolution, coda); paragraphs in chapters |
| report | chapters = what was done, when, results, next steps |
| presentation | slides only: title, agenda, one content slide per idea, summary, closing; sentences are bullets |

## How to use it

```js
const w = new World({ library: { 'w.document': schemaText } });   // sopworld with std.schema (tools/sopworld/VERSION)
w.load('@acts core.use world=std.acts');
w.use('w.document');
w.act({ action: 'make', args: { kind: 'w.document.document', title: 'Penguins', genre: 'essay', topic: 'penguin' } });
w.act({ action: 'make', args: { kind: 'w.document.sentence', text: 'A penguin is a bird, but it cannot fly.', paragraph: '$w_document_paragraph1', n: 1, move: 'surprising fact', fact: 'k.animals.animal.penguin' } });
```

A session (a composed essay and a presentation, the denies, every fact id checked against the catalog, the tree read
back in order) is in `tests/w.document.test.mjs`: an integration case the library can read in place.

## Not said here

- That `n` is unique among the children of one parent (two sentences 1 in one paragraph): the composer numbers them;
  a deny over two wires of one parent waits for a need.
- That `fact` names an existing wire: the catalog is loaded lazily, so the check is the host's (the test checks it
  over the whole catalog).
- The text itself is the language world's realisation of `move` and `fact`; this world only keeps it.
