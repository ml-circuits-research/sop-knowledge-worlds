// k.genres (block "15:00" item 1): document types as structure (parts in order with counts), rhetorical moves (the
// steps of each part, with alternatives) and register (person, tense, voice, sentence length, vocabulary band, what
// it allows), with the published works they rest on.
//   node tools/genres-core.mjs     writes docs/worlds/k.genres/shards/*.sop
// The structures are the sources' (IMRaD and CARS for the article, Hyland's stages for the essay, Labov and
// Waletzky's and Freytag's parts for the story, ANSI/NISO Z39.18 for the report, Alley and Mayer for the
// presentation); every number (sentence lengths, how many times a part or a move occurs) is this repository's own
// choice within what they say, and each fact says so in `own`. WORLD.md cites the works.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';

// name, cite, year, doi, finding
export const SOURCES = [
  ['aristotle', 'Aristotle (c. 335 BCE). Poetics, chapter 7. Translated by S. H. Butcher (1895) as The Poetics of Aristotle. London: Macmillan.', -335, '',
    'A whole plot has a beginning, a middle and an end: what follows nothing necessarily, what follows one thing and is followed by another, and what follows and is followed by nothing.'],
  ['freytag1863', 'Freytag, G. (1863). Die Technik des Dramas. Leipzig: S. Hirzel. Translated by E. J. MacEwan (1895) as Technique of the Drama. Chicago: S. C. Griggs.', 1863, '',
    'A drama rises and falls in five parts: introduction (exposition), rising action, climax, falling action (return), and catastrophe (the outcome).'],
  ['labovWaletzky1967', 'Labov, W., & Waletzky, J. (1967). Narrative analysis: Oral versions of personal experience. In J. Helm (Ed.), Essays on the Verbal and Visual Arts (pp. 12-44). Seattle: University of Washington Press.', 1967, '',
    'A narrative has an orientation (who, where, when), a complication, an evaluation (why it is worth telling), a resolution and a coda that returns to the present; its narrative clauses are in the past tense, in the order of the events.'],
  ['mandlerJohnson1977', 'Mandler, J. M., & Johnson, N. S. (1977). Remembrance of things parsed: Story structure and recall. Cognitive Psychology, 9(1), 111-151.', 1977, '10.1016/0010-0285(77)90006-8',
    'A story is a setting and one or more episodes; an episode is a beginning, a development (a reaction, a goal, an attempt and its outcome) and an ending; stories told in this structure are recalled best.'],
  ['steinGlenn1979', 'Stein, N. L., & Glenn, C. G. (1979). An analysis of story comprehension in elementary school children. In R. O. Freedle (Ed.), New Directions in Discourse Processing (pp. 53-120). Norwood, NJ: Ablex.', 1979, '',
    'An episode is an initiating event, an internal response (a goal), an attempt, a consequence and a reaction, after a setting that introduces the protagonist.'],
  ['swales1990', 'Swales, J. M. (1990). Genre Analysis: English in Academic and Research Settings. Cambridge: Cambridge University Press.', 1990, '',
    'Research article introductions make three moves (Create a Research Space): establishing a territory (claiming centrality, generalising, reviewing previous research), establishing a niche (counter-claiming, indicating a gap, raising a question) and occupying the niche (purposes, findings, structure).'],
  ['swales2004', 'Swales, J. M. (2004). Research Genres: Explorations and Applications. Cambridge: Cambridge University Press.', 2004, '',
    'In the revised CARS model the third move presents the present work: announcing it is obligatory; research questions, principal findings and the structure of the paper are optional steps.'],
  ['swalesFeak2012', 'Swales, J. M., & Feak, C. B. (2012). Academic Writing for Graduate Students: Essential Tasks and Skills (3rd ed.). Ann Arbor: University of Michigan Press.', 2012, '',
    'Academic texts move from general to specific, define their terms, comment on data by comparing and highlighting, use the present tense for general statements and the past for one\'s own procedures and results, and qualify claims.'],
  ['sollaci2004', 'Sollaci, L. B., & Pereira, M. G. (2004). The introduction, methods, results, and discussion (IMRAD) structure: a fifty-year survey. Journal of the Medical Library Association, 92(3), 364-367.', 2004, '',
    'IMRaD (introduction, methods, results, discussion) became the standard structure of original research articles, used by nearly all of them from the 1980s on.'],
  ['apa2020', 'American Psychological Association. (2020). Publication Manual of the American Psychological Association (7th ed.). Washington, DC: American Psychological Association.', 2020, '10.1037/0000165-000',
    'A research report has a title, an abstract, an introduction, a method, results and a discussion; the past tense is used for the method and the results, the present for implications; the active voice and the first person are preferred; numbers go with their units; claims cite their sources.'],
  ['hyland1998', 'Hyland, K. (1998). Hedging in Scientific Research Articles. Amsterdam: John Benjamins.', 1998, '',
    'Scientific writers hedge their claims (may, suggest, appear, possibly) to state them with the caution the evidence allows; hedges are densest where results are interpreted.'],
  ['hyland2000', 'Hyland, K. (2000). Disciplinary Discourses: Social Interactions in Academic Writing. Harlow: Longman.', 2000, '',
    'Research article abstracts make up to five moves: introduction, purpose, method, product (the results) and conclusion.'],
  ['hyland2005', 'Hyland, K. (2005). Metadiscourse: Exploring Interaction in Writing. London: Continuum.', 2005, '',
    'Writers guide readers with transitions and frame markers (first, in conclusion), engage them with questions, and adjust hedges and boosters to the genre.'],
  ['hyland1990', 'Hyland, K. (1990). A genre description of the argumentative essay. RELC Journal, 21(1), 66-78.', 1990, '',
    'An argumentative essay has three stages: thesis (gambit, information, proposition, evidence, marker), argument (marker, restatement, claim, support; repeated) and conclusion (marker, consolidation, affirmation, close).'],
  ['toulmin1958', 'Toulmin, S. E. (1958). The Uses of Argument. Cambridge: Cambridge University Press.', 1958, '',
    'An argument is a claim supported by data through a warrant, with a qualifier of its force and a rebuttal that names when it does not hold.'],
  ['yangAllison2003', 'Yang, R., & Allison, D. (2003). Research articles in applied linguistics: Moving from results to conclusions. English for Specific Purposes, 22(4), 365-385.', 2003, '',
    'Results and discussion sections report results, comment on them (interpreting, comparing with the literature), summarise them, evaluate the study (its limitations) and draw deductions (recommendations for further research).'],
  ['alley2013', 'Alley, M. (2013). The Craft of Scientific Presentations: Critical Steps to Succeed and Critical Errors to Avoid (2nd ed.). New York: Springer.', 2013, '',
    'A presentation is built on a few main points announced in a mapping (agenda) slide; each slide makes one assertion, stated as a sentence headline and supported by evidence; the end summarises the points and invites questions.'],
  ['alleyNeeley2005', 'Alley, M., & Neeley, K. A. (2005). Rethinking the design of presentation slides: A case for sentence headlines and visual evidence. Technical Communication, 52(4), 417-426.', 2005, '',
    'Slides with a short sentence headline and evidence instead of a topic phrase and a bullet list help the audience keep the assertion of each slide.'],
  ['mayer2009', 'Mayer, R. E. (2009). Multimedia Learning (2nd ed.). New York: Cambridge University Press.', 2009, '',
    'People learn better when the organisation is signalled (an outline, headings), the material comes in parts at the learner\'s pace, and extraneous material is left out (signalling, segmenting, coherence).'],
  ['cowan2001', 'Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. Behavioral and Brain Sciences, 24(1), 87-114.', 2001, '10.1017/S0140525X01003922',
    'About four chunks (three to five) are held in mind at once.'],
  ['niso2005', 'National Information Standards Organization. (2005, reaffirmed 2010). ANSI/NISO Z39.18-2005 (R2010): Scientific and Technical Reports - Preparation, Presentation, and Preservation. Bethesda, MD: NISO Press.', 2005, '',
    'The text of a report is a summary, an introduction (purpose and scope), methods, assumptions and procedures, results and discussion, conclusions and recommendations.'],
  ['biberConrad2009', 'Biber, D., & Conrad, S. (2009). Register, Genre, and Style. Cambridge: Cambridge University Press.', 2009, '',
    'A register is described by its situation of use and the language features that are typical in it because they serve that situation: pronouns, tense, nominalisation, sentence length, vocabulary.'],
  ['flesch1948', 'Flesch, R. (1948). A new readability yardstick. Journal of Applied Psychology, 32(3), 221-233.', 1948, '10.1037/h0057532',
    'Reading ease falls as the average sentence length in words and the average word length in syllables grow.'],
  ['cutts2013', 'Cutts, M. (2013). Oxford Guide to Plain English (4th ed.). Oxford: Oxford University Press.', 2013, '',
    'Plain writing keeps the average sentence to 15-20 words, prefers the active voice and everyday words, and uses "we" and "you".'],
];

