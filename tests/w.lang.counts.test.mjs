// The plural categories of w.lang.en and w.lang.ro as facts (the library's Q79, reviewer 2026-11-15 16:45): CLDR 48's
// rules, evaluated here and compared with Intl.PluralRules (which reads CLDR) on integers and decimals; and the template
// rows of each language name only its categories, with every category of a counted template present.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const shardsOf = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));

// CLDR plural rule syntax (operands n, i, v; and, or, =, !=, %, ranges a..b and lists), enough for these rules
const evalRule = (rule, s) => {
  const v = (s.split('.')[1] ?? '').length, n = Number(s), i = Math.trunc(n);
  const ops = { n, i, v };
  return rule.split(/\s+or\s+/).some((and) => and.split(/\s+and\s+/).every((rel) => {
    const m = /^(\w)(?:\s*%\s*(\d+))?\s*(!=|=)\s*(.+)$/.exec(rel.trim());
    const x = m[2] ? ops[m[1]] % Number(m[2]) : ops[m[1]];
    const hit = m[4].split(',').some((r) => { const [a, b] = r.split('..').map(Number); return b === undefined ? x === a : x >= a && x <= b && Number.isInteger(x); });
    return m[3] === '=' ? hit : !hit;
  }));
};
const categoryOf = (rules, s) => rules.find((r) => r.rule && evalRule(r.rule, s))?.class ?? 'other';

for (const [lang, code] of [['w.lang.en', 'en'], ['w.lang.ro', 'ro']]) {
  test(`${lang}: the CLDR plural rules give Intl.PluralRules('${code}')'s category for 0 to 300 and for decimals`, () => {
    const rules = shardsOf(lang).filter((w) => w.type === `${lang}.count`).map((w) => ({ class: one(w, 'class'), rule: one(w, 'rule') }));
    assert.ok(rules.some((r) => r.class === 'other' && !r.rule), 'other is the rest');
    for (const x of [...Array.from({ length: 301 }, (_, k) => String(k)), '0.5', '1.0', '1.5', '2.25', '10.0', '1001', '1019', '1020']) {
      assert.equal(categoryOf(rules, x), new Intl.PluralRules(code, { minimumFractionDigits: (x.split('.')[1] ?? '').length }).select(Number(x)), `${code} ${x}`);
    }
  });
}

test('w.lang.ro: 1 casă, 3 case, 19 case, 20 de case, 101 case, 120 de case (one, few, other) and the reply rows name these categories', () => {
  const rules = shardsOf('w.lang.ro').filter((w) => w.type === 'w.lang.ro.count').map((w) => ({ class: one(w, 'class'), rule: one(w, 'rule') }));
  assert.deepEqual(['1', '3', '19', '20', '101', '120'].map((x) => categoryOf(rules, x)), ['one', 'few', 'few', 'other', 'few', 'other']);
  for (const [lang, type] of [['w.lang.ro', 'reply'], ['w.lang.ro', 'request'], ['w.lang.en', 'reply']]) {
    const classes = new Set(shardsOf(lang).filter((w) => w.type === `${lang}.count`).map((w) => one(w, 'class')));
    for (const w of shardsOf(lang).filter((x) => x.type === `${lang}.${type}` && x.attrs.count)) assert.ok(classes.has(one(w, 'count')), `${w.id}: ${one(w, 'count')}`);
  }
});
