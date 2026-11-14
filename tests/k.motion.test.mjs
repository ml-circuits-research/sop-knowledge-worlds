// k.motion (blocks "10:50" and "11:05"): the rules of a face over time. The facts load; every name they give of
// k.faces (slot, variant, expression key) exists there; the ranges are sane and agree with the measurements named in
// WORLD.md; the rule from text to mouth shapes does what the owner said; and the reference reader (tools/lib/motion.mjs)
// plans the sample reply as expected (priorities, blinking always, cancel, seed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { motionShards, RULES, OUTCOMES } from '../tools/motion-core.mjs';
import { readMotion, planMotion, splitText, KEYS } from '../tools/lib/motion.mjs';
import { indexOf, renderFace } from '../tools/render-faces.mjs';
import { motionSetup, stripFrames, outcomeFrames, SAMPLE } from '../tools/motion-strip.mjs';

const worlds = scanWorlds();
const world = fullWorld('k.motion', worlds);
const m = readMotion(world);
const setup = motionSetup(worlds);
const idx = indexOf(setup.faces);
const variant = (slot, name) => idx.variants.find((v) => v.style === 'plain' && v.slot === slot && v.name === name);
const slotOf = (key) => (key === 'one_eye' ? 'eyes' : key);
const BASE = { mouth: 'neutral', eyebrows: 'thick', eyes: 'oval' };
const plan = (events, opts = {}) => planMotion(m, { events, seed: 3, end: 8000, base: BASE, features: setup.features, ...opts });
const reply = (outcome, text, t = 500) => ({ t, name: 'reply', fields: { outcome, text } });
const mean = ([a, b]) => (a + b) / 2;

