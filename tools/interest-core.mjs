// k.interest (blocks "14:45" item 1 and "15:00"): what makes a fact, a link or a passage interesting, as features a
// program measures, with weight ranges and the published works their directions rest on.
//   node tools/interest-core.mjs     writes docs/worlds/k.interest/shards/{sources,features}.sop
// Every number below is this repository's own choice (each feature says so in `own`); the direction of each feature
// and the structure (novelty times comprehensibility, Silvia 2005/2008) are the sources'. WORLD.md cites them.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';

// name, cite, year, doi, finding
export const SOURCES = [
  ['berlyne1960', 'Berlyne, D. E. (1960). Conflict, Arousal, and Curiosity. New York: McGraw-Hill.', 1960, '',
    'The collative variables novelty, complexity, surprise and incongruity draw attention and exploration; repeated exposure habituates them.'],
  ['silvia2005', 'Silvia, P. J. (2005). What is interesting? Exploring the appraisal structure of interest. Emotion, 5(1), 89-102.', 2005, '10.1037/1528-3542.5.1.89',
    'Interest comes from two appraisals together: that something is new and complex, and that one can understand it (coping potential).'],
  ['silvia2008', 'Silvia, P. J. (2008). Interest - the curious emotion. Current Directions in Psychological Science, 17(1), 57-60.', 2008, '10.1111/j.1467-8721.2008.00548.x',
    'Novelty-complexity and comprehensibility appraisals predict interest across texts, pictures and people; too complex to understand is not interesting.'],
  ['loewenstein1994', 'Loewenstein, G. (1994). The psychology of curiosity: A review and reinterpretation. Psychological Bulletin, 116(1), 75-98.', 1994, '10.1037/0033-2909.116.1.75',
    'Curiosity is felt when attention falls on a gap in what one knows (the information gap), and grows when the gap is small enough to be closed.'],
  ['kang2009', 'Kang, M. J., Hsu, M., Krajbich, I. M., Loewenstein, G., McClure, S. M., Wang, J. T., & Camerer, C. F. (2009). The wick in the candle of learning: Epistemic curiosity activates reward circuitry and enhances memory. Psychological Science, 20(8), 963-973.', 2009, '10.1111/j.1467-9280.2009.02402.x',
    'Curiosity about the answer to a question is highest at middling confidence (an inverted U), lower when one knows nothing or already knows.'],
  ['hidi1986', 'Hidi, S., & Baird, W. (1986). Interestingness - a neglected variable in discourse processing. Cognitive Science, 10(2), 179-194.', 1986, '',
    'The interest of a text comes from novelty, activity and character identification, and from information that is important and new to the reader.'],
  ['hidi2006', 'Hidi, S., & Renninger, K. A. (2006). The four-phase model of interest development. Educational Psychologist, 41(2), 111-127.', 2006, '10.1207/s15326985ep4102_4',
    'Situational interest is triggered by features of the text (surprise, personal relevance) and held by meaningfulness; individual interest follows what a reader already cares about.'],
  ['schank1979', 'Schank, R. C. (1979). Interestingness: Controlling inferences. Artificial Intelligence, 12(3), 273-297.', 1979, '10.1016/0004-3702(79)90009-2',
    'What is interesting is the unexpected, the personally relevant and a few absolute interests (people, danger, death); a program should follow those and leave the expected.'],
  ['davis1971', 'Davis, M. S. (1971). That\'s interesting! Towards a phenomenology of sociology and a sociology of phenomenology. Philosophy of the Social Sciences, 1(4), 309-344.', 1971, '',
    'A claim is interesting when it denies something its audience assumes ("what seems to be X is in reality non-X"); one that confirms an assumption is obvious.'],
  ['iranNejad1987', 'Iran-Nejad, A. (1987). Cognitive and affective causes of interest and liking. Journal of Educational Psychology, 79(2), 120-130.', 1987, '10.1037/0022-0663.79.2.120',
    'Unexpectedness, and its resolution, raised the interest of stories; interest and liking have partly different causes.'],
  ['kintsch1980', 'Kintsch, W. (1980). Learning from text, levels of comprehension, or: Why anyone would read a story anyway. Poetics, 9(1-3), 87-98.', 1980, '',
    'Cognitive interest in a text comes from surprise that can be made sense of afterwards (unexpected but postdictable), and depends on what the reader knows.'],
  ['sadoski1993', 'Sadoski, M., Goetz, E. T., & Fritz, J. B. (1993). Impact of concreteness on comprehensibility, interest, and memory for text. Journal of Educational Psychology, 85(2), 291-304.', 1993, '10.1037/0022-0663.85.2.291',
    'Concreteness was the strongest predictor of how comprehensible and how interesting readers found a passage, and of what they remembered.'],
  ['schraw1995', 'Schraw, G., Bruning, R., & Svoboda, C. (1995). Sources of situational interest. Journal of Reading Behavior, 27(1), 1-17.', 1995, '',
    'Ease of comprehension, cohesion, vividness, engagement, emotiveness and prior knowledge each raised the interest readers reported.'],
  ['garner1989', 'Garner, R., Gillingham, M. G., & White, C. S. (1989). Effects of "seductive details" on macroprocessing and microprocessing in adults and children. Cognition and Instruction, 6(1), 41-57.', 1989, '',
    'Interesting details that are off the point ("seductive details") lowered what readers took from the main ideas.'],
  ['sperber1986', 'Sperber, D., & Wilson, D. (1986). Relevance: Communication and Cognition. Oxford: Blackwell.', 1986, '',
    'An utterance is relevant to the degree that it changes what the hearer believes, for as little effort of understanding as possible.'],
  ['grice1975', 'Grice, H. P. (1975). Logic and conversation. In P. Cole & J. L. Morgan (Eds.), Syntax and Semantics 3: Speech Acts (pp. 41-58). New York: Academic Press.', 1975, '',
    'Speakers are expected to say as much as is needed and no more (quantity), and what bears on the point (relation); saying the known or the beside-the-point breaks the expectation.'],
  ['labov1972', 'Labov, W. (1972). The transformation of experience in narrative syntax. In Language in the Inner City (pp. 354-396). Philadelphia: University of Pennsylvania Press.', 1972, '',
    'A narrative needs evaluation, the part that says why it is worth telling; without it a hearer asks "so what?".'],
  ['cowan2001', 'Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. Behavioral and Brain Sciences, 24(1), 87-114.', 2001, '10.1017/S0140525X01003922',
    'About three to five chunks can be held in mind at once.'],
  ['koestler1964', 'Koestler, A. (1964). The Act of Creation. London: Hutchinson.', 1964, '',
    'The creative and the funny join two frames of reference that are usually apart (bisociation).'],
  ['mednick1962', 'Mednick, S. A. (1962). The associative basis of the creative process. Psychological Review, 69(3), 220-232.', 1962, '10.1037/h0048850',
    'Bringing together ideas that are remote from each other is what makes an association creative.'],
  ['itti2009', 'Itti, L., & Baldi, P. (2009). Bayesian surprise attracts human attention. Vision Research, 49(10), 1295-1306.', 2009, '10.1016/j.visres.2008.09.007',
    'Attention goes to what changes an observer\'s expectations most (surprise as the distance between what was expected and what is seen).'],
  ['new2007', 'New, J., Cosmides, L., & Tooby, J. (2007). Category-specific attention for animals reflects ancestral priorities, not expertise. Proceedings of the National Academy of Sciences, 104(42), 16598-16603.', 2007, '10.1073/pnas.0703913104',
    'People and animals draw attention faster than other things, even vehicles one has learnt to watch.'],
  ['geng2006', 'Geng, L., & Hamilton, H. J. (2006). Interestingness measures for data mining: A survey. ACM Computing Surveys, 38(3), article 9.', 2006, '10.1145/1132960.1132963',
    'Programs score a found pattern by conciseness, coverage, peculiarity, novelty, surprisingness and use; peculiarity is distance from the other records.'],
];

