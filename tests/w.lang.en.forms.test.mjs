// KR2 item 4 (reviewer 16:45): verb forms, plurals and degrees have one home, w.lang.en. Every form word still in
// k.words or k.actions is one the pinned library does not confirm from w.lang.en (analyse / inflectBy); the report
// lists them by class.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { formChecker, report } from '../tools/forms-report.mjs';

const check = formChecker();

test('forms: the report is what the tool gives; no form left in k.words is one w.lang.en confirms', () => {
  const r = report(check);
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'FORMS-REPORT.md'), 'utf8'), r.text);
  assert.equal(r.confirmed, 0);
  assert.equal(r.kept.length, r.all);
  assert.ok(r.all <= 60, `${r.all} form words left`);
});

test('forms: k.actions keeps only forms w.lang.en does not confirm; the library confirms the common ones', () => {
  const dir = join(WORLDS_DIR, 'k.actions', 'shards');
  const kept = readdirSync(dir).flatMap((f) => [...readFileSync(join(dir, f), 'utf8').matchAll(/core\.word (.*) means=(\S+) of=k\.actions\.action\.name/g)].flatMap((m) => [...m[1].matchAll(/text=(\S+)/g)].map((x) => [m[2], x[1]])));
  for (const [lemma, f] of kept) assert.ok(!check(lemma, f), `${lemma} ${f}`);
  for (const [lemma, f] of [['go', 'went'], ['mouse', 'mice'], ['big', 'bigger'], ['stop', 'stopped'], ['marry', 'married'], ['peg', 'pegged'], ['petty', 'pettier']]) assert.ok(check(lemma, f), `${lemma} ${f}`);
});