// name, takes, about, sources, own
export const MOVES = [
  ['introduce topic', 'topic', 'Name the topic and give the background a reader needs.', ['hyland1990', 'alley2013', 'niso2005']],
  ['claim centrality', 'topic', 'Say that the topic matters, or that many have studied it.', ['swales1990']],
  ['generalise', 'fact', 'State what is generally true of the topic or of its kind.', ['swales1990', 'swalesFeak2012']],
  ['review previous work', 'fact', 'Report what earlier work found, with its source.', ['swales1990']],
  ['indicate a gap', 'question', 'Say what is not yet known or not yet done about the topic.', ['swales1990']],
  ['raise a question', 'question', 'Ask a question the text goes on to answer.', ['swales1990', 'hyland1990', 'hyland2005']],
  ['counter-claim', 'fact', 'Say that something commonly believed about the topic does not hold.', ['swales1990']],
  ['state purpose', 'topic', 'Say what this text does.', ['swales1990', 'swales2004', 'niso2005']],
  ['announce findings', 'facts', 'Say in advance what was found.', ['swales2004']],
  ['outline structure', 'outline', 'Say what the parts that follow are, in order.', ['swales2004', 'mayer2009', 'alley2013', 'hyland1990']],
  ['define', 'fact', 'Say what a term means at its first use (its kind and what sets it apart).', ['swalesFeak2012']],
  ['describe method', 'fact', 'Say what was done and how: which facts were used and how they were measured or compared.', ['apa2020', 'hyland2000']],
  ['report result', 'fact', 'State a finding, with its number and unit where it has one.', ['yangAllison2003', 'apa2020', 'hyland2000']],
  ['compare', 'facts', 'Set two things side by side on one attribute.', ['yangAllison2003', 'swalesFeak2012']],
  ['surprising fact', 'fact', 'State a fact that goes against what the reader expects (an exception of its kind, a number far from the usual).', ['hyland1990']],
  ['give example', 'fact', 'Give a thing that is an instance of what was just said.', ['swalesFeak2012', 'alley2013']],
  ['interpret result', 'fact', 'Say what a finding means, with the caution the evidence allows.', ['yangAllison2003', 'hyland1998']],
  ['state limitation', 'topic', 'Say what the work could not show or did not cover.', ['yangAllison2003']],
  ['recommend', 'question', 'Say what should be done or found out next.', ['yangAllison2003', 'niso2005']],
  ['summarize', 'facts', 'Restate the main points briefly.', ['yangAllison2003', 'alley2013', 'niso2005', 'hyland2000']],
  ['conclude', 'topic', 'Say what it all comes to: the point of the text and why it matters.', ['hyland1990', 'hyland2000', 'niso2005']],
  ['transition', 'outline', 'Lead from one part to the next (first, next, in conclusion).', ['hyland2005']],
  ['state thesis', 'topic', 'State the position the text argues for.', ['hyland1990', 'toulmin1958']],
  ['state claim', 'fact', 'State one point (a claim, or the assertion of a slide) that the evidence after it supports.', ['hyland1990', 'toulmin1958', 'alley2013']],
  ['give evidence', 'fact', 'Give a fact that supports the claim, with its source.', ['toulmin1958', 'hyland1990', 'alley2013']],
  ['counterargument', 'fact', 'State fairly a view or a fact against the thesis.', ['toulmin1958']],
  ['rebut', 'fact', 'Answer the counterargument: show where it does not hold.', ['toulmin1958']],
  ['restate thesis', 'topic', 'Say the thesis again, now as shown by the arguments.', ['hyland1990']],
  ['state takeaway', 'topic', 'Say in one sentence what to remember from this point.', ['alley2013', 'alleyNeeley2005']],
  ['thank audience', 'none', 'Thank the listeners.', [], 'A convention of spoken presentations, not taken from a source.'],
  ['invite questions', 'none', 'Invite the listeners to ask questions.', ['alley2013']],
  ['report action', 'fact', 'Say what was done, and when.', ['niso2005']],
  ['report problem', 'fact', 'Say what went wrong or held the work up.', [], 'Progress reports name problems met; NISO Z39.18 has no part of its own for them.'],
  ['next step', 'question', 'Say what will be done next.', ['niso2005']],
  ['set the scene', 'story', 'Say where and when the story happens (the setting of the story plan).', ['labovWaletzky1967', 'freytag1863', 'mandlerJohnson1977']],
  ['introduce character', 'story', 'Bring a character in: who it is and what it is like (the protagonist, later the helper).', ['labovWaletzky1967', 'steinGlenn1979']],
  ['state goal', 'story', 'Say what the protagonist wants or must do.', ['steinGlenn1979', 'mandlerJohnson1977']],
  ['complicate', 'story', 'Bring in what stands in the way of the goal (the obstacle).', ['labovWaletzky1967', 'freytag1863']],
  ['attempt', 'story', 'Tell one try of the protagonist to reach the goal, and how it turned out.', ['mandlerJohnson1977', 'steinGlenn1979']],
  ['turning point', 'story', 'Tell the moment the story turns: the helper\'s gift or the thing set up earlier comes into use.', ['freytag1863']],
  ['resolve', 'story', 'Tell how the obstacle is overcome and the goal reached.', ['labovWaletzky1967', 'freytag1863', 'mandlerJohnson1977']],
  ['evaluate', 'story', 'Say why the events matter: what a character feels, or what was at stake.', ['labovWaletzky1967']],
  ['end', 'story', 'Close the story: the state after the goal, a return to the start, or what was learnt.', ['labovWaletzky1967', 'mandlerJohnson1977']],
];

