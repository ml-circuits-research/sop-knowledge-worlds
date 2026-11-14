// Currencies (reviewer block 2026-11-15 03:20, item 3; PSys2 Q15: "I have 14 lei" came back from translation as
// "14 she", "14 rents", "14 slates": the currency word was no typed value a checker could keep).
//   node tools/import/currencies.mjs     writes docs/worlds/k.units/shards/currencies.sop (CLDR) and
//                                        docs/worlds/k.units/shards/currency-words.sop (hand-core)
// From Unicode CLDR 48 (sources/cldr/raw/currencies.json: English names, plural names and symbols;
// currencyData.json: digits after the point and which regions use which currency since when): every currency that
// is legal tender in some region today (no end date, not marked non-tender): code, name and plural name (the
// count-one and count-other forms), the everyday unit (the last word of the name: dollar, leu; plural lei), the
// symbol (where it is not the code), the narrow symbol (where it differs), the decimals (2 unless CLDR says
// otherwise), the countries (regions by their two-letter code, named as k.geo names them).
// By hand (hand-core 1, CC0-1.0, its own shard): the minor units of the common currencies (cent, penny/pence, ban/bani)
// and the everyday words: slang (buck, quid, greenback), the symbols as words, and the usual reading of a unit word
// alone (dollar: the US dollar; pound: the pound sterling; leu and lei: the Romanian leu).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, WORLDS_DIR } from '../lib/worlds.mjs';
import { wire, header, seg, byText } from './lib.mjs';

export const SOURCE = 'cldr 48';
const RAW = join(REPO, 'sources/cldr/raw');
export const RAW_FILES = ['currencies.json', 'currencyData.json'].map((f) => join(RAW, f));

// The minor unit of a currency, where it has one people name: [codes, minor, minor plural].
export const MINOR = [
  [['USD', 'CAD', 'AUD', 'NZD', 'HKD', 'SGD', 'EUR', 'ZAR', 'JMD', 'TTD', 'BBD', 'BSD', 'BZD', 'XCD', 'FJD', 'LRD', 'NAD', 'SRD', 'GYD', 'KYD', 'BMD'], 'cent', 'cents'],
  [['GBP'], 'penny', 'pence'], [['RON', 'MDL'], 'ban', 'bani'], [['CHF'], 'centime', 'centimes'], [['MXN', 'ARS', 'CLP', 'COP'], 'centavo', 'centavos'],
  [['BRL'], 'centavo', 'centavos'], [['RUB'], 'kopek', 'kopeks'], [['UAH'], 'kopiyka', 'kopiyky'], [['INR'], 'paisa', 'paise'], [['PLN'], 'grosz', 'groszy'],
  [['CZK'], 'haler', 'haleru'], [['SEK', 'NOK', 'DKK'], 'öre', 'öre'], [['TRY'], 'kuruş', 'kuruş'], [['CNY'], 'fen', 'fen'], [['ILS'], 'agora', 'agorot'],
];
// The usual reading of a unit word said alone, and everyday names: [code, words].
export const WORDS = [
  ['USD', ['dollar', 'dollars', 'buck', 'bucks', 'greenback', 'greenbacks', 'US dollar', 'American dollar', 'American dollars', 'USD', '$', 'US$']],
  ['EUR', ['euro', 'euros', 'EUR', '€']],
  ['GBP', ['pound', 'pounds', 'pound sterling', 'pounds sterling', 'sterling', 'quid', 'GBP', '£', 'British pound']],
  ['RON', ['leu', 'lei', 'RON', 'Romanian leu', 'Romanian lei']],
  ['JPY', ['yen', 'JPY', '¥']], ['CNY', ['yuan', 'renminbi', 'RMB', 'CNY']], ['CHF', ['franc', 'francs', 'Swiss franc', 'Swiss francs', 'CHF']],
  ['INR', ['rupee', 'rupees', 'INR', '₹']], ['RUB', ['ruble', 'rubles', 'rouble', 'roubles', 'RUB', '₽']], ['MXN', ['peso', 'pesos', 'MXN']],
  ['KRW', ['won', 'KRW', '₩']], ['ZAR', ['rand', 'ZAR']], ['BRL', ['real', 'reais', 'BRL', 'R$']], ['TRY', ['lira', 'liras', 'TRY', '₺']],
  ['ILS', ['shekel', 'shekels', 'ILS', '₪']], ['PLN', ['zloty', 'zlotys', 'PLN']], ['HUF', ['forint', 'forints', 'HUF']], ['SEK', ['krona', 'kronor', 'SEK']],
  ['CAD', ['loonie', 'loonies', 'Canadian dollar', 'CAD', 'C$']], ['AUD', ['Aussie dollar', 'AUD', 'A$']], ['MDL', ['Moldovan leu', 'Moldovan lei', 'MDL']],
];