// name, combine, base, about, sources, own
export const APPRAISALS = [
  ['novelty', 'multiply', 0, 'Is it new, complex or unexpected: a link between distant worlds, an exception to what most things of its kind do, a number far from the usual, a question it opens.', ['silvia2005', 'silvia2008', 'berlyne1960'],
    'Base 0: a fact with nothing new in it scores nothing however clear it is.'],
  ['coping', 'multiply', 0.7, 'Can the reader understand it: concrete things, words the reader knows, sentences of a manageable length, an example after a claim.', ['silvia2005', 'silvia2008', 'schraw1995'],
    'Base 0.7: a plain sentence is understood; concreteness and examples add, unknown words and long sentences take away.'],
  ['relevance', 'multiply', 0.4, 'Does it bear on the topic and on the reader: on the topic or near it, about what the reader has just used, about people and animals.', ['sperber1986', 'hidi2006', 'garner1989'],
    'Base 0.4: a fact that is neither on nor off the topic counts less than half; the topic itself brings it to about 1.'],
  ['penalty', 'subtract', 0, 'What makes text dull: saying a fact again, the same pattern again and again, the obvious, a list without a point.', ['grice1975', 'berlyne1960', 'labov1972'],
    'Subtracted from the product, so a repeated fact (penalty 1) is never chosen.'],
];

