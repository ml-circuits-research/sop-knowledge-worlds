// k.story (block "15:00" item 2): how a story is built: its elements, the kinds of goals, the obstacles that block
// them (as joins to things of k.scenes / k.objects and acts of k.actions), and the constraints between the elements.
//   node tools/story-core.mjs     writes docs/worlds/k.story/shards/*.sop
// The elements and the constraints are the sources' (Propp, the story grammars, Freytag, Labov and Waletzky, Olrik,
// Chekhov); which acts get past which obstacle and which are tried and fail are this repository's own reading of
// k.actions (each fact says so in `own`). Characters, places and things are names of other worlds, never new lists.
// Also here: the reference reading (for tests and as the library's integration case): `storyKb` gathers the facts a
// story plan reads, `storyPlans` enumerates every plan that holds the hard constraints, `checkPlan` checks one plan
// against every constraint from the facts alone.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { parse } from './sopworld/sopworld.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';

// name, cite, year, doi, finding
export const SOURCES = [
  ['aristotle', 'Aristotle (c. 335 BCE). Poetics, chapters 7 and 10-11. Translated by S. H. Butcher (1895) as The Poetics of Aristotle. London: Macmillan.', -335, '',
    'A plot is a whole with a beginning, a middle and an end, its events joined by necessity or probability; the best plots turn by a reversal (peripeteia) that follows from what came before.'],
  ['propp1968', 'Propp, V. (1968). Morphology of the Folktale (2nd ed., L. Scott, Trans.; L. A. Wagner, Ed.). Austin: University of Texas Press. (Original work published 1928.)', 1968, '',
    'Wonder tales are built of at most 31 functions in a fixed order (a lack or a villainy, the departure, the donor who tests the hero and provides a magical agent, the struggle, the liquidation of the lack, the return) carried by seven kinds of characters (hero, villain, donor, helper, sought-for person, dispatcher, false hero).'],
  ['rumelhart1975', 'Rumelhart, D. E. (1975). Notes on a schema for stories. In D. G. Bobrow & A. Collins (Eds.), Representation and Understanding: Studies in Cognitive Science (pp. 211-236). New York: Academic Press.', 1975, '',
    'A story is a setting and an episode; an episode is an event and the reaction to it, the reaction an internal response (a goal) and the overt attempts to reach it, joined by causal and enabling links.'],
  ['mandlerJohnson1977', 'Mandler, J. M., & Johnson, N. S. (1977). Remembrance of things parsed: Story structure and recall. Cognitive Psychology, 9(1), 111-151.', 1977, '10.1016/0010-0285(77)90006-8',
    'A story is a setting and episodes; an episode is a beginning, a development (a reaction, a goal path of attempt and outcome) and an ending; stories in this structure are recalled best.'],
  ['steinGlenn1979', 'Stein, N. L., & Glenn, C. G. (1979). An analysis of story comprehension in elementary school children. In R. O. Freedle (Ed.), New Directions in Discourse Processing (pp. 53-120). Norwood, NJ: Ablex.', 1979, '',
    'An episode is an initiating event, an internal response (the protagonist\'s goal), an attempt, a consequence and a reaction, after a setting that introduces the protagonist.'],
  ['thorndyke1977', 'Thorndyke, P. W. (1977). Cognitive structures in comprehension and memory of narrative discourse. Cognitive Psychology, 9(1), 77-110.', 1977, '',
    'A story is a setting, a theme (the goal), a plot of episodes (subgoal, attempts, outcome) and a resolution; texts that keep this structure are understood and recalled better.'],
  ['trabasso1985', 'Trabasso, T., & van den Broek, P. (1985). Causal thinking and the representation of narrative events. Journal of Memory and Language, 24(5), 612-630.', 1985, '',
    'Events of a story that lie on its causal chain from the goal to the outcome are recalled and judged important; events with no causal links are dead ends.'],
  ['freytag1863', 'Freytag, G. (1863). Die Technik des Dramas. Leipzig: S. Hirzel. Translated by E. J. MacEwan (1895) as Technique of the Drama. Chicago: S. C. Griggs.', 1863, '',
    'A drama rises and falls in five parts: introduction (exposition), rising action, climax, falling action (return), and catastrophe (the outcome).'],
  ['field1979', 'Field, S. (1979). Screenplay: The Foundations of Screenwriting. New York: Dell.', 1979, '',
    'A story is told in three acts (set-up, confrontation, resolution) divided by plot points that turn the action in a new direction.'],
  ['labovWaletzky1967', 'Labov, W., & Waletzky, J. (1967). Narrative analysis: Oral versions of personal experience. In J. Helm (Ed.), Essays on the Verbal and Visual Arts (pp. 12-44). Seattle: University of Washington Press.', 1967, '',
    'A narrative has an orientation (who, where, when), a complication, an evaluation, a resolution and a coda that returns to the present.'],
  ['olrik1909', 'Olrik, A. (1909). Epische Gesetze der Volksdichtung. Zeitschrift fur deutsches Altertum und deutsche Literatur, 51, 1-12. Translated as Epic laws of folk narrative, in A. Dundes (Ed.) (1965), The Study of Folklore (pp. 129-141). Englewood Cliffs, NJ: Prentice-Hall.', 1909, '',
    'Folk narrative follows epic laws: the law of three (three tries, three brothers, the last succeeding), two to a scene, contrast, and a single strand of action.'],
  ['chekhov1889', 'Chekhov, A. P. (1889). Letter to A. S. Lazarev (Gruzinsky), 1 November 1889. In Letters of Anton Chekhov (1973, M. H. Heim & S. Karlinsky, Trans.). New York: Harper & Row.', 1889, '',
    'Nothing should be put on the stage that is not used: a gun shown in the first act must be fired later (set-up and pay-off).'],
];

