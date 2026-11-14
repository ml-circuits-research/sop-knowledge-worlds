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
  // "red house" parses as a compound of two nouns too (red is also a noun): a host takes the reading with the most
  // modifiers, as a word with an adjective sense before a noun is its modifier
  const np = p.map((x) => nounPhrase(x.tree, C)).sort((a, b) => (b.mods?.length ?? 0) - (a.mods?.length ?? 0))[0];
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

