// A reference reader of k.motion (questions.md Q46): it reads the facts as the format says and plans what a face
// shows over time for a list of events, seeded. A test oracle and the source of the strip of faces in the tests and
// the reviewer's sheet; not a scheduler for hosts (that is the library's std.motion, with `plan` and `run`).
//   readMotion(world)                  -> the facts as plain objects
//   planMotion(motion, { events, seed, end, base, features }) -> { segments, instances, emitted, stateAt, changes }
// A plan is a list of segments: one key of the face set to a value from onStart, fully there from onEnd, going back
// from backStart, gone at backEnd. A host that blends draws the ramps; a host that only switches (as here) shows the
// value from the middle of the onset to the middle of the ease back, or, when the set says `via`, the via variant
// during the onset and the ease back and the value between them.
export const KEYS = ['mouth', 'eyebrows', 'eyes', 'one_eye'];

const tok = (t) => (t !== undefined && t.startsWith('"') ? JSON.parse(t) : t);
const one = (f, k) => tok(f.attrs[k]?.[0]);
const many = (f, k) => (f.attrs[k] ?? []).map(tok);
const num = (f, k) => (f.attrs[k] === undefined ? undefined : Number(tok(f.attrs[k][0])));
const pair = (f, k) => (f.attrs[`${k}_min`] === undefined ? undefined : [num(f, `${k}_min`), num(f, `${k}_max`)]);

export function readMotion(world, style = 'plain') {
  const layers = new Map(world.ofType('k.motion.layer').map((f) => [one(f, 'name'), { name: one(f, 'name'), priority: num(f, 'priority'), keys: many(f, 'key') }]));
  const steps = world.ofType('k.motion.step').map((f) => ({ rule: one(f, 'rule'), n: num(f, 'n'), about: one(f, 'about'), with: num(f, 'with'), onset: pair(f, 'onset'), hold: pair(f, 'hold'), back: pair(f, 'back'),
    hold_until: one(f, 'hold_until'), per: one(f, 'per'), splitter: one(f, 'splitter'), key: one(f, 'key'), set: [] }));
  for (const f of world.ofType('k.motion.set')) steps.find((s) => s.rule === one(f, 'rule') && s.n === num(f, 'step')).set.push({ key: one(f, 'key'), value: one(f, 'value'), via: one(f, 'via') });
  const whens = world.ofType('k.motion.when').map((f) => ({ rule: one(f, 'rule'), key: one(f, 'key'), of: one(f, 'of'), value: many(f, 'value'), feature: one(f, 'feature'), not: one(f, 'not') === 'true' }));
  const rules = world.ofType('k.motion.rule').map((f) => {
    const name = one(f, 'name');
    return { name, about: one(f, 'about'), layer: one(f, 'layer'), on: one(f, 'on'), repeat: pair(f, 'repeat'), chance: num(f, 'chance') ?? 1, during: many(f, 'during'), not_during: many(f, 'not_during'),
      until: many(f, 'until'), emits: one(f, 'emits'), when: whens.filter((w) => w.rule === name), steps: steps.filter((s) => s.rule === name).sort((a, b) => a.n - b.n) };
  });
  const visemes = new Map(world.ofType('k.motion.viseme').filter((f) => one(f, 'style') === style).map((f) => [one(f, 'class'), one(f, 'mouth')]));
  const splitters = new Map(world.ofType('k.motion.splitter').map((f) => [one(f, 'name'), { name: one(f, 'name'), fold: one(f, 'fold') === 'true', ignore_case: one(f, 'ignore_case') === 'true', default: one(f, 'default'), groups: [] }]));
  for (const f of world.ofType('k.motion.letters')) splitters.get(one(f, 'splitter')).groups.push({ name: one(f, 'name'), class: one(f, 'class'), letters: new Set(many(f, 'letter')), kind: one(f, 'kind'), min: num(f, 'min'), max: num(f, 'max') });
  const events = world.ofType('k.motion.event').map((f) => one(f, 'name'));
  const fields = world.ofType('k.motion.field').map((f) => ({ event: one(f, 'event'), name: one(f, 'name'), values: many(f, 'value') }));
  return { layers, rules, visemes, splitters, events, fields, steps, whens };
}

