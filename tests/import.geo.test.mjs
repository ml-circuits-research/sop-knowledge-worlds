// tools/import/geo.mjs: a small made-up world (two countries, a river across both, a mountain, a range), and, when
// the raw files are present (git-ignored), that the k.geo shards on disk are what the importer gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { importGeo, continentOf } from '../tools/import/geo.mjs';

const square = (x, y, s) => ({ type: 'Polygon', coordinates: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]] });
const country = (code, name, x, extra = {}) => ({ properties: { TYPE: 'Sovereign country', ADMIN: name, ADM0_A3: code, NAME: name, NAME_LONG: name, NAME_EN: name, FORMAL_EN: `Republic of ${name}`, CONTINENT: 'Europe', REGION_UN: 'Europe', SUBREGION: 'Western Europe', POP_EST: 1000.4, LABEL_X: x + 5, LABEL_Y: 5, ...extra }, geometry: square(x, 0, 10) });
const input = {
  countries: [
    { cca3: 'AAA', borders: ['BBB'], area: 100, landlocked: true },
    { cca3: 'BBB', borders: ['AAA', 'ZZZ'], area: 100.5, landlocked: false },
    { cca3: 'ZZZ', borders: [], area: 1, landlocked: false },
  ],
  admin: [country('AAA', 'Aland', 0), country('BBB', 'Bee Land', 10, { NAME: 'Bee' }), { properties: { TYPE: 'Indeterminate', ADMIN: 'Nowhere', ADM0_A3: 'NNN' }, geometry: square(50, 50, 1) }],
  places: [
    { properties: { name: 'Acity', adm0_a3: 'AAA', featurecla: 'Admin-0 capital', pop_max: 500, latitude: 5, longitude: 5 } },
    { properties: { name: 'Small', adm0_a3: 'AAA', featurecla: 'Populated place', pop_max: 10, latitude: 1, longitude: 1 } },
    { properties: { name: 'Big  Town', adm0_a3: 'BBB', featurecla: 'Populated place', pop_max: 900, latitude: 2, longitude: 12 } },
    { properties: { name: 'Lost', adm0_a3: 'QQQ', featurecla: 'Populated place', pop_max: 5, latitude: 0, longitude: 0 } },
  ],
  rivers: [
    { properties: { name: 'Fluss', name_en: 'Flow', rivernum: 1 }, geometry: { type: 'LineString', coordinates: [[2, 2], [8, 3]] } },
    { properties: { name: 'Flow', name_en: null, rivernum: 2 }, geometry: { type: 'MultiLineString', coordinates: [[[8.2, 3], [15, 4]]] } },
    { properties: { name: null, rivernum: 3 }, geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] } },
  ],
  elevations: [
    { properties: { featurecla: 'mountain', name: 'Mount High', elevation: 1234.4, region: 'Europe' }, geometry: { type: 'Point', coordinates: [12, 8] } },
    { properties: { featurecla: 'pass', name: 'A Pass', elevation: 10, region: 'Europe' }, geometry: { type: 'Point', coordinates: [1, 1] } },
  ],
  regions: [{ properties: { FEATURECLA: 'Range/mtn', NAME: 'HIGH HILLS', NAME_EN: null, REGION: 'Europe' }, geometry: square(11, 6, 3) }],
};

