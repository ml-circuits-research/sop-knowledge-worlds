# k.genres

Document types (**genres**) as **structure** (parts in order, with how many times each occurs), **rhetorical moves**
(the steps of each part, in order, with alternatives and how many sentences make each) and **register** (how the
genre is written: person, tense, voice, sentence length, sentences per paragraph, vocabulary band, formality, and
what it allows: contractions, hedging, citations, numbers with units, definitions, direct speech, questions to the
reader). Hand-written (`hand-core 1`, CC0-1.0) by `tools/genres-core.mjs`, from genre analysis and writing guides.
Read by the library's `std.compose`: a composition is the plan (`std.plan`) of the genre's procedure in
`k.procedures`, laid out by these parts and moves, its choice points weighted by `k.interest`, realised in the
register by the language world's templates. A written document is a `w.document` live world: its `genre`,
`register`, chapter or slide `part` and sentence `move` name the facts of this world. No language model is involved.

## The format

| Type | Identity | Says |
| --- | --- | --- |
| `k.genres.source` | `name` (author and year: `swales1990`) | `cite`, `year`, `doi` (where sure), `finding` (what this world takes from it) |
| `k.genres.move` | `name` | `about`; `takes` what a composer fills it with (`fact`, `facts`, `outline`, `question`, `story`, `topic`, `none`); `source`; `own` |
| `k.genres.register` | `name` | `person`, `person_also`; `tense`; `passive`; `sentence_min`, `sentence_typical`, `sentence_max` (words); `paragraph_min`, `paragraph_max` (sentences); `vocabulary_band` (1 to 5, the bands of k.words); `formality`; `contractions`, `hedging`, `citations`, `units`, `definitions`, `direct_speech`, `questions`; `source`; `own` |
| `k.genres.genre` | `name` | `register`; `unit` (the w.document kind of its parts: `chapter`, or `slide`); `also_move` (moves allowed anywhere); `about`; `source`; `own` |
| `k.genres.part` | `genre`, `name` | `n` (place in the genre); `min`, `max` (times it occurs; 0: optional); `heading` (the conventional one); `layout` (a slide's w.document layout); `tense` (when not the register's); `about`; `source`; `own` |
| `k.genres.step` | `genre`, `part`, `n`, `move` | `min`, `max` (sentences; 0: optional); `stage` (the source's larger move: "establishing a niche"); `tense`; `about`; `source` |

**How to read it.** A document of a genre is its parts in the order of `n`, each repeated between `min` and `max`
times; a part is its steps in the order of `n`; at each place one move is made, by `min` to `max` sentences.
**Several steps at one place are alternatives**: one of them is made (the niche of an introduction: indicate a gap,
or raise a question, or counter-claim). The tense of a sentence is the step's, else the part's, else the register's.
`also_move` lists moves a genre allows anywhere besides its steps (a transition, a definition, an example). The
reference reading is `outline(facts, genre, rnd)` in `tools/genres-core.mjs` (twenty lines): with a seeded random
function it draws an outline; without one it gives the shortest.

## The genres (5)

| Genre | Parts in order (times) | Register |
| --- | --- | --- |
| scientific article | abstract, introduction (CARS), methods, results, discussion, conclusion (0-1) | scientific: "we", present (methods and results past), passive allowed, 12-22-32 words, band 5, hedged, cited, units, definitions |
| presentation | title, agenda, point (3-5), summary, closing | presentation: "we" and "you", present, 4-10-16 words, 1-4 sentences a slide, band 3, questions |
| essay | introduction (thesis), argument (2-4), counterargument, conclusion | essay: "I", present, 8-18-28 words, band 4, hedged, cited, questions |
| story | orientation, complication, climax, resolution, ending | narrative: third person (or "I"), past, 4-11-20 words, band 2, direct speech |
| report | summary, introduction, work done, results, problems (0-1), next steps | report: "we", past (results present, next steps future), 8-15-24 words, band 3, units |

43 moves; 26 parts; 72 steps. The moves the language world's discourse templates are asked for (introduce topic,
compare, surprising fact, give example, raise a question, conclude, transition) are among them.

