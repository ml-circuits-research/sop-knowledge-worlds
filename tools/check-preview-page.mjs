// Opens the published page of the scene previews in headless Chrome and checks that the pictures are not empty
// backgrounds: in every picture a fair share of the pixels has a colour that is not one of its background colours.
// (A scene picture that refers to other files is drawn empty when a page shows it with <img>; that happened once.)
//   node tools/check-preview-page.mjs [--keep out.png]
// Part of `npm run build`. Without Chrome on the machine it says so and checks nothing.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { WORLDS_DIR } from './lib/worlds.mjs';

// The pixels of a PNG file (8 bit, RGB or RGBA, not interlaced): { width, height, at(x, y) -> [r, g, b] }.
export function readPng(buf) {
  let p = 8, width = 0, height = 0, channels = 0;
  const data = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), body = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4);
      if (body[8] !== 8 || (body[9] !== 2 && body[9] !== 6) || body[12] !== 0) throw new Error('only 8 bit RGB or RGBA PNG, not interlaced');
      channels = body[9] === 6 ? 4 : 3;
    }
    if (type === 'IDAT') data.push(body);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(data)), stride = width * channels, px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], row = y * stride, src = y * (stride + 1) + 1;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? px[row + i - channels] : 0, b = y ? px[row - stride + i] : 0, c = y && i >= channels ? px[row - stride + i - channels] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      px[row + i] = (raw[src + i] + pred) & 255;
    }
  }
  return { width, height, at: (x, y) => [px[(y * width + x) * channels], px[(y * width + x) * channels + 1], px[(y * width + x) * channels + 2]] };
}

const chrome = ['google-chrome', 'chromium', 'chromium-browser'].find((c) => spawnSync(c, ['--version']).status === 0);
if (!chrome) { console.log('check-preview-page: no Chrome on this machine, nothing checked'); process.exit(0); }
const dir = join(WORLDS_DIR, 'k.scenes', 'preview');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const imgs = [...html.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)"/g)].map((m) => ({ src: m[1], w: Number(m[2]), h: Number(m[3]) }));
if (!imgs.length) throw new Error('the page shows no picture');
// The same pictures on a plain page, each at a known place, so that the screenshot can be read picture by picture.
const tmp = mkdtempSync(join(tmpdir(), 'preview-page-'));
const COLS = 2, CELL_W = 500, CELL_H = 620;
const cells = imgs.map((i, k) => `<img src="file://${join(dir, i.src)}" width="${i.w}" height="${i.h}" style="position:absolute;left:${(k % COLS) * CELL_W}px;top:${Math.floor(k / COLS) * CELL_H}px">`).join('\n');
writeFileSync(join(tmp, 'page.html'), `<!DOCTYPE html><html><body style="margin:0;background:#fff">\n${cells}\n</body></html>\n`);
const pageH = Math.ceil(imgs.length / COLS) * CELL_H;
const shoot = (url, out, w, h) => execFileSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--virtual-time-budget=8000', `--window-size=${w},${h}`, `--screenshot=${out}`, url], { stdio: 'ignore' });
shoot(`file://${join(tmp, 'page.html')}`, join(tmp, 'page.png'), COLS * CELL_W, pageH);
const png = readPng(readFileSync(join(tmp, 'page.png')));
const bad = [];
imgs.forEach((i, k) => {
  const x0 = (k % COLS) * CELL_W, y0 = Math.floor(k / COLS) * CELL_H;
  // The background colours are those of the left edge of the picture; a drawn thing has other colours.
  const back = new Set();
  for (let y = 0; y < i.h; y++) back.add(png.at(x0 + 1, y0 + y).join());
  let other = 0, all = 0;
  for (let y = 0; y < i.h; y += 2) for (let x = 0; x < i.w; x += 2) { all++; if (!back.has(png.at(x0 + x, y0 + y).join())) other++; }
  if (other < all * 0.03) bad.push(`${i.src}: only ${other} of ${all} sampled pixels are not background`);
});
// And the published page itself opens and is not blank below its heading.
shoot(`file://${join(dir, 'index.html')}`, join(tmp, 'index.png'), 1220, 900);
const page = readPng(readFileSync(join(tmp, 'index.png')));
const colours = new Set();
for (let y = 150; y < page.height; y += 3) for (let x = 0; x < page.width; x += 3) colours.add(page.at(x, y).join());
if (colours.size < 50) bad.push(`index.html: only ${colours.size} colours on the page`);
const keep = process.argv.indexOf('--keep');
if (keep > 0) copyFileSync(join(tmp, 'index.png'), process.argv[keep + 1]);
rmSync(tmp, { recursive: true, force: true });
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`check-preview-page: ${imgs.length} scene pictures drawn by ${chrome}, none empty`);
