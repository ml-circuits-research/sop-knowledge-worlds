// k.story checked against a corpus of short stories (reviewer 17:05+: TinyStories, 1,000 stories, CDLA-Sharing-1.0,
// fetched by PSys2's machine into data/external/tinystories; read in place, nothing of it is copied here). The
// measurement is coarse, by surface cues of each element in plain English (no parser): how many stories have a
// setting, a complication, an attempt, a helper and a resolution, and whether the cues come in the order k.story
// tells the elements (setting before complication before resolution). It checks the order and the frequency of the
// structure, not the content. Skipped when the corpus is not on this machine.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const FILE = process.env.TINYSTORIES ?? '/tmp/wt2/data/external/tinystories/stories-1000.jsonl';
const have = existsSync(FILE);
// Surface cues of the elements (own choice; English only, as the corpus is).
export const CUES = {
  setting: /\b(once upon a time|one day|there (was|were|lived)|lived in)\b/i,
  complication: /\b(but|suddenly|however|could not|couldn't|can't|cannot|was stuck|too (high|big|far|heavy))\b/i,
  attempt: /\b(tried|try|tries)\b/i,
  helper: /\b(helped|help|helps)\b/i,
  resolution: /\b(finally|at last|in the end|from then on|happily)\b/i,
};

test('k.story against 1,000 short stories: the elements occur, and in the order k.story tells them', { skip: !have && `no corpus at ${FILE}` }, () => {
  const stories = readFileSync(FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l).text);
  const has = Object.fromEntries(Object.keys(CUES).map((k) => [k, 0]));
  let sc = 0, scOrdered = 0, cr = 0, crOrdered = 0;
  for (const s of stories) {
    const at = Object.fromEntries(Object.entries(CUES).map(([k, r]) => [k, s.search(r)]));
    for (const k of Object.keys(CUES)) if (at[k] >= 0) has[k] += 1;
    if (at.setting >= 0 && at.complication >= 0) { sc += 1; if (at.setting < at.complication) scOrdered += 1; }
    if (at.complication >= 0 && at.resolution >= 0) { cr += 1; if (at.complication < at.resolution) crOrdered += 1; }
  }
  console.log(`k.story corpus (${stories.length} stories): ${JSON.stringify(has)}; setting before complication ${scOrdered}/${sc}, complication before resolution ${crOrdered}/${cr}`);
  assert.equal(stories.length, 1000);
  // Most stories have a setting and a complication; the order of the cues is k.story's in at least nine in ten.
  assert.ok(has.setting > 700 && has.complication > 600, JSON.stringify(has));
  assert.ok(scOrdered / sc > 0.9 && crOrdered / cr > 0.9, `${scOrdered}/${sc}, ${crOrdered}/${cr}`);
});