// The units of a text by a splitter: one per character, with its group and class.
export function splitText(splitter, text) {
  const byKind = (k) => splitter.groups.find((g) => g.kind === k);
  const fallback = splitter.groups.find((g) => g.name === splitter.default);
  return [...String(text ?? '')].map((raw) => {
    let c = splitter.ignore_case ? raw.toLowerCase() : raw;
    if (splitter.fold) c = c.normalize('NFD').replace(/\p{M}/gu, '');
    const group = splitter.groups.find((g) => g.letters.has(c))
      ?? (/\s/u.test(c) ? byKind('space') : /\p{Nd}/u.test(c) ? byKind('digit') : /\p{L}/u.test(c) ? fallback : byKind('symbol'));
    return { char: raw, group: group.name, class: group.class, min: group.min, max: group.max };
  });
}

function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, range: ([lo, hi]) => lo + Math.floor(next() * (hi - lo + 1)) };
}

// events: [{ t, name, fields }]; base: the face's own variants { mouth, eyebrows, eyes } (one_eye: none, the right
// eye as the left); features(slot, variant) -> { feel: [...], ... } of a k.faces variant.
export function planMotion(motion, { events = [], seed = 1, end = 10000, base = {}, features = () => ({}) }) {
  const r = rng(seed);
  const segments = [];
  const instances = [];
  const emitted = [];
  let order = 0;
  const queue = [];
  let qn = 0;
  const push = (item) => { queue.push({ ...item, qn: qn++ }); queue.sort((a, b) => a.t - b.t || a.qn - b.qn); };
  for (const e of events) push({ t: e.t, kind: 'event', name: e.name, fields: e.fields ?? {} });
  for (const rule of motion.rules.filter((x) => x.repeat)) push({ t: r.range(rule.repeat), kind: 'timer', rule });

  const visible = (s, t) => {
    if (s.via) {
      if (t >= s.onStart && t < s.onEnd) return s.via;
      if (t >= s.onEnd && t < s.backStart) return s.value;
      if (t >= s.backStart && t < s.backEnd) return s.via;
      return undefined;
    }
    const a = s.onStart === s.onEnd ? s.onStart : (s.onStart + s.onEnd) / 2;
    const b = s.backStart === s.backEnd ? s.backStart : (s.backStart + s.backEnd) / 2;
    return t >= a && t < b ? s.value : undefined;
  };
  const top = (key, t) => {
    let best;
    for (const s of segments) {
      if (s.key !== key) continue;
      const v = visible(s, t);
      if (v === undefined) continue;
      if (!best || s.priority > best.s.priority || (s.priority === best.s.priority && s.order > best.s.order)) best = { s, v };
    }
    return best;
  };
  const stateAt = (t) => Object.fromEntries(KEYS.map((k) => [k, top(k, t)?.v ?? base[k]]));
  const running = (layer, t) => instances.some((i) => i.rule.layer === layer && i.start <= t && t < i.end);

  const holds = (rule, t, fields) => rule.when.every((w) => {
    let ok;
    if (w.of === 'event') ok = w.value.includes(fields[w.key]);
    else {
      const shown = stateAt(t)[w.key] ?? (w.key === 'one_eye' ? stateAt(t).eyes : undefined);
      ok = w.feature ? (features(w.key === 'one_eye' ? 'eyes' : w.key, shown)?.[w.feature] ?? []).some((v) => w.value.includes(v)) : w.value.includes(shown);
    }
    return w.not ? !ok : ok;
  });

  // Lays out the steps of an instance from step index i at time t (steps waiting for an event stop the layout).
  const layout = (inst, i, t) => {
    let cursor = t;
    for (; i < inst.rule.steps.length; i++) {
      const s = inst.rule.steps[i];
      const start = s.with ? inst.stepStart[s.with] : cursor;
      inst.stepStart[s.n] = start;
      const priority = motion.layers.get(inst.rule.layer).priority;
      if (s.per) {
        let u0 = start;
        for (const u of splitText(motion.splitters.get(s.splitter), inst.fields[s.per])) {
          const d = r.range([u.min, u.max]);
          if (d > 0) segments.push({ inst, key: s.key, value: motion.visemes.get(u.class), char: u.char, unitClass: u.class, priority, order: order++, onStart: u0, onEnd: u0, backStart: u0 + d, backEnd: u0 + d });
          u0 += d;
        }
        cursor = Math.max(cursor, u0);
        continue;
      }
      const onset = r.range(s.onset ?? [0, 0]), hold = r.range(s.hold ?? [0, 0]), back = r.range(s.back ?? [0, 0]);
      const segs = s.set.map((x) => ({ inst, key: x.key, value: x.value, via: x.via, step: s.n, priority, order: order++, onStart: start, onEnd: start + onset, backStart: Infinity, backEnd: Infinity, back }));
      segments.push(...segs);
      if (s.hold_until) { inst.waiting = { event: s.hold_until, step: i, segs, hold }; inst.end = Infinity; return; }
      for (const g of segs) { g.backStart = g.onEnd + hold; g.backEnd = g.backStart + back; }
      cursor = Math.max(cursor, start + onset + hold + back);
    }
    inst.end = cursor;
    if (inst.rule.emits) push({ t: cursor, kind: 'event', name: inst.rule.emits, fields: inst.fields, from: inst });
  };
  const start = (rule, t, fields) => {
    const inst = { rule, start: t, fields, stepStart: {}, end: t };
    instances.push(inst);
    layout(inst, 0, t);
    return inst;
  };
  const cancel = (inst, t) => {
    inst.cancelled = t;
    inst.waiting = undefined;
    for (let k = segments.length - 1; k >= 0; k--) {
      const s = segments[k];
      if (s.inst !== inst) continue;
      if (s.onStart >= t) { segments.splice(k, 1); continue; }
      if (s.backStart > t) {
        const back = s.backEnd === Infinity ? s.back ?? 0 : s.backEnd - s.backStart;
        s.onEnd = Math.min(s.onEnd, t); s.backStart = t; s.backEnd = t + back;
      }
    }
    inst.end = Math.max(t, ...segments.filter((s) => s.inst === inst).map((s) => s.backEnd));
  };

  while (queue.length && queue[0].t <= end) {
    const item = queue.shift();
    const t = item.t;
    if (item.kind === 'timer') {
      const rule = item.rule;
      let inst;
      if (rule.during.every((l) => running(l, t)) && !rule.not_during.some((l) => running(l, t)) && holds(rule, t, {}) && r.next() < rule.chance) inst = start(rule, t, {});
      push({ t: (inst ? inst.end : t) + r.range(rule.repeat), kind: 'timer', rule });
      continue;
    }
    if (item.from?.cancelled !== undefined) continue;
    emitted.push({ t, name: item.name, fields: item.fields });
    // A waiting hold ends with its event; then the event cancels what it cancels; then it starts its rules.
    for (const inst of instances) {
      if (inst.waiting?.event !== item.name || inst.cancelled !== undefined) continue;
      const { segs, step, hold } = inst.waiting;
      inst.waiting = undefined;
      const backStart = Math.max(segs[0].onEnd, t + hold);
      for (const g of segs) { g.backStart = backStart; g.backEnd = backStart + g.back; }
      layout(inst, step + 1, backStart + segs[0].back);
    }
    for (const inst of instances) if (inst.cancelled === undefined && inst.start < t && inst.end > t && inst.rule.until.includes(item.name)) cancel(inst, t);
    for (const rule of motion.rules) if (rule.on === item.name && holds(rule, t, item.fields) && r.next() < rule.chance) start(rule, t, item.fields);
  }

  const times = new Set([0]);
  for (const s of segments) for (const x of [s.onStart, s.onEnd, s.backStart, s.backEnd, (s.onStart + s.onEnd) / 2, (s.backStart + s.backEnd) / 2]) if (Number.isFinite(x) && x >= 0 && x <= end) times.add(x);
  const changes = [];
  let prev = {};
  for (const t of [...times].sort((a, b) => a - b)) {
    const now = stateAt(t);
    for (const k of KEYS) if (now[k] !== prev[k]) { const tp = top(k, t); changes.push({ t, key: k, value: now[k] ?? null, rule: tp?.s.inst.rule.name ?? null, char: tp?.s.char, unitClass: tp?.s.unitClass }); }
    prev = now;
  }
  return { segments, instances, emitted, stateAt, changes, top };
}
