// w.lang.en generation templates (blocks 14:15 item 1 and 17:05): one imperative template per act and argument shape,
// in the library's template notation, read back by w.lang.en's own frames (and its noun-phrase productions for a kind)
// to the same act, mode and roles, for every template with sample fillers. These are integration cases the library's
// std.sample (realise / read round trip) and std.grammar generation can read in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, World, parseText, nounPhrase } from '../tools/sopworld/sopworld.mjs';
import { scanWorlds } from '../tools/lib/worlds.mjs';
import { frameReader, realiseEn, articleFor, hostOptions, hostLexicon, inflect } from '../tools/lib/lang-en.mjs';

const worlds = scanWorlds();
const lang = worlds.find((w) => w.id === 'w.lang.en');
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const wiresOf = (id) => worlds.find((w) => w.id === id).shards.flatMap((s) => parse(s.text));
const all = wiresOf('w.lang.en');
const actions = wiresOf('k.actions');
const of = (type) => all.filter((w) => w.type === `w.lang.en.${type}`);
const v = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => v(w, k)[0];
const templates = of('template');
const SLOT = /\{([\w.]+)(?::([^}@]*))?(?:@(\w+))?\}/g;

// The frames that apply in a general world of things (a drawing, a seating plan, a list): those with no `needs` and
// those whose needs such a world meets; the frames of one kind of world (a map's facts, a chart's values, a text, a
// melody, the avatar's self) apply only to a template that names them.
const GENERAL = new Set([undefined, 'in', 'named', 'attrs', 'values', 'number', 'more', 'less', 'rel', 'dir', 'layout', 'scale', 'turn', 'wish', 'say', 'list', 'clear', 'none', 'thingask']);
// The host's lexicons the frames name (a world's kinds, values, attributes, comparatives, nouns for its whole work).
const LEXICONS = { kind: ['house', 'apple', 'table', 'tree', 'guest', 'star', 'cat'], value: ['red', 'blue', 'orange', 'big', 'small'], attribute: ['colour', 'size', 'seat', 'height', 'window'],
  more: ['bigger', 'taller', 'wider'], less: ['smaller', 'shorter'], noun: ['picture', 'drawing'] };

// How a host reads the noun phrase of a kind: w.lang.en's productions with the nouns and adjectives of k.words.
const gw = new World();
for (const s of lang.shards) gw.tell(s.text);
const opts = hostOptions(gw);
const C = { det: 'DET', num: 'NUM', mod: 'MOD', head: 'N', pp: 'PP', ord: 'ORD', name: 'NAME', pron: 'PRON' };
const kindPhrase = (words) => {
  const p = parseText(gw, words, { ...opts, start: 'NP', lexicon: hostLexicon(gw, words, worlds) });
  if (!p.length) return null;
  // "red house": hostLexicon gives red only as a modifier before a noun, so every parse has it as a modifier
  const nps = p.map((x) => nounPhrase(x.tree, C));
  const np = nps[0];
  return np.lemma ? { head: np.lemma, mods: np.mods ?? [] } : null;
};
const readerFor = (t) => frameReader(all, actions, { lexicons: LEXICONS, kindPhrase, needs: (n) => GENERAL.has(n) || n === one(t, 'needs') });

const morph = { inflect: of('inflect'), irregular: of('irregular'), exceptions: of('noun.exception') };
const dets = new Set(of('det').map((d) => one(d, 'text')));
const noDet = (s) => { const ws = String(s).toLowerCase().split(' '); return (dets.has(ws[0]) ? ws.slice(1) : ws).join(' '); };