// name, scope, reads, gives, about
export const MEASURES = [
  ['world_distance', 'link', ['k.attributes.found'], 'a whole number from 0: 0 when the two things are in one world',
    'The fewest joins of the catalog (a value of one world that names a fact of another: an animal\'s habitat a scene, a food\'s drawing an object) between the worlds of the two things a fact links.'],
  ['sibling_contrast', 'fact', ['k.animals.animal', 'k.attributes.thing', 'k.kinds.kind'], 'a share from 0 to 1',
    'Among the siblings of the thing (things of the same class or kind), the share that have another value for the key than this fact gives, when at least 5 siblings say the key (a penguin cannot fly: most birds can). 0 when fewer say it.'],
  ['rule_exception', 'fact', ['k.commonsense.thing'], '1 or 0',
    '1 when the fact breaks a soft rule or a default of k.commonsense (a soft deny holds for its kind but not for it), else 0.'],
  ['range_distance', 'fact', ['k.attributes.number'], 'a number from 0: widths of the typical range',
    'How far a number lies outside the typical range of its key for things of its kind: the distance to the nearer end divided by the width of the range; 0 inside the range.'],
  ['sibling_rank', 'fact', ['k.attributes.number', 'k.kinds.kind'], '1 or 0',
    '1 when the number is the largest or the smallest of its key among at least 5 siblings that say the key (the fastest, the heaviest), else 0.'],
  ['word_band', 'fact', ['k.words.sense'], 'a whole number from 1 (most frequent words) to 5 (rare)',
    'The frequency band of the word for the thing; a word with no sense in k.words counts as band 5.'],
  ['known_share', 'sentence', [], 'a share from 0 to 1',
    'For a question the text asks: the share of the facts that answer it which the text has already said. Only a question the catalog can answer is measured.'],
  ['number_with_unit', 'fact', ['k.units.measure'], '1 or 0',
    '1 when the fact gives a number with its unit or what it counts (k.units.measure), else 0.'],
  ['concreteness', 'fact', ['k.objects.object', 'k.words.sense'], '1 or 0',
    '1 when the thing can be drawn (a k.objects drawing) or its chain of kinds reaches "physical entity", else 0.'],
  ['share_beyond_band', 'sentence', ['k.words.sense'], 'a share from 0 to 1',
    'The share of the content words of a sentence whose frequency band is above the vocabulary band of the register (k.genres).'],
  ['words_over_max', 'sentence', [], 'a whole number from 0',
    'How many words a sentence has beyond the longest sentence its register allows (k.genres).'],
  ['example_after_claim', 'passage', [], '1 or 0',
    '1 when a general statement in the passage is followed by an example of it (a thing that is one of the kind it speaks of), else 0.'],
  ['topic_distance', 'fact', ['k.attributes.found'], 'a whole number from 0: 0 for a fact about the topic itself',
    'The fewest joins between the thing the fact is about and the topic of the text.'],
  ['seen_in_session', 'fact', [], '1 or 0',
    '1 when the reader named or used the thing earlier in the session (the host\'s history), else 0.'],
  ['animacy', 'fact', ['k.animals.animal', 'k.people.kind', 'k.people.role'], '1 or 0',
    '1 when the thing is an animal or a person, else 0.'],
  ['said_before', 'sentence', [], '1 or 0',
    '1 when the text has already stated this key of this fact, else 0.'],
  ['same_move_run', 'passage', [], 'a whole number from 1',
    'How many sentences in a row, ending with this one, have the same rhetorical move and the same key.'],
  ['obviousness', 'fact', ['k.kinds.kind', 'k.words.sense'], '1 or 0',
    '1 when the fact is what the reader assumes: made by a rule (derived=true), a value that at least 9 in 10 of its siblings share (a dog has four legs), or a kind one step above in an everyday word (a dog is an animal); else 0.'],
  ['items_without_point', 'passage', [], 'a whole number from 0',
    'How many facts in a row the passage has stated since its last comparison, contrast, surprising fact or conclusion.'],
  ['ends_without_point', 'passage', [], '1 or 0',
    '1 when the passage ends without a conclusion or an evaluation (why it matters), else 0.'],
];