test('the geo importer writes a public-domain shard and a borders shard per continent', () => {
  const { files, stats } = importGeo(input, { citiesPerCountry: 1 });
  assert.deepEqual(Object.keys(files).sort(), ['africa.sop', 'antarctica.sop', 'asia.sop', 'europe-borders.sop', 'europe.sop', 'north-america.sop', 'oceania.sop', 'south-america.sop']);
  assert.deepEqual(stats, { countries: 2, borders: 2, cities: 2, rivers: 1, mountains: 1, ranges: 1, words: 2, dropped: { countries: 1, cities: 1, rivers: 1, mountains: 0 } });
  const lines = (f) => files[f].split('\n').filter((l) => l.startsWith('@'));
  assert.deepEqual(lines('europe.sop'), [
    '@k.geo.continent.europe k.geo.continent name=Europe core.source="natural-earth 5.1.2"',
    '@k.geo.country.AAA k.geo.country name=Aland code=AAA official="Republic of Aland" capital=Acity continent=Europe region="Western Europe" population=1000 independent=true lat=5 lon=5 west=0 south=0 east=10 north=10 core.source="natural-earth 5.1.2"',
    '@k.geo.country.BBB k.geo.country name="Bee Land" code=BBB official="Republic of Bee Land" continent=Europe region="Western Europe" population=1000 independent=true lat=5 lon=15 west=10 south=0 east=20 north=10 core.source="natural-earth 5.1.2"',
    '@k.geo.city.AAA.Acity k.geo.city name=Acity country=Aland capital_of=Aland population=500 lat=5 lon=5 core.source="natural-earth 5.1.2"',
    '@k.geo.city.BBB.Big_Town k.geo.city name="Big Town" country="Bee Land" population=900 lat=2 lon=12 core.source="natural-earth 5.1.2"',
    '@k.geo.river.Flow.europe k.geo.river name=Flow continent=Europe country=Aland country="Bee Land" lat=3 lon=8.5 west=2 south=2 east=15 north=4 core.source="natural-earth 5.1.2"',
    '@k.geo.mountain.Mount_High.europe k.geo.mountain name="Mount High" continent=Europe country="Bee Land" elevation=1234 lat=8 lon=12 core.source="natural-earth 5.1.2"',
    '@k.geo.range.High_Hills.europe k.geo.range name="High Hills" continent=Europe lat=7.5 lon=12.5 west=11 south=6 east=14 north=9 core.source="natural-earth 5.1.2"',
    '@k.geo.word.AAA core.word text="Republic of Aland" means=Aland of=k.geo.country.name core.source="natural-earth 5.1.2"',
    '@k.geo.word.BBB core.word text=Bee text="Republic of Bee Land" means="Bee Land" of=k.geo.country.name core.source="natural-earth 5.1.2"',
  ]);
  assert.deepEqual(lines('europe-borders.sop'), [
    '@k.geo.borders.AAA k.geo.country name=Aland neighbour="Bee Land" area=100 landlocked=true core.source="countries 5.1.0"',
    '@k.geo.borders.BBB k.geo.country name="Bee Land" neighbour=Aland area=100.5 landlocked=false core.source="countries 5.1.0"',
  ]);
  assert.ok(files['europe.sop'].includes('# license: public-domain'));
  assert.ok(files['europe-borders.sop'].includes('# license: ODbL-1.0'));
  assert.deepEqual(importGeo(input, { citiesPerCountry: 1 }).files, files);
});

test('continents of islands in the open ocean come from the UN region', () => {
  assert.equal(continentOf({ CONTINENT: 'Seven seas (open ocean)', REGION_UN: 'Africa' }), 'Africa');
  assert.equal(continentOf({ CONTINENT: 'Seven seas (open ocean)', REGION_UN: 'Americas', SUBREGION: 'South America' }), 'South America');
  assert.equal(continentOf({ CONTINENT: 'Seven seas (open ocean)', REGION_UN: 'Seven seas (open ocean)' }), 'Antarctica');
});

const ne = join(REPO, 'sources/natural-earth/raw');
const list = join(REPO, 'sources/countries/raw/countries.json');
test('the k.geo shards on disk are what the importer gives from the raw files', { skip: !(existsSync(join(ne, 'ne_50m_admin_0_countries.geojson')) && existsSync(list)) && 'raw files not downloaded' }, () => {
  const features = (f) => JSON.parse(readFileSync(join(ne, `${f}.geojson`), 'utf8')).features;
  const { files } = importGeo({
    countries: JSON.parse(readFileSync(list, 'utf8')), admin: features('ne_50m_admin_0_countries'), places: features('ne_10m_populated_places_simple'),
    rivers: features('ne_10m_rivers_lake_centerlines'), elevations: features('ne_10m_geography_regions_elevation_points'), regions: features('ne_10m_geography_regions_polys'),
  });
  const dir = join(WORLDS_DIR, 'k.geo', 'shards');
  assert.deepEqual(readdirSync(dir).sort(), Object.keys(files).sort());
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(join(dir, name), 'utf8'), text, name);
});