// Two sets of sample fillers by role (a thing of the live world comes with its determiner, a place as relation and
// thing); a template may ask for a value of another kind (a name, a comparative).
const FILLERS = [
  { kind: 'house', number: '3', value: 'red', thing: 'the house', source: 'the tree', target: 'the tree', recipient: 'Ann', place: ['next to', 'the tree'],
    attribute: 'colour', topic: 'colour', direction: 'up', amount: 'a bit', name: 'lunch' },
  { kind: 'apple', number: '12', value: 'orange', thing: 'table 1', source: 'table 2', target: 'table 2', recipient: 'Bob', place: ['at', 'table 2'],
    attribute: 'size', topic: 'height', direction: 'left', amount: 'a lot', name: 'garden' },
];
const OVERRIDE = { // by template: what its roles take
  'make.name': [{ kind: 'guest', value: 'Ann' }, { kind: 'cat', value: 'Tom' }], 'make.name.place': [{ kind: 'guest', value: 'Ann' }, { kind: 'guest', value: 'Bob' }],
  'change.amount.value': [{ value: 'bigger' }, { value: 'smaller' }], 'change.more': [{ attribute: 'seat', amount: '2' }, { attribute: 'window', amount: '5' }],
  'change.less': [{ attribute: 'seat', amount: '2' }, { attribute: 'window', amount: '3' }], 'change.more.one': [{ attribute: 'seat' }, { attribute: 'window' }],
  'change.less.one': [{ attribute: 'seat' }, { attribute: 'window' }], 'ask.count': [{ thing: 'table' }, { thing: 'star' }], 'ask.where': [{ thing: 'Ann' }, { thing: 'the cat' }],
  'group.thing': [{ thing: 'the tables' }, { thing: 'the stars' }], 'take_apart.thing': [{ thing: 'the tables' }, { thing: 'the house' }],
  'load.thing': [{ thing: 'lunch' }, { thing: 'garden' }], 'undo.number': [{ number: '2' }, { number: '5' }],
};
const fillersOf = (t, i) => ({ ...FILLERS[i], ...(OVERRIDE[one(t, 'name')]?.[i] ?? {}) });
const sayOf = (f) => Object.fromEntries(Object.entries(f).map(([k, x]) => [k, Array.isArray(x) ? x.join(' ') : x]));
const THINGS = new Set(['thing', 'source', 'target', 'recipient']);

test('templates: every act of k.actions has one, each names a frame of its act, roles of its act, and slots that are its roles', () => {
  const acts = new Map(actions.filter((w) => w.type === 'k.actions.act').map((a) => [one(a, 'name'), v(a, 'role')]));
  const frames = new Map(of('frame').map((f) => [one(f, 'name'), f]));
  const modeMap = new Map(of('mode_map').map((m) => [`${one(m, 'act')} ${one(m, 'mode')}`, one(m, 'means')]));
  assert.deepEqual([...acts.keys()].filter((a) => !templates.some((t) => one(t, 'act') === a)), [], 'acts without a template');
  const shapes = new Set();
  for (const t of templates) {
    const name = one(t, 'name'), act = one(t, 'act');
    for (const fn of v(t, 'frame')) {
      const f = frames.get(fn);
      assert.ok(f, `${name}: frame ${fn}`);
      assert.equal(modeMap.get(`${one(f, 'act')} ${one(f, 'mode')}`) ?? one(f, 'act'), act, `${name}: the frame's act`);
      assert.equal(one(t, 'needs'), one(f, 'needs'), `${name}: needs is the frame's`);
      if (one(t, 'mode')) assert.equal(one(t, 'mode'), one(f, 'mode'), `${name}: mode is the frame's`);
    }
    const slots = [...one(t, 'text').matchAll(SLOT)].map((m) => m[1]);
    assert.deepEqual([...slots].sort(), [...v(t, 'role')].sort(), `${name}: the slots are the roles`);
    for (const r of v(t, 'role')) assert.ok(acts.get(act).includes(r), `${name}: ${r} is a role of ${act}`);
    // the shape: the roles in the order k.actions gives them, then the mode, then a fixed attribute ("none" without roles)
    const order = acts.get(act);
    const want = [...[...v(t, 'role')].sort((a, b) => order.indexOf(a) - order.indexOf(b)), ...(one(t, 'mode') ? [one(t, 'mode')] : []), ...(one(t, 'attribute') ? [one(t, 'attribute')] : [])].join('.') || 'none';
    assert.equal(one(t, 'shape'), want, `${name}: shape`);
    assert.ok(!shapes.has(`${act} ${want}`), `${name}: one template per act and shape`);
    shapes.add(`${act} ${want}`);
    assert.equal(one(t, 'text'), one(t, 'text').toLowerCase(), `${name}: lower case (the realiser makes the first letter upper case)`);
    assert.match(one(t, 'text'), /[.?]$/, `${name}: ends a sentence`);
  }
});

