// A reference reading of the choice points proposed for k.procedures (questions.md Q57): `choose`, `choose_min` and
// `about` on a binding, `differs`, `soft` and `n` on a match. It solves the choose bindings of one method jointly
// (depth-first, candidates in a seeded weighted order, every match whose bindings are all known checked as soon as
// they are) and gives the chosen values. It is a reader of the proposed format for the tests, not a planner: the
// expansion of the steps stays the library's std.plan (the chosen values are handed to it as `value` bindings by
// `fixChoices`). Delete this file when std.plan reads `choose` (one planner, no copy; reviewer 12:05).
const tok = (t) => (typeof t === 'string' && t.startsWith('"') ? JSON.parse(t) : t);
const one = (f, k) => f.attrs[k]?.[0];
const all = (f, k) => f.attrs[k] ?? [];

// The facts of a method from a fact store (sopworld factStore): bindings in the order told, matches per binding.
export function methodFacts(store, name, prefix = 'k.procedures') {
  const mine = (t) => store.facts(`${prefix}.${t}`).filter((f) => one(f, 'method') === name);
  const bind = new Map();
  for (const f of mine('binding')) bind.set(one(f, 'name'), {
    name: one(f, 'name'), goal: one(f, 'goal'), from: one(f, 'from'), live: one(f, 'live'), history: one(f, 'history') === 'true', together: all(f, 'together'),
    value: one(f, 'value'), about: one(f, 'about'), key: one(f, 'key'), choose: one(f, 'choose'), choose_min: one(f, 'choose_min'), match: [],
  });
  for (const f of mine('match')) bind.get(one(f, 'binding')).match.push({ key: one(f, 'key'), value: one(f, 'value'), not: one(f, 'not'), equals: one(f, 'equals'), equals_key: one(f, 'equals_key'), differs: one(f, 'differs'), present: f.attrs.present ? one(f, 'present') === 'true' : undefined, soft: one(f, 'soft') === 'true' });
  return bind;
}

// The statements of the catalog about a thing: one row per fact of a type named `name` that names it and per key
// the fact says (not the name, not the source). `types`: the types to read (the facts about things, not drawings).
export function statementsAbout(store, types, thing) {
  const rows = [];
  for (const type of types) for (const f of store.index(type, 'name').get(thing) ?? []) {
    for (const [key, vs] of Object.entries(f.attrs)) {
      if (['name', 'named', 'derived', 'drawing', 'sense'].includes(key)) continue;
      for (const value of vs) rows.push({ thing, type, key, value });
    }
  }
  return rows;
}

/**
 * Solves the choose bindings of a method. `ctx`: { store, isA(a, b) (a is b or a kind below it), goal (role ->
 * filler), history ([{ act, thing }]), live ([{ id, kind }]), types (for `about`), rnd (0 <= rnd() < 1, or null:
 * the first solution) }. Returns { chosen: Map(binding -> [values]), values(name) } or null when there is none.
 */