// k.geo's country names by their two-letter code.
function countryNames() {
  const out = new Map();
  const dir = join(WORLDS_DIR, 'k.geo', 'shards');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sop')).sort()) for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    const m = line.match(/^@\S+ k\.geo\.country name=("[^"]*"|\S+).* code2=(\S+)/);
    if (m) out.set(m[2], m[1].startsWith('"') ? JSON.parse(m[1]) : m[1]);
  }
  return out;
}

export function readCurrencies({ names = JSON.parse(readFileSync(RAW_FILES[0], 'utf8')), data = JSON.parse(readFileSync(RAW_FILES[1], 'utf8')), countries = countryNames() } = {}) {
  const cur = names.main.en.numbers.currencies, d = data.supplemental.currencyData;
  const regions = new Map();
  for (const [region, list] of Object.entries(d.region)) for (const e of list) for (const [code, a] of Object.entries(e)) {
    if ('_to' in a || a._tender === 'false') continue;
    if (!regions.has(code)) regions.set(code, new Set());
    regions.get(code).add(region);
  }
  const out = [];
  for (const code of [...regions.keys()].sort(byText)) {
    const c = cur[code];
    if (!c) continue;
    const one = c['displayName-count-one'] ?? c.displayName, other = c['displayName-count-other'];
    // the unit is a common noun (CLDR writes "Afghani", "Turkish Lira" as names)
    const unit = one.split(' ').pop().toLowerCase(), unitPlural = other?.split(' ').pop().toLowerCase();
    const symbol = c.symbol && c.symbol !== code ? c.symbol : undefined;
    const narrow = c['symbol-alt-narrow'] && c['symbol-alt-narrow'] !== symbol && c['symbol-alt-narrow'] !== code ? c['symbol-alt-narrow'] : undefined;
    const decimals = Number(d.fractions[code]?._digits ?? d.fractions.DEFAULT._digits);
    const country = [...regions.get(code)].map((r) => countries.get(r)).filter(Boolean).sort(byText);
    out.push({ code, name: one, name_plural: other, unit, unit_plural: unitPlural, symbol, narrow, decimals, country });
  }
  return out;
}

export function currencyShards(list = readCurrencies()) {
  const lines = list.map((c) => wire(`k.units.currency.${c.code}`, 'k.units.currency', [['code', c.code], ['name', c.name], ['name_plural', c.name_plural], ['unit', c.unit], ['unit_plural', c.unit_plural],
    ['symbol', c.symbol], ['narrow', c.narrow], ['decimals', c.decimals], ...c.country.map((n) => ['country', n])], SOURCE));
  const codes = new Set(list.map((c) => c.code));
  for (const [cs] of MINOR) for (const c of cs) if (!codes.has(c)) throw new Error(`MINOR: ${c} is no current currency`);
  for (const [c] of WORDS) if (!codes.has(c)) throw new Error(`WORDS: ${c} is no current currency`);
  const minor = MINOR.flatMap(([cs, m, mp]) => cs.map((c) => [c, m, mp])).sort((a, b) => byText(a[0], b[0]))
    .map(([c, m, mp]) => wire(`k.units.currency.minor.${c}`, 'k.units.currency', [['code', c], ['minor', m], ['minor_plural', mp]], 'hand-core 1'));
  const words = WORDS.map(([c, ws]) => wire(`k.units.word.currency.${c}`, 'core.word', [...ws.map((w) => ['text', w]), ['means', c], ['of', 'k.units.currency.code']], 'hand-core 1'));
  return {
    'currencies.sop': `${header({ id: 'k.units/shards/currencies', about: `the ${list.length} currencies that are legal tender somewhere today, by ISO 4217 code, with their English names and plural names, the everyday unit (dollar, euro, leu/lei), symbol and narrow symbol, decimals and the countries that use them.`,
      sources: ['cldr 48 (Unicode CLDR 48.2.3: cldr-numbers-full/main/en/currencies.json, cldr-core/supplemental/currencyData.json)'], license: 'Unicode-3.0', script: 'tools/import/currencies.mjs' })}\n${lines.join('\n')}\n`,
    'currency-words.sop': `${header({ id: 'k.units/shards/currency-words', about: `the minor units of ${minor.length} currencies (cent, penny/pence, ban/bani ...) and the everyday words of ${words.length}: slang (buck, quid, greenback), symbols and codes as words, and the usual reading of a unit word said alone (dollar: the US dollar; pound: the pound sterling, not the pound of mass; leu, lei: the Romanian leu). The wires merge with those of the shard currencies.`,
      sources: ['hand-core 1 (written in this repository: tools/import/currencies.mjs MINOR and WORDS)'], license: 'CC0-1.0', script: 'tools/import/currencies.mjs' })}\n${minor.join('\n')}\n\n# Words.\n${words.join('\n')}\n`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFileSync } = await import('node:fs');
  const files = currencyShards();
  for (const [f, t] of Object.entries(files)) writeFileSync(join(WORLDS_DIR, 'k.units', 'shards', f), t);
  console.log(Object.entries(files).map(([f, t]) => `${f}: ${t.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(t)} bytes`).join('\n'));
}