// name, n, [min, max], part, move, fills, propp, grammar, arc, about, sources, own
export const ELEMENTS = [
  ['setting', 1, [1, 1], 'orientation', 'set the scene', ['k.scenes.scene'], 'initial situation', 'setting (Rumelhart; Mandler and Johnson; Stein and Glenn; Thorndyke)', 'exposition',
    'Where the story happens: a scene of k.scenes, with the things it has (one of them is the obstacle).', ['propp1968', 'mandlerJohnson1977', 'steinGlenn1979', 'labovWaletzky1967', 'freytag1863']],
  ['protagonist', 2, [1, 1], 'orientation', 'introduce character', ['k.people.kind', 'k.people.role', 'k.animals.animal'], 'the hero', 'protagonist, introduced in the setting (Stein and Glenn)', 'exposition',
    'Who the story is about: a person, a person of a role or an animal, who wants something and lacks what it takes.', ['propp1968', 'steinGlenn1979', 'labovWaletzky1967']],
  ['goal', 3, [1, 1], 'orientation', 'state goal', ['k.story.goal'], 'lack (VIIIa) or villainy (VIII)', 'goal: internal response (Stein and Glenn), theme (Thorndyke)', 'exposition',
    'What the protagonist wants or must do: a kind of goal of k.story, reached by an act of k.actions.', ['propp1968', 'steinGlenn1979', 'thorndyke1977', 'rumelhart1975']],
  ['target', 4, [1, 1], 'orientation', 'state goal', ['k.scenes.scene', 'k.objects.object', 'k.people.kind', 'k.people.role', 'k.animals.animal'], 'the sought-for person or object', 'the object of the goal', 'exposition',
    'What the goal is about: the place to reach, the thing to find, the one to rescue or visit.', ['propp1968']],
  ['obstacle', 5, [1, 1], 'complication', 'complicate', ['k.story.obstacle'], 'struggle (XVI) or difficult task (XXV)', 'initiating event; the complication of the episode', 'rising action',
    'What stands in the way of the goal: a thing of the setting as it blocks that kind of goal.', ['propp1968', 'labovWaletzky1967', 'freytag1863', 'steinGlenn1979']],
  ['attempt', 6, [0, 3], 'complication', 'attempt', ['k.actions.action'], 'the hero\'s reaction to the test (XIII)', 'attempt and outcome (Mandler and Johnson; Stein and Glenn)', 'rising action',
    'A try that fails: an act the protagonist can do that does not get past the obstacle. At most three, each a different act; a story may have none.', ['mandlerJohnson1977', 'steinGlenn1979', 'olrik1909'], 'At most three attempts, after Olrik\'s law of three; each a different act. Optional: 23 of the 33 public-domain tales with a plot in sources/story-check have failed attempts (never more than three).'],
  ['helper', 7, [0, 1], 'complication', 'introduce character', ['k.people.role'], 'the donor (XII) or the helper', 'a new character of the development', 'rising action',
    'Who has what is missing: a person of a role who holds or uses the means. Brought in before the turning point. A story may have none (the protagonist then gets past the obstacle alone or fails).', ['propp1968'], 'Optional: a helper in 13 of the 33 public-domain tales with a plot in sources/story-check (12 of the 15 Grimm tales, 1 of the 19 Aesop fables); where there is one, it has what is missing in 12 of 13. The procedure "write a story" writes the helper tale.'],
  ['means', 8, [0, 1], 'climax', 'turning point', ['k.objects.object'], 'the magical agent (XIV)', 'the enabling condition of the outcome (Rumelhart)', 'climax',
    'What is missing: the thing that lets the overcoming act be done (a tool of that act in k.actions). The helper has it; the protagonist lacks it.', ['propp1968', 'rumelhart1975']],
  ['turning point', 9, [0, 1], 'climax', 'turning point', ['k.actions.action'], 'provision or receipt of the magical agent (XIV)', 'the outcome that changes the goal path', 'climax',
    'The moment the story turns: the helper gives the protagonist the means (the act give of k.actions).', ['propp1968', 'freytag1863', 'field1979', 'aristotle']],
  ['resolution', 10, [0, 1], 'resolution', 'resolve', ['k.actions.action'], 'victory (XVIII), liquidation of the lack (XIX)', 'outcome (Mandler and Johnson), resolution (Thorndyke)', 'falling action',
    'The obstacle overcome: the protagonist does an act that gets past it, with the means set up earlier. A story may end without one (a fable that warns).', ['propp1968', 'mandlerJohnson1977', 'thorndyke1977', 'labovWaletzky1967', 'chekhov1889', 'trabasso1985'], 'Optional: 19 of the 33 public-domain tales with a plot in sources/story-check overcome the obstacle; 13 of those 19 with something set up earlier.'],
  ['ending', 11, [1, 1], 'ending', 'end', ['k.story.goal'], 'return (XX); the wedding or reward (XXXI)', 'ending (Mandler and Johnson); reaction (Stein and Glenn)', 'outcome',
    'The goal reached: the protagonist at the target, with what it has found or saved; what it felt or learnt.', ['propp1968', 'mandlerJohnson1977', 'steinGlenn1979', 'labovWaletzky1967']],
];

