// Declared joins and the value share (Q61): the joins declared on schema slots (`type=T by=k`, sopworld 0.60+) are the
// source of truth for what a key's values name; this report checks them against the facts of every shard and lists
// the keys whose values name things of another type without a declared join.
//   node tools/joins-report.mjs      writes docs/worlds/k.kinds/JOINS-REPORT.md
// Three lists:
//   - declared joins: for each, how many distinct values of the key meet a target (a T fact with that value under k,
//     compared as sopworld compares them since 0.109: a quoted atom and the bare atom are one name, Q70) over all shards of all worlds, whatever order they load in; the
//     values that meet none are the joins a host sees open (`world.check()` reports them as `open-join`);
//   - broken: declared joins where fewer than half of the values meet a target, or whose target type or key no
//     schema declares;
//   - undeclared: keys of knowledge types without a declared join whose values the value share of
//     tools/relations-core.mjs joins to a type (`found=value` in k.kinds.relation), with the exact share: each is a
//     join to declare (`type=T by=k` on the slot) or a reason to write down why not.
// The report is a report: tests/k.kinds.joins-report.test.mjs warns on undeclared or broken joins, it never fails
// because another world grew.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './sopworld/sopworld.mjs';
import { WORLDS_DIR, scanWorlds } from './lib/worlds.mjs';
import { relationRows, readTypes } from './relations-core.mjs';
import { scanSchemas } from './lib/schemas.mjs';
import { byText } from './import/lib.mjs';

// A quoted string whose text is an atom and the bare atom are one name (sopworld 0.109; Q70, reviewer 15:00).
const ATOM = /^[A-Za-z_][\w.:-]*$/; // the engine's text of a bare atom
export const fold = (v) => { const m = /^"(.*)"$/.exec(v); return m && ATOM.test(m[1]) ? m[1] : v; };

export const REPORT = join(WORLDS_DIR, 'k.kinds', 'JOINS-REPORT.md');
// Keys left undeclared on purpose, with the reason (the report lists them apart, not as gaps).
export const NOT_DECLARED = [
  ['k.time.ordered', 'next', 'k.time.ordered', 'the next of a month is a month, of an hour an hour: a join to the fact\'s own type cannot be declared once on the shared parent'],
];

// What a declared join was measured to cost (the report prints it under the declared joins): type, key, measure.
export const MEASURED = [
  ['k.objects.part', 'of', 'loading k.objects (27,904 parts joined to 2,212 objects; `fullWorld`, 7 pairs undeclared/declared run back to back in alternating order, the schema patched in memory, sopworld 0.113.0) takes CPU 16.6 s -> 17.0 s (medians; the mean difference of the pairs is -0.1 s, from -1.6 to +1.1 s: no cost above the noise) and wall 26.4 s -> 26.1 s (medians, under a load of 4.7 to 6.6 on 2 CPUs); 0 open values, `world.check()` issues unchanged (1,460). With the scan of 0.97 it was 16.4 s -> 22.8-25.0 s on a quiet machine, so it waited for the pin (Q69, 2026-11-15)'],
];

// The slots of every schema (own and inherited) with a declared join, and every slot's keys per type.
export function declaredJoins(worlds) {
  const own = new Map(), parents = new Map();
  // the fact worlds and the world schemas without facts (w.face, w.document...: their joins are declared too)
  const ids = new Set(worlds.map((w) => w.id));
  for (const w of [...worlds, ...scanSchemas().filter((x) => !ids.has(x.id))]) for (const x of parse(w.schemaText)) {
    if (x.type === 'core.type') parents.set(x.attrs.of[0], { world: w.id, extends: x.attrs.extends ?? [] });
    if (x.type === 'core.slot') { const t = x.attrs.of[0]; if (!own.has(t)) own.set(t, []); own.get(t).push({ key: x.attrs.key[0], attrs: x.attrs, world: w.id }); }
  }
  const joins = [];
  for (const [t, slots] of own) for (const s of slots) if (s.attrs.by && s.attrs.type) {
    joins.push({ world: s.world, type: t, key: s.key, target: s.attrs.type[0], by: s.attrs.by[0], match: (s.attrs.match ?? []).map((m) => String(m).split(':')) });
  }
  // the slot of a key on a type, its own or the nearest inherited one
  const slotOf = (t, key, seen = new Set()) => (seen.has(t) ? null : (seen.add(t), (own.get(t) ?? []).find((s) => s.key === key)?.attrs ?? (parents.get(t)?.extends ?? []).map((p) => slotOf(p, key, seen)).find(Boolean) ?? null));
  const slotKeys = (t, seen = new Set()) => (seen.has(t) ? [] : (seen.add(t), [...(own.get(t) ?? []).map((s) => s.key), ...(parents.get(t)?.extends ?? []).flatMap((p) => slotKeys(p, seen))]));
  // a join on a parent type holds for the facts of every type that extends it
  const children = (t) => [t, ...[...parents].filter(([, p]) => p.extends.includes(t)).flatMap(([c]) => children(c))];
  return { joins: joins.sort((a, b) => byText(`${a.type} ${a.key}`, `${b.type} ${b.key}`)), declaredTypes: new Set(parents.keys()), slotKeys, slotOf, children };
}

