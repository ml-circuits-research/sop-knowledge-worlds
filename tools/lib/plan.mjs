// A reference reader of k.procedures (questions.md Q44): expands a goal into the acts its methods give, over a toy
// live world, so the tests of this repository can check each method against an expected list of acts. It is a test
// oracle that reads the facts as the format says, not a planner for hosts: the planner is the library's std.plan.
// It reads facts by parsing the shards (no rules run), and follows the chain of kinds through is_a, kind_of, the
// `is` of a role, the age of a kind of person and the drawing of a person (what std.know does for a host).
import { parse } from '../sopworld/sopworld.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { scanWorlds, WORLDS_DIR } from './worlds.mjs';

// The kinds of a world schema by their plain name (table -> w.seating.table), and the slots of each.
export function schemaKinds(id) {
  const file = join(WORLDS_DIR, id, 'schema.sop');
  if (!existsSync(file)) return null;
  const wires = parse(readFileSync(file, 'utf8'));
  const types = wires.filter((x) => x.type === 'core.type').map((x) => x.attrs.of[0]);
  const parent = Object.fromEntries(wires.filter((x) => x.type === 'core.type').map((x) => [x.attrs.of[0], x.attrs.extends ?? []]));
  const own = (t) => wires.filter((x) => x.type === 'core.slot' && x.attrs.of[0] === t).map((x) => x.attrs.key[0]);
  const slots = (t) => [...own(t), ...(parent[t] ?? []).flatMap(slots)];
  return { kinds: Object.fromEntries(types.map((t) => [t.slice(id.length + 1), t])), slots: Object.fromEntries(types.map((t) => [t, slots(t)])) };
}

const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const num = (t) => (t === undefined ? undefined : Number(tok(t)));
const one = (a, k) => tok(a[k]?.[0]);
const all = (a, k) => (a[k] ?? []).map(tok);
export const MAX_ACTS = 200, MAX_DEPTH = 3;

export class Knowledge {
  constructor(worlds = scanWorlds()) { this.worlds = worlds; this.byType = new Map(); this.parentsCache = new Map(); }
  // The facts of a type, merged by identity (a fact told in two shards is one fact), each { type, attrs }.
  facts(type) {
    if (this.byType.has(type)) return this.byType.get(type);
    const wid = this.worlds.map((w) => w.id).filter((id) => type.startsWith(`${id}.`)).sort((a, b) => b.length - a.length)[0];
    const world = this.worlds.find((w) => w.id === wid);
    const out = [];
    if (world) {
      // the identity keys of the type, or, where it declares none, of the type it extends (k.people.role: k.kinds.kind)
      const idsOf = (t, seen = new Set()) => {
        if (seen.has(t)) return [];
        seen.add(t);
        const all = this.worlds.flatMap((w) => parse(w.schemaText));
        const own = all.filter((x) => x.type === 'core.slot' && x.attrs.of?.[0] === t && x.attrs.id?.[0] === 'true').map((x) => x.attrs.key[0]);
        if (own.length) return own;
        const parents = all.find((x) => x.type === 'core.type' && (x.attrs.of?.[0] ?? x.id) === t)?.attrs.extends ?? [];
        return parents.map((q) => idsOf(q, seen)).find((k) => k.length) ?? [];
      };
      const ids = idsOf(type);
      const merged = new Map();
      for (const s of world.shards) for (const x of parse(s.text)) {
        if (x.type !== type) continue;
        const attrs = Object.fromEntries(Object.entries(x.attrs).filter(([k]) => k !== 'core.source').map(([k, vs]) => [k, vs.map(tok)]));
        const key = JSON.stringify(ids.map((k) => attrs[k]));
        const f = merged.get(key);
        if (!f) { merged.set(key, { type, attrs, n: out.length }); out.push(merged.get(key)); continue; }
        for (const [k, vs] of Object.entries(attrs)) f.attrs[k] = [...new Set([...(f.attrs[k] ?? []), ...vs])];
      }
    }
    this.byType.set(type, out);
    return out;
  }
  // The facts of a type by the values of one key.
  index(type, key) {
    const id = `${type} ${key}`;
    this.indexes ??= new Map();
    if (!this.indexes.has(id)) {
      const ix = new Map();
      for (const f of this.facts(type)) for (const v of f.attrs[key] ?? []) { if (!ix.has(v)) ix.set(v, []); ix.get(v).push(f); }
      this.indexes.set(id, ix);
    }
    return this.indexes.get(id);
  }
  // The kinds a name is a kind of, all the way up.
  parents(name) {
    if (this.parentsCache.has(name)) return this.parentsCache.get(name);
    const up = new Set(), todo = [name];
    const kinds = () => [...this.facts('k.people.kind'), ...this.facts('k.people.role'), ...this.facts('k.commonsense.thing'), ...this.facts('k.shapes.shape')];
    this.parentsCache.set(name, up);
    while (todo.length) {
      const n = todo.pop();
      for (const f of kinds()) {
        if (!(f.attrs.name ?? []).includes(n)) continue;
        for (const k of ['is_a', 'kind_of', 'is', 'age', ...(f.type.startsWith('k.people.') ? ['drawing'] : [])]) for (const p of f.attrs[k] ?? []) if (!up.has(p) && p !== name) { up.add(p); todo.push(p); }
      }
    }
    return up;
  }
  isA(a, b) { return a === b || this.parents(String(a)).has(String(b)); }
}

