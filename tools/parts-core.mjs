// k.parts.usual (reviewer's answer to Q30): the usual parts of common things in the plain words a person says (a dog
// has a head, legs, a tail; a kettle has a handle, a spout, a lid), for common things that WordNet gives no part.
// Labelled by a language model from the name of the thing (named=model): sources/hand-core/usual-parts.tsv.
//   node tools/parts-core.mjs      writes docs/worlds/k.parts/shards/usual.sop
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards, byText } from './import/lib.mjs';

const SRC = 'hand-core 1';
export const USUAL_TSV = join(REPO, 'sources', 'hand-core', 'usual-parts.tsv');
export const readUsual = () => readFileSync(USUAL_TSV, 'utf8').split('\n').filter((l) => l.trim()).slice(1).map((l) => { const [name, parts] = l.split('\t'); return { name, parts: parts.split(',').map((x) => x.trim()).filter(Boolean) }; });

export function usualShards() {
  const rows = readUsual().sort((a, b) => byText(a.name, b.name));
  const lines = rows.map((r) => wire(`k.parts.usual.${seg(r.name)}`, 'k.parts.usual', [['name', r.name], ...r.parts.map((p) => ['has', p]), ['named', 'model']], SRC));
  return { 'usual.sop': `${header({ id: 'k.parts/shards/usual', about: `the usual parts of ${rows.length} common things in plain words (a dog has a head, legs and a tail; a kettle a handle, a spout and a lid), for things WordNet gives no part.`,
    sources: ['hand-core 1 (labelled by a language model, named=model: sources/hand-core/usual-parts.tsv)'], license: 'CC0-1.0', script: 'tools/parts-core.mjs' })}\n${lines.join('\n')}\n` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.parts', 'shards'), usualShards(), 'usual');
  console.log(`${readUsual().length} things`);
}
