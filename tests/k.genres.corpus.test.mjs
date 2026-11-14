// k.genres checked against 2,000 arXiv abstracts (CC0 metadata, fetched by PSys2's machine into
// data/external/arxiv-metadata; read in place, nothing copied here). The abstract of a scientific article makes
// Hyland's moves in the order k.genres gives them (introduction, purpose, method, product, conclusion). Measured by
// surface cues per sentence (own choice; English; no parser): how many abstracts make each move, and whether purpose
// comes before product and product before conclusion where both are there. Also the register: the share of
// abstracts that speak as "we" (first plural, the register's person) and the sentence length against the register's
// range. Skipped when the corpus is not on this machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';

const FILE = process.env.ARXIV_ABSTRACTS ?? '/tmp/wt2/data/external/arxiv-metadata/abstracts-2000.jsonl';
const have = existsSync(FILE);
export const CUES = {
  'introduce topic': /\b(is (a|an|one of)|are (widely|increasingly|commonly)|has (become|been|attracted)|plays? an? (important|key|central) role|recent(ly)? (years|advances|work))\b/i,
  'state purpose': /\b(in this (paper|work|article|study|note)|this (paper|work|article|study|note) (proposes|presents|introduces|studies|investigates|considers)|we (propose|present|introduce|study|investigate|consider|develop|aim))\b/i,
  'describe method': /\b(we (use|apply|employ|combine|train|derive|construct|design|model|analy[sz]e|simulate|compute)|using (a|an|the)|based on|by (using|combining|means of))\b/i,
  'report result': /\b(we (show|find|prove|demonstrate|obtain|observe|establish)|results? (show|indicate|suggest|demonstrate)|outperforms?|achiev(es|ed|ing)|improv(es|ed|ement))\b/i,
  conclude: /\b(these (results|findings)|this (suggests|shows|opens|provides)|our (results|findings) (suggest|indicate|show|highlight|provide)|implications?|in conclusion|we conclude)\b/i,
};
const sentences = (t) => t.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => s.length > 2);

test('k.genres against 2,000 arXiv abstracts: the abstract\'s moves occur in the order k.genres gives them; the register', { skip: !have && `no corpus at ${FILE}` }, () => {
  const rows = readFileSync(FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const order = ['introduce topic', 'state purpose', 'describe method', 'report result', 'conclude'];
  // The order of the abstract's steps in k.genres is the order measured here.
  const shard = readFileSync(join(WORLDS_DIR, 'k.genres', 'shards', 'scientific-article.sop'), 'utf8');
  const steps = [...shard.matchAll(/k\.genres\.step genre="scientific article" part=abstract n=(\d+) move=("[^"]+"|\S+)/g)].map((m) => [Number(m[1]), JSON.parse(m[2].startsWith('"') ? m[2] : `"${m[2]}"`)]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  assert.deepEqual(steps, order);
  const has = Object.fromEntries(order.map((m) => [m, 0]));
  const pairs = { 'state purpose<report result': [0, 0], 'report result<conclude': [0, 0], 'introduce topic<state purpose': [0, 0] };
  let we = 0, words = 0, nsent = 0, inRange = 0;
  for (const r of rows) {
    const ss = sentences(r.abstract);
    const first = {};
    ss.forEach((s, i) => { for (const m of order) if (first[m] === undefined && CUES[m].test(s)) first[m] = i; });
    for (const m of order) if (first[m] !== undefined) has[m] += 1;
    for (const p of Object.keys(pairs)) { const [a, b] = p.split('<'); if (first[a] !== undefined && first[b] !== undefined) { pairs[p][1] += 1; if (first[a] <= first[b]) pairs[p][0] += 1; } }
    if (/\b(we|our)\b/i.test(r.abstract)) we += 1;
    for (const s of ss) { const n = s.split(/\s+/).length; words += n; nsent += 1; if (n >= 12 && n <= 32) inRange += 1; }
  }
  const mean = words / nsent;
  console.log(`k.genres corpus (${rows.length} abstracts): moves ${JSON.stringify(has)}; in order ${JSON.stringify(pairs)}; "we" in ${we}; sentences ${nsent}, mean ${mean.toFixed(1)} words, ${inRange} within the scientific register's 12-32`);
  assert.equal(rows.length, 2000);
  // Purpose before product and product before conclusion in more than four in five; the cue of "introduce topic"
  // is weak (it also matches background later in an abstract), so its pair is held to two in three.
  for (const [p, [ok, n]] of Object.entries(pairs)) assert.ok(n > 100 && ok / n > (p.startsWith('introduce') ? 0.65 : 0.8), `${p}: ${ok}/${n}`);
  assert.ok(we / rows.length > 0.5, `"we" in ${we}`);
  assert.ok(mean >= 12 && mean <= 32 && inRange / nsent > 0.6, `mean ${mean}, ${inRange}/${nsent}`);
});