// name, act, target, place_kind, propp, about, sources, own
export const GOALS = [
  ['reach a place', 'go', 'place', 'outdoors', 'spatial transference (XV); departure (XI)', 'Get to another place (an outdoor scene of k.scenes, not the setting).', ['propp1968', 'steinGlenn1979'], 'Places to reach are the outdoor scenes.'],
  ['find a thing', 'find', 'thing', '', 'lack (VIIIa) and its liquidation (XIX)', 'Find a thing that is lost or hidden (an object of the act find).', ['propp1968', 'steinGlenn1979']],
  ['rescue someone', 'help', 'being', '', 'villainy by abduction (VIII) and rescue (XXII)', 'Help someone who is in trouble (an object of the act help).', ['propp1968'], 'Rescue as the act help of k.actions (k.actions has no act rescue).'],
  ['visit someone', 'visit', 'being', '', 'departure (XI) with a task', 'Go to see someone (an object of the act visit), as in a tale of a visit to a grandmother.', ['propp1968'], 'A visit as a goal is this repository\'s choice (Propp\'s hero departs on a task).'],
];

// thing, blocks, how, overcome_by, means, tried_by, about
// All own: which acts of k.actions get past an obstacle, with which of their tools, and which are tried and fail.
export const OBSTACLES = [
  ['river', 'reach a place', 'between', ['row', 'sail', 'build'], ['rowing boat', 'sailboat', 'hammer'], ['jump', 'wait', 'shout'], 'A river lies between the protagonist and the place: it is rowed or sailed across, or bridged.'],
  ['river', 'visit someone', 'between', ['row', 'sail', 'build'], ['rowing boat', 'sailboat', 'hammer'], ['jump', 'wait', 'shout'], 'A river lies between the protagonist and the one to visit.'],
  ['river', 'find a thing', 'between', ['row', 'sail', 'build'], ['rowing boat', 'sailboat', 'hammer'], ['jump', 'wait', 'shout'], 'The thing is on the other side of a river.'],
  ['sea', 'reach a place', 'between', ['sail'], ['sailboat'], ['swim', 'wait', 'shout'], 'The sea lies between the protagonist and the place: it is sailed across.'],
  ['sea', 'find a thing', 'between', ['sail'], ['sailboat'], ['swim', 'wait', 'shout'], 'The thing is across the sea (a treasure on an island).'],
  ['mountain', 'reach a place', 'between', ['climb'], ['rope', 'ladder'], ['walk', 'jump', 'wait'], 'A mountain lies between the protagonist and the place: it is climbed with a rope or a ladder.'],
  ['mountain', 'find a thing', 'holds', ['climb'], ['rope', 'ladder'], ['walk', 'jump', 'shout'], 'The thing is up on the mountain.'],
  ['tree', 'rescue someone', 'holds', ['climb'], ['ladder', 'rope'], ['jump', 'shout', 'wait'], 'The one to rescue is up in a tree: it is climbed with a ladder or a rope.'],
  ['tree', 'find a thing', 'holds', ['climb'], ['ladder', 'rope'], ['jump', 'shout', 'wait'], 'The thing is caught up in a tree.'],
  ['tree', 'reach a place', 'across', ['cut'], ['saw'], ['push', 'pull', 'jump'], 'A fallen tree lies across the way: it is cut with a saw.'],
  ['tree', 'visit someone', 'across', ['cut'], ['saw'], ['push', 'pull', 'jump'], 'A fallen tree lies across the way to the one to visit.'],
  ['dragon', 'rescue someone', 'guards', ['fight'], ['sword', 'shield'], ['shout', 'hide', 'run'], 'A dragon guards the one to rescue: it is fought with a sword and a shield.'],
  ['dragon', 'find a thing', 'guards', ['fight'], ['sword', 'shield'], ['shout', 'hide', 'run'], 'A dragon guards the thing.'],
  ['fence', 'reach a place', 'across', ['climb'], ['ladder'], ['push', 'pull', 'jump'], 'A fence stands across the way: it is climbed with a ladder.'],
  ['wall', 'reach a place', 'across', ['climb'], ['ladder', 'rope'], ['push', 'jump', 'shout'], 'A wall stands across the way: it is climbed with a ladder or a rope.'],
  ['wall', 'rescue someone', 'between', ['climb'], ['ladder', 'rope'], ['shout', 'push', 'jump'], 'The one to rescue is behind a wall.'],
];
const OBSTACLE_OWN = 'Which acts of k.actions get past it, with which of their tools, and which acts are tried and fail.';