test('templates: the article takes its form from the next word (w.lang.en.det before, onsets)', () => {
  for (const [w, a] of Object.entries({ house: 'a', apple: 'an', umbrella: 'an', hour: 'an', honest: 'an', unicorn: 'a', uniform: 'a', unimportant: 'an', european: 'a', one: 'a', user: 'a', orange: 'an', ewe: 'a', egg: 'an' })) assert.equal(articleFor(all, w), a, w);
  assert.equal(realiseEn(all, 'add a {value} {kind}.', { value: 'orange', kind: 'house' }), 'Add an orange house.');
  assert.equal(realiseEn(all, 'add {number} {kind:num=pl}.', { number: '3', kind: 'mouse' }), 'Add 3 mice.');
  assert.equal(realiseEn(all, 'add a {kind}.', {}), null, 'a role without a filler');
});

test('templates: every template, with two sets of sample fillers, reads back by w.lang.en\'s frames to the same act, mode and roles', () => {
  const report = [];
  for (const t of templates) for (const i of [0, 1]) {
    const name = one(t, 'name');
    const f = fillersOf(t, i);
    const sentence = realiseEn(all, one(t, 'text'), sayOf(f));
    assert.ok(sentence, `${name}: realised`);
    const read = readerFor(t)(sentence);
    assert.ok(read.length, `${name}: "${sentence}" is read by no frame`);
    const best = read[0];
    assert.equal(best.act, one(t, 'act'), `${name}: "${sentence}" read as ${best.frame}`);
    if (one(t, 'mode')) assert.equal(best.mode, one(t, 'mode'), `${name}: "${sentence}" mode (${best.frame})`);
    assert.ok(read.some((r) => v(t, 'frame').includes(r.frame)), `${name}: "${sentence}" is read by its frame ${v(t, 'frame')} too`);
    const plural = new Set([...one(t, 'text').matchAll(SLOT)].filter((m) => /num=pl/.test(m[2] ?? '')).map((m) => m[1]));
    const want = {}, got = {};
    for (const r of v(t, 'role')) {
      const x = f[r];
      want[r] = r === 'place' ? `${x[0]} ${noDet(x[1])}` : THINGS.has(r) ? noDet(x) : String(x).toLowerCase();
      let g = r === 'place' ? `${best.args['place.marker']} ${best.args.place}` : best.args[r];
      if (plural.has(r) && g) g = inflect(morph, g, 'singular', 'lemma');
      got[r] = THINGS.has(r) && g ? noDet(g) : g;
    }
    assert.deepEqual(got, want, `${name}: "${sentence}" read as ${best.frame} ${JSON.stringify(best.args)}`);
    assert.deepEqual(Object.keys(best.args).filter((k) => k !== 'place.marker' && !v(t, 'role').includes(k)), [], `${name}: "${sentence}" reads no role the template lacks`);
    report.push(sentence);
  }
  assert.equal(report.length, templates.length * 2);
});

test('templates: what the frames read and the templates cannot say yet (holes, counted)', () => {
  const acts = new Map(actions.filter((w) => w.type === 'k.actions.act').map((a) => [one(a, 'name'), v(a, 'role')]));
  const said = new Set(templates.flatMap((t) => v(t, 'role').map((r) => `${one(t, 'act')}.${r}`)));
  const unsaid = [...acts].flatMap(([a, rs]) => rs.filter((r) => !said.has(`${a}.${r}`)).map((r) => `${a}.${r}`));
  // roles no general frame reads: make.part, make.material, change.old value, change.replacement (only the avatar's
  // and a chart's frames), place.source, connect.tool, group.target/group/criterion, take apart.parts/source/tool,
  // pick.source/other, ask.other, copy.number/place, send.means/format, undo.thing/state, save.thing/place/format,
  // load.source, redo.thing/number, deselect.thing
  assert.ok(unsaid.length <= 30, unsaid.join(', '));
  assert.ok(templates.length >= 34, `${templates.length} templates`);
  console.log(`templates: ${templates.length}; roles of k.actions no template says: ${unsaid.length}: ${unsaid.join(', ')}`);
});