// The methods of k.procedures, read from its shards.
export function readMethods(worlds = scanWorlds()) {
  const w = worlds.find((x) => x.id === 'k.procedures');
  const wires = w.shards.flatMap((s) => parse(s.text));
  const of = (type) => wires.filter((x) => x.type === type).map((x) => x.attrs);
  const methods = new Map();
  for (const a of of('k.procedures.method')) methods.set(one(a, 'name'), { name: one(a, 'name'), about: one(a, 'about'), act: one(a, 'act'), world: one(a, 'world'), rank: num(a.rank?.[0]) ?? 1, example: all(a, 'example'), goal: {}, bind: {}, steps: [], conditions: [] });
  const m = (a) => { const x = methods.get(one(a, 'method')); if (!x) throw new Error(`no method ${one(a, 'method')}`); return x; };
  for (const a of of('k.procedures.goal')) m(a).goal[one(a, 'role')] = { from: one(a, 'from'), by: one(a, 'by'), value: one(a, 'value'), kind: one(a, 'kind'), rel: one(a, 'rel'), needed: one(a, 'needed') === 'true', default: one(a, 'default') };
  for (const a of of('k.procedures.binding')) m(a).bind[one(a, 'name')] = { goal: one(a, 'goal'), step: (a.step ?? []).map(num), from: one(a, 'from'), live: one(a, 'live'), history: one(a, 'history') === 'true', upto: one(a, 'upto'), together: all(a, 'together'), value: one(a, 'value'), key: one(a, 'key'), match: {} };
  for (const a of of('k.procedures.match')) {
    const bd = m(a).bind[one(a, 'binding')];
    if (!bd) throw new Error(`match on unknown binding ${one(a, 'binding')}`);
    bd.match[one(a, 'key')] = { value: one(a, 'value'), not: one(a, 'not'), equals: one(a, 'equals'), equals_key: one(a, 'equals_key'), present: a.present ? one(a, 'present') === 'true' : undefined };
  }
  for (const a of of('k.procedures.step')) m(a).steps.push({ n: num(a.n[0]), act: one(a, 'act'), each: one(a, 'each'), after: (a.after ?? []).map(num), expand: one(a, 'expand') !== 'false', optional: one(a, 'optional') === 'true', about: one(a, 'about'), args: [] });
  for (const x of methods.values()) x.steps.sort((p, q) => p.n - q.n);
  for (const a of of('k.procedures.arg')) {
    const st = m(a).steps.find((s) => s.n === num(a.step[0]));
    st.args.push({ role: one(a, 'role'), attribute: one(a, 'attribute'), binding: one(a, 'binding'), key: one(a, 'key'), else_key: one(a, 'else_key'), value: one(a, 'value'), rel: one(a, 'rel'), of: one(a, 'of') });
  }
  for (const a of of('k.procedures.condition')) m(a).conditions.push({ n: num(a.n[0]), step: num(a.step?.[0]), when: one(a, 'when'), fact: one(a, 'fact'), thing: one(a, 'thing'), other: one(a, 'other'), attribute: one(a, 'attribute'), value: one(a, 'value') });
  return [...methods.values()];
}