// name, element, relation, other, strength, about, sources, own
export const CONSTRAINTS = [
  ['protagonist can reach the goal', 'protagonist', 'can', 'goal', 'hard', 'The protagonist is one of the `who` of the goal\'s act in k.actions (a girl is a person; a dog is a dog), so it can have that goal.', ['steinGlenn1979', 'rumelhart1975'], 'The goal\'s act and its `who` in k.actions stand for "a protagonist of a kind that can have the goal".'],
  ['target fits the goal', 'target', 'fits', 'goal', 'hard', 'The target is one of the objects of the goal\'s act (find a key; visit a grandmother), or, for a place, a scene of the goal\'s kind other than the setting.', ['propp1968'], 'The objects of the act in k.actions stand for what the goal can be about.'],
  ['target differs from the setting', 'target', 'differs', 'setting', 'hard', 'A place to reach is another place than where the story starts.', ['propp1968']],
  ['obstacle blocks the goal', 'obstacle', 'blocks', 'goal', 'hard', 'The obstacle is a k.story.obstacle fact for that kind of goal.', ['propp1968', 'labovWaletzky1967', 'steinGlenn1979', 'trabasso1985']],
  ['setting has the obstacle', 'obstacle', 'in', 'setting', 'hard', 'The obstacle\'s thing is one of the things the setting has in k.scenes (a river scene has a river; a castle a dragon).', ['labovWaletzky1967', 'trabasso1985'], 'k.scenes.has stands for what is in a setting.'],
  ['means overcomes the obstacle', 'means', 'overcomes', 'obstacle', 'hard', 'The means is one of the obstacle\'s means: a tool of one of the acts that get past it.', ['rumelhart1975', 'trabasso1985']],
  ['protagonist lacks the means', 'protagonist', 'lacks', 'means', 'hard', 'The protagonist neither holds nor uses the means (a person of a role says what it holds and uses; a person or an animal of no role has nothing), so it cannot get past the obstacle alone.', ['propp1968'], 'k.people.role holds and uses stand for what a character has.'],
  ['helper has the means', 'helper', 'has', 'means', 'hard', 'The helper holds or uses the means (a sailor uses a sailboat; a firefighter a ladder; a knight holds a sword).', ['propp1968']],
  ['helper differs from the protagonist', 'helper', 'differs', 'protagonist', 'hard', 'The helper is another character.', ['propp1968']],
  ['target differs from the characters', 'target', 'differs', 'protagonist', 'hard', 'The one to rescue or visit is neither the protagonist nor the helper.', ['propp1968']],
  ['protagonist can make the attempts', 'protagonist', 'can', 'attempt', 'hard', 'Each attempt is an act whose `who` includes the protagonist.', ['steinGlenn1979']],
  ['attempts fail', 'attempt', 'fails', 'obstacle', 'hard', 'Each attempt is one of the obstacle\'s tried_by acts, a different one each time; none of them gets past it.', ['mandlerJohnson1977', 'steinGlenn1979', 'olrik1909']],
  ['helper comes before the turning point', 'helper', 'before', 'turning point', 'hard', 'The helper, and with it the means, is brought in before the turning point uses it (set-up before pay-off).', ['chekhov1889', 'propp1968', 'field1979']],
  ['turning point gives the means', 'turning point', 'gives', 'means', 'hard', 'At the turning point the helper gives the protagonist the means (the act give).', ['propp1968', 'aristotle']],
  ['protagonist can overcome with the means', 'protagonist', 'can', 'resolution', 'hard', 'The resolution\'s act is one the protagonist can do (its `who`).', ['steinGlenn1979']],
  ['resolution uses the means', 'resolution', 'uses', 'means', 'hard', 'The resolution is an act of the obstacle\'s overcome_by that has the means as its tool: what was set up earlier is what solves the problem.', ['chekhov1889', 'trabasso1985', 'propp1968']],
  ['means comes before the resolution', 'means', 'before', 'resolution', 'hard', 'The means is told before the resolution uses it.', ['chekhov1889']],
  ['ending reaches the goal', 'ending', 'reaches', 'goal', 'soft', 'Preferred: the ending tells the goal reached: the protagonist at the target, with it, or with the one saved.', ['mandlerJohnson1977', 'labovWaletzky1967', 'propp1968'], 'Soft: the goal is reached in 17 of the 33 public-domain tales with a plot in sources/story-check (the fables end in failure); a composer prefers it.'],
  ['protagonist belongs in the setting', 'protagonist', 'belongs', 'setting', 'soft', 'Preferred: the protagonist works at the setting (k.people.role works_at) or is a thing the setting has (a fox in the forest).', ['labovWaletzky1967'], 'Soft: a person of no role belongs anywhere; a composer weights the others.'],
  ['helper belongs in the setting', 'helper', 'belongs', 'setting', 'soft', 'Preferred: the helper works at the setting or is a thing the setting has (a knight at the castle; a sailor at the harbour).', ['labovWaletzky1967'], 'Soft.'],
  ['target in the setting', 'target', 'in', 'setting', 'soft', 'Preferred, for a thing or a being: the setting has it (a treasure chest on the island).', ['chekhov1889'], 'Soft.'],
];