// name, appraisal, measure, shape, { start_at, peak_at, full_at }, [weight_min, weight_max], about, sources, own
export const FEATURES = [
  ['distant_link', 'novelty', 'world_distance', 'rising', { start_at: 0, full_at: 3 }, [0.25, 0.45],
    'A fact that links things of distant worlds (an animal and a planet, a food and a country) is new and makes a connection the reader had not made.',
    ['koestler1964', 'mednick1962', 'silvia2005'], 'Distance counted in joins of the catalog; full at 3 joins; the weights.'],
  ['sibling_contrast', 'novelty', 'sibling_contrast', 'rising', { start_at: 0.5, full_at: 0.9 }, [0.4, 0.6],
    'A thing that does not do what most things of its kind do (a bird that cannot fly, a mammal that lays eggs) denies an assumption of the reader.',
    ['davis1971', 'schank1979', 'iranNejad1987', 'kintsch1980'], 'What most siblings do stands for what the reader assumes; starts at a half, full at nine in ten; the weights.'],
  ['rule_exception', 'novelty', 'rule_exception', 'step', { full_at: 1 }, [0.4, 0.6],
    'A fact that breaks a common-sense rule of k.commonsense is surprising, and can be made sense of afterwards.',
    ['davis1971', 'iranNejad1987', 'kintsch1980'], 'k.commonsense soft rules stand for what the reader assumes; the weights.'],
  ['far_number', 'novelty', 'range_distance', 'rising', { start_at: 0, full_at: 2 }, [0.3, 0.5],
    'A number far from what is usual for its kind (a whale 30 m long, a hummingbird of 3 g) surprises.',
    ['itti2009', 'berlyne1960'], 'Distance in widths of the typical range; full at 2 widths; the weights.'],
  ['extreme', 'novelty', 'sibling_rank', 'step', { full_at: 1 }, [0.2, 0.35],
    'The largest, smallest, fastest or slowest of its kind is peculiar and easy to remember.',
    ['geng2006', 'schank1979'], 'Among at least 5 siblings; the weights.'],
  ['rare_kind', 'novelty', 'word_band', 'rising', { start_at: 2, full_at: 5 }, [0.05, 0.2],
    'A thing the reader meets rarely (its word is rare) is new.',
    ['berlyne1960', 'silvia2005'], 'The frequency of the word stands for how familiar the thing is; bands; the weights.'],
  ['opens_question', 'novelty', 'known_share', 'peak', { start_at: 0, peak_at: 0.5, full_at: 1 }, [0.2, 0.4],
    'A question the text asks (why can a penguin not fly?) draws the reader on when part of the answer is known and the rest can be given.',
    ['loewenstein1994', 'kang2009'], 'The share of the answer already said stands for confidence; peak at a half; only questions the catalog answers; the weights.'],
  ['number_given', 'coping', 'number_with_unit', 'step', { full_at: 1 }, [0.05, 0.15],
    'A number with its unit makes a statement concrete, easier to picture and to check.',
    ['sadoski1993'], 'A number counted as a kind of concreteness; the weights.'],
  ['concrete_thing', 'coping', 'concreteness', 'step', { full_at: 1 }, [0.15, 0.3],
    'Concrete things that can be pictured make a text easier to understand and more interesting.',
    ['sadoski1993', 'schraw1995'], 'Drawable or physical stands for concrete; the weights.'],
  ['unknown_words', 'coping', 'share_beyond_band', 'rising', { start_at: 0.05, full_at: 0.3 }, [-0.6, -0.3],
    'Words beyond the reader\'s vocabulary make a text hard to understand, and what cannot be understood is not interesting.',
    ['silvia2005', 'silvia2008', 'schraw1995'], 'Frequency bands stand for the vocabulary of the register; starts at 1 word in 20, full at 3 in 10; the weights.'],
  ['long_sentence', 'coping', 'words_over_max', 'rising', { start_at: 0, full_at: 10 }, [-0.25, -0.1],
    'A sentence longer than its register allows is harder to follow.',
    ['schraw1995'], 'Full at 10 words over the register\'s longest sentence; the weights.'],
  ['example_after_claim', 'coping', 'example_after_claim', 'step', { full_at: 1 }, [0.1, 0.2],
    'An example after a general statement makes it concrete and easier to understand.',
    ['sadoski1993', 'schraw1995'], 'The weights.'],
  ['on_topic', 'relevance', 'topic_distance', 'falling', { start_at: 0, full_at: 2 }, [0.4, 0.6],
    'A fact about the topic, or one join from it, bears on what the text is about.',
    ['sperber1986', 'hidi2006'], 'Full on the topic itself, none from 2 joins; the weights.'],
  ['off_topic', 'relevance', 'topic_distance', 'step', { full_at: 3 }, [-0.4, -0.3],
    'An interesting fact far from the topic distracts from the main ideas (a seductive detail).',
    ['garner1989'], 'From 3 joins away; the weights.'],
  ['personal', 'relevance', 'seen_in_session', 'step', { full_at: 1 }, [0.2, 0.4],
    'What the reader has just named or used is personally relevant.',
    ['hidi2006', 'schank1979'], 'The session\'s history stands for personal relevance; the weights.'],
  ['animate', 'relevance', 'animacy', 'step', { full_at: 1 }, [0.1, 0.2],
    'People and animals draw attention before other things.',
    ['new2007', 'schank1979', 'hidi1986'], 'The weights.'],
  ['repeated_fact', 'penalty', 'said_before', 'step', { full_at: 1 }, [1, 1],
    'Saying a fact again tells the reader nothing.',
    ['grice1975'], 'A penalty of 1: never chosen.'],
  ['repeated_pattern', 'penalty', 'same_move_run', 'rising', { start_at: 2, full_at: 4 }, [0.1, 0.25],
    'The same kind of sentence again and again habituates the reader.',
    ['berlyne1960'], 'Starts at the second sentence of one move and key in a row, full at the fourth; the weights.'],
  ['obvious', 'penalty', 'obviousness', 'step', { full_at: 1 }, [0.3, 0.5],
    'What the reader already assumes (a dog is an animal, grass is green) is not worth saying.',
    ['grice1975', 'davis1971'], 'Derived, nine in ten siblings, or one kind step stand for the obvious; the weights.'],
  ['list_without_point', 'penalty', 'items_without_point', 'rising', { start_at: 3, full_at: 6 }, [0.2, 0.4],
    'A run of facts with no comparison, contrast or conclusion has no point, and holds more than a reader keeps in mind.',
    ['labov1972', 'grice1975', 'cowan2001'], 'Starts after 3 facts (about what is held in mind at once), full at 6; the weights.'],
  ['no_point_at_end', 'penalty', 'ends_without_point', 'step', { full_at: 1 }, [0.1, 0.2],
    'A passage that does not end by saying why it matters leaves the reader asking "so what?".',
    ['labov1972'], 'The weights.'],
];