// The facts of every shard of every world, read once: per type, the facts (attrs only).
function readFacts(worlds) {
  const facts = new Map();
  for (const w of worlds) for (const s of w.shards) for (const x of parse(s.text)) {
    if (!facts.has(x.type)) facts.set(x.type, []);
    facts.get(x.type).push(x.attrs);
  }
  return facts;
}

export function joinsReport(worlds = scanWorlds()) {
  const { joins, declaredTypes, slotKeys, slotOf, children } = declaredJoins(worlds);
  const facts = readFacts(worlds);
  const factsOf = (t) => children(t).flatMap((c) => facts.get(c) ?? []);
  const declared = [];
  for (const j of joins) {
    const malformed = !declaredTypes.has(j.target) ? `no schema declares ${j.target}` : !slotKeys(j.target).includes(j.by) ? `${j.target} has no key ${j.by}` : null;
    // the target values: one set per key value of the join (by and every match key)
    const index = new Map();
    for (const a of facts.get(j.target) ?? []) for (const v of (a[j.by] ?? []).map(fold)) { if (!index.has(v)) index.set(v, []); index.get(v).push(a); }
    const values = new Map(); // value -> meets
    for (const a of factsOf(j.type)) for (const v of a[j.key] ?? []) {
      if (v.startsWith('$')) continue;
      const meets = (index.get(fold(v)) ?? []).some((t) => j.match.every(([mine, theirs]) => (a[mine] ?? []).map(fold).some((x) => (t[theirs || mine] ?? []).map(fold).includes(x))));
      values.set(fold(v), (values.get(fold(v)) ?? false) || meets);
    }
    const open = [...values].filter(([, m]) => !m).map(([v]) => v).sort(byText);
    declared.push({ ...j, values: values.size, meet: values.size - open.length, open, malformed, broken: Boolean(malformed) || (values.size > 0 && (values.size - open.length) * 2 < values.size) });
  }
  // the value share's suggestions for keys without a declared join (relations of knowledge types, found=value, a
  // type that names things other than words, on a key without an enum)
  const types = readTypes(worlds);
  const isDeclared = new Set(joins.map((j) => `${j.type} ${j.key}`));
  const skipped = new Map(NOT_DECLARED.map(([t, k, target, why]) => [`${t} ${k}`, { target, why }]));
  const undeclared = [], kept = [], enums = [];
  for (const r of relationRows(worlds)) {
    if (r.found !== 'value' || !r.object_type.length || r.object_type[0] === 'k.words.sense' || isDeclared.has(`${r.type} ${r.key}`)) continue;
    const target = r.object_type[0], by = types.get(target)?.naming;
    if (!by) continue;
    const names = new Set((facts.get(target) ?? []).flatMap((a) => (a[by] ?? []).map(fold)));
    const vals = [...new Set(factsOf(r.type).flatMap((a) => (a[r.key] ?? []).filter((v) => !v.startsWith('$'))))];
    const row = { world: r.world, type: r.type, key: r.key, object: r.object, candidates: r.object_type, by, values: vals.length, meet: vals.filter((v) => names.has(fold(v))).length };
    // a key with an enum takes one of the values its slot lists (k.people.given_name.context=person), not a name of
    // another type: it is never suggested as a join. Listed apart, with the enum's size: an enum that copies another
    // world's names (the 11 basic colours) is KR2's to replace by a join, a decision per enum, not a suggestion here.
    const en = slotOf(r.type, r.key)?.enum;
    if (en) { enums.push({ ...row, enum: en.length }); continue; }
    // a key inherited from a parent is reported once, on the type that declares the slot
    const why = skipped.get(`${r.type} ${r.key}`) ?? [...skipped].find(([tk]) => tk.endsWith(` ${r.key}`) && children(tk.split(' ')[0]).includes(r.type))?.[1];
    (why ? kept : undeclared).push({ ...row, why: why?.why });
  }
  return { declared, undeclared, kept, enums };
}

const cell = (s) => String(s).replace(/\|/g, '\\|');
const list = (vs, n = 6) => vs.slice(0, n).map((v) => `\`${cell(v)}\``).join(', ') + (vs.length > n ? `, … (${vs.length})` : '');