// ---- discourse templates (blocks 14:45 item 2, 15:00 item 4, 17:05) ----
const discourse = of('discourse');
const slots = new Map(of('slot').map((s) => [one(s, 'name'), s]));
const genres = worlds.find((w) => w.id === 'k.genres'), story = worlds.find((w) => w.id === 'k.story');
const gwires = genres ? wiresOf('k.genres') : [];
// The move names and registers of k.genres, read from its facts (the names below only if k.genres is not loaded).
const MOVES = genres ? gwires.filter((w) => w.type === 'k.genres.move').map((m) => one(m, 'name')) : ['introduce topic', 'claim centrality', 'generalise', 'review previous work', 'indicate a gap',
  'raise a question', 'counter-claim', 'state purpose', 'announce findings', 'outline structure', 'define', 'describe method', 'report result', 'compare', 'surprising fact', 'give example',
  'interpret result', 'state limitation', 'recommend', 'summarize', 'conclude', 'transition', 'state thesis', 'state claim', 'give evidence', 'counterargument', 'rebut', 'restate thesis',
  'state takeaway', 'thank audience', 'invite questions', 'report action', 'report problem', 'next step', 'set the scene', 'introduce character', 'state goal', 'complicate', 'attempt',
  'turning point', 'resolve', 'evaluate', 'end'];
const REG = genres ? Object.fromEntries(gwires.filter((w) => w.type === 'k.genres.register').map((r) => [one(r, 'name'), { person: [one(r, 'person'), ...v(r, 'person_also')], questions: one(r, 'questions'), contractions: one(r, 'contractions'), tense: one(r, 'tense'), max: Number(one(r, 'sentence_max')) }]))
  : { scientific: { person: ['first plural', 'third'], questions: 'false', contractions: 'false', tense: 'present', max: 32 }, presentation: { person: ['first plural', 'second'], questions: 'true', contractions: 'true', tense: 'present', max: 16 },
    essay: { person: ['first singular', 'third', 'first plural'], questions: 'true', contractions: 'false', tense: 'present', max: 28 }, narrative: { person: ['third', 'first singular'], questions: 'false', contractions: 'true', tense: 'past', max: 20 },
    report: { person: ['first plural', 'third'], questions: 'false', contractions: 'false', tense: 'past', max: 24 } };
const DISCOURSE_FILLERS = { topic: 'octopuses', thing: 'the octopus', other: 'the squid', kind: 'mollusc', attribute: 'weight', value: 'about 15 kg', other_value: 'about 2 kg', usual: 'one to three kg',
  fact: 'an octopus has three hearts', example: 'the giant Pacific octopus', question: 'why an octopus has three hearts', part: 'its food', parts: 'its body, its food and its home', count: 'three',
  thesis: 'zoos help wild animals', claim: 'octopuses solve problems', evidence: 'an octopus can open a jar', source: 'Mather (2008)', method: 'compared the weights of 314 animals',
  action: 'counted the guests', time: 'on Monday', problem: 'the map did not load', next: 'add the missing cities', limitation: 'only drawn animals were counted', setting: 'forest',
  protagonist: 'fox', trait: 'old', goal: 'cross the river', target: 'the island', obstacle: 'river', attempt: 'jump over it', helper: 'heron', means: 'branch', overcome: 'cross it', feeling: 'happy' };

test('discourse: moves and registers are those of k.genres; every slot is declared and used, a story slot names an element of k.story', () => {
  assert.ok(discourse.length >= 100, `${discourse.length}`);
  for (const t of discourse) {
    assert.ok(MOVES.includes(one(t, 'move')), `${one(t, 'name')}: move ${one(t, 'move')}`);
    assert.ok(REG[one(t, 'register')], `${one(t, 'name')}: register ${one(t, 'register')}`);
    const used = [...new Set([...one(t, 'text').matchAll(SLOT)].map((m) => m[1]))];
    assert.deepEqual([...used].sort(), [...v(t, 'slot')].sort(), `${one(t, 'name')}: slot= lists the slots of the text`);
    for (const s of used) assert.ok(slots.has(s), `${one(t, 'name')}: slot ${s} declared`);
  }
  const usedAll = new Set(discourse.flatMap((t) => v(t, 'slot')));
  assert.deepEqual([...slots.keys()].filter((s) => !usedAll.has(s)), [], 'declared slots no template uses');
  if (story) {
    const elements = new Set(wiresOf('k.story').filter((w) => w.type === 'k.story.element').map((e) => one(e, 'name')));
    for (const s of slots.values()) if (one(s, 'element')) assert.ok(elements.has(one(s, 'element')), `${one(s, 'name')}: element ${one(s, 'element')}`);
  }
});