export function storyShards() {
  const head = (id, about) => header({ id: `k.story/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository: tools/story-core.mjs; the works cited are in WORLD.md)'], license: 'CC0-1.0', script: 'tools/story-core.mjs' });
  const many = (k, vs) => vs.map((v) => [k, v]);
  const sources = SOURCES.map(([name, cite, year, doi, finding]) => wire(`k.story.source.${name}`, 'k.story.source',
    [['name', name], ['cite', text(cite)], ['year', year], ['doi', doi ? text(doi) : undefined], ['finding', text(finding)]], SRC));
  const elements = ELEMENTS.map(([name, n, [min, max], part, move, fills, propp, grammar, arc, about, src, own]) => wire(`k.story.element.${seg(name)}`, 'k.story.element',
    [['name', name], ['n', n], ['min', min], ['max', max], ['part', part], ['move', move], ...many('fills', fills), ['propp', text(propp)], ['grammar', text(grammar)], ['arc', text(arc)], ['about', text(about)], ...many('source', src), ['own', own ? text(own) : undefined]], SRC));
  const goals = GOALS.map(([name, act, target, kind, propp, about, src, own]) => wire(`k.story.goal.${seg(name)}`, 'k.story.goal',
    [['name', name], ['act', act], ['target', target], ['place_kind', kind || undefined], ['propp', text(propp)], ['about', text(about)], ...many('source', src), ['own', own ? text(own) : undefined]], SRC));
  const obstacles = OBSTACLES.map(([thing, blocks, how, over, means, tried, about]) => wire(`k.story.obstacle.${seg(thing)}.${seg(blocks)}`, 'k.story.obstacle',
    [['thing', thing], ['blocks', blocks], ['how', how], ...many('overcome_by', over), ...many('means', means), ...many('tried_by', tried), ['about', text(about)], ['own', text(OBSTACLE_OWN)]], SRC));
  const constraints = CONSTRAINTS.map(([name, element, relation, other, strength, about, src, own]) => wire(`k.story.constraint.${seg(name)}`, 'k.story.constraint',
    [['name', name], ['element', element], ['relation', relation], ['other', other], ['strength', strength], ['about', text(about.replace(/`/g, ''))], ...many('source', src), ['own', own ? text(own) : undefined]], SRC));
  return {
    'sources.sop': `${head('sources', `the ${SOURCES.length} published works the story structure rests on: reference, year, DOI where sure, and what this world takes from each.`)}\n${sources.join('\n')}\n`,
    'structure.sop': `${head('structure', `the ${ELEMENTS.length} elements of a story in the order they are told, and the ${CONSTRAINTS.length} constraints between them (${CONSTRAINTS.filter((c) => c[4] === 'hard').length} hard, ${CONSTRAINTS.filter((c) => c[4] === 'soft').length} soft).`)}\n# Elements.\n${elements.join('\n')}\n\n# Constraints.\n${constraints.join('\n')}\n`,
    'goals-obstacles.sop': `${head('goals-obstacles', `${GOALS.length} kinds of goals (each reached by an act of k.actions) and ${OBSTACLES.length} obstacles (a thing of k.scenes as it blocks one kind of goal, the acts that get past it with their tools, the acts tried in vain).`)}\n# Goals.\n${goals.join('\n')}\n\n# Obstacles.\n${obstacles.join('\n')}\n`,
  };
}

