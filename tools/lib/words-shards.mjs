// The English words of a world (owner's decision 2026-11-15 08:10, reviewer block 20:15; it reverses Q78 (1)): the
// `core.word` facts that say a world's types, keys and values in English are stored beside the world, in its own shard
// `<world>/shards/words.sop` (ids `<world>.word.…`), apart from its schema. w.lang.en keeps grammar, morphology,
// frames and templates, not the vocabulary of other worlds. Another language keeps a world's words in its language
// world (`w.lang.ro/shards/words-<world>.sop`): Romanian stays out of the domain worlds. tools/build-catalog.mjs reads
// a world's words shard as its own words (vocab.json the same as when they were in the schema), tools/key-words.mjs
// writes the rule block there.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './worlds.mjs';

export const WORDS_SHARD = 'words.sop';
export const wordsShardPath = (world, root = WORLDS_DIR) => join(root, world, 'shards', WORDS_SHARD);
export const hasWordsShard = (world, root = WORLDS_DIR) => existsSync(wordsShardPath(world, root));
/** The world whose words a shard id says, or null: `k.feelings/shards/words` (English, beside the world) and
 *  `w.lang.ro/shards/words-w.calendar` (another language's words of a world) -> the world. */
export function worldOfWordsShard(shardId) {
  const m = /^([kw]\.[^/]+)\/shards\/words(\.sop)?$/.exec(shardId) ?? /^w\.lang\.[a-z]+\/shards\/words-(.+?)(\.sop)?$/.exec(shardId);
  return m ? m[1] : null;
}
/** True when the shard holds a world's English words beside the world. */
export const isOwnWordsShard = (shardId, world) => worldOfWordsShard(shardId) === world && shardId.startsWith(`${world}/`);