// name, about, person, person_also, tense, passive, sentence [min, typical, max], paragraph [min, max], band,
// formality, allows { contractions, hedging, citations, units, definitions, direct_speech, questions }, sources, own
export const REGISTERS = [
  ['scientific', 'Impersonal and exact: the writer as "we" or not at all, the present for what holds generally and the past for what was done and found, claims hedged and cited, numbers with units, terms defined.',
    'first plural', ['third'], 'present', true, [12, 22, 32], [3, 7], 5, 'formal',
    { contractions: false, hedging: true, citations: true, units: true, definitions: true, direct_speech: false, questions: false },
    ['apa2020', 'swalesFeak2012', 'hyland1998', 'biberConrad2009'],
    'The sentence lengths, sentences per paragraph and the vocabulary band (rare and technical words allowed, defined at first use).'],
  ['presentation', 'Spoken and direct: "we" and "you", the present tense, short sentence headlines, one assertion per slide, few words on a slide.',
    'first plural', ['second'], 'present', false, [4, 10, 16], [1, 4], 3, 'neutral',
    { contractions: true, hedging: false, citations: true, units: true, definitions: true, direct_speech: false, questions: true },
    ['alley2013', 'alleyNeeley2005', 'mayer2009', 'cutts2013'],
    'The lengths (a headline sentence of at most about two lines), one to four sentences on a slide, and the vocabulary band.'],
  ['essay', 'Argued and personal: "I" may state the position, the present tense, claims supported and qualified, a question to draw the reader in.',
    'first singular', ['third', 'first plural'], 'present', true, [8, 18, 28], [3, 6], 4, 'formal',
    { contractions: false, hedging: true, citations: true, units: true, definitions: true, direct_speech: false, questions: true },
    ['hyland1990', 'hyland2005', 'toulmin1958', 'biberConrad2009'],
    'The sentence lengths, sentences per paragraph and the vocabulary band.'],
  ['narrative', 'Told: the third person (or "I" for one\'s own story), the past tense in the order of the events, concrete and short sentences, the characters\' words in quotes.',
    'third', ['first singular'], 'past', false, [4, 11, 20], [1, 5], 2, 'informal',
    { contractions: true, hedging: false, citations: false, units: false, definitions: false, direct_speech: true, questions: false },
    ['labovWaletzky1967', 'biberConrad2009', 'flesch1948'],
    'The sentence lengths and the vocabulary band (short sentences and common words, readable by children).'],
  ['report', 'Plain and factual: "we", the past tense for what was done, the present for results that hold, the future for next steps, numbers with units, no hedging beyond the evidence.',
    'first plural', ['third'], 'past', true, [8, 15, 24], [2, 5], 3, 'neutral',
    { contractions: false, hedging: false, citations: false, units: true, definitions: false, direct_speech: false, questions: false },
    ['niso2005', 'cutts2013', 'flesch1948'],
    'The sentence lengths (an average of about 15 after Cutts\' 15-20), sentences per paragraph and the vocabulary band.'],
];