// ---- The reference reading ----

const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const vals = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => vals(w, k)[0];

// The facts a story plan reads, from the catalog (scanWorlds()).
// The wires of one type in the shards of one world, read by the parser alone (lines that name the type), so that
// a story plan does not load the 100,000 facts of the drawings to know the names of the objects.
export function wiresOf(worlds, id, type) {
  const w = worlds.find((x) => x.id === id);
  if (!w) return [];
  const lines = w.shards.flatMap((s) => s.text.split('\n').filter((l) => l.startsWith('@') && l.includes(` ${type} `)));
  const out = new Map(); // merged by the name (a fact told in two shards is one; keys of both)
  for (const x of parse(lines.join('\n')).filter((y) => y.type === type)) {
    const key = x.attrs.name ? x.attrs.name[0] : JSON.stringify(x.attrs);
    const f = out.get(key);
    if (!f) { out.set(key, { attrs: { ...x.attrs } }); continue; }
    for (const [k, vs] of Object.entries(x.attrs)) f.attrs[k] = [...new Set([...(f.attrs[k] ?? []), ...vs])];
  }
  return [...out.values()];
}

export function storyKb(worlds) {
  const of = (id, type) => wiresOf(worlds, id, type);
  const story = { goal: of('k.story', 'k.story.goal').map((w) => ({ name: one(w, 'name'), act: one(w, 'act'), target: one(w, 'target'), place_kind: one(w, 'place_kind') })),
    obstacle: of('k.story', 'k.story.obstacle').map((w) => ({ thing: one(w, 'thing'), blocks: one(w, 'blocks'), how: one(w, 'how'), overcome_by: vals(w, 'overcome_by'), means: vals(w, 'means'), tried_by: vals(w, 'tried_by') })) };
  const scenes = of('k.scenes', 'k.scenes.scene').map((w) => ({ name: one(w, 'name'), kind: one(w, 'kind') }));
  const has = new Map();
  for (const w of of('k.scenes', 'k.scenes.has')) { const s = one(w, 'scene'); if (!has.has(s)) has.set(s, new Set()); has.get(s).add(one(w, 'thing')); }
  const actions = new Map(of('k.actions', 'k.actions.action').map((w) => [one(w, 'name'), { name: one(w, 'name'), who: vals(w, 'who'), object: vals(w, 'object'), tool: vals(w, 'tool') }]));
  const roles = of('k.people', 'k.people.role').filter((w) => w.attrs.group).map((w) => ({ name: one(w, 'name'), type: 'k.people.role', up: [...vals(w, 'is'), ...vals(w, 'is_a')], holds: vals(w, 'holds'), uses: vals(w, 'uses'), works_at: vals(w, 'works_at') }));
  const kinds = of('k.people', 'k.people.kind').map((w) => ({ name: one(w, 'name'), type: 'k.people.kind', up: vals(w, 'is_a'), holds: [], uses: [], works_at: [] }));
  const animals = of('k.animals', 'k.animals.animal').map((w) => ({ name: one(w, 'name'), type: 'k.animals.animal', up: [one(w, 'class'), 'animal'].filter(Boolean), holds: [], uses: [], works_at: [] }));
  const objects = new Set(of('k.objects', 'k.objects.object').map((w) => one(w, 'name')));
  return { story, scenes, has, actions, roles, kinds, animals, objects };
}