test('discourse: coverage: the moves the reviewer named in every register, the story moves in the narrative register, and (with k.genres) every move of every genre in its register', () => {
  const have = new Set(discourse.map((t) => `${one(t, 'register')} ${one(t, 'move')}`));
  const want = [];
  for (const r of Object.keys(REG)) for (const m of ['introduce topic', 'compare', 'surprising fact', 'give example', 'raise a question', 'conclude', 'transition']) want.push(`${r} ${m}`);
  for (const m of ['set the scene', 'introduce character', 'state goal', 'complicate', 'attempt', 'turning point', 'resolve', 'evaluate', 'end']) want.push(`narrative ${m}`);
  if (genres) for (const g of gwires.filter((w) => w.type === 'k.genres.genre')) {
    const moves = [...v(g, 'also_move'), ...gwires.filter((w) => w.type === 'k.genres.step' && one(w, 'genre') === one(g, 'name')).map((s) => one(s, 'move'))];
    for (const m of moves) want.push(`${one(g, 'register')} ${m}`);
  }
  assert.deepEqual([...new Set(want)].filter((x) => !have.has(x)), []);
  const per = {};
  for (const t of discourse) per[one(t, 'register')] = (per[one(t, 'register')] ?? 0) + 1;
  console.log(`discourse: ${discourse.length} templates, ${new Set(discourse.map((t) => one(t, 'move'))).size} moves, ${slots.size} slots; by register ${JSON.stringify(per)}`);
});

test('discourse: the words outside the slots keep the register (persons, questions, contractions, the past of a story) and a filled sentence is not longer than the register allows', () => {
  const PERSON = (x) => (x.person === '1' ? (x.number === 'pl' ? 'first plural' : 'first singular') : x.person === '2' ? 'second' : 'third');
  const persons = new Map();
  for (const p of [...of('pron'), ...of('det').filter((d) => one(d, 'kind') === 'possessive')]) if (one(p, 'person')) persons.set(one(p, 'text'), PERSON({ person: one(p, 'person'), number: one(p, 'number') }));
  const PRESENT = new Set(['is', 'are', 'am', 'has', 'does', 'do']);
  const bad = [];
  for (const t of discourse) {
    const r = REG[one(t, 'register')], text = one(t, 'text'), name = one(t, 'name');
    const words = text.replace(SLOT, ' ').toLowerCase().match(/[a-z']+/g) ?? [];
    for (const w of words) if (persons.has(w) && !r.person.includes(persons.get(w))) bad.push(`${name}: "${w}" is ${persons.get(w)}`);
    if (r.questions === 'false' && /\?/.test(text)) bad.push(`${name}: a direct question`);
    if (r.contractions === 'false' && words.some((w) => /'(s|t|re|ve|ll|d|m)$/.test(w) && !/^(everyone|someone)'s$/.test(w))) bad.push(`${name}: a contraction`);
    if (r.tense === 'past' && one(t, 'register') === 'narrative' && words.some((w) => PRESENT.has(w))) bad.push(`${name}: a present verb in a narrative`);
    const s = realiseEn(all, text, DISCOURSE_FILLERS);
    if (!s) bad.push(`${name}: not realised`);
    else if (s.split(/\s+/).length > r.max) bad.push(`${name}: ${s.split(/\s+/).length} words > ${r.max}`);
  }
  assert.deepEqual(bad, []);
  assert.equal(realiseEn(all, 'In the {setting} lived a {trait} {protagonist}.', DISCOURSE_FILLERS), 'In the forest lived an old fox.');
});

test('block 20:15 (from PSys2): "Put a guest named Maria at table 1." is a named add with a place: the name ends before the place preposition', () => {
  const read = frameReader(all, actions, { lexicons: LEXICONS, needs: (n) => GENERAL.has(n) || n === 'named' });
  for (const [s, value, marker, place] of [['Put a guest named Maria at table 1.', 'maria', 'at', 'table 1'], ['Place a guest called Ann Lee next to table 2.', 'ann lee', 'next to', 'table 2']]) {
    const best = read(s)[0];
    assert.equal(best.frame, 'acts.make.name.place.p', `${s}: ${best.frame}`);
    assert.deepEqual([best.act, best.args.kind, best.args.value, best.args['place.marker'], best.args.place], ['make', 'guest', value, marker, place], s);
  }
  // without a place the place-verb frame of the hand-over still reads the name to the end
  assert.deepEqual([read('Place a guest named Ann.')[0].frame, read('Place a guest named Ann.')[0].args.value], ['acts.make.name.p', 'ann']);
});
