// The licences this repository publishes (KR1 item 6, review 2026-11-15 findings 2 and 7). House rule: our code MIT, our
// own data CC0, imported data keeps its licence; never non-commercial (NC), no-derivatives (ND), research-only or
// unknown. A header's `# license:` is an SPDX id or an expression of ids joined by AND; every id must match the
// allowlist, or the validator fails. Share-alike licences (CC BY-SA, ODbL, CDLA-Sharing) are allowed only in files of
// their own licence, and a folder of data files (the TSV dictionaries) holds one licence.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readHeader } from './worlds.mjs';

export const ALLOWED = [
  ['CC0-1.0', /^CC0-1\.0$/], ['public domain', /^public-domain$/], ['MIT', /^MIT$/], ['BSD', /^BSD-[0-9]-Clause(-[A-Za-z]+)?$/],
  ['Apache', /^Apache-2\.0$/], ['MPL', /^MPL-2\.0$/], ['the WordNet licence', /^WordNet-3\.0$/],
  ['CC BY', /^CC-BY-[1-4]\.0$/], ['ODbL', /^ODbL-1\.0$/], ['CC BY-SA', /^CC-BY-SA-[1-4]\.0$/], ['CDLA', /^CDLA-(Permissive|Sharing)-[12]\.0$/],
  // the Unicode licence (CLDR, Noto emoji), permissive like MIT (reviewer's answer to Q74)
  ['Unicode', /^Unicode-3\.0$/],
];
export const SHARE_ALIKE = /^(CC-BY-SA-|ODbL-|CDLA-Sharing-)/;
export const ids = (expr) => String(expr ?? '').split(/\s+AND\s+/).map((x) => x.replace(/[()]/g, '').trim()).filter(Boolean);
// Why a licence expression is refused, or null.
export function refused(expr) {
  if (!expr || !String(expr).trim()) return 'no licence';
  if (/\sOR\s|\sWITH\s/.test(expr)) return `"${expr}": only AND expressions`;
  for (const id of ids(expr)) {
    if (/-NC|-ND|NonCommercial|NoDerivatives|research|unknown/i.test(id)) return `${id} is never published (non-commercial, no-derivatives, research-only or unknown)`;
    if (!ALLOWED.some(([, re]) => re.test(id))) return `${id} is not in the licence allowlist (tools/lib/licenses.mjs)`;
  }
  if (ids(expr).some((id) => SHARE_ALIKE.test(id)) && ids(expr).length > 1) return `"${expr}": a share-alike licence never shares a file with another licence`;
  return null;
}
export const isShareAlike = (expr) => ids(expr).some((id) => SHARE_ALIKE.test(id));

// The published data files that are not SOP (the TSV dictionaries of w.lang.en and w.lang.ro): one entry per folder,
// with its files and their headers. A folder `docs/worlds/<world>/<folder>/` with .tsv files.
export function dataFolders(root) {
  const out = [];
  for (const world of readdirSync(root).filter((d) => /^[kw]\./.test(d)).sort()) {
    const dir = join(root, world);
    if (!statSync(dir).isDirectory()) continue;
    for (const folder of readdirSync(dir).sort()) {
      const fdir = join(dir, folder);
      if (folder === 'shards' || !statSync(fdir).isDirectory()) continue;
      const files = readdirSync(fdir).filter((f) => f.endsWith('.tsv')).sort();
      if (!files.length) continue;
      out.push({ world, id: `${world}/${folder}`, path: relative(join(root, '..', '..'), fdir).split('\\').join('/'), files: files.map((f) => {
        const text = readFileSync(join(fdir, f), 'utf8');
        return { name: f, bytes: Buffer.byteLength(text), header: readHeader(text) };
      }) });
    }
  }
  return out;
}
// The problems of the data folders: a file without a licence or a source, a licence refused, two licences in a folder.
export function dataFolderErrors(root) {
  const errors = [];
  if (!existsSync(root)) return errors;
  for (const d of dataFolders(root)) {
    const lic = new Set();
    for (const f of d.files) {
      const l = f.header.license?.[0];
      if (!(f.header.source ?? f.header.sources)) errors.push(`${d.path}/${f.name}: the header has no "# source:" line`);
      const why = refused(l);
      if (why) errors.push(`${d.path}/${f.name}: ${why}`);
      if (l) lic.add(l);
    }
    if (lic.size > 1) errors.push(`${d.path}: ${[...lic].join(', ')} in one folder; a folder of data files holds one licence`);
  }
  return errors;
}