export function interestShards() {
  const sources = SOURCES.map(([name, cite, year, doi, finding]) => wire(`k.interest.source.${name}`, 'k.interest.source',
    [['name', name], ['cite', text(cite)], ['year', year], ['doi', doi ? text(doi) : undefined], ['finding', text(finding)]], SRC));
  const appraisals = APPRAISALS.map(([name, combine, base, about, src, own]) => wire(`k.interest.appraisal.${name}`, 'k.interest.appraisal',
    [['name', name], ['about', text(about)], ['combine', combine], ['base', base], ...src.map((s) => ['source', s]), ['own', text(own)]], SRC));
  const measures = MEASURES.map(([name, scope, reads, gives, about]) => wire(`k.interest.measure.${name}`, 'k.interest.measure',
    [['name', name], ['scope', scope], ...reads.map((r) => ['reads', r]), ['gives', text(gives)], ['about', text(about)]], SRC));
  const features = FEATURES.map(([name, appraisal, measure, shape, at, [lo, hi], about, src, own]) => wire(`k.interest.feature.${name}`, 'k.interest.feature',
    [['name', name], ['appraisal', appraisal], ['measure', measure], ['shape', shape], ['start_at', at.start_at], ['peak_at', at.peak_at], ['full_at', at.full_at],
      ['weight_min', lo], ['weight_max', hi], ['about', text(about)], ...src.map((s) => ['source', s]), ['own', text(own)]], SRC));
  const head = (id, about) => header({ id: `k.interest/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository: tools/interest-core.mjs; the works cited are in WORLD.md)'], license: 'CC0-1.0', script: 'tools/interest-core.mjs' });
  return {
    'sources.sop': `${head('sources', `the ${SOURCES.length} published works the features of interest rest on: reference, year, DOI where there is one, and what this world takes from each.`)}\n${sources.join('\n')}\n`,
    'features.sop': `${head('features', `${APPRAISALS.length} appraisals (novelty, coping, relevance, penalty), ${MEASURES.length} measures a program computes over facts and text, and ${FEATURES.length} features with weight ranges.`)}\n# Appraisals: score = novelty * coping * relevance - penalty, each held between 0 and 1.\n${appraisals.join('\n')}\n\n# Measures: what a program computes.\n${measures.join('\n')}\n\n# Features: weight * shape(measure), added to their appraisal.\n${features.join('\n')}\n`,
  };
}

// The reference arithmetic of the format (for tests and as the library's integration case): the share a shape gives,
// and the score of a set of measured values. `measured`: { measure name: number }; `pick(feature)` the weight to use
// (default: the middle of the range).
export function share(f, x) {
  const [s, p, e] = [f.start_at ?? 0, f.peak_at, f.full_at];
  if (f.shape === 'step') return x >= e ? 1 : 0;
  if (f.shape === 'rising') return x <= s ? 0 : x >= e ? 1 : (x - s) / (e - s);
  if (f.shape === 'falling') return x <= s ? 1 : x >= e ? 0 : 1 - (x - s) / (e - s);
  if (f.shape === 'peak') return x <= s || x >= e ? 0 : x <= p ? (x - s) / (p - s) : (e - x) / (e - p);
  throw new Error(`shape ${f.shape}`);
}
export function score(appraisals, features, measured, pick = (f) => (f.weight_min + f.weight_max) / 2) {
  const value = {}, parts = [];
  for (const a of appraisals) value[a.name] = a.base;
  for (const f of features) {
    if (!(f.measure in measured)) continue;
    const c = pick(f) * share(f, measured[f.measure]);
    if (c) { value[f.appraisal] += c; parts.push([f.name, c]); }
  }
  for (const k of Object.keys(value)) value[k] = Math.min(1, Math.max(0, value[k]));
  const product = appraisals.filter((a) => a.combine === 'multiply').reduce((p, a) => p * value[a.name], 1);
  const minus = appraisals.filter((a) => a.combine === 'subtract').reduce((p, a) => p + value[a.name], 0);
  return { score: product - minus, value, parts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.interest', 'shards'), interestShards());
  console.log(`${SOURCES.length} sources, ${APPRAISALS.length} appraisals, ${MEASURES.length} measures, ${FEATURES.length} features`);
}
