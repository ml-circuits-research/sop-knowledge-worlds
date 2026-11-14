# k.interest

What makes a fact, a link between facts, a sentence or a passage interesting to a reader, and what makes it dull, as
**features a program can measure** over the facts of the catalog and over the text being written, each with a
**weight range** and the published works its direction rests on. Hand-written (`hand-core 1`, CC0-1.0) by
`tools/interest-core.mjs`. Read by the library's composition and summary mechanisms (std.compose, std.summarize):
the choice points of a composition procedure (`k.procedures`) are sampled among the candidates their constraints
allow, **weighted by these scores**: "random but by the book", never free random. No language model is involved:
every measure is computed from facts.

## The format

| Type | Identity | Says |
| --- | --- | --- |
| `k.interest.source` | `name` (author and year: `silvia2005`) | `cite`, `year`, `doi` (where there is one), `finding` (what this world takes from it) |
| `k.interest.appraisal` | `name` | `combine` (`multiply` or `subtract`), `base` (its value when no feature applies), `about`, `source`, `own` |
| `k.interest.measure` | `name` | `scope` (fact, link, sentence, passage), `reads` (types of the catalog it reads), `gives` (what the number is), `about` (how to compute it) |
| `k.interest.feature` | `name` | `appraisal`, `measure`, `shape` (rising, falling, peak, step) with `start_at`, `peak_at`, `full_at`; `weight_min`, `weight_max`; `about`, `source`, `own` |

**The score.** A feature contributes `weight * share`, where the share runs from 0 to 1 by its shape: `rising` is 0 up
to `start_at`, 1 from `full_at`, a straight line between; `falling` the reverse; `peak` 0 at `start_at`, 1 at
`peak_at`, 0 again at `full_at`; `step` 1 from `full_at`. An appraisal is its base plus its features' contributions,
held between 0 and 1. The score is **novelty x coping x relevance - penalty**. The reference arithmetic is `share`
and `score` in `tools/interest-core.mjs` (a dozen lines), tested in `tests/k.interest.test.mjs`; the library computes
the measures (the functions are its own) and may take the middle of each weight range or draw inside it with a seed.

## What the features are (21) and where they come from

The structure is Silvia's (2005, 2008): interest is the product of a **novelty-complexity appraisal** (is it new,
complex, unexpected) and a **coping-potential appraisal** (can I understand it); neither alone is enough. To these
the world adds **relevance** (to the topic and to the reader) and **penalties** for dull text.

- **Novelty** (base 0): `distant_link` (a fact that links distant worlds of the catalog: Koestler's bisociation,
  Mednick's remote associations), `sibling_contrast` (a thing that does not do what most of its kind do: a bird that
  cannot fly; Davis 1971: the interesting denies an assumption; Schank 1979; Iran-Nejad 1987; Kintsch 1980),
  `rule_exception` (it breaks a common-sense rule of `k.commonsense`), `far_number` (a number far outside the typical
  range of its kind: surprise as a departure from expectation, Itti and Baldi 2009; Berlyne 1960), `extreme` (the
  largest, fastest of its kind: peculiarity, Geng and Hamilton 2006), `rare_kind` (a rarely met thing: novelty,
  Berlyne), `opens_question` (a question the text can answer, most interesting when part of the answer is known: the
  information gap, Loewenstein 1994, and the inverted U of curiosity over confidence, Kang et al. 2009).
- **Coping** (base 0.7): `concrete_thing` (concreteness was the strongest predictor of comprehensibility and interest,
  Sadoski, Goetz and Fritz 1993; vividness, Schraw et al. 1995), `number_given` (a number with its unit makes a claim concrete), `unknown_words` and `long_sentence` (ease of
  comprehension, Schraw et al. 1995; what cannot be understood is not interesting, Silvia 2008), `example_after_claim`.
- **Relevance** (base 0.4): `on_topic` (relevance as effect for effort, Sperber and Wilson 1986; meaningfulness holds
  situational interest, Hidi and Renninger 2006), `off_topic` (interesting but off the point lowers what readers take
  from the main ideas: seductive details, Garner et al. 1989), `personal` (what the reader has just used: Hidi and
  Renninger; Schank), `animate` (people and animals draw attention first, New, Cosmides and Tooby 2007; character
  identification, Hidi and Baird 1986).
- **Penalty** (subtracted): `repeated_fact` (1: never chosen; Grice's quantity), `repeated_pattern` (habituation,
  Berlyne), `obvious` (what the reader already assumes: Grice; Davis), `list_without_point` (facts with no comparison
  or conclusion: Labov's evaluation, the answer to "so what?"; Grice's relation; about four items held in mind,
  Cowan 2001), `no_point_at_end` (Labov).

