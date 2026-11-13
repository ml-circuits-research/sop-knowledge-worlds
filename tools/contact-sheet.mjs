// Contact sheets for looking at drawings: the previews of k.objects objects, each with a caption, as PNG pages.
//   node tools/contact-sheet.mjs <list.tsv> <out-dir> [--cols 8] [--rows 5] [--size 150] [--preview <dir>]
// list.tsv: one row per picture: the object name (its preview is <preview>/<file name>.svg) or the path of an SVG
// file, a tab, and the caption (a "|" in the caption starts a second line). Needs rsvg-convert and ImageMagick's
// montage on the path; nothing of it is published.
import { readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { fileOf } from './render-svg.mjs';

export function contactSheets(rows, out, { cols = 8, rowsPerPage = 5, size = 150, preview = join(WORLDS_DIR, 'k.objects', 'preview') } = {}) {
  mkdirSync(join(out, 'cells'), { recursive: true });
  const per = cols * rowsPerPage;
  const pages = [];
  for (let p = 0; p * per < rows.length; p++) {
    const args = [];
    rows.slice(p * per, (p + 1) * per).forEach(([name, caption], i) => {
      const svg = name.endsWith('.svg') ? name : join(preview, `${fileOf(name)}.svg`);
      const png = join(out, 'cells', `${p}-${i}.png`);
      if (existsSync(svg)) execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-b', 'white', '-o', png, svg]);
      else execFileSync('convert', ['-size', `${size}x${size}`, 'xc:#fdd', png]);
      args.push('-label', (caption ?? name).replace(/\|/g, '\n'), png);
    });
    const page = join(out, `sheet-${String(p + 1).padStart(2, '0')}.png`);
    execFileSync('montage', [...args, '-tile', `${cols}x`, '-geometry', `${size}x${size}+6+4`, '-pointsize', '12', '-background', 'white', page]);
    pages.push(page);
  }
  rmSync(join(out, 'cells'), { recursive: true });
  return pages;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [list, out, ...rest] = process.argv.slice(2);
  const opt = (name, dflt) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : dflt; };
  const rows = readFileSync(list, 'utf8').split('\n').filter((l) => l.trim()).map((l) => l.split('\t'));
  const pages = contactSheets(rows, out, { cols: Number(opt('cols', 8)), rowsPerPage: Number(opt('rows', 5)), size: Number(opt('size', 150)), preview: opt('preview', undefined) });
  console.log(`${rows.length} pictures on ${pages.length} sheets in ${out}`);
}
