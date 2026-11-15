// tzdata (IANA time zone database, public domain) -> k.time.zone facts (block 15:35 item 3): one fact per zone of
// zone1970.tab (the zones whose clocks have agreed since 1970): its countries (ISO 3166 two-letter codes, the join to
// k.geo.country by code2), the latitude and longitude of its principal place, the file's comment, and its UTC offset in
// minutes in January and in July of YEAR (read through Intl, whose tz release must be the files' release: the tool
// stops otherwise), with `summer_time` when the two differ. Deterministic for one release.
//   node tools/import/tzdata.mjs [--raw sources/tzdata/raw]     writes docs/worlds/k.time/shards/zones-*.sop
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wire, header, text, byText } from './lib.mjs';

export const YEAR = 2026;
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'worlds', 'k.time', 'shards');
// ±DDMM or ±DDDMM, then ±DDMMSS or ±DDDMMSS forms: degrees with minutes (and seconds), rounded to 0.01 degree
const coord = (s, degDigits) => { const sign = s[0] === '-' ? -1 : 1, d = s.slice(1); const deg = +d.slice(0, degDigits), min = +d.slice(degDigits, degDigits + 2), sec = +(d.slice(degDigits + 2) || 0); return Math.round(sign * (deg + min / 60 + sec / 3600) * 100) / 100; };
export function readZones(tab) {
  return tab.split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [codes, at, zone, comment] = l.split('\t');
    const m = at.match(/^([+-]\d+)([+-]\d+)$/);
    const latS = m[1], lonS = m[2];
    return { zone, codes: codes.split(','), lat: coord(latS, 2), lon: coord(lonS, 3), comment: comment?.trim() || undefined };
  });
}
// the UTC offset of a zone at an instant, in minutes ("GMT+05:30" -> 330)
export function offset(zone, date) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(date).find((x) => x.type === 'timeZoneName').value;
  const m = p.match(/GMT(?:([+-])(\d{2}):(\d{2}))?/);
  return m[1] ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0;
}
export function zoneShards(zones, release) {
  const src = `tzdata ${release}`;
  const lines = zones.sort((a, b) => byText(a.zone, b.zone)).map((z) => {
    const jan = offset(z.zone, new Date(Date.UTC(YEAR, 0, 15, 12))), jul = offset(z.zone, new Date(Date.UTC(YEAR, 6, 15, 12)));
    return wire(`k.time.zone.${z.zone.replace(/[^A-Za-z0-9]+/g, '_')}`, 'k.time.zone', [['name', z.zone], ...z.codes.map((c) => ['country_code', c]), ['lat', z.lat], ['lon', z.lon],
      ['offset_january', jan], ['offset_july', jul], ['summer_time', jan !== jul], ['about', z.comment && text(z.comment)]], src);
  });
  // two shards by the first part of the name: Africa, America, Antarctica, Arctic, Asia | Atlantic, Australia, Europe, Indian, Pacific
  const first = (l) => /name="?([A-Za-z]+)/.exec(l)[1];
  const groups = { 'zones-africa-asia': (r) => /^(Africa|America|Antarctica|Arctic|Asia)$/.test(r), 'zones-atlantic-pacific': (r) => !/^(Africa|America|Antarctica|Arctic|Asia)$/.test(r) };
  const files = {};
  for (const [id, keep] of Object.entries(groups)) {
    const ls = lines.filter((l) => keep(first(l)));
    files[`${id}.sop`] = `${header({ id: `k.time/shards/${id}`, about: `${ls.length} time zones of the IANA time zone database (zone1970.tab, ${release}): countries (ISO 3166 codes), the principal place's latitude and longitude, the UTC offsets in minutes in January and July ${YEAR}, summer time.`,
      sources: [`tzdata ${release} (the IANA time zone database: zone1970.tab, and the offsets of the same release through Intl)`], license: 'public-domain', script: 'tools/import/tzdata.mjs' })}\n${ls.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--raw'); const raw = i > 0 ? process.argv[i + 1] : join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'sources', 'tzdata', 'raw');
  const release = readFileSync(join(raw, 'version.txt'), 'utf8').match(/version (\S+)/)[1];
  if (process.versions.tz !== release) { console.error(`the files are tzdata ${release}, Intl has ${process.versions.tz}: the offsets would come from another release`); process.exit(1); }
  const files = zoneShards(readZones(readFileSync(join(raw, 'zone1970.tab'), 'utf8')), release);
  for (const old of readdirSync(DIR)) if (old.startsWith('zones-') && old.endsWith('.sop')) rmSync(join(DIR, old));
  for (const [n, t] of Object.entries(files)) { writeFileSync(join(DIR, n), t); console.log(n, t.split('\n').filter((l) => l.startsWith('@')).length, 'wires', Buffer.byteLength(t), 'bytes'); }
}
