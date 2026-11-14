// Declared joins (Q61): the joins declared on schema slots (`type=T by=k`) are the source of truth for k.kinds.relation;
// docs/worlds/k.kinds/JOINS-REPORT.md checks them against every shard and lists the keys whose values name things of a
// type without a declared join. Undeclared or broken joins are WARNINGS (a diagnostic), never a failure: another world
// growing must not make this test red. It fails only on a malformed declaration (a target type no schema declares, or
// a key the target type does not have) and when k.kinds.relation does not follow a declared join.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds } from '../tools/lib/worlds.mjs';
import { joinsReport, reportText, REPORT } from '../tools/joins-report.mjs';
import { parse } from '../tools/sopworld/sopworld.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const worlds = scanWorlds();
const report = joinsReport(worlds);
const warn = (t, lines) => { for (const l of lines) t.diagnostic(l); if (lines.length) console.log(`warning: ${lines.join('\n  ')}`); };

test('every declared join names a declared type and one of its keys', () => {
  assert.ok(report.declared.length >= 10, `${report.declared.length}`);
  assert.deepEqual(report.declared.filter((d) => d.malformed).map((d) => `${d.type}.${d.key}: ${d.malformed}`), []);
  console.log(`declared joins: ${report.declared.length}; values ${report.declared.reduce((n, d) => n + d.values, 0)}, open ${report.declared.reduce((n, d) => n + d.open.length, 0)}; undeclared ${report.undeclared.length}; kept ${report.kept.length}`);
});

test('k.kinds.relation reads the declared joins first (found=declared, the target as the object type, object_by)', () => {
  const dir = join(WORLDS_DIR, 'k.kinds', 'shards');
  const rel = new Map(readdirSync(dir).filter((f) => f.startsWith('relations-')).flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')))
    .filter((w) => w.type === 'k.kinds.relation').map((w) => [`${tok(w.attrs.type[0])}.${tok(w.attrs.key[0])}`, w]));
  let n = 0;
  for (const d of report.declared.filter((x) => x.world.startsWith('k.'))) {
    const r = rel.get(`${d.type}.${d.key}`);
    assert.ok(r, `${d.type}.${d.key}: no relation (run node tools/relations-core.mjs)`);
    assert.equal(tok(r.attrs.found?.[0]), 'declared', `${d.type}.${d.key}`);
    assert.equal(tok(r.attrs.object_type?.[0]), d.target, `${d.type}.${d.key}`);
    assert.equal(tok(r.attrs.object_by?.[0]), d.by, `${d.type}.${d.key}`);
    n++;
  }
  // and no relation says declared where no join is declared
  const declared = new Set(report.declared.map((d) => `${d.type}.${d.key}`));
  assert.deepEqual([...rel].filter(([k, w]) => tok(w.attrs.found?.[0]) === 'declared' && !declared.has(k)).map(([k]) => k), []);
  assert.ok(n >= 10);
});

test('WARNS on broken and undeclared joins and on a stale report (never fails on them)', (t) => {
  const broken = report.declared.filter((d) => d.broken && !d.malformed).map((d) => `broken join ${d.type}.${d.key} -> ${d.target} by ${d.by}: ${d.meet} of ${d.values} values meet`);
  const open = report.declared.filter((d) => d.open.length && !d.broken).map((d) => `open values of ${d.type}.${d.key}: ${d.open.length} of ${d.values} (${d.open.slice(0, 3).join(', ')})`);
  const undeclared = report.undeclared.map((u) => `undeclared join ${u.type}.${u.key} -> ${u.candidates[0]} by ${u.by} (${u.meet} of ${u.values} values meet)`);
  warn(t, broken);
  warn(t, open.slice(0, 20));
  warn(t, undeclared.slice(0, 20));
  if (undeclared.length > 20) warn(t, [`... and ${undeclared.length - 20} more undeclared (docs/worlds/k.kinds/JOINS-REPORT.md)`]);
  const text = reportText(report);
  if (!existsSync(REPORT) || readFileSync(REPORT, 'utf8') !== text) warn(t, ['docs/worlds/k.kinds/JOINS-REPORT.md is stale: run node tools/joins-report.mjs (npm run build does)']);
  assert.ok(true);
});