// Genres: name, about, register, unit, also_move, sources, own; parts: [name, min, max, { heading, layout, tense },
// about, sources, own, steps]; a step: [move or [alternative moves], min, max, { stage, tense, about }, sources].
export const GENRES = [
  { name: 'scientific article', register: 'scientific', unit: 'chapter', also: ['define', 'transition', 'give example'],
    about: 'A research article: an abstract, then introduction, methods, results and discussion (IMRaD), and an optional conclusion; the introduction makes the moves of Swales\' CARS model.',
    sources: ['sollaci2004', 'apa2020', 'swales1990', 'swales2004'], own: 'The conclusion as a part of its own (optional) and the counts of sentences per move.',
    parts: [
      ['abstract', 1, 1, { heading: 'Abstract' }, 'The whole article in a few sentences, one for each move.', ['hyland2000', 'apa2020'], '', [
        ['introduce topic', 0, 1, { stage: 'introduction' }, ['hyland2000']],
        ['state purpose', 1, 1, { stage: 'purpose' }, ['hyland2000']],
        ['describe method', 1, 1, { stage: 'method', tense: 'past' }, ['hyland2000']],
        ['report result', 1, 2, { stage: 'product', tense: 'past' }, ['hyland2000']],
        ['conclude', 1, 1, { stage: 'conclusion' }, ['hyland2000']],
      ]],
      ['introduction', 1, 1, { heading: 'Introduction' }, 'Why the topic matters, what is not known about it, and what this article does (CARS).', ['swales1990', 'swales2004'], '', [
        ['claim centrality', 0, 1, { stage: 'establishing a territory' }, ['swales1990']],
        ['generalise', 1, 2, { stage: 'establishing a territory' }, ['swales1990']],
        ['review previous work', 1, 3, { stage: 'establishing a territory' }, ['swales1990']],
        [['indicate a gap', 'raise a question', 'counter-claim'], 1, 1, { stage: 'establishing a niche' }, ['swales1990']],
        ['state purpose', 1, 1, { stage: 'occupying the niche' }, ['swales1990', 'swales2004']],
        ['announce findings', 0, 1, { stage: 'occupying the niche' }, ['swales2004']],
        ['outline structure', 0, 1, { stage: 'occupying the niche' }, ['swales2004']],
      ]],
      ['methods', 1, 1, { heading: 'Methods', tense: 'past' }, 'What was done: the facts used and how they were measured or compared.', ['apa2020', 'sollaci2004'], '', [
        ['describe method', 2, 5, {}, ['apa2020']],
      ]],
      ['results', 1, 1, { heading: 'Results', tense: 'past' }, 'What was found, with numbers and units, compared where it helps.', ['apa2020', 'yangAllison2003'], '', [
        ['report result', 2, 5, {}, ['yangAllison2003']],
        ['compare', 0, 2, { about: 'comment on the results by comparing them' }, ['yangAllison2003', 'swalesFeak2012']],
        ['summarize', 0, 1, {}, ['yangAllison2003']],
      ]],
      ['discussion', 1, 1, { heading: 'Discussion' }, 'What the results mean, how they compare with earlier work, what the study could not show, and what follows.', ['yangAllison2003', 'apa2020'], '', [
        ['summarize', 1, 1, { about: 'the main findings again', tense: 'past' }, ['yangAllison2003']],
        [['interpret result', 'compare', 'surprising fact'], 1, 3, { about: 'comment on the findings' }, ['yangAllison2003', 'hyland1998']],
        ['state limitation', 0, 1, {}, ['yangAllison2003']],
        ['recommend', 0, 1, { about: 'further research' }, ['yangAllison2003']],
        ['conclude', 1, 1, {}, ['yangAllison2003']],
      ]],
      ['conclusion', 0, 1, { heading: 'Conclusion' }, 'The point of the article in a few sentences.', ['niso2005'], 'A separate conclusion is optional (many journals end with the discussion).', [
        ['summarize', 1, 2, {}, ['niso2005']],
        ['conclude', 1, 1, {}, ['niso2005']],
      ]],
    ] },
  { name: 'presentation', register: 'presentation', unit: 'slide', also: ['give example', 'raise a question', 'transition'],
    about: 'A talk with slides: a title slide, an agenda of the main points, one slide (or a short run of slides) per point with a sentence headline, its evidence and what to remember, a summary of the points, and a closing slide.',
    sources: ['alley2013', 'alleyNeeley2005', 'mayer2009'], own: 'Three to five points (after Cowan\'s three to five chunks); the counts of sentences.',
    parts: [
      ['title', 1, 1, { layout: 'title' }, 'The topic and the speaker.', ['alley2013'], '', [
        ['introduce topic', 1, 1, {}, ['alley2013']],
      ]],
      ['agenda', 1, 1, { layout: 'agenda', heading: 'Overview' }, 'The main points, in the order they come (a mapping slide).', ['alley2013', 'mayer2009'], '', [
        ['outline structure', 1, 1, {}, ['alley2013', 'mayer2009']],
      ]],
      ['point', 3, 5, { layout: 'content' }, 'One main point: its assertion as the headline, the evidence or an example, and what to remember.', ['alley2013', 'alleyNeeley2005', 'cowan2001'], 'Three to five points: the count is this repository\'s choice after Cowan (2001).', [
        ['state claim', 1, 1, { about: 'the assertion of the slide, as its sentence headline' }, ['alleyNeeley2005']],
        [['give evidence', 'give example', 'compare', 'surprising fact'], 1, 2, {}, ['alley2013']],
        ['state takeaway', 0, 1, {}, ['alley2013']],
      ]],
      ['summary', 1, 1, { layout: 'summary', heading: 'Summary' }, 'The main points again, in a few words each.', ['alley2013'], '', [
        ['summarize', 1, 3, {}, ['alley2013']],
        ['conclude', 0, 1, {}, ['alley2013']],
      ]],
      ['closing', 1, 1, { layout: 'closing', heading: 'Questions' }, 'Thanks and an invitation to ask.', ['alley2013'], '', [
        ['thank audience', 1, 1, {}, []],
        ['invite questions', 0, 1, {}, ['alley2013']],
      ]],
    ] },
  { name: 'essay', register: 'essay', unit: 'chapter', also: ['give example', 'define', 'transition', 'compare'],
    about: 'An argumentative essay: an introduction that ends with the thesis, two to four arguments each with a claim and its evidence, a counterargument and its rebuttal, and a conclusion that restates the thesis (Hyland\'s thesis, argument and conclusion stages; Toulmin\'s claim, data and rebuttal).',
    sources: ['hyland1990', 'toulmin1958'], own: 'The counterargument as a part of its own, and the counts.',
    parts: [
      ['introduction', 1, 1, { heading: 'Introduction' }, 'Draw the reader in, give the background, state the thesis.', ['hyland1990'], '', [
        [['surprising fact', 'raise a question', 'generalise'], 0, 1, { stage: 'thesis stage', about: 'the gambit: something to draw the reader in' }, ['hyland1990']],
        ['introduce topic', 1, 2, { stage: 'thesis stage', about: 'information: the background' }, ['hyland1990']],
        ['state thesis', 1, 1, { stage: 'thesis stage', about: 'the proposition' }, ['hyland1990', 'toulmin1958']],
        ['outline structure', 0, 1, { stage: 'thesis stage', about: 'the marker: how the essay goes on' }, ['hyland1990']],
      ]],
      ['argument', 2, 4, {}, 'One argument for the thesis: its claim and the evidence for it.', ['hyland1990', 'toulmin1958'], 'Two to four arguments.', [
        ['state claim', 1, 1, { stage: 'argument stage' }, ['hyland1990', 'toulmin1958']],
        ['give evidence', 1, 3, { stage: 'argument stage', about: 'the support: data for the claim' }, ['hyland1990', 'toulmin1958']],
        ['give example', 0, 1, { stage: 'argument stage' }, ['hyland1990']],
      ]],
      ['counterargument', 1, 1, {}, 'A view against the thesis, stated fairly, and the answer to it.', ['toulmin1958'], 'One counterargument part; Hyland (1990) does not require it, the owner\'s brief does.', [
        ['counterargument', 1, 2, {}, ['toulmin1958']],
        ['rebut', 1, 2, {}, ['toulmin1958']],
      ]],
      ['conclusion', 1, 1, { heading: 'Conclusion' }, 'The thesis again, as now shown, and why it matters.', ['hyland1990'], '', [
        ['restate thesis', 1, 1, { stage: 'conclusion stage', about: 'consolidation and affirmation' }, ['hyland1990']],
        ['summarize', 0, 1, { stage: 'conclusion stage' }, ['hyland1990']],
        ['conclude', 1, 1, { stage: 'conclusion stage', about: 'the close' }, ['hyland1990']],
      ]],
    ] },
  { name: 'story', register: 'narrative', unit: 'chapter', also: ['evaluate'],
    about: 'A story: an orientation (setting, protagonist, goal), a complication (the obstacle and the attempts that fail), a climax (the turning point), a resolution and an ending. The elements, what fills them and the constraints between them are k.story\'s.',
    sources: ['aristotle', 'freytag1863', 'labovWaletzky1967', 'mandlerJohnson1977', 'steinGlenn1979'], own: 'Five parts (Freytag\'s five, named after Labov and Waletzky), the counts.',
    parts: [
      ['orientation', 1, 1, {}, 'Who, where and when, and what the protagonist wants (the beginning; Freytag\'s exposition).', ['labovWaletzky1967', 'freytag1863', 'steinGlenn1979'], '', [
        ['set the scene', 1, 2, {}, ['labovWaletzky1967']],
        ['introduce character', 1, 2, { about: 'the protagonist' }, ['labovWaletzky1967', 'steinGlenn1979']],
        ['state goal', 1, 1, {}, ['steinGlenn1979']],
      ]],
      ['complication', 1, 1, {}, 'What stands in the way, and the tries that do not yet succeed (Freytag\'s rising action).', ['labovWaletzky1967', 'freytag1863', 'mandlerJohnson1977'], '', [
        ['complicate', 1, 2, { about: 'the obstacle' }, ['labovWaletzky1967']],
        ['attempt', 1, 3, { about: 'tries that fail; three at most, as in folk tales' }, ['mandlerJohnson1977', 'steinGlenn1979']],
        ['introduce character', 0, 1, { about: 'the helper' }, ['steinGlenn1979']],
      ]],
      ['climax', 1, 1, {}, 'The turning point: the helper\'s gift, or what was set up earlier, comes into use.', ['freytag1863'], '', [
        ['turning point', 1, 2, {}, ['freytag1863']],
        ['evaluate', 0, 1, {}, ['labovWaletzky1967']],
      ]],
      ['resolution', 1, 1, {}, 'The obstacle overcome and the goal reached (Freytag\'s falling action and outcome).', ['labovWaletzky1967', 'freytag1863'], '', [
        ['resolve', 1, 2, {}, ['labovWaletzky1967']],
      ]],
      ['ending', 1, 1, {}, 'The state after the goal, a return to the start, or what was learnt (the coda).', ['labovWaletzky1967', 'mandlerJohnson1977', 'aristotle'], '', [
        ['end', 1, 1, {}, ['labovWaletzky1967']],
        ['evaluate', 0, 1, { about: 'what was learnt' }, ['labovWaletzky1967']],
      ]],
    ] },
  { name: 'report', register: 'report', unit: 'chapter', also: ['compare', 'transition'],
    about: 'A report of work done: a summary, what the work was and why, what was done and when, the results, the problems met (if any), and the next steps (after ANSI/NISO Z39.18: summary, introduction, methods, results, conclusions and recommendations).',
    sources: ['niso2005', 'cutts2013'], own: 'The parts "work done" and "problems" for a report of work (NISO\'s methods and procedures; problems are this repository\'s), and the counts.',
    parts: [
      ['summary', 1, 1, { heading: 'Summary' }, 'The whole report in a few sentences.', ['niso2005'], '', [
        ['summarize', 1, 3, {}, ['niso2005']],
      ]],
      ['introduction', 1, 1, { heading: 'Introduction', tense: 'present' }, 'What the work is and why it was done.', ['niso2005'], '', [
        ['introduce topic', 1, 1, {}, ['niso2005']],
        ['state purpose', 1, 1, {}, ['niso2005']],
      ]],
      ['work done', 1, 1, { heading: 'Work done' }, 'What was done, and when, in order.', ['niso2005'], 'NISO\'s methods, assumptions and procedures, as the acts done.', [
        ['report action', 1, 6, {}, ['niso2005']],
      ]],
      ['results', 1, 1, { heading: 'Results', tense: 'present' }, 'What came out of it, with numbers.', ['niso2005'], '', [
        ['report result', 1, 4, {}, ['niso2005']],
        ['compare', 0, 1, {}, ['niso2005']],
      ]],
      ['problems', 0, 1, { heading: 'Problems' }, 'What went wrong or held the work up.', [], 'A part of a progress report, not of NISO Z39.18.', [
        ['report problem', 1, 2, {}, []],
      ]],
      ['next steps', 1, 1, { heading: 'Next steps', tense: 'future' }, 'What will be done next.', ['niso2005'], 'NISO\'s recommendations, as the writer\'s own next steps.', [
        ['next step', 1, 3, {}, ['niso2005']],
      ]],
    ] },
];