## Where each structure comes from

- **Scientific article.** IMRaD as the standard structure of research articles (Sollaci and Pereira 2004; the APA
  Publication Manual, 2020, for the parts, tenses, voice, units and citations). The **introduction** follows Swales'
  Create a Research Space model (1990; revised 2004): establishing a territory (claim centrality, generalise, review
  previous work), establishing a niche (indicate a gap / raise a question / counter-claim, as alternatives), occupying
  the niche (state purpose; optionally announce findings and outline structure). The **abstract** has Hyland's (2000)
  five moves (introduction, purpose, method, product, conclusion). **Results and discussion** follow Yang and Allison
  (2003): reporting results, commenting on them (interpreting, comparing), summarising, evaluating the study
  (limitations), deductions (recommendations). Tenses and general-to-specific order after Swales and Feak (2012);
  hedging after Hyland (1998).
- **Presentation.** Alley (2013) and Alley and Neeley (2005): a mapping (agenda) slide of the main points, one
  assertion per slide as a sentence headline with evidence, a summary, questions at the end. Signalling and
  segmenting after Mayer (2009). Three to five points after Cowan's (2001) three to five chunks (own choice).
- **Essay.** Hyland's (1990) genre description of the argumentative essay: a thesis stage (gambit, information,
  proposition, marker), an argument stage repeated (claim, support) and a conclusion stage (consolidation,
  affirmation, close). Toulmin's (1958) claim, data and rebuttal give the counterargument and its answer (a part of
  its own here: the owner's brief asks for it; own choice).
- **Story.** Aristotle's beginning, middle and end (Poetics, chapter 7); Freytag's (1863) five parts of a drama
  (exposition, rising action, climax, falling action, outcome), named after Labov and Waletzky's (1967) orientation,
  complication, evaluation, resolution and coda; the episode of Mandler and Johnson (1977) and Stein and Glenn (1979)
  (goal, attempt, outcome) inside the complication. What fills the moves (setting, protagonist, goal, obstacle,
  helper, attempts, turning point, resolution) and the constraints between them are `k.story`'s.
- **Report.** ANSI/NISO Z39.18-2005 (R2010): summary, introduction, methods and procedures, results and discussion,
  conclusions and recommendations, adapted to a report of work done (what, why, what was done and when, results,
  next steps). The "problems" part of a progress report is own choice (no source in this list names it).
- **Registers.** A register is described by its situation and the features that serve it (Biber and Conrad 2009).
  Directions: impersonal, hedged, cited, units and the past for methods in science (APA 2020; Swales and Feak 2012;
  Hyland 1998); the past tense and the order of events in narrative (Labov and Waletzky 1967); "we", "you", short
  sentences and everyday words in plain writing (Cutts 2013: an average of 15-20 words); reading ease falls with
  sentence length (Flesch 1948); metadiscourse, questions and transitions by genre (Hyland 2005).

**Own choices** (said on the facts by `own`): every number (sentence lengths, sentences per paragraph, vocabulary
bands, how many times a part or a move occurs); the conclusion of an article and the counterargument of an essay as
parts of their own; "problems" in a report; "thank audience" (a convention, no source).

## Sources

