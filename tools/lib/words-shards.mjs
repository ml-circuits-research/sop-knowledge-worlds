// The words of a world in its language world (Q78, reviewer 16:10; KR3): the `core.word` facts that say a world's types,
// keys and values in English live in w.lang.en's shard `words-<world>.sop`, one shard per world, owned by the language
// world; a second language adds `w.lang.<xx>/shards/words-<world>.sop` of the same shape. tools/build-catalog.mjs reads
// them as the world's own words (vocab.json unchanged by the move), tools/key-words.mjs writes the rule block there.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './worlds.mjs';

export const WORDS_LANG = 'w.lang.en';
export const wordsShardName = (world) => `words-${world}.sop`;
export const wordsShardPath = (world, lang = WORDS_LANG, root = WORLDS_DIR) => join(root, lang, 'shards', wordsShardName(world));
export const hasWordsShard = (world, lang = WORDS_LANG, root = WORLDS_DIR) => existsSync(wordsShardPath(world, lang, root));
/** The world whose words a shard id says (`w.lang.en/shards/words-k.feelings` -> k.feelings), or null. */
export function worldOfWordsShard(shardId) {
  const m = /^w\.lang\.[a-z]+\/shards\/words-(.+?)(\.sop)?$/.exec(shardId);
  return m ? m[1] : null;
}