test('the shards are what tools/motion-core.mjs gives, and they load without a warning', () => {
  for (const [name, t] of Object.entries(motionShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.motion', 'shards', name), 'utf8'), t, name);
  assert.equal(world.ofType('k.motion.rule').length, RULES.length);
  assert.equal(m.rules.length, RULES.length);
  assert.deepEqual(world.warnings ?? [], []);
});

test('every name of k.faces it gives exists there: keys of an expression, variants of the slot, in the style plain', () => {
  const exprKeys = new Set([...worlds.find((w) => w.id === 'k.faces').schemaText.matchAll(/core\.slot of=k\.faces\.expression key=(\S+)/g)].map((x) => x[1]));
  for (const k of KEYS) assert.ok(exprKeys.has(k), `${k} is a key of k.faces.expression`);
  for (const l of m.layers.values()) for (const k of l.keys) assert.ok(exprKeys.has(k), `layer ${l.name}: ${k}`);
  let n = 0;
  for (const r of m.rules) for (const s of r.steps) {
    for (const x of s.set) {
      assert.ok(variant(slotOf(x.key), x.value), `${r.name} ${s.n}: ${x.key}=${x.value} is no variant of ${slotOf(x.key)}`);
      if (x.via) assert.ok(variant(slotOf(x.key), x.via), `${r.name} ${s.n}: via ${x.via}`);
      assert.ok(m.layers.get(r.layer).keys.includes(x.key), `${r.name}: its layer ${r.layer} does not set ${x.key}`);
      n++;
    }
    // The eyes are a mirrored pair: a step that sets the eyes sets the other eye too, or a glance below would show on it.
    if (s.set.some((x) => x.key === 'eyes')) assert.ok(s.set.some((x) => x.key === 'one_eye'), `${r.name} ${s.n}: eyes without one_eye`);
    if (s.per) assert.ok(m.layers.get(r.layer).keys.includes(s.key), `${r.name}: per step key ${s.key}`);
  }
  assert.ok(n >= 20);
  for (const [cls, mouth] of m.visemes) assert.ok(variant('mouth', mouth), `viseme ${cls}: mouth ${mouth}`);
  // The expressions of k.faces the rules echo: done smiles as the expression happy does, refused is sad.
  const expr = (name) => idx.expressions.find((e) => e.name === name);
  assert.equal(expr('sad').attrs.mouth[0], 'sad');
  assert.ok(m.rules.some((r) => r.name.startsWith('refused') && r.steps.some((s) => s.set.some((x) => x.key === 'mouth' && x.value === 'sad'))));
});

test('rules name existing layers, events and fields; one of `on` and `repeat`; conditions read real fields and features', () => {
  const events = new Set(m.events);
  const features = new Set(['shape', 'size', 'length', 'feel', 'age', 'kind']);
  for (const r of m.rules) {
    assert.ok(m.layers.has(r.layer), `${r.name}: layer ${r.layer}`);
    assert.equal(Boolean(r.on) + Boolean(r.repeat), 1, `${r.name}: exactly one of on and repeat`);
    if (r.on) assert.ok(events.has(r.on), `${r.name}: on ${r.on}`);
    for (const e of [...r.until, r.emits, ...r.steps.map((s) => s.hold_until)].filter(Boolean)) assert.ok(events.has(e), `${r.name}: event ${e}`);
    for (const l of [...r.during, ...r.not_during]) assert.ok(m.layers.has(l), `${r.name}: layer ${l}`);
    assert.ok(r.chance >= 0 && r.chance <= 1);
    assert.ok(r.steps.length >= 1, `${r.name}: no step`);
    r.steps.forEach((s, i) => assert.equal(s.n, i + 1, `${r.name}: steps numbered from 1`));
    for (const w of r.when) {
      if (w.of === 'event') {
        const f = m.fields.find((x) => x.event === r.on && x.name === w.key);
        assert.ok(f, `${r.name}: ${r.on} has no field ${w.key}`);
        for (const v of w.value) assert.ok(f.values.length === 0 || f.values.includes(v), `${r.name}: ${w.key}=${v}`);
      } else {
        assert.ok(KEYS.includes(w.key), `${r.name}: state key ${w.key}`);
        if (w.feature) {
          assert.ok(features.has(w.feature));
          for (const v of w.value) assert.ok(idx.variants.some((x) => x.slot === slotOf(w.key) && (x.features[w.feature] ?? []).includes(v)), `${r.name}: no ${slotOf(w.key)} has ${w.feature}=${v}`);
        }
      }
    }
  }
  // Every outcome of a reply has a rule that shows it.
  for (const o of OUTCOMES) assert.ok(m.rules.some((r) => r.when.some((w) => w.key === 'outcome' && w.value.includes(o))), `no rule for ${o}`);
});

test('ranges are sane: both ends or neither, min <= max, and the measured ranges agree with their sources', () => {
  const pairs = (o, names) => names.map((n) => [n, o[n]]).filter(([, p]) => p);
  for (const r of m.rules) {
    if (r.repeat) assert.ok(r.repeat[0] > 0 && r.repeat[0] <= r.repeat[1], `${r.name}: repeat`);
    for (const s of r.steps) {
      for (const [n, p] of pairs(s, ['onset', 'hold', 'back'])) assert.ok(p[0] >= 0 && p[0] <= p[1] && p[1] <= 10000, `${r.name} ${s.n}: ${n} ${p}`);
      if (s.per) assert.ok(!s.onset && !s.hold && !s.back && s.splitter && s.key, `${r.name}: a stream step has no phases`);
      else assert.ok(s.onset && s.back && (s.hold || s.hold_until), `${r.name} ${s.n}: onset, hold and back`);
    }
  }
  for (const f of world.ofType('k.motion.step')) for (const k of ['onset', 'hold', 'back']) assert.equal(f.attrs[`${k}_min`] === undefined, f.attrs[`${k}_max`] === undefined, `${f.id}: ${k}`);
  const rule = (name) => m.rules.find((r) => r.name === name);
  // Bentivoglio et al. 1997: 17 blinks a minute at rest, 26 in conversation (mean pause 3.5 s and 2.3 s).
  const blinkTotal = (s) => [s.onset[0] + s.hold[0] + s.back[0], s.onset[1] + s.hold[1] + s.back[1]];
  for (const name of ['blink at rest', 'blink while talking']) {
    const s = rule(name).steps[0];
    const [lo, hi] = blinkTotal(s);
    assert.ok(lo >= 100 && hi <= 400, `${name}: a blink lasts ${lo}-${hi} ms, published 100-400`);
    assert.ok(s.onset[1] < s.back[0] + 50 && mean(s.onset) < mean(s.back), 'the lid closes faster than it opens');
  }
  const perMinute = (name) => 60000 / (mean(rule(name).repeat) + mean(blinkTotal(rule(name).steps[0])));
  assert.ok(Math.abs(perMinute('blink at rest') - 17) <= 3, `at rest ${perMinute('blink at rest')}`);
  assert.ok(Math.abs(perMinute('blink while talking') - 26) <= 4, `talking ${perMinute('blink while talking')}`);
  // Schmidt et al. 2006: smile onset 0.555-0.591 s, offset 0.555-0.643 s.
  const smile = rule('done: smile').steps[0];
  assert.ok(smile.onset[0] <= 555 && smile.onset[1] >= 591 && smile.back[0] <= 555 && smile.back[1] >= 643);
  // Grammer et al. 1988: an eyebrow flash about a fifth of a second.
  const flash = rule('answer: eyebrow flash').steps[0];
  assert.ok(flash.hold[0] <= 200 && flash.hold[1] >= 200);
  // Lee, Badler and Badler 2002: saccades 25 ms + 2.4 ms a degree; looking away 0.43 +- 0.24 s listening, 0.93 +- 0.80 s talking.
  for (const r of m.rules.filter((x) => x.layer === 'glance')) {
    const s = r.steps[0];
    assert.ok(s.onset[0] >= 20 && s.onset[1] <= 90, `${r.name}: saccade`);
    const [lo, hi] = r.name.includes('listening') ? [430 - 240, 430 + 240] : [930 - 800, 930 + 800];
    assert.ok(s.hold[0] >= lo - 10 && s.hold[1] <= hi + 10, `${r.name}: hold ${s.hold}`);
  }
});

test('text to mouth shapes: the owner\'s rule (vowels open, o/u rounded, m/b/p closed, f/v lip-teeth, spaces and punctuation rest)', () => {
  const sp = m.splitters.get('latin letters');
  assert.ok(sp && sp.fold && sp.ignore_case);
  const cls = (text) => splitText(sp, text).map((u) => u.class).join(' ');
  assert.equal(cls('aei'), 'open open open');
  assert.equal(cls('ou'), 'rounded rounded');
  assert.equal(cls('mbp'), 'closed closed closed');
  assert.equal(cls('fv'), 'lip-teeth lip-teeth');
  assert.equal(cls(' ,.!?;:'), 'rest rest rest rest rest rest rest');
  assert.equal(cls('tdnl'), 'tongue tongue tongue tongue');
  assert.equal(cls('skrh'), 'mid mid mid mid');
  // Any Latin-script text: capitals, marks folded, digits, symbols.
  assert.equal(cls('ÀÉÎ'), 'open open open');
  assert.equal(cls('ÖÜøç'), 'rounded rounded mid mid');
  assert.equal(cls('7"'), 'mid rest');
  // Every class has a mouth in the style plain, and every class is used by some characters.
  const used = new Set(sp.groups.map((g) => g.class));
  for (const c of ['rest', 'open', 'mid', 'rounded', 'closed', 'lip-teeth', 'tongue']) { assert.ok(m.visemes.has(c), c); assert.ok(used.has(c), c); }
  for (const g of sp.groups) assert.ok(g.min <= g.max && g.max <= 600, g.name);
  // A reply is said at about the speed of conversation (Yuan, Liberman and Cieri 2006: 164-214 words a minute).
  for (const text of ['Done, I moved it.', 'I moved the red circle to the left of the house, as you asked.', 'Sorry, I cannot remove the sky: it is not a thing in the picture.',
    'Ça marche très bien, merci.', 'Über den Fluss führt eine Brücke.']) {
    const ms = splitText(sp, text).reduce((a, u) => a + mean([u.min, u.max]), 0);
    const wpm = text.split(/\s+/).length / (ms / 60000);
    assert.ok(wpm >= 120 && wpm <= 220, `${text}: ${wpm.toFixed(0)} words a minute`);
  }
});

test('the sample plan: "Done, I moved it." is said letter by letter, then a smile, then the face eases back', () => {
  const p = plan([reply('done', SAMPLE.text)], { end: 6000 });
  const spoken = p.emitted.find((e) => e.name === 'spoken');
  assert.ok(spoken && spoken.t > 500 + 17 * 30 && spoken.t < 500 + 17 * 150, `spoken at ${spoken?.t}`);
  // The mouth shapes in order: one per letter (same-class neighbours are one shape).
  const talk = p.segments.filter((s) => s.inst.rule.name === 'say the reply');
  assert.equal(talk.map((s) => s.char).join(''), SAMPLE.text);
  assert.deepEqual(talk.slice(0, 5).map((s) => s.value), ['tongue tip', 'open', 'tongue tip', 'talking', 'neutral']);
  assert.equal(talk.find((s) => s.char === 'm').value, 'pressed');
  assert.equal(talk.find((s) => s.char === 'v').value, 'lip bite');
  // While talking the mouth is the talking mouth; after it is said, a smile, and then the face's own mouth again.
  assert.equal(p.stateAt(talk[1].onStart + 1).mouth, 'open');
  const smile = p.segments.find((s) => s.inst.rule.name === 'done: smile');
  assert.ok(smile.onStart === spoken.t, 'the smile starts when the text is said');
  assert.equal(p.stateAt(smile.onEnd + 10).mouth, 'smile');
  assert.equal(p.stateAt(smile.backEnd + 10).mouth, 'neutral');
  assert.ok(smile.backEnd < 6000);
  // A seed gives the same plan; another seed another one.
  assert.deepEqual(plan([reply('done', SAMPLE.text)], { end: 6000 }).changes, p.changes);
  assert.notDeepEqual(plan([reply('done', SAMPLE.text)], { end: 6000, seed: 4 }).changes, p.changes);
});

test('priorities: the talking mouth over the expression\'s, the expression\'s brows while talking, blinking always', () => {
  const p = plan([reply('refused', 'Sorry, I cannot do that: there is nothing to move here.')], { end: 9000 });
  const brows = p.segments.find((s) => s.key === 'eyebrows');
  const talk = p.segments.filter((s) => s.inst.rule.name === 'say the reply');
  const during = talk.find((s) => s.onStart > brows.onEnd && s.value !== 'neutral');
  assert.equal(p.stateAt(during.onStart + 1).eyebrows, 'sad');
  assert.equal(p.stateAt(during.onStart + 1).mouth, during.value);
  const mouth = p.segments.find((s) => s.inst.rule.name === 'refused: sad mouth');
  assert.equal(p.stateAt(mouth.onEnd + 1).mouth, 'sad');
  // Blinks happen while talking, and they close the eyes above an expression that sets them (thinking looks up).
  assert.ok(p.instances.some((i) => i.rule.name === 'blink while talking'));
  const t = plan([reply('thinking', '')], { end: 20000 });
  const blink = t.segments.find((s) => s.inst.rule.layer === 'blink' && s.key === 'eyes' && s.onStart > 1000);
  assert.ok(blink, 'a blink while thinking');
  assert.equal(t.stateAt(blink.onEnd + 1).eyes, 'closed');
  assert.equal(t.stateAt(blink.backEnd + 1).eyes, 'looking up');
  // Glances are hidden under an expression that sets the eyes, and do not run while talking at rest rate.
  for (const s of t.segments.filter((x) => x.inst.rule.layer === 'glance')) assert.equal(t.stateAt(s.onEnd + 1).eyes === 'looking up' || t.stateAt(s.onEnd + 1).eyes === 'closed', true);
  // A blink does not start when the eyes are closed already (a face whose own eyes are happy).
  const happy = plan([], { end: 30000, base: { ...BASE, eyes: 'happy' } });
  assert.equal(happy.instances.filter((i) => i.rule.layer === 'blink').length, 0);
});

test('measured over time: blinks a minute at rest and while talking, glances, and a new reply cancels the last', () => {
  const rest = plan([], { end: 600000, seed: 11 });
  const restRate = rest.instances.filter((i) => i.rule.name === 'blink at rest').length / 10;
  assert.ok(restRate >= 14 && restRate <= 20, `at rest ${restRate} a minute`);
  const glances = rest.instances.filter((i) => i.rule.layer === 'glance').length / 10;
  assert.ok(glances >= 5 && glances <= 12, `${glances} glances a minute while listening`);
  const long = Array.from({ length: 20 }, () => 'I moved the red circle to the left of the house, as you asked.').join(' ');
  const talking = plan([reply('answer', long, 0)], { end: 200000, seed: 11 });
  const spoken = talking.emitted.find((e) => e.name === 'spoken').t;
  const talkRate = talking.instances.filter((i) => i.rule.name === 'blink while talking' && i.start < spoken).length / (spoken / 60000);
  assert.ok(talkRate >= 21 && talkRate <= 31, `talking ${talkRate.toFixed(1)} a minute`);
  // Cancel: a second reply while the first is said; the first is never "spoken", its mouth stops at once.
  const c = plan([reply('done', 'This is a long reply that will not be finished.'), reply('question', 'Which one?', 1200)], { end: 8000 });
  const sp = c.emitted.filter((e) => e.name === 'spoken');
  assert.equal(sp.length, 1);
  assert.equal(sp[0].fields.outcome, 'question');
  assert.ok(!c.segments.some((s) => s.inst.rule.name === 'say the reply' && s.inst.fields.outcome === 'done' && s.backStart > 1200));
  assert.ok(!c.instances.some((i) => i.rule.name === 'done: smile'));
});

test('the strip of faces of the sample plan and the faces of the outcomes compose and render', () => {
  const { frames } = stripFrames(setup);
  assert.ok(frames.length >= 20);
  for (const f of frames) assert.match(renderFace(setup.faces, f.face, 'frame'), /<svg/);
  assert.ok(frames.some((f) => f.face.pick.mouth === 'smile') && frames.some((f) => f.face.pick.eyes === 'closed'));
  const outs = outcomeFrames(setup);
  assert.equal(outs.length, OUTCOMES.length);
  assert.equal(outs.find((f) => f.caption.startsWith('thinking')).face.pick.eyes, 'looking up');
});

test('mouth shapes are not language knowledge: nothing of the mouth in the language worlds (owner, 11:05)', () => {
  for (const d of readdirSync(WORLDS_DIR).filter((x) => x.startsWith('w.lang.'))) {
    const files = [join(WORLDS_DIR, d, 'schema.sop'), ...(existsSync(join(WORLDS_DIR, d, 'shards')) ? readdirSync(join(WORLDS_DIR, d, 'shards')).map((f) => join(WORLDS_DIR, d, 'shards', f)) : [])];
    for (const f of files) assert.doesNotMatch(readFileSync(f, 'utf8'), /viseme|k\.motion|lip-teeth/i, f);
  }
});