**Own choices** (said on every fact by `own`): every number (weights, bases, where a shape starts and ends); which
facts of the catalog stand for a reader's assumptions (what most siblings do, the soft rules of k.commonsense, what a
rule derives); the frequency of a word standing for how familiar a thing is; joins of the catalog as the distance
between worlds; the share of an answer already given standing for confidence. The relative order of the weights
follows the sources where they compare (concreteness strongest among text features in Sadoski et al.; contrast with
an assumption as the core of "interesting" in Davis); elsewhere it is a choice.

## Sources

- Berlyne, D. E. (1960). *Conflict, Arousal, and Curiosity*. McGraw-Hill.
- Cowan, N. (2001). The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24(1), 87-114.
- Davis, M. S. (1971). That's interesting! Towards a phenomenology of sociology and a sociology of phenomenology.
  *Philosophy of the Social Sciences*, 1(4), 309-344.
- Garner, R., Gillingham, M. G., & White, C. S. (1989). Effects of "seductive details" on macroprocessing and
  microprocessing in adults and children. *Cognition and Instruction*, 6(1), 41-57.
- Geng, L., & Hamilton, H. J. (2006). Interestingness measures for data mining: A survey. *ACM Computing Surveys*, 38(3).
- Grice, H. P. (1975). Logic and conversation. In P. Cole & J. L. Morgan (Eds.), *Syntax and Semantics 3*. Academic Press.
- Hidi, S., & Baird, W. (1986). Interestingness - a neglected variable in discourse processing. *Cognitive Science*, 10(2), 179-194.
- Hidi, S., & Renninger, K. A. (2006). The four-phase model of interest development. *Educational Psychologist*, 41(2), 111-127.
- Iran-Nejad, A. (1987). Cognitive and affective causes of interest and liking. *Journal of Educational Psychology*, 79(2), 120-130.
- Itti, L., & Baldi, P. (2009). Bayesian surprise attracts human attention. *Vision Research*, 49(10), 1295-1306.
- Kang, M. J., et al. (2009). The wick in the candle of learning. *Psychological Science*, 20(8), 963-973.
- Kintsch, W. (1980). Learning from text, levels of comprehension, or: Why anyone would read a story anyway. *Poetics*, 9, 87-98.
- Koestler, A. (1964). *The Act of Creation*. Hutchinson.
- Labov, W. (1972). The transformation of experience in narrative syntax. In *Language in the Inner City*. University of Pennsylvania Press.
- Loewenstein, G. (1994). The psychology of curiosity: A review and reinterpretation. *Psychological Bulletin*, 116(1), 75-98.
- Mednick, S. A. (1962). The associative basis of the creative process. *Psychological Review*, 69(3), 220-232.
- New, J., Cosmides, L., & Tooby, J. (2007). Category-specific attention for animals reflects ancestral priorities,
  not expertise. *PNAS*, 104(42), 16598-16603.
- Sadoski, M., Goetz, E. T., & Fritz, J. B. (1993). Impact of concreteness on comprehensibility, interest, and memory
  for text. *Journal of Educational Psychology*, 85(2), 291-304.
- Schank, R. C. (1979). Interestingness: Controlling inferences. *Artificial Intelligence*, 12(3), 273-297.
- Schraw, G., Bruning, R., & Svoboda, C. (1995). Sources of situational interest. *Journal of Reading Behavior*, 27(1), 1-17.
- Silvia, P. J. (2005). What is interesting? Exploring the appraisal structure of interest. *Emotion*, 5(1), 89-102.
- Silvia, P. J. (2008). Interest - the curious emotion. *Current Directions in Psychological Science*, 17(1), 57-60.
- Sperber, D., & Wilson, D. (1986). *Relevance: Communication and Cognition*. Blackwell.

Only the findings are used (one sentence each in `k.interest.source.finding`); no text or data of these works is
copied.

## Integration cases (`tests/k.interest.test.mjs`)

The test measures facts of the catalog with the reference arithmetic and checks the order a composer must find:
"a penguin cannot fly" (k.animals: 4 in 5 of the birds that say it can fly) scores above "an elephant weighs about
5,000 kg" (k.attributes: far above the typical range of animal weights), which scores above "a dog is a mammal"
(obvious: one kind step), which scores at most 0 once said; a fact said twice is never chosen. Each score is
explained by feature.

## Known limits

- The measures are the library's to compute; until it does, `known_share`, `seen_in_session` and the passage measures
  read the text being written (`w.document`) and the host's history, which this repository cannot hold.
- The typical range of a number is the interquartile range of its kind's numbers in k.attributes (published as facts
  with block "15:15" item 3); the numbers themselves are model-labelled (`named=model`), so a far number is far from
  the catalog's usual, not from a measured population.
