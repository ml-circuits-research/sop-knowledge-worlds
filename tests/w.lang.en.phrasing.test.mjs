// Block "00:05" item 2: how each attribute of the catalog is said (w.lang.en.phrasing), read back by w.lang.en's own
// frames. Every key a composition may narrate (k.attributes.narration narrate=yes) is realised from a real fact of the
// catalog with its template (its own, or its form's) and read by the frames of the set acts.state to the act change
// with the same thing, value and attribute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { frameReader, realiseEn, articleFor } from '../tools/lib/lang-en.mjs';
import { phrasingShard, middle, KEYS } from '../tools/lang-en-phrasing.mjs';

const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const v = (w, k) => (w.attrs[k] ?? []).map(tok);
const one = (w, k) => v(w, k)[0];
const shardsOf = (id) => { const d = join(WORLDS_DIR, id, 'shards'); return readdirSync(d).filter((f) => f.endsWith('.sop')).sort().map((f) => readFileSync(join(d, f), 'utf8')); };
const all = shardsOf('w.lang.en').flatMap((t) => parse(t));
const actions = shardsOf('k.actions').flatMap((t) => parse(t));
const narration = parse(readFileSync(join(WORLDS_DIR, 'k.attributes/shards/narration.sop'), 'utf8'));
const phrasings = all.filter((w) => w.type === 'w.lang.en.phrasing');
const toks = (s) => String(s).toLowerCase().replace(/[.?!,;:()]+/g, ' ').replace(/['\u2019]/g, '').trim().split(/\s+/).filter(Boolean); // as the reader
const dets = new Set(all.filter((w) => w.type === 'w.lang.en.det').map((d) => one(d, 'text')));
const norm = (s) => { const ws = toks(s); return (dets.has(ws[0]) ? ws.slice(1) : ws).join(' '); };
const keyWord = (key) => key.replace(/_about$/, '').split('_').join(' ');

// A world that takes statements: the frames with no needs and those of the set acts.state.
const read = frameReader(all, actions, { needs: (n) => n === undefined || n === 'state' });

// The template of a key of a type: its own (of the type, then of any type), else its form's; a state by polarity.
const templateFor = (type, key, form, polarity) => phrasings.find((p) => one(p, 'key') === key && one(p, 'of') === type && one(p, 'polarity') === polarity)
  ?? phrasings.find((p) => one(p, 'key') === key && !one(p, 'of') && one(p, 'polarity') === polarity)
  ?? phrasings.find((p) => one(p, 'form') === form && one(p, 'polarity') === polarity);

// The first fact of each narrated type and key, by a line scan of the world's shards (the thing named by the type's
// first id key).
function sampleFacts(rows) {
  const want = new Map();
  for (const r of rows) { const w = one(r, 'type').split('.').slice(0, 2).join('.'); if (!want.has(w)) want.set(w, new Set()); want.get(w).add(`${one(r, 'type')} ${one(r, 'key')}`); }
  const out = new Map();
  for (const [world, need] of want) {
    const schema = parse(readFileSync(join(WORLDS_DIR, world, 'schema.sop'), 'utf8'));
    const firstId = new Map();
    for (const s of schema) if (s.type === 'core.slot' && one(s, 'id') === 'true' && !firstId.has(one(s, 'of'))) firstId.set(one(s, 'of'), one(s, 'key'));
    if (!existsSync(join(WORLDS_DIR, world, 'shards'))) continue;
    for (const text of shardsOf(world)) {
      for (const line of text.split('\n')) {
        if (!line.startsWith('@')) continue;
        const type = line.split(' ')[1];
        if (![...need].some((x) => x.startsWith(`${type} `))) continue;
        const [w] = parse(line);
        for (const key of Object.keys(w.attrs)) {
          const id = `${type} ${key}`;
          const thing = one(w, firstId.get(type));
          if (need.has(id) && !out.has(id) && thing && String(thing).length > 2) { out.set(id, { thing: one(w, firstId.get(type)), values: v(w, key) }); need.delete(id); }
        }
      }
      if (!need.size) break;
    }
  }
  return out;
}

test('phrasing: the shard is what the tool writes; every template names a frame of its set and slots it lists', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en/shards/templates-phrasing.sop'), 'utf8'), phrasingShard());
  const frames = new Set(all.filter((w) => w.type === 'w.lang.en.frame').map((f) => one(f, 'name')));
  for (const p of phrasings) {
    assert.ok(frames.has(one(p, 'frame')), `${one(p, 'name')}: frame ${one(p, 'frame')}`);
    const slots = [...one(p, 'text').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((x) => x !== 'key');
    assert.deepEqual(slots.sort(), v(p, 'role').sort(), one(p, 'name'));
    assert.ok(one(p, 'form') || one(p, 'key'), `${one(p, 'name')}: a form or a key`);
  }
  // every form of k.attributes.narration has a template, a state both polarities
  for (const f of new Set(narration.map((r) => one(r, 'form')).filter(Boolean))) assert.ok(phrasings.some((p) => one(p, 'form') === f), f);
  for (const pol of ['yes', 'no']) assert.ok(phrasings.some((p) => one(p, 'form') === 'state' && one(p, 'polarity') === pol));
  // a key template names a key some k.* type narrates
  const narrated = new Set(narration.filter((r) => one(r, 'narrate') === 'yes').map((r) => one(r, 'key')));
  for (const [key] of KEYS) assert.ok(narrated.has(key), `${key} is narrated somewhere`);
});

test('phrasing: the reviewer\'s four families read back ("the capital of Chad is N\'Djamena", eats, colour, legs)', () => {
  const cases = [
    ['the capital of {thing} is {value}.', { thing: 'Chad', value: 'N\'Djamena' }, { thing: 'chad', attribute: 'capital', value: 'ndjamena' }, 'acts.state.of'],
    [templateFor('k.animals.animal', 'eats').attrs.text[0], { thing: 'a cow', value: 'grass' }, { thing: 'cow', attribute: 'eats', value: 'grass' }, 'acts.state.verb'],
    [templateFor('k.attributes.thing', 'colour').attrs.text[0], { thing: 'a banana', value: 'yellow' }, { thing: 'banana', value: 'yellow' }, 'acts.state.is'],
    [templateFor('k.animals.animal', 'legs', 'count').attrs.text[0], { thing: 'a hen', value: '2', key: 'legs' }, { thing: 'hen', value: '2', attribute: 'legs' }, 'acts.state.count'],
  ];
  for (const [text, fill, want, frame] of cases) {
    const s = realiseEn(all, tok(text), fill);
    const [best] = read(s);
    assert.equal(best?.frame, frame, `${s}: ${JSON.stringify(best)}`);
    assert.equal(best.act, 'change');
    const got = Object.fromEntries(Object.keys(want).map((k) => [k, norm(best.args[k])]));
    assert.deepEqual(got, want, s);
  }
});

test('phrasing: every narrated key, said from a real fact of the catalog, reads back to its thing, value and attribute', () => {
  const rows = narration.filter((r) => one(r, 'narrate') === 'yes');
  const facts = sampleFacts(rows);
  const verbKeys = new Map(); // a verb or phrase -> the keys whose templates say it
  for (const p of phrasings.filter((x) => one(x, 'key'))) {
    const t = one(p, 'text');
    const m = middle(t) ?? (t.match(/^\{thing\} (.+)\.$/) ?? [])[1];
    if (!m) continue;
    const item = m.replace(/^(is|are) /, '');
    if (!verbKeys.has(item)) verbKeys.set(item, new Set());
    verbKeys.get(item).add(one(p, 'key'));
  }
  const bad = [], said = [];
  for (const r of rows) {
    const type = one(r, 'type'), key = one(r, 'key'), form = one(r, 'form');
    const f = facts.get(`${type} ${key}`);
    if (!f) continue; // a key no fact has yet
    const value = form === 'state' ? null : String(f.values[0]);
    const polarity = form === 'state' ? (String(f.values[0]) === 'false' ? 'no' : 'yes') : undefined;
    const p = templateFor(type, key, form, polarity);
    assert.ok(p, `${type}.${key}: a template`);
    const proper = /^[A-Z0-9]/.test(f.thing);
    const thing = proper ? f.thing : `${articleFor(all, f.thing)} ${f.thing}`;
    const s = realiseEn(all, one(p, 'text'), { thing, value, key: keyWord(key) });
    const [best] = read(s);
    const why = [];
    if (!best) why.push('no frame');
    else {
      if (best.frame !== one(p, 'frame')) why.push(`frame ${best.frame}, not ${one(p, 'frame')}`);
      if (best.act !== 'change') why.push(`act ${best.act}`);
      if (norm(best.args.thing) !== norm(thing)) why.push(`thing "${best.args.thing}"`);
      if (value !== null && norm(best.args.value ?? '') !== norm(value)) why.push(`value "${best.args.value}"`);
      // a state: its word is the value ("Chad is landlocked") or in the verb or phrase ("Mercury has no rings")
      if (value === null && !toks(`${best.args.value ?? ''} ${best.args.attribute ?? ''}`).some((w) => toks(keyWord(key)).some((k) => w.startsWith(k.slice(0, 4))))) why.push(`state value "${best.args.value}"`);
      const a = best.args.attribute;
      if (best.frame === 'acts.state.of' || best.frame === 'acts.state.count') {
        const word = one(p, 'text').match(/^the ([a-z ]+) of \{thing\}/)?.[1] ?? one(p, 'text').match(/\{value\} ([a-z ]+)\.$/)?.[1];
        const wantWord = word === '{key}' || !word ? keyWord(key) : word;
        if (norm(a) !== norm(wantWord === '{key}' ? keyWord(key) : wantWord)) why.push(`attribute "${a}"`);
      } else if (a !== undefined && !(verbKeys.get(a)?.has(key))) why.push(`attribute "${a}" says ${[...(verbKeys.get(a) ?? [])]}`);
    }
    if (why.length) bad.push(`${type}.${key}: "${s}" ${why.join('; ')}`);
    said.push(s);
  }
  assert.deepEqual(bad, []);
  console.log(`# ${said.length} narrated keys said and read back, e.g. ${said.filter((_, i) => i % 23 === 0).join(' | ')}`);
  assert.ok(said.length >= 150, `${said.length} keys said`);
});
