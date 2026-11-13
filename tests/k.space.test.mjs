// k.space (Round 9 item 4): the numbers and colours of the planets, the Sun, the Moon and the stars agree with
// each other; the kinds say what they are.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, fullWorld } from '../tools/lib/worlds.mjs';
import { sample } from '../tools/ask-sample.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const num = (w, k) => Number(one(w, k));
const space = fullWorld('k.space', worlds);
const bodies = space.ofType('k.space.body');
const planets = bodies.filter((b) => one(b, 'kind') === 'planet').sort((a, b) => num(a, 'order') - num(b, 'order'));

test('every planet has a colour and why, the length of its day and year, its width and its distance from the Sun', () => {
  assert.equal(planets.length, 8);
  for (const p of planets) {
    for (const k of ['colour', 'colour_why', 'day_hours_about', 'orbit_years', 'diameter_about', 'distance_about', 'rings']) assert.ok(p.attrs[k]?.length, `${p.id}: ${k}`);
    assert.ok(p.attrs.moons || p.attrs.moons_about, p.id);
    assert.match(one(p, 'colour_why'), /^[A-Z].{20,110}\.$/, p.id);
    assert.deepEqual(p.attrs.named, ['model'], p.id);
  }
});

test('the numbers agree: farther planets have longer years; the size rank is the order of the widths; days and years of one orbit agree', () => {
  for (let i = 1; i < planets.length; i++) {
    assert.ok(num(planets[i], 'distance_about') > num(planets[i - 1], 'distance_about'), planets[i].id);
    assert.ok(num(planets[i], 'orbit_years') > num(planets[i - 1], 'orbit_years'), planets[i].id);
  }
  const byWidth = [...planets].sort((a, b) => num(b, 'diameter_about') - num(a, 'diameter_about')).map((p) => one(p, 'name'));
  assert.deepEqual(byWidth, [...planets].sort((a, b) => num(a, 'size_rank') - num(b, 'size_rank')).map((p) => one(p, 'name')));
  // Kepler's third law, as a check on two columns written apart: years squared = (distance in Earth distances) cubed.
  const earth = num(planets[2], 'distance_about');
  for (const p of planets) { const a = num(p, 'distance_about') / earth; assert.ok(Math.abs(num(p, 'orbit_years') ** 2 / a ** 3 - 1) < 0.08, `${p.id}: ${num(p, 'orbit_years') ** 2 / a ** 3}`); }
  for (const b of bodies) if (b.attrs.orbit_days_about && b.attrs.orbit_years) assert.ok(Math.abs(num(b, 'orbit_days_about') / (num(b, 'orbit_years') * 365.25) - 1) < 0.05, b.id);
  const by = (name) => bodies.find((b) => one(b, 'name') === name);
  assert.ok(num(by('Sun'), 'diameter_about') > 9 * num(by('Jupiter'), 'diameter_about'));
  assert.ok(num(by('Moon'), 'diameter_about') < num(by('Mercury'), 'diameter_about') && num(by('Ganymede'), 'diameter_about') > num(by('Mercury'), 'diameter_about'));
  assert.ok(num(by('Proxima Centauri'), 'light_years_about') < num(by('Alpha Centauri'), 'light_years_about') && num(by('Alpha Centauri'), 'light_years_about') < num(by('Sirius'), 'light_years_about'));
});

test('every kind says in one sentence what it is', () => {
  const kinds = space.ofType('k.space.kind');
  assert.ok(kinds.length >= 11);
  for (const k of kinds) assert.match(one(k, 'about'), /^An? .{25,120}\.$/, k.id);
  for (const b of bodies) assert.ok(kinds.some((k) => one(k, 'name') === one(b, 'kind')), b.id);
});

test('natural questions (Round 9 item 8): of the seeded sample of 100 about space, at least 90 find a fact', () => {
  const r = sample('space');
  assert.equal(r.asked, 100);
  assert.ok(r.found >= 90, `${r.found} of 100`);
});
