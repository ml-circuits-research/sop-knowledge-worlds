// k.units.currency (block 03:20 item 3): the currencies of CLDR 48 and the everyday words (tools/import/currencies.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR, scanWorlds, factsOf } from '../tools/lib/worlds.mjs';
import { currencyShards, RAW_FILES } from '../tools/import/currencies.mjs';

const worlds = scanWorlds();
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const wires = factsOf('k.units', 'k.units.currency', worlds);
const byCode = new Map();
for (const w of wires) { const c = tok(w.attrs.code[0]); byCode.set(c, { ...(byCode.get(c) ?? {}), ...Object.fromEntries(Object.entries(w.attrs).map(([k, v]) => [k, v.map(tok)])) }); }

test('the shards are what tools/import/currencies.mjs gives from the raw CLDR files', { skip: !RAW_FILES.every(existsSync) && 'raw files not downloaded' }, () => {
  for (const [name, text] of Object.entries(currencyShards())) assert.equal(readFileSync(join(WORLDS_DIR, 'k.units', 'shards', name), 'utf8'), text, name);
});

test('the common currencies with their symbols, units, plural units and minor units; every currency used by a country', () => {
  assert.ok(byCode.size >= 150, `${byCode.size}`);
  const has = (code, key, value) => assert.ok(byCode.get(code)?.[key]?.includes(value), `${code} ${key}: ${byCode.get(code)?.[key]}`);
  has('USD', 'symbol', '$'); has('USD', 'unit', 'dollar'); has('USD', 'minor', 'cent');
  has('EUR', 'symbol', '€'); has('EUR', 'unit', 'euro'); has('EUR', 'unit_plural', 'euros');
  has('GBP', 'symbol', '£'); has('GBP', 'unit', 'pound'); has('GBP', 'minor_plural', 'pence');
  has('RON', 'unit', 'leu'); has('RON', 'unit_plural', 'lei'); has('RON', 'minor_plural', 'bani'); has('RON', 'country', 'Romania');
  has('JPY', 'decimals', '0');
  for (const [c, f] of byCode) assert.ok(f.country?.length, c);
  // every minor unit is on a currency the CLDR shard has (the hand wires merge, never stand alone)
  for (const [c, f] of byCode) if (f.minor) assert.ok(f.name, c);
});

test('the everyday words: slang, symbols, and the usual reading of a unit said alone', () => {
  const words = factsOf('k.units', 'core.word', worlds).filter((w) => tok(w.attrs.of?.[0]) === 'k.units.currency.code');
  const meaning = (text) => words.filter((w) => w.attrs.text.map(tok).includes(text)).map((w) => tok(w.attrs.means[0]));
  for (const [t, c] of [['buck', 'USD'], ['bucks', 'USD'], ['dollar', 'USD'], ['$', 'USD'], ['quid', 'GBP'], ['pound', 'GBP'], ['£', 'GBP'], ['euro', 'EUR'], ['€', 'EUR'], ['lei', 'RON'], ['yen', 'JPY']])
    assert.deepEqual(meaning(t), [c], t);
  for (const w of words) assert.ok(byCode.has(tok(w.attrs.means[0])), w.id);
});