export function solveChoices(bind, ctx) {
  const { store, isA, rnd = null } = ctx;
  const chooseNames = [...bind.values()].filter((b) => b.choose !== undefined).map((b) => b.name);
  // The choices made so far; every change bumps `ver`, so the values of a binding are computed once per state of the
  // choices (a test of one candidate reads the same bindings again for every match and every other candidate).
  const chosen = new Map();
  let ver = 0;
  const memo = new Map();
  const asg = { get: (n) => chosen.get(n), has: (n) => chosen.has(n), set: (n, v) => { ver += 1; chosen.set(n, v); }, delete: (n) => { ver += 1; chosen.delete(n); } };
  // The name of a value: a fact's name (a k.scenes.has fact: its scene), a statement's key, a history entry's act, a
  // live thing's id.
  const nameOf = (x) => (x && typeof x === 'object' ? (x.attrs ? tok(one(x, 'name') ?? one(x, 'scene') ?? one(x, 'thing')) : x.type && x.key ? x.key : x.act ?? x.id) : x);
  const keyVals = (x, k) => {
    if (x === undefined || x === null) return [];
    if (!k) return [nameOf(x)];
    if (x.attrs) return all(x, k).map(tok);
    if (typeof x === 'object') return x[k] !== undefined ? [x[k]] : [];
    return k === 'name' || k === 'kind' ? [x] : [];
  };
  // The values of a binding under the current choices (undefined while a choose binding it reads is not chosen).
  function values(name, own = false) {
    const k = `${own ? 1 : 0} ${name}`, m = memo.get(k);
    if (m && m.ver === ver) return m.val;
    const val = valuesNow(name, own);
    memo.set(k, { ver, val });
    return val;
  }
  function valuesNow(name, own) {
    const b = bind.get(name);
    if (!b) throw new Error(`no binding ${name}`);
    if (b.choose !== undefined && !own) return asg.get(name);
    let vals;
    if (b.goal) vals = ctx.goal?.[b.goal] !== undefined ? [ctx.goal[b.goal]] : [];
    else if (b.value !== undefined) vals = [b.value];
    else if (b.history) vals = (ctx.history ?? []).map((h, i) => ({ ...h, at: i + 1 }));
    else if (b.live) vals = (ctx.live ?? []).filter((t) => b.live === 'any' || isA(t.kind, b.live));
    else if (b.from) vals = store.facts(b.from);
    else if (b.about) { const th = values(b.about); if (th === undefined) return undefined; vals = th.flatMap((t) => statementsAbout(store, ctx.types, nameOf(t))); }
    else if (b.together.length) { vals = []; for (const t of b.together) { const v = values(t); if (v === undefined) return undefined; vals.push(...v); } }
    else vals = [];
    const out = [];
    // Its own candidates (own): a match that reads a binding not yet chosen is left for later; anything else that
    // reads one is not known yet.
    for (const x of vals) { const r = test(b, x, own); if (r === undefined) return undefined; if (r) out.push(x); }
    return b.key ? [...new Set(out.flatMap((x) => keyVals(x, b.key)))] : out;
  }
  // Does candidate x of binding b hold its matches? undefined: a binding it reads is not known yet (and `strict` is false).
  function test(b, x, strict = true, others = []) {
    for (const m of b.match) {
      if (m.soft) continue;
      const vs = keyVals(x, m.key);
      if (m.present !== undefined && (vs.length > 0) !== m.present) return false;
      if (m.value !== undefined && !vs.includes(m.value)) return false;
      if (m.not !== undefined && vs.includes(m.not)) return false;
      for (const [ref, how] of [[m.equals, 'equals'], [m.differs, 'differs']]) {
        if (!ref) continue;
        if (ref === b.name && how === 'differs') { if (others.some((o) => keyVals(o, m.key).some((v) => vs.includes(v)))) return false; continue; }
        const rv = values(ref);
        if (rv === undefined) { if (strict) continue; return undefined; }
        const names = rv.flatMap((r) => keyVals(r, m.equals_key));
        if (how === 'equals' && !vs.some((v) => names.some((u) => v === u || isA(u, v)))) return false;
        if (how === 'differs' && vs.some((v) => names.includes(v))) return false;
      }
    }
    return true;
  }
  const weight = (b, x) => b.match.filter((m) => m.soft && m.equals).reduce((w, m) => {
    const rv = values(m.equals); if (!rv) return w;
    const names = rv.flatMap((r) => keyVals(r, m.equals_key));
    return keyVals(x, m.key).some((v) => names.includes(v)) ? w * 2 : w;
  }, 1);
  const order = (b, xs) => {
    if (!rnd) return xs;
    return xs.map((x) => ({ x, k: Math.pow(rnd(), 1 / weight(b, x)) })).sort((p, q) => q.k - p.k).map((p) => p.x); // weighted shuffle (Efraimidis-Spirakis)
  };
  const count = (v) => (v === undefined ? undefined : /^\d+$/.test(String(v)) ? Number(v) : Number(tok(values(v)?.[0])));
  // Every match of the chosen bindings that reads binding `name`, checked again now that it is chosen.
  // (A binding that takes a key's values was filtered as facts: its chosen values must still be among its candidates.)
  const recheck = () => chooseNames.filter((n) => asg.has(n)).every((n) => {
    const b = bind.get(n);
    if (b.key) { const now = values(n, true); return asg.get(n).every((x) => now.includes(x)); }
    return asg.get(n).every((x, i, xs) => test(b, x, true, xs.filter((_, j) => j !== i)));
  });
  let steps = 0;
  function solve(i) {
    if (i === chooseNames.length) return true;
    const b = bind.get(chooseNames[i]);
    let cands = values(b.name, true);
    // `ctx.fixed` (binding -> names): check a hand-traced choice instead of searching (only those names are candidates).
    if (cands && ctx.fixed?.[b.name]) cands = cands.filter((x) => [].concat(ctx.fixed[b.name]).includes(nameOf(x)));
    if (!cands || !cands.length) return false;
    const hi = count(b.choose), lo = b.choose_min !== undefined ? count(b.choose_min) : hi;
    const sizes = [];
    for (let k = Math.min(hi, cands.length); k >= lo; k -= 1) sizes.push(k);
    if (rnd) sizes.sort(() => rnd() - 0.5);
    for (const k of sizes) {
      if (k === 0) { asg.set(b.name, []); if (recheck() && solve(i + 1)) return true; asg.delete(b.name); continue; }
      const pool = order(b, b.key ? cands : cands.filter((x) => test(b, x)));
      // Greedy fill of k different values that hold the matches between them, then deeper; a few restarts.
      for (let start = 0; start < Math.min(pool.length, 60); start += 1) {
        if ((steps += 1) > 200000) throw new Error('choose: search budget spent');
        const pick = [pool[start]];
        for (const x of pool) { if (pick.length === k) break; if (x !== pool[start] && (b.key || test(b, x, true, pick))) pick.push(x); }
        if (pick.length < k) continue;
        asg.set(b.name, pick);
        if (recheck() && solve(i + 1)) return true;
        asg.delete(b.name);
      }
    }
    return false;
  }
  if (!solve(0)) return null;
  return { chosen, values: (n) => values(n), nameOf };
}

// The method's facts with each choose binding replaced by what was chosen: one value binding per value (`together`
// of them when there are several), so that std.plan expands the steps with the choices made (script-convertible).
export function fixChoices(store, method, chosen, nameOf, prefix = 'k.procedures') {
  const facts = { binding: [], match: [] };
  for (const f of store.facts(`${prefix}.binding`).filter((x) => one(x, 'method') === method)) {
    const name = one(f, 'name');
    if (!chosen.has(name)) { facts.binding.push(f); continue; }
    const vals = chosen.get(name).map(nameOf);
    if (vals.length === 1) facts.binding.push({ ...f, attrs: { method: f.attrs.method, name: [name], value: [vals[0]] } });
    else {
      vals.forEach((v, i) => facts.binding.push({ ...f, attrs: { method: f.attrs.method, name: [`${name}_${i + 1}`], value: [v] } }));
      facts.binding.push({ ...f, attrs: { method: f.attrs.method, name: [name], together: vals.map((_, i) => `${name}_${i + 1}`) } });
    }
  }
  for (const f of store.facts(`${prefix}.match`).filter((x) => one(x, 'method') === method && !chosen.has(one(x, 'binding')))) facts.match.push(f);
  return facts;
}