// A toy live world: things with a kind and attributes, groups, links, the history of acts.
export class Live {
  constructor({ world = null, things = [], history = [], kinds = null } = {}) {
    this.world = world; this.things = new Map(); this.count = new Map(); this.history = history.map((h, i) => ({ at: i + 1, ...h })); this.links = [];
    // plain kind -> the kind of the world schema (for the expected acts: table -> w.seating.table)
    this.schema = world?.startsWith('w.') ? schemaKinds(world) : null;
    this.kinds = kinds ?? this.schema?.kinds ?? null;
    for (const t of things) this.add(t.kind, t.id, t.attrs ?? {}, t);
  }
  add(kind, id, attrs = {}, extra = {}) {
    const k = String(kind);
    if (!id) { const base = k.replace(/\s+/g, '_'); let n = this.count.get(base) ?? 0; do n += 1; while (this.things.has(`${base}${n}`)); this.count.set(base, n); id = `${base}${n}`; }
    const t = { id, kind: k, attrs: { ...attrs }, members: extra.members ?? [], on: extra.on, in: extra.in };
    this.things.set(id, t);
    return t;
  }
  thing(v) { return typeof v === 'object' && v?.id && this.things.get(v.id) === v ? v : (typeof v === 'string' ? this.things.get(v) : undefined); }
}

export class Planner {
  constructor({ worlds = scanWorlds(), knowledge, methods } = {}) {
    this.k = knowledge ?? new Knowledge(worlds); this.methods = methods ?? readMethods(worlds);
    // The roles an act cannot be done without (k.actions `needed`): never left out of a step.
    this.needed = new Set(this.k.facts('k.actions.role').filter((f) => f.attrs.needed?.[0] === 'true').map((f) => `${f.attrs.act[0]} ${f.attrs.name[0]}`));
  }
  // Same name, or one a kind of the other; `thing` and `any` take everything.
  // A fact's value x takes r when r is x or a kind of x (a man is a person, so what holds a person holds a man).
  same(x, r) { return x === r || x === 'thing' || x === 'any' || (x !== undefined && r !== undefined && this.k.isA(r, x)); }
  // The value of `key` of an item: a fact, a live thing, a row, or a name (a name that is no thing stands for a
  // thing of that kind: its kind is the name).
  keyOf(live, item, key) {
    if (item === undefined || item === null) return [];
    if (!key) return [item];
    if (item.type && item.attrs) return item.attrs[key] ?? [];
    const t = live.thing(item);
    if (t) return key === 'kind' ? [t.kind] : key === 'id' ? [t.id] : (t.attrs[key] !== undefined ? [].concat(t.attrs[key]) : []);
    if (typeof item === 'object') return item[key] !== undefined ? [item[key]] : [];
    return key === 'kind' || key === 'name' ? [item] : [];
  }
  kindName(live, v) { const t = live.thing(v); return t ? t.kind : v; }
  show(live, item) {
    if (item && item.type && item.attrs) return item.attrs.name?.[0] ?? JSON.stringify(item.attrs);
    const t = live.thing(item);
    return t ? t.id : String(item);
  }
  roleValue(goal, role, g) { const x = goal.roles?.[role]; return x === undefined ? (g?.default !== undefined ? g.default : undefined) : x; }