export function reportText({ declared, undeclared, kept, enums = [] }) {
  const broken = declared.filter((d) => d.broken);
  const vals = declared.reduce((n, d) => n + d.values, 0), meet = declared.reduce((n, d) => n + d.meet, 0);
  const worlds = new Set(declared.map((d) => d.world));
  const out = [
    '# Joins: declared on the slots, checked against the facts',
    '',
    'Generated by `node tools/joins-report.mjs` (part of `npm run build`); `tests/k.kinds.joins-report.test.mjs` recomputes it',
    'and **warns** on undeclared or broken joins, it never fails because another world grew (Q61).',
    '',
    'A join is declared on the slot whose values name things of another type: `type=T by=k` (sopworld 0.60+, deferred',
    'per value since 0.70): the value names the `T` fact whose `k` is that value. The declared joins are the source of',
    'truth for `k.kinds.relation` (`found=declared`, `object_by`); the share of values that name things of a type',
    '(`found=value`) is only a suggestion, listed below until the join is declared or the reason not to is written down.',
    'Values are compared as sopworld compares them (since 0.109): a quoted atom and the bare atom are one name (`"horse"` and `horse`); a string with spaces stays a string.',
    '',
    `- declared joins: **${declared.length}** in ${worlds.size} worlds; distinct values ${vals}, meeting a target ${meet} (${vals ? Math.round((meet / vals) * 1000) / 10 : 0} %), open ${vals - meet}`,
    `- broken (under half of the values meet a target, or the target is not declared): **${broken.length}**`,
    `- undeclared keys whose values the value share joins to a type: **${undeclared.length}**; left undeclared on purpose: ${kept.length}; keys with an enum, never suggested: ${enums.length}`,
    '',
    '## Declared joins',
    '',
    '| world | type.key | target | by | values | meet | open values |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
    ...declared.map((d) => `| ${d.world} | \`${d.type}.${d.key}\` | \`${d.target}\` | ${d.by}${d.match.length ? ` (match ${d.match.map((m) => m.join(':')).join(', ')})` : ''} | ${d.values} | ${d.meet} | ${d.malformed ? `**${d.malformed}**` : list(d.open)} |`),
    '',
    '## Measured cost of declared joins',
    '',
    ...MEASURED.map(([t, k, m]) => `- \`${t}.${k}\`: ${m}`),
    '',
    '## Broken joins',
    '',
    ...(broken.length ? broken.map((d) => `- \`${d.type}.${d.key}\` -> \`${d.target}\` by ${d.by}: ${d.malformed ?? `${d.meet} of ${d.values} values meet a target`}`) : ['None.']),
    '',
    '## Undeclared: keys whose values name things of a type (the value share)',
    '',
    'Each is a join to declare on the slot (`type=<first candidate> by=<by>`), or to leave with a reason. The share is',
    'exact (as sopworld compares names) against the first candidate; the value share itself also folds case and plurals. A key',
    'whose slot has an enum is never suggested here (see the last section).',
    '',
    '| world | type.key | class | candidates | by | values | meet |',
    '| --- | --- | --- | --- | --- | ---: | ---: |',
    ...undeclared.map((u) => `| ${u.world} | \`${u.type}.${u.key}\` | ${u.object} | ${u.candidates.map((c) => `\`${c}\``).join(', ')} | ${u.by} | ${u.values} | ${u.meet} |`),
    '',
    '## Left undeclared on purpose',
    '',
    ...kept.map((u) => `- \`${u.type}.${u.key}\` -> \`${u.candidates[0]}\` (${u.meet} of ${u.values} values meet): ${u.why}`),
    '',
    '## Keys with an enum (never suggested as joins)',
    '',
    'A key whose slot lists its values (`enum=`) takes one of them; that the values are also names of some type is no',
    'join to declare (`k.people.given_name.context=person` is not the drawing "person"). Listed for the review of enums',
    'copied from another world (KR2: enums joined, not copied), which decides per enum.',
    '',
    '| world | type.key | enum values | values used | names of the first candidate | candidates |',
    '| --- | --- | ---: | ---: | ---: | --- |',
    ...enums.map((u) => `| ${u.world} | \`${u.type}.${u.key}\` | ${u.enum} | ${u.values} | ${u.meet} | ${u.candidates.map((c) => `\`${c}\``).join(', ')} |`),
    '',
  ];
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = joinsReport();
  writeFileSync(REPORT, reportText(r));
  console.log(`JOINS-REPORT.md: ${r.declared.length} declared joins (${r.declared.filter((d) => d.broken).length} broken), ${r.undeclared.length} undeclared, ${r.kept.length} kept`);
}