// The chain of kinds of a character, by name: itself, then up through is / is_a of people kinds and roles.
const chains = new WeakMap(); // kb -> Map(name -> chain)
function chainOf(kb, ch) {
  if (!chains.has(kb)) chains.set(kb, new Map());
  const memo = chains.get(kb);
  if (memo.has(ch.name)) return memo.get(ch.name);
  const kindsBy = new Map(kb.kinds.map((k) => [k.name, k]));
  const out = new Set([ch.name]), todo = [...ch.up];
  while (todo.length) { const n = todo.pop(); if (out.has(n)) continue; out.add(n); for (const p of kindsBy.get(n)?.up ?? []) todo.push(p); }
  memo.set(ch.name, out);
  return out;
}
const canDo = (kb, ch, act) => { const a = kb.actions.get(act); if (!a) return false; const c = chainOf(kb, ch); return a.who.some((w) => c.has(w)); };
const hasThing = (ch, t) => ch.holds.includes(t) || ch.uses.includes(t);
const belongs = (kb, ch, setting) => ch.works_at.includes(setting) || (kb.has.get(setting)?.has(ch.name) ?? false);
// A name resolves when some world of the catalog has a fact of that name a story can draw or tell.
// A target of a goal of `target` thing is a k.objects object; of `being`, a person kind, a role or an animal.
const isBeing = (kb, name) => kb.roles.some((r) => r.name === name) || kb.kinds.some((k) => k.name === name) || kb.animals.some((a) => a.name === name);
const resolves = (kb, name, target) => (target === 'thing' ? kb.objects.has(name) : target === 'being' ? isBeing(kb, name) : kb.scenes.some((s) => s.name === name));

// Every plan that holds the hard constraints, as tuples without the attempts (they are any 1 to 3 different acts
// of the obstacle's tried_by that the protagonist can do). `each(plan)` is called per plan; returns the count.
export function storyPlans(kb, each = () => {}) {
  const characters = [...kb.kinds, ...kb.roles, ...kb.animals];
  let count = 0;
  for (const goal of kb.story.goal) {
    const act = kb.actions.get(goal.act);
    const targets = goal.target === 'place' ? kb.scenes.filter((s) => s.kind === goal.place_kind).map((s) => s.name) : act.object.filter((o) => resolves(kb, o, goal.target));
    for (const ob of kb.story.obstacle.filter((o) => o.blocks === goal.name)) {
      for (const setting of kb.scenes.filter((s) => kb.has.get(s.name)?.has(ob.thing)).map((s) => s.name)) {
        for (const resolution of ob.overcome_by) {
          for (const means of ob.means.filter((m) => kb.actions.get(resolution)?.tool.includes(m))) {
            const helpers = kb.roles.filter((r) => hasThing(r, means));
            for (const protagonist of characters) {
              if (!canDo(kb, protagonist, goal.act) || !canDo(kb, protagonist, resolution) || hasThing(protagonist, means)) continue;
              const tries = ob.tried_by.filter((t) => canDo(kb, protagonist, t)); // none: a story without attempts
              for (const helper of helpers) {
                if (helper.name === protagonist.name) continue;
                for (const target of targets) {
                  if (target === setting || target === protagonist.name || target === helper.name) continue;
                  count += 1;
                  each({ setting, protagonist: protagonist.name, protagonist_type: protagonist.type, goal: goal.name, target, obstacle: ob.thing, helper: helper.name, means, turning_point: 'give', resolution, tries, ending: goal.name });
                }
              }
            }
          }
        }
      }
    }
  }
  return count;
}

