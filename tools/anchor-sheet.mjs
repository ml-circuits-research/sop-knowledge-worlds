// Pictures for looking at anchors: the preview of a k.objects object with a 10-unit grid (--grid) or with its
// anchors drawn on it (a red line for an edge, a red dot for a point, a red box otherwise), as PNG contact sheets.
//   node tools/anchor-sheet.mjs <out-dir> --grid <object, object, ...>      to choose the place of an anchor
//   node tools/anchor-sheet.mjs <out-dir> [--table points|parts|all]        to check the anchors of the tables
// Needs rsvg-convert and ImageMagick's montage on the path; nothing of it is published.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { fileOf } from './render-svg.mjs';
import { contactSheets } from './contact-sheet.mjs';
import { readAnchors, readAnchorPoints } from './layouts-core.mjs';

const PREVIEW = join(WORLDS_DIR, 'k.objects', 'preview');
const body = (name) => readFileSync(join(PREVIEW, `${fileOf(name)}.svg`), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const grid = () => {
  let s = '';
  for (let i = 0; i <= 100; i += 10) {
    s += `<line x1="${i}" y1="0" x2="${i}" y2="100" stroke="#06c" stroke-width="${i % 50 ? 0.15 : 0.4}"/><line x1="0" y1="${i}" x2="100" y2="${i}" stroke="#06c" stroke-width="${i % 50 ? 0.15 : 0.4}"/>`;
    if (i > 0 && i < 100) s += `<text x="${i}" y="-1.5" font-size="3.4" text-anchor="middle" fill="#06c">${i}</text><text x="-1.5" y="${i + 1.2}" font-size="3.4" text-anchor="end" fill="#06c">${i}</text>`;
  }
  return s;
};
const mark = (a, i) => {
  const [x, y, w, h] = a.box;
  const shape = w === 0 && h === 0 ? `<circle cx="${x}" cy="${y}" r="2" fill="#e00" stroke="#fff" stroke-width="0.5"/>`
    : w === 0 || h === 0 ? `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="#e00" stroke-width="1.6"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e00" fill-opacity="0.15" stroke="#e00" stroke-width="0.8"/>`;
  return `${shape}<text x="${Math.min(92, x + w / 2 + 2)}" y="${Math.max(5, y - 2)}" font-size="5" font-weight="bold" fill="#e00" stroke="#fff" stroke-width="0.25">${i + 1}</text>`;
};
export function picture(name, { withGrid = false, anchors = [] } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-7 -7 114 114" width="342" height="342"><rect x="-7" y="-7" width="114" height="114" fill="#fff"/>${body(name)}${withGrid ? grid() : ''}${anchors.map(mark).join('')}</svg>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [out, ...rest] = process.argv.slice(2);
  mkdirSync(join(out, 'svg'), { recursive: true });
  const rows = [];
  if (rest[0] === '--grid') {
    for (const name of rest.slice(1).join(' ').split(',').map((x) => x.trim()).filter(Boolean)) {
      const f = join(out, 'svg', `${fileOf(name)}.svg`);
      writeFileSync(f, picture(name, { withGrid: true }));
      rows.push([f, name]);
    }
  } else {
    const which = rest[0] === '--table' ? rest[1] : 'points';
    const read = (p) => readFileSync(join(REPO, p), 'utf8');
    const all = [...(which !== 'points' ? readAnchors(read('sources/hand-core/anchors.tsv')) : []), ...(which !== 'parts' ? readAnchorPoints(read('sources/hand-core/anchor-points.tsv')) : [])];
    const by = new Map();
    for (const a of all) by.set(a.object, [...(by.get(a.object) ?? []), a]);
    for (const [name, anchors] of by) {
      const f = join(out, 'svg', `${fileOf(name)}.svg`);
      writeFileSync(f, picture(name, { anchors }));
      rows.push([f, `${name}|${anchors.map((a, i) => `${i + 1} ${a.name}`).join(', ')}`]);
    }
  }
  const pages = contactSheets(rows, out, { cols: 4, rowsPerPage: 3, size: 330 });
  console.log(`${rows.length} pictures on ${pages.length} sheets in ${out}`);
}