// Other names of the genres (a host finds "a paper" or "a talk").
export const GENRE_WORDS = {
  'scientific article': ['scientific articles', 'article', 'research article', 'paper', 'scientific paper', 'research paper'],
  presentation: ['presentations', 'talk', 'slides', 'slide show', 'slideshow'],
  essay: ['essays', 'composition', 'argumentative essay'],
  story: ['stories', 'tale', 'fairy tale', 'narrative'],
  report: ['reports', 'progress report', 'status report'],
};

const shardOf = (genre) => seg(genre).replace(/_/g, '-');

export function genresShards() {
  const head = (id, about) => header({ id: `k.genres/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository: tools/genres-core.mjs; the works cited are in WORLD.md)'], license: 'CC0-1.0', script: 'tools/genres-core.mjs' });
  const sources = SOURCES.map(([name, cite, year, doi, finding]) => wire(`k.genres.source.${name}`, 'k.genres.source',
    [['name', name], ['cite', text(cite)], ['year', year], ['doi', doi ? text(doi) : undefined], ['finding', text(finding)]], SRC));
  const moves = MOVES.map(([name, takes, about, src, own]) => wire(`k.genres.move.${seg(name)}`, 'k.genres.move',
    [['name', name], ['about', text(about)], ['takes', takes], ...src.map((s) => ['source', s]), ['own', own ? text(own) : undefined]], SRC));
  const registers = REGISTERS.map(([name, about, person, also, tense, passive, [smin, styp, smax], [pmin, pmax], band, formality, allows, src, own]) => wire(`k.genres.register.${seg(name)}`, 'k.genres.register',
    [['name', name], ['about', text(about)], ['person', person], ...also.map((p) => ['person_also', p]), ['tense', tense], ['passive', passive],
      ['sentence_min', smin], ['sentence_typical', styp], ['sentence_max', smax], ['paragraph_min', pmin], ['paragraph_max', pmax], ['vocabulary_band', band], ['formality', formality],
      ...Object.entries(allows), ...src.map((s) => ['source', s]), ['own', text(own)]], SRC));
  const files = {
    'sources.sop': `${head('sources', `the ${SOURCES.length} published works the genres, moves and registers rest on: reference, year, DOI where sure, and what this world takes from each.`)}\n${sources.join('\n')}\n`,
    'moves.sop': `${head('moves', `${MOVES.length} rhetorical moves (what a sentence does for the reader), what a composer fills each with, and the works that name them.`)}\n${moves.join('\n')}\n`,
    'registers.sop': `${head('registers', `${REGISTERS.length} registers (scientific, presentation, essay, narrative, report): person, tense, voice, sentence length, sentences per paragraph, vocabulary band, formality and what each allows.`)}\n${registers.join('\n')}\n`,
  };
  for (const g of GENRES) {
    const gid = seg(g.name);
    const lines = [wire(`k.genres.genre.${gid}`, 'k.genres.genre', [['name', g.name], ['about', text(g.about)], ['register', g.register], ['unit', g.unit], ...g.also.map((m) => ['also_move', m]), ...g.sources.map((s) => ['source', s]), ['own', g.own ? text(g.own) : undefined]], SRC)];
    let nSteps = 0;
    g.parts.forEach(([name, min, max, extra, about, src, own, steps], i) => {
      const pid = `${gid}.${seg(name)}`;
      lines.push('', `# ${name}`);
      lines.push(wire(`k.genres.part.${pid}`, 'k.genres.part', [['genre', g.name], ['name', name], ['n', i + 1], ['min', min], ['max', max], ['heading', extra.heading], ['layout', extra.layout], ['tense', extra.tense], ['about', text(about)], ...src.map((s) => ['source', s]), ['own', own ? text(own) : undefined]], SRC));
      steps.forEach(([moves, smin, smax, sx, ssrc], j) => {
        for (const move of [].concat(moves)) {
          nSteps += 1;
          lines.push(wire(`k.genres.step.${pid}.${j + 1}.${seg(move)}`, 'k.genres.step', [['genre', g.name], ['part', name], ['n', j + 1], ['move', move], ['min', smin], ['max', smax], ['stage', sx.stage], ['tense', sx.tense], ['about', sx.about ? text(sx.about) : undefined], ...ssrc.map((s) => ['source', s])], SRC));
        }
      });
    });
    lines.push('', '# Other names of the genre.');
    lines.push(`@k.genres.word.genre.${gid} core.word ${GENRE_WORDS[g.name].map((w) => `text=${/^[a-z]+$/.test(w) ? w : JSON.stringify(w)}`).join(' ')} means=${/^[a-z]+$/.test(g.name) ? g.name : JSON.stringify(g.name)} of=k.genres.genre.name core.source="${SRC}"`);
    files[`${shardOf(g.name)}.sop`] = `${head(shardOf(g.name), `the genre "${g.name}": ${g.parts.length} parts in order with how many times each occurs, and ${nSteps} steps (the moves of each part in order, with alternatives and sentence counts).`)}\n${lines.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = genresShards();
  writeShards(join(WORLDS_DIR, 'k.genres', 'shards'), files);
  console.log(`${SOURCES.length} sources, ${MOVES.length} moves, ${REGISTERS.length} registers, ${GENRES.length} genres, ${GENRES.reduce((n, g) => n + g.parts.length, 0)} parts`);
}

// The reference reading of the format (for tests, and as the library's integration case): an outline of a genre,
// drawn with a seeded random function `rnd` (0 <= rnd() < 1), or the shortest one with `rnd = null` (every count at
// its minimum, the first alternative). An outline is [{ part, n, moves: [{ move, sentences }] }] in order; a part
// that occurs k times appears k times. `facts` are the k.genres facts as plain objects ({ part: [...], step: [...] }).
export function outline(facts, genre, rnd = null) {
  const pick = (min, max) => (rnd ? min + Math.floor(rnd() * (max - min + 1)) : min);
  const parts = facts.part.filter((p) => p.genre === genre).sort((a, b) => a.n - b.n);
  const out = [];
  for (const p of parts) {
    const times = pick(p.min, p.max);
    for (let t = 0; t < times; t += 1) {
      const steps = facts.step.filter((s) => s.genre === genre && s.part === p.name);
      const places = [...new Set(steps.map((s) => s.n))].sort((a, b) => a - b);
      const moves = [];
      for (const n of places) {
        const alts = steps.filter((s) => s.n === n);
        const s = rnd ? alts[Math.floor(rnd() * alts.length)] : alts[0];
        const k = pick(s.min, s.max);
        if (k > 0) moves.push({ move: s.move, sentences: k });
      }
      out.push({ part: p.name, n: p.n, moves });
    }
  }
  return out;
}
