// k.time version 2 (reviewer block 2026-11-14 02:15): order in time. Every cycle's members have positions 1..n (or
// 0..23), `next` names a member of the same cycle and goes round once; one rule makes "before" for every pair of a
// cycle; the seasons by hemisphere agree with the months; durations are told in several units.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';

const w = fullWorld('k.time', scanWorlds());
const v = (f, k) => (f.attrs[k] ?? []).map((x) => (x.startsWith('"') ? JSON.parse(x) : x));
const one = (f, k) => v(f, k)[0];

test('every cycle: its members have distinct positions, `next` goes round once through all of them, from first to last', () => {
  const cycles = w.ofType('k.time.cycle');
  assert.deepEqual(cycles.map((c) => one(c, 'name')).sort(), ['clock', 'day', 'seasons', 'week', 'year']);
  for (const c of cycles) {
    const members = w.ofType(one(c, 'of'));
    assert.equal(members.length, Number(one(c, 'length')), one(c, 'name'));
    for (const m of members) assert.equal(one(m, 'cycle'), one(c, 'name'));
    const byName = new Map(members.map((m) => [one(m, 'name'), m]));
    const ns = members.map((m) => Number(one(m, 'n'))).sort((a, b) => a - b);
    assert.equal(new Set(ns).size, ns.length);
    assert.equal(one(byName.get(one(c, 'first')), 'n'), String(ns[0]));
    assert.equal(one(byName.get(one(c, 'last')), 'n'), String(ns.at(-1)));
    // Walking `next` from the first visits every member once and comes back: the cyclic case.
    let at = one(c, 'first'); const seen = [];
    do { seen.push(at); at = one(byName.get(at), 'next'); assert.ok(byName.has(at), `${one(c, 'name')}: next ${at}`); } while (at !== one(c, 'first') && seen.length <= members.length);
    assert.equal(seen.length, members.length, one(c, 'name'));
    // The successor is the next position, except the last, whose successor is the first.
    for (const m of members) {
      const n = Number(one(m, 'n')), nn = Number(one(byName.get(one(m, 'next')), 'n'));
      assert.equal(nn, n === ns.at(-1) ? ns[0] : n + 1, one(m, 'name'));
    }
  }
});

test('one rule makes "before" for every pair of a cycle: n(n-1)/2 facts per cycle, none across cycles', () => {
  const before = w.ofType('k.time.before');
  const count = {};
  for (const b of before) count[one(b, 'cycle')] = (count[one(b, 'cycle')] ?? 0) + 1;
  assert.deepEqual(count, { week: 21, year: 66, seasons: 6, day: 6, clock: 276 });
  const is = (a, b) => before.some((f) => one(f, 'earlier') === a && one(f, 'later') === b);
  assert.ok(is('Monday', 'Friday'));          // Monday is before Friday
  assert.ok(!is('Friday', 'Monday'));
  assert.ok(is('November', 'December'));      // December is after November
  assert.ok(is('spring', 'autumn'));
  assert.ok(is('morning', 'evening'));
  assert.ok(is('noon', '3 pm'));
  assert.ok(!is('March', 'Friday') && !is('Friday', 'March')); // two cycles are not compared
  // All of it comes from the rule, none is told.
  for (const b of before) { const step = w.why(b.id, 'earlier').steps[0]; assert.equal(step.how, 'rule'); assert.match(step.rule, /k\.time\.order$/); }
  // "Spring comes after winter" and "after December comes January" are `next`, the cyclic successor.
  assert.equal(w.query({ type: 'k.time.season', where: { name: 'winter' }, seek: 'next' }).value, 'spring');
  assert.equal(w.query({ type: 'k.time.month', where: { name: 'December' }, seek: 'next' }).value, 'January');
});

test('seasons by hemisphere: first and last month come from the months by rule and agree with them', () => {
  const months = w.ofType('k.time.month').sort((a, b) => one(a, 'n') - one(b, 'n')).map((m) => [one(m, 'name'), one(m, 'season_north'), one(m, 'season_south')]);
  const got = w.ofType('k.time.season_in');
  assert.equal(got.length, 8);
  for (const [h, col] of [['north', 1], ['south', 2]]) for (const s of ['spring', 'summer', 'autumn', 'winter']) {
    const f = got.find((x) => one(x, 'season') === s && one(x, 'hemisphere') === h);
    const idx = months.map((m, i) => (m[col] === s ? i : -1)).filter((i) => i >= 0);
    // the run of months of this season, cyclically (winter in the north: 11, 0, 1)
    const startI = idx.find((i) => months[(i + 11) % 12][col] !== s), endI = idx.find((i) => months[(i + 1) % 12][col] !== s);
    assert.equal(one(f, 'first'), months[startI][0], `${s} ${h}`);
    assert.equal(one(f, 'last'), months[endI][0], `${s} ${h}`);
  }
  assert.equal(one(got.find((x) => one(x, 'season') === 'winter' && one(x, 'hemisphere') === 'north'), 'first'), 'December');
});

test('every hour is in the part of the day whose hours hold it', () => {
  const parts = new Map(w.ofType('k.time.part_of_day').map((p) => [one(p, 'name'), [Number(one(p, 'starts_about')), Number(one(p, 'ends_about'))]]));
  for (const h of w.ofType('k.time.hour')) {
    const n = Number(one(h, 'n')), [a, b] = parts.get(one(h, 'part'));
    assert.ok(a < b ? n >= a && n < b : n >= a || n < b, one(h, 'name'));
    assert.equal(Number(one(h, 'hour12')), n % 12 || 12);
    assert.equal(one(h, 'am_pm'), n < 12 ? 'am' : 'pm');
  }
});

test('durations: several units for one span, each fact one count or one count_about, and the units agree with one another', () => {
  const d = w.ofType('k.time.duration');
  for (const f of d) assert.ok(!(f.attrs.count && f.attrs.count_about), one(f, 'name'));
  const exact = new Map(d.filter((f) => f.attrs.count).map((f) => [`${one(f, 'name')}|${one(f, 'unit')}`, Number(one(f, 'count'))]));
  // in seconds, by the exact facts: minute 60 s, hour 60 min, day 24 h
  const sec = (name) => (name === 'second' ? 1 : name === 'minute' ? 60 * sec('second') : name === 'hour' ? 60 * sec('minute') : name === 'day' ? 24 * sec('hour') : name === 'week' ? 7 * sec('day') : null);
  for (const [k, n] of exact) { const [name, unit] = k.split('|'); if (sec(name) && sec(unit)) assert.equal(n * sec(unit), sec(name), k); }
  assert.deepEqual(d.filter((f) => one(f, 'name') === 'week').map((f) => one(f, 'unit')).sort(), ['day', 'hour']);
  assert.equal(exact.get('fortnight|week') * 7, exact.get('fortnight|day'));
});