- `aristotle`: Aristotle (c. 335 BCE). Poetics, chapter 7. Translated by S. H. Butcher (1895) as The Poetics of Aristotle. London: Macmillan. — A whole plot has a beginning, a middle and an end: what follows nothing necessarily, what follows one thing and is followed by another, and what follows and is followed by nothing.
- `freytag1863`: Freytag, G. (1863). Die Technik des Dramas. Leipzig: S. Hirzel. Translated by E. J. MacEwan (1895) as Technique of the Drama. Chicago: S. C. Griggs. — A drama rises and falls in five parts: introduction (exposition), rising action, climax, falling action (return), and catastrophe (the outcome).
- `labovWaletzky1967`: Labov, W., & Waletzky, J. (1967). Narrative analysis: Oral versions of personal experience. In J. Helm (Ed.), Essays on the Verbal and Visual Arts (pp. 12-44). Seattle: University of Washington Press. — A narrative has an orientation (who, where, when), a complication, an evaluation (why it is worth telling), a resolution and a coda that returns to the present; its narrative clauses are in the past tense, in the order of the events.
- `mandlerJohnson1977`: Mandler, J. M., & Johnson, N. S. (1977). Remembrance of things parsed: Story structure and recall. Cognitive Psychology, 9(1), 111-151. doi:10.1016/0010-0285(77)90006-8 — A story is a setting and one or more episodes; an episode is a beginning, a development (a reaction, a goal, an attempt and its outcome) and an ending; stories told in this structure are recalled best.
- `steinGlenn1979`: Stein, N. L., & Glenn, C. G. (1979). An analysis of story comprehension in elementary school children. In R. O. Freedle (Ed.), New Directions in Discourse Processing (pp. 53-120). Norwood, NJ: Ablex. — An episode is an initiating event, an internal response (a goal), an attempt, a consequence and a reaction, after a setting that introduces the protagonist.
- `swales1990`: Swales, J. M. (1990). Genre Analysis: English in Academic and Research Settings. Cambridge: Cambridge University Press. — Research article introductions make three moves (Create a Research Space): establishing a territory (claiming centrality, generalising, reviewing previous research), establishing a niche (counter-claiming, indicating a gap, raising a question) and occupying the niche (purposes, findings, structure).
- `swales2004`: Swales, J. M. (2004). Research Genres: Explorations and Applications. Cambridge: Cambridge University Press. — In the revised CARS model the third move presents the present work: announcing it is obligatory; research questions, principal findings and the structure of the paper are optional steps.
- `swalesFeak2012`: Swales, J. M., & Feak, C. B. (2012). Academic Writing for Graduate Students: Essential Tasks and Skills (3rd ed.). Ann Arbor: University of Michigan Press. — Academic texts move from general to specific, define their terms, comment on data by comparing and highlighting, use the present tense for general statements and the past for one's own procedures and results, and qualify claims.
- `sollaci2004`: Sollaci, L. B., & Pereira, M. G. (2004). The introduction, methods, results, and discussion (IMRAD) structure: a fifty-year survey. Journal of the Medical Library Association, 92(3), 364-367. — IMRaD (introduction, methods, results, discussion) became the standard structure of original research articles, used by nearly all of them from the 1980s on.
- `apa2020`: American Psychological Association. (2020). Publication Manual of the American Psychological Association (7th ed.). Washington, DC: American Psychological Association. doi:10.1037/0000165-000 — A research report has a title, an abstract, an introduction, a method, results and a discussion; the past tense is used for the method and the results, the present for implications; the active voice and the first person are preferred; numbers go with their units; claims cite their sources.
- `hyland1998`: Hyland, K. (1998). Hedging in Scientific Research Articles. Amsterdam: John Benjamins. — Scientific writers hedge their claims (may, suggest, appear, possibly) to state them with the caution the evidence allows; hedges are densest where results are interpreted.
- `hyland2000`: Hyland, K. (2000). Disciplinary Discourses: Social Interactions in Academic Writing. Harlow: Longman. — Research article abstracts make up to five moves: introduction, purpose, method, product (the results) and conclusion.
- `hyland2005`: Hyland, K. (2005). Metadiscourse: Exploring Interaction in Writing. London: Continuum. — Writers guide readers with transitions and frame markers (first, in conclusion), engage them with questions, and adjust hedges and boosters to the genre.
- `hyland1990`: Hyland, K. (1990). A genre description of the argumentative essay. RELC Journal, 21(1), 66-78. — An argumentative essay has three stages: thesis (gambit, information, proposition, evidence, marker), argument (marker, restatement, claim, support; repeated) and conclusion (marker, consolidation, affirmation, close).
- `toulmin1958`: Toulmin, S. E. (1958). The Uses of Argument. Cambridge: Cambridge University Press. — An argument is a claim supported by data through a warrant, with a qualifier of its force and a rebuttal that names when it does not hold.
- `yangAllison2003`: Yang, R., & Allison, D. (2003). Research articles in applied linguistics: Moving from results to conclusions. English for Specific Purposes, 22(4), 365-385. — Results and discussion sections report results, comment on them (interpreting, comparing with the literature), summarise them, evaluate the study (its limitations) and draw deductions (recommendations for further research).
- `alley2013`: Alley, M. (2013). The Craft of Scientific Presentations: Critical Steps to Succeed and Critical Errors to Avoid (2nd ed.). New York: Springer. — A presentation is built on a few main points announced in a mapping (agenda) slide; each slide makes one assertion, stated as a sentence headline and supported by evidence; the end summarises the points and invites questions.
- `alleyNeeley2005`: Alley, M., & Neeley, K. A. (2005). Rethinking the design of presentation slides: A case for sentence headlines and visual evidence. Technical Communication, 52(4), 417-426. — Slides with a short sentence headline and evidence instead of a topic phrase and a bullet list help the audience keep the assertion of each slide.
- `mayer2009`: Mayer, R. E. (2009). Multimedia Learning (2nd ed.). New York: Cambridge University Press. — People learn better when the organisation is signalled (an outline, headings), the material comes in parts at the learner's pace, and extraneous material is left out (signalling, segmenting, coherence).
- `cowan2001`: Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. Behavioral and Brain Sciences, 24(1), 87-114. doi:10.1017/S0140525X01003922 — About four chunks (three to five) are held in mind at once.
- `niso2005`: National Information Standards Organization. (2005, reaffirmed 2010). ANSI/NISO Z39.18-2005 (R2010): Scientific and Technical Reports - Preparation, Presentation, and Preservation. Bethesda, MD: NISO Press. — The text of a report is a summary, an introduction (purpose and scope), methods, assumptions and procedures, results and discussion, conclusions and recommendations.
- `biberConrad2009`: Biber, D., & Conrad, S. (2009). Register, Genre, and Style. Cambridge: Cambridge University Press. — A register is described by its situation of use and the language features that are typical in it because they serve that situation: pronouns, tense, nominalisation, sentence length, vocabulary.
- `flesch1948`: Flesch, R. (1948). A new readability yardstick. Journal of Applied Psychology, 32(3), 221-233. doi:10.1037/h0057532 — Reading ease falls as the average sentence length in words and the average word length in syllables grow.
- `cutts2013`: Cutts, M. (2013). Oxford Guide to Plain English (4th ed.). Oxford: Oxford University Press. — Plain writing keeps the average sentence to 15-20 words, prefers the active voice and everyday words, and uses "we" and "you".

## Tests

`tests/k.genres.test.mjs`: the shards are what the tool writes; every genre names a register; parts and steps are
numbered in order with `min <= max`; alternatives at one place agree on their counts; every step names a move and
every move is used; slide parts name w.document's slide layouts; registers are sane (min <= typical <= max) and say
what each genre is known for (a story in the past, an article hedged and cited); every source is used, cited here
and well formed. **Integration case for std.compose:** the hand-traced shortest outline of each genre, and 1,000
seeded outlines per genre that all satisfy the structure (parts in order and within their counts, every required
place made, sentences within the step's counts), with how many are distinct.

## Known limits

- The vocabulary band needs the word frequency bands of `k.words` (the word register mark of block "15:15" item 2);
  until they exist a composer can only count words beyond the register's sentence length.
- Moves are sentence-level; a move that needs a paragraph of its own (a long review of previous work) is a step
  with a larger `max`, not a nested structure.
- One genre per document type; sub-genres (a case report, a lab report, a fable) would be genres of their own with
  the same format.
