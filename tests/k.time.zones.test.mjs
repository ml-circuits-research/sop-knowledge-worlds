// k.time.zone (block 15:35 item 3): the IANA time zones (tzdata, public domain), tools/import/tzdata.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR, factsOf, scanWorlds } from '../tools/lib/worlds.mjs';
import { readZones, zoneShards, offset } from '../tools/import/tzdata.mjs';

const worlds = scanWorlds();
const zones = factsOf('k.time', 'k.time.zone', worlds);
const unq = (v) => String(v).replace(/^"|"$/g, '');
const one = (f, k) => unq(f.attrs[k][0]);
const byName = (n) => zones.find((z) => one(z, 'name') === n);

const RAW = join(REPO, 'sources', 'tzdata', 'raw');
const release = existsSync(join(RAW, 'version.txt')) ? readFileSync(join(RAW, 'version.txt'), 'utf8').match(/version (\S+)/)[1] : null;
test('the zone shards are what the importer gives from the raw files of the same release as Intl', { skip: (!release && 'raw files not copied (sources/tzdata/SOURCE.md)') || (release !== process.versions.tz && `Intl has tz ${process.versions.tz}, the files ${release}`) }, () => {
  for (const [n, t] of Object.entries(zoneShards(readZones(readFileSync(join(RAW, 'zone1970.tab'), 'utf8')), release))) assert.equal(readFileSync(join(WORLDS_DIR, 'k.time', 'shards', n), 'utf8'), t, n);
});

test('the zones: every one with countries, a place and two offsets; summer time when they differ; known cases', () => {
  assert.ok(zones.length >= 300, `${zones.length} zones`);
  for (const z of zones) assert.equal(one(z, 'summer_time'), String(one(z, 'offset_january') !== one(z, 'offset_july')), z.id);
  assert.deepEqual(['offset_january', 'offset_july', 'summer_time'].map((k) => one(byName('Europe/Bucharest'), k)), ['120', '180', 'true']);
  assert.deepEqual(['offset_january', 'offset_july', 'summer_time'].map((k) => one(byName('Asia/Kolkata'), k)), ['330', '330', 'false']);
  assert.equal(one(byName('America/New_York'), 'offset_january'), '-300');
  assert.equal(one(byName('Asia/Tokyo'), 'summer_time'), 'false');
  // every country code but Antarctica's is a country of k.geo (the declared join by code2)
  const codes = new Set(factsOf('k.geo', 'k.geo.country', worlds).flatMap((c) => (c.attrs.code2 ?? []).map(unq)));
  const missing = [...new Set(zones.flatMap((z) => z.attrs.country_code.map(unq)).filter((c) => !codes.has(c)))];
  assert.deepEqual(missing, ['AQ']);
  assert.equal(offset('Asia/Kathmandu', new Date(Date.UTC(2026, 0, 15, 12))), 345, 'offsets in minutes, not only hours');
});