  values(ctx, name) {
    const { live, env, method } = ctx;
    if (env.current.has(name)) return [env.current.get(name)];
    const bd = method.bind[name];
    if (!bd) throw new Error(`${method.name}: no binding ${name}`);
    let vals;
    if (bd.goal) {
      const x = this.roleValue(env.goal, bd.goal, method.goal[bd.goal]);
      vals = x === undefined ? [] : [].concat(x && typeof x === 'object' && !Array.isArray(x) && 'value' in x ? x.value : x);
    } else if (bd.step.length) vals = bd.step.flatMap((s) => (env.made.get(s) ?? []).filter((t) => !t.id || live.things.has(t.id)));
    else if (bd.from) vals = this.candidates(ctx, bd).filter((f) => this.passes(ctx, bd, f));
    else if (bd.live) vals = [...live.things.values()].filter((t) => (bd.live === 'any' || this.same(bd.live, t.kind)) && this.passes(ctx, bd, t));
    else if (bd.together.length) vals = bd.together.flatMap((x) => this.values(ctx, x));
    else if (bd.history) vals = [...(live.before ?? live.history)];
    else if (bd.upto) { const n = Number(this.values(ctx, bd.upto)[0] ?? 0); vals = Array.from({ length: n }, (_, i) => i + 1); }
    else vals = bd.value === undefined ? [] : [bd.value];
    if (bd.key) vals = [...new Set(vals.flatMap((x) => this.keyOf(live, x, bd.key)))];
    return vals;
  }
  // The facts a binding of facts can pass: by an index on the key of its first `equals` match (the values it may
  // take are the names it is compared with and the kinds above them), or all the facts of the type.
  candidates(ctx, bd) {
    const all = this.k.facts(bd.from);
    const m = Object.entries(bd.match).find(([, t]) => t.equals);
    if (!m) return all;
    const [key, t] = m;
    const refs = this.values(ctx, t.equals).flatMap((r) => (t.equals_key ? this.keyOf(ctx.live, r, t.equals_key) : [this.kindName(ctx.live, r)]));
    const want = new Set(['thing', 'any']);
    for (const r of refs) { want.add(r); for (const p of this.k.parents(String(r))) want.add(p); }
    const index = this.k.index(bd.from, key);
    return [...new Set([...want].flatMap((w) => index.get(w) ?? []))].sort((a, b) => a.n - b.n);
  }
  passes(ctx, bd, item) {
    for (const [key, t] of Object.entries(bd.match)) {
      const vals = this.keyOf(ctx.live, item, key);
      if (t.present !== undefined && (vals.length > 0) !== t.present) return false;
      if (t.value !== undefined && !vals.includes(t.value)) return false;
      if (t.not !== undefined && vals.includes(t.not)) return false;
      if (t.equals) {
        const refs = this.values(ctx, t.equals).flatMap((r) => (t.equals_key ? this.keyOf(ctx.live, r, t.equals_key) : [this.kindName(ctx.live, r)]));
        if (!vals.some((x) => refs.some((r) => this.same(x, r)))) return false;
      }
    }
    return true;
  }
  holds(ctx, c) {
    const { live } = ctx;
    const vals = this.values(ctx, c.thing);
    const present = (x) => (live.thing(x) ? true : (typeof x === 'string' ? [...live.things.values()].some((t) => this.same(x, t.kind) && x === t.kind) : x !== undefined));
    const things = () => vals.map((x) => live.thing(x) ?? [...live.things.values()].find((t) => t.kind === x)).filter(Boolean);
    const other = () => (c.other ? this.values(ctx, c.other).map((x) => live.thing(x) ?? [...live.things.values()].find((t) => t.kind === x)).filter(Boolean) : []);
    switch (c.fact) {
      case 'exists': return ctx.method.bind[c.thing]?.goal && !ctx.env.current.has(c.thing) ? vals.some(present) : vals.length > 0;
      case 'absent': return ctx.method.bind[c.thing]?.goal && !ctx.env.current.has(c.thing) ? !vals.some(present) : vals.length === 0;
      case 'on': return things().length > 0 && things().every((t) => other().some((o) => t.on === o.id));
      case 'inside': return things().length > 0 && things().every((t) => other().some((o) => t.in === o.id));
      case 'grouped': { const gs = c.other ? other() : [...live.things.values()].filter((g) => g.kind === 'group'); return things().length > 0 && things().every((t) => gs.some((g) => g.members.includes(t.id))); }
      case 'has': return vals.some((x) => { const v = this.keyOf(live, x, c.attribute); return v.length > 0 && (c.value === undefined || v.includes(c.value)); });
      default: throw new Error(`fact ${c.fact}`);
    }
  }
  fits(method, goal, live) {
    if (method.act !== goal.act) return { ok: false, why: 'another act' };
    const asks = [];
    for (const [role, g] of Object.entries(method.goal)) {
      const x = this.roleValue(goal, role, g);
      if (x === undefined) {
        if (g.needed) { asks.push(role); continue; }
        if (g.from || g.value || g.kind || g.rel) return { ok: false, why: `no ${role}` };
        continue;
      }
      const v = x && typeof x === 'object' && !Array.isArray(x) && 'value' in x ? x.value : x;
      const name = this.kindName(live, [].concat(v)[0]);
      if (g.value !== undefined && name !== g.value) return { ok: false, why: `${role} is not ${g.value}` };
      if (g.kind !== undefined && !this.same(g.kind, name)) return { ok: false, why: `${role} is no ${g.kind}` };
      if (g.rel !== undefined && x?.rel !== g.rel) return { ok: false, why: `${role} not ${g.rel}` };
      if (g.from && !this.k.facts(g.from).some((f) => (f.attrs[g.by ?? 'name'] ?? []).some((y) => this.same(y, name)))) return { ok: false, why: `${name} is no ${g.from}` };
    }
    return { ok: true, asks };
  }
  // The method for a goal: those that fit, in this world, whose preconditions hold; the lowest rank, then by name.
  choose(goal, live, above = []) {
    const tried = [];
    const ok = [];
    for (const m of this.methods) {
      if (above.includes(m.name)) continue;
      const f = this.fits(m, goal, live);
      if (!f.ok) { if (m.act === goal.act) tried.push({ method: m.name, why: f.why }); continue; }
      if (m.world && m.world !== live.world) { tried.push({ method: m.name, why: `only in ${m.world}` }); continue; }
      const ctx = { live, method: m, env: { goal, made: new Map(), current: new Map() } };
      const failing = m.conditions.filter((c) => c.when === 'before' && !c.step).find((c) => !this.holds(ctx, c));
      if (failing) { tried.push({ method: m.name, why: `${failing.fact} ${failing.thing}` }); continue; }
      ok.push({ m, asks: f.asks });
    }
    ok.sort((p, q) => p.m.rank - q.m.rank || (p.m.name < q.m.name ? -1 : 1));
    return { chosen: ok[0], others: ok.slice(1).map((x) => x.m.name), tried };
  }
  plan(goal, live, opts = {}) {
    const out = { acts: [], lines: [], skipped: [], methods: [], effects: [], asks: [] };
    const top = this.choose(goal, live);
    if (!top.chosen) return { ...out, refused: true, tried: top.tried };
    if (top.chosen.asks.length) return { ...out, method: top.chosen.m.name, asks: top.chosen.asks };
    out.method = top.chosen.m.name;
    live.before = [...live.history];
    this.expand(top.chosen.m, goal, live, 0, out, [top.chosen.m.name]);
    return out;
  }
  order(method) {
    const done = new Set(), res = [];
    const left = [...method.steps];
    while (left.length) {
      const i = left.findIndex((s) => s.after.every((a) => done.has(a)));
      if (i < 0) throw new Error(`${method.name}: steps in a circle`);
      const [s] = left.splice(i, 1); done.add(s.n); res.push(s);
    }
    return res;
  }
  // `above`: the methods this expansion is inside; none of them is used again below (no method expands into itself).
  expand(method, goal, live, depth, out, above) {
    out.methods.push(method.name);
    const env = { goal, made: new Map(), current: new Map() };
    const ctx = { live, method, env };
    const made = [];
    for (const step of this.order(method)) {
      const items = step.each ? this.values(ctx, step.each) : [undefined];
      for (const item of items) {
        if (step.each) env.current.set(step.each, item);
        const pre = method.conditions.filter((c) => c.when === 'before' && c.step === step.n);
        if (pre.some((c) => !this.holds(ctx, c))) { out.skipped.push(`${method.name} ${step.n}`); continue; }
        const args = [];
        let empty = false;
        for (const a of step.args) {
          let vals;
          if (a.binding) {
            vals = this.values(ctx, a.binding).flatMap((x) => { const k = this.keyOf(live, x, a.key); return k.length || !a.else_key ? (a.key ? k : [x]) : this.keyOf(live, x, a.else_key); });
            if (!a.key) vals = vals.map((x) => (x && x.type && x.attrs ? x.attrs.name?.[0] : x));
          } else vals = [a.value];
          // A goal role the goal does not say is left out of the step; any other filler with no value leaves the step out.
          if (vals.length === 0 || vals[0] === undefined) { if (a.binding && method.bind[a.binding]?.goal && !this.needed.has(`${step.act} ${a.role}`)) continue; empty = true; break; }
          // A filler from a goal role keeps the relation the goal gave it, unless the argument says one.
          let rel = a.rel;
          const bd = a.binding && method.bind[a.binding];
          if (!rel && a.role === 'place' && bd?.goal) { const g = env.goal.roles?.[bd.goal]; if (g && typeof g === 'object' && !Array.isArray(g)) rel = g.rel; }
          const ofv = a.of ? this.values(ctx, a.of).map((x) => live.thing(x) ?? [...live.things.values()].find((t) => t.kind === x) ?? x)[0] : undefined;
          args.push({ ...a, rel, vals, ofv });
        }
        if (empty) { out.skipped.push(`${method.name} ${step.n}${step.each ? ` ${this.show(live, item)}` : ''}`); continue; }
        const sub = step.expand && depth + 1 < MAX_DEPTH ? this.subgoal(step, args, live) : null;
        let things;
        if (sub) {
          const c = this.choose(sub, live, above);
          if (c.chosen && !c.chosen.asks.length) {
            const before = new Set(live.things.keys());
            this.expand(c.chosen.m, sub, live, depth + 1, out, [...above, c.chosen.m.name]);
            things = [...live.things.values()].filter((t) => !before.has(t.id));
          }
        }
        if (!things) things = this.act(step, args, live, out);
        env.made.set(step.n, [...(env.made.get(step.n) ?? []), ...things]);
        made.push(...things);
        if (out.acts.length > MAX_ACTS) throw new Error(`over the budget of ${MAX_ACTS} acts`);
      }
      if (step.each) env.current.delete(step.each);
    }
    for (const c of method.conditions.filter((x) => x.when === 'after')) out.effects.push({ method: method.name, fact: c.fact, thing: c.thing, ok: this.holds(ctx, c) });
    return made;
  }
  subgoal(step, args, live) {
    const roles = {};
    for (const a of args) {
      const v = a.vals.length === 1 ? a.vals[0] : a.vals;
      if (a.role === 'value' && a.attribute) continue;
      roles[a.role] = a.rel || a.ofv ? { value: a.ofv ? (live.thing(a.ofv) ? a.ofv.id : a.ofv) : (live.thing(v)?.id ?? v), rel: a.rel, part: a.ofv ? v : undefined } : (live.thing(v)?.id ?? v);
    }
    return { act: step.act, roles };
  }
  // One act of std.acts' kind, done on the toy world; the line says it as the tests expect it.
  act(step, args, live, out) {
    const words = [step.act === 'take apart' ? 'take_apart' : step.act];
    const shown = (x) => this.show(live, x);
    const get = (role) => args.find((a) => a.role === role && !a.attribute);
    for (const a of args) {
      let vs = a.vals;
      if (a.role === 'kind' && live.kinds) vs = vs.map((k) => live.kinds[k] ?? k);
      words.push(`${a.attribute ?? a.role}=${vs.map(shown).join(',')}`);
      if (a.ofv !== undefined) words.push(`of=${shown(a.ofv)}`);
      if (a.rel) words.push(`rel=${a.rel}`);
    }
    out.lines.push(words.join(' '));
    out.acts.push({ act: step.act, args });
    const attrs = Object.fromEntries(args.filter((a) => a.role === 'value' && a.attribute).map((a) => [a.attribute, a.vals.length === 1 ? (live.thing(a.vals[0])?.id ?? a.vals[0]) : a.vals]));
    const placeOf = (a) => (a ? (a.ofv !== undefined ? live.thing(a.ofv) : (live.thing(a.vals[0]) ?? [...live.things.values()].find((t) => t.kind === a.vals[0]))) : undefined);
    const record = (thing) => live.history.push({ act: step.act, thing, at: live.history.length + 1 });
    switch (step.act) {
      case 'make': {
        const n = Number(get('number')?.vals[0] ?? 1);
        const p = get('place'), target = placeOf(p);
        const res = [];
        for (let i = 0; i < n; i++) res.push(live.add(get('kind').vals[0], undefined, attrs, { on: p?.rel === 'on' && target ? target.id : undefined, in: p?.rel === 'in' && target ? target.id : undefined }));
        record(res[0]?.id);
        return res;
      }
      case 'place': {
        const p = get('place'), target = placeOf(p);
        for (const x of get('thing').vals) { const t = live.thing(x); if (t && target) { if (p.rel === 'in') t.in = target.id; else t.on = target.id; } }
        record(shown(get('thing').vals[0]));
        return [];
      }
      case 'remove': for (const x of get('thing').vals) live.things.delete(live.thing(x)?.id); record(shown(get('thing').vals[0])); return [];
      case 'change': record(shown(get('thing').vals[0])); return [];
      case 'connect': live.links.push([shown(get('thing').vals[0]), shown(get('target')?.vals[0])]); record(shown(get('thing').vals[0])); return [];
      case 'group': { const g = live.add('group', undefined, { name: get('group')?.vals[0] }, { members: get('thing').vals.map((x) => live.thing(x)?.id).filter(Boolean) }); record(g.id); return [g]; }
      case 'take apart': live.things.delete(live.thing(get('thing').vals[0])?.id); record(shown(get('thing').vals[0])); return [];
      case 'ask': {
        const counts = new Map();
        for (const x of get('thing')?.vals ?? []) { const t = live.thing(x); if (t) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1); }
        return [...counts].sort((p, q) => (p[0] < q[0] ? -1 : 1)).map(([kind, count]) => ({ kind, count }));
      }
      default: record(undefined); return [];
    }
  }
}