// Checks one plan ({ setting, protagonist, goal, target, obstacle, attempts: [acts], helper, means, turning_point,
// resolution, ending, order: [element names in the order told] }) against every constraint of k.story, from the
// facts alone. Returns { hard: [names of the hard constraints it breaks], soft: [names of the soft ones it holds] }.
export function checkPlan(kb, constraints, p) {
  const ch = (name) => [...kb.kinds, ...kb.roles, ...kb.animals].find((c) => c.name === name);
  const goal = kb.story.goal.find((g) => g.name === p.goal);
  const ob = kb.story.obstacle.find((o) => o.thing === p.obstacle && o.blocks === p.goal);
  const P = ch(p.protagonist), H = ch(p.helper);
  const at = (e) => p.order.indexOf(e);
  const holds = {
    'protagonist can reach the goal': () => goal && P && canDo(kb, P, goal.act),
    'target fits the goal': () => goal && (goal.target === 'place' ? kb.scenes.some((s) => s.name === p.target && s.kind === goal.place_kind) : kb.actions.get(goal.act).object.includes(p.target) && resolves(kb, p.target, goal.target)),
    'target differs from the setting': () => p.target !== p.setting,
    'obstacle blocks the goal': () => !!ob,
    'setting has the obstacle': () => kb.has.get(p.setting)?.has(p.obstacle),
    'means overcomes the obstacle': () => ob?.means.includes(p.means),
    'protagonist lacks the means': () => P && !hasThing(P, p.means),
    'helper has the means': () => H && hasThing(H, p.means) && H.type === 'k.people.role',
    'helper differs from the protagonist': () => p.helper !== p.protagonist,
    'target differs from the characters': () => p.target !== p.protagonist && p.target !== p.helper,
    'protagonist can make the attempts': () => p.attempts.every((a) => canDo(kb, P, a)),
    'attempts fail': () => p.attempts.length <= 3 && new Set(p.attempts).size === p.attempts.length && p.attempts.every((a) => ob?.tried_by.includes(a) && !ob.overcome_by.includes(a)),
    'helper comes before the turning point': () => at('helper') >= 0 && at('helper') < at('turning point'),
    'turning point gives the means': () => p.turning_point === 'give' && kb.actions.has('give'),
    'protagonist can overcome with the means': () => canDo(kb, P, p.resolution),
    'resolution uses the means': () => ob?.overcome_by.includes(p.resolution) && kb.actions.get(p.resolution)?.tool.includes(p.means),
    'means comes before the resolution': () => at('means') >= 0 && at('means') < at('resolution'),
    'ending reaches the goal': () => p.ending === p.goal,
    'protagonist belongs in the setting': () => P && belongs(kb, P, p.setting),
    'helper belongs in the setting': () => H && belongs(kb, H, p.setting),
    'target in the setting': () => kb.has.get(p.setting)?.has(p.target),
  };
  const hard = [], soft = [];
  for (const c of constraints) {
    const f = holds[c.name];
    if (!f) throw new Error(`no check for constraint ${c.name}`);
    const ok = !!f();
    if (c.strength === 'hard' && !ok) hard.push(c.name);
    if (c.strength === 'soft' && ok) soft.push(c.name);
  }
  return { hard, soft };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.story', 'shards'), storyShards());
  console.log(`${SOURCES.length} sources, ${ELEMENTS.length} elements, ${GOALS.length} goals, ${OBSTACLES.length} obstacles, ${CONSTRAINTS.length} constraints`);
}
